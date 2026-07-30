/**
 * lib/gateway-runner — runner de queries READ-ONLY contra um GATEWAY HTTP
 * (as Connections do tipo `API_GATEWAY`).
 *
 * É o irmão do `lib/pg-runner`: mesma responsabilidade, mesmo formato de saída
 * (`QueryResultShape`), transporte diferente. Onde o pg-runner abre um socket
 * no Postgres, aqui falamos HTTP com um serviço que já está do lado de dentro
 * da rede e devolve JSON. Isso permite ler bancos inalcançáveis (SQL Server
 * atrás de VPN, por exemplo) sem que a plataforma precise de rota para eles.
 *
 * Contrato esperado do gateway (o mesmo do gateway TRIBUTARIO_IPATINGA):
 *   GET  {base}/api/gateway/health     → { ok, database, engine, limits }
 *   GET  {base}/api/gateway/schema     → { database, tableCount, tables[] }
 *   POST {base}/api/gateway/query      → { ok, columns[], rows[], rowCount, ... }
 *   Autenticação: header `Authorization: Bearer <token>`.
 *
 * Guardrails (defesa em profundidade — o gateway TAMBÉM valida do lado dele):
 *   1. SQL guard local (o mesmo do pg-runner): só SELECT/WITH, statement único.
 *      Falha cedo, sem gastar uma requisição de rede.
 *   2. Interpolação de parâmetros com tipos RESTRITOS e escape estrito
 *      (`interpolateParams`) — o gateway não aceita bind de parâmetros.
 *   3. Guard reaplicado DEPOIS da interpolação: um valor que tentasse fechar a
 *      string e emendar comando não passa.
 *   4. Row cap com o mesmo teto do pg-runner (`resolveMaxRows`).
 *   5. Timeout por requisição (AbortController) — nada pendura o worker.
 *   6. O token nunca é logado nem ecoado em mensagem de erro.
 */
import { env } from '../env';
import { assertReadOnlyQuery } from '../pg-runner/sql-guard';
import { resolveMaxRows, type QueryColumn, type QueryResultShape } from '../pg-runner';

/** Caminhos do contrato do gateway. */
const PATHS = {
  health: '/api/gateway/health',
  databases: '/api/gateway/databases',
  schema: '/api/gateway/schema',
  query: '/api/gateway/query',
} as const;

/** Configuração de uma conexão de gateway (token JÁ decifrado). */
export interface GatewayConnection {
  /** id da Connection — só para mensagens/telemetria. */
  id?: string;
  /** Base URL sem barra final (ex.: `https://gw.exemplo.com`). */
  baseUrl: string;
  /** Token Bearer em claro (decifrado). NUNCA é logado. */
  token: string;
  /** Rótulo do banco, quando conhecido (informativo). */
  database?: string;
}

export interface GatewayRequestOptions {
  /** Valores posicionais `$1..$n` (interpolados — o gateway não faz bind). */
  params?: unknown[];
  /** Sobrescreve o row cap (default: env.PG_RUNNER_MAX_ROWS). */
  maxRows?: number;
  /** Sobrescreve o timeout da requisição em ms. */
  timeoutMs?: number;
}

/** Erro de execução do gateway (mensagem sanitizada — sem segredos). */
export class GatewayRunnerError extends Error {
  /** `code` do gateway (WRITE_BLOCKED, DB_TIMEOUT, EXEC_ERROR...) ou local. */
  code?: string;
  /** Status HTTP, quando a falha veio de uma resposta. */
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'GatewayRunnerError';
    this.code = code;
    this.status = status;
  }
}

/** Health do gateway (o que ele diz sobre si mesmo). */
export interface GatewayHealth {
  ok: boolean;
  database: string | null;
  engine: string | null;
  limits: { maxRows?: number; hardMaxRows?: number; timeoutMs?: number } | null;
}

/** Uma tabela do schema retornado pelo gateway. */
export interface GatewaySchemaTable {
  name: string;
  schema: string;
  columns: { name: string; type: string }[];
}

export interface GatewaySchemaPayload {
  database: string | null;
  tableCount: number;
  columnCount: number;
  tables: GatewaySchemaTable[];
}

/* -------------------------------------------------------------------------- */
/* Normalização / helpers                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Normaliza a base URL: tira barras finais e recusa o que não for http(s).
 *
 * Recusar `file:`/`ftp:` aqui não é preciosismo: a base URL é digitada por um
 * humano no cadastro e vira destino de requisição do servidor.
 */
export function normalizeBaseUrl(raw: string): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) {
    throw new GatewayRunnerError('baseUrl is required', 'INVALID_BASE_URL');
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new GatewayRunnerError(`invalid baseUrl: ${trimmed}`, 'INVALID_BASE_URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new GatewayRunnerError(
      `baseUrl must use http or https (got ${url.protocol})`,
      'INVALID_BASE_URL'
    );
  }
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

/**
 * Remove o token de qualquer texto antes de ele virar mensagem de erro.
 *
 * O gateway pode ecoar o header numa mensagem de diagnóstico, e essa mensagem
 * sobe até a UI e os logs. Mesma precaução do `sanitizeError` do pg-runner.
 */
function redact(text: string, token: string): string {
  if (!token) return text;
  return text.split(token).join('***');
}

/**
 * Escapa UM valor para embutir no SQL.
 *
 * O gateway aceita apenas `{ sql, maxRows }` — não há bind de parâmetros no
 * outro lado. Como os blocos de dashboard usam `$1..$n` (filtros), alguém
 * precisa fechar essa lacuna, e fazê-lo com tipos restritos é o que mantém a
 * ponte segura: número/boolean/data viram literais sem aspas ou com formato
 * fixo, string é escapada dobrando aspas simples, e QUALQUER outra coisa
 * (objeto, array, função) é recusada em vez de virar `[object Object]` no meio
 * de uma consulta.
 */
export function escapeSqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new GatewayRunnerError(
        'non-finite number cannot be used as a query parameter',
        'INVALID_PARAM'
      );
    }
    return String(value);
  }

  if (typeof value === 'bigint') return value.toString();

  // 1/0 em vez de TRUE/FALSE: o gateway pode estar na frente de um SQL Server,
  // que não tem tipo booleano literal.
  if (typeof value === 'boolean') return value ? '1' : '0';

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new GatewayRunnerError(
        'invalid Date cannot be used as a query parameter',
        'INVALID_PARAM'
      );
    }
    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }

  if (typeof value === 'string') {
    // NUL byte trunca a string em vários drivers — porta clássica de bypass.
    if (value.includes('\0')) {
      throw new GatewayRunnerError(
        'string parameter cannot contain NUL bytes',
        'INVALID_PARAM'
      );
    }
    return `'${value.split("'").join("''")}'`;
  }

  throw new GatewayRunnerError(
    `unsupported parameter type: ${typeof value}. Use string, number, boolean, Date or null.`,
    'INVALID_PARAM'
  );
}

/**
 * Substitui `$1..$n` pelos valores já escapados.
 *
 * Ignora ocorrências dentro de literais de string (`'... $1 ...'`) — lá `$1` é
 * texto, não placeholder. Um índice sem valor correspondente é erro explícito,
 * nunca substituição silenciosa por NULL: melhor falhar do que rodar uma
 * consulta com filtro que o autor não escreveu.
 */
export function interpolateParams(sql: string, params: unknown[] = []): string {
  if (params.length === 0 && !/\$\d+/.test(sql)) return sql;

  let out = '';
  let i = 0;
  let inString = false;

  while (i < sql.length) {
    const char = sql[i];

    if (inString) {
      out += char;
      if (char === "'") {
        // '' é aspa escapada, não fim de string.
        if (sql[i + 1] === "'") {
          out += "'";
          i += 2;
          continue;
        }
        inString = false;
      }
      i += 1;
      continue;
    }

    if (char === "'") {
      inString = true;
      out += char;
      i += 1;
      continue;
    }

    if (char === '$' && /\d/.test(sql[i + 1] ?? '')) {
      let j = i + 1;
      while (j < sql.length && /\d/.test(sql[j])) j += 1;
      const index = Number(sql.slice(i + 1, j));
      if (index < 1 || index > params.length) {
        throw new GatewayRunnerError(
          `query references $${index} but only ${params.length} parameter(s) were provided`,
          'INVALID_PARAM'
        );
      }
      out += escapeSqlLiteral(params[index - 1]);
      i = j;
      continue;
    }

    out += char;
    i += 1;
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/* Transporte                                                                  */
/* -------------------------------------------------------------------------- */

interface GatewayErrorBody {
  error?: string;
  message?: string;
  detail?: string;
  code?: string;
  ok?: boolean;
}

/**
 * Requisição autenticada ao gateway, com timeout e erro normalizado.
 *
 * Toda falha vira `GatewayRunnerError` com a MENSAGEM DO GATEWAY quando ela
 * existe (`error` + `detail`): "Somente comandos de leitura são permitidos"
 * ajuda quem está na tela; "Request failed with status code 400", não.
 */
async function request<T>(
  conn: GatewayConnection,
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown; timeoutMs?: number }
): Promise<T> {
  const base = normalizeBaseUrl(conn.baseUrl);
  const url = `${base}${path}`;
  const timeoutMs = Math.max(1, Math.floor(init.timeoutMs ?? env.GATEWAY_TIMEOUT_MS));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${conn.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = controller.signal.aborted;
    const raw = err instanceof Error ? err.message : 'gateway request failed';
    throw new GatewayRunnerError(
      aborted
        ? `gateway did not respond within ${timeoutMs}ms (${base})`
        : `could not reach gateway at ${base}: ${redact(raw, conn.token)}`,
      aborted ? 'TIMEOUT' : 'UNREACHABLE'
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    // Um gateway atrás de proxy pode devolver HTML (502 do nginx, página de
    // login). Dizer isso é mais útil que estourar um SyntaxError de JSON.
    throw new GatewayRunnerError(
      `gateway returned a non-JSON response (HTTP ${response.status}) — check the base URL`,
      'BAD_RESPONSE',
      response.status
    );
  }

  const body = parsed as GatewayErrorBody;

  if (!response.ok || body?.ok === false) {
    if (response.status === 401 || response.status === 403) {
      throw new GatewayRunnerError(
        'gateway rejected the token (401/403) — check the configured token',
        'UNAUTHORIZED',
        response.status
      );
    }
    const detail = body?.detail ? ` (${body.detail})` : '';
    const message = body?.error ?? body?.message ?? `gateway request failed (HTTP ${response.status})`;
    throw new GatewayRunnerError(
      redact(`${message}${detail}`, conn.token),
      body?.code,
      response.status
    );
  }

  return parsed as T;
}

/* -------------------------------------------------------------------------- */
/* Operações                                                                   */
/* -------------------------------------------------------------------------- */

/** `GET /health` — ping do gateway (não toca o banco). */
export async function gatewayHealth(
  conn: GatewayConnection,
  opts: { timeoutMs?: number } = {}
): Promise<GatewayHealth> {
  const body = await request<{
    ok?: boolean;
    database?: string;
    engine?: string;
    limits?: GatewayHealth['limits'];
  }>(conn, PATHS.health, { method: 'GET', timeoutMs: opts.timeoutMs });

  return {
    ok: body.ok !== false,
    database: body.database ?? null,
    engine: body.engine ?? null,
    limits: body.limits ?? null,
  };
}

/** `GET /schema` — tabelas e colunas do banco exposto pelo gateway. */
export async function gatewaySchema(
  conn: GatewayConnection,
  opts: { timeoutMs?: number } = {}
): Promise<GatewaySchemaPayload> {
  const body = await request<{
    database?: string;
    tableCount?: number;
    columnCount?: number;
    tables?: GatewaySchemaTable[];
  }>(conn, PATHS.schema, { method: 'GET', timeoutMs: opts.timeoutMs });

  const tables = Array.isArray(body.tables) ? body.tables : [];
  return {
    database: body.database ?? null,
    tableCount: body.tableCount ?? tables.length,
    columnCount:
      body.columnCount ?? tables.reduce((sum, t) => sum + (t.columns?.length ?? 0), 0),
    tables,
  };
}

/** `GET /databases` — lista de bancos expostos (informativo). */
export async function gatewayDatabases(
  conn: GatewayConnection,
  opts: { timeoutMs?: number } = {}
): Promise<{ id: string; label: string; engine: string }[]> {
  const body = await request<{ databases?: { id: string; label: string; engine: string }[] }>(
    conn,
    PATHS.databases,
    { method: 'GET', timeoutMs: opts.timeoutMs }
  );
  return Array.isArray(body.databases) ? body.databases : [];
}

/** Forma de UM resultado de query, comum aos dois formatos do gateway. */
interface GatewayResultBlock {
  columns?: unknown;
  rows?: Record<string, unknown>[];
  rowCount?: number;
  truncated?: boolean;
  durationMs?: number;
  command?: string;
}

/**
 * Normaliza a resposta de `/query` — o gateway tem DOIS formatos.
 *
 *   (1) plano:      { ok, columns, rows, rowCount, truncated }
 *   (2) por statement: { ok, statementCount, results: [ { columns, rows, ... } ] }
 *
 * O formato (2) apareceu quando o gateway passou a suportar múltiplos
 * statements — e a mudança não veio com aviso. Lendo só o formato (1), TODA
 * query voltava com zero linhas: `body.rows` não existia mais, virava `[]`, e a
 * tela dizia "0 linhas" sem nenhum erro, para uma query que funcionava
 * perfeitamente no banco. Falha silenciosa é a pior espécie, então aqui a gente
 * aceita as duas formas e continua funcionando se ele voltar atrás.
 *
 * Com múltiplos resultados, vale o PRIMEIRO que traga linhas: o guard já
 * garante um único statement, então mais de um bloco só apareceria se o
 * gateway anexasse metadados — e o dado do usuário é o que tem `rows`.
 */
function extractResultBlock(body: unknown): GatewayResultBlock {
  const raw = (body ?? {}) as { results?: unknown } & GatewayResultBlock;

  if (Array.isArray(raw.results) && raw.results.length > 0) {
    const blocks = raw.results as GatewayResultBlock[];
    return blocks.find((b) => Array.isArray(b?.rows)) ?? blocks[0] ?? {};
  }

  return raw;
}

/** Colunas do gateway (`{name, type}`) → colunas do runner (`{name, dataTypeID}`). */
function toQueryColumns(raw: unknown): QueryColumn[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((col) => {
    const c = col as { name?: unknown; type?: unknown };
    return {
      name: String(c?.name ?? ''),
      // O gateway informa o tipo por NOME ("varchar"), não pelo OID do Postgres.
      // 0 = desconhecido; o nome vai em `dataType`, que é o que a UI mostra.
      dataTypeID: 0,
      ...(c?.type != null ? { dataType: String(c.type) } : {}),
    };
  });
}

/**
 * Executa uma query read-only via gateway. Mesma assinatura/saída do
 * `runQuery` do pg-runner, para os chamadores não precisarem saber a diferença.
 */
export async function runGatewayQuery(
  conn: GatewayConnection,
  sql: string,
  options: GatewayRequestOptions = {}
): Promise<QueryResultShape> {
  // 1) guard local ANTES de gastar rede (mensagem melhor e falha instantânea).
  assertReadOnlyQuery(sql);

  // 2) parâmetros interpolados com escape estrito (o gateway não faz bind).
  const finalSql = interpolateParams(sql, options.params ?? []);

  // 3) o guard de novo, sobre o SQL REAL que vai ser enviado: se algum valor
  //    tivesse conseguido emendar um segundo comando, ele morre aqui.
  assertReadOnlyQuery(finalSql);

  const maxRows = resolveMaxRows(options.maxRows);
  const start = Date.now();

  const body = await request<unknown>(conn, PATHS.query, {
    method: 'POST',
    body: { sql: finalSql, maxRows },
    timeoutMs: options.timeoutMs,
  });

  // O gateway responde em dois formatos possíveis (ver `extractResultBlock`).
  const result = extractResultBlock(body);
  const rows = Array.isArray(result.rows) ? result.rows : [];
  // Cinto e suspensório: se o gateway ignorar o maxRows, cortamos aqui.
  const capped = rows.length > maxRows ? rows.slice(0, maxRows) : rows;

  return {
    columns: toQueryColumns(result.columns),
    rows: capped,
    rowCount: capped.length,
    truncated: result.truncated === true || rows.length > maxRows,
    // O gateway mede o tempo do BANCO; medimos o tempo total (inclui a rede),
    // que é o que o usuário sente. Fallback para o nosso relógio.
    durationMs: Date.now() - start || (result.durationMs ?? 0),
  };
}

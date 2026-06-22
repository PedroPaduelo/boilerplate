/**
 * lib/pg-runner — runner de queries READ-ONLY contra Postgres EXTERNOS
 * (as Connections cadastradas pelos usuários).
 *
 * Guardrails (defesa em profundidade):
 *   1. SQL guard (sql-guard.ts): só SELECT/WITH, sem múltiplos statements, sem
 *      DDL/DML — validado ANTES de tocar o banco.
 *   2. Transação read-only: `BEGIN; SET TRANSACTION READ ONLY` (a query roda
 *      e a transação é desfeita com ROLLBACK — nada é persistido).
 *   3. `SET LOCAL statement_timeout` no lado do Postgres (limita o tempo da
 *      query no servidor remoto).
 *   4. Row cap: busca via cursor e PARA após `maxRows` linhas (não materializa
 *      result sets gigantes em memória).
 *   5. Params parametrizados (`$1, $2, ...`) — nunca concatenação de string.
 *   6. Pool pequeno por Connection, com idle timeout; segredos nunca são logados
 *      nem vazados em mensagens de erro.
 *
 * Saída: `{ columns, rows, rowCount, truncated, durationMs }`.
 */
import { Pool, type PoolConfig } from 'pg';
import Cursor from 'pg-cursor';
import { env } from '../env';
import { assertReadOnlyQuery } from './sql-guard';

export { assertReadOnlyQuery, SqlGuardError } from './sql-guard';

/**
 * Resolve o row cap EFETIVO de uma query.
 *
 * `env.PG_RUNNER_MAX_ROWS` é o TETO ABSOLUTO de segurança: o caller pode pedir
 * MENOS linhas, NUNCA MAIS. Mesmo que um schema de rota aceite valores altos
 * (ex.: connections aceita até 100000), o pg-runner — fonte única — aplica o
 * clamp superior contra o cap configurado no env.
 *
 * @param requested valor pedido pelo caller (`options.maxRows`); se ausente,
 *   usa o próprio cap do env.
 * @param cap teto de segurança (default `env.PG_RUNNER_MAX_ROWS`).
 */
export function resolveMaxRows(
  requested?: number,
  cap: number = env.PG_RUNNER_MAX_ROWS
): number {
  const safeCap = Math.max(1, Math.floor(cap));
  const desired = Math.max(1, Math.floor(requested ?? safeCap));
  return Math.min(safeCap, desired);
}

/** Configuração de conexão (credenciais JÁ decifradas via lib/crypto). */
export interface PgRunnerConnection {
  /** id da Connection — usado como chave de cache do pool (recomendado). */
  id?: string;
  host: string;
  port: number;
  database: string;
  user: string;
  /** senha em claro (decifrada). Nunca é logada. */
  password: string;
  /** habilita TLS explicitamente; tem prioridade sobre sslMode. */
  ssl?: boolean;
  /** sslMode no estilo libpq: 'disable' | 'require' | 'prefer' | ... */
  sslMode?: string;
}

export interface RunQueryOptions {
  /** valores para placeholders `$1..$n`. */
  params?: unknown[];
  /** sobrescreve o row cap (default: env.PG_RUNNER_MAX_ROWS). */
  maxRows?: number;
  /** sobrescreve o statement_timeout em ms (default: env.PG_RUNNER_STATEMENT_TIMEOUT_MS). */
  statementTimeoutMs?: number;
}

export interface QueryColumn {
  name: string;
  dataTypeID: number;
}

export interface QueryResultShape {
  columns: QueryColumn[];
  rows: Record<string, unknown>[];
  rowCount: number;
  /** true quando o resultado foi cortado pelo row cap. */
  truncated: boolean;
  durationMs: number;
}

/** Erro de execução do runner (mensagem sanitizada — sem segredos). */
export class PgRunnerError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'PgRunnerError';
    this.code = code;
  }
}

// --- pool cache por conexão -------------------------------------------------
const pools = new Map<string, Pool>();

function poolKey(c: PgRunnerConnection): string {
  return c.id ?? `${c.user}@${c.host}:${c.port}/${c.database}`;
}

function resolveSsl(c: PgRunnerConnection): PoolConfig['ssl'] {
  if (typeof c.ssl === 'boolean') {
    return c.ssl ? { rejectUnauthorized: false } : undefined;
  }
  const mode = (c.sslMode ?? '').toLowerCase();
  if (mode === '' || mode === 'disable') return undefined;
  // require/prefer/allow/verify-* → habilita TLS. Validação estrita de CA fica
  // para uma evolução futura (MVP aceita certificados self-signed).
  return { rejectUnauthorized: false };
}

function getPool(c: PgRunnerConnection): Pool {
  const key = poolKey(c);
  let pool = pools.get(key);
  if (!pool) {
    pool = new Pool({
      host: c.host,
      port: c.port,
      database: c.database,
      user: c.user,
      password: c.password,
      ssl: resolveSsl(c),
      max: env.PG_RUNNER_POOL_MAX,
      idleTimeoutMillis: env.PG_RUNNER_IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: env.PG_RUNNER_CONNECT_TIMEOUT_MS,
      allowExitOnIdle: true,
    });
    // erros de clientes ociosos não devem derrubar o processo nem vazar dados.
    pool.on('error', () => {});
    pools.set(key, pool);
  }
  return pool;
}

/** Fecha todos os pools em cache (use em shutdown e em testes). */
export async function closeAllPools(): Promise<void> {
  const all = [...pools.values()];
  pools.clear();
  await Promise.all(all.map((p) => p.end().catch(() => {})));
}

// --- helpers ----------------------------------------------------------------
function sanitizeError(err: unknown, password: string): PgRunnerError {
  const e = err as { message?: string; code?: string } | undefined;
  let msg = e?.message ?? 'query execution failed';
  if (password && msg.includes(password)) {
    msg = msg.split(password).join('***');
  }
  return new PgRunnerError(msg, e?.code);
}

type CursorLike = {
  read: (
    n: number,
    cb: (
      err: Error | null,
      rows: Record<string, unknown>[],
      result: { fields?: { name: string; dataTypeID: number }[] }
    ) => void
  ) => void;
  close: (cb?: (err?: Error) => void) => void;
};

function readCursor(
  cursor: CursorLike,
  n: number
): Promise<{
  rows: Record<string, unknown>[];
  fields: { name: string; dataTypeID: number }[];
}> {
  return new Promise((resolve, reject) => {
    cursor.read(n, (err, rows, result) => {
      if (err) return reject(err);
      resolve({ rows, fields: result?.fields ?? [] });
    });
  });
}

function closeCursor(cursor: CursorLike): Promise<void> {
  return new Promise((resolve) => {
    try {
      cursor.close(() => resolve());
    } catch {
      resolve();
    }
  });
}

/**
 * Executa uma query read-only contra o Postgres externo da `connection`.
 * Lança `SqlGuardError` se a query violar os guardrails de SQL (antes de
 * conectar) e `PgRunnerError` em falhas de conexão/execução.
 */
export async function runQuery(
  connection: PgRunnerConnection,
  sql: string,
  options: RunQueryOptions = {}
): Promise<QueryResultShape> {
  // 1) guardrail de SQL — falha cedo, sem tocar o banco.
  const safeSql = assertReadOnlyQuery(sql);

  const params = options.params ?? [];
  // row cap com CLAMP SUPERIOR: nunca excede env.PG_RUNNER_MAX_ROWS (teto de segurança).
  const maxRows = resolveMaxRows(options.maxRows);
  const stmtTimeout = Math.max(
    1,
    Math.floor(options.statementTimeoutMs ?? env.PG_RUNNER_STATEMENT_TIMEOUT_MS)
  );

  const pool = getPool(connection);
  const start = Date.now();

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    throw sanitizeError(err, connection.password);
  }

  try {
    // 2) transação read-only + 3) statement_timeout no servidor remoto
    await client.query('BEGIN');
    await client.query('SET TRANSACTION READ ONLY');
    await client.query(`SET LOCAL statement_timeout = ${stmtTimeout}`);

    // 4) row cap via cursor: lê no máximo maxRows+1 e para.
    const cursor = client.query(
      new Cursor(safeSql, params)
    ) as unknown as CursorLike;
    const { rows, fields } = await readCursor(cursor, maxRows + 1);
    await closeCursor(cursor);

    const truncated = rows.length > maxRows;
    const finalRows = truncated ? rows.slice(0, maxRows) : rows;

    await client.query('ROLLBACK');

    return {
      columns: fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })),
      rows: finalRows,
      rowCount: finalRows.length,
      truncated,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    throw sanitizeError(err, connection.password);
  } finally {
    client.release();
  }
}

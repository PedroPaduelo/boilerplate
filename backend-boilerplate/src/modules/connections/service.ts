/**
 * Regra de negócio do módulo `connections` (T-A).
 *
 * Reúne:
 *  - persistência (Prisma) do cadastro de Connection;
 *  - cifragem/decifragem da senha via `lib/crypto` (AES-256-GCM);
 *  - conectividade/introspecção/query read-only via `lib/pg-runner`;
 *  - cache Redis da introspecção de schema na chave `conn:{id}:schema`.
 *
 * A senha em claro só existe em memória, no momento de conectar ao Postgres
 * externo (decifrada). Em repouso vive cifrada em `passwordCipher`.
 */
import { Prisma, type Connection } from '@prisma/client';
import { decrypt, encrypt } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { runQuery, type PgRunnerConnection, type QueryResultShape } from '@/lib/pg-runner';
import {
  gatewayHealth,
  gatewaySchema,
  normalizeBaseUrl,
  type GatewayConnection,
} from '@/lib/gateway-runner';
import {
  runQuery as runAnyQuery,
  type RunnerConnection,
} from '@/lib/query-runner';
import { redisService } from '@/lib/redis';
import type { UserContext } from './rbac';
import type { CreateConnectionInput, UpdateConnectionInput } from './schema';

/** TTL do cache de introspecção de schema (segundos). */
const SCHEMA_CACHE_TTL_SECONDS = 300;
/** Row cap específico da introspecção (catálogos podem ter muitas colunas). */
const SCHEMA_INTROSPECT_MAX_ROWS = 100000;
/**
 * Teto de tabelas detalhadas por introspecção. Bancos enormes (ex.: ERPs com
 * milhares de tabelas) tornam o dump completo do schema inviável (payload de
 * dezenas de MB + colunas cortadas pelo row cap). Limitamos às primeiras N
 * tabelas (ordenadas por schema/nome) — com colunas/PK/FK/índices COMPLETOS —
 * e sinalizamos `truncated` + `totalTables`. Bancos normais (< N tabelas) saem
 * inteiros.
 */
const SCHEMA_MAX_TABLES = 1000;

/** Chave Redis do cache de introspecção de uma conexão. */
export function schemaCacheKey(connectionId: string): string {
  return `conn:${connectionId}:schema`;
}

/** Esta conexão fala HTTP com um gateway (em vez de TCP com o Postgres)? */
export function isGatewayConnection(conn: Connection): boolean {
  return conn.type === 'API_GATEWAY';
}

/** Monta o objeto de conexão do pg-runner a partir do registro (decifra a senha). */
export function toPgRunnerConnection(conn: Connection): PgRunnerConnection {
  return {
    id: conn.id,
    host: conn.host,
    port: conn.port,
    database: conn.database,
    user: conn.username,
    password: decrypt(conn.passwordCipher),
    sslMode: conn.sslMode,
  };
}

/** Monta o objeto do gateway-runner (decifra o TOKEN, guardado em passwordCipher). */
export function toGatewayConnection(conn: Connection): GatewayConnection {
  return {
    id: conn.id,
    // `baseUrl` é obrigatório para este tipo (validado no cadastro); o fallback
    // reconstrói a URL a partir do endereço para nunca produzir `undefined`.
    baseUrl: conn.baseUrl ?? `https://${conn.host}`,
    token: decrypt(conn.passwordCipher),
    database: conn.database,
  };
}

/**
 * Registro → objeto executável pelo `query-runner`, seja qual for o tipo.
 * Ponto ÚNICO de decisão: quem executa query não precisa perguntar o tipo.
 */
export function toRunnerConnection(conn: Connection): RunnerConnection {
  return isGatewayConnection(conn)
    ? { kind: 'gateway', ...toGatewayConnection(conn) }
    : toPgRunnerConnection(conn);
}

function normalizeOptions(
  options: Record<string, unknown> | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (options === undefined) return undefined;
  if (options === null) return Prisma.JsonNull;
  return options as Prisma.InputJsonValue;
}

/**
 * Campos de ENDEREÇO de uma conexão de gateway, derivados da base URL.
 *
 * O cadastro de gateway pede duas coisas (URL e token), mas o registro tem
 * colunas de endereço obrigatórias e — mais importante — a plataforma inteira
 * já sabe exibir/buscar/ordenar por `host`, `port` e `database`. Derivar em vez
 * de criar um caminho paralelo mantém listagem, busca e telas funcionando sem
 * que nenhuma delas precise saber que existe um segundo tipo de conexão.
 *
 * `database` fica VAZIO quando não informado: o gateway diz o nome do banco no
 * `/health`, e o primeiro teste preenche (ver `testConnection`). Chutar um
 * rótulo aqui seria inventar um dado que o próprio gateway entrega de graça.
 */
function gatewayAddressFields(baseUrl: string, database?: string | null) {
  const normalized = normalizeBaseUrl(baseUrl);
  const url = new URL(normalized);
  const isHttps = url.protocol === 'https:';
  return {
    baseUrl: normalized,
    host: url.hostname,
    port: url.port ? Number(url.port) : isHttps ? 443 : 80,
    database: (database ?? '').trim(),
    // Não há usuário no gateway — a identidade é o token. O valor fixo mantém
    // a coluna preenchida e deixa claro, em qualquer listagem, o que é aquilo.
    username: 'gateway',
    sslMode: isHttps ? 'require' : 'disable',
  };
}

export async function createConnection(
  ctx: UserContext,
  input: CreateConnectionInput
): Promise<Connection> {
  const isGateway = input.type === 'API_GATEWAY';

  // Gateway: endereço derivado da URL e SEGREDO = token. Postgres: como sempre.
  const target = isGateway
    ? gatewayAddressFields(input.baseUrl as string, input.database)
    : {
        baseUrl: null,
        host: input.host as string,
        port: input.port,
        database: input.database as string,
        username: input.username as string,
        sslMode: input.sslMode,
      };
  const secret = isGateway ? (input.token as string) : (input.password as string);

  return prisma.connection.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      ...target,
      passwordCipher: encrypt(secret),
      options: normalizeOptions(input.options),
      ownerId: ctx.userId,
      departmentId: input.departmentId ?? null,
      visibility: input.visibility,
      environment: input.environment,
      isActive: input.isActive,
    },
  });
}

export interface ListConnectionsParams {
  where: Record<string, unknown>;
  page: number;
  pageSize: number;
}

export async function listConnections({
  where,
  page,
  pageSize,
}: ListConnectionsParams): Promise<{ connections: Connection[]; total: number }> {
  const [connections, total] = await Promise.all([
    prisma.connection.findMany({
      where: where as Prisma.ConnectionWhereInput,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.connection.count({ where: where as Prisma.ConnectionWhereInput }),
  ]);
  return { connections, total };
}

export async function updateConnection(
  id: string,
  input: UpdateConnectionInput
): Promise<Connection> {
  const data: Prisma.ConnectionUncheckedUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description ?? null;
  if (input.host !== undefined) data.host = input.host;
  if (input.port !== undefined) data.port = input.port;
  if (input.database !== undefined) data.database = input.database;
  if (input.username !== undefined) data.username = input.username;
  if (input.password !== undefined) data.passwordCipher = encrypt(input.password);
  if (input.sslMode !== undefined) data.sslMode = input.sslMode;

  // Gateway: trocar a URL re-deriva o endereço (senão host/port ficariam
  // apontando para o gateway ANTIGO, e a lista mostraria um endereço que não
  // existe mais). O token segue o mesmo caminho da senha: só muda se enviado.
  if (input.baseUrl !== undefined) {
    const derived = gatewayAddressFields(input.baseUrl, input.database);
    data.baseUrl = derived.baseUrl;
    data.host = derived.host;
    data.port = derived.port;
    data.username = derived.username;
    data.sslMode = derived.sslMode;
    // `database` só é sobrescrito quando o usuário informou algo; em branco
    // preserva o rótulo que o gateway já tinha entregado no teste.
    if (derived.database) data.database = derived.database;
  }
  if (input.token !== undefined) data.passwordCipher = encrypt(input.token);
  if (input.options !== undefined) data.options = normalizeOptions(input.options);
  if (input.departmentId !== undefined) data.departmentId = input.departmentId ?? null;
  if (input.visibility !== undefined) data.visibility = input.visibility;
  if (input.environment !== undefined) data.environment = input.environment;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const updated = await prisma.connection.update({ where: { id }, data });

  // Mudou alvo/credencial → a introspecção em cache pode estar obsoleta.
  await invalidateSchemaCache(id);

  return updated;
}

export async function deleteConnection(id: string): Promise<void> {
  await prisma.connection.delete({ where: { id } });
  await invalidateSchemaCache(id);
}

export interface TestConnectionResult {
  ok: boolean;
  status: string;
  lastTestedAt: Date | null;
  message: string | null;
}

/**
 * Testa conectividade e atualiza `status` (`ok`/`error`) + `lastTestedAt`.
 *
 * Postgres: conecta e roda `SELECT 1`.
 * Gateway:  chama `/health`. Repare que health NÃO toca o banco — é de
 *   propósito: ele responde "o gateway está no ar e o token vale", que é o que
 *   um teste de conexão precisa dizer, e responde em milissegundos. Se o banco
 *   por trás estiver fora, quem acusa é a primeira query, com o código certo
 *   (`DB_TIMEOUT`), em vez de um teste de conexão que pendura 10s.
 *
 * O health também é quando o gateway se APRESENTA: ele informa o nome do banco
 * que expõe, e nós gravamos esse rótulo. Por isso o cadastro não precisa
 * perguntar "qual é o banco?" — a fonte da verdade é a própria fonte.
 */
export async function testConnection(conn: Connection): Promise<TestConnectionResult> {
  let ok = false;
  let status = 'error';
  let message: string | null = null;
  /** Rótulo do banco descoberto no health (só para gateway). */
  let discoveredDatabase: string | null = null;
  /** Motor informado pelo gateway (sqlserver/postgres/...). */
  let discoveredEngine: string | null = null;

  try {
    if (isGatewayConnection(conn)) {
      const health = await gatewayHealth(toGatewayConnection(conn), {
        timeoutMs: env.GATEWAY_HEALTH_TIMEOUT_MS,
      });
      if (!health.ok) throw new Error('gateway reported an unhealthy state');
      if (health.database && health.database !== conn.database) {
        discoveredDatabase = health.database;
      }
      // O motor por trás do gateway muda o DIALETO do SQL que o usuário vai
      // escrever (TOP vs LIMIT, [colchetes] vs "aspas"). Guardamos o que ele
      // informa para a tela parar de assumir Postgres.
      if (health.engine) discoveredEngine = health.engine;
    } else {
      await runQuery(toPgRunnerConnection(conn), 'SELECT 1', {
        maxRows: 1,
        statementTimeoutMs: 5000,
      });
    }
    ok = true;
    status = 'ok';
  } catch (err) {
    message = err instanceof Error ? err.message : 'connection test failed';
  }

  // `options` é o lugar dos metadados descobertos: preserva o que já estava lá
  // e só acrescenta o motor (o cadastro não pergunta isso a ninguém).
  const mergedOptions = discoveredEngine
    ? ({
        ...((conn.options as Record<string, unknown> | null) ?? {}),
        engine: discoveredEngine,
      } as Prisma.InputJsonValue)
    : undefined;

  const updated = await prisma.connection.update({
    where: { id: conn.id },
    data: {
      status,
      lastTestedAt: new Date(),
      ...(discoveredDatabase ? { database: discoveredDatabase } : {}),
      ...(mergedOptions ? { options: mergedOptions } : {}),
    },
  });

  return { ok, status, lastTestedAt: updated.lastTestedAt, message };
}

/** Referência (schema.tabela.coluna) de uma foreign key / coluna FK. */
export interface SchemaRef {
  schema: string;
  table: string;
  column: string;
}

export interface SchemaColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimary: boolean;
  isForeign: boolean;
  /** Alvo da FK quando `isForeign` (pareado pela posição na constraint). */
  references: SchemaRef | null;
  /** Comentário (COMMENT ON COLUMN) quando existir. */
  comment: string | null;
}

export interface SchemaIndex {
  name: string;
  columns: string[];
  unique: boolean;
  primary: boolean;
  /** Método de acesso (btree/hash/gin/gist/spgist/brin). */
  method: string;
}

export interface SchemaForeignKey {
  name: string;
  columns: string[];
  references: SchemaRef;
  onDelete: string | null;
  onUpdate: string | null;
}

export interface SchemaTable {
  schema: string;
  name: string;
  /** table | view | matview (relkind normalizado). */
  kind: 'table' | 'view' | 'matview';
  columns: SchemaColumn[];
  primaryKey: string[];
  indexes: SchemaIndex[];
  foreignKeys: SchemaForeignKey[];
  /** Estimativa de linhas (pg_class.reltuples); null quando desconhecido. */
  rowCount: number | null;
  /** Tamanho total da relação em bytes (pg_total_relation_size). */
  sizeBytes: number | null;
  /** Comentário (COMMENT ON TABLE) quando existir. */
  comment: string | null;
}

/** Metadados do banco como um todo. */
export interface SchemaDatabaseMeta {
  name: string | null;
  version: string | null;
  sizeBytes: number | null;
}

export interface SchemaPayload {
  connectionId: string;
  /** Nº de tabelas RETORNADAS (após o cap). */
  tableCount: number;
  /** Nº TOTAL de tabelas no banco (antes do cap). */
  totalTables: number;
  /** `true` quando `totalTables > tableCount` (cap aplicado). */
  truncated: boolean;
  fetchedAt: string;
  database: SchemaDatabaseMeta;
  tables: SchemaTable[];
}

/* ------------------------------------------------------------------ */
/* Queries de introspecção (read-only; passam pelo guard do pg-runner) */
/* ------------------------------------------------------------------ */

const Q_DBMETA = `
  SELECT version() AS db_version,
         current_database() AS db_name,
         pg_database_size(current_database()) AS db_bytes
`;

const Q_TABLES = `
  SELECT n.nspname AS schema,
         c.relname AS name,
         c.relkind AS kind,
         c.reltuples::bigint AS row_estimate,
         pg_total_relation_size(c.oid) AS total_bytes,
         obj_description(c.oid) AS table_descr
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p', 'v', 'm')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname NOT LIKE 'pg_toast%'
  ORDER BY n.nspname, c.relname
`;

/**
 * Queries de detalhe FILTRADAS pelas tabelas escolhidas (fase 2). `$1`/`$2` são
 * arrays alinhados de schema/nome das tabelas mantidas — o `unnest(... , ...)`
 * vira o conjunto de pares (schema, tabela) que restringe o resultado. Isso
 * garante colunas COMPLETAS para as tabelas retornadas, independente do tamanho
 * total do banco, e limita o payload.
 */
const Q_COLUMNS = `
  SELECT n.nspname AS schema,
         c.relname AS table_name,
         a.attname::text AS name,
         format_type(a.atttypid, a.atttypmod) AS data_type,
         NOT a.attnotnull AS nullable,
         pg_get_expr(ad.adbin, ad.adrelid) AS default_value,
         a.attnum AS attnum,
         col_description(c.oid, a.attnum) AS col_descr
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN unnest($1::text[], $2::text[]) AS kt(s_f, t_f)
    ON kt.s_f = n.nspname AND kt.t_f = c.relname
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
  LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
  ORDER BY n.nspname, c.relname, a.attnum
`;

/**
 * Valores possíveis de cada tipo ENUM do banco.
 *
 * Sem isto, a introspecção diz que a coluna é `message_direction` e para por
 * aí — o nome do tipo, não o que cabe dentro dele. O agente então adivinha:
 * numa conversa real ele escreveu `direction = 'inbound'` e o Postgres
 * respondeu `invalid input value for enum message_direction: "inbound"`,
 * porque os valores são `in` e `out`. Um passo perdido, um erro vermelho na
 * trilha do usuário, e uma consulta refeita — tudo por uma informação que o
 * banco tinha e não foi perguntada.
 *
 * É barato (uma consulta a `pg_enum`, tipos são poucos) e fecha uma classe
 * inteira de erro: o agente deixa de ter o que chutar.
 */
const Q_ENUMS = `
  SELECT t.typname AS type_name,
         array_agg(e.enumlabel::text ORDER BY e.enumsortorder) AS values
  FROM pg_type t
  JOIN pg_enum e ON e.enumtypid = t.oid
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  GROUP BY t.typname
`;

const Q_PK = `
  SELECT n.nspname AS schema,
         t.relname AS table_name,
         array_agg(att.attname::text ORDER BY x.ord) AS columns
  FROM pg_constraint con
  JOIN pg_class t ON t.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  JOIN unnest($1::text[], $2::text[]) AS kt(s_f, t_f)
    ON kt.s_f = n.nspname AND kt.t_f = t.relname
  JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS x(attnum, ord) ON true
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = x.attnum
  WHERE con.contype = 'p'
  GROUP BY n.nspname, t.relname
`;

const Q_FKS = `
  SELECT n.nspname AS schema,
         t.relname AS table_name,
         con.conname AS name,
         fn.nspname AS ref_schema,
         ft.relname AS ref_table,
         con.confdeltype AS on_delete,
         con.confupdtype AS on_update,
         (SELECT array_agg(att.attname::text ORDER BY x.ord)
            FROM unnest(con.conkey) WITH ORDINALITY AS x(attnum, ord)
            JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = x.attnum
         ) AS columns,
         (SELECT array_agg(att.attname::text ORDER BY x.ord)
            FROM unnest(con.confkey) WITH ORDINALITY AS x(attnum, ord)
            JOIN pg_attribute att ON att.attrelid = con.confrelid AND att.attnum = x.attnum
         ) AS ref_columns
  FROM pg_constraint con
  JOIN pg_class t ON t.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  JOIN unnest($1::text[], $2::text[]) AS kt(s_f, t_f)
    ON kt.s_f = n.nspname AND kt.t_f = t.relname
  JOIN pg_class ft ON ft.oid = con.confrelid
  JOIN pg_namespace fn ON fn.oid = ft.relnamespace
  WHERE con.contype = 'f'
  ORDER BY n.nspname, t.relname, con.conname
`;

const Q_INDEXES = `
  SELECT n.nspname AS schema,
         t.relname AS table_name,
         i.relname AS index_name,
         ix.indisunique AS is_unique,
         ix.indisprimary AS is_primary,
         am.amname AS method,
         array_agg(a.attname::text ORDER BY k.ord) AS columns
  FROM pg_index ix
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_class t ON t.oid = ix.indrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  JOIN unnest($1::text[], $2::text[]) AS kt(s_f, t_f)
    ON kt.s_f = n.nspname AND kt.t_f = t.relname
  JOIN pg_am am ON am.oid = i.relam
  JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord) ON true
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
  GROUP BY n.nspname, t.relname, i.relname, ix.indisunique, ix.indisprimary, am.amname
  ORDER BY n.nspname, t.relname, i.relname
`;

/** Mapeia o char de confdeltype/confupdtype para a ação legível. */
function fkAction(code: unknown): string | null {
  switch (String(code)) {
    case 'a':
      return 'NO ACTION';
    case 'r':
      return 'RESTRICT';
    case 'c':
      return 'CASCADE';
    case 'n':
      return 'SET NULL';
    case 'd':
      return 'SET DEFAULT';
    default:
      return null;
  }
}

/** Normaliza relkind do Postgres para o `kind` do contrato. */
function relkindToKind(relkind: unknown): SchemaTable['kind'] {
  switch (String(relkind)) {
    case 'v':
      return 'view';
    case 'm':
      return 'matview';
    default:
      return 'table'; // 'r' (ordinary) e 'p' (partitioned)
  }
}

/** bigint/numeric vindo como string → number, com piso 0 (null se negativo/inválido). */
function toCount(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function toBytes(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  return [];
}

/** Roda uma query auxiliar tolerando falha (degrada sem quebrar a introspecção). */
async function safeIntrospectRows(
  conn: Connection,
  sql: string,
  params?: unknown[]
): Promise<Record<string, unknown>[]> {
  try {
    const r = await runQuery(toPgRunnerConnection(conn), sql, {
      params,
      maxRows: SCHEMA_INTROSPECT_MAX_ROWS,
    });
    return r.rows;
  } catch {
    return [];
  }
}

/**
 * Monta a lista de tabelas ricas a partir das linhas das 5 queries de
 * introspecção. A query de COLUNAS é a espinha dorsal; PK/FK/índices/tabelas
 * são mesclados por `schema.tabela`.
 */
function buildTables(rows: {
  tables: Record<string, unknown>[];
  columns: Record<string, unknown>[];
  pks: Record<string, unknown>[];
  fks: Record<string, unknown>[];
  indexes: Record<string, unknown>[];
  enums?: Record<string, unknown>[];
}): SchemaTable[] {
  const map = new Map<string, SchemaTable>();
  const keyOf = (schema: string, name: string) => `${schema}.${name}`;

  /** Tipo enum -> valores aceitos, para anotar a coluna que o usa. */
  const valoresPorEnum = new Map<string, string[]>();
  for (const r of rows.enums ?? []) {
    const nome = r.type_name != null ? String(r.type_name) : '';
    const valores = asStringArray(r.values);
    if (nome && valores.length > 0) valoresPorEnum.set(nome, valores);
  }

  const ensure = (schema: string, name: string): SchemaTable => {
    const key = keyOf(schema, name);
    let table = map.get(key);
    if (!table) {
      table = {
        schema,
        name,
        kind: 'table',
        columns: [],
        primaryKey: [],
        indexes: [],
        foreignKeys: [],
        rowCount: null,
        sizeBytes: null,
        comment: null,
      };
      map.set(key, table);
    }
    return table;
  };

  // Metadados de tabela (kind/rowCount/size/comment)
  for (const r of rows.tables) {
    const t = ensure(String(r.schema), String(r.name));
    t.kind = relkindToKind(r.kind);
    t.rowCount = toCount(r.row_estimate);
    t.sizeBytes = toBytes(r.total_bytes);
    t.comment = r.table_descr != null ? String(r.table_descr) : null;
  }

  // Colunas (espinha dorsal — cria a tabela se TABLES não a trouxe)
  for (const r of rows.columns) {
    const t = ensure(String(r.schema), String(r.table_name));
    const dataType = String(r.data_type);
    // Enum vira "message_direction (in, out)": quem lê o schema passa a saber
    // o que cabe na coluna, em vez de descobrir pelo erro do banco.
    const valores = valoresPorEnum.get(dataType);
    t.columns.push({
      name: String(r.name),
      dataType: valores ? `${dataType} (${valores.join(', ')})` : dataType,
      nullable: r.nullable === true || String(r.nullable).toUpperCase() === 'YES',
      defaultValue: r.default_value != null ? String(r.default_value) : null,
      isPrimary: false,
      isForeign: false,
      references: null,
      comment: r.col_descr != null ? String(r.col_descr) : null,
    });
  }

  // Primary keys
  for (const r of rows.pks) {
    const t = map.get(keyOf(String(r.schema), String(r.table_name)));
    if (!t) continue;
    const pkCols = asStringArray(r.columns);
    t.primaryKey = pkCols;
    for (const col of t.columns) {
      if (pkCols.includes(col.name)) col.isPrimary = true;
    }
  }

  // Foreign keys (+ marca colunas FK, pareando posicionalmente)
  for (const r of rows.fks) {
    const t = map.get(keyOf(String(r.schema), String(r.table_name)));
    if (!t) continue;
    const cols = asStringArray(r.columns);
    const refCols = asStringArray(r.ref_columns);
    const refSchema = String(r.ref_schema);
    const refTable = String(r.ref_table);
    t.foreignKeys.push({
      name: String(r.name),
      columns: cols,
      references: {
        schema: refSchema,
        table: refTable,
        column: refCols[0] ?? '',
      },
      onDelete: fkAction(r.on_delete),
      onUpdate: fkAction(r.on_update),
    });
    cols.forEach((colName, i) => {
      const col = t.columns.find((c) => c.name === colName);
      if (col) {
        col.isForeign = true;
        col.references = {
          schema: refSchema,
          table: refTable,
          column: refCols[i] ?? refCols[0] ?? '',
        };
      }
    });
  }

  // Índices
  for (const r of rows.indexes) {
    const t = map.get(keyOf(String(r.schema), String(r.table_name)));
    if (!t) continue;
    t.indexes.push({
      name: String(r.index_name),
      columns: asStringArray(r.columns),
      unique: r.is_unique === true,
      primary: r.is_primary === true,
      method: String(r.method),
    });
  }

  // Ordena (schema, depois nome) para saída estável.
  return [...map.values()].sort(
    (a, b) => a.schema.localeCompare(b.schema) || a.name.localeCompare(b.name)
  );
}

/**
 * Introspecção de um GATEWAY → mesmo `SchemaPayload` do Postgres.
 *
 * O gateway entrega o essencial (tabelas, schemas, colunas com tipo) e nada
 * mais: não há PK, FK, índice, tamanho nem comentário do outro lado. Os campos
 * ausentes vão VAZIOS/`null` — nunca inventados. O explorer já trata todos como
 * opcionais (`primaryKey ?? []`), então a árvore, a busca e a visão de colunas
 * funcionam igual; o que não existe simplesmente não aparece, em vez de
 * aparecer errado.
 *
 * `nullable: true` é a única suposição, e é a conservadora: assumir que uma
 * coluna aceita nulo nunca faz alguém escrever uma query que quebra — o
 * contrário, sim.
 */
/** Nome legível do motor reportado pelo gateway ("sqlserver" → "SQL Server"). */
function engineLabel(engine: string | null | undefined): string | null {
  if (!engine) return null;
  const known: Record<string, string> = {
    sqlserver: 'SQL Server',
    mssql: 'SQL Server',
    postgres: 'PostgreSQL',
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    oracle: 'Oracle',
    sqlite: 'SQLite',
  };
  return known[engine.toLowerCase()] ?? engine;
}

function mapGatewaySchemaToPayload(
  connectionId: string,
  payload: Awaited<ReturnType<typeof gatewaySchema>>,
  engine?: string | null
): SchemaPayload {
  const totalTables = payload.tables.length;

  const sorted = [...payload.tables].sort(
    (a, b) =>
      String(a.schema ?? '').localeCompare(String(b.schema ?? '')) ||
      String(a.name ?? '').localeCompare(String(b.name ?? ''))
  );
  // Mesmo teto do caminho Postgres: bancos de ERP têm centenas de tabelas e o
  // payload precisa continuar navegável.
  const kept = sorted.slice(0, SCHEMA_MAX_TABLES);

  const tables: SchemaTable[] = kept.map((t) => ({
    schema: t.schema || 'dbo',
    name: t.name,
    kind: 'table',
    columns: (t.columns ?? []).map((c) => ({
      name: c.name,
      dataType: c.type,
      nullable: true,
      defaultValue: null,
      isPrimary: false,
      isForeign: false,
      references: null,
      comment: null,
    })),
    primaryKey: [],
    indexes: [],
    foreignKeys: [],
    rowCount: null,
    sizeBytes: null,
    comment: null,
  }));

  return {
    connectionId,
    tableCount: tables.length,
    totalTables,
    truncated: totalTables > tables.length,
    fetchedAt: new Date().toISOString(),
    database: {
      name: payload.database,
      /*
       * O MOTOR vai no `version` — é o único campo do contrato de schema que
       * carrega "que banco é este", e quem lê o schema precisa saber disso
       * ANTES de escrever SQL. Um agente que introspecta um banco sem saber
       * que é SQL Server escreve `LIMIT 50` e toma "Incorrect syntax near
       * '50'"; com "SQL Server" aqui, ele escolhe `TOP`.
       */
      version: engineLabel(engine),
      sizeBytes: null,
    },
    tables,
  };
}

/** Invalida (best-effort) o cache de introspecção de uma conexão. */
export async function invalidateSchemaCache(connectionId: string): Promise<void> {
  if (!redisService.isReady()) return;
  try {
    await redisService.deleteKey(schemaCacheKey(connectionId));
  } catch {
    // cache é best-effort — falha não deve quebrar a operação.
  }
}

/**
 * Introspecciona o schema RICO do Postgres externo: tabelas (com tamanho,
 * estimativa de linhas, comentário e tipo), colunas (com default, PK/FK,
 * referência e comentário), primary keys, foreign keys e índices, além de
 * metadados do banco (versão, tamanho). Usa cache Redis em `conn:{id}:schema`
 * (TTL `SCHEMA_CACHE_TTL_SECONDS`). `refresh` ignora o cache.
 *
 * A query de COLUNAS é obrigatória (erro nela = falha de conectividade →
 * propaga). As demais são best-effort: degradam sem quebrar a introspecção.
 */
export async function introspectSchema(
  conn: Connection,
  opts: { refresh?: boolean } = {}
): Promise<SchemaPayload & { cached: boolean }> {
  const key = schemaCacheKey(conn.id);

  if (!opts.refresh && redisService.isReady()) {
    try {
      const cached = await redisService.getValue(key);
      if (cached) {
        const payload = JSON.parse(cached) as SchemaPayload;
        return { ...payload, cached: true };
      }
    } catch {
      // cache miss/erro → segue para introspecção fresca.
    }
  }

  // Gateway: a introspecção é UMA chamada HTTP (`/schema`) — não há catálogo
  // `pg_class` para consultar do lado de cá. Mesmo cache, mesmo formato.
  if (isGatewayConnection(conn)) {
    const raw = await gatewaySchema(toGatewayConnection(conn));
    // Motor descoberto no teste de conexão (`/health`) e guardado em `options`.
    const engine = (conn.options as { engine?: string } | null)?.engine;
    const payload = mapGatewaySchemaToPayload(conn.id, raw, engine);
    if (redisService.isReady()) {
      try {
        await redisService.setValue(key, JSON.stringify(payload), SCHEMA_CACHE_TTL_SECONDS);
      } catch {
        // best-effort
      }
    }
    return { ...payload, cached: false };
  }

  // Fase 1: lista de tabelas (leve) — fonte da verdade do conjunto + metadados.
  // É também o teste de conectividade: se falhar (ex.: conexão recusada), propaga.
  const tablesResult = await runQuery(toPgRunnerConnection(conn), Q_TABLES, {
    maxRows: SCHEMA_INTROSPECT_MAX_ROWS,
  });
  const totalTables = tablesResult.rows.length;

  // Ordena por (schema, nome) e mantém as primeiras N (cap de tabelas).
  const sortedMeta = [...tablesResult.rows].sort(
    (a, b) =>
      String(a.schema).localeCompare(String(b.schema)) ||
      String(a.name).localeCompare(String(b.name))
  );
  const keptMeta = sortedMeta.slice(0, SCHEMA_MAX_TABLES);
  const keptSchemas = keptMeta.map((r) => String(r.schema));
  const keptNames = keptMeta.map((r) => String(r.name));
  const filterParams: unknown[] = [keptSchemas, keptNames];

  // Fase 2: detalhes SÓ das tabelas mantidas — colunas COMPLETAS garantidas.
  const columnsResult = await runQuery(toPgRunnerConnection(conn), Q_COLUMNS, {
    params: filterParams,
    maxRows: SCHEMA_INTROSPECT_MAX_ROWS,
  });

  // Auxiliares (best-effort, em paralelo).
  const [pks, fks, indexes, dbmeta, enums] = await Promise.all([
    safeIntrospectRows(conn, Q_PK, filterParams),
    safeIntrospectRows(conn, Q_FKS, filterParams),
    safeIntrospectRows(conn, Q_INDEXES, filterParams),
    safeIntrospectRows(conn, Q_DBMETA),
    safeIntrospectRows(conn, Q_ENUMS),
  ]);

  const cappedTables = buildTables({
    tables: keptMeta,
    columns: columnsResult.rows,
    pks,
    fks,
    indexes,
    enums,
  });

  const metaRow = dbmeta[0] ?? {};
  const database: SchemaDatabaseMeta = {
    name: metaRow.db_name != null ? String(metaRow.db_name) : null,
    version: metaRow.db_version != null ? String(metaRow.db_version) : null,
    sizeBytes: toBytes(metaRow.db_bytes),
  };

  const payload: SchemaPayload = {
    connectionId: conn.id,
    tableCount: cappedTables.length,
    totalTables,
    truncated: totalTables > cappedTables.length,
    fetchedAt: new Date().toISOString(),
    database,
    tables: cappedTables,
  };

  if (redisService.isReady()) {
    try {
      await redisService.setValue(key, JSON.stringify(payload), SCHEMA_CACHE_TTL_SECONDS);
    } catch {
      // best-effort
    }
  }

  return { ...payload, cached: false };
}

/**
 * Executa um SELECT read-only contra a fonte externa (preview/dev) — Postgres
 * ou gateway, decidido pelo `toRunnerConnection`.
 */
export async function runConnectionQuery(
  conn: Connection,
  sql: string,
  params?: unknown[],
  maxRows?: number
): Promise<QueryResultShape> {
  return runAnyQuery(toRunnerConnection(conn), sql, { params, maxRows });
}

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
import {
  runQuery,
  type PgRunnerConnection,
  type QueryResultShape,
} from '@/lib/pg-runner';
import { redisService } from '@/lib/redis';
import type { UserContext } from './rbac';
import type { CreateConnectionInput, UpdateConnectionInput } from './schema';

/** TTL do cache de introspecção de schema (segundos). */
const SCHEMA_CACHE_TTL_SECONDS = 300;
/** Row cap específico da introspecção (catálogos podem ter muitas colunas). */
const SCHEMA_INTROSPECT_MAX_ROWS = 100000;

/** Chave Redis do cache de introspecção de uma conexão. */
export function schemaCacheKey(connectionId: string): string {
  return `conn:${connectionId}:schema`;
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

function normalizeOptions(
  options: Record<string, unknown> | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (options === undefined) return undefined;
  if (options === null) return Prisma.JsonNull;
  return options as Prisma.InputJsonValue;
}

export async function createConnection(
  ctx: UserContext,
  input: CreateConnectionInput
): Promise<Connection> {
  return prisma.connection.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      host: input.host,
      port: input.port,
      database: input.database,
      username: input.username,
      passwordCipher: encrypt(input.password),
      sslMode: input.sslMode,
      options: normalizeOptions(input.options),
      ownerId: ctx.userId,
      departmentId: input.departmentId ?? null,
      visibility: input.visibility,
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
  if (input.options !== undefined) data.options = normalizeOptions(input.options);
  if (input.departmentId !== undefined) data.departmentId = input.departmentId ?? null;
  if (input.visibility !== undefined) data.visibility = input.visibility;
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
 * Testa conectividade contra o Postgres externo (decifra a senha, conecta e
 * roda `SELECT 1`). Atualiza `status` (`ok`/`error`) e `lastTestedAt`.
 */
export async function testConnection(conn: Connection): Promise<TestConnectionResult> {
  let ok = false;
  let status = 'error';
  let message: string | null = null;

  try {
    await runQuery(toPgRunnerConnection(conn), 'SELECT 1', {
      maxRows: 1,
      statementTimeoutMs: 5000,
    });
    ok = true;
    status = 'ok';
  } catch (err) {
    message = err instanceof Error ? err.message : 'connection test failed';
  }

  const updated = await prisma.connection.update({
    where: { id: conn.id },
    data: { status, lastTestedAt: new Date() },
  });

  return { ok, status, lastTestedAt: updated.lastTestedAt, message };
}

export interface SchemaTable {
  schema: string;
  name: string;
  columns: { name: string; dataType: string; nullable: boolean }[];
}

export interface SchemaPayload {
  connectionId: string;
  tableCount: number;
  fetchedAt: string;
  tables: SchemaTable[];
}

const INTROSPECT_SQL = `
  SELECT table_schema, table_name, column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  ORDER BY table_schema, table_name, ordinal_position
`;

function groupTables(rows: Record<string, unknown>[]): SchemaTable[] {
  const map = new Map<string, SchemaTable>();
  for (const r of rows) {
    const schema = String(r.table_schema);
    const name = String(r.table_name);
    const key = `${schema}.${name}`;
    let table = map.get(key);
    if (!table) {
      table = { schema, name, columns: [] };
      map.set(key, table);
    }
    table.columns.push({
      name: String(r.column_name),
      dataType: String(r.data_type),
      nullable: String(r.is_nullable).toUpperCase() === 'YES',
    });
  }
  return [...map.values()];
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
 * Introspecciona tabelas/colunas do Postgres externo. Usa cache Redis em
 * `conn:{id}:schema` (TTL `SCHEMA_CACHE_TTL_SECONDS`). `refresh` ignora o cache.
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

  const result = await runQuery(toPgRunnerConnection(conn), INTROSPECT_SQL, {
    maxRows: SCHEMA_INTROSPECT_MAX_ROWS,
  });
  const tables = groupTables(result.rows);
  const payload: SchemaPayload = {
    connectionId: conn.id,
    tableCount: tables.length,
    fetchedAt: new Date().toISOString(),
    tables,
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

/** Executa um SELECT read-only contra o Postgres externo (preview/dev). */
export async function runConnectionQuery(
  conn: Connection,
  sql: string,
  params?: unknown[],
  maxRows?: number
): Promise<QueryResultShape> {
  return runQuery(toPgRunnerConnection(conn), sql, { params, maxRows });
}

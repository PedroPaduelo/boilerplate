/**
 * Schemas Zod (v3) e serialização do módulo `connections` (T-A).
 *
 * Os contratos COMPARTILHADOS (@dashboards/contracts) não definem DTO de
 * Connection, então os schemas de request/response são locais ao módulo
 * (decisão da Fase 0: "sem Zod" vale só para os contratos compartilhados).
 *
 * REGRA DE SEGURANÇA: a senha NUNCA é serializada. `serializeConnection` lista
 * explicitamente os campos seguros — `passwordCipher` e o plaintext jamais saem.
 */
import type { Connection } from '@prisma/client';
import { z } from 'zod';

export const visibilityEnum = z.enum(['PRIVATE', 'DEPARTMENT', 'ORG']);
export const connectionTypeEnum = z.enum(['POSTGRES']);

/** Resposta pública de uma conexão (SEM senha/cipher). */
export const connectionResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  host: z.string(),
  port: z.number(),
  database: z.string(),
  username: z.string(),
  sslMode: z.string(),
  options: z.any().nullable(),
  ownerId: z.string(),
  departmentId: z.string().nullable(),
  visibility: z.string(),
  isActive: z.boolean(),
  status: z.string(),
  lastTestedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ConnectionResponse = z.infer<typeof connectionResponseSchema>;

export const createConnectionBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullish(),
  type: connectionTypeEnum.default('POSTGRES'),
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535).default(5432),
  database: z.string().min(1),
  username: z.string().min(1),
  /** senha em CLARO — cifrada at-rest antes de persistir. */
  password: z.string().min(1),
  sslMode: z.string().default('require'),
  options: z.record(z.any()).nullish(),
  departmentId: z.string().nullish(),
  visibility: visibilityEnum.default('DEPARTMENT'),
  isActive: z.boolean().default(true),
});

export type CreateConnectionInput = z.infer<typeof createConnectionBodySchema>;

export const updateConnectionBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).nullish(),
    host: z.string().min(1).optional(),
    port: z.coerce.number().int().min(1).max(65535).optional(),
    database: z.string().min(1).optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    sslMode: z.string().optional(),
    options: z.record(z.any()).nullish(),
    departmentId: z.string().nullish(),
    visibility: visibilityEnum.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'at least one field must be provided',
  });

export type UpdateConnectionInput = z.infer<typeof updateConnectionBodySchema>;

export const listConnectionsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  visibility: visibilityEnum.optional(),
  isActive: z.coerce.boolean().optional(),
});

export const listConnectionsResponseSchema = z.object({
  connections: z.array(connectionResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export const idParamSchema = z.object({ id: z.string().min(1) });

export const runQueryBodySchema = z.object({
  sql: z.string().min(1),
  params: z.array(z.any()).optional(),
  // Limite pedido pelo caller. O TETO ABSOLUTO de segurança é aplicado no
  // pg-runner (clamp contra env.PG_RUNNER_MAX_ROWS): pedir mais que o cap nunca
  // retorna mais que o cap, independentemente deste max do schema.
  maxRows: z.coerce.number().int().min(1).max(100000).optional(),
});

export const queryResultSchema = z.object({
  columns: z.array(z.object({ name: z.string(), dataTypeID: z.number() })),
  rows: z.array(z.record(z.any())),
  rowCount: z.number(),
  truncated: z.boolean(),
  durationMs: z.number(),
});

export const schemaRefSchema = z.object({
  schema: z.string(),
  table: z.string(),
  column: z.string(),
});

export const schemaColumnSchema = z.object({
  name: z.string(),
  dataType: z.string(),
  nullable: z.boolean(),
  defaultValue: z.string().nullable(),
  isPrimary: z.boolean(),
  isForeign: z.boolean(),
  references: schemaRefSchema.nullable(),
  comment: z.string().nullable(),
});

export const schemaIndexSchema = z.object({
  name: z.string(),
  columns: z.array(z.string()),
  unique: z.boolean(),
  primary: z.boolean(),
  method: z.string(),
});

export const schemaForeignKeySchema = z.object({
  name: z.string(),
  columns: z.array(z.string()),
  references: schemaRefSchema,
  onDelete: z.string().nullable(),
  onUpdate: z.string().nullable(),
});

export const schemaTableSchema = z.object({
  schema: z.string(),
  name: z.string(),
  kind: z.enum(['table', 'view', 'matview']),
  columns: z.array(schemaColumnSchema),
  primaryKey: z.array(z.string()),
  indexes: z.array(schemaIndexSchema),
  foreignKeys: z.array(schemaForeignKeySchema),
  rowCount: z.number().nullable(),
  sizeBytes: z.number().nullable(),
  comment: z.string().nullable(),
});

export const schemaDatabaseMetaSchema = z.object({
  name: z.string().nullable(),
  version: z.string().nullable(),
  sizeBytes: z.number().nullable(),
});

export const schemaResponseSchema = z.object({
  connectionId: z.string(),
  cached: z.boolean(),
  tableCount: z.number(),
  totalTables: z.number(),
  truncated: z.boolean(),
  fetchedAt: z.string(),
  database: schemaDatabaseMetaSchema,
  tables: z.array(schemaTableSchema),
});

export const schemaQuerySchema = z.object({
  refresh: z.coerce.boolean().optional(),
});

export const testResultSchema = z.object({
  ok: z.boolean(),
  status: z.string(),
  lastTestedAt: z.date().nullable(),
  message: z.string().nullable(),
});

/**
 * Serializa uma Connection para resposta pública. Lista EXPLÍCITA de campos
 * seguros — `passwordCipher` jamais é incluído.
 */
export function serializeConnection(conn: Connection): ConnectionResponse {
  return {
    id: conn.id,
    name: conn.name,
    description: conn.description,
    type: conn.type,
    host: conn.host,
    port: conn.port,
    database: conn.database,
    username: conn.username,
    sslMode: conn.sslMode,
    options: (conn.options ?? null) as unknown,
    ownerId: conn.ownerId,
    departmentId: conn.departmentId,
    visibility: conn.visibility,
    isActive: conn.isActive,
    status: conn.status,
    lastTestedAt: conn.lastTestedAt,
    createdAt: conn.createdAt,
    updatedAt: conn.updatedAt,
  };
}

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
/**
 * Tipo da fonte. `POSTGRES` é o default por retrocompatibilidade: clientes que
 * já criavam conexões sem informar o tipo continuam criando Postgres.
 */
export const connectionTypeEnum = z.enum(['POSTGRES', 'API_GATEWAY']);
/**
 * Ambiente do banco. SEM `.default()` de propósito no create: um default aqui
 * seria a mesma adivinhação silenciosa que este campo veio eliminar — quem
 * cadastra precisa declarar.
 */
export const connectionEnvironmentEnum = z.enum(['DEV', 'HOMOLOG', 'PRODUCTION']);

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
  /** Base URL do gateway (null em conexões POSTGRES). Não é segredo. */
  baseUrl: z.string().nullable(),
  options: z.any().nullable(),
  ownerId: z.string(),
  departmentId: z.string().nullable(),
  visibility: z.string(),
  environment: z.string(),
  isActive: z.boolean(),
  status: z.string(),
  lastTestedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ConnectionResponse = z.infer<typeof connectionResponseSchema>;

/**
 * Campos exigidos por CADA tipo de fonte.
 *
 * Os dois tipos moram no mesmo objeto (em vez de uma união discriminada) por
 * dois motivos práticos: o payload continua compatível com quem já criava
 * conexões Postgres sem informar `type`, e o erro de validação sai apontando o
 * CAMPO que faltou ("Informe a URL base do gateway") em vez do "nenhuma
 * variante da união casou" que uma união discriminada produziria.
 */
function validateByType(
  values: {
    type: 'POSTGRES' | 'API_GATEWAY';
    host?: string | null;
    database?: string | null;
    username?: string | null;
    password?: string | null;
    baseUrl?: string | null;
    token?: string | null;
  },
  ctx: z.RefinementCtx,
  { requireSecret }: { requireSecret: boolean }
) {
  const missing = (path: string, message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

  if (values.type === 'API_GATEWAY') {
    if (!values.baseUrl?.trim()) {
      missing('baseUrl', 'baseUrl is required for API_GATEWAY connections');
    }
    if (requireSecret && !values.token?.trim()) {
      missing('token', 'token is required for API_GATEWAY connections');
    }
    return;
  }

  if (!values.host?.trim()) missing('host', 'host is required for POSTGRES connections');
  if (!values.database?.trim()) {
    missing('database', 'database is required for POSTGRES connections');
  }
  if (!values.username?.trim()) {
    missing('username', 'username is required for POSTGRES connections');
  }
  if (requireSecret && !values.password?.trim()) {
    missing('password', 'password is required for POSTGRES connections');
  }
}

export const createConnectionBodySchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).nullish(),
    type: connectionTypeEnum.default('POSTGRES'),

    /* --- POSTGRES ------------------------------------------------------- */
    // Opcionais no OBJETO, obrigatórios por TIPO (ver `validateByType`).
    host: z.string().min(1).optional(),
    port: z.coerce.number().int().min(1).max(65535).default(5432),
    username: z.string().min(1).optional(),
    /** senha em CLARO — cifrada at-rest antes de persistir. */
    password: z.string().min(1).optional(),
    sslMode: z.string().default('require'),

    /* --- API_GATEWAY ---------------------------------------------------- */
    /** Base URL do gateway (ex.: https://gw.exemplo.com). */
    baseUrl: z.string().min(1).optional(),
    /** Token Bearer em CLARO — cifrado at-rest (mesmo campo da senha). */
    token: z.string().min(1).optional(),

    /* --- comuns --------------------------------------------------------- */
    // Obrigatório no Postgres; no gateway é opcional (o `/health` informa).
    database: z.string().min(1).optional(),
    options: z.record(z.any()).nullish(),
    departmentId: z.string().nullish(),
    visibility: visibilityEnum.default('DEPARTMENT'),
    environment: connectionEnvironmentEnum,
    isActive: z.boolean().default(true),
  })
  .superRefine((values, ctx) => validateByType(values, ctx, { requireSecret: true }));

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
    /** Trocar a URL re-deriva host/porta (ver `updateConnection`). */
    baseUrl: z.string().min(1).optional(),
    /** Em branco/ausente MANTÉM o token atual (mesma regra da senha). */
    token: z.string().min(1).optional(),
    options: z.record(z.any()).nullish(),
    departmentId: z.string().nullish(),
    visibility: visibilityEnum.optional(),
    environment: connectionEnvironmentEnum.optional(),
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
  columns: z.array(
    z.object({
      name: z.string(),
      dataTypeID: z.number(),
      /** Nome do tipo, quando a fonte informa por nome (gateway). */
      dataType: z.string().optional(),
    })
  ),
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
 * seguros — `passwordCipher` jamais é incluído (ele guarda a senha do Postgres
 * OU o token do gateway; em ambos os casos, segredo).
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
    baseUrl: conn.baseUrl,
    options: (conn.options ?? null) as unknown,
    ownerId: conn.ownerId,
    departmentId: conn.departmentId,
    visibility: conn.visibility,
    environment: conn.environment,
    isActive: conn.isActive,
    status: conn.status,
    lastTestedAt: conn.lastTestedAt,
    createdAt: conn.createdAt,
    updatedAt: conn.updatedAt,
  };
}

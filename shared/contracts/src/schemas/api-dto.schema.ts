/**
 * DTOs das rotas de API (fronteira BE<->FE) — doc 20 (fluxo) + doc 30 (modelagem).
 *
 * Foco no caminho do dashboard/dados (a fronteira que destrava as trilhas).
 * Conexões/MCP têm DTOs próprios nas suas trilhas (T-A/T-D); aqui ficam os comuns.
 */

/** Envelope de erro padrão da API. */
export const ApiErrorSchema = {
  $id: 'api-error.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'ApiError',
  type: 'object',
  additionalProperties: false,
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      additionalProperties: false,
      required: ['code', 'message'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: {},
      },
    },
  },
} as const;

/** Item de listagem de dashboards (GET /dashboards). */
export const DashboardSummarySchema = {
  $id: 'dashboard-summary.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'DashboardSummary',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'title', 'status', 'visibility', 'ownerId', 'updatedAt'],
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    status: { type: 'string', enum: ['draft', 'published'] },
    visibility: { type: 'string', enum: ['private', 'department', 'org'] },
    ownerId: { type: 'string' },
    departmentId: { type: ['string', 'null'] },
    updatedAt: { type: 'string' },
  },
} as const;

/** Detalhe de um dashboard (GET /dashboards/:id) — metadados + layout corrente. */
export const DashboardDetailSchema = {
  $id: 'dashboard-detail.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'DashboardDetail',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'title', 'status', 'visibility', 'ownerId', 'layout'],
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    status: { type: 'string', enum: ['draft', 'published'] },
    visibility: { type: 'string', enum: ['private', 'department', 'org'] },
    ownerId: { type: 'string' },
    departmentId: { type: ['string', 'null'] },
    version: { type: 'integer', minimum: 1 },
    publishedAt: { type: ['string', 'null'] },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    layout: { $ref: 'dashboard-layout.json' },
  },
} as const;

/** Body de criação (POST /dashboards). */
export const CreateDashboardRequestSchema = {
  $id: 'create-dashboard-request.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'CreateDashboardRequest',
  type: 'object',
  additionalProperties: false,
  required: ['title'],
  properties: {
    title: { type: 'string', minLength: 1 },
    departmentId: { type: ['string', 'null'] },
    visibility: { type: 'string', enum: ['private', 'department', 'org'] },
    layout: { $ref: 'dashboard-layout.json' },
  },
} as const;

/** Body de atualização (PATCH /dashboards/:id). Todos os campos opcionais. */
export const UpdateDashboardRequestSchema = {
  $id: 'update-dashboard-request.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'UpdateDashboardRequest',
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 1 },
    departmentId: { type: ['string', 'null'] },
    visibility: { type: 'string', enum: ['private', 'department', 'org'] },
    layout: { $ref: 'dashboard-layout.json' },
  },
} as const;

/**
 * Body do endpoint de dados batch (POST /dashboards/:id/data).
 * `filters` = valores correntes dos filtros (filterId -> valor). `mode` controla cache.
 */
export const BlockDataRequestSchema = {
  $id: 'block-data-request.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'BlockDataRequest',
  type: 'object',
  additionalProperties: false,
  properties: {
    filters: { type: 'object' },
    mode: { type: 'string', enum: ['dev', 'published'] },
    // restringir a recomputação a um subconjunto de blocos (ex.: mudou 1 filtro).
    blockIds: { type: 'array', items: { type: 'string' } },
  },
} as const;

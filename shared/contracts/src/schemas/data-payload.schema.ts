/**
 * Contrato do PAYLOAD DE DADOS (batch por dashboard) — doc 20 (seção 3, fluxo de render).
 *
 * É a resposta do endpoint de dados batch (POST /dashboards/:id/data) e também o
 * formato base do que o socket emite por bloco. É CONTRA ESTE CONTRATO que o frontend
 * trabalha com FIXTURES enquanto a trilha de execução (T-C) não existe.
 *
 * Estados por bloco (doc 20): idle | queued | running | success | error.
 */

/** Resultado de UM bloco (def reutilizado inline no payload e nos eventos de socket). */
const blockDataResultDef = {
  type: 'object',
  additionalProperties: false,
  required: ['blockId', 'state'],
  properties: {
    blockId: { type: 'string', minLength: 1 },
    state: { type: 'string', enum: ['idle', 'queued', 'running', 'success', 'error'] },
    // shape do dado (espelha dataContract.shape do bloco). Presente quando state=success.
    shape: { type: 'string', enum: ['scalar', 'series', 'categorical', 'table'] },
    // dado já transformado para o shape do bloco (validar com os schemas de block-data).
    data: {},
    error: {
      type: 'object',
      additionalProperties: false,
      required: ['message'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
    },
    meta: {
      type: 'object',
      additionalProperties: true,
      properties: {
        cached: { type: 'boolean' },
        ttlSeconds: { type: 'integer', minimum: 0 },
        executedAt: { type: 'string' },
        rowCount: { type: 'integer', minimum: 0 },
        truncated: { type: 'boolean' },
        durationMs: { type: 'integer', minimum: 0 },
      },
    },
  },
} as const;

/** Resultado de um único bloco (standalone, com $id — usado também em payloads de socket). */
export const BlockDataResultSchema = {
  $id: 'block-data-result.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'BlockDataResult',
  ...blockDataResultDef,
} as const;

/** Payload batch: mapa blockId -> resultado. */
export const DashboardDataPayloadSchema = {
  $id: 'dashboard-data-payload.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'DashboardDataPayload',
  type: 'object',
  additionalProperties: false,
  required: ['dashboardId', 'blocks'],
  properties: {
    dashboardId: { type: 'string', minLength: 1 },
    version: { type: 'integer', minimum: 1 },
    mode: { type: 'string', enum: ['dev', 'published'] },
    generatedAt: { type: 'string' },
    blocks: {
      type: 'object',
      additionalProperties: blockDataResultDef,
    },
  },
} as const;

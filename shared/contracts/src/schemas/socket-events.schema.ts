/**
 * Catálogo de eventos de Socket.IO + schemas dos payloads — doc 20 (seção 3).
 *
 * O worker (T-C) executa a query, transforma para o shape do bloco, grava cache e
 * EMITE um evento por bloco para a sala do dashboard. O FE escuta e troca o estado
 * do bloco (skeleton -> dado / erro), isoladamente.
 *
 * Sala (room): `dashboard:{dashboardId}` (ver helper em src/socket/events.ts).
 */

/** Nomes dos eventos (server -> client). Fonte única para BE (emit) e FE (on). */
export const SOCKET_EVENTS = {
  BLOCK_QUEUED: 'block:queued',
  BLOCK_RUNNING: 'block:running',
  BLOCK_DATA: 'block:data',
  BLOCK_ERROR: 'block:error',
} as const;

const baseEvt = {
  type: 'object',
  additionalProperties: false,
  required: ['dashboardId', 'blockId'],
  properties: {
    dashboardId: { type: 'string', minLength: 1 },
    blockId: { type: 'string', minLength: 1 },
  },
} as const;

/** Payload de `block:queued`. */
export const BlockQueuedEventSchema = {
  $id: 'evt-block-queued.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'BlockQueuedEvent',
  type: 'object',
  additionalProperties: false,
  required: ['dashboardId', 'blockId', 'state'],
  properties: {
    ...baseEvt.properties,
    state: { type: 'string', const: 'queued' },
  },
} as const;

/** Payload de `block:running`. */
export const BlockRunningEventSchema = {
  $id: 'evt-block-running.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'BlockRunningEvent',
  type: 'object',
  additionalProperties: false,
  required: ['dashboardId', 'blockId', 'state'],
  properties: {
    ...baseEvt.properties,
    state: { type: 'string', const: 'running' },
  },
} as const;

/** Payload de `block:data` (sucesso) — carrega o BlockDataResult completo. */
export const BlockDataEventSchema = {
  $id: 'evt-block-data.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'BlockDataEvent',
  type: 'object',
  additionalProperties: false,
  required: ['dashboardId', 'blockId', 'result'],
  properties: {
    ...baseEvt.properties,
    result: { $ref: 'block-data-result.json' },
  },
} as const;

/** Payload de `block:error`. */
export const BlockErrorEventSchema = {
  $id: 'evt-block-error.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'BlockErrorEvent',
  type: 'object',
  additionalProperties: false,
  required: ['dashboardId', 'blockId', 'error'],
  properties: {
    ...baseEvt.properties,
    error: {
      type: 'object',
      additionalProperties: false,
      required: ['message'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
} as const;

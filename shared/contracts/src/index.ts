/**
 * @dashboards/contracts — Contratos COMPARTILHADOS (JSON Schema neutro, sem Zod).
 *
 * Fonte da verdade única e versionável consumida por BE (Fastify/Prisma, Zod v3),
 * FE (Vite/React, Zod v4) e MCP — sem conflito de Zod, porque os contratos NÃO usam Zod:
 * são JSON Schemas neutros + tipos TS derivados (json-schema-to-ts) + validador ajv.
 *
 * Espelha docs/plano/20-contrato-dashboard.md (LAYOUT × DADOS × CONTRATO-DE-BLOCO),
 * 33-catalogo-componentes.md e 30-modelagem-dados.md.
 */

// JSON Schemas (objetos neutros — servem para ajv, $ref e introspecção no MCP).
export * from './schemas';

// Tipos TS derivados (import estático no BE e no FE).
export * from './types';

// Validador runtime neutro (ajv) + helpers.
export * from './validation/validator';

// Helpers de Socket.IO (nomes de evento + sala + tipos de payload).
export * from './socket/events';

// Fixtures de exemplo (destravam o trabalho paralelo do FE com dados mockados).
export * from './fixtures';

/**
 * Contrato de LAYOUT (DashboardConfig / DashboardLayout) — Camada 1 do doc 20.
 *
 * JSON Schema NEUTRO (draft-07 compatível, sem Zod). É o JSON que o backend salva
 * (Dashboard.draftLayout / publishedLayout = { filters, rows }) e que o front
 * hidrata para desenhar filtros + grid de blocos.
 *
 * Fonte da verdade: docs/plano/20-contrato-dashboard.md (seção 1) + 30-modelagem-dados.md.
 */

/**
 * DashboardLayout = o objeto JSON embutido salvo em `draft_layout` / `published_layout`.
 * Contém apenas { filters, rows } — os metadados (id, version, status, title, owner,
 * visibility) ficam em colunas da tabela `dashboards` (ver modelagem 30) e compõem
 * o DashboardConfig completo (abaixo).
 */
export const DashboardLayoutSchema = {
  $id: 'dashboard-layout.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'DashboardLayout',
  type: 'object',
  additionalProperties: false,
  required: ['filters', 'rows'],
  properties: {
    filters: {
      type: 'array',
      items: { $ref: '#/$defs/filter' },
    },
    rows: {
      type: 'array',
      items: { $ref: '#/$defs/row' },
    },
  },
  $defs: {
    filter: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type', 'label'],
      properties: {
        id: { type: 'string', minLength: 1 },
        type: {
          type: 'string',
          enum: ['date_range', 'select', 'multiselect', 'search', 'number_range'],
        },
        label: { type: 'string' },
        // `default` é o valor inicial do filtro; shape depende do tipo → livre.
        default: {},
      },
    },
    dataBindingParam: {
      type: 'object',
      additionalProperties: false,
      required: ['filterId', 'as'],
      properties: {
        filterId: { type: 'string', minLength: 1 },
        as: { type: 'string', minLength: 1 },
      },
    },
    dataBinding: {
      type: 'object',
      additionalProperties: false,
      required: ['connectionId', 'query'],
      properties: {
        connectionId: { type: 'string', minLength: 1 },
        query: { type: 'string', minLength: 1 },
        params: {
          type: 'array',
          items: { $ref: '#/$defs/dataBindingParam' },
        },
        // mapeamento resultado->shape do bloco: ref nomeada OU objeto declarativo → livre.
        transform: {},
        ttlSeconds: { type: 'integer', minimum: 0 },
      },
    },
    block: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type', 'span'],
      properties: {
        id: { type: 'string', minLength: 1 },
        // referencia um `type` do CATÁLOGO (catalogType). Ex.: kpi, bar_chart, rich_text, section.
        type: { type: 'string', minLength: 1 },
        // largura no grid de 12 colunas (relativa ao container pai — row ou bloco-container).
        span: { type: 'integer', minimum: 1, maximum: 12 },
        // altura no mosaico: quantas linhas o bloco ocupa em containers com grid
        // (ex.: bento_grid). Opcional — default 1. Mesma sintaxe de span p/ a IA.
        rowSpan: { type: 'integer', minimum: 1 },
        // título do card (header do "frame" — chart-widget). Opcional: se ausente, o
        // render usa o `manifest.name` do tipo. Permite a IA nomear o card no relatório.
        title: { type: 'string' },
        // subtítulo do header do card (linha de apoio abaixo do título). Opcional.
        subtitle: { type: 'string' },
        // props visuais do bloco (validadas pelo manifest.propsSchema do catálogo).
        props: { type: 'object' },
        // ausente em blocos narrativos (title / rich_text) e em containers (section).
        dataBinding: { $ref: '#/$defs/dataBinding' },
        // COMPOSIÇÃO RECURSIVA (hierarquia): blocos-container (ex.: `section`, `bento`)
        // agrupam sub-blocos num grid interno de 12 colunas. Cada filho é um `block`
        // (folha ou outro container) — permite "seção dentro de seção" / relatórios ricos.
        blocks: {
          type: 'array',
          items: { $ref: '#/$defs/block' },
        },
      },
    },
    row: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'blocks'],
      properties: {
        id: { type: 'string', minLength: 1 },
        title: { type: 'string' },
        blocks: {
          type: 'array',
          items: { $ref: '#/$defs/block' },
        },
      },
    },
  },
} as const;

/**
 * DashboardConfig = representação COMPLETA (API/MCP) do dashboard: metadados +
 * filters + rows, exatamente como no exemplo do doc 20 (seção 1).
 * Reaproveita os $defs do DashboardLayout via $ref por $id (sem duplicar contrato).
 */
export const DashboardConfigSchema = {
  $id: 'dashboard-config.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'DashboardConfig',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'version', 'status', 'title', 'ownerId', 'visibility', 'filters', 'rows'],
  properties: {
    id: { type: 'string', minLength: 1 },
    version: { type: 'integer', minimum: 1 },
    status: { type: 'string', enum: ['draft', 'published'] },
    title: { type: 'string', minLength: 1 },
    ownerId: { type: 'string', minLength: 1 },
    departmentId: { type: ['string', 'null'] },
    visibility: { type: 'string', enum: ['PRIVATE', 'DEPARTMENT', 'ORG'] },
    filters: {
      type: 'array',
      items: { $ref: 'dashboard-layout.json#/$defs/filter' },
    },
    rows: {
      type: 'array',
      items: { $ref: 'dashboard-layout.json#/$defs/row' },
    },
  },
} as const;

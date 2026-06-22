/**
 * Contrato do BLOCO (manifesto do catálogo) — Camada 2 do doc 20 / doc 33.
 *
 * Cada tipo de bloco do catálogo declara um manifesto NEUTRO (sem React, sem Zod).
 * Dele saem 3 consumidores: render no FE, GET /catalog (BE) e MCP list_catalog (IA).
 *
 * `dataContract` (shape / spec / example) é a "documentação rígida" que a IA lê para
 * saber QUAIS dados a query deve produzir e COMO o resultado é conciliado com o bloco.
 * Blocos narrativos (title / rich_text) não têm `dataContract`.
 */
export const BlockManifestSchema = {
  $id: 'block-manifest.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'BlockManifest',
  type: 'object',
  additionalProperties: false,
  required: ['type', 'kind', 'name', 'description', 'source'],
  properties: {
    // identificador do bloco no catálogo (catalogType). Ex.: 'bar_chart'.
    type: { type: 'string', minLength: 1 },
    kind: { type: 'string', enum: ['chart', 'text', 'title', 'layout'] },
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    // origem do componente: slug Vitrine ('vitrine:bar-chart') ou 'custom'.
    source: { type: 'string', minLength: 1 },
    // JSON Schema NEUTRO das props visuais (objeto schema arbitrário).
    propsSchema: { type: 'object' },
    dataContract: { $ref: '#/$defs/dataContract' },
    defaultProps: { type: 'object' },
    minColumns: { type: 'integer', minimum: 0 },
    maxRows: { type: 'integer', minimum: 0 },
    version: { type: 'string' },
  },
  $defs: {
    dataContract: {
      type: 'object',
      additionalProperties: false,
      required: ['shape', 'spec'],
      properties: {
        shape: { type: 'string', enum: ['scalar', 'series', 'categorical', 'table'] },
        // descrição dos campos esperados (x/y/series, columns, etc.).
        spec: { type: 'object' },
        // exemplo de dado já no shape do bloco (preview/dev/IA).
        example: {},
      },
    },
  },
} as const;

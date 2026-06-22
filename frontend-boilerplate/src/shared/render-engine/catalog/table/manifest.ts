/**
 * Manifesto do bloco `table` — dados tabulares crus (shape 'table').
 * Alinhado a @dashboards/contracts.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'table',
  kind: 'chart',
  name: 'Tabela',
  description: 'Dados tabulares crus com colunas tipadas.',
  source: 'vitrine:data-table',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      pageSize: { type: 'integer', minimum: 1 },
      dense: { type: 'boolean' },
    },
  },
  dataContract: {
    shape: 'table',
    spec: {
      columns: { type: 'array', required: true },
      rows: { type: 'array', required: true },
    },
    example: {
      columns: [
        { key: 'municipio', label: 'Município', type: 'string' },
        { key: 'valor', label: 'Valor', type: 'number' },
      ],
      rows: [{ municipio: 'Centro', valor: 1000 }],
    },
  },
  defaultProps: { pageSize: 10 },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;

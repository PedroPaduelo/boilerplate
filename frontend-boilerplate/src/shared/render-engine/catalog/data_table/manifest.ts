/**
 * Manifesto do bloco `data_table` (shape 'table') — tabela rica com busca,
 * ordenação e paginação. Usa o Vitrine `DataTable` (@tanstack/react-table).
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'data_table',
  kind: 'chart',
  name: 'Tabela Rica',
  description: 'Tabela com busca, ordenação e paginação (colunas tipadas). Para datasets tabulares.',
  source: 'vitrine:data-table',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      pageSize: { type: 'integer', minimum: 1 },
      filterPlaceholder: { type: 'string' },
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
  defaultProps: { pageSize: 5 },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;

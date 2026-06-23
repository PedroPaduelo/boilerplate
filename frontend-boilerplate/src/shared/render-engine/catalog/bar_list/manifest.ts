/**
 * Manifesto do bloco `bar_list` (shape 'categorical') — ranking "Top N". Usa o
 * Vitrine `BarListTremor`. Cada categoria vira uma linha com barra proporcional.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'bar_list',
  kind: 'chart',
  name: 'Lista de Barras (ranking)',
  description: 'Ranking de categorias (Top N) — barra proporcional ao valor, ordenada.',
  source: 'vitrine:bar-list-tremor',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      sortOrder: { type: 'string', enum: ['ascending', 'descending', 'none'] },
    },
  },
  dataContract: {
    shape: 'categorical',
    spec: {
      label: { type: 'category', required: true },
      value: { type: 'number', required: true },
    },
    example: [
      { label: 'IPTU', value: 4200 },
      { label: 'ISS', value: 3100 },
    ],
  },
  defaultProps: { sortOrder: 'descending' },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;

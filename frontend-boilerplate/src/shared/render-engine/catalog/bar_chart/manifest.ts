/**
 * Manifesto do bloco `bar_chart` — compara valores entre categorias
 * (shape 'series', x categórico). Alinhado a @dashboards/contracts.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'bar_chart',
  kind: 'chart',
  name: 'Gráfico de Barras',
  description: 'Compara valores entre categorias.',
  source: 'vitrine:bar-chart',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      stacked: { type: 'boolean' },
      orientation: { type: 'string', enum: ['vertical', 'horizontal'] },
      accent: { type: 'string' },
    },
  },
  dataContract: {
    shape: 'series',
    spec: {
      x: { type: 'category', required: true },
      y: { type: 'number', required: true },
      series: { type: 'category', required: false },
    },
    example: [
      { x: 'Jan', y: 120 },
      { x: 'Fev', y: 90 },
    ],
  },
  defaultProps: { orientation: 'vertical', stacked: false },
  minColumns: 1,
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;

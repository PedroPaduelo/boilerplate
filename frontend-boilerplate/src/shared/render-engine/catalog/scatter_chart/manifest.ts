/**
 * Manifesto do bloco `scatter_chart` (shape 'series', x/y numéricos) —
 * dispersão. Usa o Vitrine `ScatterChartTremor` (recharts). `series` separa as
 * categorias (cores).
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'scatter_chart',
  kind: 'chart',
  name: 'Dispersão (scatter)',
  description: 'Correlação entre duas variáveis numéricas (x × y); `series` colore por categoria.',
  source: 'vitrine:scatter-chart-tremor',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      showLegend: { type: 'boolean' },
      showGridLines: { type: 'boolean' },
    },
  },
  dataContract: {
    shape: 'series',
    spec: {
      x: { type: 'number', required: true },
      y: { type: 'number', required: true },
      series: { type: 'category', required: false },
    },
    example: [
      { x: 12, y: 40, series: 'Zona A' },
      { x: 28, y: 55, series: 'Zona B' },
    ],
  },
  defaultProps: { showLegend: true, showGridLines: true },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;

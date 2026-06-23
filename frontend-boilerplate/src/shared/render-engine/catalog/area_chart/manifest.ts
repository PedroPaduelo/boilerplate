/**
 * Manifesto do bloco `area_chart` (shape 'series', x temporal) — usa o Vitrine
 * `AreaChartTremor` (recharts). Suporta múltiplas séries (campo `series`).
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'area_chart',
  kind: 'chart',
  name: 'Gráfico de Área',
  description: 'Série temporal preenchida; mostra volume/tendência ao longo do tempo (suporta múltiplas séries).',
  source: 'vitrine:area-chart-tremor',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: { type: 'string', enum: ['default', 'stacked', 'percent'] },
      fill: { type: 'string', enum: ['gradient', 'solid', 'none'] },
      showLegend: { type: 'boolean' },
      showGridLines: { type: 'boolean' },
    },
  },
  dataContract: {
    shape: 'series',
    spec: {
      x: { type: 'temporal', required: true },
      y: { type: 'number', required: true },
      series: { type: 'category', required: false },
    },
    example: [
      { x: '2026-01', y: 120, series: 'Receita' },
      { x: '2026-01', y: 80, series: 'Despesa' },
    ],
  },
  defaultProps: { type: 'default', fill: 'gradient', showLegend: true, showGridLines: true },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;

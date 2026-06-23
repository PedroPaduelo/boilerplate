/**
 * Manifesto do bloco `spark_chart` (shape 'series') — minigráfico de tendência
 * (sparkline). Usa o Vitrine `SparkChartTremor`. Consome só os valores `y`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'spark_chart',
  kind: 'chart',
  name: 'Sparkline',
  description: 'Minigráfico de tendência (sem eixos) — ótimo ao lado de um KPI.',
  source: 'vitrine:spark-chart-tremor',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: { type: 'string', enum: ['area', 'bar', 'line'] },
      curveType: { type: 'string', enum: ['linear', 'monotone', 'step'] },
      // ENTREGA 3: prop de palette — sparkline é single-série por natureza
      // (um único valor de tendência); multi/none ficam disponíveis pro schema.
      palette: { type: 'string', enum: ['single', 'multi', 'none'], default: 'single' },
    },
  },
  dataContract: {
    shape: 'series',
    spec: {
      x: { type: 'category', required: false },
      y: { type: 'number', required: true },
    },
    example: [
      { x: '1', y: 5 },
      { x: '2', y: 8 },
    ],
  },
  defaultProps: { type: 'area', curveType: 'monotone', palette: 'single' },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;
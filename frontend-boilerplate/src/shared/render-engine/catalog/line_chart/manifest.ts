/**
 * Manifesto do bloco `line_chart` — série temporal (shape 'series', x temporal).
 * Alinhado a @dashboards/contracts.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'line_chart',
  kind: 'chart',
  name: 'Gráfico de Linhas',
  description: 'Série temporal: evolução de um valor ao longo do tempo.',
  source: 'vitrine:line-chart',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      smooth: { type: 'boolean' },
      area: { type: 'boolean' },
      // ENTREGA 3: prop de palette — line chart já aceita multi-série
      // (campo `series` no dataContract); `multi` é o default natural.
      palette: { type: 'string', enum: ['single', 'multi', 'none'], default: 'multi' },
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
      { x: '2026-01', y: 12 },
      { x: '2026-02', y: 18 },
    ],
  },
  defaultProps: { smooth: true, area: true, palette: 'multi' },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;
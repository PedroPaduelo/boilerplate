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
      // ENTREGA 3: prop de palette — scatter já suporta `series` no dataContract;
      // `multi` é o default natural (cor por categoria), `single` colapsa tudo
      // numa cor só, `none` desativa a cor.
      palette: { type: 'string', enum: ['single', 'multi', 'none'], default: 'multi' },
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
  defaultProps: { showLegend: true, showGridLines: true, palette: 'multi' },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;
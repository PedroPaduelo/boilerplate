/**
 * Manifesto do bloco `h_bar_chart` (shape 'series', x categórico) — barras
 * HORIZONTAIS. Usa o Vitrine `HBarChart`. Bom para comparar poucas categorias
 * com rótulos longos.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'h_bar_chart',
  kind: 'chart',
  name: 'Barras Horizontais',
  description: 'Compara valores entre categorias em barras horizontais (rótulos longos cabem melhor).',
  source: 'vitrine:h-bar-chart',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // ENTREGA 3: prop de palette — prepara o terreno para multi-série
      // (dataContract atual não tem `series`, mas se o usuário setar `multi`
      // e a query entregar, o componente pode ciclar a PALETTE depois).
      palette: { type: 'string', enum: ['single', 'multi', 'none'], default: 'single' },
    },
  },
  dataContract: {
    shape: 'series',
    spec: {
      x: { type: 'category', required: true },
      y: { type: 'number', required: true },
    },
    example: [
      { x: 'Centro', y: 1200 },
      { x: 'Norte', y: 980 },
    ],
  },
  defaultProps: { palette: 'single' },
  minColumns: 1,
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;
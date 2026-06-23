/**
 * Manifesto do bloco `bar_chart` — compara valores entre categorias
 * (shape 'series', x categórico). Alinhado a @dashboards/contracts.
 *
 * Props de COR: `accent` é um enum FECHADO da paleta do DS (chart-1..5 +
 * primary) — validado pelo schema, sem string solta. Helper:
 * `frontend-boilerplate/src/shared/render-engine/lib/accent.ts`.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

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
      // COR — enum fechado da paleta do DS (ver `lib/accent.ts`).
      accent: { type: 'string', enum: [...ACCENT_COLORS], default: 'chart-1' },
      // Modo de paleta (Turno 6 — multi IMPLEMENTADO via BarChartDatum.barClassName
      // e, quando orientation="horizontal", HBarChartDatum.barClassName).
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'single',
        description: 'Modo de paleta: "single" (default) = TODAS as barras com a mesma cor (accent); "multi" = cicla chart-1..5 por item (helper paletteClass(i) via BarChartDatum.barClassName / HBarChartDatum.barClassName); "none" = sem distinção (mesmo comportamento de "single").',
      },
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
  defaultProps: { orientation: 'vertical', stacked: false, accent: 'chart-1', palette: 'single' },
  minColumns: 1,
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;
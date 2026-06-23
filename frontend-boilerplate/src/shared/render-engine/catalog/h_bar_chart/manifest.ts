/**
 * Manifesto do bloco `h_bar_chart` (shape 'series', x categórico) — barras
 * HORIZONTAIS. Usa o Vitrine `HBarChart`. Bom para comparar poucas categorias
 * com rótulos longos.
 *
 * Props de COR: `accent` aceita enum DS + classe Tailwind + cor CSS (resolvido
 * em runtime por `resolveAccent` no component.tsx).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

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
      // Modo de paleta (Turno 6 — multi IMPLEMENTADO via HBarChartDatum.barClassName).
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'single',
        description: 'Modo de paleta: "single" (default) = TODAS as barras com a mesma cor (accent); "multi" = cicla chart-1..5 por item (helper paletteClass(i) via HBarChartDatum.barClassName); "none" = sem distinção (default do UI base).',
      },
      // COR — string livre; resolveAccent() decide se vira classe Tailwind
      // (chart-N, primary, bg-purple-500) ou style.background (#hex, rgb(),
      // gradient, oklch(), var(--chart-1)).
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description: 'Cor base da barra (só usado em palette="single"). Aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500), ou cor CSS (#40E0D0, rgb(), linear-gradient(), var(--chart-1)).',
      },
      // Formatter do valor exibido no rótulo lateral + tooltip.
      valueFormatter: {
        type: 'string',
        description: 'Formatter opcional (nome de função serializado) do valor exibido no rótulo lateral + tooltip. Default interno: formatCompactNumberBR (ex.: "2,6 mil").',
      },
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
  defaultProps: { palette: 'single', accent: 'chart-1' },
  minColumns: 1,
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;
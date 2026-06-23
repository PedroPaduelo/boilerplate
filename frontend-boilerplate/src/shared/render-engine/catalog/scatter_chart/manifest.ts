/**
 * Manifesto do bloco `scatter_chart` (shape 'series', x/y numéricos) —
 * dispersão. Usa o Vitrine `ScatterChartTremor` (recharts). `series` separa as
 * categorias (cores).
 *
 * Props de COR: `accent` aceita enum DS + classe Tailwind + cor CSS (resolvido
 * em runtime por `resolveAccent`/`resolveAccentForStroke` no component.tsx).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

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
      // Exibe legenda clicável acima do chart.
      showLegend: {
        type: 'boolean',
        default: true,
        description: 'Exibe legenda clicável acima do chart (uma bolinha por categoria, com clique para dim das outras).',
      },
      // Exibe linhas de grade (horizontais + verticais).
      showGridLines: {
        type: 'boolean',
        default: true,
        description: 'Exibe linhas de grade horizontais e verticais tracejadas.',
      },
      // Modo de paleta — scatter já suporta `series` no dataContract.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'multi',
        description: 'Modo de paleta: "multi" (default) = cicla chart-1..5 por categoria; "single" = força accent em todas (1 cor); "none" = sem distinção (usa a palette cíclica padrão).',
      },
      // COR — string livre; resolveAccent() decide se vira classe Tailwind
      // (chart-N, primary, bg-purple-500) ou style.stroke (#hex, rgb(),
      // gradient, oklch(), var(--chart-1)).
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description: 'Cor ÚNICA aplicada a TODAS as categorias (vence palette cíclica). Aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500), ou cor CSS (#40E0D0, rgb(), linear-gradient(), var(--chart-1)).',
      },
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
  defaultProps: { showLegend: true, showGridLines: true, palette: 'multi', accent: 'chart-1' },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;
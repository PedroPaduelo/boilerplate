/**
 * Manifesto do bloco `line_chart` — série temporal (shape 'series', x temporal).
 * Alinhado a @dashboards/contracts.
 *
 * Props de COR: `accent` aceita enum DS + classe Tailwind + cor CSS (resolvido
 * em runtime por `resolveAccent`/`resolveAccentForStroke` no component.tsx).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

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
      // Suaviza a curva entre pontos (cosmético — sem efeito na versão SVG atual).
      smooth: {
        type: 'boolean',
        description: 'Suaviza a curva entre pontos (placeholder cosmético; a versão SVG atual usa polylines retas).',
      },
      // Preenche área abaixo de cada linha (além do traço).
      area: {
        type: 'boolean',
        default: true,
        description: 'Se true, preenche área abaixo de cada linha além do traço.',
      },
      // Modo de paleta — line chart já aceita multi-série nativamente.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'multi',
        description: 'Modo de paleta: "multi" (default) = cicla chart-1..5 por série; "single" = força accent em todas; "none" = sem distinção de cor.',
      },
      // COR — string livre; resolveAccent() decide se vira classe Tailwind
      // (chart-N, primary, bg-purple-500) ou style.stroke (#hex, rgb(),
      // gradient, oklch(), var(--chart-1)).
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description: 'Cor base da(s) série(s). Aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500), ou cor CSS (#40E0D0, rgb(), linear-gradient(), var(--chart-1)). Aplicada como stroke via classe Tailwind ou style.stroke quando CSS custom.',
      },
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
  defaultProps: { smooth: true, area: true, palette: 'multi', accent: 'chart-1' },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;
/**
 * Manifesto do bloco `donut` — distribuição de um total entre categorias
 * (shape 'categorical'). Alinhado a @dashboards/contracts.
 *
 * Props de COR: `accent` aceita enum DS + classe Tailwind + cor CSS (resolvido
 * em runtime por `resolveAccent`/`resolveAccentForStroke` no component.tsx).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'donut',
  kind: 'chart',
  name: 'Donut',
  description: 'Distribuição de um total entre categorias (label + value).',
  source: 'vitrine:donut-chart',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Exibe legenda à direita (uma linha por categoria com bolinha, valor e %).
      showLegend: {
        type: 'boolean',
        default: true,
        description: 'Exibe legenda clicável à direita (uma linha por categoria com bolinha, valor absoluto e percentual).',
      },
      // Rótulo exibido no centro do donut quando NÃO há hover (ex.: "Total").
      centerLabel: {
        type: 'string',
        description: 'Rótulo exibido no centro do donut quando NÃO há hover em nenhum segmento. Default: "Total".',
      },
      // Modo de paleta — donut cicla nativamente; `single` colapsa tudo em
      // uma cor (accent), `multi` cicla chart-1..5, `none` = paleta padrão.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'single',
        description: 'Modo de paleta: "single" (default) = TODAS as fatias com a mesma cor (accent); "multi" = cicla chart-1..5 por categoria; "none" = sem distinção (usa a palette cíclica padrão).',
      },
      // COR — string livre; resolveAccent() decide se vira classe Tailwind
      // (chart-N, primary, stroke-purple-500) ou style.stroke (#hex, rgb(),
      // gradient, oklch(), var(--chart-1)).
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description: 'Cor base aplicada aos segmentos (só usado em palette="single"). Aceita enum DS (chart-1..5, primary), classe Tailwind (stroke-purple-500), ou cor CSS (#40E0D0, rgb(), linear-gradient(), var(--chart-1)).',
      },
    },
  },
  dataContract: {
    shape: 'categorical',
    spec: {
      label: { type: 'category', required: true },
      value: { type: 'number', required: true },
    },
    example: [
      { label: 'Quitado', value: 62 },
      { label: 'Em aberto', value: 38 },
    ],
  },
  defaultProps: { showLegend: true, palette: 'single', accent: 'chart-1' },
  version: '1.0.0',
} satisfies BlockManifest;
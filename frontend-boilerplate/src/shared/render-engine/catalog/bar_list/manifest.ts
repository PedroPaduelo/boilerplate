/**
 * Manifesto do bloco `bar_list` (shape 'categorical') — ranking "Top N". Usa o
 * Vitrine `BarListTremor`. Cada categoria vira uma linha com barra proporcional.
 *
 * Props de COR: `accent` aceita enum DS + classe Tailwind + cor CSS (resolvido
 * em runtime por `resolveAccent` no component.tsx).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'bar_list',
  kind: 'chart',
  name: 'Lista de Barras (ranking)',
  description: 'Ranking de categorias (Top N) — barra proporcional ao valor, ordenada.',
  source: 'vitrine:bar-list-tremor',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Ordem de exibição dos itens.
      sortOrder: {
        type: 'string',
        enum: ['ascending', 'descending', 'none'],
        default: 'descending',
        description: 'Ordem de exibição dos itens: "descending" (default, maior primeiro), "ascending" (menor primeiro) ou "none" (preserva a ordem do dataset).',
      },
      // Modo de paleta — bar_list categórica é single-série por natureza.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'single',
        description: 'Modo de paleta: "single" (default) = TODAS as barras com a mesma cor (accent); "multi" = cicla chart-1..5 por item; "none" = sem distinção (usa o default do UI base).',
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
    },
  },
  dataContract: {
    shape: 'categorical',
    spec: {
      label: { type: 'category', required: true },
      value: { type: 'number', required: true },
    },
    example: [
      { label: 'IPTU', value: 4200 },
      { label: 'ISS', value: 3100 },
    ],
  },
  defaultProps: { sortOrder: 'descending', palette: 'single', accent: 'chart-1' },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;
/**
 * Manifesto do bloco `area_chart` (shape 'series', x temporal) — usa o Vitrine
 * `AreaChartTremor` (recharts). Suporta múltiplas séries (campo `series`).
 *
 * Props de COR: `accent` aceita enum DS + classe Tailwind + cor CSS (resolvido
 * em runtime por `resolveAccentForStroke` no component.tsx).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'area_chart',
  kind: 'chart',
  name: 'Gráfico de Área',
  description: 'Série temporal preenchida; mostra volume/tendência ao longo do tempo (suporta múltiplas séries).',
  source: 'vitrine:area-chart-tremor',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Modo de composição das áreas.
      type: {
        type: 'string',
        enum: ['default', 'stacked', 'percent'],
        default: 'default',
        description: 'Composição das áreas: "default" (sobrepostas, cada série da baseline ao valor), "stacked" (empilhadas) ou "percent" (100% normalizado).',
      },
      // Estilo de preenchimento da área.
      fill: {
        type: 'string',
        enum: ['gradient', 'solid', 'none'],
        default: 'gradient',
        description: 'Preenchimento da área: "gradient" (cor da série → transparente), "solid" (cor opaca com 25% alpha) ou "none" (só a linha de topo).',
      },
      // Exibe legenda clicável abaixo do SVG.
      showLegend: {
        type: 'boolean',
        default: true,
        description: 'Exibe bloco de legenda clicável abaixo do SVG (uma bolinha por série + rótulo).',
      },
      // Exibe linhas de grade horizontais tracejadas.
      showGridLines: {
        type: 'boolean',
        default: true,
        description: 'Exibe linhas de grade horizontais tracejadas (alinhadas aos ticks do eixo Y).',
      },
      // Modo de paleta — area chart já aceita multi-série nativamente.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'multi',
        description: 'Modo de paleta: "multi" (default) = cicla chart-1..5 por série; "single" = força accent em todas; "none" = sem distinção de cor.',
      },
      // COR — string livre; resolveAccentForStroke() decide se vira classe
      // Tailwind (chart-N, primary, bg-purple-500) ou style.stroke (#hex,
      // rgb(), gradient, oklch(), var(--chart-1)).
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description: 'Cor base da(s) série(s). Aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500), ou cor CSS (#40E0D0, rgb(), linear-gradient(), var(--chart-1)). Aplicada como stroke/fill via classe Tailwind ou style.stroke quando CSS custom.',
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
      { x: '2026-01', y: 120, series: 'Receita' },
      { x: '2026-01', y: 80, series: 'Despesa' },
    ],
  },
  defaultProps: {
    type: 'default',
    fill: 'gradient',
    showLegend: true,
    showGridLines: true,
    palette: 'multi',
    accent: 'chart-1',
  },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;
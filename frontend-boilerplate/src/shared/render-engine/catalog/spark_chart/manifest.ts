/**
 * Manifesto do bloco `spark_chart` (shape 'series') — minigráfico de tendência
 * (sparkline). Usa o Vitrine `SparkChartTremor`. Consome só os valores `y`.
 *
 * Props de COR: `accent` aceita enum DS + classe Tailwind + cor CSS (resolvido
 * em runtime por `resolveAccent` no component.tsx).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'spark_chart',
  kind: 'chart',
  name: 'Sparkline',
  description: 'Minigráfico de tendência (sem eixos) — ótimo ao lado de um KPI.',
  source: 'vitrine:spark-chart-tremor',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Variante do spark (área, barra ou linha).
      type: {
        type: 'string',
        enum: ['area', 'bar', 'line'],
        default: 'area',
        description: 'Variante do spark chart: "area" (default, com gradiente), "bar" (colunas) ou "line" (linha sem preenchimento).',
      },
      // Tipo de curva para area/line.
      curveType: {
        type: 'string',
        enum: ['linear', 'monotone', 'step'],
        default: 'monotone',
        description: 'Curva usada em type="area" e type="line": "linear" (reta entre pontos), "monotone" (suavizada sem overshoot) ou "step" (degraus).',
      },
      // Modo de paleta — spark é single-série por natureza.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'single',
        description: 'Modo de paleta: "single" (default) = 1 cor (accent); "multi" = cicla chart-1..5; "none" = sem distinção (default do DS).',
      },
      // COR — string livre; resolveAccent() decide se vira classe Tailwind
      // (chart-N, primary, bg-purple-500) ou style.color (#hex, rgb(),
      // gradient, oklch(), var(--chart-1)).
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description: 'Cor ÚNICA da série (spark é single-série por natureza). Aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500), ou cor CSS (#40E0D0, rgb(), linear-gradient(), var(--chart-1)).',
      },
    },
  },
  dataContract: {
    shape: 'series',
    spec: {
      x: { type: 'category', required: false },
      y: { type: 'number', required: true },
    },
    example: [
      { x: '1', y: 5 },
      { x: '2', y: 8 },
    ],
  },
  defaultProps: { type: 'area', curveType: 'monotone', palette: 'single', accent: 'chart-1' },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;
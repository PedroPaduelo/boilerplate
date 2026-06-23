/**
 * Manifesto do bloco `signal_card` (shape 'series') — KPI compacto com o último
 * valor da série em destaque, mini-sparkline e badge de tendência. Usa o
 * Vitrine `SignalCard`.
 *
 * Props (REESCRITAS — alinhadas ao padrão canônico do catálogo):
 *  - `valueFormat` (ENUM FECHADO): formato PT-BR do valor em destaque,
 *    resolvido por `formatValueByEnum()` de `format.ts`. Substitui o antigo
 *    `unit` (string livre) + `toLocaleString` cru (ilegível em bi/mi). Default
 *    `'compactNumber'` (o sinal costuma ser uma métrica adimensional, ex.:
 *    p95, throughput; quem quer moeda escolhe `BRL`/`compactBRL`).
 *  - `accent` (enum DS + classe Tailwind + cor CSS): cor do TRAÇO da sparkline
 *    (resolvido por `resolveAccentForStroke()` no component.tsx — pinta o
 *    traço/preenchimento da série, NUNCA o fundo do card). Default `'chart-1'`.
 *  - `trendPolarity` (`up-good`/`up-bad`): se subir é bom (verde) ou ruim
 *    (vermelho).
 *  - `trendBasis` (`first-vs-last`/`prev-vs-last`): base do cálculo da
 *    tendência. `prev-vs-last` (default) = último vs penúltimo (variação mais
 *    recente, correta); `first-vs-last` = último vs primeiro (variação no
 *    período inteiro).
 *  - `showSparkline` (boolean): mostra/esconde o mini-gráfico. Default `true`.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';
import { VALUE_FORMATS } from '@/shared/lib/format';

export const manifest = {
  type: 'signal_card',
  kind: 'chart',
  name: 'Signal Card',
  description: 'KPI com mini-sparkline e tendência. Recebe uma série; destaca o último valor.',
  source: 'vitrine:signal-card',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      label: {
        type: 'string',
        default: 'Sinal',
        description: 'Rótulo curto do sinal exibido acima do valor (ex.: "Latência p95", "Arrecadação").',
      },
      // (valueFormat) ENUM FECHADO — formato PT-BR do valor em destaque.
      // Cada valor casa 1:1 com um helper de `format.ts` via
      // `formatValueByEnum()`. O `oneOf` documenta cada opção pro MCP/IA.
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'compactNumber',
        description: 'Formato PT-BR do valor em destaque (último ponto da série). ENUM FECHADO (sem input livre). Default "compactNumber".',
        oneOf: [
          { const: 'BRL',           description: 'formatBRL — moeda BRL completa (ex.: "R$ 2.609.946.157,73").' },
          { const: 'compactBRL',    description: 'formatCompactBRL — moeda BRL compacta (ex.: "R$ 2,61 bi").' },
          { const: 'number',        description: 'formatNumberBR — número PT-BR com milhar (ex.: "1.234.567,8").' },
          { const: 'compactNumber', description: 'formatCompactNumberBR — número compacto (ex.: "2,61 bi"). DEFAULT.' },
          { const: 'percent',       description: 'formatPercentBR — percentual a partir de FRAÇÃO (ex.: 0.125 → "12,5%").' },
        ],
      },
      // COR DA SÉRIE — string livre; resolveAccentForStroke() decide se vira
      // classe Tailwind (stroke-chart-N) ou style.stroke (#hex, rgb(),
      // gradient). Pinta o TRAÇO/preenchimento da sparkline, nunca o fundo.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description: 'Cor da sparkline (pinta o traço/preenchimento, NÃO o fundo). Aceita enum DS (chart-1..5, primary), classe Tailwind (stroke-purple-500), ou cor CSS (#40E0D0, rgb(), var(--chart-1)).',
      },
      // Polaridade da tendência: define a COR do badge (verde/vermelho).
      trendPolarity: {
        type: 'string',
        enum: ['up-good', 'up-bad'],
        default: 'up-good',
        description: 'Direção considerada "boa": "up-good" (subir = verde, padrão) ou "up-bad" (subir = vermelho, ex.: latência/erro).',
      },
      // Base do cálculo da tendência.
      trendBasis: {
        type: 'string',
        enum: ['first-vs-last', 'prev-vs-last'],
        default: 'prev-vs-last',
        description: 'Base do cálculo da tendência: "prev-vs-last" (default) = último vs penúltimo (variação mais recente); "first-vs-last" = último vs primeiro (variação no período inteiro).',
      },
      // Mostra/esconde a mini-sparkline.
      showSparkline: {
        type: 'boolean',
        default: true,
        description: 'Mostra (true, default) ou esconde (false) a mini-sparkline abaixo do valor.',
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
      { x: '1', y: 48 },
      { x: '2', y: 62 },
    ],
  },
  defaultProps: {
    label: 'Sinal',
    valueFormat: 'compactNumber',
    accent: 'chart-1',
    trendPolarity: 'up-good',
    trendBasis: 'prev-vs-last',
    showSparkline: true,
  },
  maxRows: 1000,
  version: '1.0.0',
} satisfies BlockManifest;

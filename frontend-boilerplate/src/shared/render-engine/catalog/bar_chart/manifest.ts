/**
 * Manifesto do bloco `bar_chart` — compara valores entre categorias
 * (shape 'series', x categórico, `series` opcional p/ multi-série).
 * Alinhado a @dashboards/contracts.
 *
 * Props de COR: `accent` aceita enum DS + classe Tailwind + cor CSS (resolvido
 * em runtime por `resolveAccent` no component.tsx). `seriesColors` permite cor
 * MANUAL por série (ENTREGA 3). `palette` controla o modo automático.
 *
 * Prop `valueFormat` (ENTREGA 4): ENUM FECHADO com 5 valores canônicos do DS,
 * cada um casa 1:1 com um helper de `format.ts` via `formatValueByEnum()`.
 *
 * TODAS as props têm `description` completa — o MCP lê este schema p/ instruir
 * a IA na montagem de dashboards.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';
import { VALUE_FORMATS } from '@/shared/lib/format';

export const manifest = {
  type: 'bar_chart',
  kind: 'chart',
  name: 'Gráfico de Barras',
  description:
    'Compara valores entre categorias em barras verticais (colunas) ou horizontais. Suporta empilhamento (stacked) quando os dados têm múltiplas séries (campo `series`).',
  source: 'vitrine:bar-chart',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // (ENTREGA 1) Empilhamento.
      stacked: {
        type: 'boolean',
        default: false,
        description:
          'Empilha as séries em cada coluna (requer dados MULTI-SÉRIE: pontos com o campo `series`). true = cada categoria do eixo X vira uma coluna com segmentos empilhados, um por série. false = barras planas (1 barra por ponto). LIMITAÇÃO: só vale na orientação "vertical"; em "horizontal" o empilhamento é ignorado (barras planas), mas a cor por série é preservada. Se não houver dados multi-série, degrada para barras planas.',
      },
      orientation: {
        type: 'string',
        enum: ['vertical', 'horizontal'],
        default: 'vertical',
        description:
          'Orientação das barras: "vertical" (colunas, default) ou "horizontal" (barras deitadas — bom para rótulos longos). O empilhamento (stacked) só funciona na vertical.',
      },
      // COR base — string livre; resolveAccent() decide se vira classe Tailwind
      // ou style.background. Em palette:'multi' é IGNORADO.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description:
          'Cor base das barras (usado em palette="single"). Aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500) ou cor CSS (#40E0D0, rgb(), linear-gradient(), var(--chart-1)). Em palette="multi" é IGNORADO (a paleta cíclica do DS vence).',
      },
      // Modo de paleta automática.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'single',
        description:
          'Modo de paleta AUTOMÁTICA: "single" (default) = todas as barras/séries com a mesma cor (accent); "multi" = cicla chart-1..5 por série/barra (accent custom é ignorado); "none" = sem cor (default do UI base). Sobrescrito por `seriesColors` quando este é fornecido.',
      },
      // (ENTREGA 3) Cor MANUAL por série — configurável, NÃO automático.
      seriesColors: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Cor por série, na ORDEM (índice 0 = primeira série, 1 = segunda, etc.). Cada item aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500) ou cor CSS (#40E0D0, rgb(), linear-gradient()). SOBRESCREVE a palette automática para aquela série. Se omitido, usa `palette` (multi cicla chart-1..5, single usa accent). Use principalmente com stacked=true para fixar manualmente a cor de cada série empilhada.',
      },
      // (ENTREGA 4) valueFormat — ENUM FECHADO, default 'compactBRL'.
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'compactBRL',
        description:
          'Formato PT-BR do valor exibido no topo da barra/coluna + tooltip. ENUM FECHADO (sem input livre): BRL, compactBRL, number, compactNumber, percent.',
        oneOf: [
          { const: 'BRL',           description: 'formatBRL — moeda BRL completa (ex.: "R$ 2.609.946.157,73").' },
          { const: 'compactBRL',    description: 'formatCompactBRL — moeda BRL compacta (ex.: "R$ 2,61 bi"). DEFAULT.' },
          { const: 'number',        description: 'formatNumberBR — número PT-BR com milhar (ex.: "1.234.567,8").' },
          { const: 'compactNumber', description: 'formatCompactNumberBR — número compacto (ex.: "2,61 bi").' },
          { const: 'percent',       description: 'formatPercentBR — percentual a partir de FRAÇÃO (ex.: 0.125 → "12,5%").' },
        ],
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
      { x: 'Jan', y: 120, series: 'Receita' },
      { x: 'Jan', y: 95, series: 'Despesa' },
      { x: 'Fev', y: 138, series: 'Receita' },
      { x: 'Fev', y: 110, series: 'Despesa' },
    ],
  },
  defaultProps: {
    orientation: 'vertical',
    stacked: false,
    accent: 'chart-1',
    palette: 'single',
    valueFormat: 'compactBRL',
  },
  minColumns: 1,
  maxRows: 5000,
  version: '1.1.0',
} satisfies BlockManifest;

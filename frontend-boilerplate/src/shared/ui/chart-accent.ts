/**
 * COMPONENTE PRÓPRIO — é uma REGRA de tradução de cor, não um visual.
 *
 * Os `manifest.ts` do render-engine são CONTRATO com o backend e com o agente
 * (o catálogo é gerado a partir deles), então a prop `accent` precisa continuar
 * aceitando o vocabulário histórico: enum antigo (`chart-1`…`chart-5`,
 * `primary`), classe utilitária (`bg-purple-500`, `stroke-emerald-400`) e até
 * cor CSS crua (`#40E0D0`, `rgb(...)`, `var(--chart-1)`). Nada disso pode
 * chegar a um gráfico: a cor de dado do app sai SEMPRE de token do DS
 * (`--color-data-*`, via `useChartPalette`).
 *
 * Este módulo é essa fronteira — entra string legada, sai cor categórica do DS
 * (ou `undefined`, que significa "siga a paleta"). Uma cor crua nunca é
 * repassada: se não dá para reconhecer o matiz, o gráfico cai na paleta, que é
 * sempre acessível e tematizada.
 *
 * Mora em `shared/ui` (e não dentro de um bloco) porque dezesseis blocos do
 * catálogo fazem a MESMA tradução; duplicada, ela divergiria na primeira
 * correção.
 */
import type { CardProps } from '@astryxdesign/core/Card';
import { CHART_SERIES_COLORS, type ChartSeriesColor } from './charts';

/** Variante de cor do `Card` do DS — usada por KPI, ladrilho e métrica. */
export type ChartAccentCardVariant = NonNullable<CardProps['variant']>;

/**
 * Enum de acento antigo → cor categórica do DS. A ordem espelha a da paleta
 * (`CHART_SERIES_COLORS`), então `chart-1` continua sendo a primeira cor de
 * série, `chart-2` a segunda, e assim por diante: um painel salvo antes da
 * migração mantém a MESMA leitura relativa entre blocos.
 */
const LEGACY_ACCENT: Record<string, ChartSeriesColor> = {
  'chart-1': 'blue',
  'chart-2': 'orange',
  'chart-3': 'purple',
  'chart-4': 'green',
  'chart-5': 'pink',
  // `primary` era a cor de marca do tema legado; a de destaque do DS é a
  // primeira categórica.
  primary: 'blue',
};

/**
 * Matiz de classe utilitária → cor categórica do DS mais próxima. Cobre os
 * nomes que apareciam nos painéis (`emerald`, `rose`, `violet`…) para que um
 * `bg-emerald-500` salvo continue verde, e não caia na paleta em silêncio.
 */
const LEGACY_HUE: Record<string, ChartSeriesColor> = {
  blue: 'blue',
  sky: 'cyan',
  cyan: 'cyan',
  teal: 'teal',
  emerald: 'green',
  green: 'green',
  lime: 'green',
  yellow: 'orange',
  amber: 'orange',
  orange: 'orange',
  red: 'red',
  rose: 'red',
  pink: 'pink',
  fuchsia: 'pink',
  purple: 'purple',
  violet: 'purple',
  indigo: 'indigo',
  brown: 'brown',
};

/** Variantes de cor que o `Card` do DS aceita (as demais são semânticas). */
const CARD_COLOR_VARIANTS = new Set<string>([
  'blue',
  'cyan',
  'gray',
  'green',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'yellow',
]);

/** Prefixos utilitários do vocabulário antigo, removidos antes de traduzir. */
const UTILITY_PREFIX = /^(bg|text|stroke|fill|border|from|to|via)-/;

/**
 * Reduz a string a um matiz comparável: tira `var(--x)`, prefixo utilitário e
 * o degrau numérico (`-500`), e normaliza caixa/espaços.
 */
function normalizeAccent(accent: string): string {
  return accent
    .trim()
    .toLowerCase()
    .replace(/^var\(\s*--/, '')
    .replace(/\)$/, '')
    .replace(UTILITY_PREFIX, '')
    .replace(/\/\d+$/, '')
    .replace(/-\d{2,3}$/, '');
}

/**
 * Traduz um valor de `accent` para uma cor categórica do DS.
 *
 * Devolve `undefined` quando o valor não descreve um matiz reconhecível (cor
 * crua, gradiente, string vazia) — o chamador então deixa o gráfico ciclar a
 * paleta, que é o comportamento seguro.
 *
 * @example
 * chartAccentColor('chart-3');        // 'purple'
 * chartAccentColor('bg-emerald-500'); // 'green'
 * chartAccentColor('#40E0D0');        // undefined → paleta do DS
 */
export function chartAccentColor(
  accent: string | null | undefined,
): ChartSeriesColor | undefined {
  if (typeof accent !== 'string' || accent.trim() === '') return undefined;

  const key = normalizeAccent(accent);
  if (key === '') return undefined;
  if (LEGACY_ACCENT[key]) return LEGACY_ACCENT[key];
  if (LEGACY_HUE[key]) return LEGACY_HUE[key];
  // Já é o nome de uma cor do DS (`blue`, `teal`…) — aceita direto.
  return (CHART_SERIES_COLORS as readonly string[]).includes(key)
    ? (key as ChartSeriesColor)
    : undefined;
}

/**
 * Traduz um `accent` para a variante de COR do `Card` do DS — o jeito
 * suportado de categorizar um card (KPI, ladrilho, métrica) sem pintar borda
 * ou faixa à mão.
 *
 * Devolve `undefined` quando não há variante equivalente: o card fica no visual
 * padrão, que é o correto para um indicador sem categoria.
 */
export function chartAccentCardVariant(
  accent: string | null | undefined,
): ChartAccentCardVariant | undefined {
  const color = chartAccentColor(accent);
  return color && CARD_COLOR_VARIANTS.has(color)
    ? (color as ChartAccentCardVariant)
    : undefined;
}

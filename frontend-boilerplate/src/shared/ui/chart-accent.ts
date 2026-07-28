/**
 * COMPONENTE PRÓPRIO — é uma REGRA de tradução de cor, não um visual.
 *
 * Os `manifest.ts` do render-engine são CONTRATO com o backend e com o agente
 * (o catálogo é gerado a partir deles), então a prop `accent` precisa continuar
 * aceitando o vocabulário histórico: enum antigo (`chart-1`…`chart-5`,
 * `primary`), classe utilitária (`bg-purple-500`, `stroke-emerald-400`) e até
 * cor CSS crua (`#40E0D0`, `rgb(...)`, `var(--chart-1)`). Nada disso pode
 * chegar a um gráfico: a cor de dado do app sai SEMPRE de token do DS, via
 * `chart-theme`.
 *
 * Este módulo é essa fronteira — entra string legada, sai cor de série do tema
 * de gráfico (ou `undefined`, que significa "siga a paleta"). Uma cor crua
 * nunca é repassada: se não dá para reconhecer o matiz, o gráfico cai na
 * paleta, que é sempre acessível e tematizada.
 *
 * Mora em `shared/ui` (e não dentro de um bloco) porque dezesseis blocos do
 * catálogo fazem a MESMA tradução; duplicada, ela divergiria na primeira
 * correção.
 */
import type { CardProps } from '@astryxdesign/core/Card';
import { CHART_SERIES_COLORS, isChartSeriesColor, type ChartSeriesColor } from './charts';

/** Variante de cor do `Card` do DS — usada por KPI, ladrilho e métrica. */
export type ChartAccentCardVariant = NonNullable<CardProps['variant']>;

/**
 * Enum de acento antigo → cor de série. A ordem espelha a da paleta da
 * referência (`CHART_SERIES_COLORS`), então `chart-1` continua sendo a
 * primeira cor de série, `chart-2` a segunda, e assim por diante: um painel
 * salvo antes da repaginação mantém a MESMA leitura relativa entre blocos.
 */
const LEGACY_ACCENT: Record<string, ChartSeriesColor> = {
  'chart-1': CHART_SERIES_COLORS[0], // verde (principal)
  'chart-2': CHART_SERIES_COLORS[1], // âmbar
  'chart-3': CHART_SERIES_COLORS[2], // ciano
  'chart-4': CHART_SERIES_COLORS[3], // vermelho
  'chart-5': CHART_SERIES_COLORS[4], // verde folha
  // `primary` era a cor de marca do tema legado — e continua sendo a 1ª cor.
  primary: CHART_SERIES_COLORS[0],
};

/**
 * Matiz de classe utilitária → cor de série mais próxima. Cobre os nomes que
 * apareciam nos painéis (`emerald`, `rose`, `violet`…) para que um
 * `bg-emerald-500` salvo continue verde, e não caia na paleta em silêncio.
 */
const LEGACY_HUE: Record<string, ChartSeriesColor> = {
  // `blue`, `cyan`, `red`, `pink`, `teal`, `brown`, `indigo` e `gray` já são
  // nomes aceitos pelo tema de gráfico (aliases que apontam para o token do
  // matiz correspondente) — não precisam de entrada aqui.
  sky: 'cyan',
  cyan: 'cyan',
  teal: 'teal',
  emerald: 'green',
  green: 'green',
  lime: 'green',
  amber: 'amber',
  rose: 'red',
  fuchsia: 'pink',
  violet: 'purple',
  slate: 'gray',
  grey: 'gray',
};

/**
 * Cor de série → variante de COR do `Card` do DS. Nem toda cor do gráfico tem
 * variante equivalente (as variantes do DS são 10 matizes); as que não têm
 * ficam de fora e o card usa o visual padrão.
 *
 * `emerald` → `teal` não é um erro de tradução: no tema, a família `teal` do
 * Astryx aponta para a `primary` do DS, que é justamente o verde #00A76F.
 */
const CARD_VARIANT: Partial<Record<ChartSeriesColor, ChartAccentCardVariant>> = {
  emerald: 'teal',
  amber: 'orange',
  cyan: 'cyan',
  red: 'red',
  green: 'green',
  forest: 'green',
  steel: 'blue',
  navy: 'blue',
  purple: 'purple',
  lilac: 'purple',
  blue: 'blue',
  orange: 'orange',
  yellow: 'yellow',
  pink: 'pink',
  teal: 'teal',
  gray: 'gray',
};

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
 * Traduz um valor de `accent` para uma cor de série do tema de gráfico.
 *
 * Devolve `undefined` quando o valor não descreve um matiz reconhecível (cor
 * crua, gradiente, string vazia) — o chamador então deixa o gráfico ciclar a
 * paleta, que é o comportamento seguro.
 *
 * @example
 * chartAccentColor('chart-3');        // 'cyan'
 * chartAccentColor('bg-emerald-500'); // 'green'
 * chartAccentColor('#40E0D0');        // undefined → paleta do tema
 */
export function chartAccentColor(
  accent: string | null | undefined,
): ChartSeriesColor | undefined {
  if (typeof accent !== 'string' || accent.trim() === '') return undefined;

  const key = normalizeAccent(accent);
  if (key === '') return undefined;
  if (LEGACY_ACCENT[key]) return LEGACY_ACCENT[key];
  if (LEGACY_HUE[key]) return LEGACY_HUE[key];
  // Já é o nome de uma cor do tema de gráfico (`emerald`, `navy`…).
  return isChartSeriesColor(key) ? key : undefined;
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
  return color ? CARD_VARIANT[color] : undefined;
}

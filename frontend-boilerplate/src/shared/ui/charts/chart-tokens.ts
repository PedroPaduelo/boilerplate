/**
 * VOCABULÁRIO DE TOKENS de data-viz — a lista de nomes que os gráficos podem
 * usar, e nada além disso.
 *
 * Separado do hook de propósito: aqui é só nome de token (constante pura,
 * testável sem React); no `use-chart-palette.ts` fica a RESOLUÇÃO desses nomes
 * contra o tema ativo. Quem for auditar "de onde vem a cor deste gráfico" lê
 * este arquivo e acaba a investigação.
 */

/**
 * Cores categóricas do DS, na ordem de ciclo (vizinhas bem distintas entre si).
 * Nomes conferidos em `dataTokenDefaults` do `@astryxdesign/core/theme`.
 */
export const CHART_SERIES_COLORS = [
  'blue',
  'orange',
  'purple',
  'green',
  'pink',
  'cyan',
  'red',
  'teal',
  'brown',
  'indigo',
] as const;

/** Cor de série: uma das categóricas do DS. */
export type ChartSeriesColor = (typeof CHART_SERIES_COLORS)[number];

/** Rampas sequenciais do DS (5 passos) — para escalas ordenadas/quantitativas. */
export const CHART_RAMP_COLORS = [
  'blue',
  'shamrock',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'yellow',
  'gray',
] as const;

/** Rampa sequencial disponível no DS. */
export type ChartRampColor = (typeof CHART_RAMP_COLORS)[number];

/** Passos de uma rampa (1 = mais claro, 5 = mais escuro). */
export const RAMP_STEPS = [1, 2, 3, 4, 5] as const;

/**
 * Papéis do "chrome" do gráfico — tudo que NÃO é dado (grade, eixo, rótulo,
 * trilho, superfície do tooltip). Mapeados para tokens semânticos do DS.
 */
export const CHROME_TOKENS = {
  grid: '--color-border',
  axis: '--color-border-emphasized',
  label: '--color-text-secondary',
  emphasis: '--color-text-primary',
  surface: '--color-background-card',
  track: '--color-track',
  neutral: '--color-data-neutral',
  accent: '--color-accent',
  positive: '--color-success',
  warning: '--color-warning',
  negative: '--color-error',
} as const;

/** Papel de chrome de um gráfico. */
export type ChartChromeRole = keyof typeof CHROME_TOKENS;

/** Token de tamanho de fonte usado nos rótulos de eixo (12px na escala do DS). */
export const AXIS_FONT_SIZE_TOKEN = '--font-size-sm';

/** Nome do token de uma cor categórica. */
export function chartSeriesToken(color: ChartSeriesColor): string {
  return `--color-data-categorical-${color}`;
}

/** Nome do token de um passo da rampa sequencial. */
export function chartRampToken(color: ChartRampColor, step: number): string {
  return `--color-data-${color}-${step}`;
}

/** Referência CSS de um token (`var(--x)`) — forma usada no DOM. */
export function chartTokenVar(token: string): string {
  return `var(${token})`;
}

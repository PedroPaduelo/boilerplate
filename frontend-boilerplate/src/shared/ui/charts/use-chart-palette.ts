/**
 * COMPONENTE PRÓPRIO — o Astryx não entrega gráficos, só os tokens crus de
 * data-viz (`--color-data-*`). Este módulo é a ÚNICA fonte de cor de série do
 * app: nenhum gráfico declara paleta própria, todos consomem daqui. Trocar o
 * tema (ou a ordem da paleta) repinta todos os gráficos de uma vez só.
 *
 * Por que resolver o token em vez de usar `var(--token)` em tudo: SVG pinta por
 * ATRIBUTO DE APRESENTAÇÃO (`fill`/`stroke`) e o recharts repassa esses valores
 * para dentro do SVG, onde `var()` não é confiável. Então expomos as duas
 * formas — valor resolvido (SVG) e `var(--token)` (DOM) — e nunca um hex.
 *
 * Os NOMES dos tokens ficam em `chart-tokens.ts`; aqui é só a resolução deles
 * contra o tema ativo.
 */
import { useMemo } from 'react';
import { useTheme } from '@astryxdesign/core/theme';
import {
  AXIS_FONT_SIZE_TOKEN,
  CHART_SERIES_COLORS,
  CHROME_TOKENS,
  RAMP_STEPS,
  chartRampToken,
  chartSeriesToken,
  chartTokenVar,
  type ChartChromeRole,
  type ChartRampColor,
  type ChartSeriesColor,
} from './chart-tokens';

export {
  CHART_RAMP_COLORS,
  CHART_SERIES_COLORS,
  chartRampToken,
  chartSeriesToken,
  chartTokenVar,
} from './chart-tokens';
export type { ChartChromeRole, ChartRampColor, ChartSeriesColor } from './chart-tokens';

/** Paleta resolvida para o tema/modo ativos. */
export interface ChartPalette {
  /** Modo de cor efetivo do tema. */
  mode: 'light' | 'dark';
  /** Quantidade de cores categóricas disponíveis. */
  size: number;
  /** Nome do token da série `index` (cicla a paleta). `override` fixa a cor. */
  tokenAt: (index: number, override?: ChartSeriesColor) => string;
  /** Cor RESOLVIDA da série `index` — use em SVG/recharts. */
  colorAt: (index: number, override?: ChartSeriesColor) => string;
  /** `var(--token)` da série `index` — use no DOM. */
  varAt: (index: number, override?: ChartSeriesColor) => string;
  /** Rampa sequencial resolvida (5 posições, claro → escuro). */
  ramp: (color: ChartRampColor) => readonly string[];
  /** Cor RESOLVIDA de um papel de chrome. */
  chrome: (role: ChartChromeRole) => string;
  /** `var(--token)` de um papel de chrome. */
  chromeVar: (role: ChartChromeRole) => string;
  /** Tamanho de fonte dos rótulos de eixo (token tipográfico do DS). */
  axisFontSize: string;
  /**
   * Escotilha para qualquer outro token do tema (ex.: `--font-size-xl` num
   * rótulo dentro do SVG). Devolve o valor resolvido; se o tema não declarar a
   * chave, devolve `var(--token)` — nunca um literal.
   */
  token: (name: string) => string;
}

/**
 * Lê a paleta de data-viz do tema ativo.
 *
 * @example
 * const palette = useChartPalette();
 * <Area stroke={palette.colorAt(0)} />          // SVG: valor resolvido
 * <ChartSwatch color={palette.varAt(0)} />      // DOM: var(--token)
 */
export function useChartPalette(): ChartPalette {
  const { mode, tokens } = useTheme();

  return useMemo<ChartPalette>(() => {
    // Fallback para `var(--token)` mantém a garantia "token, nunca hex" mesmo
    // se o tema não declarar a chave.
    const read = (token: string): string => tokens[token] || chartTokenVar(token);

    const tokenAt = (index: number, override?: ChartSeriesColor): string => {
      if (override) return chartSeriesToken(override);
      const safe = Math.abs(Math.trunc(index)) % CHART_SERIES_COLORS.length;
      return chartSeriesToken(CHART_SERIES_COLORS[safe]);
    };

    return {
      mode,
      size: CHART_SERIES_COLORS.length,
      tokenAt,
      colorAt: (index, override) => read(tokenAt(index, override)),
      varAt: (index, override) => chartTokenVar(tokenAt(index, override)),
      ramp: (color) => RAMP_STEPS.map((step) => read(chartRampToken(color, step))),
      chrome: (role) => read(CHROME_TOKENS[role]),
      chromeVar: (role) => chartTokenVar(CHROME_TOKENS[role]),
      axisFontSize: read(AXIS_FONT_SIZE_TOKEN),
      token: read,
    };
  }, [mode, tokens]);
}

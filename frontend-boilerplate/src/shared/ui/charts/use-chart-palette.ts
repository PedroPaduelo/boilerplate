/**
 * RESOLUÇÃO do `chart-theme` contra o tema ativo — o único ponto do app em que
 * um token de gráfico vira um valor pintável.
 *
 * Os NOMES dos tokens e as métricas do desenho ficam em `chart-theme.ts`; aqui
 * é só a resolução deles. Trocar o tema (ou a ordem da paleta) repinta todos os
 * gráficos de uma vez.
 *
 * ---------------------------------------------------------------------------
 * POR QUE RESOLVER, E POR QUE RESOLVER FUNDO
 * ---------------------------------------------------------------------------
 * SVG pinta por ATRIBUTO DE APRESENTAÇÃO (`fill`/`stroke`), e atributo de
 * apresentação NÃO aceita `var()` — o valor é ignorado e o elemento cai no
 * preto. O recharts repassa exatamente esses valores para dentro do SVG.
 *
 * Só que os slots semânticos do Astryx apontam para os tokens do DS por
 * REFERÊNCIA (`--color-text-secondary: var(--ds-color-text-secondary)`), então
 * uma resolução de um nível devolvia a string `var(--ds-…)` — e o texto do eixo
 * saía preto. Por isso a resolução aqui é PROFUNDA: segue a cadeia de `var()`
 * até chegar a um valor literal.
 *
 * Expomos as duas formas — valor resolvido (SVG) e `var(--token)` (DOM) — e
 * nunca um hex escrito no código.
 */
import { useMemo } from 'react';
import { useTheme } from '@astryxdesign/core/theme';
import {
  CHART_CHROME_TOKENS,
  CHART_GEOMETRY,
  CHART_MOTION,
  CHART_SERIES_COLORS,
  CHART_TYPOGRAPHY,
  RAMP_STEPS,
  chartRampToken,
  chartSeriesTokenAt,
  chartTokenVar,
  darkenColor,
  fadeColor,
  type ChartChromeRole,
  type ChartRampColor,
  type ChartSeriesColor,
} from './chart-theme';

export {
  CHART_ALIAS_COLORS,
  CHART_CHROME_TOKENS,
  CHART_COLOR_NAMES,
  CHART_GEOMETRY,
  CHART_HEIGHT,
  CHART_MARGIN,
  CHART_MOTION,
  CHART_NO_MARGIN,
  CHART_RAMP_COLORS,
  CHART_SERIES_COLORS,
  CHART_SPARK_MARGIN,
  CHART_TYPOGRAPHY,
  Y_AXIS_WIDTH,
  chartRampToken,
  chartSeriesToken,
  chartSeriesTokenAt,
  chartTokenVar,
  darkenColor,
  fadeColor,
  isChartSeriesColor,
} from './chart-theme';
export type {
  ChartChromeRole,
  ChartCycleColor,
  ChartRampColor,
  ChartSeriesColor,
} from './chart-theme';

/** Profundidade máxima ao seguir uma cadeia de `var()` (anti-ciclo). */
const MAX_VAR_DEPTH = 8;

/** Casa `var(--token)` e `var(--token, fallback)`. */
const VAR_PATTERN = /^var\(\s*(--[^,)\s]+)\s*(?:,([^)]*))?\)$/;

/** Paleta e métricas resolvidas para o tema/modo ativos. */
export interface ChartPalette {
  /** Modo de cor efetivo do tema. */
  mode: 'light' | 'dark';
  /** Quantidade de cores do ciclo. */
  size: number;
  /** Nome do token da série `index` (cicla). `override` fixa a cor. */
  tokenAt: (index: number, override?: ChartSeriesColor) => string;
  /** Cor RESOLVIDA da série `index` — use em SVG/recharts. */
  colorAt: (index: number, override?: ChartSeriesColor) => string;
  /** `var(--token)` da série `index` — use no DOM. */
  varAt: (index: number, override?: ChartSeriesColor) => string;
  /** Cor da série `index` já escurecida (hover/ativo — a referência ESCURECE). */
  hoverAt: (index: number, override?: ChartSeriesColor) => string;
  /** Rampa sequencial resolvida (5 posições, claro → escuro). */
  ramp: (color: ChartRampColor) => readonly string[];
  /** Cor RESOLVIDA de um papel de chrome. */
  chrome: (role: ChartChromeRole) => string;
  /** `var(--token)` de um papel de chrome. */
  chromeVar: (role: ChartChromeRole) => string;
  /**
   * Verde escuro a 80% (`rgba(0,120,103,0.8)` na referência) — a cor mais
   * recorrente do catálogo: colunas, linhas e pizza de série única.
   */
  primary80: string;
  /** Tamanho de fonte dos rótulos de eixo, em px (12). */
  axisFontSize: number;
  /** Métricas do desenho (espessura, raio, largura de coluna, tracejado…). */
  geometry: typeof CHART_GEOMETRY;
  /** Tipografia do gráfico, em pixels reais. */
  typography: typeof CHART_TYPOGRAPHY;
  /** Duração/atraso da animação de entrada. */
  motion: typeof CHART_MOTION;
  /**
   * Escotilha para qualquer outro token do tema. Devolve o valor resolvido; se
   * o tema não declarar a chave, devolve `var(--token)` — nunca um literal.
   */
  token: (name: string) => string;
}

/**
 * Lê a paleta e as métricas de data-viz do tema ativo.
 *
 * @example
 * const palette = useChartPalette();
 * <Line stroke={palette.colorAt(0)} strokeWidth={palette.geometry.lineWidth} />
 * <ChartSwatch color={palette.varAt(0)} />
 */
export function useChartPalette(): ChartPalette {
  const { mode, tokens } = useTheme();

  return useMemo<ChartPalette>(() => {
    /**
     * Resolve um token seguindo a cadeia de `var()` até um valor literal.
     * Sem a chave no tema, devolve `var(--token)`: a garantia "token, nunca
     * hex" continua valendo mesmo quando o tema não declara o slot.
     */
    const read = (token: string): string => {
      let value = tokens[token];
      if (!value) return chartTokenVar(token);

      for (let depth = 0; depth < MAX_VAR_DEPTH; depth += 1) {
        const match = VAR_PATTERN.exec(value.trim());
        if (!match) return value;
        const next = tokens[match[1]];
        if (!next) return match[2]?.trim() || value;
        value = next;
      }
      return value;
    };

    const tokenAt = (index: number, override?: ChartSeriesColor): string =>
      chartSeriesTokenAt(index, override);

    const colorAt = (index: number, override?: ChartSeriesColor): string =>
      read(tokenAt(index, override));

    return {
      mode,
      size: CHART_SERIES_COLORS.length,
      tokenAt,
      colorAt,
      varAt: (index, override) => chartTokenVar(tokenAt(index, override)),
      hoverAt: (index, override) => darkenColor(colorAt(index, override)),
      ramp: (color) => RAMP_STEPS.map((step) => read(chartRampToken(color, step))),
      chrome: (role) => read(CHART_CHROME_TOKENS[role]),
      chromeVar: (role) => chartTokenVar(CHART_CHROME_TOKENS[role]),
      primary80: fadeColor(read(CHART_CHROME_TOKENS.primaryDark), 0.8),
      axisFontSize: CHART_TYPOGRAPHY.axis.size,
      geometry: CHART_GEOMETRY,
      typography: CHART_TYPOGRAPHY,
      motion: CHART_MOTION,
      token: read,
    };
  }, [mode, tokens]);
}

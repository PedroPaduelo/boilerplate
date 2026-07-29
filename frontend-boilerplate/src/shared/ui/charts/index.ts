/**
 * Barrel interno dos gráficos. O consumidor final importa de `@/shared/ui`;
 * este arquivo existe para manter a pasta `charts/` coesa e deixar explícito o
 * que é API pública e o que é primitivo compartilhado.
 *
 * Ordem de leitura para quem chega agora:
 *   chart-theme.ts     — a especificação (cores, geometria, tipografia, motion)
 *   use-chart-palette  — a resolução dela contra o tema ativo
 *   chart-frame.tsx    — a casca (cabeçalho, estados, a11y)
 *   os gráficos        — só a plotagem
 */

// Fonte ÚNICA de tema de gráfico — todo gráfico consome daqui.
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
  useChartPalette,
} from './use-chart-palette';
export type {
  ChartChromeRole,
  ChartCycleColor,
  ChartPalette,
  ChartRampColor,
  ChartSeriesColor,
} from './use-chart-palette';

// Eixos, grade, cursor e animação — props compartilhados do recharts.
export {
  chartAnimationProps,
  chartAxisProps,
  chartBarCursorProps,
  chartBarRadius,
  chartCursorProps,
  chartGridProps,
  chartYAxisProps,
} from './chart-axes';

// Vocabulário comum.
export type { ChartPoint, ChartSeries, ChartStateProps, ValueFormatter } from './types';

// Markdown + interpolação de variáveis (contrato comum de TODO bloco).
export { ChartText } from './chart-text';
export type { ChartTextProps } from './chart-text';
export { chartPlainText, chartTextHtml } from './chart-text-html';
export {
  buildChartScope,
  hasVariables,
  interpolate,
  interpolateText,
  readPath,
} from './chart-template';
export type { ChartScope, InterpolationResult } from './chart-template';

// Primitivos compartilhados (casca, legenda, tooltip, marcas de dados).
export {
  CHART_EMPTY_MESSAGE,
  CHART_ERROR_MESSAGE,
  CHART_FORBIDDEN_MESSAGE,
  ChartFrame,
} from './chart-frame';
export type { ChartFrameProps, ChartFrameRole, ChartFrameState } from './chart-frame';
export { ChartLegend, ChartLegends } from './chart-legend';
export type {
  ChartLegendItem,
  ChartLegendProps,
  ChartLegendsProps,
} from './chart-legend';
export { ChartTooltip } from './chart-tooltip';
export type { ChartTooltipProps, ChartTooltipRow } from './chart-tooltip';
export { ChartSeriesTooltip } from './chart-series-tooltip';
export { ChartSkeleton } from './chart-skeleton';
export type { ChartSkeletonProps, ChartSkeletonShape } from './chart-skeleton';
export { ChartSwatch } from './chart-swatch';
export type { ChartSwatchProps } from './chart-swatch';
export { ChartBarTrack } from './chart-bar-track';
export type { ChartBarTrackProps } from './chart-bar-track';
export { ChartCenterLabel } from './chart-center-label';
export type { ChartCenterLabelProps } from './chart-center-label';

// Gráficos.
export { AreaChart } from './area-chart';
export type { AreaChartFill, AreaChartMode, AreaChartProps } from './area-chart';
export { BarChart } from './bar-chart';
export type { BarChartProps } from './bar-chart';
export { BarList, RankingBar, RANKING_ROW_BAND, RANKING_TEXT } from './bar-list';
export type { BarListItem, BarListProps, RankingBarProps } from './bar-list';
export { DonutChart } from './donut-chart';
export type { DonutChartProps } from './donut-chart';
export { HBarChart } from './h-bar-chart';
export type { HBarChartProps } from './h-bar-chart';
export { LineChart } from './line-chart';
export type { LineChartProps } from './line-chart';
export { ProgressCircle } from './progress-circle';
export type { ProgressCircleProps, ProgressCircleTone } from './progress-circle';
export { RadialGauge } from './radial-gauge';
export type { RadialGaugeProps, RadialGaugeThreshold } from './radial-gauge';
export { ScatterChart } from './scatter-chart';
export type { ScatterChartProps, ScatterPoint } from './scatter-chart';
export { SparkChart } from './spark-chart';
export type { SparkChartProps, SparkChartType } from './spark-chart';

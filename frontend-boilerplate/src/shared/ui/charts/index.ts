/**
 * Barrel interno dos gráficos. O consumidor final importa de `@/shared/ui`;
 * este arquivo existe para manter a pasta `charts/` coesa e deixar explícito o
 * que é API pública e o que é primitivo compartilhado.
 */

// Fonte ÚNICA de paleta — todo gráfico consome daqui.
export {
  CHART_SERIES_COLORS,
  chartRampToken,
  chartTokenVar,
  useChartPalette,
} from './use-chart-palette';
export type {
  ChartChromeRole,
  ChartPalette,
  ChartRampColor,
  ChartSeriesColor,
} from './use-chart-palette';

// Vocabulário comum.
export type { ChartPoint, ChartSeries, ChartStateProps, ValueFormatter } from './types';

// Primitivos compartilhados (casca, legenda, tooltip, marcas de dados).
export type { ChartFrameProps, ChartFrameRole } from './chart-frame';
export type { ChartLegendItem, ChartLegendProps } from './chart-legend';
export type { ChartTooltipProps, ChartTooltipRow } from './chart-tooltip';
export { ChartSwatch } from './chart-swatch';
export type { ChartSwatchProps } from './chart-swatch';
export { ChartBarTrack } from './chart-bar-track';
export type { ChartBarTrackProps } from './chart-bar-track';
export type { ChartCenterLabelProps } from './chart-center-label';

// Gráficos.
export { AreaChart } from './area-chart';
export type { AreaChartFill, AreaChartMode, AreaChartProps } from './area-chart';
export { BarChart } from './bar-chart';
export type { BarChartProps } from './bar-chart';
export { BarList } from './bar-list';
export type { BarListItem, BarListProps } from './bar-list';
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

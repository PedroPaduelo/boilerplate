/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Resolve "tendência ao longo
 * do tempo": uma ou mais linhas, com área opcional sob elas.
 *
 * Substitui `line-chart.tsx` (SVG à mão, 397 linhas, com `ResizeObserver`,
 * spline Catmull-Rom e cor por classe Tailwind). O recharts já mede o
 * container e desenha a curva; sobra o que importa — cor, tipografia e estados
 * saindo dos tokens do DS pelos primitivos compartilhados desta pasta.
 */
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_MARGIN,
  Y_AXIS_WIDTH,
  chartAxisProps,
  chartCursorProps,
  chartGridProps,
} from './chart-axes';
import {
  CATEGORY_KEY,
  describeSeries,
  formatChartValue,
  isSeriesEmpty,
  seriesKey,
  toChartRows,
} from './chart-data';
import { ChartFrame } from './chart-frame';
import { ChartLegend } from './chart-legend';
import { ChartSeriesTooltip } from './chart-series-tooltip';
import type { ChartSeries, ChartStateProps, ValueFormatter } from './types';
import { useChartPalette } from './use-chart-palette';

export interface LineChartProps extends ChartStateProps {
  /** Séries desenhadas (uma linha cada). */
  series: ChartSeries[];
  /** Rótulos do eixo X, um por ponto. */
  labels?: string[];
  /** Altura da plotagem em px. */
  height?: number;
  /** Curva suave (monotone) em vez de segmentos retos. */
  isSmooth?: boolean;
  /** Preenche a área sob cada linha, bem discreta. */
  showArea?: boolean;
  /** Marcadores em cada ponto (além do ponto ativo do hover). */
  showDots?: boolean;
  /** Linhas de grade horizontais. */
  showGrid?: boolean;
  /** Legenda série → cor abaixo da plotagem. */
  showLegend?: boolean;
  /** Formata o valor no tooltip. */
  valueFormatter?: ValueFormatter;
  /** Formata os ticks dos eixos. Sem isto, usa `valueFormatter`. */
  axisFormatter?: ValueFormatter;
}

/** A área sob a linha é só contexto: opacidade baixa para não competir. */
const AREA_FILL_OPACITY = 0.12;

/** Gráfico de linha com eixos, grade, tooltip e legenda tematizados. */
export function LineChart({
  series,
  labels,
  height = 280,
  isSmooth = false,
  showArea = false,
  showDots = false,
  showGrid = true,
  showLegend = true,
  valueFormatter = formatChartValue,
  axisFormatter,
  isLoading,
  emptyMessage,
  label = 'Gráfico de linha',
  summary,
}: LineChartProps) {
  const palette = useChartPalette();
  const isEmpty = isSeriesEmpty(series);
  const rows = toChartRows(series, labels);
  const tickFormatter = axisFormatter ?? valueFormatter;
  const curve = isSmooth ? 'monotone' : 'linear';

  return (
    <ChartFrame
      label={label}
      summary={summary ?? describeSeries(series, valueFormatter)}
      height={height}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      footer={
        showLegend ? (
          <ChartLegend
            items={series.map((item, index) => ({
              label: item.label,
              color: palette.varAt(index, item.color),
            }))}
          />
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={rows} margin={CHART_MARGIN}>
          {showGrid ? <CartesianGrid {...chartGridProps(palette)} /> : null}
          <XAxis dataKey={CATEGORY_KEY} {...chartAxisProps(palette)} />
          <YAxis
            width={Y_AXIS_WIDTH}
            tickFormatter={tickFormatter}
            {...chartAxisProps(palette)}
          />
          <Tooltip
            cursor={chartCursorProps(palette)}
            wrapperStyle={{ outline: 'none' }}
            content={(props) => (
              <ChartSeriesTooltip
                isActive={props.active}
                title={String(props.label ?? '')}
                entries={props.payload ?? undefined}
                series={series}
                palette={palette}
                format={valueFormatter}
              />
            )}
          />
          {showArea
            ? series.map((item, index) => (
                <Area
                  key={`area-${seriesKey(index)}`}
                  dataKey={seriesKey(index)}
                  name={item.label}
                  type={curve}
                  stroke="none"
                  fill={palette.colorAt(index, item.color)}
                  fillOpacity={AREA_FILL_OPACITY}
                  legendType="none"
                  tooltipType="none"
                  isAnimationActive={false}
                />
              ))
            : null}
          {series.map((item, index) => (
            <Line
              key={seriesKey(index)}
              dataKey={seriesKey(index)}
              name={item.label}
              type={curve}
              stroke={palette.colorAt(index, item.color)}
              strokeWidth={2}
              dot={showDots ? { r: 2.5, strokeWidth: 0 } : false}
              activeDot={{ r: 4, stroke: palette.chrome('surface'), strokeWidth: 2 }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Resolve "volume ao longo do
 * tempo": uma ou mais séries sobrepostas, empilhadas ou normalizadas em 100%.
 *
 * Substitui `area-chart.tsx` (SVG à mão, 409 linhas) e `area-chart-tremor.tsx`
 * (cópia do Tremor, 986 linhas, cores `blue-500`/`gray-200` fora do tema). Aqui
 * a plotagem é do recharts e TUDO que é cor/tipografia vem de token, via
 * `useChartPalette`; eixos, grade, tooltip, legenda e estados vêm dos
 * primitivos compartilhados desta pasta.
 */
import { useId } from 'react';
import {
  Area,
  CartesianGrid,
  AreaChart as RechartsAreaChart,
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
  toPercentRows,
} from './chart-data';
import { ChartFrame } from './chart-frame';
import { ChartLegend } from './chart-legend';
import { ChartSeriesTooltip } from './chart-series-tooltip';
import type { ChartSeries, ChartStateProps, ValueFormatter } from './types';
import { useChartPalette } from './use-chart-palette';

/** Composição das áreas: sobrepostas, empilhadas ou normalizadas em 100%. */
export type AreaChartMode = 'default' | 'stacked' | 'percent';

/** Preenchimento sob a linha de topo. */
export type AreaChartFill = 'gradient' | 'solid' | 'none';

export interface AreaChartProps extends ChartStateProps {
  /** Séries desenhadas (uma área + linha de topo cada). */
  series: ChartSeries[];
  /** Rótulos do eixo X, um por ponto. */
  labels?: string[];
  /** Altura da plotagem em px. */
  height?: number;
  /** Composição das áreas. */
  mode?: AreaChartMode;
  /** Estilo do preenchimento. */
  fill?: AreaChartFill;
  /** Curva suave (monotone) em vez de segmentos retos. */
  isSmooth?: boolean;
  /** Linhas de grade horizontais. */
  showGrid?: boolean;
  /** Legenda série → cor abaixo da plotagem. */
  showLegend?: boolean;
  /** Formata o valor no tooltip. */
  valueFormatter?: ValueFormatter;
  /** Formata os ticks dos eixos. Sem isto, usa `valueFormatter`. */
  axisFormatter?: ValueFormatter;
}

/** Opacidade do preenchimento sólido — a linha de topo é que carrega a cor. */
const SOLID_FILL_OPACITY = 0.25;

/** Gráfico de área com eixos, grade, tooltip e legenda tematizados. */
export function AreaChart({
  series,
  labels,
  height = 280,
  mode = 'default',
  fill = 'gradient',
  isSmooth = false,
  showGrid = true,
  showLegend = true,
  valueFormatter = formatChartValue,
  axisFormatter,
  isLoading,
  emptyMessage,
  label = 'Gráfico de área',
  summary,
}: AreaChartProps) {
  const palette = useChartPalette();
  const gradientId = useId();
  const isEmpty = isSeriesEmpty(series);
  const tickFormatter = axisFormatter ?? valueFormatter;

  const baseRows = toChartRows(series, labels);
  const rows = mode === 'percent' ? toPercentRows(baseRows, series.length) : baseRows;
  const stackId = mode === 'default' ? undefined : 'stack';

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
        <RechartsAreaChart data={rows} margin={CHART_MARGIN}>
          <defs>
            {series.map((item, index) => (
              <linearGradient
                key={seriesKey(index)}
                id={`${gradientId}-${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={palette.colorAt(index, item.color)}
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor={palette.colorAt(index, item.color)}
                  stopOpacity={0.02}
                />
              </linearGradient>
            ))}
          </defs>
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
          {series.map((item, index) => (
            <Area
              key={seriesKey(index)}
              dataKey={seriesKey(index)}
              name={item.label}
              type={isSmooth ? 'monotone' : 'linear'}
              stackId={stackId}
              stroke={palette.colorAt(index, item.color)}
              strokeWidth={2}
              fill={
                fill === 'gradient'
                  ? `url(#${gradientId}-${index})`
                  : palette.colorAt(index, item.color)
              }
              fillOpacity={
                fill === 'solid' ? SOLID_FILL_OPACITY : fill === 'none' ? 0 : 1
              }
              dot={false}
              activeDot={{ r: 4, stroke: palette.chrome('surface'), strokeWidth: 2 }}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

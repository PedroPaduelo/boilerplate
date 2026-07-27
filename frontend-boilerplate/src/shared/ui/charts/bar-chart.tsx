/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Resolve "comparar categorias":
 * barras verticais agrupadas ou empilhadas.
 *
 * Substitui `bar-chart.tsx`, que empilhava `<div>`s com altura em `%` e recebia
 * cor por classe Tailwind (`bg-chart-2`) ou `style` cru. Agora a plotagem é do
 * recharts e a cor vem sempre de token, via `useChartPalette` — eixos, grade,
 * tooltip, legenda e estados são os primitivos compartilhados desta pasta.
 */
import {
  Bar,
  CartesianGrid,
  Cell,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_MARGIN,
  Y_AXIS_WIDTH,
  chartAxisProps,
  chartBarCursorProps,
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

export interface BarChartProps extends ChartStateProps {
  /** Séries desenhadas. Uma série = barras agrupadas por categoria. */
  series: ChartSeries[];
  /** Rótulos do eixo X, um por ponto. */
  labels?: string[];
  /** Altura da plotagem em px. */
  height?: number;
  /** Empilha as séries na mesma coluna em vez de agrupá-las lado a lado. */
  isStacked?: boolean;
  /**
   * Cor por CATEGORIA em vez de por série. Só faz sentido com uma série —
   * é o modo "paleta multicolorida" de um ranking simples.
   */
  hasColorByCategory?: boolean;
  /** Linhas de grade horizontais. */
  showGrid?: boolean;
  /** Legenda série → cor abaixo da plotagem. */
  showLegend?: boolean;
  /** Formata o valor no tooltip. */
  valueFormatter?: ValueFormatter;
  /** Formata os ticks dos eixos. Sem isto, usa `valueFormatter`. */
  axisFormatter?: ValueFormatter;
}

/** Raio do topo das barras, em unidades do SVG (canto arredondado do DS). */
const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

/** Gráfico de barras verticais, agrupadas ou empilhadas. */
export function BarChart({
  series,
  labels,
  height = 280,
  isStacked = false,
  hasColorByCategory = false,
  showGrid = true,
  showLegend = true,
  valueFormatter = formatChartValue,
  axisFormatter,
  isLoading,
  emptyMessage,
  label = 'Gráfico de barras',
  summary,
}: BarChartProps) {
  const palette = useChartPalette();
  const isEmpty = isSeriesEmpty(series);
  const rows = toChartRows(series, labels);
  const tickFormatter = axisFormatter ?? valueFormatter;
  const byCategory = hasColorByCategory && series.length === 1;

  const legendItems = byCategory
    ? rows.map((row, index) => ({
        label: String(row[CATEGORY_KEY]),
        color: palette.varAt(index),
      }))
    : series.map((item, index) => ({
        label: item.label,
        color: palette.varAt(index, item.color),
      }));

  return (
    <ChartFrame
      label={label}
      summary={summary ?? describeSeries(series, valueFormatter)}
      height={height}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      footer={showLegend ? <ChartLegend items={legendItems} shape="bar" /> : null}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={rows} margin={CHART_MARGIN}>
          {showGrid ? <CartesianGrid {...chartGridProps(palette)} /> : null}
          <XAxis dataKey={CATEGORY_KEY} {...chartAxisProps(palette)} />
          <YAxis
            width={Y_AXIS_WIDTH}
            tickFormatter={tickFormatter}
            {...chartAxisProps(palette)}
          />
          <Tooltip
            cursor={chartBarCursorProps(palette)}
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
            <Bar
              key={seriesKey(index)}
              dataKey={seriesKey(index)}
              name={item.label}
              stackId={isStacked ? 'stack' : undefined}
              fill={palette.colorAt(index, item.color)}
              radius={isStacked ? undefined : BAR_RADIUS}
            >
              {byCategory
                ? rows.map((row, rowIndex) => (
                    <Cell
                      key={String(row[CATEGORY_KEY])}
                      fill={palette.colorAt(rowIndex)}
                    />
                  ))
                : null}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

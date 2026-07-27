/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Resolve "ranking com rótulo
 * longo": barras horizontais, onde o nome da categoria cabe sem cortar.
 *
 * Substitui `h-bar-chart.tsx`, que era uma pilha de `<div>`s com largura em `%`,
 * cor por classe Tailwind e um efeito de esmaecimento manual no hover. O
 * recharts cuida da escala e do hover; a cor sai da paleta do DS.
 *
 * Quando o que se quer é uma LISTA "top N" (com valor à direita e sem eixos),
 * use `BarList` — este aqui é o gráfico com eixo.
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
  chartAxisProps,
  chartBarCursorProps,
  chartGridProps,
} from './chart-axes';
import {
  CATEGORY_KEY,
  describePoints,
  formatChartValue,
  isPointsEmpty,
  toPointRows,
} from './chart-data';
import { ChartFrame } from './chart-frame';
import { ChartTooltip } from './chart-tooltip';
import type { ChartPoint, ChartStateProps, ValueFormatter } from './types';
import { useChartPalette } from './use-chart-palette';

export interface HBarChartProps extends ChartStateProps {
  /** Categorias desenhadas, na ordem recebida (ordene antes se precisar). */
  data: ChartPoint[];
  /** Altura da plotagem em px. */
  height?: number;
  /** Largura reservada aos rótulos de categoria, em px. */
  categoryWidth?: number;
  /** Uma cor por categoria em vez de uma cor só para todas. */
  hasColorByCategory?: boolean;
  /** Linhas de grade verticais. */
  showGrid?: boolean;
  /** Formata o valor no tooltip e nos ticks. */
  valueFormatter?: ValueFormatter;
}

/** Raio da ponta das barras, em unidades do SVG. */
const BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];

/** Gráfico de barras horizontais com eixo de categorias à esquerda. */
export function HBarChart({
  data,
  height = 280,
  categoryWidth = 120,
  hasColorByCategory = false,
  showGrid = true,
  valueFormatter = formatChartValue,
  isLoading,
  emptyMessage,
  label = 'Gráfico de barras horizontais',
  summary,
}: HBarChartProps) {
  const palette = useChartPalette();
  const isEmpty = isPointsEmpty(data);
  const rows = toPointRows(data);

  return (
    <ChartFrame
      label={label}
      summary={summary ?? describePoints(data, valueFormatter)}
      height={height}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={rows} layout="vertical" margin={CHART_MARGIN}>
          {showGrid ? (
            <CartesianGrid {...chartGridProps(palette)} vertical horizontal={false} />
          ) : null}
          <XAxis
            type="number"
            tickFormatter={valueFormatter}
            {...chartAxisProps(palette)}
          />
          <YAxis
            type="category"
            dataKey={CATEGORY_KEY}
            width={categoryWidth}
            {...chartAxisProps(palette)}
          />
          <Tooltip
            cursor={chartBarCursorProps(palette)}
            wrapperStyle={{ outline: 'none' }}
            content={(props) => {
              const entry = props.payload?.[0];
              if (!props.active || !entry) return null;
              const index = data.findIndex(
                (point) => point.label === String(props.label),
              );
              return (
                <ChartTooltip
                  title={String(props.label ?? '')}
                  rows={[
                    {
                      label: 'Valor',
                      value: valueFormatter(Number(entry.value ?? 0)),
                      color: palette.varAt(
                        hasColorByCategory && index >= 0 ? index : 0,
                        index >= 0 ? data[index].color : undefined,
                      ),
                    },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="value" radius={BAR_RADIUS} fill={palette.colorAt(0)}>
            {data.map((point, index) => (
              <Cell
                key={point.label}
                fill={palette.colorAt(hasColorByCategory ? index : 0, point.color)}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

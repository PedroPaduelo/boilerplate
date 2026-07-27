/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Resolve "correlação entre
 * duas medidas": dispersão X/Y, com tamanho de bolha e agrupamento por
 * categoria opcionais.
 *
 * Substitui `scatter-chart-tremor.tsx` (525 linhas): a legenda, o tooltip e a
 * lógica de cor viviam ali dentro, com paleta `blue/emerald`, fundo branco fixo
 * e um cinza cravado no cursor. Aqui sobrou só a plotagem — legenda, tooltip,
 * eixos, grade e estados são os primitivos compartilhados desta pasta, e toda
 * cor sai de token.
 */
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart as RechartsScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import {
  CHART_MARGIN,
  Y_AXIS_WIDTH,
  chartAxisProps,
  chartCursorProps,
  chartGridProps,
} from './chart-axes';
import { formatChartValue } from './chart-data';
import { ChartFrame } from './chart-frame';
import { ChartLegend } from './chart-legend';
import { ChartTooltip } from './chart-tooltip';
import type { ChartStateProps, ValueFormatter } from './types';
import { useChartPalette } from './use-chart-palette';

/** Um ponto do gráfico de dispersão. */
export interface ScatterPoint {
  /** Valor no eixo X. */
  x: number;
  /** Valor no eixo Y. */
  y: number;
  /** Peso da bolha (só é usado quando `sizeRange` está definido). */
  size?: number;
  /** Grupo do ponto — cada grupo vira uma cor e uma entrada na legenda. */
  category?: string;
}

export interface ScatterChartProps extends ChartStateProps {
  /** Pontos desenhados. */
  data: ScatterPoint[];
  /** Altura da plotagem em px. */
  height?: number;
  /** Nome do eixo X, exibido no tooltip. */
  xLabel?: string;
  /** Nome do eixo Y, exibido no tooltip. */
  yLabel?: string;
  /** Faixa de área da bolha quando os pontos trazem `size`. */
  sizeRange?: [number, number];
  /** Linhas de grade. */
  showGrid?: boolean;
  /** Legenda categoria → cor abaixo da plotagem. */
  showLegend?: boolean;
  /** Formata os valores no tooltip. */
  valueFormatter?: ValueFormatter;
  /** Formata os ticks dos eixos. Sem isto, usa `valueFormatter`. */
  axisFormatter?: ValueFormatter;
}

/** Rótulo usado quando o ponto não declara categoria. */
const DEFAULT_CATEGORY = 'Série';

/** Agrupa os pontos por categoria, preservando a ordem de aparição. */
function groupByCategory(data: ScatterPoint[]): [string, ScatterPoint[]][] {
  const groups = new Map<string, ScatterPoint[]>();
  for (const point of data) {
    const key = point.category ?? DEFAULT_CATEGORY;
    const bucket = groups.get(key);
    if (bucket) bucket.push(point);
    else groups.set(key, [point]);
  }
  return [...groups.entries()];
}

/** Gráfico de dispersão com eixos numéricos e bolhas opcionais. */
export function ScatterChart({
  data,
  height = 320,
  xLabel = 'X',
  yLabel = 'Y',
  sizeRange = [60, 500],
  showGrid = true,
  showLegend = true,
  valueFormatter = formatChartValue,
  axisFormatter,
  isLoading,
  emptyMessage,
  label = 'Gráfico de dispersão',
  summary,
}: ScatterChartProps) {
  const palette = useChartPalette();
  const groups = groupByCategory(data);
  const hasSize = data.some((point) => typeof point.size === 'number');
  const tickFormatter = axisFormatter ?? valueFormatter;

  return (
    <ChartFrame
      label={label}
      summary={
        summary ??
        `${data.length} pontos em ${groups.length} categoria(s), eixos ${xLabel} e ${yLabel}.`
      }
      height={height}
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyMessage={emptyMessage}
      footer={
        showLegend ? (
          <ChartLegend
            items={groups.map(([name], index) => ({
              label: name,
              color: palette.varAt(index),
            }))}
          />
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsScatterChart margin={CHART_MARGIN}>
          {showGrid ? <CartesianGrid {...chartGridProps(palette)} vertical /> : null}
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            tickFormatter={tickFormatter}
            {...chartAxisProps(palette)}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            width={Y_AXIS_WIDTH}
            tickFormatter={tickFormatter}
            {...chartAxisProps(palette)}
          />
          {hasSize ? <ZAxis type="number" dataKey="size" range={sizeRange} /> : null}
          <Tooltip
            cursor={chartCursorProps(palette)}
            wrapperStyle={{ outline: 'none' }}
            content={(props) => {
              const entry = props.payload?.[0];
              if (!props.active || !entry) return null;
              const point = entry.payload as ScatterPoint | undefined;
              if (!point) return null;
              const category = point.category ?? DEFAULT_CATEGORY;
              const index = groups.findIndex(([name]) => name === category);
              return (
                <ChartTooltip
                  title={category}
                  rows={[
                    {
                      label: xLabel,
                      value: valueFormatter(point.x),
                      color: palette.varAt(index < 0 ? 0 : index),
                    },
                    { label: yLabel, value: valueFormatter(point.y) },
                  ]}
                />
              );
            }}
          />
          {groups.map(([name, points], index) => (
            <Scatter
              key={name}
              name={name}
              data={points}
              fill={palette.colorAt(index)}
              fillOpacity={0.75}
            />
          ))}
        </RechartsScatterChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

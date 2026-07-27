/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Resolve "tendência dentro de
 * um card": minigráfico sem eixos, sem grade e sem tooltip, feito para caber ao
 * lado de um número.
 *
 * Substitui `spark-chart-tremor.tsx`, que carregava três caminhos de cor
 * (`accent`, `style`, `multicolor`), um gradiente arco-íris e uma prop `colors`
 * mantida só por compatibilidade e ignorada. Aqui a cor é uma só, sai da paleta
 * do DS, e o rótulo acessível é OBRIGATÓRIO — sem eixos, o texto é a única
 * leitura possível para quem não vê o desenho.
 */
import { useId } from 'react';
import {
  Area,
  Bar,
  Line,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
} from 'recharts';
import { ChartFrame } from './chart-frame';
import type { ChartStateProps } from './types';
import type { ChartSeriesColor } from './use-chart-palette';
import { useChartPalette } from './use-chart-palette';

/** Forma do minigráfico. */
export type SparkChartType = 'area' | 'bar' | 'line';

export interface SparkChartProps extends Omit<ChartStateProps, 'label'> {
  /** Série de valores, na ordem temporal. */
  data: number[];
  /** Forma do minigráfico. */
  type?: SparkChartType;
  /** Cor da série. Sem isto, usa a primeira cor categórica do DS. */
  color?: ChartSeriesColor;
  /** Altura em px. */
  height?: number;
  /** Curva suave (monotone) em vez de segmentos retos. */
  isSmooth?: boolean;
  /**
   * Rótulo acessível — obrigatório: um spark não tem eixo nem legenda, então
   * esta é a única descrição do que a linha mostra.
   */
  label: string;
}

/** Margem mínima para o traço não ser cortado nas bordas do SVG. */
const SPARK_MARGIN = { top: 2, right: 2, bottom: 2, left: 2 } as const;

/** Minigráfico de tendência (área, barras ou linha) sem eixos. */
export function SparkChart({
  data,
  type = 'area',
  color,
  height = 48,
  isSmooth = true,
  label,
  isLoading,
  emptyMessage,
  summary,
}: SparkChartProps) {
  const palette = useChartPalette();
  const gradientId = useId();
  const stroke = palette.colorAt(0, color);
  const rows = data.map((value, index) => ({ index, value }));
  const curve = isSmooth ? 'monotone' : 'linear';

  return (
    <ChartFrame
      label={label}
      summary={summary}
      height={height}
      isCompact
      isLoading={isLoading}
      isEmpty={rows.length === 0}
      emptyMessage={emptyMessage}
    >
      <ResponsiveContainer width="100%" height={height}>
        {type === 'bar' ? (
          <RechartsBarChart data={rows} margin={SPARK_MARGIN}>
            <Bar dataKey="value" fill={stroke} radius={2} />
          </RechartsBarChart>
        ) : type === 'line' ? (
          <RechartsLineChart data={rows} margin={SPARK_MARGIN}>
            <Line
              dataKey="value"
              type={curve}
              stroke={stroke}
              strokeWidth={2}
              dot={false}
            />
          </RechartsLineChart>
        ) : (
          <RechartsAreaChart data={rows} margin={SPARK_MARGIN}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.4} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              dataKey="value"
              type={curve}
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
            />
          </RechartsAreaChart>
        )}
      </ResponsiveContainer>
    </ChartFrame>
  );
}

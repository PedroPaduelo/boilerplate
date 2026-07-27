/**
 * COMPONENTE PRÓPRIO — preset do `SparkChart`, não um gráfico novo.
 *
 * O `sparkline.tsx` legado era um SVG à parte que desenhava exatamente o mesmo
 * que o spark de área, só que com `preserveAspectRatio="none"` (que distorce o
 * traço) e cor por classe Tailwind. Em vez de manter dois desenhos iguais, este
 * arquivo fixa o preset "linha de tendência enxuta" sobre o único motor de
 * spark do app — zero duplicação de paleta ou de geometria.
 */
import { SparkChart } from './spark-chart';
import type { ChartStateProps } from './types';
import type { ChartSeriesColor } from './use-chart-palette';

export interface SparklineProps extends Omit<ChartStateProps, 'label'> {
  /** Série de valores, na ordem temporal. */
  data: number[];
  /** Cor da linha. Sem isto, usa a primeira cor categórica do DS. */
  color?: ChartSeriesColor;
  /** Altura em px. */
  height?: number;
  /** Rótulo acessível — obrigatório (sem eixo, o texto é a única leitura). */
  label: string;
}

/** Linha de tendência compacta com área suave sob ela. */
export function Sparkline({ data, color, height = 56, label, ...state }: SparklineProps) {
  return (
    <SparkChart
      data={data}
      type="area"
      color={color}
      height={height}
      label={label}
      {...state}
    />
  );
}

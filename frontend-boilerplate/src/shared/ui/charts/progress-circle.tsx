/**
 * COMPONENTE PRÓPRIO — o Astryx só tem `ProgressBar` (linear). Resolve
 * "progresso em pouco espaço": anel de 360° que cabe dentro de uma célula ou
 * ao lado de um número.
 *
 * Substitui `progress-circle-tremor.tsx` + `progress-circle-tremor-variants.ts`,
 * cujas variantes eram cores cruas do Tailwind (`stroke-blue-500`,
 * `stroke-emerald-200`) sem relação com o tema. Agora o tom sai dos tokens
 * semânticos do DS e o papel ARIA é `progressbar`, com valor de verdade.
 */
import { Cell, Label, Pie, PieChart } from 'recharts';
import { ChartCenterLabel } from './chart-center-label';
import { ChartFrame } from './chart-frame';
import type { ChartStateProps } from './types';
import { useChartPalette } from './use-chart-palette';

/** Tom semântico do anel — espelha as variantes do `ProgressBar` do DS. */
export type ProgressCircleTone =
  | 'accent'
  | 'positive'
  | 'warning'
  | 'negative'
  | 'neutral';

export interface ProgressCircleProps extends Omit<ChartStateProps, 'label'> {
  /** Valor atual (0..`max`). */
  value: number;
  /** Total da escala. */
  max?: number;
  /** Diâmetro do anel em px. */
  size?: number;
  /** Espessura do anel em px. */
  thickness?: number;
  /** Tom semântico do preenchimento. */
  tone?: ProgressCircleTone;
  /** Rótulo acessível — obrigatório (ex.: "Cobertura de testes"). */
  label: string;
  /** Leitura central já formatada (ex.: "73%"). */
  centerValue?: string;
  /** Legenda sob a leitura central. */
  centerCaption?: string;
}

/** Anel começando no topo e girando no sentido horário. */
const START_ANGLE = 90;

/** Círculo de progresso com leitura central opcional. */
export function ProgressCircle({
  value,
  max = 100,
  size = 72,
  thickness = 8,
  tone = 'accent',
  label,
  centerValue,
  centerCaption,
  isLoading,
  emptyMessage,
  summary,
}: ProgressCircleProps) {
  const palette = useChartPalette();
  const safeMax = max || 1;
  const fraction = Math.min(Math.max(value / safeMax, 0), 1);
  const outerRadius = Math.round(size / 2);
  const innerRadius = Math.max(outerRadius - thickness, 0);
  const fill = palette.chrome(tone);
  const reading = centerValue ?? `${Math.round(fraction * 100)}%`;

  return (
    <ChartFrame
      label={label}
      summary={summary}
      height={size}
      role="progressbar"
      valueNow={value}
      valueMin={0}
      valueMax={max}
      valueText={reading}
      isCentered
      isCompact
      isLoading={isLoading}
      isEmpty={!Number.isFinite(value)}
      emptyMessage={emptyMessage}
    >
      <PieChart width={size} height={size}>
        <Pie
          data={[{ value: fraction }, { value: 1 - fraction }]}
          dataKey="value"
          startAngle={START_ANGLE}
          endAngle={START_ANGLE - 360}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          stroke="none"
        >
          <Cell fill={fill} />
          <Cell fill={palette.chrome('track')} />
          {centerValue ? (
            <Label
              position="center"
              content={(props) => (
                <ChartCenterLabel
                  viewBox={props.viewBox}
                  value={reading}
                  caption={centerCaption}
                  palette={palette}
                />
              )}
            />
          ) : null}
        </Pie>
      </PieChart>
    </ChartFrame>
  );
}

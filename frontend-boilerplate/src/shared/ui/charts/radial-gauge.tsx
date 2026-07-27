/**
 * COMPONENTE PRÓPRIO — o Astryx não tem medidores. Resolve "onde este valor cai
 * dentro de uma faixa": arco de 270° com leitura central e limiares de cor.
 *
 * Substitui `radial-gauge.tsx`, que montava o arco com `strokeDasharray` à mão,
 * usava `var(--muted)`/`var(--primary)` do tema legado e aplicava um
 * `drop-shadow` na cor do arco. Agora o arco é do recharts, a cor sai da paleta
 * do DS e o papel ARIA é `meter` — um medidor tem valor, não é só imagem.
 */
import { Cell, Label, Pie, PieChart } from 'recharts';
import { ChartCenterLabel } from './chart-center-label';
import { ChartFrame } from './chart-frame';
import { formatChartValue } from './chart-data';
import type { ChartStateProps, ValueFormatter } from './types';
import type { ChartSeriesColor } from './use-chart-palette';
import { useChartPalette } from './use-chart-palette';

/** Faixa de cor: vale enquanto `value <= upTo`. */
export interface RadialGaugeThreshold {
  /** Limite superior (inclusive) da faixa. */
  upTo: number;
  /** Cor categórica aplicada ao arco dentro da faixa. */
  color: ChartSeriesColor;
}

export interface RadialGaugeProps extends Omit<ChartStateProps, 'label'> {
  /** Valor medido. */
  value: number;
  /** Início da escala. */
  min?: number;
  /** Fim da escala. */
  max?: number;
  /** Rótulo acessível do medidor — obrigatório. */
  label: string;
  /** Legenda sob a leitura central (ex.: "do orçamento"). */
  caption?: string;
  /** Diâmetro do medidor em px. */
  size?: number;
  /** Espessura do arco em px. */
  thickness?: number;
  /** Cor fixa do arco. Vence `thresholds`. */
  color?: ChartSeriesColor;
  /** Faixas de cor por valor, do menor `upTo` para o maior. */
  thresholds?: RadialGaugeThreshold[];
  /** Formata a leitura central. */
  valueFormatter?: ValueFormatter;
}

/** Arco aberto de 270°: começa em 225° e termina em -45°. */
const START_ANGLE = 225;
const SWEEP = 270;

/** Escolhe a cor da faixa em que o valor cai. */
function resolveColor(
  value: number,
  color?: ChartSeriesColor,
  thresholds?: RadialGaugeThreshold[],
): ChartSeriesColor | undefined {
  if (color) return color;
  if (!thresholds || thresholds.length === 0) return undefined;
  const match = thresholds.find((threshold) => value <= threshold.upTo);
  return (match ?? thresholds[thresholds.length - 1]).color;
}

/** Medidor radial com arco de 270°, leitura central e limiares de cor. */
export function RadialGauge({
  value,
  min = 0,
  max = 100,
  label,
  caption,
  size = 140,
  thickness = 12,
  color,
  thresholds,
  valueFormatter = formatChartValue,
  isLoading,
  emptyMessage,
  summary,
}: RadialGaugeProps) {
  const palette = useChartPalette();
  const span = max - min || 1;
  const fraction = Math.min(Math.max((value - min) / span, 0), 1);
  const outerRadius = Math.round(size / 2);
  const innerRadius = Math.max(outerRadius - thickness, 0);
  const arcColor = palette.colorAt(0, resolveColor(value, color, thresholds));
  const reading = valueFormatter(value);

  return (
    <ChartFrame
      label={label}
      summary={summary}
      height={size}
      role="meter"
      valueNow={value}
      valueMin={min}
      valueMax={max}
      valueText={caption ? `${reading} — ${caption}` : reading}
      isCentered
      isCompact
      isLoading={isLoading}
      isEmpty={!Number.isFinite(value)}
      emptyMessage={emptyMessage}
    >
      <PieChart width={size} height={size}>
        <Pie
          data={[{ value: 1 }]}
          dataKey="value"
          startAngle={START_ANGLE}
          endAngle={START_ANGLE - SWEEP}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          isAnimationActive={false}
          stroke="none"
        >
          <Cell fill={palette.chrome('track')} />
        </Pie>
        <Pie
          data={[{ value: 1 }]}
          dataKey="value"
          startAngle={START_ANGLE}
          endAngle={START_ANGLE - SWEEP * fraction}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          stroke="none"
        >
          <Cell fill={arcColor} />
          <Label
            position="center"
            content={(props) => (
              <ChartCenterLabel
                viewBox={props.viewBox}
                value={reading}
                caption={caption}
                palette={palette}
                tone={arcColor}
              />
            )}
          />
        </Pie>
      </PieChart>
    </ChartFrame>
  );
}

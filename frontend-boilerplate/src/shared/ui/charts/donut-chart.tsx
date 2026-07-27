/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Resolve "composição de um
 * total": fatias proporcionais com leitura central opcional.
 *
 * Substitui `donut-chart.tsx`, que montava o anel com `strokeDasharray` à mão e
 * recebia a cor por classe Tailwind (`stroke-chart-1`) ou `style` cru. Agora o
 * arco é do recharts e a cor de cada fatia vem da paleta categórica do DS.
 */
import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartCenterLabel } from './chart-center-label';
import {
  CATEGORY_KEY,
  describePoints,
  formatChartValue,
  isPointsEmpty,
  toPointRows,
} from './chart-data';
import { ChartFrame } from './chart-frame';
import { ChartLegend } from './chart-legend';
import { ChartTooltip } from './chart-tooltip';
import type { ChartPoint, ChartStateProps, ValueFormatter } from './types';
import { useChartPalette } from './use-chart-palette';

export interface DonutChartProps extends ChartStateProps {
  /** Fatias do anel. O ângulo de cada uma é proporcional ao total. */
  data: ChartPoint[];
  /** Altura da plotagem em px (o anel é centrado nela). */
  height?: number;
  /** Espessura do anel, de 0 (pizza cheia) a 1. */
  thickness?: number;
  /** Leitura principal no vão central, já formatada. */
  centerValue?: string;
  /** Legenda abaixo da leitura central. */
  centerCaption?: string;
  /** Legenda categoria → cor abaixo da plotagem. */
  showLegend?: boolean;
  /** Formata o valor no tooltip. */
  valueFormatter?: ValueFormatter;
}

/** Raio externo, como fração do menor lado da plotagem. */
const OUTER_RADIUS_RATIO = 0.42;

/** Gráfico de rosca com fatias tematizadas e leitura central opcional. */
export function DonutChart({
  data,
  height = 240,
  thickness = 0.42,
  centerValue,
  centerCaption,
  showLegend = true,
  valueFormatter = formatChartValue,
  isLoading,
  emptyMessage,
  label = 'Gráfico de rosca',
  summary,
}: DonutChartProps) {
  const palette = useChartPalette();
  const isEmpty = isPointsEmpty(data);
  const rows = toPointRows(data);
  const outerRadius = Math.round(height * OUTER_RADIUS_RATIO);
  const innerRadius = Math.round(outerRadius * (1 - Math.min(Math.max(thickness, 0), 1)));

  return (
    <ChartFrame
      label={label}
      summary={summary ?? describePoints(data, valueFormatter)}
      height={height}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      footer={
        showLegend ? (
          <ChartLegend
            items={data.map((point, index) => ({
              label: point.label,
              color: palette.varAt(index, point.color),
            }))}
          />
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Tooltip
            wrapperStyle={{ outline: 'none' }}
            content={(props) => {
              const entry = props.payload?.[0];
              if (!props.active || !entry) return null;
              const index = data.findIndex((point) => point.label === String(entry.name));
              return (
                <ChartTooltip
                  rows={[
                    {
                      label: String(entry.name ?? ''),
                      value: valueFormatter(Number(entry.value ?? 0)),
                      color:
                        index >= 0 ? palette.varAt(index, data[index].color) : undefined,
                    },
                  ]}
                />
              );
            }}
          />
          <Pie
            data={rows}
            dataKey="value"
            nameKey={CATEGORY_KEY}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={1}
            stroke={palette.chrome('surface')}
            strokeWidth={2}
          >
            {data.map((point, index) => (
              <Cell key={point.label} fill={palette.colorAt(index, point.color)} />
            ))}
            {centerValue ? (
              <Label
                position="center"
                content={(props) => (
                  <ChartCenterLabel
                    viewBox={props.viewBox}
                    value={centerValue}
                    caption={centerCaption}
                    palette={palette}
                  />
                )}
              />
            ) : null}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

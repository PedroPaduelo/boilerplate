/**
 * COMPONENTE PRÓPRIO — o Astryx só tem `ProgressBar` (linear). Resolve
 * "progresso rumo a um total": um anel de volta completa com a leitura no vão
 * central.
 *
 * Substitui `progress-circle-tremor.tsx` + `progress-circle-tremor-variants.ts`,
 * cujas variantes eram cores cruas do Tailwind (`stroke-blue-500`,
 * `stroke-emerald-200`) sem relação com o tema. Agora o tom sai dos tokens
 * semânticos do DS e o papel ARIA é `progressbar`, com valor de verdade.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT — o vocabulário dos circulares da referência
 * ---------------------------------------------------------------------------
 * A referência não tem um "anel de progresso" próprio: ele é a rosca
 * (`03-tipos-de-grafico.md` §10) com UMA fatia, então herda o vocabulário dela
 * e o dos medidores (§11–§13) — decisão registrada em `docs/charts/NOTAS.md`.
 *
 *   1. volta completa (0 → 360) começando no topo;
 *   2. anel com o furo da rosca, 72% (`geometry.donutHole`);
 *   3. trilha `rgba(145,158,171,.16)` — `palette.chrome('track')`, a trilha de
 *      medidor radial da base (§10);
 *   4. valor central 17,5px/700 na cor de ênfase e rótulo "Total" 12,25px/600
 *      na cor de rótulo — os rótulos centrais da rosca (`01-fundamentos.md` §4);
 *   5. ponta ARREDONDADA do arco (base §6);
 *   6. modo `sparkline`: sem eixo, sem grade, sem padding; esqueleto REDONDO
 *      (§8) e entrada de 360ms (§3).
 *
 * O anel é pintado por TOM SEMÂNTICO (`tone`), não por cor de série: ele
 * responde "quanto falta", não "qual categoria" — por isso não cicla a paleta
 * categórica nem usa o gradiente dos medidores.
 */
import { Cell, Label, Pie, PieChart } from 'recharts';
import { chartAnimationProps } from './chart-axes';
import { ChartFrame } from './chart-frame';
import type { ChartFrameState } from './chart-frame';
import type { ChartScope } from './chart-template';
import { chartPlainText } from './chart-text-html';
import { CHART_HEIGHT, CHART_NO_MARGIN } from './chart-theme';
import type { ChartStateProps } from './types';
import { useChartPalette } from './use-chart-palette';
import type { ChartPalette } from './use-chart-palette';

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
  /** Espessura do anel em px. Sem isto, sai do furo da rosca (72%). */
  thickness?: number;
  /** Tom semântico do preenchimento. */
  tone?: ProgressCircleTone;
  /** Rótulo acessível — obrigatório (ex.: "Cobertura de testes"). */
  label: string;
  /** Leitura central já formatada (ex.: "73%"). */
  centerValue?: string;
  /** Legenda sob a leitura central (o "Total" da referência). */
  centerCaption?: string;
  /**
   * Escopo de `{{interpolação}}` dos textos (de `buildChartScope`). Vale para
   * rótulo acessível, leitura central e legenda — o contrato comum do catálogo
   * manda TODO texto de bloco passar por ele.
   */
  scope?: ChartScope;
  /**
   * Estado do gráfico, para o que `isLoading`/vazio não cobrem (erro, sem
   * permissão). `success` é ignorado de propósito: quem sabe se há valor para
   * desenhar é este componente.
   */
  state?: ChartFrameState;
  /** Detalhe do erro, exibido no aviso quando `state="error"`. */
  errorMessage?: string;
}

/** Anel começando no topo e girando no sentido horário. */
const START_ANGLE = 90;

/** Volta completa, em graus. */
const FULL_TURN = 360;

/** Raio externo do anel, como fração do lado do quadro. */
const OUTER_RADIUS_RATIO = 0.45;

/** Modo `sparkline`: o anel encosta nas bordas do quadro, sem padding. */
const NO_MARGIN = CHART_NO_MARGIN;

/** Distância entre o valor e a legenda central, em fração do lado do quadro. */
const STACK_OFFSET = 12 / CHART_HEIGHT.circular;

/** Percentual inteiro exibido quando quem chama não formata a leitura. */
function defaultReading(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** Tipografia dos rótulos centrais da rosca (`01-fundamentos.md` §4). */
function centerTypography(palette: ChartPalette) {
  return {
    value: {
      fontSize: palette.typography.centerValue.size,
      fontWeight: palette.typography.centerValue.weight,
      fill: palette.chrome('emphasis'),
    },
    total: {
      fontSize: palette.typography.centerTotal.size,
      fontWeight: palette.typography.centerTotal.weight,
      fill: palette.chrome('label'),
    },
  };
}

/** Centro polar entregue pelo `<Label>` do recharts. `null` se vier outra forma. */
function readCenter(viewBox: unknown): { cx: number; cy: number } | null {
  if (!viewBox || typeof viewBox !== 'object') return null;
  const { cx, cy } = viewBox as { cx?: unknown; cy?: unknown };
  if (typeof cx !== 'number' || typeof cy !== 'number') return null;
  return { cx, cy };
}

/** Anel de progresso com leitura central. */
export function ProgressCircle({
  value,
  max = 100,
  size = CHART_HEIGHT.circular,
  thickness,
  tone = 'accent',
  label,
  centerValue,
  centerCaption,
  scope,
  state,
  isLoading,
  emptyMessage,
  errorMessage,
  summary,
}: ProgressCircleProps) {
  const palette = useChartPalette();
  const safeMax = max || 1;
  const fraction = Math.min(Math.max(value / safeMax, 0), 1);

  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = Math.round(size * OUTER_RADIUS_RATIO);
  const innerRadius = Math.max(
    thickness == null
      ? Math.round(outerRadius * palette.geometry.donutHole)
      : outerRadius - thickness,
    0,
  );
  const band = outerRadius - innerRadius;
  // §6: ponta ARREDONDADA — no recharts, raio de canto igual à meia espessura.
  // Um anel fechado (100%) não tem ponta para arredondar.
  const cornerRadius = fraction >= 1 ? 0 : band / 2;

  const raw = centerValue ?? defaultReading(fraction);
  const reading = chartPlainText(raw, scope) || raw;
  const total = centerCaption
    ? chartPlainText(centerCaption, scope) || centerCaption
    : undefined;
  const typography = centerTypography(palette);
  // `success` não sobrepõe o vazio/carregando que este componente calcula.
  const frameState = state && state !== 'success' ? state : undefined;

  return (
    <ChartFrame
      label={label}
      scope={scope}
      summary={summary ? chartPlainText(summary, scope) || summary : undefined}
      height={size}
      role="progressbar"
      valueNow={value}
      valueMin={0}
      valueMax={max}
      valueText={total ? `${reading} — ${total}` : reading}
      isCircular
      isBare
      isCompact
      state={frameState}
      isLoading={isLoading}
      isEmpty={!Number.isFinite(value)}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
    >
      <PieChart width={size} height={size} margin={NO_MARGIN}>
        <Pie
          data={[{ value: 1 }]}
          dataKey="value"
          cx={cx}
          cy={cy}
          startAngle={START_ANGLE}
          endAngle={START_ANGLE - FULL_TURN}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          isAnimationActive={false}
          stroke="none"
        >
          <Cell fill={palette.chrome('track')} />
          <Label
            position="center"
            content={(props) => {
              const center = readCenter(props.viewBox);
              if (!center) return null;
              const shift = total ? STACK_OFFSET * size : 0;
              return (
                <g data-slot="chart-center-label">
                  <text
                    x={center.cx}
                    y={center.cy - shift}
                    textAnchor="middle"
                    dominantBaseline="central"
                    {...typography.value}
                  >
                    {reading}
                  </text>
                  {total ? (
                    <text
                      x={center.cx}
                      y={center.cy + shift}
                      textAnchor="middle"
                      dominantBaseline="central"
                      {...typography.total}
                    >
                      {total}
                    </text>
                  ) : null}
                </g>
              );
            }}
          />
        </Pie>
        {fraction > 0 ? (
          <Pie
            data={[{ value: 1 }]}
            dataKey="value"
            cx={cx}
            cy={cy}
            startAngle={START_ANGLE}
            endAngle={START_ANGLE - FULL_TURN * fraction}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            cornerRadius={cornerRadius}
            stroke="none"
            {...chartAnimationProps(palette)}
          >
            <Cell fill={palette.chrome(tone)} />
          </Pie>
        ) : null}
      </PieChart>
    </ChartFrame>
  );
}

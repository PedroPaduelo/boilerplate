/**
 * COMPONENTE PRÓPRIO — leitura central dos anéis (donut, medidor radial,
 * círculo de progresso). O texto precisa ficar DENTRO do SVG do recharts para
 * acompanhar o centro calculado por ele; fora dali só sobraria posicionamento
 * absoluto no DOM, que quebra ao redimensionar. Por isso é `<text>` — e, como
 * manda o contrato, com cor e tamanho vindos de token via `useChartPalette`.
 *
 * Compartilhado pelos três anéis para não repetir o mesmo `<text>` três vezes.
 */
import type { ChartPalette } from './use-chart-palette';

/** Deslocamento vertical (unidades do SVG) quando há valor + legenda. */
const STACK_OFFSET = 10;

/**
 * O recharts entrega `viewBox` como união cartesiana|polar. Só nos interessa o
 * centro polar; qualquer outra forma vira `null` e o rótulo não é desenhado.
 */
function readCenter(viewBox: unknown): { cx: number; cy: number } | null {
  if (!viewBox || typeof viewBox !== 'object') return null;
  const { cx, cy } = viewBox as { cx?: unknown; cy?: unknown };
  if (typeof cx !== 'number' || typeof cy !== 'number') return null;
  return { cx, cy };
}

export interface ChartCenterLabelProps {
  /** `viewBox` repassado pelo `<Label content={...}>` do recharts. */
  viewBox?: unknown;
  /** Leitura principal, já formatada (ex.: "73%"). */
  value: string;
  /** Legenda abaixo do valor (ex.: "de 1.000"). */
  caption?: string;
  /** Paleta ativa — fonte de cor e tipografia. */
  palette: ChartPalette;
  /** Cor do valor. Sem isto, usa a cor de texto primária do tema. */
  tone?: string;
}

/** Valor (e legenda opcional) centralizados no vão de um anel. */
export function ChartCenterLabel({
  viewBox,
  value,
  caption,
  palette,
  tone,
}: ChartCenterLabelProps) {
  const center = readCenter(viewBox);
  if (!center) return null;

  const valueY = caption ? center.cy - STACK_OFFSET : center.cy;

  return (
    <g data-slot="chart-center-label">
      <text
        x={center.cx}
        y={valueY}
        textAnchor="middle"
        dominantBaseline="central"
        fill={tone ?? palette.chrome('emphasis')}
        fontSize={palette.token('--font-size-xl')}
        fontWeight={palette.token('--font-weight-semibold')}
      >
        {value}
      </text>
      {caption ? (
        <text
          x={center.cx}
          y={center.cy + STACK_OFFSET}
          textAnchor="middle"
          dominantBaseline="central"
          fill={palette.chrome('label')}
          fontSize={palette.axisFontSize}
        >
          {caption}
        </text>
      ) : null}
    </g>
  );
}

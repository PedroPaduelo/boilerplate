/**
 * COMPONENTE PRÓPRIO — leitura central dos anéis (donut, medidor radial,
 * círculo de progresso). O texto precisa ficar DENTRO do SVG do recharts para
 * acompanhar o centro calculado por ele; fora dali só sobraria posicionamento
 * absoluto no DOM, que quebra ao redimensionar. Por isso é `<text>` — e, como
 * manda o contrato, com cor e tamanho vindos do tema de gráfico.
 *
 * TIPOGRAFIA — `02-configuracao-base.md` §10 (rótulos centrais da rosca), que o
 * medidor radial herda:
 *   valor    17,5px / 700 / cor de ênfase   (`CHART_TYPOGRAPHY.centerValue`)
 *   "Total"  12,25px / 600 / cor de rótulo  (`CHART_TYPOGRAPHY.centerTotal`)
 *
 * Antes o valor saía de `--font-size-xl` (21px) com peso 600 e a legenda dos
 * 12px do eixo: os três anéis do catálogo liam a mesma coisa em dois corpos
 * diferentes do que a referência pede.
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
  /** Cor da legenda. Sem isto, usa a cor de rótulo do tema. */
  captionTone?: string;
  /**
   * Tamanho do valor, em px. Sem isto, os 17,5px da referência. A barra radial
   * (§11) é o único tipo que reduz esse corpo.
   */
  valueSize?: number;
  /** Tamanho da legenda, em px. Sem isto, os 12,25px da referência. */
  captionSize?: number;
  /** Peso da legenda. Sem isto, o 600 da referência. */
  captionWeight?: number;
}

/** Valor (e legenda opcional) centralizados no vão de um anel. */
export function ChartCenterLabel({
  viewBox,
  value,
  caption,
  palette,
  tone,
  captionTone,
  valueSize,
  captionSize,
  captionWeight,
}: ChartCenterLabelProps) {
  const center = readCenter(viewBox);
  if (!center) return null;

  const valueY = caption ? center.cy - STACK_OFFSET : center.cy;
  const { centerValue, centerTotal } = palette.typography;

  return (
    <g data-slot="chart-center-label">
      <text
        x={center.cx}
        y={valueY}
        textAnchor="middle"
        dominantBaseline="central"
        fill={tone ?? palette.chrome('emphasis')}
        fontSize={valueSize ?? centerValue.size}
        fontWeight={centerValue.weight}
      >
        {value}
      </text>
      {caption ? (
        <text
          x={center.cx}
          y={center.cy + STACK_OFFSET}
          textAnchor="middle"
          dominantBaseline="central"
          fill={captionTone ?? palette.chrome('label')}
          fontSize={captionSize ?? centerTotal.size}
          fontWeight={captionWeight ?? centerTotal.weight}
        >
          {caption}
        </text>
      ) : null}
    </g>
  );
}

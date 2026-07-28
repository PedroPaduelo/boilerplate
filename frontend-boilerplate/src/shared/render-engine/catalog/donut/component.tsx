/**
 * Bloco `donut` (shape 'categorical') — composição de um total sobre o
 * `DonutChart` de `@/shared/ui`.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL (`docs/charts/BRIEFING-SUBAGENTE.md` §4)
 * ---------------------------------------------------------------------------
 * 1. Grade só horizontal, tracejada 3 ...... N/A — circular é `sparkline`: sem
 *    grade e sem eixos (`03-tipos-de-grafico.md` §9/§10).
 * 2. Eixos sem linha e sem marcações ....... N/A — idem.
 * 3. Texto dos eixos 12px/400/#919EAB ...... N/A — não há eixo.
 * 4. Linha 2,5px, curva suave, sem pontos .. N/A — não há linha.
 * 5. Coluna com raio 4px, largura 48% ...... N/A — não há coluna.
 * 6. Hover ESCURECE ........................ OK — a fatia sob o cursor troca
 *    para `palette.hoverAt()` / `darkenColor()` (`DonutChart`).
 * 7. Tooltip branco 90% com blur ........... OK — `ChartTooltip` da base.
 * + Animação 360ms .......................... OK — `chartAnimationProps`.
 * + Circular sem eixo/grade, legenda fora ... OK — `ChartLegends` no rodapé do
 *   `ChartFrame`, nunca a legenda do motor.
 * + Cores da proporção (§9) ................. OK — verde escuro a 80%, âmbar,
 *   azul petróleo e vermelho, nesta ordem, quando `palette` não fixa uma cor.
 * + 240 × 240 quadrado e centralizado ....... OK — `CHART_HEIGHT.circular` +
 *   `ChartFrame isCircular`.
 * + Espessura do anel ....................... OK — 24px do tema
 *   (`CHART_GEOMETRY.ringThickness`, via `chartRingInnerRadius`), a MESMA do
 *   anel de progresso e dos medidores. Era o furo de 72% da referência, que
 *   dava 34px aqui contra 30 e 88 nos vizinhos da mesma grade.
 * + Rótulos centrais 17,5/700 e 12,25/600 ... PARCIAL — `ChartCenterLabel` da
 *   base (17,5px pelo token `--font-size-xl`; peso e o 12,25px do "Total"
 *   dependem de mudança na base — pedido em `docs/charts/PEDIDOS-BASE.md`).
 *
 * ---------------------------------------------------------------------------
 * O que mudou nesta repaginação
 * ---------------------------------------------------------------------------
 *  - o anel virou o desenho da referência (quadrado, sparkline, traço 0) e
 *    deixou de disputar espaço com a legenda numa `HStack`;
 *  - a legenda passou a ser a `ChartLegends` da base, desenhada pelo próprio
 *    `DonutChart` — quem conhece a cor da fatia é ele. O que continuou do
 *    bloco é o TEXTO do valor ("62 (62%)"), em `donut-legend.tsx`;
 *  - `state === 'error'` deixou de virar "estado vazio com texto de erro" e
 *    passa ao `ChartFrame`, que tem o aviso de erro de verdade;
 *  - COR: `accent` continua aceitando o vocabulário antigo, mas vira token de
 *    dado do DS. Em `palette: "multi"` a sequência da proporção cicla — é ela
 *    que garante fatias vizinhas distinguíveis.
 */
import type { CategoricalData } from '@dashboards/contracts';
import {
  CHART_HEIGHT,
  CHART_SERIES_COLORS,
  DonutChart,
  chartAccentColor,
  isMultiColorPalette,
} from '@/shared/ui';
import type { ChartPoint } from '@/shared/ui';
import { formatPercentBR, type ValueFormat } from '@/shared/lib/format';
import { formatCatalogValue } from '../../lib/value-format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { donutLegendValue } from './donut-legend';
import { manifest } from './manifest';
import { fixture } from './fixture';

type DonutProps = {
  showLegend?: boolean;
  centerLabel?: string;
  /**
   * Modo de paleta. `none` saiu do enum do manifesto por ser redundante, mas
   * continua aceito aqui como sinônimo histórico de `multi` (ver o componente).
   */
  palette?: 'single' | 'multi' | 'none';
  /** Cor das fatias; resolvida para token do DS. Vence `palette: "multi"`. */
  accent?: string;
  /** Formato do valor no centro e na legenda (enum fechado do catálogo). */
  valueFormat?: ValueFormat;
};

/** Elemento de `CategoricalData` anotado localmente (no FE resolve p/ any). */
type CategoryPoint = { label: string; value: number | null };

/** Rótulo padrão do vão central, quando o bloco não declara outro. */
const CENTER_LABEL = 'Total';

export const Component: BlockComponent<DonutProps, CategoricalData> = ({
  props,
  data,
  state,
  error,
}) => {
  const items = (data ?? []) as CategoryPoint[];
  const formatValue = (value: number) => formatCatalogValue(value, props.valueFormat);

  /**
   * COR — a regra de precedência publicada em `chart-accent.ts`:
   *  1. `accent` reconhecível vence sempre (pedir uma cor É pedir cor única);
   *  2. `multi` só cicla a sequência da proporção (§9) quando NÃO há acento.
   *
   * Era `props.palette === 'single' ? chartAccentColor(...) : undefined`: quem
   * pedia só a cor não via mudança, porque o acento dependia de a paleta estar
   * no valor certo.
   *
   * `none` é o nome ANTIGO de "multi" NESTE bloco (ele sempre ciclou aqui, ao
   * contrário do `bar_list`, onde caía em cor única). Ele saiu do enum por ser
   * redundante, mas continua sendo traduzido: painel salvo não pode trocar de
   * desenho por causa de uma limpeza de vocabulário.
   */
  const palette = props.palette === 'none' ? 'multi' : props.palette;
  const isMulti = isMultiColorPalette(palette, props.accent);
  // Sem acento e sem "multi", a fatia usa a 1ª cor da paleta — o desenho que o
  // default `accent: "chart-1"` produzia antes de ele sair dos `defaultProps`.
  const accent = isMulti
    ? undefined
    : (chartAccentColor(props.accent) ?? CHART_SERIES_COLORS[0]);
  const points: ChartPoint[] = items.map((item) => ({
    label: item.label,
    value: item.value ?? 0,
    color: accent,
  }));

  const total = points.reduce((sum, point) => sum + point.value, 0);

  return (
    <DonutChart
      data={points}
      height={CHART_HEIGHT.circular}
      centerValue={formatValue(total)}
      centerCaption={props.centerLabel ?? CENTER_LABEL}
      showLegend={props.showLegend !== false}
      valueFormatter={formatValue}
      legendValueFormatter={donutLegendValue(total, formatValue)}
      state={state === 'error' ? 'error' : undefined}
      errorMessage={error}
      isLoading={state === 'loading' || state === 'skeleton'}
      label={manifest.name}
    />
  );
};

/** Insights de rodapé: maior e menor fatia, em participação no total. */
function deriveTakeaway(data: CategoricalData): string[] | undefined {
  const items = (data ?? []) as CategoryPoint[];
  if (items.length === 0) return undefined;

  const total = items.reduce((sum, item) => sum + (item.value ?? 0), 0) || 1;
  const top = items.reduce((best, item) =>
    (item.value ?? 0) > (best.value ?? 0) ? item : best,
  );
  if ((top.value ?? 0) <= 0) return undefined;

  const insights = [
    `Maior fatia: ${top.label} (${formatPercentBR((top.value ?? 0) / total)})`,
  ];

  if (items.length > 1) {
    const bottom = items.reduce((best, item) =>
      (item.value ?? 0) < (best.value ?? 0) ? item : best,
    );
    if ((bottom.value ?? 0) > 0 && bottom !== top) {
      insights.push(
        `Menor fatia: ${bottom.label} (${formatPercentBR((bottom.value ?? 0) / total)})`,
      );
    }
  }

  return insights;
}

export const definition = defineBlock<DonutProps, CategoricalData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;

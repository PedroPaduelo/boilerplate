/**
 * EIXOS, GRADE E CURSOR — os props compartilhados que dão aos gráficos a
 * "cara de família" da referência.
 *
 * O recharts só reconhece `<CartesianGrid>`/`<XAxis>` como filhos DIRETOS do
 * gráfico, então não dá para embrulhar num componente próprio: o jeito de não
 * duplicar estilo entre área/barra/linha/dispersão é compartilhar os PROPS.
 *
 * O que estes props implementam (`01-fundamentos.md` §9 — checklist mínimo):
 *   • grade SÓ horizontal, tracejada `3`, na cor da divisória do tema;
 *   • eixos SEM linha e SEM marcações;
 *   • texto de eixo 12px / peso 400 / cor de texto desabilitado (#919EAB);
 *   • eixo Y com 5 divisões.
 *
 * Todo valor sai do `chart-theme` via `useChartPalette` — nada é digitado aqui.
 */
import type { ChartPalette } from './use-chart-palette';

export { CHART_MARGIN, CHART_SPARK_MARGIN, Y_AXIS_WIDTH } from './chart-theme';

/** Grade horizontal tracejada, na cor da divisória do tema. */
export function chartGridProps(palette: ChartPalette) {
  return {
    stroke: palette.chrome('grid'),
    strokeDasharray: palette.geometry.gridDash,
    vertical: palette.geometry.gridVertical,
  };
}

/**
 * Estilo comum de eixo: sem linha, sem marcações, tipografia do tema.
 *
 * `tickMargin` de 8px reproduz o respiro que a referência deixa entre o
 * desenho e o rótulo depois de remover as marcações.
 */
export function chartAxisProps(palette: ChartPalette) {
  return {
    stroke: palette.chrome('grid'),
    tick: {
      fill: palette.chrome('axis'),
      fontSize: palette.typography.axis.size,
      fontWeight: palette.typography.axis.weight,
    },
    tickLine: false,
    axisLine: false,
    tickMargin: 8,
    minTickGap: 8,
  };
}

/**
 * Props do eixo Y: os mesmos do eixo X mais as 5 divisões da referência.
 * O recharts conta os LIMITES, então 5 divisões = 6 marcas.
 */
export function chartYAxisProps(palette: ChartPalette) {
  return {
    ...chartAxisProps(palette),
    tickCount: palette.geometry.yTickCount + 1,
  };
}

/** Cursor (guia) exibido sob o ponteiro nos gráficos de linha/área. */
export function chartCursorProps(palette: ChartPalette) {
  return {
    stroke: palette.chrome('axis'),
    strokeDasharray: palette.geometry.gridDash,
    strokeWidth: 1,
  };
}

/** Cursor das barras: realce de faixa em vez de linha. */
export function chartBarCursorProps(palette: ChartPalette) {
  return { fill: palette.chrome('trackLight') };
}

/**
 * Animação de entrada em cascata: a série `index` começa
 * `index × 120ms` depois da anterior, com 360ms de duração
 * (`02-configuracao-base.md` §3).
 */
export function chartAnimationProps(palette: ChartPalette, index = 0) {
  return {
    isAnimationActive: true,
    animationDuration: palette.motion.duration,
    animationBegin: index * palette.motion.stagger,
    animationEasing: 'ease-out' as const,
  };
}

/**
 * Raio do topo de uma coluna — arredondado SÓ na ponta
 * (`02-configuracao-base.md` §10). Empilhadas não arredondam: o canto no meio
 * da pilha viraria um degrau.
 */
export function chartBarRadius(
  palette: ChartPalette,
  isStacked = false,
): [number, number, number, number] | undefined {
  if (isStacked) return undefined;
  const r = palette.geometry.barRadius;
  return [r, r, 0, 0];
}

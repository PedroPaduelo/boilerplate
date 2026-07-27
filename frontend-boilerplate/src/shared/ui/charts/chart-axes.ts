/**
 * COMPONENTE PRÓPRIO — configuração compartilhada de eixos, grade e cursor do
 * recharts. O recharts só reconhece `<CartesianGrid>`/`<XAxis>` como filhos
 * DIRETOS do gráfico, então não dá para embrulhar num componente próprio: o
 * jeito de não duplicar estilo entre área/barras/linha/dispersão é compartilhar
 * os PROPS. Todo valor de cor/tipografia sai do `useChartPalette` (tokens).
 */
import type { ChartPalette } from './use-chart-palette';

/**
 * Margem da área de plotagem, em unidades do SVG. Não é espaçamento de layout
 * (isso vem das props do DS) — é geometria do desenho, e o recharts só aceita
 * número aqui.
 */
export const CHART_MARGIN = { top: 8, right: 8, bottom: 0, left: 0 } as const;

/** Largura reservada ao eixo Y (rótulos formatados cabem em ~56px). */
export const Y_AXIS_WIDTH = 56;

/** Grade horizontal tracejada e discreta, na cor de borda do tema. */
export function chartGridProps(palette: ChartPalette) {
  return {
    stroke: palette.chrome('grid'),
    strokeDasharray: '4 4',
    vertical: false,
  };
}

/** Estilo comum de eixo: sem linha de eixo, ticks discretos, tipografia do DS. */
export function chartAxisProps(palette: ChartPalette) {
  return {
    stroke: palette.chrome('grid'),
    tick: { fill: palette.chrome('label'), fontSize: palette.axisFontSize },
    tickLine: false,
    axisLine: false,
    minTickGap: 8,
  };
}

/** Cursor (guia) exibido sob o ponteiro nos gráficos cartesianos. */
export function chartCursorProps(palette: ChartPalette) {
  return {
    stroke: palette.chrome('axis'),
    strokeDasharray: '4 4',
    strokeWidth: 1,
  };
}

/** Cursor das barras: realce de faixa em vez de linha. */
export function chartBarCursorProps(palette: ChartPalette) {
  return { fill: palette.chrome('track'), fillOpacity: 0.5 };
}

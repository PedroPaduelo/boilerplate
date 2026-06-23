/**
 * Bloco `area_chart` (shape 'series', x temporal) — usa o Vitrine `AreaChart`
 * (SVG aderente ao tema, irmão do LineChart). Agrupa os pontos por `series`
 * (multi-série) preservando a ordem do eixo X e suporta empilhamento.
 *
 * Antes usava o `AreaChartTremor` (recharts), que vinha com cores/estilos
 * hardcoded fora do design system; agora a grade, eixos, tooltip e a paleta das
 * séries seguem os tokens do tema (`var(--chart-1..5)`, `border`, `popover`,
 * `muted-foreground`) e funcionam em light/dark.
 */
import type { SeriesData } from '@dashboards/contracts';
import { AreaChart, type AreaSeries, type AreaChartMode } from '@/components/ui/area-chart';
import {
  formatCompactNumberBR,
  formatBRL,
  formatPercentPointsBR,
} from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type AreaProps = {
  type?: 'default' | 'stacked' | 'percent';
  fill?: 'gradient' | 'solid' | 'none';
  showLegend?: boolean;
  showGridLines?: boolean;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

/** Converte SeriesData (long) em séries alinhadas ao eixo X + rótulos do X. */
export function toAreaSeries(data: SeriesData): {
  series: AreaSeries[];
  xLabels: string[];
} {
  const points = (data ?? []) as SeriesPoint[];
  const xOrder: string[] = [];
  const groups = new Map<string, Map<string, number>>();
  for (const point of points) {
    const seriesName = point.series ?? 'Valor';
    const x = String(point.x);
    if (!xOrder.includes(x)) xOrder.push(x);
    if (!groups.has(seriesName)) groups.set(seriesName, new Map());
    groups.get(seriesName)!.set(x, point.y ?? 0);
  }
  const series: AreaSeries[] = [...groups.entries()].map(([label, byX]) => ({
    label,
    data: xOrder.map((x) => byX.get(x) ?? 0),
  }));
  return { series, xLabels: xOrder };
}

export const Component: BlockComponent<AreaProps, SeriesData> = ({ props, data }) => {
  const { series, xLabels } = toAreaSeries(data ?? []);
  const mode = (props.type ?? 'default') as AreaChartMode;
  const isPercent = mode === 'percent';
  return (
    <AreaChart
      series={series}
      xLabels={xLabels}
      mode={mode}
      fill={props.fill ?? 'gradient'}
      showLegend={props.showLegend !== false}
      showGrid={props.showGridLines !== false}
      // eixo Y: percentual no modo 100%, número compacto PT-BR caso contrário
      yValueFormatter={(v) => (isPercent ? formatPercentPointsBR(v) : formatCompactNumberBR(v))}
      // tooltip: valor real (cheio) de cada série, em BRL
      valueFormatter={(v) => formatBRL(v)}
    />
  );
};

export const definition = defineBlock<AreaProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

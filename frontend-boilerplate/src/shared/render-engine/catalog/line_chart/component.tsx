/**
 * Bloco `line_chart` (shape 'series', x temporal) — usa o Vitrine `LineChart`.
 * Agrupa os pontos por `series` (multi-linha) preservando a ordem do eixo X.
 *
 * Prop `palette` (ENTREGA 3): aceita o valor; o render já agrupa por
 * `series` e cicla `STROKE_PALETTE`. Override futuro pode mudar isso
 * (ex.: 'none' = cor única forçada).
 */
import type { SeriesData } from '@dashboards/contracts';
import { LineChart, type LineSeries } from '@/components/ui/line-chart';
import { formatCompactNumberBR, formatBRL } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type LineProps = {
  smooth?: boolean;
  area?: boolean;
  palette?: 'single' | 'multi' | 'none';
};

const STROKE_PALETTE = [
  'stroke-chart-1',
  'stroke-chart-2',
  'stroke-chart-3',
  'stroke-chart-4',
  'stroke-chart-5',
];

/** Converte SeriesData (lista de {x,y,series?}) em séries + rótulos do eixo X. */
export function toLineSeries(data: SeriesData): {
  series: LineSeries[];
  xLabels: string[];
} {
  const xOrder: string[] = [];
  const groups = new Map<string, Map<string, number>>();
  for (const point of data) {
    const seriesName = point.series ?? 'Série';
    const x = String(point.x);
    if (!xOrder.includes(x)) xOrder.push(x);
    if (!groups.has(seriesName)) groups.set(seriesName, new Map());
    groups.get(seriesName)!.set(x, point.y ?? 0);
  }
  const series: LineSeries[] = [...groups.entries()].map(([label, byX], i) => ({
    label,
    data: xOrder.map((x) => byX.get(x) ?? 0),
    className: STROKE_PALETTE[i % STROKE_PALETTE.length],
  }));
  return { series, xLabels: xOrder };
}

export const Component: BlockComponent<LineProps, SeriesData> = ({ props, data }) => {
  // `palette` aceito no schema; render atual já agrupa por `series` (multi).
  const { series, xLabels } = toLineSeries(data ?? []);
  return (
    <LineChart
      series={series}
      xLabels={xLabels}
      showArea={props.area !== false}
      yValueFormatter={(v) => formatCompactNumberBR(v)}
      valueFormatter={(v) => formatBRL(v)}
    />
  );
};

export const definition = defineBlock<LineProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
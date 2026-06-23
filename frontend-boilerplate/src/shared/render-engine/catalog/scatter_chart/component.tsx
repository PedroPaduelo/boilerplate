/**
 * Bloco `scatter_chart` (shape 'series', x/y numéricos) — usa o Vitrine
 * `ScatterChartTremor`. Cada ponto {x,y,series?} vira {x,y,category}.
 */
import type { SeriesData } from '@dashboards/contracts';
import {
  ScatterChartTremor,
  type ScatterChartTremorDatum,
} from '@/components/ui/scatter-chart-tremor';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ScatterProps = {
  showLegend?: boolean;
  showGridLines?: boolean;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<ScatterProps, SeriesData> = ({ props, data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const rows: ScatterChartTremorDatum[] = points.map((p) => ({
    x: Number(p.x),
    y: p.y ?? 0,
    category: p.series ?? 'Série',
  }));
  return (
    <ScatterChartTremor
      data={rows}
      x="x"
      y="y"
      category="category"
      showLegend={props.showLegend !== false}
      showGridLines={props.showGridLines !== false}
      height="h-64"
    />
  );
};

export const definition = defineBlock<ScatterProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

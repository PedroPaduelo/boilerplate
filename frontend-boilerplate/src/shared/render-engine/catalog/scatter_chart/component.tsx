/**
 * Bloco `scatter_chart` (shape 'series', x/y numéricos) — usa o Vitrine
 * `ScatterChartTremor`. Cada ponto {x,y,series?} vira {x,y,category}.
 *
 * Prop `palette` (ENTREGA 3): aceita o valor; hoje o render agrupa por
 * `series` (já é multi por natureza do dataContract). Turno futuro conecta
 * essa prop no mapeamento de cores.
 */
import type { SeriesData } from '@dashboards/contracts';
import {
  ScatterChartTremor,
  type ScatterChartTremorDatum,
} from '@/components/ui/scatter-chart-tremor';
import { formatNumberBR, formatCompactNumberBR } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ScatterProps = {
  showLegend?: boolean;
  showGridLines?: boolean;
  palette?: 'single' | 'multi' | 'none';
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<ScatterProps, SeriesData> = ({ props, data }) => {
  // `palette` aceito no schema; render atual agrupa por `series` (multi).
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
      valueFormatter={(v) => formatNumberBR(v)}
      axisValueFormatter={(v) => formatCompactNumberBR(v)}
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
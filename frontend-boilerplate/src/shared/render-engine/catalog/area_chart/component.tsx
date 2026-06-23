/**
 * Bloco `area_chart` (shape 'series') — usa o Vitrine `AreaChartTremor`.
 * Pivota a série "long" ({x,y,series?}) para o formato "wide" do tremor
 * (uma coluna por série, indexado por `x`).
 */
import type { SeriesData } from '@dashboards/contracts';
import { AreaChartTremor } from '@/components/ui/area-chart-tremor';
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

/** Pivota SeriesData (long) → linhas wide do tremor + lista de categorias. */
function toTremor(data: SeriesData): {
  rows: Record<string, unknown>[];
  categories: string[];
} {
  const points = (data ?? []) as SeriesPoint[];
  const xOrder: string[] = [];
  const categories: string[] = [];
  const byX = new Map<string, Record<string, unknown>>();
  for (const p of points) {
    const x = String(p.x);
    const cat = p.series ?? 'Valor';
    if (!xOrder.includes(x)) xOrder.push(x);
    if (!categories.includes(cat)) categories.push(cat);
    const row = byX.get(x) ?? { x };
    row[cat] = p.y ?? 0;
    byX.set(x, row);
  }
  return {
    rows: xOrder.map((x) => byX.get(x) as Record<string, unknown>),
    categories: categories.length ? categories : ['Valor'],
  };
}

export const Component: BlockComponent<AreaProps, SeriesData> = ({ props, data }) => {
  const { rows, categories } = toTremor(data ?? []);
  return (
    <AreaChartTremor
      data={rows}
      index="x"
      categories={categories}
      type={props.type ?? 'default'}
      fill={props.fill ?? 'gradient'}
      showLegend={props.showLegend !== false}
      showGridLines={props.showGridLines !== false}
      className="h-64 w-full"
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

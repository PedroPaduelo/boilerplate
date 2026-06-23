/**
 * Bloco `h_bar_chart` (shape 'series') — usa o Vitrine `HBarChart` (barras
 * horizontais). Mapeia cada ponto {x,y} para {label,value}.
 */
import type { SeriesData } from '@dashboards/contracts';
import { HBarChart } from '@/components/ui/h-bar-chart';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<Record<string, never>, SeriesData> = ({ data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const series = points.map((p) => ({ label: String(p.x), value: p.y ?? 0 }));
  return <HBarChart series={series} />;
};

export const definition = defineBlock<Record<string, never>, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

/**
 * Bloco `h_bar_chart` (shape 'series') — usa o Vitrine `HBarChart` (barras
 * horizontais). Mapeia cada ponto {x,y} para {label,value}.
 */
import type { SeriesData } from '@dashboards/contracts';
import { HBarChart } from '@/components/ui/h-bar-chart';
import { formatCompactNumberBR } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<Record<string, never>, SeriesData> = ({ data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const series = points.map((p) => ({ label: String(p.x), value: p.y ?? 0 }));
  // accent explícito: alinha com os demais "irmãos" do grupo (line/area/donut/scatter)
  // que recebem cor da paleta de chart, em vez do default `bg-primary` do UI base.
  return (
    <HBarChart
      series={series}
      accent="bg-chart-1"
      valueFormatter={(v) => formatCompactNumberBR(v)}
    />
  );
};

export const definition = defineBlock<Record<string, never>, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

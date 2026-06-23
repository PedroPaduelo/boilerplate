/**
 * Bloco `h_bar_chart` (shape 'series') — usa o Vitrine `HBarChart` (barras
 * horizontais). Mapeia cada ponto {x,y} para {label,value}.
 *
 * Prop `palette` (ENTREGA 3): aceita o valor mas ainda não muda a lógica de
 * render — single-série é o default; multi/none entram em turnos futuros.
 */
import type { SeriesData } from '@dashboards/contracts';
import { HBarChart } from '@/components/ui/h-bar-chart';
import { formatCompactNumberBR } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type HBarProps = {
  palette?: 'single' | 'multi' | 'none';
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<HBarProps, SeriesData> = ({ data }) => {
  // `palette` ainda não influencia o render (sempre single-série hoje);
  // a prop fica no schema/defaultProps para preparar overrides futuros.
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

export const definition = defineBlock<HBarProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
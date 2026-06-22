/**
 * Bloco `bar_chart` (shape 'series') — usa o Vitrine `BarChart`.
 * Mapeia cada ponto {x,y} da série para {label,value} do gráfico.
 */
import type { SeriesData } from '@dashboards/contracts';
import { BarChart } from '@/components/ui/bar-chart';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type BarProps = {
  stacked?: boolean;
  orientation?: 'vertical' | 'horizontal';
  accent?: string;
};

/**
 * Tipo do ponto da série (no FE, `SeriesData` de @dashboards/contracts resolve
 * para `any` porque `json-schema-to-ts` não é dependência do FE — anotamos o
 * elemento localmente para manter o type-safety dentro do bloco).
 */
type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<BarProps, SeriesData> = ({ props, data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const series = points.map((d) => ({
    label: String(d.x),
    value: d.y ?? 0,
  }));
  return <BarChart series={series} accent={props.accent ?? 'bg-chart-1'} />;
};

export const definition = defineBlock<BarProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

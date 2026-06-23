/**
 * Bloco `spark_chart` (shape 'series') — usa o Vitrine `SparkChartTremor`.
 * Reduz a série a um vetor de números (os `y`). Ampliado para a galeria.
 *
 * Prop `palette` (ENTREGA 3): aceita o valor; sparkline é single-série
 * (uma linha de tendência), então o render não muda.
 */
import type { SeriesData } from '@dashboards/contracts';
import { SparkChartTremor } from '@/components/ui/spark-chart-tremor';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SparkProps = {
  type?: 'area' | 'bar' | 'line';
  curveType?: 'linear' | 'monotone' | 'step';
  palette?: 'single' | 'multi' | 'none';
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<SparkProps, SeriesData> = ({ props, data }) => {
  // `palette` aceito no schema; sparkline é single-série por natureza.
  const points = (data ?? []) as SeriesPoint[];
  const values = points.map((p) => p.y ?? 0);
  return (
    <div className="flex justify-center py-4">
      <SparkChartTremor
        data={values}
        type={props.type ?? 'area'}
        curveType={props.curveType ?? 'monotone'}
        className="h-20 w-full"
      />
    </div>
  );
};

export const definition = defineBlock<SparkProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
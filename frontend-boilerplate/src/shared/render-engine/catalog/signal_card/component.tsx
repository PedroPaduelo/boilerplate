/**
 * Bloco `signal_card` (shape 'series') — usa o Vitrine `SignalCard`.
 * Destaca o último valor da série + mini-sparkline + tendência (último vs 1º).
 */
import type { SeriesData } from '@dashboards/contracts';
import { SignalCard } from '@/components/ui/signal-card';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SignalProps = {
  label?: string;
  unit?: string;
  trendPolarity?: 'up-good' | 'up-bad';
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

export const Component: BlockComponent<SignalProps, SeriesData> = ({ props, data }) => {
  const points = (data ?? []) as SeriesPoint[];
  const values = points.map((p) => p.y ?? 0);
  const last = values.length ? values[values.length - 1] : 0;
  const first = values.length ? values[0] : 0;
  const trend = first ? (last - first) / first : undefined;
  return (
    <SignalCard
      label={props.label ?? 'Sinal'}
      value={last.toLocaleString('pt-BR')}
      unit={props.unit}
      data={values}
      trend={trend}
      trendPolarity={props.trendPolarity ?? 'up-good'}
    />
  );
};

export const definition = defineBlock<SignalProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

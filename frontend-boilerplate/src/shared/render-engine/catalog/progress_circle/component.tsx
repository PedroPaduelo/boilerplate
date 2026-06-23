/**
 * Bloco `progress_circle` (shape 'scalar') — usa o Vitrine `ProgressCircleTremor`.
 */
import type { ScalarData } from '@dashboards/contracts';
import { ProgressCircleTremor } from '@/components/ui/progress-circle-tremor';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ProgressCircleProps = {
  max?: number;
  variant?: 'default' | 'neutral' | 'warning' | 'error' | 'success';
};

export const Component: BlockComponent<ProgressCircleProps, ScalarData> = ({ props, data }) => {
  const value = data?.value ?? 0;
  const max = props.max ?? 100;
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <ProgressCircleTremor value={value} max={max} radius={52} strokeWidth={9} variant={props.variant}>
        <span className="text-xl font-semibold tabular-nums text-foreground">{pct}%</span>
      </ProgressCircleTremor>
      {data?.label ? (
        <span className="text-sm text-muted-foreground">{data.label}</span>
      ) : null}
    </div>
  );
};

export const definition = defineBlock<ProgressCircleProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

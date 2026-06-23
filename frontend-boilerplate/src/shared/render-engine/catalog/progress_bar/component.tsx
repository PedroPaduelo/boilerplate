/**
 * Bloco `progress_bar` (shape 'scalar') — usa o Vitrine `ProgressBarTremor`.
 */
import type { ScalarData } from '@dashboards/contracts';
import { ProgressBarTremor } from '@/components/ui/progress-bar-tremor';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ProgressBarProps = {
  max?: number;
  variant?: 'default' | 'neutral' | 'warning' | 'error' | 'success';
};

export const Component: BlockComponent<ProgressBarProps, ScalarData> = ({ props, data }) => {
  const value = data?.value ?? 0;
  const max = props.max ?? 100;
  return (
    <div className="space-y-2 py-2">
      {data?.label ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{data.label}</span>
          <span className="font-medium tabular-nums text-foreground">
            {Math.round((value / max) * 100)}%
          </span>
        </div>
      ) : null}
      <ProgressBarTremor value={value} max={max} variant={props.variant} showAnimation />
    </div>
  );
};

export const definition = defineBlock<ProgressBarProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

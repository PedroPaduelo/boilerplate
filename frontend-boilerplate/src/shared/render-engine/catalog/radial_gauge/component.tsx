/**
 * Bloco `radial_gauge` (shape 'scalar') — usa o Vitrine `RadialGauge`.
 * O `value`/`label`/`unit` vêm dos dados; `max`/`min` das props.
 */
import type { ScalarData } from '@dashboards/contracts';
import { RadialGauge } from '@/components/ui/radial-gauge';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type GaugeProps = {
  max?: number;
  min?: number;
  unit?: string;
};

export const Component: BlockComponent<GaugeProps, ScalarData> = ({ props, data }) => {
  const value = data?.value ?? 0;
  const unit = props.unit ?? data?.unit;
  return (
    <div className="flex justify-center py-2">
      <RadialGauge
        value={value}
        max={props.max ?? 100}
        min={props.min ?? 0}
        label={data?.label}
        unit={unit}
        size={150}
        thickness={12}
      />
    </div>
  );
};

export const definition = defineBlock<GaugeProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

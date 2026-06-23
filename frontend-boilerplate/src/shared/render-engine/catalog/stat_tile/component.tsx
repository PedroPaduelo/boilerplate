/**
 * Bloco `stat_tile` (shape 'scalar') — usa o Vitrine `StatTile`.
 */
import type { ScalarData } from '@dashboards/contracts';
import { StatTile } from '@/components/ui/stat-tile';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type StatTileProps = { hint?: string };

const CURRENCY_PREFIX: Record<string, string> = { BRL: 'R$ ', USD: '$ ', EUR: '€ ' };

export const Component: BlockComponent<StatTileProps, ScalarData> = ({ props, data }) => {
  const value = data?.value ?? 0;
  const unit = data?.unit;
  const prefix = unit ? CURRENCY_PREFIX[unit] : undefined;
  const suffix = unit && !prefix ? unit : undefined;
  const delta = data?.delta != null ? Math.round(data.delta * 1000) / 10 : undefined;
  return (
    <StatTile
      label={data?.label ?? manifest.name}
      value={value}
      prefix={prefix}
      suffix={suffix}
      delta={delta}
      hint={props.hint}
    />
  );
};

export const definition = defineBlock<StatTileProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

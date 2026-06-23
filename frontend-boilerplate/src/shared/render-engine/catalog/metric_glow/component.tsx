/**
 * Bloco `metric_glow` (shape 'scalar') — usa o Vitrine `MetricGlowCard`.
 */
import type { ScalarData } from '@dashboards/contracts';
import { MetricGlowCard } from '@/components/ui/metric-glow-card';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

const CURRENCY_PREFIX: Record<string, string> = { BRL: 'R$ ', USD: '$ ', EUR: '€ ' };

function formatValue(value: number, unit?: string): string {
  const prefix = unit ? CURRENCY_PREFIX[unit] : undefined;
  const suffix = unit && !prefix ? ` ${unit}` : '';
  return `${prefix ?? ''}${value.toLocaleString('pt-BR')}${suffix}`;
}

export const Component: BlockComponent<Record<string, never>, ScalarData> = ({ data }) => {
  const value = data?.value ?? 0;
  const delta = data?.delta;
  const change =
    delta != null ? `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%` : undefined;
  return (
    <MetricGlowCard
      title={data?.label ?? manifest.name}
      value={formatValue(value, data?.unit)}
      change={change}
      positive={(delta ?? 0) >= 0}
    />
  );
};

export const definition = defineBlock<Record<string, never>, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

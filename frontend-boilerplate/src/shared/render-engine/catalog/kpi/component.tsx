/**
 * Bloco `kpi` (shape 'scalar') — usa o Vitrine `KpiCard`.
 * Co-exporta `Component` + `definition` (lido pelo auto-registro via glob).
 */
import type { ScalarData } from '@dashboards/contracts';
import { KpiCard } from '@/components/ui/kpi-card';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type KpiProps = {
  accent?: string;
  icon?: string;
  showDelta?: boolean;
};

/** Unidades monetárias conhecidas viram prefixo; demais viram sufixo. */
const CURRENCY_PREFIX: Record<string, string> = {
  BRL: 'R$ ',
  USD: '$ ',
  EUR: '€ ',
};

export const Component: BlockComponent<KpiProps, ScalarData> = ({ props, data }) => {
  const value = data?.value ?? 0;
  const unit = data?.unit;
  const prefix = unit ? CURRENCY_PREFIX[unit] : undefined;
  const suffix = unit && !prefix ? unit : undefined;
  const showDelta = props.showDelta !== false;
  // dataContract trata `delta` como fração (0.12 = +12%); o KpiCard espera %.
  const delta =
    showDelta && data?.delta != null ? Math.round(data.delta * 1000) / 10 : undefined;

  return (
    <KpiCard
      label={data?.label ?? manifest.name}
      value={value}
      prefix={prefix}
      suffix={suffix}
      delta={delta}
    />
  );
};

export const definition = defineBlock<KpiProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

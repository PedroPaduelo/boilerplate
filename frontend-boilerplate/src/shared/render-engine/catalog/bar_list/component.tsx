/**
 * Bloco `bar_list` (shape 'categorical') — usa o Vitrine `BarListTremor`.
 * Mapeia {label,value} para {name,value} (formato esperado pela lista).
 */
import type { CategoricalData } from '@dashboards/contracts';
import { BarListTremor } from '@/components/ui/bar-list-tremor';
import { formatCompactBRL } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type BarListProps = {
  sortOrder?: 'ascending' | 'descending' | 'none';
};

type CategoryPoint = { label: string; value: number | null };

export const Component: BlockComponent<BarListProps, CategoricalData> = ({ props, data }) => {
  const items = (data ?? []) as CategoryPoint[];
  const rows = items.map((d) => ({ name: d.label, value: d.value ?? 0 }));
  return (
    <BarListTremor
      data={rows}
      sortOrder={props.sortOrder ?? 'descending'}
      valueFormatter={(v) => formatCompactBRL(v)}
    />
  );
};

export const definition = defineBlock<BarListProps, CategoricalData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

/**
 * Bloco `invoice_table` (shape 'table') — usa o Vitrine `InvoiceTable`.
 * Lê as linhas como itens {label, qty, unit} e calcula o total (qty×unit).
 */
import type { TableData } from '@dashboards/contracts';
import { InvoiceTable } from '@/components/ui/invoice-table';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type InvoiceProps = { currency?: string };
type Row = Record<string, unknown>;

const CURRENCY_PREFIX: Record<string, string> = { BRL: 'R$ ', USD: '$ ', EUR: '€ ' };

export const Component: BlockComponent<InvoiceProps, TableData> = ({ props, data }) => {
  const rows = (data?.rows ?? []) as Row[];
  const items = rows.map((r) => ({
    label: String(r.label ?? ''),
    qty: Number(r.qty ?? 0),
    unit: Number(r.unit ?? 0),
  }));
  const total = items.reduce((sum, i) => sum + i.qty * i.unit, 0);
  const prefix = CURRENCY_PREFIX[props.currency ?? 'BRL'] ?? '';
  const formatValue = (v: number) => `${prefix}${v.toLocaleString('pt-BR')}`;
  return <InvoiceTable items={items} total={total} formatValue={formatValue} />;
};

export const definition = defineBlock<InvoiceProps, TableData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

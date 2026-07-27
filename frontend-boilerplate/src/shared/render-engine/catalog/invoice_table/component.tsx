/**
 * Bloco `invoice_table` (shape 'table') — itens de fatura no `Table` do Astryx.
 *
 * Lê as linhas como itens {label, qty, unit}, calcula o valor da linha
 * (qty × unit) e fecha com o TOTAL num `TableFooter` — o rodapé é parte da
 * anatomia da tabela do DS, não uma linha "quase igual às outras".
 *
 * Números usam algarismos tabulares (`hasTabularNumbers`) e alinhamento à
 * direita, para as colunas de valor lerem em coluna.
 */
import type { TableData } from '@dashboards/contracts';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type InvoiceProps = { currency?: string };
type Row = Record<string, unknown>;

const CURRENCY_PREFIX: Record<string, string> = { BRL: 'R$ ', USD: '$ ', EUR: '€ ' };

/** Número alinhado à direita, com algarismos de largura fixa. */
function Amount({ children, isTotal }: { children: string; isTotal?: boolean }) {
  return (
    <Text
      display="block"
      justify="end"
      hasTabularNumbers
      weight={isTotal ? 'semibold' : 'normal'}
    >
      {children}
    </Text>
  );
}

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

  if (items.length === 0) {
    return (
      <EmptyState
        isCompact
        title="Fatura sem itens"
        description="A consulta deste bloco não retornou linhas."
        data-slot="invoice-table-empty"
      />
    );
  }

  return (
    <Table data-slot="invoice-table" density="compact" dividers="rows">
      <TableHeader>
        <TableRow isHeaderRow>
          <TableHeaderCell scope="col">Item</TableHeaderCell>
          <TableHeaderCell scope="col">Qtd.</TableHeaderCell>
          <TableHeaderCell scope="col">Valor</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.label}>
            <TableCell>{item.label}</TableCell>
            <TableCell>
              <Amount>{item.qty.toLocaleString('pt-BR')}</Amount>
            </TableCell>
            <TableCell>
              <Amount>{formatValue(item.qty * item.unit)}</Amount>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>
            <Text weight="semibold">Total</Text>
          </TableCell>
          <TableCell>
            <Amount isTotal>{formatValue(total)}</Amount>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
};

export const definition = defineBlock<InvoiceProps, TableData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

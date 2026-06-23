/**
 * Bloco `data_table` (shape 'table') — usa o Vitrine `DataTable`
 * (@tanstack/react-table). Converte as colunas tipadas do contrato em
 * `ColumnDef` e formata as células por tipo.
 */
import type { TableData } from '@dashboards/contracts';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type DataTableProps = {
  pageSize?: number;
  filterPlaceholder?: string;
};

type Column = { key: string; label: string; type?: 'string' | 'number' | 'date' | 'boolean' };
type Row = Record<string, unknown>;

function formatCell(value: unknown, type?: Column['type']): string {
  if (value == null) return '—';
  if (type === 'number' && typeof value === 'number') return value.toLocaleString('pt-BR');
  if (type === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

export const Component: BlockComponent<DataTableProps, TableData> = ({ props, data }) => {
  const columns = (data?.columns ?? []) as Column[];
  const rows = (data?.rows ?? []) as Row[];
  const colDefs: ColumnDef<Row>[] = columns.map((c) => ({
    accessorKey: c.key,
    header: c.label,
    cell: ({ getValue }) => formatCell(getValue(), c.type),
  }));
  return (
    <DataTable
      columns={colDefs}
      data={rows}
      pageSize={props.pageSize ?? 5}
      filterPlaceholder={props.filterPlaceholder ?? 'Filtrar…'}
    />
  );
};

export const definition = defineBlock<DataTableProps, TableData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

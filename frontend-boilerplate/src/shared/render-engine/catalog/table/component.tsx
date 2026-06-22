/**
 * Bloco `table` (shape 'table') — tabela crua com colunas tipadas.
 * Usa os primítivos shadcn `Table*` (Vitrine `data-table` é overkill p/ leitura).
 */
import type { TableData } from '@dashboards/contracts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/shared/lib/utils';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type TableProps = {
  pageSize?: number;
  dense?: boolean;
};

/**
 * Coluna/linha anotadas localmente (no FE, `TableData` de @dashboards/contracts
 * resolve p/ `any` porque `json-schema-to-ts` não é dependência do FE).
 */
type Column = { key: string; label: string; type?: 'string' | 'number' | 'date' | 'boolean' };
type Row = Record<string, unknown>;

function formatCell(value: unknown, type?: Column['type']): string {
  if (value == null) return '—';
  if (type === 'number' && typeof value === 'number') return value.toLocaleString('pt-BR');
  if (type === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

export const Component: BlockComponent<TableProps, TableData> = ({ props, data }) => {
  const columns = (data?.columns ?? []) as Column[];
  const allRows = (data?.rows ?? []) as Row[];
  const pageSize = props.pageSize ?? 10;
  const rows = allRows.slice(0, pageSize);

  return (
    <Table className={cn(props.dense && 'text-xs')}>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {columns.map((col) => (
              <TableCell key={col.key}>
                {formatCell((row as Record<string, unknown>)[col.key], col.type)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const definition = defineBlock<TableProps, TableData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

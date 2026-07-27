/**
 * Bloco `table` (shape 'table') — tabela crua com colunas tipadas, montada com
 * o `Table` do Astryx em modo children (`TableRow`/`TableHeaderCell`/
 * `TableCell`): as colunas virêm do CONTRATO DE DADOS em runtime, então quem
 * decide o que é célula e o que é cabeçalho é o bloco, não uma definição
 * estática de coluna.
 *
 * `dense` vira DENSIDADE do DS (`compact`), não um tamanho de fonte solto.
 * Consulta sem linhas cai num `EmptyState` dentro do corpo — o cabeçalho
 * continua visível, então dá para ler o que foi consultado.
 */
import type { TableData } from '@dashboards/contracts';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
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
type Column = {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
};
type Row = Record<string, unknown>;

function formatCell(value: unknown, type?: Column['type']): string {
  if (value == null) return '—';
  if (type === 'number' && typeof value === 'number')
    return value.toLocaleString('pt-BR');
  if (type === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

/** Corpo vazio: uma linha única que atravessa todas as colunas. */
function EmptyRow({ columnCount }: { columnCount: number }) {
  return (
    <TableRow>
      <TableCell colSpan={columnCount}>
        <EmptyState
          isCompact
          title="Sem dados"
          description="A consulta deste bloco não retornou linhas."
          data-slot="table-empty"
        />
      </TableCell>
    </TableRow>
  );
}

export const Component: BlockComponent<TableProps, TableData> = ({ props, data }) => {
  const columns = (data?.columns ?? []) as Column[];
  const allRows = (data?.rows ?? []) as Row[];
  const pageSize = props.pageSize ?? 10;
  const rows = allRows.slice(0, pageSize);

  // Sem colunas não há tabela para desenhar — só o estado vazio.
  if (columns.length === 0) {
    return (
      <EmptyState
        isCompact
        title="Sem dados"
        description="A consulta deste bloco não retornou colunas."
        data-slot="table-empty"
      />
    );
  }

  return (
    <Table
      data-slot="table"
      density={props.dense ? 'compact' : 'balanced'}
      hasHover
      textOverflow="truncate"
    >
      <TableHeader>
        <TableRow isHeaderRow>
          {columns.map((col) => (
            <TableHeaderCell key={col.key} scope="col">
              {col.label}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <EmptyRow columnCount={columns.length} />
        ) : (
          rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((col) => (
                <TableCell key={col.key}>{formatCell(row[col.key], col.type)}</TableCell>
              ))}
            </TableRow>
          ))
        )}
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

import { EmptyState } from '@astryxdesign/core/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import type { QueryResult } from '../types';

/**
 * Resultado do SELECT em tabela densa. As colunas vêm do próprio resultado
 * (não dá para declará-las: dependem da query), por isso o modo `children`.
 */

/** `null` vira ∅ (e não string vazia) para distinguir de texto em branco. */
function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '∅';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function QueryResultTable({ result }: { result: QueryResult }) {
  if (result.rows.length === 0) {
    return (
      <EmptyState
        isCompact
        headingLevel={3}
        title="Nenhuma linha retornada"
        description="A query executou sem erro, mas o filtro não encontrou registros."
      />
    );
  }

  return (
    <Table density="compact" dividers="grid" isStriped textOverflow="truncate">
      <TableHeader>
        <TableRow>
          {result.columns.map((column) => (
            <TableHeaderCell key={column.name}>{column.name}</TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {result.rows.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {result.columns.map((column) => (
              <TableCell key={column.name}>
                <Text type="code" maxLines={1} hasTruncateTooltip>
                  {formatCell(row[column.name])}
                </Text>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

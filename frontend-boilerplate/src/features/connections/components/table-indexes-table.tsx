import { Badge } from '@astryxdesign/core/Badge';
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
import type { IndexDef } from './db-schema-explorer-types';

/** Índices da tabela selecionada. */
export function TableIndexesTable({ indexes }: { indexes: IndexDef[] }) {
  if (indexes.length === 0) {
    return (
      <EmptyState
        isCompact
        headingLevel={4}
        title="Nenhum índice"
        description="Esta tabela não declara índices — consultas por colunas não indexadas fazem varredura completa."
      />
    );
  }

  return (
    <Table density="compact" dividers="rows" hasHover textOverflow="truncate">
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Nome</TableHeaderCell>
          <TableHeaderCell>Colunas</TableHeaderCell>
          <TableHeaderCell>Único</TableHeaderCell>
          <TableHeaderCell>Tipo</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {indexes.map((index) => (
          <TableRow key={index.name}>
            <TableCell>
              <Text type="code" maxLines={1}>
                {index.name}
              </Text>
            </TableCell>
            <TableCell>
              <Text type="code" color="secondary" maxLines={1}>
                {index.columns.join(', ')}
              </Text>
            </TableCell>
            <TableCell>
              {index.unique ? (
                <Badge variant="success" label="UNIQUE" />
              ) : (
                <Text type="supporting" color="secondary">
                  —
                </Text>
              )}
            </TableCell>
            <TableCell>
              <Text type="supporting" color="secondary">
                {index.type}
              </Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

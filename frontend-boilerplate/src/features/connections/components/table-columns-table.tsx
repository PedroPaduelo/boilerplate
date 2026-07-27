import { Badge } from '@astryxdesign/core/Badge';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import type { ColumnDef } from './db-schema-explorer-types';

/**
 * Colunas da tabela selecionada. Densidade compacta e divisores por linha —
 * schema é dado tabular uniforme, o formato certo é tabela (nunca card por
 * coluna).
 */
export function TableColumnsTable({ columns }: { columns: ColumnDef[] }) {
  if (columns.length === 0) {
    return (
      <EmptyState
        isCompact
        headingLevel={4}
        title="Sem colunas"
        description="A introspecção não retornou colunas para esta tabela."
      />
    );
  }

  return (
    <Table density="compact" dividers="rows" hasHover textOverflow="truncate">
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Coluna</TableHeaderCell>
          <TableHeaderCell>Tipo</TableHeaderCell>
          <TableHeaderCell>Nulo</TableHeaderCell>
          <TableHeaderCell>Default</TableHeaderCell>
          <TableHeaderCell>Chaves</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {columns.map((column) => (
          <TableRow key={column.name}>
            <TableCell>
              <VStack gap={0}>
                <Text type="code" maxLines={1}>
                  {column.name}
                </Text>
                {column.comment ? (
                  <Text type="supporting" color="secondary" maxLines={1}>
                    {column.comment}
                  </Text>
                ) : null}
              </VStack>
            </TableCell>
            <TableCell>
              <Text type="code" color="secondary" maxLines={1}>
                {column.type}
              </Text>
            </TableCell>
            <TableCell>
              <Text type="supporting" color="secondary">
                {column.nullable ? 'NULL' : 'NOT NULL'}
              </Text>
            </TableCell>
            <TableCell>
              <Text type="code" color="secondary" maxLines={1}>
                {column.defaultValue ?? '—'}
              </Text>
            </TableCell>
            <TableCell>
              <HStack gap={1} vAlign="center">
                {column.isPrimary ? <Badge variant="warning" label="PK" /> : null}
                {column.isForeign ? <Badge variant="info" label="FK" /> : null}
                {!column.isPrimary && !column.isForeign ? (
                  <Text type="supporting" color="secondary">
                    —
                  </Text>
                ) : null}
              </HStack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

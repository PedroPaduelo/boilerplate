import { ArrowUpRight } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import type { ForeignKeyDef, TableRef } from './db-schema-explorer-types';

/**
 * Chaves estrangeiras da tabela. A referência é um botão: clicar salta para a
 * tabela apontada — é assim que se navega um schema desconhecido.
 */
export interface TableForeignKeysTableProps {
  foreignKeys: ForeignKeyDef[];
  onNavigate: (ref: TableRef) => void;
}

export function TableForeignKeysTable({
  foreignKeys,
  onNavigate,
}: TableForeignKeysTableProps) {
  if (foreignKeys.length === 0) {
    return (
      <EmptyState
        isCompact
        headingLevel={4}
        title="Nenhuma foreign key"
        description="Esta tabela não declara relações no banco."
      />
    );
  }

  return (
    <Table density="compact" dividers="rows" hasHover textOverflow="truncate">
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Constraint</TableHeaderCell>
          <TableHeaderCell>Coluna(s)</TableHeaderCell>
          <TableHeaderCell>Referência</TableHeaderCell>
          <TableHeaderCell>On delete</TableHeaderCell>
          <TableHeaderCell>On update</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {foreignKeys.map((foreignKey) => (
          <TableRow key={foreignKey.name}>
            <TableCell>
              <Text type="code" maxLines={1}>
                {foreignKey.name}
              </Text>
            </TableCell>
            <TableCell>
              <Text type="code" color="secondary" maxLines={1}>
                {foreignKey.columns.join(', ')}
              </Text>
            </TableCell>
            <TableCell>
              <Button
                label={`${foreignKey.references.schema}.${foreignKey.references.table}.${foreignKey.references.column}`}
                variant="ghost"
                size="sm"
                endContent={<Icon icon={ArrowUpRight} size="xsm" />}
                tooltip="Abrir tabela referenciada"
                onClick={() =>
                  onNavigate({
                    schema: foreignKey.references.schema,
                    table: foreignKey.references.table,
                  })
                }
              />
            </TableCell>
            <TableCell>
              <Text type="supporting" color="secondary">
                {foreignKey.onDelete ?? '—'}
              </Text>
            </TableCell>
            <TableCell>
              <Text type="supporting" color="secondary">
                {foreignKey.onUpdate ?? '—'}
              </Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

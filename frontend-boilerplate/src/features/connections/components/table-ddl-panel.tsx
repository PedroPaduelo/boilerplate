import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { buildCreateTable } from '../lib/ddl';
import type { DbEngine, TableDef } from './db-schema-explorer-types';

/**
 * DDL da tabela (`CREATE TABLE`) renderizado pelo `CodeBlock` do DS — realce de
 * sintaxe, botão de copiar e tema de código vêm de graça (substitui o
 * `sql-highlight` legado).
 *
 * `isWrapped`: ler DDL rolando de lado é ruim, e a linha de FOREIGN KEY passa
 * fácil de 200 caracteres.
 */
export interface TableDdlPanelProps {
  table: TableDef;
  engine: DbEngine;
}

export function TableDdlPanel({ table, engine }: TableDdlPanelProps) {
  const ddl = buildCreateTable(engine, table.schema, table);
  return (
    <CodeBlock
      code={ddl}
      language="sql"
      title={`${table.schema}.${table.name}`}
      hasCopyButton
      isWrapped
      size="sm"
      width="100%"
    />
  );
}

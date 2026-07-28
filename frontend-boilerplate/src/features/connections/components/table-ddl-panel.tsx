import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { buildCreateTable } from '../lib/ddl';
import { tokenizeSql } from '../lib/sql-tokenizer';
import type { DbEngine, TableDef } from './db-schema-explorer-types';

/**
 * DDL da tabela (`CREATE TABLE`) no `CodeBlock` do DS.
 *
 * `tokenizer`: o tokenizer embutido do DS não conhece SQL (só bash/css/html/
 * js/json/jsx/python/tsx/ts), então `language="sql"` sozinho renderizava o
 * bloco SEM realce nenhum — texto cru. A prop `tokenizer` é o override oficial
 * para linguagens não suportadas; `tokenizeSql` mora em `lib/` e é pura.
 *
 * `hasLineNumbers`: DDL é referência — "erro na linha 12" só serve se a linha
 * 12 estiver numerada.
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
      tokenizer={tokenizeSql}
      title={`${table.schema}.${table.name}`}
      hasCopyButton
      hasLineNumbers
      isWrapped
      size="sm"
      width="100%"
    />
  );
}

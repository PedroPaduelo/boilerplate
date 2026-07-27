import type { DbEngine, TableDef } from '../components/db-schema-explorer-types';

/**
 * Gerador de DDL (`CREATE TABLE`) a partir do schema introspectado.
 *
 * Função PURA — sem React, sem rede: o painel de DDL só a chama e joga o
 * resultado no `CodeBlock`. Testável isoladamente.
 */

/** Postgres/Oracle/MySQL/SQLite usam aspas duplas; SQL Server usa colchetes. */
function quoteIdent(engine: DbEngine, ident: string): string {
  if (engine === 'sqlserver') return `[${ident.replace(/]/g, ']]')}]`;
  return `"${ident.replace(/"/g, '""')}"`;
}

export function buildCreateTable(
  engine: DbEngine,
  schema: string,
  table: TableDef,
): string {
  const q = (ident: string) => quoteIdent(engine, ident);
  const qualified = `${q(schema)}.${q(table.name)}`;

  const body: string[] = table.columns.map((column) => {
    const parts = [`  ${q(column.name)} ${column.type}`];
    if (!column.nullable) parts.push('NOT NULL');
    if (column.defaultValue) parts.push(`DEFAULT ${column.defaultValue}`);
    return parts.join(' ');
  });

  if (table.primaryKey.length > 0) {
    body.push(
      `  CONSTRAINT ${q(`pk_${table.name}`)} PRIMARY KEY (${table.primaryKey
        .map(q)
        .join(', ')})`,
    );
  }

  for (const fk of table.foreignKeys) {
    const columns = fk.columns.map(q).join(', ');
    const target = `${q(fk.references.schema)}.${q(fk.references.table)}(${q(
      fk.references.column,
    )})`;
    const onDelete = fk.onDelete ? ` ON DELETE ${fk.onDelete}` : '';
    const onUpdate = fk.onUpdate ? ` ON UPDATE ${fk.onUpdate}` : '';
    body.push(
      `  CONSTRAINT ${q(fk.name)} FOREIGN KEY (${columns}) REFERENCES ${target}${onDelete}${onUpdate}`,
    );
  }

  return [`CREATE TABLE ${qualified} (`, body.join(',\n'), ');'].join('\n');
}

/** `SELECT` de amostra para a tabela — preset do query runner. */
export function buildSelectPreview(schema: string, table: string): string {
  return `SELECT *\nFROM ${schema}.${table}\nLIMIT 50;`;
}

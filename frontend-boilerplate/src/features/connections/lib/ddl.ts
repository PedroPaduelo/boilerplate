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

/** Quantas linhas o preset de amostra traz. */
const PREVIEW_ROWS = 50;

/**
 * Exemplo de consulta para o placeholder do editor, no dialeto do banco.
 *
 * Sem citação nos identificadores de propósito: é texto de EXEMPLO, e
 * `dbo.minha_tabela` se lê melhor que `[dbo].[minha_tabela]`. O que não pode é
 * sugerir `LIMIT` a quem está conectado num SQL Server — o placeholder é a
 * primeira pista de sintaxe que a pessoa recebe, e uma pista errada custa uma
 * execução que falha.
 */
export function buildSqlPlaceholder(engine: DbEngine): string {
  if (engine === 'sqlserver') {
    return `SELECT TOP ${PREVIEW_ROWS} * FROM dbo.minha_tabela;`;
  }
  if (engine === 'oracle') {
    return `SELECT * FROM meu_schema.minha_tabela FETCH FIRST ${PREVIEW_ROWS} ROWS ONLY;`;
  }
  return `SELECT * FROM public.minha_tabela LIMIT ${PREVIEW_ROWS};`;
}

/**
 * `SELECT` de amostra para a tabela — preset do query runner.
 *
 * DEPENDE DO MOTOR, e isso não é detalhe: a versão anterior gerava sempre
 * `LIMIT 50`, que é dialeto Postgres. Numa conexão SQL Server (o caso das
 * bases expostas por gateway) o banco respondia "Incorrect syntax near '50'"
 * assim que o usuário clicava numa tabela — ou seja, a tela abria já quebrada,
 * e o erro parecia ser do gateway quando era do SQL que nós escrevemos.
 *
 *   • SQL Server → `SELECT TOP 50 *`
 *   • Oracle     → `FETCH FIRST 50 ROWS ONLY` (padrão SQL:2008, 12c+)
 *   • demais     → `LIMIT 50`
 *
 * Os identificadores vão SEMPRE citados (`[dbo].[Minha Tabela]`). No banco
 * tributário real existem tabelas como `SELIC_SERIE HISTÓRICA` e `PERMISSÕES`:
 * sem citação, o SQL Server lê até o espaço e responde "Invalid object name
 * 'dbo.SELIC_SERIE'". Citar é o que faz o preview funcionar para 100% das
 * tabelas, não só para as de nome comportado.
 */
export function buildSelectPreview(
  engine: DbEngine,
  schema: string,
  table: string,
): string {
  const alvo = `${quoteIdent(engine, schema)}.${quoteIdent(engine, table)}`;

  if (engine === 'sqlserver') {
    return `SELECT TOP ${PREVIEW_ROWS} *\nFROM ${alvo};`;
  }
  if (engine === 'oracle') {
    return `SELECT *\nFROM ${alvo}\nFETCH FIRST ${PREVIEW_ROWS} ROWS ONLY;`;
  }
  return `SELECT *\nFROM ${alvo}\nLIMIT ${PREVIEW_ROWS};`;
}

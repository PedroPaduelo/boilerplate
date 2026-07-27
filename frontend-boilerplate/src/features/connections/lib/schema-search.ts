import type {
  SchemaDef,
  TableDef,
  TableRef,
} from '../components/db-schema-explorer-types';

/**
 * Busca/filtro da árvore de schema. PURO — a árvore só renderiza o resultado.
 */

export interface SchemaFilter {
  /** Texto livre: casa com nome de tabela, de coluna ou de tabela referenciada. */
  search: string;
  /** Só tabelas que declaram ao menos uma foreign key. */
  onlyWithForeignKeys: boolean;
}

function matchesTable(table: SchemaDef['tables'][number], query: string): boolean {
  if (query.length === 0) return true;
  if (table.name.toLowerCase().includes(query)) return true;
  if (table.columns.some((column) => column.name.toLowerCase().includes(query))) {
    return true;
  }
  return table.foreignKeys.some((fk) =>
    fk.references.table.toLowerCase().includes(query),
  );
}

/** Aplica busca + filtro de FK, descartando schemas que ficaram sem tabelas. */
export function filterSchemas(
  schemas: SchemaDef[],
  { search, onlyWithForeignKeys }: SchemaFilter,
): SchemaDef[] {
  const query = search.trim().toLowerCase();
  return schemas
    .map((schema) => ({
      ...schema,
      tables: schema.tables.filter(
        (table) =>
          (!onlyWithForeignKeys || table.foreignKeys.length > 0) &&
          matchesTable(table, query),
      ),
    }))
    .filter((schema) => schema.tables.length > 0);
}

/** Total de tabelas visíveis (usado no rodapé e no estado vazio). */
export function countTables(schemas: SchemaDef[]): number {
  return schemas.reduce((total, schema) => total + schema.tables.length, 0);
}

/**
 * Localiza a tabela selecionada. Procura primeiro no schema informado e depois
 * em qualquer um: um salto por FK pode apontar para outro schema, e nesse caso
 * mostrar "nada selecionado" seria pior do que mostrar a tabela certa.
 */
export function findTable(schemas: SchemaDef[], ref: TableRef | null): TableDef | null {
  if (!ref) return null;
  const own = schemas
    .find((schema) => schema.name === ref.schema)
    ?.tables.find((table) => table.name === ref.table);
  if (own) return own;
  for (const schema of schemas) {
    const table = schema.tables.find((candidate) => candidate.name === ref.table);
    if (table) return table;
  }
  return null;
}

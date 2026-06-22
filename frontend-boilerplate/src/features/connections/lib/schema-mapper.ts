import type { DatabaseSchema } from '@/components/ui/db-schema-explorer-types';
import type { Connection, ConnectionSchema } from '../types';

/**
 * Mapeia a resposta de introspecção do backend (`ConnectionSchema`: tabelas
 * "achatadas" com `schema`/`name`/`columns`) para o shape `DatabaseSchema` que
 * o componente Vitrine `DbSchemaExplorer` consome (banco → schemas → tabelas →
 * colunas).
 *
 * Função PURA — testável sem rede/DB.
 */
export function toDatabaseSchema(
  schema: ConnectionSchema,
  connection: Pick<Connection, 'id' | 'name' | 'database' | 'host' | 'port'>,
): DatabaseSchema {
  // Agrupa tabelas por schema (ex.: 'public').
  const bySchema = new Map<string, ConnectionSchema['tables']>();
  for (const table of schema.tables) {
    const list = bySchema.get(table.schema) ?? [];
    list.push(table);
    bySchema.set(table.schema, list);
  }

  const schemas = Array.from(bySchema.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([schemaName, tables]) => ({
      name: schemaName,
      tables: tables
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((table) => ({
          name: table.name,
          schema: table.schema,
          columns: table.columns.map((col) => ({
            name: col.name,
            type: col.dataType,
            nullable: col.nullable,
            // O backend (MVP) não introspecta PK/FK — default seguro.
            isPrimary: false,
          })),
          primaryKey: [] as string[],
          indexes: [],
          foreignKeys: [],
        })),
    }));

  return {
    id: connection.id,
    name: connection.database || connection.name,
    engine: 'postgresql',
    host: connection.host,
    port: connection.port,
    version: '',
    sizeMB: 0,
    tables: schema.tableCount,
    schemas,
  };
}

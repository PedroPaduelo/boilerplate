import type {
  DatabaseSchema,
  ForeignKeyDef,
  IndexDef,
} from '@/components/ui/db-schema-explorer-types';
import type { Connection, ConnectionSchema, SchemaTable } from '../types';

const BYTES_PER_MB = 1024 * 1024;

/** Métodos de índice do Postgres → união aceita pelo IndexDef da Vitrine. */
function mapIndexType(method: string): IndexDef['type'] {
  switch (method) {
    case 'btree':
    case 'hash':
    case 'gin':
    case 'gist':
    case 'brin':
      return method;
    case 'spgist':
      return 'gist';
    default:
      return 'btree';
  }
}

/** Ação de FK (texto livre do backend) → união aceita pelo ForeignKeyDef. */
function mapFkAction(action?: string | null): ForeignKeyDef['onDelete'] {
  switch (action) {
    case 'CASCADE':
    case 'SET NULL':
    case 'RESTRICT':
    case 'NO ACTION':
      return action;
    default:
      // 'SET DEFAULT' (raro) e nulos caem no default semântico do Postgres.
      return undefined;
  }
}

/** Extrai a versão curta do servidor (ex.: "PostgreSQL 17.10 (Debian…)" → "17.10"). */
export function shortServerVersion(version?: string | null): string {
  if (!version) return '';
  const m = version.match(/PostgreSQL\s+([\d.]+)/i);
  return m ? m[1] : version.split(/\s+/).slice(0, 2).join(' ');
}

function mapTable(table: SchemaTable) {
  return {
    name: table.name,
    schema: table.schema,
    columns: table.columns.map((col) => ({
      name: col.name,
      type: col.dataType,
      nullable: col.nullable,
      isPrimary: col.isPrimary ?? false,
      isForeign: col.isForeign ?? false,
      defaultValue: col.defaultValue ?? undefined,
      comment: col.comment ?? undefined,
      references: col.references
        ? {
            schema: col.references.schema,
            table: col.references.table,
            column: col.references.column,
          }
        : undefined,
    })),
    primaryKey: table.primaryKey ?? [],
    indexes: (table.indexes ?? []).map((idx) => ({
      name: idx.name,
      columns: idx.columns,
      unique: idx.unique,
      type: mapIndexType(idx.method),
    })),
    foreignKeys: (table.foreignKeys ?? []).map((fk) => ({
      name: fk.name,
      columns: fk.columns,
      references: fk.references,
      onDelete: mapFkAction(fk.onDelete),
      onUpdate: mapFkAction(fk.onUpdate),
    })),
    rowCount: table.rowCount ?? undefined,
    sizeMB:
      table.sizeBytes != null
        ? Math.round((table.sizeBytes / BYTES_PER_MB) * 10) / 10
        : undefined,
    description: table.comment ?? undefined,
  };
}

/**
 * Mapeia a resposta de introspecção RICA do backend (`ConnectionSchema`) para o
 * shape `DatabaseSchema` que o componente Vitrine `DbSchemaExplorer` consome
 * (banco → schemas → tabelas → colunas/PK/FK/índices). Preenche tudo que a
 * introspecção enriquecida fornece: PK, FK (com referência), índices, default,
 * comentário, estimativa de linhas, tamanho, versão e tamanho do banco.
 *
 * Função PURA — testável sem rede/DB.
 */
export function toDatabaseSchema(
  schema: ConnectionSchema,
  connection: Pick<Connection, 'id' | 'name' | 'database' | 'host' | 'port'>,
): DatabaseSchema {
  // Agrupa tabelas por schema (ex.: 'public').
  const bySchema = new Map<string, SchemaTable[]>();
  for (const table of schema.tables) {
    const list = bySchema.get(table.schema) ?? [];
    list.push(table);
    bySchema.set(table.schema, list);
  }

  const schemas = Array.from(bySchema.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([schemaName, tables]) => {
      const views = tables.filter(
        (t) => t.kind === 'view' || t.kind === 'matview',
      ).length;
      return {
        name: schemaName,
        ...(views > 0 ? { views } : {}),
        tables: tables
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(mapTable),
      };
    });

  const sizeMB =
    schema.database?.sizeBytes != null
      ? Math.round((schema.database.sizeBytes / BYTES_PER_MB) * 10) / 10
      : 0;

  return {
    id: connection.id,
    name: schema.database?.name || connection.database || connection.name,
    engine: 'postgresql',
    host: connection.host,
    port: connection.port,
    version: shortServerVersion(schema.database?.version),
    sizeMB,
    tables: schema.tableCount,
    schemas,
  };
}

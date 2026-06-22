/**
 * Types — db-schema-explorer.
 *
 * Schema metadata for a single database (Postgres / MySQL / SQL Server /
 * Oracle / SQLite). Shapes mirror what you'd see in Navicat / DBeaver /
 * pgAdmin / Beekeeper Studio.
 *
 * The component is presentation-only — it doesn't introspect a live
 * database. The consumer feeds the `DatabaseSchema` prop with whatever
 * shape their introspection pipeline (or fixture) produced.
 */

export type DbEngine =
  | "postgresql"
  | "mysql"
  | "sqlserver"
  | "oracle"
  | "sqlite"

export type ColumnDef = {
  name: string
  type: string
  nullable: boolean
  defaultValue?: string
  isPrimary: boolean
  isForeign?: boolean
  references?: { table: string; column: string; schema?: string }
  comment?: string
}

export type IndexDef = {
  name: string
  columns: string[]
  unique: boolean
  type: "btree" | "hash" | "gin" | "gist" | "brin" | "hash_map"
}

export type ForeignKeyDef = {
  name: string
  columns: string[]
  references: { schema: string; table: string; column: string }
  onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION"
  onUpdate?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION"
}

export type TableDef = {
  name: string
  schema: string
  columns: ColumnDef[]
  primaryKey: string[]
  indexes: IndexDef[]
  foreignKeys: ForeignKeyDef[]
  rowCount?: number
  sizeMB?: number
  description?: string
}

export type SchemaDef = {
  name: string
  tables: TableDef[]
  views?: number
  functions?: number
}

export type DatabaseSchema = {
  id: string
  name: string
  engine: DbEngine
  host: string
  port?: number
  version: string
  sizeMB: number
  tables: number
  schemas: SchemaDef[]
}

export type DbSchemaExplorerProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  database: DatabaseSchema
  onTableClick?: (tableRef: { schema: string; table: string }) => void
  /**
   * Quando `true`, renderiza o componente SEM o wrapper externo
   * (rounded/border/shadow) e SEM o header interno (que mostra nome
   * do banco, engine, host, port, version, size e total tables).
   * Usado quando o componente é embarcado dentro de uma composição
   * (ex: `DBA Workbench`) que já provê esse chrome. O conteúdo
   * interno (toolbar de busca + layout 2-painel) é preservado.
   *
   * @default false
   */
  embedded?: boolean
}

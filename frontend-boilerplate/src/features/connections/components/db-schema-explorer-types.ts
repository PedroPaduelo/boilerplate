/**
 * View-model do explorador de schema.
 *
 * Veio de `components/ui/db-schema-explorer-types.ts`: como o explorador é
 * usado SÓ por `connections`, o tipo passou a morar dentro da feature (FSD —
 * "usado por 1 feature → mora na feature").
 *
 * Este é o shape que a UI consome; `lib/schema-mapper.ts` traduz a resposta de
 * introspecção da API (`ConnectionSchema`) para cá. Manter os dois separados
 * evita que uma mudança do backend vaze direto para a árvore/painéis.
 */

export type DbEngine = 'postgresql' | 'mysql' | 'sqlserver' | 'oracle' | 'sqlite';

/** Referência `schema.tabela.coluna` (alvo de uma FK). */
export interface SchemaColumnRef {
  schema?: string;
  table: string;
  column: string;
}

export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimary: boolean;
  isForeign?: boolean;
  references?: SchemaColumnRef;
  comment?: string;
}

export interface IndexDef {
  name: string;
  columns: string[];
  unique: boolean;
  type: 'btree' | 'hash' | 'gin' | 'gist' | 'brin';
}

/** Ações de integridade referencial aceitas pelo Postgres (as que a UI exibe). */
export type ForeignKeyAction = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';

export interface ForeignKeyDef {
  name: string;
  columns: string[];
  references: { schema: string; table: string; column: string };
  onDelete?: ForeignKeyAction;
  onUpdate?: ForeignKeyAction;
}

export interface TableDef {
  name: string;
  schema: string;
  columns: ColumnDef[];
  primaryKey: string[];
  indexes: IndexDef[];
  foreignKeys: ForeignKeyDef[];
  rowCount?: number;
  sizeMB?: number;
  description?: string;
}

export interface SchemaDef {
  name: string;
  tables: TableDef[];
  views?: number;
  functions?: number;
}

export interface DatabaseSchema {
  id: string;
  name: string;
  engine: DbEngine;
  host: string;
  port?: number;
  version: string;
  sizeMB: number;
  tables: number;
  schemas: SchemaDef[];
}

/** Endereço de uma tabela dentro do banco — a seleção compartilhada da tela. */
export interface TableRef {
  schema: string;
  table: string;
}

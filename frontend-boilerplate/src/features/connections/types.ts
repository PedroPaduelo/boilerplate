/**
 * Tipos da feature `connections` (T-F1).
 *
 * Espelham a superfície pública do módulo backend `connections` (T-A). A SENHA
 * NUNCA aparece aqui: o backend jamais a serializa (`serializeConnection`), e o
 * front só a manda no payload de create/update (campo `password`).
 *
 * Datas chegam como ISO string (JSON) — embora o Prisma use `Date`, a
 * serialização HTTP as converte.
 */

export type ConnectionVisibility = 'PRIVATE' | 'DEPARTMENT' | 'ORG';
/**
 * Tipo da fonte de dados.
 *
 * `POSTGRES`    — conexão TCP direta (host/porta/usuário/senha).
 * `API_GATEWAY` — HTTP contra um gateway read-only (base URL + token Bearer).
 *   Existe para bancos que a plataforma não alcança: em vez de abrir VPN para
 *   cada sistema, um gateway do lado de dentro expõe o banco por HTTP e a
 *   plataforma fala com ele.
 */
export type ConnectionType = 'POSTGRES' | 'API_GATEWAY';
/**
 * Ambiente do banco, DECLARADO no cadastro (enum `ConnectionEnvironment` do
 * backend). Substitui a heurística que adivinhava o ambiente pelo nome.
 */
export type ConnectionEnvironment = 'DEV' | 'HOMOLOG' | 'PRODUCTION';
/** Status de conectividade reportado pelo backend (test). */
export type ConnectionStatus = string; // ex.: 'UNKNOWN' | 'OK' | 'ERROR'

/** Conexão como retornada pela API (SEM senha e SEM token). */
export interface Connection {
  id: string;
  name: string;
  description: string | null;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  sslMode: string;
  /** Base URL do gateway; `null` em conexões POSTGRES. */
  baseUrl: string | null;
  options: Record<string, unknown> | null;
  ownerId: string;
  departmentId: string | null;
  visibility: ConnectionVisibility;
  environment: ConnectionEnvironment;
  isActive: boolean;
  status: ConnectionStatus;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionFilters {
  search?: string;
  visibility?: ConnectionVisibility;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ConnectionsResponse {
  connections: Connection[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Payload de criação. O SEGREDO vai em claro e é cifrado at-rest no backend:
 * `password` para POSTGRES, `token` para API_GATEWAY.
 *
 * Os campos de cada tipo são opcionais aqui e exigidos POR TIPO pelo backend
 * (e pelo formulário) — um objeto só, validado conforme o `type`.
 */
export interface CreateConnectionInput {
  name: string;
  description?: string | null;
  type?: ConnectionType;

  /* POSTGRES */
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  sslMode?: string;

  /* API_GATEWAY */
  baseUrl?: string;
  token?: string;

  /* comuns */
  database?: string;
  options?: Record<string, unknown> | null;
  departmentId?: string | null;
  visibility: ConnectionVisibility;
  /** Obrigatório: o backend não assume ambiente por padrão. */
  environment: ConnectionEnvironment;
  isActive?: boolean;
}

/** Payload de atualização — segredo opcional (ausente = não troca). */
export interface UpdateConnectionInput {
  id: string;
  name?: string;
  description?: string | null;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  sslMode?: string;
  baseUrl?: string;
  token?: string;
  options?: Record<string, unknown> | null;
  departmentId?: string | null;
  visibility?: ConnectionVisibility;
  environment?: ConnectionEnvironment;
  isActive?: boolean;
}

/** Resultado do teste de conectividade (`POST /connections/:id/test`). */
export interface ConnectionTestResult {
  ok: boolean;
  status: string;
  lastTestedAt: string | null;
  message: string | null;
}

/* ----------------------------- Schema explorer ---------------------------- */

/** Referência schema.tabela.coluna (alvo de uma FK / coluna FK). */
export interface SchemaRef {
  schema: string;
  table: string;
  column: string;
}

export interface SchemaColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: string | null;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: SchemaRef | null;
  comment?: string | null;
}

export interface SchemaIndex {
  name: string;
  columns: string[];
  unique: boolean;
  primary: boolean;
  /** btree | hash | gin | gist | spgist | brin */
  method: string;
}

export interface SchemaForeignKey {
  name: string;
  columns: string[];
  references: SchemaRef;
  onDelete?: string | null;
  onUpdate?: string | null;
}

export interface SchemaTable {
  schema: string;
  name: string;
  columns: SchemaColumn[];
  /** Metadados ricos (introspecção enriquecida — opcionais p/ retrocompat). */
  kind?: 'table' | 'view' | 'matview';
  primaryKey?: string[];
  indexes?: SchemaIndex[];
  foreignKeys?: SchemaForeignKey[];
  rowCount?: number | null;
  sizeBytes?: number | null;
  comment?: string | null;
}

/** Metadados do banco como um todo (versão, tamanho). */
export interface SchemaDatabaseMeta {
  name: string | null;
  version: string | null;
  sizeBytes: number | null;
}

export interface ConnectionSchema {
  connectionId: string;
  cached: boolean;
  tableCount: number;
  /** Nº total de tabelas no banco (antes do cap). */
  totalTables?: number;
  /** `true` quando a introspecção limitou as tabelas retornadas. */
  truncated?: boolean;
  fetchedAt: string;
  database?: SchemaDatabaseMeta;
  tables: SchemaTable[];
}

/* ------------------------------- Query runner ----------------------------- */

export interface RunQueryInput {
  id: string;
  sql: string;
  params?: unknown[];
  maxRows?: number;
}

export interface QueryResult {
  columns: { name: string; dataTypeID: number }[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
  durationMs: number;
}

/* ------------------------------- Departments ------------------------------ */

export interface Department {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentsResponse {
  departments: Department[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

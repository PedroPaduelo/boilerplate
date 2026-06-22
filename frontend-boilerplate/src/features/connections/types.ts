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
export type ConnectionType = 'POSTGRES';
/** Status de conectividade reportado pelo backend (test). */
export type ConnectionStatus = string; // ex.: 'UNKNOWN' | 'OK' | 'ERROR'

/** Conexão como retornada pela API (SEM senha). */
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
  options: Record<string, unknown> | null;
  ownerId: string;
  departmentId: string | null;
  visibility: ConnectionVisibility;
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

/** Payload de criação — `password` em claro (cifrada at-rest no backend). */
export interface CreateConnectionInput {
  name: string;
  description?: string | null;
  type?: ConnectionType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  sslMode?: string;
  options?: Record<string, unknown> | null;
  departmentId?: string | null;
  visibility: ConnectionVisibility;
  isActive?: boolean;
}

/** Payload de atualização — `password` opcional (ausente = não troca). */
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
  options?: Record<string, unknown> | null;
  departmentId?: string | null;
  visibility?: ConnectionVisibility;
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

export interface SchemaColumn {
  name: string;
  dataType: string;
  nullable: boolean;
}

export interface SchemaTable {
  schema: string;
  name: string;
  columns: SchemaColumn[];
}

export interface ConnectionSchema {
  connectionId: string;
  cached: boolean;
  tableCount: number;
  fetchedAt: string;
  tables: SchemaTable[];
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

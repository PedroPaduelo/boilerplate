import { apiClient } from '@/shared/lib/api-client';
import type {
  Connection,
  ConnectionFilters,
  ConnectionSchema,
  ConnectionTestResult,
  ConnectionsResponse,
  CreateConnectionInput,
  DepartmentsResponse,
  QueryResult,
  RunQueryInput,
  UpdateConnectionInput,
} from './types';

/**
 * Cliente HTTP da feature `connections`. Usa a instância única `apiClient`
 * (axios + JWT do store, ver T-E). NUNCA loga payloads — a senha trafega em
 * `create`/`update` mas não é registrada em lugar nenhum.
 */
export const connectionsApi = {
  // GET /connections — lista visível ao usuário (RBAC no backend).
  list: async (filters: ConnectionFilters = {}): Promise<ConnectionsResponse> => {
    const { data } = await apiClient.get<ConnectionsResponse>('/connections', {
      params: {
        page: filters.page,
        pageSize: filters.pageSize,
        visibility: filters.visibility,
        isActive: filters.isActive,
        search: filters.search?.trim() || undefined,
      },
    });
    return data;
  },

  // GET /connections/:id — detalhe (sem senha).
  getById: async (id: string): Promise<Connection> => {
    const { data } = await apiClient.get<Connection>(`/connections/${id}`);
    return data;
  },

  // POST /connections — cria (manage: ADMIN/ANALYST).
  create: async (input: CreateConnectionInput): Promise<Connection> => {
    const { data } = await apiClient.post<Connection>('/connections', input);
    return data;
  },

  // PATCH /connections/:id — atualiza (manage). Senha ausente = não troca.
  update: async ({ id, ...rest }: UpdateConnectionInput): Promise<Connection> => {
    const { data } = await apiClient.patch<Connection>(`/connections/${id}`, rest);
    return data;
  },

  // DELETE /connections/:id — remove (manage).
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/connections/${id}`);
  },

  // POST /connections/:id/test — testa conectividade (use: +CREATOR).
  test: async (id: string): Promise<ConnectionTestResult> => {
    const { data } = await apiClient.post<ConnectionTestResult>(
      `/connections/${id}/test`,
    );
    return data;
  },

  // GET /connections/:id/schema — introspecção de tabelas/colunas.
  getSchema: async (id: string, refresh?: boolean): Promise<ConnectionSchema> => {
    const { data } = await apiClient.get<ConnectionSchema>(
      `/connections/${id}/schema`,
      { params: refresh ? { refresh: true } : undefined },
    );
    return data;
  },

  // POST /connections/:id/query — SELECT read-only (preview/dev).
  runQuery: async ({ id, sql, params, maxRows }: RunQueryInput): Promise<QueryResult> => {
    const { data } = await apiClient.post<QueryResult>(`/connections/${id}/query`, {
      sql,
      params,
      maxRows,
    });
    return data;
  },
};

export const departmentsApi = {
  // GET /departments — qualquer usuário autenticado (para selects de visibilidade).
  list: async (): Promise<DepartmentsResponse> => {
    const { data } = await apiClient.get<DepartmentsResponse>('/departments', {
      params: { pageSize: 100 },
    });
    return data;
  },
};

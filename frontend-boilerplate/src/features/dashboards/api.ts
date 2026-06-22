import { apiClient } from '@/shared/lib/api-client';
import type { ApiMode } from '@/shared/lib/query-keys';
import type {
  CreateDashboardInput,
  Dashboard,
  DashboardDetail,
  DashboardsResponse,
} from './types';

/**
 * Cliente HTTP da feature `dashboards`. Usa a instância única `apiClient`
 * (axios + JWT, T-E). O backend já filtra a LISTA por visibilidade/RBAC.
 */
export const dashboardsApi = {
  // GET /dashboards — lista visível ao usuário (paginada, RBAC no backend).
  // `params` já vem normalizado por `toServerFilters` (page/pageSize/search/
  // status/visibility, com filtros vazios omitidos) — repassado direto ao axios.
  list: async (
    params: Record<string, unknown> = {},
  ): Promise<DashboardsResponse> => {
    const { data } = await apiClient.get<DashboardsResponse>('/dashboards', {
      params,
    });
    return data;
  },

  // GET /dashboards/:id?mode= — detalhe (layout resolvido para o modo).
  getById: async (id: string, mode: ApiMode = 'draft'): Promise<DashboardDetail> => {
    const { data } = await apiClient.get<DashboardDetail>(`/dashboards/${id}`, {
      params: { mode },
    });
    return data;
  },

  // POST /dashboards — cria (manage). Usado para duplicar.
  create: async (input: CreateDashboardInput): Promise<Dashboard> => {
    const { data } = await apiClient.post<Dashboard>('/dashboards', input);
    return data;
  },

  // DELETE /dashboards/:id — remove (manage + owner).
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/dashboards/${id}`);
  },

  // POST /dashboards/:id/publish — draft→published (publish + owner).
  publish: async (id: string): Promise<Dashboard> => {
    const { data } = await apiClient.post<Dashboard>(`/dashboards/${id}/publish`);
    return data;
  },

  // POST /dashboards/:id/unpublish — zera published (publish + owner).
  unpublish: async (id: string): Promise<Dashboard> => {
    const { data } = await apiClient.post<Dashboard>(`/dashboards/${id}/unpublish`);
    return data;
  },
};

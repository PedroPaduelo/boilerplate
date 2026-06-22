import type { DashboardDataPayload } from '@dashboards/contracts';
import { apiClient } from '@/shared/lib/api-client';
import type { ApiMode } from '@/shared/lib/query-keys';
import type {
  AddChartInput,
  CreateDashboardInput,
  Dashboard,
  DashboardDetail,
  DashboardsResponse,
  UpdateDashboardInput,
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

  // POST /dashboards/:id/data — hidratação batch dos blocos (T-C).
  // Body: { mode, filters }. Resposta = DashboardDataPayload (mapa blockId →
  // resultado já no shape do bloco). `draft` retorna inline (sem cache);
  // `published` pode devolver blocos `queued` e completar via Socket.IO.
  fetchData: async (
    id: string,
    mode: ApiMode,
    filters: Record<string, unknown>,
  ): Promise<DashboardDataPayload> => {
    const { data } = await apiClient.post<DashboardDataPayload>(
      `/dashboards/${id}/data`,
      { mode, filters },
    );
    return data;
  },

  // POST /dashboards — cria (manage). Usado para duplicar.
  create: async (input: CreateDashboardInput): Promise<Dashboard> => {
    const { data } = await apiClient.post<Dashboard>('/dashboards', input);
    return data;
  },

  // PATCH /dashboards/:id — atualiza o DRAFT (title/draftLayout). Não afeta o
  // publicado (isolamento draft↔published, doc 08). O backend re-valida o
  // `draftLayout` contra o contrato (T-B3) — por isso validamos localmente antes.
  update: async (id: string, input: UpdateDashboardInput): Promise<Dashboard> => {
    const { data } = await apiClient.patch<Dashboard>(`/dashboards/${id}`, input);
    return data;
  },

  // POST /dashboards/:id/blocks — add_chart_to_dashboard: insere um bloco que
  // referencia um Chart existente no draftLayout. O backend monta o bloco
  // (type = catalogType do chart, props.chartId) e devolve o dashboard atualizado.
  addChart: async (id: string, input: AddChartInput): Promise<Dashboard> => {
    const { data } = await apiClient.post<Dashboard>(`/dashboards/${id}/blocks`, input);
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

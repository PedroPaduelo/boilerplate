import type { BlockDataResult } from '@dashboards/contracts';
import { apiClient } from '@/shared/lib/api-client';
import type {
  Chart,
  ChartsResponse,
  CreateChartInput,
  UpdateChartInput,
} from './types';

/**
 * Cliente HTTP da feature `charts`. Usa a instância única `apiClient`
 * (axios + JWT, T-E). O backend já filtra a LISTA por visibilidade/RBAC.
 */
export const chartsApi = {
  // GET /charts — lista visível ao usuário (paginada, RBAC no backend).
  // `params` já vem normalizado por `toServerFilters` — repassado direto ao axios.
  list: async (
    params: Record<string, unknown> = {},
  ): Promise<ChartsResponse> => {
    const { data } = await apiClient.get<ChartsResponse>('/charts', { params });
    return data;
  },

  // GET /charts/:id — detalhe (draft + published embutidos).
  getById: async (id: string): Promise<Chart> => {
    const { data } = await apiClient.get<Chart>(`/charts/${id}`);
    return data;
  },

  // POST /charts — cria (manage). Usado para duplicar.
  create: async (input: CreateChartInput): Promise<Chart> => {
    const { data } = await apiClient.post<Chart>('/charts', input);
    return data;
  },

  // PATCH /charts/:id — edita o draft (manage + owner).
  update: async (id: string, input: UpdateChartInput): Promise<Chart> => {
    const { data } = await apiClient.patch<Chart>(`/charts/${id}`, input);
    return data;
  },

  // POST /charts/:id/data — executa o dataBinding e devolve o resultado no shape.
  getData: async (
    id: string,
    mode: 'draft' | 'published' = 'draft',
  ): Promise<BlockDataResult> => {
    const { data } = await apiClient.post<BlockDataResult>(`/charts/${id}/data`, {
      mode,
    });
    return data;
  },

  // DELETE /charts/:id — remove (manage + owner).
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/charts/${id}`);
  },

  // POST /charts/:id/publish — draft→published (publish + owner).
  publish: async (id: string): Promise<Chart> => {
    const { data } = await apiClient.post<Chart>(`/charts/${id}/publish`);
    return data;
  },

  // POST /charts/:id/unpublish — zera published (publish + owner).
  unpublish: async (id: string): Promise<Chart> => {
    const { data } = await apiClient.post<Chart>(`/charts/${id}/unpublish`);
    return data;
  },
};

/**
 * Hook de DADOS de um dashboard (T-G1) — junta o batch (T-C) com o realtime (T-E).
 *
 * Fluxo (doc 20 §3 / doc 32 §3/§4):
 *  1. `useDashboardRealtime` entra na sala `dashboard:{id}` e mapeia os eventos
 *     `block:queued|running|data|error` para o cache (chave `dashboardData`).
 *  2. A query do batch dispara `POST /dashboards/:id/data` com `{ mode, filters }`.
 *     O resultado popula a MESMA chave de cache — depois disso o socket vai
 *     mesclando bloco a bloco (cache-miss publicado chega `queued` e completa
 *     pelo socket; draft costuma voltar tudo inline).
 *  3. Mudar filtros → novo `filtersHash` → nova chave → novo batch. Mantemos os
 *     dados anteriores via `keepPreviousData` enquanto o novo batch chega, então
 *     os blocos NÃO-afetados não piscam (o backend só recomputa os afetados,
 *     graças à cacheKey por bloco do T-C).
 *
 * O payload e os resultados por bloco vivem no MESMO lugar que o socket escreve
 * (`dashboard-cache`), então `data` reflete tanto o batch quanto os eventos.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DashboardDataPayload } from '@dashboards/contracts';
import { queryKeys, hashFilters, type ApiMode } from '@/shared/lib/query-keys';
import { useDashboardRealtime } from '@/shared/hooks/use-dashboard-realtime';
import { dashboardsApi } from './api';

export interface UseDashboardDataOptions {
  dashboardId: string | undefined;
  mode: ApiMode;
  /** Valores de filtro ativos (filterId → valor). */
  filters: Record<string, unknown>;
  /** Liga/desliga o disparo (default true). */
  enabled?: boolean;
}

export interface UseDashboardDataResult {
  payload: DashboardDataPayload | undefined;
  filtersHash: string;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useDashboardData({
  dashboardId,
  mode,
  filters,
  enabled = true,
}: UseDashboardDataOptions): UseDashboardDataResult {
  const filtersHash = hashFilters(filters);
  const active = enabled && !!dashboardId;

  // (1) socket → cache na MESMA chave do batch.
  useDashboardRealtime({ dashboardId, mode, filtersHash, enabled: active });

  // (2) batch kickoff.
  const query = useQuery({
    queryKey: queryKeys.dashboardData(dashboardId ?? '', mode, filtersHash),
    queryFn: () => dashboardsApi.fetchData(dashboardId as string, mode, filters),
    enabled: active,
    // O socket é o canal vivo; não queremos refetch ao focar a janela clobberando
    // os updates incrementais. `draft` é sempre fresco; `published` cacheável.
    staleTime: mode === 'published' ? 5 * 60 * 1000 : 0,
    refetchOnWindowFocus: false,
    // (3) mantém o payload anterior enquanto o novo (com filtros novos) carrega.
    placeholderData: keepPreviousData,
    retry: false,
  });

  return {
    payload: query.data,
    filtersHash,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}

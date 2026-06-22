import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { queryKeys, type ApiMode } from '@/shared/lib/query-keys';
import {
  artifactQueryOptions,
  referenceQueryOptions,
} from '@/shared/lib/query-policies';
import { dashboardsApi } from './api';
import type { CreateDashboardInput } from './types';

/**
 * Hooks de dados da feature `dashboards`. Usam as query-keys CENTRALIZADAS
 * (`queryKeys.dashboards.*`, T-E) — sem strings soltas.
 */
export function useDashboards(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.dashboards.list(params),
    queryFn: () => dashboardsApi.list(params),
    // Listagens são "referência leve": evita refetch agressivo durante a navegação.
    ...referenceQueryOptions(),
  });
}

export function useDashboard(id: string | undefined, mode: ApiMode = 'draft') {
  return useQuery({
    queryKey: queryKeys.dashboards.detail(id ?? '', mode),
    queryFn: () => dashboardsApi.getById(id as string, mode),
    enabled: !!id,
    ...artifactQueryOptions(mode),
  });
}

/**
 * Prefetch do detalhe de um dashboard — disparado no hover do card para abrir a
 * tela de render (T-G) instantaneamente (doc 32 §3).
 */
export function usePrefetchDashboard() {
  const queryClient = useQueryClient();
  return (id: string, mode: ApiMode) =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboards.detail(id, mode),
      queryFn: () => dashboardsApi.getById(id, mode),
      ...artifactQueryOptions(mode),
    });
}

export function useDuplicateDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDashboardInput) => dashboardsApi.create(input),
    onSuccess: () => {
      toast.success('Dashboard duplicado com sucesso!');
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao duplicar dashboard'));
    },
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dashboardsApi.remove(id),
    onSuccess: () => {
      toast.success('Dashboard excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao excluir dashboard'));
    },
  });
}

export function usePublishDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      publish ? dashboardsApi.publish(id) : dashboardsApi.unpublish(id),
    onSuccess: (_, { publish }) => {
      toast.success(publish ? 'Dashboard publicado!' : 'Publicação removida.');
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao alterar publicação'));
    },
  });
}

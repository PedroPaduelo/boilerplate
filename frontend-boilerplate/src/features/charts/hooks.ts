import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { queryKeys, type ApiMode } from '@/shared/lib/query-keys';
import {
  artifactQueryOptions,
  referenceQueryOptions,
} from '@/shared/lib/query-policies';
import { chartsApi } from './api';
import type { CreateChartInput } from './types';

/**
 * Hooks de dados da feature `charts`. Usam as query-keys CENTRALIZADAS
 * (`queryKeys.charts.*`, T-E) — sem strings soltas.
 */
export function useCharts(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.charts.list(params),
    queryFn: () => chartsApi.list(params),
    ...referenceQueryOptions(),
  });
}

export function useChart(id: string | undefined, mode: ApiMode = 'draft') {
  return useQuery({
    queryKey: queryKeys.charts.detail(id ?? '', mode),
    queryFn: () => chartsApi.getById(id as string),
    enabled: !!id,
    ...artifactQueryOptions(mode),
  });
}

/** Prefetch do detalhe de um gráfico — disparado no hover do card. */
export function usePrefetchChart() {
  const queryClient = useQueryClient();
  return (id: string, mode: ApiMode) =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.charts.detail(id, mode),
      queryFn: () => chartsApi.getById(id),
      ...artifactQueryOptions(mode),
    });
}

export function useDuplicateChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChartInput) => chartsApi.create(input),
    onSuccess: () => {
      toast.success('Gráfico duplicado com sucesso!');
      queryClient.invalidateQueries({ queryKey: queryKeys.charts.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao duplicar gráfico'));
    },
  });
}

export function useDeleteChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chartsApi.remove(id),
    onSuccess: () => {
      toast.success('Gráfico excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: queryKeys.charts.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao excluir gráfico'));
    },
  });
}

export function usePublishChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      publish ? chartsApi.publish(id) : chartsApi.unpublish(id),
    onSuccess: (_, { publish }) => {
      toast.success(publish ? 'Gráfico publicado!' : 'Publicação removida.');
      queryClient.invalidateQueries({ queryKey: queryKeys.charts.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao alterar publicação'));
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { queryKeys, type ApiMode } from '@/shared/lib/query-keys';
import {
  artifactQueryOptions,
  referenceQueryOptions,
} from '@/shared/lib/query-policies';
import { chartsApi } from './api';
import type { CreateChartInput, UpdateChartInput } from './types';

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

/**
 * Executa o dataBinding do gráfico e devolve o resultado JÁ no shape
 * (`POST /charts/:id/data`). Usado pelo playground da tela `/charts/:id` para
 * preencher o preview com os DADOS REAIS da query. `mode=draft` por padrão
 * (dado fresco em edição).
 */
export function useChartData(
  id: string | undefined,
  mode: ApiMode = 'draft',
) {
  return useQuery({
    queryKey: [...queryKeys.charts.detail(id ?? '', mode), 'data'],
    queryFn: () => chartsApi.getData(id as string, mode),
    enabled: !!id,
    // Dado de query: sem refetch automático agressivo; o usuário re-roda manualmente.
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/** Edita o draft de um gráfico (PATCH /charts/:id). */
export function useUpdateChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateChartInput }) =>
      chartsApi.update(id, input),
    onSuccess: (chart) => {
      toast.success('Gráfico salvo!');
      queryClient.invalidateQueries({ queryKey: queryKeys.charts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.charts.detail(chart.id, 'draft'),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao salvar gráfico'));
    },
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

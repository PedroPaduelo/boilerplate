import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { queryKeys, type ApiMode } from '@/shared/lib/query-keys';
import { artifactQueryOptions, referenceQueryOptions } from '@/shared/lib/query-policies';
import type { QueryClient } from '@tanstack/react-query';
import { dashboardsApi } from './api';
import type {
  AddChartInput,
  ArtifactVisibility,
  CreateDashboardInput,
  UpdateDashboardInput,
} from './types';

/**
 * Invalida TODAS as caches de um dashboard específico: o detalhe (draft +
 * published) e o payload de DADOS batch (qualquer modo/filtro, por prefixo).
 * Usado após salvar/publicar/despublicar para o editor e a view refletirem o
 * novo estado (doc 32 §3 — invalidação no publish/edição).
 */
function invalidateDashboard(queryClient: QueryClient, id: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.detail(id, 'draft') });
  queryClient.invalidateQueries({
    queryKey: queryKeys.dashboards.detail(id, 'published'),
  });
  // dashboardData(id, mode, hash) → invalida tudo do dashboard por prefixo.
  queryClient.invalidateQueries({ queryKey: ['dashboard-data', id] });
}

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

/**
 * Cria um dashboard EM BRANCO (rascunho privado) e devolve o registro — o
 * chamador navega para o editor.
 *
 * Antes existia apenas `useDuplicateDashboard` (que usa o mesmo POST), então
 * não havia nenhum caminho na interface para criar um dashboard do zero: só
 * dava para duplicar um que já existisse. Em uma conta nova a listagem ficava
 * num beco sem saída.
 */
export function useCreateDashboard() {
  const toast = useAppToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) =>
      dashboardsApi.create({
        title: title?.trim() || 'Dashboard sem título',
        draftLayout: { filters: [], rows: [] },
        visibility: 'PRIVATE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao criar dashboard'));
    },
  });
}

/**
 * Cadastra ou edita um RELATÓRIO EXTERNO (legado): um item que aparece na mesma
 * lista dos dashboards desta plataforma, mas cujo conteúdo mora fora dela.
 *
 * Usa as MESMAS rotas de dashboard (POST/PATCH) — o que muda é o payload:
 * `externalUrl` no lugar de `draftLayout`. Não existe rota separada porque não
 * existe entidade separada: para quem consome a lista, é um dashboard a mais.
 */
export interface SaveExternalDashboardInput {
  /** Ausente = cadastro novo; preenchido = edição do relatório já cadastrado. */
  id?: string;
  title: string;
  externalUrl: string;
  visibility: ArtifactVisibility;
  departmentId: string | null;
}

export function useSaveExternalDashboard() {
  const toast = useAppToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: SaveExternalDashboardInput) =>
      id ? dashboardsApi.update(id, input) : dashboardsApi.create(input),
    onSuccess: (_, { id }) => {
      toast.success(
        id ? 'Relatório externo atualizado!' : 'Relatório externo cadastrado!',
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
      if (id) invalidateDashboard(queryClient, id);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao salvar o relatório externo'));
    },
  });
}

export function useDuplicateDashboard() {
  const toast = useAppToast();
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
  const toast = useAppToast();
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
  const toast = useAppToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      publish ? dashboardsApi.publish(id) : dashboardsApi.unpublish(id),
    onSuccess: (_, { id, publish }) => {
      toast.success(publish ? 'Dashboard publicado!' : 'Publicação removida.');
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
      invalidateDashboard(queryClient, id);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao alterar publicação'));
    },
  });
}

/**
 * Salva o DRAFT de um dashboard (PATCH /dashboards/:id) — usado pelo editor
 * (T-G2). Invalida o detalhe/dados para a view e o próprio editor refletirem.
 */
export function useUpdateDashboard() {
  const toast = useAppToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDashboardInput }) =>
      dashboardsApi.update(id, input),
    onSuccess: (_, { id }) => {
      toast.success('Rascunho salvo!');
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
      invalidateDashboard(queryClient, id);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao salvar o rascunho'));
    },
  });
}

/**
 * add_chart_to_dashboard (POST /dashboards/:id/blocks) — insere um bloco que
 * referencia um Chart existente no draftLayout. Retorna o dashboard atualizado
 * (com o novo bloco montado pelo backend).
 */
export function useAddChartToDashboard() {
  const toast = useAppToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddChartInput }) =>
      dashboardsApi.addChart(id, input),
    onSuccess: (_, { id }) => {
      toast.success('Gráfico adicionado ao rascunho!');
      invalidateDashboard(queryClient, id);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao adicionar o gráfico'));
    },
  });
}

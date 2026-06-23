import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { connectionsApi, departmentsApi } from './api';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { queryKeys } from '@/shared/lib/query-keys';
import { referenceQueryOptions } from '@/shared/lib/query-policies';
import type {
  ConnectionFilters,
  CreateConnectionInput,
  RunQueryInput,
  UpdateConnectionInput,
} from './types';

/**
 * Hooks de dados da feature `connections`.
 *
 * - Usa as query-keys CENTRALIZADAS (`queryKeys.connections...`) — nada de
 *   strings soltas (T-E).
 * - Conexões são dado de "referência" (muda raramente) → `referenceQueryOptions()`
 *   (staleTime longo) conforme `query-policies`.
 */

export function useConnections(filters: ConnectionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.connections.list(filters as Record<string, unknown>),
    queryFn: () => connectionsApi.list(filters),
    ...referenceQueryOptions(),
  });
}

export function useConnection(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.connections.detail(id ?? ''),
    queryFn: () => connectionsApi.getById(id as string),
    enabled: !!id,
    ...referenceQueryOptions(),
  });
}

/**
 * Schema introspectado de uma conexão. `enabled` controla a busca lazy (só
 * dispara quando o explorer abre).
 */
export function useConnectionSchema(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.connections.schema(id ?? ''),
    queryFn: () => connectionsApi.getSchema(id as string),
    enabled: !!id && enabled,
    ...referenceQueryOptions(),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments.list(),
    queryFn: () => departmentsApi.list(),
    ...referenceQueryOptions(),
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateConnectionInput) => connectionsApi.create(input),
    onSuccess: () => {
      toast.success('Conexão criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao criar conexão'));
    },
  });
}

export function useUpdateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateConnectionInput) => connectionsApi.update(input),
    onSuccess: (_, variables) => {
      toast.success('Conexão atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.connections.detail(variables.id),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao atualizar conexão'));
    },
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => connectionsApi.remove(id),
    onSuccess: () => {
      toast.success('Conexão excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao excluir conexão'));
    },
  });
}

export function useTestConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => connectionsApi.test(id),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success('Conexão OK — conectividade verificada.');
      } else {
        toast.error(result.message ?? 'Falha ao conectar.');
      }
      // Atualiza status/lastTestedAt na lista e no detalhe.
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao testar conexão'));
    },
  });
}

/**
 * Executa um SELECT read-only contra a conexão (preview/dev). Sem toast de
 * sucesso (o resultado é renderizado inline); só reporta erro de execução.
 */
export function useRunConnectionQuery() {
  return useMutation({
    mutationFn: (input: RunQueryInput) => connectionsApi.runQuery(input),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao executar a query'));
    },
  });
}

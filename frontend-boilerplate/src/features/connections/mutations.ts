import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { connectionsApi } from './api';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { queryKeys } from '@/shared/lib/query-keys';
import type {
  CreateConnectionInput,
  RunQueryInput,
  UpdateConnectionInput,
} from './types';

/**
 * Mutações da feature `connections`.
 *
 * Toda falha vira `toast.error` com a mensagem REAL da API
 * (`getApiErrorMessage`) — "Request failed with status code 400" não diz ao
 * usuário se errou host, senha ou SSL. Erro de VALIDAÇÃO de campo não passa por
 * aqui: fica inline no `Field`/`TextInput` do formulário.
 */

export function useCreateConnection() {
  const toast = useAppToast();
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
  const toast = useAppToast();
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
  const toast = useAppToast();
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
  const toast = useAppToast();
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
  const toast = useAppToast();
  return useMutation({
    mutationFn: (input: RunQueryInput) => connectionsApi.runQuery(input),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao executar a query'));
    },
  });
}

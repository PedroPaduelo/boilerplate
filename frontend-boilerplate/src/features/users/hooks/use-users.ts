import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { usersApi } from '../api';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import type { UserFilters, CreateUserInput, UpdateUserInput } from '../types';

// Query keys
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...usersKeys.lists(), filters] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
  stats: () => [...usersKeys.all, 'stats'] as const,
};

// Hooks
export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: usersKeys.list(filters),
    queryFn: () => usersApi.getUsers(filters),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => usersApi.getUserById(id),
    enabled: !!id,
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: usersKeys.stats(),
    queryFn: () => usersApi.getStats(),
  });
}

/**
 * Criar/atualizar NÃO emitem toast de erro: quem falha é um formulário, e o
 * diálogo mostra a falha em `Banner` no topo — ao lado dos campos que precisam
 * ser corrigidos. Toast fica para confirmação de sucesso e para a exclusão
 * (que não tem formulário onde ancorar a mensagem).
 */
export function useCreateUser() {
  const toast = useAppToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.createUser(input),
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

export function useUpdateUser() {
  const toast = useAppToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserInput) => usersApi.updateUser(input),
    onSuccess: (_, variables) => {
      toast.success('Usuário atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(variables.id) });
    },
  });
}

export function useDeleteUser() {
  const toast = useAppToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      toast.success('Usuário excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao excluir usuário'));
    },
  });
}

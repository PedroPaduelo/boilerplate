import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersApi } from '../api';
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

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.createUser(input),
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    onError: () => {
      toast.error('Erro ao criar usuário');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserInput) => usersApi.updateUser(input),
    onSuccess: (_, variables) => {
      toast.success('Usuário atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(variables.id) });
    },
    onError: () => {
      toast.error('Erro ao atualizar usuário');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      toast.success('Usuário excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    onError: () => {
      toast.error('Erro ao excluir usuário');
    },
  });
}

export function useBulkDeleteUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => usersApi.bulkDeleteUsers(ids),
    onSuccess: () => {
      toast.success('Usuários excluídos com sucesso!');
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    onError: () => {
      toast.error('Erro ao excluir usuários');
    },
  });
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 'active' | 'inactive' }) =>
      usersApi.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      toast.success('Status atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });
}

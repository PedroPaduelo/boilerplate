import { apiClient } from '@/shared/lib/api-client';
import type {
  User,
  UserFilters,
  UsersResponse,
  UserStats,
  CreateUserInput,
  UpdateUserInput,
} from './types';

export const usersApi = {
  // Lista usuários (paginada + filtros) — GET /users (ADMIN)
  getUsers: async (filters: UserFilters = {}): Promise<UsersResponse> => {
    const { data } = await apiClient.get<UsersResponse>('/users', {
      params: {
        page: filters.page,
        pageSize: filters.pageSize,
        role: filters.role,
        isActive: filters.isActive,
        search: filters.search?.trim() || undefined,
      },
    });
    return data;
  },

  // Estatísticas agregadas — GET /users/stats (ADMIN)
  getStats: async (): Promise<UserStats> => {
    const { data } = await apiClient.get<UserStats>('/users/stats');
    return data;
  },

  // Detalhe — GET /users/:id (ADMIN)
  getUserById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },

  // Criar — POST /users (ADMIN)
  createUser: async (input: CreateUserInput): Promise<User> => {
    const { data } = await apiClient.post<User>('/users', input);
    return data;
  },

  // Atualizar — PUT /users/:id (ADMIN)
  updateUser: async ({ id, ...rest }: UpdateUserInput): Promise<User> => {
    const { data } = await apiClient.put<User>(`/users/${id}`, rest);
    return data;
  },

  // Excluir — DELETE /users/:id (ADMIN)
  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

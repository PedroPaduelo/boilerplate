import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import { queryKeys } from '@/shared/lib/query-keys';
import { referenceQueryOptions } from '@/shared/lib/query-policies';

/** Departamento como exposto por `GET /departments` (subset usado em filtros). */
export interface Department {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentsResponse {
  departments: Department[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Lista de departamentos (dado de referência, muda raramente) — usada nos
 * selects/filtros de visibilidade das telas de artefatos. `GET /departments` é
 * acessível a qualquer usuário autenticado (T-B1).
 */
export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments.list(),
    queryFn: async () => {
      const { data } = await apiClient.get<DepartmentsResponse>('/departments', {
        params: { pageSize: 100 },
      });
      return data;
    },
    ...referenceQueryOptions(),
  });
}

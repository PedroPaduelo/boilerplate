/**
 * Estado da LISTAGEM de gráficos: filtros, paginação e os dados já cruzados
 * (gráficos + departamentos).
 *
 * Mora fora de `hooks.ts` de propósito: `hooks.ts` é a camada de dados
 * compartilhada (outras features a consomem e a mockam nos testes), enquanto
 * isto aqui é o estado de UMA tela.
 */
import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useDepartments } from '@/shared/hooks/use-departments';
import {
  DEFAULT_ARTIFACT_FILTERS,
  filterArtifacts,
  hasActiveFilters,
  toServerFilters,
  type ArtifactFilterState,
} from '@/shared/lib/artifact-filters';
import { useCharts } from './hooks';
import type { Chart } from './types';

/** 12 cards/linhas por página: cabe numa tela sem paginar demais. */
export const CHARTS_PAGE_SIZE = 12;

export interface ChartsListDepartment {
  id: string;
  name: string;
}

export interface UseChartsListReturn {
  filters: ArtifactFilterState;
  setFilters: (next: ArtifactFilterState) => void;
  hasFilters: boolean;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalItems: number;
  departments: ChartsListDepartment[];
  /** Nome do departamento pelo id (ou `null` quando o gráfico não tem um). */
  departmentName: (id: string | null) => string | null;
  /** Gráficos da página, após os filtros aplicados no cliente. */
  charts: Chart[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * @param currentUserId dono logado — o filtro "Meus" é aplicado no cliente,
 * porque a API não expõe esse recorte.
 */
export function useChartsList(currentUserId: string | undefined): UseChartsListReturn {
  const [filters, setFiltersState] = useState<ArtifactFilterState>(
    DEFAULT_ARTIFACT_FILTERS,
  );
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(filters.search, 300);
  const serverFilters = useMemo(
    () =>
      toServerFilters({ ...filters, search: debouncedSearch }, page, CHARTS_PAGE_SIZE),
    [filters, debouncedSearch, page],
  );

  const { data, isLoading, isError, refetch } = useCharts(serverFilters);
  const { data: deptData } = useDepartments();

  const departments = useMemo(
    () => deptData?.departments.map((d) => ({ id: d.id, name: d.name })) ?? [],
    [deptData],
  );

  const departmentName = useMemo(() => {
    const byId = new Map(departments.map((d) => [d.id, d.name]));
    return (id: string | null) => (id ? (byId.get(id) ?? 'Departamento') : null);
  }, [departments]);

  // Departamento e "meus" não existem na query da API — filtram no cliente.
  const charts = useMemo(
    () => filterArtifacts(data?.charts ?? [], filters, currentUserId),
    [data, filters, currentUserId],
  );

  const setFilters = useCallback((next: ArtifactFilterState) => {
    setFiltersState(next);
    setPage(1);
  }, []);

  return {
    filters,
    setFilters,
    hasFilters: hasActiveFilters(filters),
    page,
    setPage,
    totalPages: data?.totalPages ?? 1,
    totalItems: data?.total ?? 0,
    departments,
    departmentName,
    charts,
    isLoading,
    isError,
    refetch: () => {
      void refetch();
    },
  };
}

/**
 * Filtros das telas de listagem de artefatos (dashboards/gráficos) — T-F2.
 *
 * Os filtros suportados nativamente pela API (busca por título, `status`,
 * `visibility`) são enviados ao backend (que pagina o resultado). Os filtros
 * `departamento` e `owner` (meus/todos) NÃO existem na query da API
 * (`listDashboardsQuerySchema`/`listChartsQuerySchema` só aceitam
 * page/pageSize/search/status/visibility), então são aplicados no cliente sobre
 * a página corrente via `filterArtifacts`.
 *
 * `filterArtifacts` é PURA e cobre TODOS os critérios (inclusive busca/status/
 * visibilidade) para ser testável de ponta a ponta com dados mock — a tela usa
 * o subconjunto cliente, mas a função é a fonte única da semântica de filtro.
 */
export type StatusFilter = 'ALL' | 'DRAFT' | 'PUBLISHED';
export type VisibilityFilter = 'ALL' | 'PRIVATE' | 'DEPARTMENT' | 'ORG';
export type OwnerFilter = 'ALL' | 'MINE';

export interface ArtifactFilterState {
  /** Busca por título (case-insensitive, substring). */
  search: string;
  status: StatusFilter;
  visibility: VisibilityFilter;
  owner: OwnerFilter;
  /** Id do departamento, ou `'ALL'`. */
  departmentId: string;
}

export const DEFAULT_ARTIFACT_FILTERS: ArtifactFilterState = {
  search: '',
  status: 'ALL',
  visibility: 'ALL',
  owner: 'ALL',
  departmentId: 'ALL',
};

/** Forma mínima de um artefato filtrável (dashboard ou chart). */
export interface FilterableArtifact {
  title: string;
  status: string;
  visibility: string;
  departmentId: string | null;
  ownerId: string;
}

/** `true` se algum filtro está ativo (≠ default) — controla o estado vazio/UX. */
export function hasActiveFilters(state: ArtifactFilterState): boolean {
  return (
    state.search.trim().length > 0 ||
    state.status !== 'ALL' ||
    state.visibility !== 'ALL' ||
    state.owner !== 'ALL' ||
    state.departmentId !== 'ALL'
  );
}

/**
 * Filtra uma lista de artefatos por todos os critérios. Determinística e sem
 * efeitos colaterais.
 */
export function filterArtifacts<T extends FilterableArtifact>(
  items: readonly T[],
  state: ArtifactFilterState,
  currentUserId: string | null | undefined,
): T[] {
  const search = state.search.trim().toLowerCase();
  return items.filter((item) => {
    if (search && !item.title.toLowerCase().includes(search)) return false;
    if (state.status !== 'ALL' && item.status !== state.status) return false;
    if (state.visibility !== 'ALL' && item.visibility !== state.visibility) {
      return false;
    }
    if (state.departmentId !== 'ALL' && item.departmentId !== state.departmentId) {
      return false;
    }
    if (state.owner === 'MINE' && item.ownerId !== currentUserId) return false;
    return true;
  });
}

/**
 * Monta o objeto de filtros enviado à API (somente os suportados server-side).
 * Campos em `'ALL'`/vazios são omitidos para chaves de cache estáveis.
 */
export function toServerFilters(
  state: ArtifactFilterState,
  page: number,
  pageSize: number,
): Record<string, unknown> {
  const filters: Record<string, unknown> = { page, pageSize };
  const search = state.search.trim();
  if (search) filters.search = search;
  if (state.status !== 'ALL') filters.status = state.status;
  if (state.visibility !== 'ALL') filters.visibility = state.visibility;
  return filters;
}

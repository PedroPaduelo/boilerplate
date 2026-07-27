import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { HStack } from '@astryxdesign/core/HStack';
import { List } from '@astryxdesign/core/List';
import { Pagination } from '@astryxdesign/core/Pagination';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import {
  DEFAULT_ARTIFACT_FILTERS,
  hasActiveFilters,
  type ArtifactFilterState,
} from '@/shared/lib/artifact-filters';
import { ArtifactListHeader } from './artifact-list-header';
import {
  ArtifactListFilters,
  type ArtifactListDepartment,
} from './artifact-list-filters';
import {
  ArtifactListEmpty,
  ArtifactListError,
  ArtifactListFilteredEmpty,
  ArtifactListSkeleton,
  type ArtifactNoun,
} from './artifact-list-states';

export type { ArtifactListDepartment };

export interface ArtifactListViewProps {
  eyebrow: string;
  title: string;
  description: string;
  emptyIcon: LucideIcon;
  /** Substantivo da entidade (singular/plural) para textos. */
  noun: ArtifactNoun;
  searchPlaceholder: string;

  filters: ArtifactFilterState;
  onFiltersChange: (next: ArtifactFilterState) => void;
  departments: ArtifactListDepartment[];

  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  /** Total exibido (após filtros cliente). */
  shownCount: number;

  /** Paginação server-side. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  /** Ação opcional do cabeçalho (ex.: "Novo"). */
  headerAction?: ReactNode;

  /**
   * Estado vazio de PRIMEIRO USO (nenhum filtro ativo e nada criado ainda).
   * Diferente do "nenhum resultado para este filtro": aqui o usuário não tem
   * o que ajustar, precisa de um caminho para CRIAR algo. Sem estes props o
   * componente cai num texto genérico.
   */
  emptyTitle?: string;
  emptyDescription?: string;
  /** CTA(s) do estado de primeiro uso (ex.: "Novo dashboard"). */
  emptyAction?: ReactNode;

  /** Linhas da lista (`ArtifactCard`), renderizadas no estado de sucesso. */
  children: ReactNode;
}

/**
 * Casca das telas de listagem de artefatos: cabeçalho, busca/filtros, os
 * quatro estados (carregando, erro, vazio e sucesso), a lista e a paginação.
 * Presentacional e controlado — filtros e página vivem na feature.
 *
 * A listagem é uma LISTA com divisores, não uma grade de cards: os itens são
 * homogêneos e densos, e ler em linha mantém título, estado e data alinhados
 * na vertical, que é como se compara e se varre.
 */
export function ArtifactListView({
  eyebrow,
  title,
  description,
  emptyIcon,
  noun,
  searchPlaceholder,
  filters,
  onFiltersChange,
  departments,
  isLoading,
  isError,
  isEmpty,
  shownCount,
  page,
  totalPages,
  onPageChange,
  headerAction,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
}: ArtifactListViewProps) {
  // Vazio "por filtro" (dá para corrigir ajustando a busca) vs. vazio de
  // primeiro uso (não há nada criado — precisa de um CTA, não de um filtro).
  const filtersActive = hasActiveFilters(filters);

  return (
    <VStack gap={6}>
      <ArtifactListHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={headerAction}
      />

      <VStack gap={4}>
        <ArtifactListFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          departments={departments}
          searchPlaceholder={searchPlaceholder}
          isDisabled={isError}
        />

        {isLoading ? (
          <ArtifactListSkeleton noun={noun} />
        ) : isError ? (
          <ArtifactListError noun={noun} onRetry={() => window.location.reload()} />
        ) : isEmpty && filtersActive ? (
          <ArtifactListFilteredEmpty
            onClearFilters={() => onFiltersChange(DEFAULT_ARTIFACT_FILTERS)}
          />
        ) : isEmpty ? (
          <ArtifactListEmpty
            icon={emptyIcon}
            title={emptyTitle ?? `Nenhum ${noun.singular} por aqui ainda`}
            description={
              emptyDescription ??
              `Assim que você criar ${noun.plural}, eles aparecem nesta lista.`
            }
            action={emptyAction}
          />
        ) : (
          <VStack gap={3}>
            <List
              hasDividers
              density="compact"
              header={
                <Text type="supporting" hasTabularNumbers>
                  {shownCount} {noun.plural} nesta página
                </Text>
              }
            >
              {children}
            </List>

            {totalPages > 1 ? (
              <HStack hAlign="end">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChange={onPageChange}
                  variant="pages"
                  size="sm"
                  label={`Paginação de ${noun.plural}`}
                />
              </HStack>
            ) : null}
          </VStack>
        )}
      </VStack>
    </VStack>
  );
}

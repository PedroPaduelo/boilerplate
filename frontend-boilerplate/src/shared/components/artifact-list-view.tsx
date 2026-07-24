import type { ReactNode } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  type LucideIcon,
} from 'lucide-react';
import {
  Button,
  Input,
  Section,
  SectionHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@/components/ui';
import {
  DEFAULT_ARTIFACT_FILTERS,
  hasActiveFilters,
  type ArtifactFilterState,
  type OwnerFilter,
  type StatusFilter,
  type VisibilityFilter,
} from '@/shared/lib/artifact-filters';

export interface ArtifactListDepartment {
  id: string;
  name: string;
}

export interface ArtifactListViewProps {
  eyebrow: string;
  title: string;
  description: string;
  emptyIcon: LucideIcon;
  /** Substantivo da entidade (singular/plural) para textos. */
  noun: { singular: string; plural: string };
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

  /** Grid de cards (renderizado no estado de sucesso). */
  children: ReactNode;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'DRAFT', label: 'Rascunho' },
];

const VISIBILITY_OPTIONS: { value: VisibilityFilter; label: string }[] = [
  { value: 'ALL', label: 'Toda visibilidade' },
  { value: 'PRIVATE', label: 'Privado' },
  { value: 'DEPARTMENT', label: 'Departamento' },
  { value: 'ORG', label: 'Organização' },
];

const OWNER_OPTIONS: { value: OwnerFilter; label: string }[] = [
  { value: 'ALL', label: 'Qualquer dono' },
  { value: 'MINE', label: 'Meus' },
];

/**
 * Casca das telas de listagem de artefatos: cabeçalho, barra de busca/filtros,
 * estados (loading/erro/vazio), grid de cards e paginação. Presentacional e
 * controlado — o estado de filtros/página vive na feature.
 */
export function ArtifactListView({
  eyebrow,
  title,
  description,
  emptyIcon: EmptyIcon,
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
  const patch = (partial: Partial<ArtifactFilterState>) =>
    onFiltersChange({ ...filters, ...partial });

  // Vazio "por filtro" (dá pra corrigir ajustando a busca) vs vazio de
  // primeiro uso (não há nada criado — precisa de um CTA, não de um filtro).
  const filtersActive = hasActiveFilters(filters);

  return (
    <div className="flex flex-col gap-8">
      <Section index={0}>
        <SectionHeader
          className="mb-0"
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={headerAction}
        />
      </Section>

      <Section
        index={1}
        className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
      >
        {/* Barra de busca + filtros */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => patch({ search: e.target.value })}
              placeholder={searchPlaceholder}
              className="rounded-lg pl-8"
              aria-label="Buscar por título"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.status}
              onValueChange={(v) => patch({ status: v as StatusFilter })}
            >
              <SelectTrigger size="sm" className="w-[150px]" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.visibility}
              onValueChange={(v) => patch({ visibility: v as VisibilityFilter })}
            >
              <SelectTrigger size="sm" className="w-[160px]" aria-label="Visibilidade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.departmentId}
              onValueChange={(v) => patch({ departmentId: v })}
            >
              <SelectTrigger size="sm" className="w-[170px]" aria-label="Departamento">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todo departamento</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.owner}
              onValueChange={(v) => patch({ owner: v as OwnerFilter })}
            >
              <SelectTrigger size="sm" className="w-[140px]" aria-label="Dono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OWNER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Não foi possível carregar {noun.plural}
              </p>
              <p className="mx-auto max-w-xs text-xs text-muted-foreground">
                Pode ser uma instabilidade momentânea de rede ou do servidor.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="size-4" />
              Tentar de novo
            </Button>
          </div>
        ) : isEmpty && filtersActive ? (
          /* Há filtros ativos → o caminho de saída é LIMPAR o filtro. */
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="size-6" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Nenhum resultado para esses filtros
              </p>
              <p className="mx-auto max-w-xs text-xs text-muted-foreground">
                Tente outro termo de busca ou remova alguns filtros.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFiltersChange(DEFAULT_ARTIFACT_FILTERS)}
            >
              Limpar filtros
            </Button>
          </div>
        ) : isEmpty ? (
          /* Primeiro uso: nada criado ainda → oferecer o CAMINHO de criação. */
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <EmptyIcon className="size-6" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {emptyTitle ?? `Nenhum ${noun.singular} por aqui ainda`}
              </p>
              <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
                {emptyDescription ??
                  `Assim que você criar ${noun.plural}, eles aparecem nesta lista.`}
              </p>
            </div>
            {emptyAction ? (
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                {emptyAction}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {children}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="tabular-nums">{shownCount}</span> {noun.plural} nesta
                página
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft />
                  </Button>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    aria-label="Próxima página"
                  >
                    <ChevronRight />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </Section>
    </div>
  );
}

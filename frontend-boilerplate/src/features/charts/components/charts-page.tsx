import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '@/features/auth/store';
import { useConfirmDelete } from '@/shared/hooks/use-confirm-delete';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useDepartments } from '@/shared/hooks/use-departments';
import {
  DEFAULT_ARTIFACT_FILTERS,
  filterArtifacts,
  toServerFilters,
  type ArtifactFilterState,
} from '@/shared/lib/artifact-filters';
import type { ApiMode } from '@/shared/lib/query-keys';
import { ArtifactCard } from '@/shared/components/artifact-card';
import { ArtifactListView } from '@/shared/components/artifact-list-view';
import { buildArtifactCardActions } from '@/shared/components/artifact-action-builder';
import { ShareArtifactDialog } from '@/shared/components/share-artifact-dialog';

import {
  useCharts,
  useDeleteChart,
  useDuplicateChart,
  usePrefetchChart,
  usePublishChart,
} from '../hooks';
import type { Chart } from '../types';

const PAGE_SIZE = 12;

function modeFor(status: string): ApiMode {
  return status === 'PUBLISHED' ? 'published' : 'draft';
}

export function ChartsPage() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [filters, setFilters] = useState<ArtifactFilterState>(
    DEFAULT_ARTIFACT_FILTERS,
  );
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(filters.search, 300);
  const serverFilters = useMemo(
    () =>
      toServerFilters({ ...filters, search: debouncedSearch }, page, PAGE_SIZE),
    [filters, debouncedSearch, page],
  );

  const { data, isLoading, isError } = useCharts(serverFilters);
  const { data: deptData } = useDepartments();

  const prefetch = usePrefetchChart();
  const duplicate = useDuplicateChart();
  const remove = useDeleteChart();
  const publish = usePublishChart();

  const [sharing, setSharing] = useState<Chart | null>(null);
  const {
    deleting: deletingChart,
    confirmation: deleteConfirmation,
    openDelete: openDeleteChart,
  } = useConfirmDelete<Chart>({
    mutation: remove,
    getId: (c) => c.id,
    getTitle: (c) => c.title,
  });

  const departments = useMemo(
    () => deptData?.departments.map((d) => ({ id: d.id, name: d.name })) ?? [],
    [deptData],
  );
  const deptName = useMemo(() => {
    const map = new Map(departments.map((d) => [d.id, d.name]));
    return (id: string | null) => (id ? (map.get(id) ?? 'Departamento') : null);
  }, [departments]);

  const shown = useMemo(
    () => filterArtifacts(data?.charts ?? [], filters, currentUserId),
    [data, filters, currentUserId],
  );

  const handleDuplicate = (c: Chart) =>
    duplicate.mutate({
      title: `${c.title} (cópia)`,
      catalogType: c.catalogType,
      draftProps: c.draftProps,
      draftDataBinding: c.draftDataBinding,
      departmentId: c.departmentId,
      visibility: 'PRIVATE',
    });

  return (
    <>
      <ArtifactListView
        eyebrow="Artefatos"
        title="Gráficos"
        description="Explore, busque e gerencie os gráficos visíveis para você conforme seu papel e visibilidade."
        emptyIcon={BarChart3}
        noun={{ singular: 'gráfico', plural: 'gráficos' }}
        searchPlaceholder="Buscar gráficos por título…"
        filters={filters}
        onFiltersChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        departments={departments}
        isLoading={isLoading}
        isError={isError}
        isEmpty={shown.length === 0}
        shownCount={shown.length}
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      >
        {shown.map((c) => {
          const mode = modeFor(c.status);
          const ctx = {
            role,
            currentUserId,
            ownerId: c.ownerId,
            status: c.status,
          };
          const actions = buildArtifactCardActions(ctx, {
            open: () => navigate(`/charts/${c.id}`),
            edit: () => navigate(`/charts/${c.id}`),
            publish: () => publish.mutate({ id: c.id, publish: true }),
            unpublish: () => publish.mutate({ id: c.id, publish: false }),
            share: () => setSharing(c),
            export: () => toast.info('Exportação em PDF chega em breve (T-J).'),
            duplicate: () => handleDuplicate(c),
            delete: () => openDeleteChart(c),
          });
          return (
            <ArtifactCard
              key={c.id}
              title={c.title}
              icon={BarChart3}
              status={c.status}
              visibility={c.visibility}
              metaPrimary={c.ownerId === currentUserId ? 'Meu gráfico' : undefined}
              metaSecondary={deptName(c.departmentId) ?? c.catalogType}
              updatedAt={c.updatedAt}
              onOpen={() => navigate(`/charts/${c.id}`)}
              onPrefetch={() => prefetch(c.id, mode)}
              actions={actions}
              confirming={
                deletingChart?.id === c.id && deleteConfirmation
                  ? deleteConfirmation
                  : undefined
              }
            />
          );
        })}
      </ArtifactListView>

      <ShareArtifactDialog
        key={sharing?.id ?? 'none'}
        open={!!sharing}
        onOpenChange={(o) => !o && setSharing(null)}
        targetType="CHART"
        targetId={sharing?.id ?? null}
        targetTitle={sharing?.title}
      />
    </>
  );
}

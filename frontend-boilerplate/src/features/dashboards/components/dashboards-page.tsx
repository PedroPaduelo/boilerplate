import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
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
import { ConfirmDeleteDialog } from '@/shared/components/confirm-delete-dialog';

import {
  useDashboards,
  useDeleteDashboard,
  useDuplicateDashboard,
  usePrefetchDashboard,
  usePublishDashboard,
} from '../hooks';
import type { Dashboard } from '../types';

const PAGE_SIZE = 12;

function modeFor(status: string): ApiMode {
  return status === 'PUBLISHED' ? 'published' : 'draft';
}

export function DashboardsPage() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [filters, setFilters] = useState<ArtifactFilterState>(
    DEFAULT_ARTIFACT_FILTERS,
  );
  const [page, setPage] = useState(1);

  // Busca/status/visibilidade vão ao servidor (paginado); departamento/owner
  // são refinados no cliente sobre a página corrente.
  const debouncedSearch = useDebounce(filters.search, 300);
  const serverFilters = useMemo(
    () =>
      toServerFilters({ ...filters, search: debouncedSearch }, page, PAGE_SIZE),
    [filters, debouncedSearch, page],
  );

  const { data, isLoading, isError } = useDashboards(serverFilters);
  const { data: deptData } = useDepartments();

  const prefetch = usePrefetchDashboard();
  const duplicate = useDuplicateDashboard();
  const remove = useDeleteDashboard();
  const publish = usePublishDashboard();

  const [sharing, setSharing] = useState<Dashboard | null>(null);
  const {
    dialogProps: deleteDialog,
    openDelete: openDeleteDashboard,
  } = useConfirmDelete<Dashboard>({
    mutation: remove,
    getId: (d) => d.id,
    getTitle: (d) => d.title,
  });

  const departments = useMemo(
    () => deptData?.departments.map((d) => ({ id: d.id, name: d.name })) ?? [],
    [deptData],
  );
  const deptName = useMemo(() => {
    const map = new Map(departments.map((d) => [d.id, d.name]));
    return (id: string | null) => (id ? (map.get(id) ?? 'Departamento') : null);
  }, [departments]);

  // Refino cliente (departamento + owner) sobre a página retornada.
  const shown = useMemo(
    () => filterArtifacts(data?.dashboards ?? [], filters, currentUserId),
    [data, filters, currentUserId],
  );

  const handleDuplicate = (d: Dashboard) =>
    duplicate.mutate({
      title: `${d.title} (cópia)`,
      draftLayout: d.draftLayout,
      departmentId: d.departmentId,
      visibility: 'PRIVATE',
    });

  return (
    <>
      <ArtifactListView
        eyebrow="Artefatos"
        title="Dashboards"
        description="Explore, busque e gerencie os dashboards visíveis para você conforme seu papel e visibilidade."
        emptyIcon={LayoutDashboard}
        noun={{ singular: 'dashboard', plural: 'dashboards' }}
        searchPlaceholder="Buscar dashboards por título…"
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
        {shown.map((d) => {
          const mode = modeFor(d.status);
          const ctx = {
            role,
            currentUserId,
            ownerId: d.ownerId,
            status: d.status,
          };
          const actions = buildArtifactCardActions(ctx, {
            open: () => navigate(`/dashboards/${d.id}`),
            edit: () => navigate(`/dashboards/${d.id}/edit`),
            publish: () => publish.mutate({ id: d.id, publish: true }),
            unpublish: () => publish.mutate({ id: d.id, publish: false }),
            share: () => setSharing(d),
            export: () =>
              toast.info('Exportação em PDF chega em breve (T-J).'),
            duplicate: () => handleDuplicate(d),
            delete: () => openDeleteDashboard(d),
          });
          return (
            <ArtifactCard
              key={d.id}
              title={d.title}
              icon={LayoutDashboard}
              status={d.status}
              visibility={d.visibility}
              metaPrimary={d.ownerId === currentUserId ? 'Meu dashboard' : undefined}
              metaSecondary={deptName(d.departmentId) ?? undefined}
              updatedAt={d.updatedAt}
              onOpen={() => navigate(`/dashboards/${d.id}`)}
              onPrefetch={() => prefetch(d.id, mode)}
              actions={actions}
            />
          );
        })}
      </ArtifactListView>

      <ShareArtifactDialog
        key={sharing?.id ?? 'none'}
        open={!!sharing}
        onOpenChange={(o) => !o && setSharing(null)}
        targetType="DASHBOARD"
        targetId={sharing?.id ?? null}
        targetTitle={sharing?.title}
      />
      <ConfirmDeleteDialog
        title="Excluir dashboard?"
        {...deleteDialog}
      />
    </>
  );
}

/**
 * Listagem de dashboards — `/dashboards`.
 *
 * A página é o ÚNICO lugar com estado e regra: filtros, paginação, permissões e
 * as mutações. Toolbar, tabela, vazio e confirmação recebem tudo pronto por
 * prop, então cada um deles é testável isolado e reutilizável.
 *
 * Busca/status/visibilidade vão ao servidor (paginado); departamento/dono são
 * refinados no cliente sobre a página corrente (a API não os aceita).
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Pagination } from '@astryxdesign/core/Pagination';
import { Text } from '@astryxdesign/core/Text';

import { useConfirmDelete } from '@/shared/hooks/use-confirm-delete';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useDepartments } from '@/shared/hooks/use-departments';
import { hasPermission } from '@/shared/lib/rbac';
import {
  DEFAULT_ARTIFACT_FILTERS,
  filterArtifacts,
  hasActiveFilters,
  toServerFilters,
  type ArtifactFilterState,
} from '@/shared/lib/artifact-filters';
import type { ApiMode } from '@/shared/lib/query-keys';
import { ShareArtifactDialog } from '@/shared/components/share-artifact-dialog';
import { useAuthStore } from '@/features/auth/store';

import {
  useCreateDashboard,
  useDashboards,
  useDeleteDashboard,
  useDuplicateDashboard,
  usePrefetchDashboard,
  usePublishDashboard,
} from '../hooks';
import { useExportDashboardPdf } from '../use-export-pdf';
import type { Dashboard } from '../types';
import { buildDashboardActions } from './dashboard-actions';
import { DashboardsEmptyState } from './dashboards-empty-state';
import { DashboardsToolbar } from './dashboards-toolbar';
import {
  DashboardsTable,
  DashboardsTableSkeleton,
  type DashboardRow,
} from './dashboards-table';
import { DeleteDashboardDialog } from './delete-dashboard-dialog';

const PAGE_SIZE = 12;

function modeFor(status: string): ApiMode {
  return status === 'PUBLISHED' ? 'published' : 'draft';
}

export function DashboardsPage() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [filters, setFilters] = useState<ArtifactFilterState>(DEFAULT_ARTIFACT_FILTERS);
  const [page, setPage] = useState(1);
  const [sharing, setSharing] = useState<Dashboard | null>(null);

  const debouncedSearch = useDebounce(filters.search, 300);
  const serverFilters = useMemo(
    () => toServerFilters({ ...filters, search: debouncedSearch }, page, PAGE_SIZE),
    [filters, debouncedSearch, page],
  );

  const { data, isLoading, isError, refetch } = useDashboards(serverFilters);
  const { data: deptData } = useDepartments();

  const prefetch = usePrefetchDashboard();
  const duplicate = useDuplicateDashboard();
  const remove = useDeleteDashboard();
  const publish = usePublishDashboard();
  const create = useCreateDashboard();
  const pdfExport = useExportDashboardPdf();

  const { deleting, confirmation, openDelete } = useConfirmDelete<Dashboard>({
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

  const shown = useMemo(
    () => filterArtifacts(data?.dashboards ?? [], filters, currentUserId),
    [data, filters, currentUserId],
  );

  const canManage = hasPermission(role, 'artifacts:manage');

  // Criar → abre direto o editor do rascunho recém-criado (o título é editável
  // lá dentro; pedir nome antes de o artefato existir é uma etapa a mais).
  const handleCreate = () =>
    create.mutate(undefined, {
      onSuccess: (created) => navigate(`/dashboards/${created.id}/edit`),
    });

  const rows: DashboardRow[] = shown.map((d) => ({
    id: d.id,
    title: d.title,
    href: `/dashboards/${d.id}`,
    status: d.status,
    visibility: d.visibility,
    department: deptName(d.departmentId),
    updatedAt: d.updatedAt,
    isMine: d.ownerId === currentUserId,
    onPrefetch: () => prefetch(d.id, modeFor(d.status)),
    actions: buildDashboardActions(
      { role, currentUserId, ownerId: d.ownerId, status: d.status },
      {
        open: () => navigate(`/dashboards/${d.id}`),
        edit: () => navigate(`/dashboards/${d.id}/edit`),
        publish: () => publish.mutate({ id: d.id, publish: true }),
        unpublish: () => publish.mutate({ id: d.id, publish: false }),
        share: () => setSharing(d),
        // O PDF reflete o que o leitor veria: a versão publicada quando
        // existe, senão o rascunho (preview do dono).
        export: () =>
          pdfExport.exportPdf({ id: d.id, title: d.title }, { mode: modeFor(d.status) }),
        duplicate: () =>
          duplicate.mutate({
            title: `${d.title} (cópia)`,
            draftLayout: d.draftLayout,
            departmentId: d.departmentId,
            visibility: 'PRIVATE',
          }),
        delete: () => openDelete(d),
      },
    ),
  }));

  const totalPages = data?.totalPages ?? 1;

  return (
    <VStack gap={4}>
      {/* O h1 da tela é o título da topbar do shell. Repetir "Dashboards" aqui
          dava o MESMO nome em dois tamanhos e pesos diferentes na mesma tela —
          é a convenção já documentada em `/connections` e `/users`. */}
      <Text type="supporting">
        Explore, busque e gerencie os dashboards visíveis para você conforme seu papel e a
        visibilidade de cada painel.
      </Text>

      <DashboardsToolbar
        filters={filters}
        onFiltersChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        departments={departments}
        canCreate={canManage}
        isCreating={create.isPending}
        onCreate={handleCreate}
      />

      {isLoading ? (
        <DashboardsTableSkeleton />
      ) : isError ? (
        <Banner
          status="error"
          title="Não foi possível carregar os dashboards"
          description="Pode ser uma instabilidade momentânea de rede ou do servidor."
          endContent={<Button label="Tentar de novo" onClick={() => void refetch()} />}
        />
      ) : rows.length === 0 ? (
        <DashboardsEmptyState
          hasFilters={hasActiveFilters(filters)}
          canCreate={canManage}
          isCreating={create.isPending}
          onCreate={handleCreate}
          onClearFilters={() => {
            setFilters(DEFAULT_ARTIFACT_FILTERS);
            setPage(1);
          }}
          onAskAgent={() => navigate('/chat')}
        />
      ) : (
        <VStack gap={3}>
          <DashboardsTable rows={rows} />
          <HStack vAlign="center" hAlign="between" gap={2}>
            <Text type="supporting" hasTabularNumbers>
              {rows.length} {rows.length === 1 ? 'dashboard' : 'dashboards'} nesta página
            </Text>
            {totalPages > 1 ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={PAGE_SIZE}
                size="sm"
                onChange={setPage}
              />
            ) : null}
          </HStack>
        </VStack>
      )}

      <DeleteDashboardDialog title={deleting?.title} confirmation={confirmation} />

      <ShareArtifactDialog
        key={sharing?.id ?? 'none'}
        open={!!sharing}
        onOpenChange={(open) => !open && setSharing(null)}
        targetType="DASHBOARD"
        targetId={sharing?.id ?? null}
        targetTitle={sharing?.title}
      />
    </VStack>
  );
}

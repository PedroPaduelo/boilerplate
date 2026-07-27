/**
 * Página "Gráficos" (`/charts`) — lista o que o usuário pode ver, conforme
 * papel e visibilidade (o backend já filtra; o RBAC do cliente só esconde ações).
 *
 * A lista é uma TABELA: o dado é denso e comparável (status, visibilidade,
 * contexto, data). Card aqui viraria uma grade de caixas com pouca informação
 * cada e nenhuma coluna alinhada.
 *
 * Os quatro estados: carregando (`Skeleton` com a geometria da tabela), erro
 * (`Banner` com "Tentar de novo"), vazio (`EmptyState` com caminho de criação)
 * e desabilitado (ações sem permissão nem aparecem; as que dependem de contexto
 * mostram o motivo).
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Pagination } from '@astryxdesign/core/Pagination';
import { Heading, Text } from '@astryxdesign/core/Text';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { useConfirmDelete } from '@/shared/hooks/use-confirm-delete';
import { DEFAULT_ARTIFACT_FILTERS } from '@/shared/lib/artifact-filters';
import { hasPermission } from '@/shared/lib/rbac';
import { ShareArtifactDialog } from '@/shared/components/share-artifact-dialog';
import { useAuthStore } from '@/features/auth/store';
import {
  useDeleteChart,
  useDuplicateChart,
  usePrefetchChart,
  usePublishChart,
} from '../hooks';
import { CHARTS_PAGE_SIZE, useChartsList } from '../use-charts-list';
import { buildChartMenuItems } from '../lib/chart-actions';
import type { Chart } from '../types';
import { ChartsEmptyState } from './charts-empty-state';
import { ChartsFilters } from './charts-filters';
import { ChartsTable, type ChartRow } from './charts-table';
import { ChartsTableSkeleton } from './charts-table-skeleton';
import { DeleteChartDialog } from './delete-chart-dialog';

export function ChartsPage() {
  const toast = useAppToast();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const list = useChartsList(currentUserId);
  const prefetch = usePrefetchChart();
  const duplicate = useDuplicateChart();
  const remove = useDeleteChart();
  const publish = usePublishChart();

  const [sharing, setSharing] = useState<Chart | null>(null);
  const { deleting, confirmation, openDelete } = useConfirmDelete<Chart>({
    mutation: remove,
    getId: (c) => c.id,
    getTitle: (c) => c.title,
  });

  const canCreate = hasPermission(role, 'artifacts:manage');

  const rows: ChartRow[] = useMemo(
    () =>
      list.charts.map((chart) => ({
        id: chart.id,
        chart,
        title: chart.title,
        catalogType: chart.catalogType,
        isPublished: chart.status === 'PUBLISHED',
        visibility: chart.visibility,
        context:
          list.departmentName(chart.departmentId) ??
          (chart.ownerId === currentUserId ? 'Meu gráfico' : 'Organização'),
        updatedAt: chart.updatedAt,
        actions: buildChartMenuItems(
          {
            role,
            currentUserId,
            ownerId: chart.ownerId,
            status: chart.status,
          },
          {
            open: () => navigate(`/charts/${chart.id}`),
            edit: () => navigate(`/charts/${chart.id}`),
            publish: () => publish.mutate({ id: chart.id, publish: true }),
            unpublish: () => publish.mutate({ id: chart.id, publish: false }),
            share: () => setSharing(chart),
            export: () => toast.info('Exportação em PDF chega em breve (T-J).'),
            duplicate: () =>
              duplicate.mutate({
                title: `${chart.title} (cópia)`,
                catalogType: chart.catalogType,
                draftProps: chart.draftProps,
                draftDataBinding: chart.draftDataBinding,
                departmentId: chart.departmentId,
                visibility: 'PRIVATE',
              }),
            delete: () => openDelete(chart),
          },
        ),
      })),
    // `list.departmentName` e os mutations são estáveis por render do hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list.charts, list.departmentName, role, currentUserId],
  );

  return (
    <VStack gap={5}>
      <HStack gap={3} justify="between" vAlign="center" wrap="wrap">
        <VStack gap={1}>
          <Heading level={2}>Gráficos</Heading>
          <Text type="supporting">
            Explore, busque e gerencie os gráficos visíveis para você conforme seu papel e
            visibilidade.
          </Text>
        </VStack>
        {canCreate ? (
          <Button
            label="Criar com IA"
            variant="primary"
            icon={<Icon icon={MessageSquare} />}
            onClick={() => navigate('/chat')}
          />
        ) : null}
      </HStack>

      <ChartsFilters
        filters={list.filters}
        onChange={list.setFilters}
        departments={list.departments}
        hasFilters={list.hasFilters}
      />

      {list.isLoading ? (
        <ChartsTableSkeleton />
      ) : list.isError ? (
        <Banner
          status="error"
          title="Não foi possível carregar os gráficos"
          description="Pode ser uma instabilidade momentânea de rede ou do servidor."
          endContent={<Button label="Tentar de novo" size="sm" onClick={list.refetch} />}
        />
      ) : rows.length === 0 ? (
        <ChartsEmptyState
          hasFilters={list.hasFilters}
          canCreate={canCreate}
          // "Limpar filtros" precisa devolver a lista completa: limpar só a
          // busca deixaria o usuário preso no vazio quando o recorte veio de
          // um seletor (status, visibilidade, departamento ou dono).
          onClearFilters={() => list.setFilters(DEFAULT_ARTIFACT_FILTERS)}
          onAskAi={() => navigate('/chat')}
          onOpenCatalog={() => navigate('/catalog')}
        />
      ) : (
        <VStack gap={3}>
          <ChartsTable rows={rows} onPrefetch={(id) => prefetch(id, 'draft')} />
          <HStack gap={3} justify="between" vAlign="center" wrap="wrap">
            <Text type="supporting">
              {rows.length === 1 ? '1 gráfico' : `${rows.length} gráficos`} nesta página
            </Text>
            {list.totalPages > 1 ? (
              <Pagination
                page={list.page}
                totalPages={list.totalPages}
                pageSize={CHARTS_PAGE_SIZE}
                size="sm"
                label="Paginação de gráficos"
                onChange={list.setPage}
              />
            ) : null}
          </HStack>
        </VStack>
      )}

      <DeleteChartDialog
        chart={deleting}
        isPending={Boolean(confirmation?.isPending)}
        onCancel={() => confirmation?.onCancel()}
        onConfirm={() => confirmation?.onConfirm()}
      />

      <ShareArtifactDialog
        key={sharing?.id ?? 'none'}
        open={!!sharing}
        onOpenChange={(o) => !o && setSharing(null)}
        targetType="CHART"
        targetId={sharing?.id ?? null}
        targetTitle={sharing?.title}
      />
    </VStack>
  );
}

/**
 * Página "Gráficos" (`/charts`) — lista o que o usuário pode ver, conforme
 * papel e visibilidade (o backend já filtra; o RBAC do cliente só esconde ações).
 *
 * DUAS VISÕES do mesmo conjunto, porque são duas perguntas diferentes:
 *
 *  - GRADE (padrão) — "qual era mesmo aquele gráfico?". Numa biblioteca de
 *    gráficos o item se reconhece pela FORMA, não pelo nome: a célula mostra a
 *    miniatura ao vivo, com os dados reais, e o estado da evidência
 *    (publicado/rascunho), o alcance e o frescor logo abaixo.
 *  - TABELA — "compare todos por status/visibilidade/data". Dado denso se lê
 *    em coluna alinhada; a grade não faz isso e nunca vai fazer.
 *
 * A escolha fica gravada por usuário (`localStorage`): modo de exibição é
 * preferência, e perguntar de novo a cada visita é ruído.
 *
 * Acima da lista, a faixa de resumo responde à pergunta de governança do
 * produto — quanto do acervo já é evidência publicada — e cada célula dela é
 * um atalho para o recorte correspondente.
 *
 * Os quatro estados continuam cobertos nas duas visões: carregando (esqueleto
 * com a geometria da visão ativa), erro (`Banner` com "Tentar de novo"), vazio
 * (`EmptyState` com caminho de criação) e desabilitado (ações sem permissão
 * nem aparecem).
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
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import {
  DEFAULT_ARTIFACT_FILTERS,
  type StatusFilter,
} from '@/shared/lib/artifact-filters';
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
import { useChartsSummary } from '../use-charts-summary';
import { buildChartMenuItems } from '../lib/chart-actions';
import { chartTypeLabel } from '../lib/chart-type-label';
import type { Chart } from '../types';
import { ChartsEmptyState } from './charts-empty-state';
import { ChartsFilters } from './charts-filters';
import { ChartsGrid, ChartsGridSkeleton, type ChartsGridItem } from './charts-grid';
import { ChartsSummary } from './charts-summary';
import { ChartsTable, type ChartRow } from './charts-table';
import { ChartsTableSkeleton } from './charts-table-skeleton';
import { ChartsViewBar, type ChartsView } from './charts-view-bar';
import { DeleteChartDialog } from './delete-chart-dialog';

/** Chave da preferência de exibição (grade x tabela). */
const VIEW_STORAGE_KEY = 'charts:view';

export function ChartsPage() {
  const toast = useAppToast();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const list = useChartsList(currentUserId);
  const summary = useChartsSummary();
  const prefetch = usePrefetchChart();
  const duplicate = useDuplicateChart();
  const remove = useDeleteChart();
  const publish = usePublishChart();

  const [view, setView] = useLocalStorage<ChartsView>(VIEW_STORAGE_KEY, 'grid');
  const [sharing, setSharing] = useState<Chart | null>(null);
  const { deleting, confirmation, openDelete } = useConfirmDelete<Chart>({
    mutation: remove,
    getId: (c) => c.id,
    getTitle: (c) => c.title,
  });

  const canCreate = hasPermission(role, 'artifacts:manage');

  // Uma única derivação alimenta as DUAS visões: o menu de ações, o contexto e
  // o rótulo do tipo são os mesmos — o que muda é só a forma de desenhar.
  const items = useMemo(
    () =>
      list.charts.map((chart) => ({
        chart,
        typeLabel: chartTypeLabel(chart.catalogType),
        context:
          list.departmentName(chart.departmentId) ??
          (chart.ownerId === currentUserId ? 'Meu gráfico' : 'Organização'),
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
      })) satisfies ChartsGridItem[],
    // `list.departmentName` e os mutations são estáveis por render do hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list.charts, list.departmentName, role, currentUserId],
  );

  const rows: ChartRow[] = useMemo(
    () =>
      items.map(({ chart, context, actions }) => ({
        id: chart.id,
        chart,
        title: chart.title,
        catalogType: chart.catalogType,
        isPublished: chart.status === 'PUBLISHED',
        visibility: chart.visibility,
        context,
        updatedAt: chart.updatedAt,
        actions,
      })),
    [items],
  );

  const handleFilterStatus = (status: StatusFilter) =>
    list.setFilters({ ...list.filters, status });

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

      <ChartsSummary
        total={summary.total}
        published={summary.published}
        drafts={summary.drafts}
        isLoading={summary.isLoading}
        isError={summary.isError}
        activeStatus={list.filters.status}
        onFilterStatus={handleFilterStatus}
      />

      <ChartsFilters
        filters={list.filters}
        onChange={list.setFilters}
        departments={list.departments}
        hasFilters={list.hasFilters}
      />

      {list.isLoading ? (
        view === 'grid' ? (
          <ChartsGridSkeleton />
        ) : (
          <ChartsTableSkeleton />
        )
      ) : list.isError ? (
        <Banner
          status="error"
          title="Não foi possível carregar os gráficos"
          description="Pode ser uma instabilidade momentânea de rede ou do servidor."
          endContent={<Button label="Tentar de novo" size="sm" onClick={list.refetch} />}
        />
      ) : items.length === 0 ? (
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
          <ChartsViewBar count={items.length} view={view} onViewChange={setView} />

          {view === 'grid' ? (
            <ChartsGrid items={items} onPrefetch={(id) => prefetch(id, 'draft')} />
          ) : (
            <ChartsTable rows={rows} onPrefetch={(id) => prefetch(id, 'draft')} />
          )}

          {list.totalPages > 1 ? (
            <HStack justify="end">
              <Pagination
                page={list.page}
                totalPages={list.totalPages}
                pageSize={CHARTS_PAGE_SIZE}
                size="sm"
                label="Paginação de gráficos"
                onChange={list.setPage}
              />
            </HStack>
          ) : null}
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

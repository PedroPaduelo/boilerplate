/**
 * Tela de DETALHE/EDIÇÃO de um gráfico — `/charts/:id`.
 *
 * É a MESMA tela do playground do catálogo (`BlockPlayground`), porém:
 *   - semeada com o gráfico salvo (catalogType + draftProps + título + query);
 *   - com os DADOS REAIS da execução da query (`POST /charts/:id/data`) em vez
 *     de fixtures;
 *   - com barra de ações (Salvar / Publicar) — a edição vai para o draft.
 *
 * O `BlockPlayground` reporta o estado editável por `onChange`; "Salvar" envia
 * `title`/`draftProps`/`draftDataBinding(query)` no PATCH.
 */
import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Unplug } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { hasPermission, type Role } from '@/shared/lib/rbac';
import { useAuthStore } from '@/features/auth/store';
import { getCatalogEntryByType } from '@/features/catalog/lib/catalog-entries';
import { BlockPlayground } from '@/features/catalog/components/playground';
import type { PlaygroundSnapshot } from '@/features/catalog/components/playground';
import { useChart, useChartData, usePublishChart, useUpdateChart } from '../hooks';
import { ChartDetailToolbar } from './chart-detail-toolbar';

export function ChartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = useAuthStore((s) => s.user?.role) as Role | undefined;
  const currentUserId = useAuthStore((s) => s.user?.id);

  const chartQuery = useChart(id, 'draft');
  const dataQuery = useChartData(id, 'draft');
  const chart = chartQuery.data;

  const update = useUpdateChart();
  const publish = usePublishChart();

  const [snapshot, setSnapshot] = useState<PlaygroundSnapshot | null>(null);
  const handleChange = useCallback((s: PlaygroundSnapshot) => setSnapshot(s), []);

  const entry = useMemo(
    () => (chart ? getCatalogEntryByType(chart.catalogType) : undefined),
    [chart],
  );

  const seed = useMemo(
    () =>
      chart
        ? {
            props: chart.draftProps,
            title: chart.title,
            query:
              typeof chart.draftDataBinding?.query === 'string'
                ? chart.draftDataBinding.query
                : '',
          }
        : undefined,
    [chart],
  );

  const refetchData = dataQuery.refetch;
  const live = useMemo(
    () => ({
      result: dataQuery.data,
      isFetching: dataQuery.isFetching,
      onRun: () => {
        void refetchData();
      },
    }),
    [dataQuery.data, dataQuery.isFetching, refetchData],
  );

  const isOwnerOrAdmin = !!chart && (role === 'ADMIN' || chart.ownerId === currentUserId);
  const canEdit = isOwnerOrAdmin && hasPermission(role, 'artifacts:manage');
  const canPublish = isOwnerOrAdmin && hasPermission(role, 'artifacts:publish');

  const saveBlockedReason = !snapshot
    ? 'Nada para salvar ainda.'
    : snapshot.title.trim().length === 0
      ? 'Informe um título para salvar.'
      : undefined;

  const handleSave = () => {
    if (!chart || !snapshot || saveBlockedReason) return;
    const query = snapshot.query.trim();
    update.mutate({
      id: chart.id,
      input: {
        title: snapshot.title.trim(),
        draftProps: snapshot.props,
        draftDataBinding: {
          ...chart.draftDataBinding,
          ...(query ? { query } : {}),
        },
      },
    });
  };

  if (chartQuery.isLoading && !chart) {
    return (
      <VStack gap={4} aria-busy="true" aria-label="Carregando gráfico">
        <Skeleton height={40} radius={2} />
        <Skeleton height={420} radius={3} index={1} />
      </VStack>
    );
  }

  if (chartQuery.isError || !chart) {
    return (
      <Banner
        status="error"
        title="Não foi possível carregar este gráfico"
        description="Ele pode não existir ou estar inacessível para o seu perfil."
        endContent={
          <Button
            label="Tentar de novo"
            size="sm"
            isLoading={chartQuery.isFetching}
            onClick={() => void chartQuery.refetch()}
          />
        }
      />
    );
  }

  return (
    <VStack gap={4}>
      <ChartDetailToolbar
        title={chart.title}
        status={chart.status}
        canEdit={canEdit}
        canPublish={canPublish}
        isSaving={update.isPending}
        isPublishing={publish.isPending}
        isFetchingData={dataQuery.isFetching}
        saveBlockedReason={canEdit ? saveBlockedReason : undefined}
        onSave={handleSave}
        onPublish={() => publish.mutate({ id: chart.id, publish: true })}
        onRefreshData={() => void dataQuery.refetch()}
      />

      {entry ? (
        <BlockPlayground
          key={chart.id}
          entry={entry}
          variant="page"
          seed={seed}
          live={live}
          onChange={handleChange}
        />
      ) : (
        <EmptyState
          icon={<Icon icon={Unplug} size="lg" />}
          title="Tipo de bloco indisponível"
          description={`O tipo “${chart.catalogType}” não está registrado no render-engine atual, então não dá para editar este gráfico aqui.`}
          actions={<Button label="Ver catálogo" href="/catalog" variant="primary" />}
        />
      )}
    </VStack>
  );
}

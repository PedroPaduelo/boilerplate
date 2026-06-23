/**
 * Tela de DETALHE/EDIÇÃO de um gráfico — `/charts/:id`.
 *
 * É a MESMA tela do playground do catálogo (`BlockPlayground`), porém:
 *   - semeada com os dados do gráfico salvo (catalogType + draftProps + título
 *     + query);
 *   - com os DADOS REAIS vindos da execução da query (`POST /charts/:id/data`),
 *     em vez de fixtures;
 *   - com toolbar de ações (Salvar / Publicar) — a edição é persistida no draft.
 *
 * Carrega o chart (`GET /charts/:id`, modo draft) + o resultado da query
 * (`useChartData`). O `BlockPlayground` reporta o estado editável via `onChange`;
 * "Salvar" envia `title`/`draftProps`/`draftDataBinding(query)` no PATCH.
 */
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Save, Send } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth/store';
import { hasPermission, type Role } from '@/shared/lib/rbac';
import { getCatalogEntryByType } from '@/features/catalog/lib/catalog-entries';
import {
  BlockPlayground,
  type PlaygroundSnapshot,
} from '@/features/catalog/components/block-playground';

import { useChart, useChartData, usePublishChart, useUpdateChart } from '../hooks';

export function ChartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role) as Role | undefined;
  const currentUserId = useAuthStore((s) => s.user?.id);

  const chartQuery = useChart(id, 'draft');
  const chart = chartQuery.data;
  const dataQuery = useChartData(id, 'draft');

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

  const isOwnerOrAdmin =
    !!chart && (role === 'ADMIN' || chart.ownerId === currentUserId);
  const canEdit = isOwnerOrAdmin && hasPermission(role, 'artifacts:manage');
  const canPublish = isOwnerOrAdmin && hasPermission(role, 'artifacts:publish');

  const handleSave = () => {
    if (!chart || !snapshot) return;
    const query = snapshot.query.trim();
    const draftDataBinding = {
      ...chart.draftDataBinding,
      ...(query ? { query } : {}),
    };
    update.mutate({
      id: chart.id,
      input: {
        title: snapshot.title.trim() || chart.title,
        draftProps: snapshot.props,
        draftDataBinding,
      },
    });
  };

  // ----- estados de carregamento/erro -----
  if (chartQuery.isLoading && !chart) {
    return <ChartDetailSkeleton onBack={() => navigate('/charts')} />;
  }

  if (chartQuery.isError || !chart) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton onClick={() => navigate('/charts')} />
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive"
        >
          Não foi possível carregar este gráfico. Ele pode não existir ou estar
          inacessível para o seu perfil.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton onClick={() => navigate('/charts')} />
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {chart.title}
            </h1>
            <Badge variant={chart.status === 'PUBLISHED' ? 'default' : 'secondary'}>
              {chart.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void dataQuery.refetch()}
            disabled={dataQuery.isFetching}
            aria-label="Recarregar dados da query"
          >
            <RefreshCw className={dataQuery.isFetching ? 'animate-spin' : undefined} />
            Atualizar dados
          </Button>
          {canEdit ? (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={update.isPending || !snapshot}
            >
              <Save className={update.isPending ? 'animate-pulse' : undefined} />
              Salvar
            </Button>
          ) : null}
          {canPublish ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => publish.mutate({ id: chart.id, publish: true })}
              disabled={publish.isPending}
            >
              <Send />
              {chart.status === 'PUBLISHED' ? 'Republicar' : 'Publicar'}
            </Button>
          ) : null}
        </div>
      </div>

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
        <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          O tipo de bloco <code className="mx-1">{chart.catalogType}</code> não está
          disponível no render-engine atual.
        </div>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} aria-label="Voltar para a lista">
      <ArrowLeft />
      Gráficos
    </Button>
  );
}

function ChartDetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <BackButton onClick={onBack} />
        <Skeleton className="h-9 w-40" />
      </div>
      <Skeleton className="h-[calc(100dvh-11rem)] w-full rounded-xl" />
    </div>
  );
}

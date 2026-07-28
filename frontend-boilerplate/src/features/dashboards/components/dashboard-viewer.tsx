/**
 * Tela de VISUALIZAÇÃO do dashboard — `/dashboards/:id/view` (doc 40).
 *
 * É o "modo de consumo": somente leitura, com as abas navegáveis na lateral.
 * Separada da edição (`/edit`) e também da tela de detalhe atual
 * (`/dashboards/:id`), que segue existindo e intocada — esta rota é ADITIVA,
 * então nenhum link, teste ou fluxo existente muda de comportamento.
 *
 * Este componente é só o PORTÃO (carrega, resolve os três estados: carregando,
 * erro e conteúdo). A composição fica em `DashboardViewerContent`, no mesmo
 * arranjo que `DashboardView`/`DashboardViewContent` já usam — inclusive a
 * decisão de modo: uma única query (`mode=draft`, sempre válida) e a escolha
 * draft/published feita LOCALMENTE a partir do `status` que vem junto, sem
 * probe extra.
 */
import { useParams, useSearchParams } from 'react-router-dom';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import type { ApiMode } from '@/shared/lib/query-keys';
import { useDashboard } from '../hooks';
import { pickEffectiveLayout } from '../lib/dashboard-filters';
import { DashboardBreadcrumbs } from './dashboard-breadcrumbs';
import { DashboardViewerContent } from './viewer/dashboard-viewer-content';

export function DashboardViewer() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const modeParam = searchParams.get('mode');
  const override: ApiMode | null =
    modeParam === 'draft' || modeParam === 'published' ? modeParam : null;

  const detailQuery = useDashboard(id, 'draft');
  const detail = detailQuery.data;

  if (detailQuery.isLoading && !detail) return <DashboardViewerSkeleton />;

  if (detailQuery.isError || !detail) {
    return (
      <VStack gap={4}>
        <DashboardBreadcrumbs current="Visualização" />
        <Banner
          status="error"
          title="Não foi possível carregar este dashboard"
          description="Ele pode não existir, estar inacessível para o seu perfil, ou ainda não ter uma versão neste modo."
          endContent={
            <Button label="Tentar de novo" onClick={() => void detailQuery.refetch()} />
          }
        />
      </VStack>
    );
  }

  const wantsPublished =
    override === 'published' || (override == null && detail.status === 'PUBLISHED');
  const { mode, layout } = pickEffectiveLayout(
    detail,
    wantsPublished ? 'published' : 'draft',
  );

  // `key` no ID (e NUNCA no modo): remontar na troca de modo refaria o
  // join/leave da sala do socket e reinicializaria os filtros — regressão já
  // conhecida na tela de detalhe (ver `dashboard-view.tsx`).
  return (
    <DashboardViewerContent key={detail.id} detail={detail} layout={layout} mode={mode} />
  );
}

/** Esqueleto com a silhueta da tela: cabeçalho, barra lateral de abas e grid. */
function DashboardViewerSkeleton() {
  return (
    <VStack gap={4} aria-busy="true" aria-label="Carregando dashboard">
      <Skeleton width={280} height={32} />
      <Skeleton height={56} />
      <HStack gap={4}>
        <Skeleton width={220} height={240} index={1} />
        <Skeleton height={240} index={2} />
      </HStack>
    </VStack>
  );
}

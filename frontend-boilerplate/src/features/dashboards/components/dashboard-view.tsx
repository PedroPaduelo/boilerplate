/**
 * Tela de DASHBOARD em modo VIEW — `/dashboards/:id`.
 *
 * Carrega o LAYOUT (`GET /dashboards/:id?mode=draft`) e decide LOCALMENTE o modo
 * efetivo a partir do `status` que vem junto:
 *  - `?mode=draft|published` força explicitamente;
 *  - sem override: `published` quando o dashboard está publicado (o que um
 *    consumidor espera ver), senão `draft` (preview do dono/editor).
 *
 * Uma única query (sempre `mode=draft`, sempre válida) — sem probe extra. E a
 * `key` do conteúdo é o ID, NUNCA o modo: remontar na troca de modo refazia o
 * join/leave da sala do socket e reinicializava os filtros (regressão conhecida).
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
import { DashboardViewContent } from './dashboard-view-content';

export function DashboardView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const modeParam = searchParams.get('mode');
  const override: ApiMode | null =
    modeParam === 'draft' || modeParam === 'published' ? modeParam : null;

  const detailQuery = useDashboard(id, 'draft');
  const detail = detailQuery.data;

  if (detailQuery.isLoading && !detail) return <DashboardViewSkeleton />;

  if (detailQuery.isError || !detail) {
    return (
      <VStack gap={4}>
        <DashboardBreadcrumbs />
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

  return (
    <DashboardViewContent key={detail.id} detail={detail} layout={layout} mode={mode} />
  );
}

/** Esqueleto com a silhueta da tela: cabeçalho, barra de filtros e grid. */
function DashboardViewSkeleton() {
  return (
    <VStack gap={4} aria-busy="true" aria-label="Carregando dashboard">
      <Skeleton width={280} height={32} />
      <Skeleton height={56} />
      <HStack gap={3}>
        <Skeleton height={128} index={1} />
        <Skeleton height={128} index={2} />
      </HStack>
      <Skeleton height={192} index={3} />
    </VStack>
  );
}

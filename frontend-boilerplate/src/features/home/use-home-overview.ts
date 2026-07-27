/**
 * Dados da Visão geral.
 *
 * Tudo é derivado de listagens que JÁ existem (nada de endpoint de contagem):
 * as listas vêm curtas (5 itens) e o `total` de cada resposta alimenta os
 * números da faixa superior.
 */
import { useMemo } from 'react';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { useCharts } from '@/features/charts/hooks';
import { useConnections } from '@/features/connections/hooks';
import { useDashboards } from '@/features/dashboards/hooks';

/** Situações que o backend reporta como "conexão respondendo". */
const HEALTHY_STATUSES = ['OK', 'ACTIVE', 'CONNECTED'];

export interface RecentArtifact {
  id: string;
  title: string;
  updatedAt: string;
  status: string;
}

export interface HomeOverview {
  recentDashboards: RecentArtifact[];
  recentCharts: RecentArtifact[];
  totalDashboards: number;
  totalCharts: number;
  totalConnections: number;
  healthyConnections: number;
  isLoadingDashboards: boolean;
  isLoadingCharts: boolean;
  isLoadingConnections: boolean;
  isLoadingCounts: boolean;
  /** Conta "nova": ainda não produziu nada → primeiros passos no lugar dos recentes. */
  isFirstRun: boolean;
  /** Falha nas listagens que sustentam a tela. */
  error: string | null;
  /**
   * Falha SÓ na listagem de conexões. Fica de fora do `error` de propósito:
   * conexão é informação secundária aqui e não derruba a tela — mas a faixa
   * precisa saber, senão exibiria "nenhuma cadastrada" (uma afirmação falsa)
   * para quem tem conexões e só não conseguiu consultá-las.
   */
  hasConnectionsError: boolean;
  retry: () => void;
}

function byUpdatedAtDesc(a: RecentArtifact, b: RecentArtifact): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function useHomeOverview(canUseConnections: boolean): HomeOverview {
  const dashboardsQuery = useDashboards({ page: 1, pageSize: 5 });
  const chartsQuery = useCharts({ page: 1, pageSize: 5 });
  const connectionsQuery = useConnections(
    { pageSize: 100 },
    { enabled: canUseConnections },
  );

  const recentDashboards = useMemo(
    () => [...(dashboardsQuery.data?.dashboards ?? [])].sort(byUpdatedAtDesc).slice(0, 5),
    [dashboardsQuery.data],
  );

  const recentCharts = useMemo(
    () => [...(chartsQuery.data?.charts ?? [])].sort(byUpdatedAtDesc).slice(0, 5),
    [chartsQuery.data],
  );

  const connections = connectionsQuery.data?.connections ?? [];
  const totalDashboards = dashboardsQuery.data?.total ?? 0;
  const totalCharts = chartsQuery.data?.total ?? 0;
  const isLoadingCounts = dashboardsQuery.isLoading || chartsQuery.isLoading;

  const failure = dashboardsQuery.error ?? chartsQuery.error ?? null;

  return {
    recentDashboards,
    recentCharts,
    totalDashboards,
    totalCharts,
    totalConnections: connections.length,
    healthyConnections: connections.filter((connection) =>
      HEALTHY_STATUSES.includes((connection.status ?? '').toUpperCase()),
    ).length,
    isLoadingDashboards: dashboardsQuery.isLoading,
    isLoadingCharts: chartsQuery.isLoading,
    isLoadingConnections: connectionsQuery.isLoading,
    isLoadingCounts,
    isFirstRun:
      !isLoadingCounts && !failure && totalDashboards === 0 && totalCharts === 0,
    error: failure
      ? getApiErrorMessage(failure, 'Não foi possível carregar o resumo do ambiente.')
      : null,
    hasConnectionsError: connectionsQuery.isError,
    retry: () => {
      void dashboardsQuery.refetch();
      void chartsQuery.refetch();
      if (canUseConnections) void connectionsQuery.refetch();
    },
  };
}

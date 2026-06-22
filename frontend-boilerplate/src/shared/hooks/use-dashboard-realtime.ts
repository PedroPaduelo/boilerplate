/**
 * Hook de REALTIME do dashboard (socket → cache). Infra da trilha T-E consumida
 * por T-G (tela de dashboard) e pelo preview/chat.
 *
 * O que faz:
 * - Entra na sala `dashboard:{id}` (via `joinDashboard` do `useSocket`) enquanto
 *   montado e sai no cleanup (`leaveDashboard`).
 * - Escuta os eventos `block:queued|running|data|error` (nomes em `SOCKET_EVENTS`
 *   dos contratos) e empurra cada um para o cache do TanStack Query via as
 *   funções puras de `dashboard-cache` — hidratando a UI sem refetch.
 *
 * Uso (T-G):
 *   const filtersHash = hashFilters(activeFilters);
 *   useDashboardRealtime({ dashboardId, mode, filtersHash });
 *   const { data } = useQuery({ queryKey: queryKeys.dashboardData(id, mode, filtersHash), ... });
 *
 * Regras de hooks respeitadas: `getSocket()` só é chamado DENTRO de effects
 * (nunca no render); handlers são removidos no cleanup.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  SOCKET_EVENTS,
  type BlockDataEvent,
  type BlockRunningEvent,
  type BlockQueuedEvent,
  type BlockErrorEvent,
} from '@dashboards/contracts';
import { useSocket } from '@/shared/socket';
import type { ApiMode } from '@/shared/lib/query-keys';
import {
  applyBlockDataEvent,
  errorToResult,
  queuedToResult,
  runningToResult,
  writeBlockResult,
  type DashboardCacheContext,
} from '@/shared/lib/dashboard-cache';

export interface UseDashboardRealtimeOptions {
  /** Dashboard a assinar. Quando `undefined`, o hook fica inerte. */
  dashboardId: string | undefined;
  /** Modo de leitura (define a chave de cache do payload). */
  mode: ApiMode;
  /** Hash dos filtros ativos (`hashFilters`). */
  filtersHash: string;
  /** Liga/desliga a assinatura (default: true). */
  enabled?: boolean;
}

export function useDashboardRealtime({
  dashboardId,
  mode,
  filtersHash,
  enabled = true,
}: UseDashboardRealtimeOptions): void {
  const queryClient = useQueryClient();
  const { connected, getSocket, joinDashboard, leaveDashboard } = useSocket();

  // Entra/sai da sala do dashboard.
  useEffect(() => {
    if (!enabled || !dashboardId) return;
    joinDashboard(dashboardId);
    return () => leaveDashboard(dashboardId);
  }, [enabled, dashboardId, joinDashboard, leaveDashboard]);

  // Mapeia eventos block:* → cache.
  useEffect(() => {
    if (!enabled || !dashboardId || !connected) return;
    const socket = getSocket();
    if (!socket) return;

    const ctx: DashboardCacheContext = { dashboardId, mode, filtersHash };

    const handleData = (ev: BlockDataEvent) => {
      if (ev.dashboardId !== dashboardId) return;
      applyBlockDataEvent(queryClient, ctx, ev);
    };
    const handleRunning = (ev: BlockRunningEvent) => {
      if (ev.dashboardId !== dashboardId) return;
      writeBlockResult(queryClient, ctx, runningToResult(ev));
    };
    const handleQueued = (ev: BlockQueuedEvent) => {
      if (ev.dashboardId !== dashboardId) return;
      writeBlockResult(queryClient, ctx, queuedToResult(ev));
    };
    const handleError = (ev: BlockErrorEvent) => {
      if (ev.dashboardId !== dashboardId) return;
      writeBlockResult(queryClient, ctx, errorToResult(ev));
    };

    socket.on(SOCKET_EVENTS.BLOCK_DATA, handleData);
    socket.on(SOCKET_EVENTS.BLOCK_RUNNING, handleRunning);
    socket.on(SOCKET_EVENTS.BLOCK_QUEUED, handleQueued);
    socket.on(SOCKET_EVENTS.BLOCK_ERROR, handleError);

    return () => {
      socket.off(SOCKET_EVENTS.BLOCK_DATA, handleData);
      socket.off(SOCKET_EVENTS.BLOCK_RUNNING, handleRunning);
      socket.off(SOCKET_EVENTS.BLOCK_QUEUED, handleQueued);
      socket.off(SOCKET_EVENTS.BLOCK_ERROR, handleError);
    };
  }, [enabled, dashboardId, mode, filtersHash, connected, getSocket, queryClient]);
}

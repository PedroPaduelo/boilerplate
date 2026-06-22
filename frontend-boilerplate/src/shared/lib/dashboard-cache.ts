/**
 * socket → cache: funções PURAS que escrevem o resultado de um bloco no cache do
 * TanStack Query. Separadas do hook (`use-dashboard-realtime`) para serem
 * testáveis sem React/socket — a única dependência é um `QueryClient`.
 *
 * Os eventos de socket (`block:data|running|error|queued`) emitidos pelo worker
 * (T-C) chegam por bloco; aqui mapeamos cada um para um `BlockDataResult` e o
 * gravamos em DOIS lugares, de forma que tanto quem lê o bloco isolado quanto
 * quem lê o payload batch do dashboard veja a atualização (doc 32 §3):
 *  1. `queryKeys.blockData(blockId, filtersHash)` → o `BlockDataResult` do bloco.
 *  2. `queryKeys.dashboardData(id, mode, filtersHash)` → o bloco mesclado no
 *     mapa `blocks` do `DashboardDataPayload`.
 */
import type { QueryClient } from '@tanstack/react-query';
import type {
  BlockDataResult,
  DashboardDataPayload,
  BlockDataEvent,
  BlockRunningEvent,
  BlockErrorEvent,
  BlockQueuedEvent,
} from '@dashboards/contracts';
import { queryKeys, type ApiMode } from './query-keys';

/** Contexto de uma assinatura realtime de dashboard. */
export interface DashboardCacheContext {
  dashboardId: string;
  mode: ApiMode;
  filtersHash: string;
}

/** `draft` (UI/API) corresponde a `dev` no payload de dados (doc 20). */
function payloadMode(mode: ApiMode): DashboardDataPayload['mode'] {
  return mode === 'published' ? 'published' : 'dev';
}

/**
 * Grava o `BlockDataResult` de um bloco no cache (bloco isolado + payload batch).
 * Idempotente: chamar duas vezes com o mesmo resultado deixa o cache igual.
 */
export function writeBlockResult(
  queryClient: QueryClient,
  ctx: DashboardCacheContext,
  result: BlockDataResult,
): void {
  const { dashboardId, mode, filtersHash } = ctx;

  // (1) bloco isolado
  queryClient.setQueryData(queryKeys.blockData(result.blockId, filtersHash), result);

  // (2) payload batch do dashboard — mescla o bloco no mapa `blocks`
  queryClient.setQueryData<DashboardDataPayload>(
    queryKeys.dashboardData(dashboardId, mode, filtersHash),
    (prev: DashboardDataPayload | undefined) => {
      const base: DashboardDataPayload = prev ?? {
        dashboardId,
        mode: payloadMode(mode),
        blocks: {},
      };
      return {
        ...base,
        blocks: { ...base.blocks, [result.blockId]: result },
      };
    },
  );
}

/** Converte `block:running` em um `BlockDataResult` (state=running). */
export function runningToResult(ev: BlockRunningEvent): BlockDataResult {
  return { blockId: ev.blockId, state: 'running' };
}

/** Converte `block:queued` em um `BlockDataResult` (state=queued). */
export function queuedToResult(ev: BlockQueuedEvent): BlockDataResult {
  return { blockId: ev.blockId, state: 'queued' };
}

/** Converte `block:error` em um `BlockDataResult` (state=error + erro). */
export function errorToResult(ev: BlockErrorEvent): BlockDataResult {
  return { blockId: ev.blockId, state: 'error', error: ev.error };
}

/** Aplica um evento `block:data` (já é o `BlockDataResult` completo no `result`). */
export function applyBlockDataEvent(
  queryClient: QueryClient,
  ctx: DashboardCacheContext,
  ev: BlockDataEvent,
): void {
  writeBlockResult(queryClient, ctx, ev.result);
}

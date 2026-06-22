/**
 * Handler do job da fila `query-exec` (lógica do WORKER), desacoplado do BullMQ.
 *
 * Recebe a infra por injeção (carregar conexão, runQuery, gravar cache, emitir
 * socket) → testável sem Redis/Postgres/Socket.IO reais. O wrapper BullMQ
 * (`jobs/worker.ts`) só monta as deps reais e chama esta função.
 *
 * Sequência por bloco (doc 31, seção 6/7):
 *   1. emite `block:running` (sinaliza início ao FE);
 *   2. carrega a Connection (decifra a senha) e executa via pg-runner;
 *   3. transforma + valida contra o `dataContract` do shape;
 *   4. em sucesso: grava cache (TTL do bloco, se > 0) e emite `block:data`;
 *   5. em erro (query falhou OU resultado fora do contrato): emite `block:error`.
 */
import {
  SOCKET_EVENTS,
  dashboardRoom,
  type BlockDataResult,
} from '@dashboards/contracts';
import type { PgRunnerConnection, QueryResultShape, RunQueryOptions } from '@/lib/pg-runner';
import { executeBlockData } from './executor';
import type { QueryExecJobData } from './types';

export interface WorkerDeps {
  /** Resolve a conexão (com senha decifrada) por id, ou `null` se não existir mais. */
  loadPgConnection: (connectionId: string) => Promise<PgRunnerConnection | null>;
  runQuery: (
    connection: PgRunnerConnection,
    sql: string,
    options?: RunQueryOptions,
  ) => Promise<QueryResultShape>;
  /** Grava o resultado no cache de dados (TTL em segundos). */
  cacheSetData: (key: string, value: string, ttlSeconds: number) => Promise<void>;
  /** Emite um evento para a sala do dashboard. */
  emit: (room: string, event: string, payload: unknown) => void;
}

/** Resultado da execução do job (também útil para inspeção em testes). */
export interface ProcessJobOutcome {
  result: BlockDataResult;
  cached: boolean;
}

export async function processQueryExecJob(
  job: QueryExecJobData,
  deps: WorkerDeps,
): Promise<ProcessJobOutcome> {
  const room = dashboardRoom(job.dashboardId);

  // 1) sinaliza início
  deps.emit(room, SOCKET_EVENTS.BLOCK_RUNNING, {
    dashboardId: job.dashboardId,
    blockId: job.blockId,
    state: 'running',
  });

  // 2) resolve a conexão (senha decifrada só agora, em memória)
  const connection = await deps.loadPgConnection(job.connectionId);
  if (!connection) {
    const result: BlockDataResult = {
      blockId: job.blockId,
      state: 'error',
      error: { code: 'connection_not_found', message: 'connection no longer exists' },
    };
    emitResult(deps, room, job, result);
    return { result, cached: false };
  }

  // 3) executa + transforma + valida
  const result = await executeBlockData(
    {
      blockId: job.blockId,
      connection,
      sql: job.sql,
      paramsValues: job.paramsValues,
      transform: job.transform,
      shape: job.shape,
      ttlSeconds: job.ttlSeconds,
      cached: false,
    },
    { runQuery: deps.runQuery },
  );

  // 4) sucesso → grava cache (se TTL > 0) e emite block:data
  let cached = false;
  if (result.state === 'success' && job.ttlSeconds > 0) {
    try {
      await deps.cacheSetData(job.cacheKey, JSON.stringify(result), job.ttlSeconds);
      cached = true;
    } catch {
      // cache é best-effort — não falha o job por erro de gravação.
    }
  }

  emitResult(deps, room, job, result);
  return { result, cached };
}

/** Emite `block:data` (sucesso) ou `block:error` (falha) conforme o resultado. */
function emitResult(
  deps: WorkerDeps,
  room: string,
  job: QueryExecJobData,
  result: BlockDataResult,
): void {
  if (result.state === 'error') {
    deps.emit(room, SOCKET_EVENTS.BLOCK_ERROR, {
      dashboardId: job.dashboardId,
      blockId: job.blockId,
      error: result.error ?? { message: 'unknown error' },
    });
    return;
  }
  deps.emit(room, SOCKET_EVENTS.BLOCK_DATA, {
    dashboardId: job.dashboardId,
    blockId: job.blockId,
    result,
  });
}

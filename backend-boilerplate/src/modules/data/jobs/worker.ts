/**
 * Worker BullMQ da fila `query-exec` — wrapper fino sobre `processQueryExecJob`.
 *
 * Monta as deps REAIS (carregar conexão + decifrar senha, pg-runner, cache Redis,
 * Socket.IO) e delega a lógica para o handler testável. Roda NO MESMO PROCESSO da
 * API (mesmo padrão do boilerplate, cujo `startAllWorkers()` é chamado dentro de
 * `start()` em `server.ts`). O módulo `data` inicia este worker via hook
 * `onReady` (ver `index.ts`), então NÃO é preciso editar `server.ts` nem subir um
 * processo separado.
 */
import { Worker, type Job } from 'bullmq';
import { connectionRedisConfigWorker } from '@/services/jobs/connection-redis-config';
import { redisInstance, redisService } from '@/lib/redis';
import { env } from '@/lib/env';
import { runQuery } from '@/lib/pg-runner';
import { socketManager } from '@/socket/manager/socket-manager';
import { loadPgConnection } from '../connection-loader';
import { processQueryExecJob, type WorkerDeps } from '../worker-handler';
import type { QueryExecJobData } from '../types';
import { QUERY_EXEC_QUEUE } from './queue';

let workerInstance: Worker<QueryExecJobData> | null = null;

/** Deps reais do worker (infra do boilerplate). */
const realDeps: WorkerDeps = {
  loadPgConnection,
  runQuery,
  cacheSetData: async (key, value, ttlSeconds) => {
    await redisService.setValue(key, value, ttlSeconds);
  },
  emit: (room, event, payload) => {
    socketManager.sendToRoom(room, event, payload);
  },
};

/**
 * Garante que o worker `query-exec` está rodando (idempotente). No-op quando o
 * Redis está em modo degradado (sem fila). Seguro chamar mais de uma vez.
 */
export function ensureQueryExecWorker(): Worker<QueryExecJobData> | null {
  if (redisInstance.isDegraded()) return null;
  if (workerInstance) return workerInstance;

  // INVARIANTE: nunca processar mais jobs em paralelo do que há conexões no pool
  // do pg-runner. Cada job segura 1 conexão por toda a query; se a concorrência
  // exceder PG_RUNNER_POOL_MAX, os jobs excedentes estouram o connectionTimeout
  // ("timeout exceeded when trying to connect"). O clamp protege contra
  // mau-config (concorrência > pool) por construção.
  const concurrency = Math.max(
    1,
    Math.min(env.QUERY_EXEC_WORKER_CONCURRENCY, env.PG_RUNNER_POOL_MAX),
  );

  workerInstance = new Worker<QueryExecJobData>(
    QUERY_EXEC_QUEUE,
    async (job: Job<QueryExecJobData>) => {
      const outcome = await processQueryExecJob(job.data, realDeps);
      return { state: outcome.result.state, cached: outcome.cached };
    },
    {
      connection: connectionRedisConfigWorker,
      concurrency,
    },
  );

  workerInstance.on('failed', (job, err) => {
    console.error(`❌ query-exec job ${job?.id} failed:`, err.message);
  });
  workerInstance.on('error', (err) => {
    console.error('❌ query-exec worker error:', err.message);
  });
  console.log(
    `🚀 query-exec worker started (data module) — concurrency=${concurrency}, poolMax=${env.PG_RUNNER_POOL_MAX}`,
  );

  return workerInstance;
}

/** Fecha o worker (shutdown/testes). */
export async function closeQueryExecWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
  }
}

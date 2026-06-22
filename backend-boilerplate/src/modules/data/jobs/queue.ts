/**
 * Fila BullMQ `query-exec` (coração da execução assíncrona do modo published).
 *
 * Reusa a infra de fila do boilerplate (mesma `connectionRedisConfigQueue`
 * usada por `services/jobs`), mas a fila é PRÓPRIA do módulo `data` (arquivo
 * próprio, sem editar o registro central de filas) — segue a regra anti-colisão
 * do doc 21. O ANTI-STAMPEDE é garantido por `jobId = cacheKey`: BullMQ deduplica
 * jobs com o mesmo id, então 2 misses do mesmo bloco/params NÃO criam 2 jobs.
 *
 * Observabilidade: o Bull Board do boilerplate é configurado em `server.ts`
 * (arquivo FECHADO na Fase 0). Esta fila não é adicionada lá para não tocar o
 * boot compartilhado — ver nota no README do módulo. A fila é totalmente
 * funcional (enfileira e processa); só não aparece na UI `/queues`.
 */
import { Queue } from 'bullmq';
import { connectionRedisConfigQueue } from '@/services/jobs/connection-redis-config';
import { redisInstance } from '@/lib/redis';
import type { QueryExecJobData } from '../types';

export const QUERY_EXEC_QUEUE = 'query-exec';
export const QUERY_EXEC_JOB_NAME = 'execute-block';

let queueInstance: Queue<QueryExecJobData> | null = null;

/** Singleton da fila `query-exec` (ou `null` se o Redis está em modo degradado). */
export function getQueryExecQueue(): Queue<QueryExecJobData> | null {
  if (redisInstance.isDegraded()) return null;
  if (!queueInstance) {
    queueInstance = new Queue<QueryExecJobData>(QUERY_EXEC_QUEUE, {
      connection: connectionRedisConfigQueue,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 1000 },
        // remove ao completar: libera o jobId p/ recomputo após o TTL expirar
        // (senão um job concluído com o mesmo id bloquearia o próximo miss).
        removeOnComplete: true,
        removeOnFail: { count: 100 },
      },
    });
  }
  return queueInstance;
}

/**
 * Enfileira a execução de um bloco. `jobId = cacheKey` → ANTI-STAMPEDE: chamadas
 * concorrentes com a mesma chave não duplicam o job. Retorna `true` se foi (ou já
 * estava) enfileirado, `false` se a fila está indisponível (Redis degradado).
 */
export async function addQueryExecJob(data: QueryExecJobData): Promise<boolean> {
  const queue = getQueryExecQueue();
  if (!queue) return false;
  await queue.add(QUERY_EXEC_JOB_NAME, data, { jobId: data.cacheKey });
  return true;
}

/** Fecha a fila (shutdown/testes). */
export async function closeQueryExecQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
  }
}

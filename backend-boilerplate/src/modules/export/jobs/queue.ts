/**
 * Fila BullMQ `export-pdf` (T-J) — geração assíncrona de PDF para dashboards
 * pesados. Fila PRÓPRIA do módulo (arquivo próprio, sem editar o registro
 * central de filas), mesmo padrão do módulo `data` (T-C / doc 21).
 *
 * Reusa `connectionRedisConfigQueue` do boilerplate. O `jobId` é o id do export
 * (único por requisição) — sem dedup por conteúdo (cada pedido gera um PDF).
 */
import { Queue } from 'bullmq';
import { connectionRedisConfigQueue } from '@/services/jobs/connection-redis-config';
import { redisInstance } from '@/lib/redis';
import type { ExportJobData } from '../types';

export const EXPORT_PDF_QUEUE = 'export-pdf';
export const EXPORT_PDF_JOB_NAME = 'render-pdf';

let queueInstance: Queue<ExportJobData> | null = null;

/** Singleton da fila `export-pdf` (ou `null` se o Redis está degradado). */
export function getExportQueue(): Queue<ExportJobData> | null {
  if (redisInstance.isDegraded()) return null;
  if (!queueInstance) {
    queueInstance = new Queue<ExportJobData>(EXPORT_PDF_QUEUE, {
      connection: connectionRedisConfigQueue,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: { count: 100 },
      },
    });
  }
  return queueInstance;
}

/**
 * Enfileira a geração de um PDF. Retorna `true` se enfileirou, `false` se a fila
 * está indisponível (Redis degradado) — nesse caso a rota cai no modo sync.
 */
export async function addExportJob(data: ExportJobData): Promise<boolean> {
  const queue = getExportQueue();
  if (!queue) return false;
  await queue.add(EXPORT_PDF_JOB_NAME, data, { jobId: data.jobId });
  return true;
}

/** Fecha a fila (shutdown/testes). */
export async function closeExportQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
  }
}

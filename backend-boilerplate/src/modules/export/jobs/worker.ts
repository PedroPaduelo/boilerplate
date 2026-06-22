/**
 * Worker BullMQ da fila `export-pdf` (T-J) — wrapper fino sobre `runExportJob`.
 *
 * Roda NO MESMO PROCESSO da API (padrão do boilerplate). Iniciado via hook
 * `onReady` no `index.ts` do módulo (depois do Redis inicializar em
 * `server.ts`), sem editar `server.ts` nem subir processo separado. No-op quando
 * o Redis está degradado (sem fila) ou em testes sem Redis.
 */
import { Worker, type Job } from 'bullmq';
import { connectionRedisConfigWorker } from '@/services/jobs/connection-redis-config';
import { redisInstance } from '@/lib/redis';
import { runExportJob } from '../service';
import type { ExportJobData } from '../types';
import { EXPORT_PDF_QUEUE } from './queue';

let workerInstance: Worker<ExportJobData> | null = null;

/** Garante que o worker `export-pdf` está rodando (idempotente). */
export function ensureExportWorker(): Worker<ExportJobData> | null {
  if (redisInstance.isDegraded()) return null;
  if (workerInstance) return workerInstance;

  workerInstance = new Worker<ExportJobData>(
    EXPORT_PDF_QUEUE,
    async (job: Job<ExportJobData>) => {
      const outcome = await runExportJob(job.data);
      return { bytes: outcome.bytes };
    },
    {
      connection: connectionRedisConfigWorker,
      // PDF é pesado (Chromium): concorrência baixa para não estourar memória.
      concurrency: 2,
    },
  );

  workerInstance.on('failed', (job, err) => {
    console.error(`❌ export-pdf job ${job?.id} failed:`, err.message);
  });
  workerInstance.on('error', (err) => {
    console.error('❌ export-pdf worker error:', err.message);
  });
  console.log('🚀 export-pdf worker started (export module)');

  return workerInstance;
}

/** Fecha o worker (shutdown/testes). */
export async function closeExportWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
  }
}

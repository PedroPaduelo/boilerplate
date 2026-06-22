import type { FastifyPluginAsync } from 'fastify';
import { auth } from '@/middlewares/auth';
import { redisInstance } from '@/lib/redis';
import { exportRoutes } from './routes/export-routes';
import { ensureExportWorker } from './jobs/worker';

/**
 * Módulo `export` — TRILHA T-J (Export PDF server-side headless).
 *
 * Plugin auto-descoberto (ver `src/http/modules-loader.ts` e
 * `src/modules/README.md`). Superfície (doc 10 / doc 31):
 *
 *   POST /export/dashboards/:id/pdf   gera PDF (fila/sync)   artifacts:export
 *   GET  /export/jobs/:jobId          status do job          artifacts:export
 *   GET  /export/jobs/:jobId/pdf      download do PDF        artifacts:export
 *
 * Pipeline: a rota assina um TOKEN DE SERVIÇO curto, o serviço headless
 * (Playwright/Chromium) abre a rota `/print/dashboards/:id` do FE autenticada por
 * esse token, espera a hidratação (`[data-print-ready="true"]`) e gera o PDF com
 * cabeçalho/rodapé (título + marca + data + paginação). Quando pesado, roda como
 * job na fila `export-pdf` (BullMQ) e entrega via download + notificação socket.
 *
 * WORKER: roda no MESMO processo da API, iniciado via hook `onReady` (padrão do
 * módulo `data`/T-C) — SEM tocar `server.ts`. No-op sem Redis (modo degradado).
 */
const exportModule: FastifyPluginAsync = async (app) => {
  await app.register(auth);

  await exportRoutes(app);

  app.addHook('onReady', async () => {
    if (redisInstance.isInitialized() && !redisInstance.isDegraded()) {
      ensureExportWorker();
    }
  });
};

export default exportModule;

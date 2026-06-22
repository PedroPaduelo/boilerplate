import type { FastifyPluginAsync } from 'fastify';
import { auth } from '@/middlewares/auth';
import { redisInstance } from '@/lib/redis';
import { dashboardDataRoute } from './routes/dashboard-data';
import { ensureQueryExecWorker } from './jobs/worker';

/**
 * Módulo `data` — TRILHA T-C (coração do render).
 *
 * Plugin auto-descoberto por `@fastify/autoload` (ver `src/http/modules-loader.ts`
 * e `src/modules/README.md`). Superfície (doc 31):
 *
 *   POST /dashboards/:id/data    hidratação batch     artifacts:view
 *
 * Cache de DADOS (Redis, 2 níveis), fila `query-exec` (BullMQ, anti-stampede via
 * jobId=cacheKey) e emissão por Socket.IO (`block:queued|running|data|error`) na
 * sala `dashboard:{id}`. Ver READMEs do módulo (`README.md`).
 *
 * WORKER: roda no MESMO processo da API (padrão do boilerplate). É iniciado aqui
 * via hook `onReady` (depois que o Redis foi inicializado em `server.ts`), então
 * NÃO é preciso editar `server.ts` nem subir um processo separado. No-op quando o
 * Redis está em modo degradado ou ausente (ex.: testes sem Redis).
 */
const dataModule: FastifyPluginAsync = async (app) => {
  await app.register(auth);

  await dashboardDataRoute(app);

  // Sobe o worker da fila quando o app fica pronto e o Redis está disponível.
  app.addHook('onReady', async () => {
    if (redisInstance.isInitialized() && !redisInstance.isDegraded()) {
      ensureQueryExecWorker();
    }
  });
};

export default dataModule;

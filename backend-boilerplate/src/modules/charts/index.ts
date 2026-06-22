import type { FastifyPluginAsync } from 'fastify';
import { auth } from '@/middlewares/auth';
import { createChartRoute } from './routes/create-chart';
import { deleteChartRoute } from './routes/delete-chart';
import { getChartRoute } from './routes/get-chart';
import { listChartsRoute } from './routes/list-charts';
import { publishChartRoute } from './routes/publish-chart';
import { unpublishChartRoute } from './routes/unpublish-chart';
import { updateChartRoute } from './routes/update-chart';

/**
 * Módulo `charts` — TRILHA T-B (task T-B2).
 *
 * Plugin auto-descoberto por `@fastify/autoload` (ver `src/http/modules-loader.ts`
 * e `src/modules/README.md`). Gráfico é entidade de 1ª classe, reusável, com
 * modelo draft/published SEM histórico (docs/plano/08 e 30):
 *
 *   POST   /charts                cria (draft)            artifacts:manage
 *   GET    /charts                lista (RBAC/visib.)     artifacts:view
 *   GET    /charts/:id            detalha                 artifacts:view
 *   PATCH  /charts/:id            edita draft             artifacts:manage + owner
 *   DELETE /charts/:id            remove                  artifacts:manage + owner
 *   POST   /charts/:id/publish    draft→published         artifacts:publish + owner
 *   POST   /charts/:id/unpublish  zera published          artifacts:publish + owner
 *
 * `auth` (JWT) é registrado uma vez no escopo do módulo; o gate por permissão é
 * aplicado por rota via `requirePermission(...)` (`@/middlewares/rbac`) e o
 * ownership/visibilidade via os helpers COMPARTILHADOS da T-B1 (`@/lib/rbac` +
 * `@/lib/visibility`) — este módulo NÃO reimplementa RBAC.
 */
const chartsModule: FastifyPluginAsync = async (app) => {
  await app.register(auth);

  await createChartRoute(app);
  await listChartsRoute(app);
  await getChartRoute(app);
  await updateChartRoute(app);
  await deleteChartRoute(app);
  await publishChartRoute(app);
  await unpublishChartRoute(app);
};

export default chartsModule;

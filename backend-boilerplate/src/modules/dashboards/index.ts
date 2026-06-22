import type { FastifyPluginAsync } from 'fastify';
import { auth } from '@/middlewares/auth';
import { addChartToDashboardRoute } from './routes/add-chart-to-dashboard';
import { createDashboardRoute } from './routes/create-dashboard';
import { deleteDashboardRoute } from './routes/delete-dashboard';
import { getDashboardRoute } from './routes/get-dashboard';
import { listDashboardsRoute } from './routes/list-dashboards';
import { publishDashboardRoute } from './routes/publish-dashboard';
import { unpublishDashboardRoute } from './routes/unpublish-dashboard';
import { updateDashboardRoute } from './routes/update-dashboard';

/**
 * Módulo `dashboards` — TRILHA T-B (task T-B3).
 *
 * Plugin auto-descoberto por `@fastify/autoload` (ver `src/http/modules-loader.ts`
 * e `src/modules/README.md`). Dashboard tem LAYOUT (`{ filters, rows }`, doc 20)
 * no modelo draft/published SEM histórico (doc 08):
 *
 *   POST   /dashboards                cria (draft)              artifacts:manage
 *   GET    /dashboards                lista (RBAC/visib.)       artifacts:view
 *   GET    /dashboards/:id            detalha (?mode=draft|published)  artifacts:view
 *   PATCH  /dashboards/:id            edita draft               artifacts:manage + owner
 *   DELETE /dashboards/:id            remove                    artifacts:manage + owner
 *   POST   /dashboards/:id/blocks     add_chart_to_dashboard    artifacts:manage + owner
 *   POST   /dashboards/:id/publish    draft→published (+invalida cache)  artifacts:publish + owner
 *   POST   /dashboards/:id/unpublish  zera published (+invalida cache)   artifacts:publish + owner
 *
 * O LAYOUT é validado contra o CONTRATO COMPARTILHADO (`@dashboards/contracts`,
 * doc 20). RBAC/ownership/visibilidade usam os helpers COMPARTILHADOS da T-B1
 * (`@/middlewares/rbac` + `@/lib/rbac` + `@/lib/visibility`) — sem reimplementar.
 * OBS: `POST /dashboards/:id/data` (hidratação) é do módulo `data` (T-C), NÃO aqui.
 */
const dashboardsModule: FastifyPluginAsync = async (app) => {
  await app.register(auth);

  await createDashboardRoute(app);
  await listDashboardsRoute(app);
  await getDashboardRoute(app);
  await updateDashboardRoute(app);
  await deleteDashboardRoute(app);
  await addChartToDashboardRoute(app);
  await publishDashboardRoute(app);
  await unpublishDashboardRoute(app);
};

export default dashboardsModule;

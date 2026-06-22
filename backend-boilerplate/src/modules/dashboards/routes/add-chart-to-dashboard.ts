import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import {
  addChartBodySchema,
  dashboardResponseSchema,
  idParamSchema,
  serializeDashboard,
} from '../schema';
import { addChartToDashboard, requireDashboardForModify } from '../service';

export async function addChartToDashboardRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/dashboards/:id/blocks',
    {
      preHandler: requirePermission('artifacts:manage'),
      schema: {
        tags: ['Dashboards'],
        summary: 'add_chart_to_dashboard: insere um bloco referenciando um chartId no draftLayout',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: addChartBodySchema,
        response: { 200: dashboardResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const existing = await requireDashboardForModify(request.params.id, ctx);
      const dashboard = await addChartToDashboard(ctx, existing, request.body);
      return reply.send(serializeDashboard(dashboard));
    },
  );
}

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import { dashboardResponseSchema, idParamSchema, serializeDashboard } from '../schema';
import { requireDashboardForModify, unpublishDashboard } from '../service';

export async function unpublishDashboardRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/dashboards/:id/unpublish',
    {
      preHandler: requirePermission('artifacts:publish'),
      schema: {
        tags: ['Dashboards'],
        summary: 'Despublica um dashboard (zera publishedLayout; invalida cache)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: dashboardResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const existing = await requireDashboardForModify(request.params.id, ctx);
      const dashboard = await unpublishDashboard(existing.id);
      return reply.send(serializeDashboard(dashboard));
    },
  );
}

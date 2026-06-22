import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import { dashboardResponseSchema, idParamSchema, serializeDashboard } from '../schema';
import { publishDashboard, requireDashboardForModify } from '../service';

export async function publishDashboardRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/dashboards/:id/publish',
    {
      preHandler: requirePermission('artifacts:publish'),
      schema: {
        tags: ['Dashboards'],
        summary: 'Publica um dashboard (draft→published; invalida cache dash:{id}:published)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: dashboardResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const existing = await requireDashboardForModify(request.params.id, ctx);
      const dashboard = await publishDashboard(existing);
      return reply.send(serializeDashboard(dashboard));
    },
  );
}

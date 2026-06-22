import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import {
  dashboardResponseSchema,
  idParamSchema,
  serializeDashboard,
  updateDashboardBodySchema,
} from '../schema';
import { requireDashboardForModify, updateDashboard } from '../service';

export async function updateDashboardRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().patch(
    '/dashboards/:id',
    {
      preHandler: requirePermission('artifacts:manage'),
      schema: {
        tags: ['Dashboards'],
        summary: 'Atualiza o draft de um dashboard (não afeta o publicado)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateDashboardBodySchema,
        response: { 200: dashboardResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const existing = await requireDashboardForModify(request.params.id, ctx);
      const dashboard = await updateDashboard(ctx, existing, request.body);
      return reply.send(serializeDashboard(dashboard));
    },
  );
}

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import { idParamSchema } from '../schema';
import { deleteDashboard, requireDashboardForModify } from '../service';

export async function deleteDashboardRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    '/dashboards/:id',
    {
      preHandler: requirePermission('artifacts:manage'),
      schema: {
        tags: ['Dashboards'],
        summary: 'Remove um dashboard',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: z.object({ id: z.string(), deleted: z.boolean() }) },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const dashboard = await requireDashboardForModify(request.params.id, ctx);
      await deleteDashboard(dashboard.id);
      return reply.send({ id: dashboard.id, deleted: true });
    },
  );
}

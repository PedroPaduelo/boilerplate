import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import {
  dashboardDetailResponseSchema,
  getDashboardQuerySchema,
  idParamSchema,
  serializeDashboard,
} from '../schema';
import { requireDashboardForView, resolveLayout } from '../service';

export async function getDashboardRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/dashboards/:id',
    {
      preHandler: requirePermission('artifacts:view'),
      schema: {
        tags: ['Dashboards'],
        summary: 'Detalha um dashboard; ?mode=draft|published resolve o layout do modo',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        querystring: getDashboardQuerySchema,
        response: { 200: dashboardDetailResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const dashboard = await requireDashboardForView(request.params.id, ctx);
      const { mode, layout } = resolveLayout(dashboard, request.query.mode ?? 'draft');
      return reply.send({ ...serializeDashboard(dashboard), mode, layout });
    },
  );
}

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import { createDashboardBodySchema, dashboardResponseSchema, serializeDashboard } from '../schema';
import { createDashboard } from '../service';

export async function createDashboardRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/dashboards',
    {
      preHandler: requirePermission('artifacts:manage'),
      schema: {
        tags: ['Dashboards'],
        summary: 'Cria um dashboard (draft); valida o layout contra o contrato (doc 20)',
        security: [{ bearerAuth: [] }],
        body: createDashboardBodySchema,
        response: { 201: dashboardResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const dashboard = await createDashboard(ctx, request.body);
      return reply.status(201).send(serializeDashboard(dashboard));
    },
  );
}

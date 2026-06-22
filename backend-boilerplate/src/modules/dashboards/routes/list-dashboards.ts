import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { buildVisibilityWhere } from '@/lib/visibility';
import { requirePermission } from '@/middlewares/rbac';
import {
  listDashboardsQuerySchema,
  listDashboardsResponseSchema,
  serializeDashboard,
} from '../schema';
import { listDashboards } from '../service';

export async function listDashboardsRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/dashboards',
    {
      preHandler: requirePermission('artifacts:view'),
      schema: {
        tags: ['Dashboards'],
        summary: 'Lista dashboards visíveis ao usuário (RBAC/visibilidade)',
        security: [{ bearerAuth: [] }],
        querystring: listDashboardsQuerySchema,
        response: { 200: listDashboardsResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const { page, pageSize, search, status, visibility } = request.query;

      const filters: Record<string, unknown> = {};
      if (status) filters.status = status;
      if (visibility) filters.visibility = visibility;
      if (search) {
        filters.title = { contains: search, mode: 'insensitive' };
      }

      const where = { AND: [buildVisibilityWhere(ctx), filters] };
      const { dashboards, total } = await listDashboards({ where, page, pageSize });

      return reply.send({
        dashboards: dashboards.map(serializeDashboard),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    },
  );
}

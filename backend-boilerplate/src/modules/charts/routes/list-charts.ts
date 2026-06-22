import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { buildVisibilityWhere } from '@/lib/visibility';
import { requirePermission } from '@/middlewares/rbac';
import {
  listChartsQuerySchema,
  listChartsResponseSchema,
  serializeChart,
} from '../schema';
import { listCharts } from '../service';

export async function listChartsRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/charts',
    {
      preHandler: requirePermission('artifacts:view'),
      schema: {
        tags: ['Charts'],
        summary: 'Lista gráficos visíveis ao usuário (RBAC/visibilidade)',
        security: [{ bearerAuth: [] }],
        querystring: listChartsQuerySchema,
        response: { 200: listChartsResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const { page, pageSize, search, catalogType, status, visibility } = request.query;

      const filters: Record<string, unknown> = {};
      if (catalogType) filters.catalogType = catalogType;
      if (status) filters.status = status;
      if (visibility) filters.visibility = visibility;
      if (search) {
        filters.title = { contains: search, mode: 'insensitive' };
      }

      const where = { AND: [buildVisibilityWhere(ctx), filters] };
      const { charts, total } = await listCharts({ where, page, pageSize });

      return reply.send({
        charts: charts.map(serializeChart),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    },
  );
}

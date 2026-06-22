import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import { chartResponseSchema, idParamSchema, serializeChart } from '../schema';
import { requireChartForModify, unpublishChart } from '../service';

export async function unpublishChartRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/charts/:id/unpublish',
    {
      preHandler: requirePermission('artifacts:publish'),
      schema: {
        tags: ['Charts'],
        summary: 'Despublica um gráfico (zera published*; status=DRAFT)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: chartResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const existing = await requireChartForModify(request.params.id, ctx);
      const chart = await unpublishChart(existing.id);
      return reply.send(serializeChart(chart));
    },
  );
}

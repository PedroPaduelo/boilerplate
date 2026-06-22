import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import { chartResponseSchema, idParamSchema, serializeChart } from '../schema';
import { requireChartForView } from '../service';

export async function getChartRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/charts/:id',
    {
      preHandler: requirePermission('artifacts:view'),
      schema: {
        tags: ['Charts'],
        summary: 'Detalha um gráfico (draft + published)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: chartResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const chart = await requireChartForView(request.params.id, ctx);
      return reply.send(serializeChart(chart));
    },
  );
}

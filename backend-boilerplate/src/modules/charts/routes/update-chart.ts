import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import {
  chartResponseSchema,
  idParamSchema,
  serializeChart,
  updateChartBodySchema,
} from '../schema';
import { requireChartForModify, updateChart } from '../service';

export async function updateChartRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().patch(
    '/charts/:id',
    {
      preHandler: requirePermission('artifacts:manage'),
      schema: {
        tags: ['Charts'],
        summary: 'Atualiza o draft de um gráfico (não afeta o publicado)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateChartBodySchema,
        response: { 200: chartResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const existing = await requireChartForModify(request.params.id, ctx);
      const chart = await updateChart(ctx, existing, request.body);
      return reply.send(serializeChart(chart));
    },
  );
}

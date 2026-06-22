import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import { idParamSchema } from '../schema';
import { deleteChart, requireChartForModify } from '../service';

export async function deleteChartRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    '/charts/:id',
    {
      preHandler: requirePermission('artifacts:manage'),
      schema: {
        tags: ['Charts'],
        summary: 'Remove um gráfico',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: z.object({ id: z.string(), deleted: z.boolean() }) },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const chart = await requireChartForModify(request.params.id, ctx);
      await deleteChart(chart.id);
      return reply.send({ id: chart.id, deleted: true });
    },
  );
}

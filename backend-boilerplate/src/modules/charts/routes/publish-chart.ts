import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import { chartResponseSchema, idParamSchema, serializeChart } from '../schema';
import { publishChart, requireChartForModify } from '../service';

export async function publishChartRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/charts/:id/publish',
    {
      preHandler: requirePermission('artifacts:publish'),
      schema: {
        tags: ['Charts'],
        summary: 'Publica um gráfico (copia draft→published; status=PUBLISHED)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: chartResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const existing = await requireChartForModify(request.params.id, ctx);
      const chart = await publishChart(existing);
      return reply.send(serializeChart(chart));
    },
  );
}

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import { chartResponseSchema, createChartBodySchema, serializeChart } from '../schema';
import { createChart } from '../service';

export async function createChartRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/charts',
    {
      preHandler: requirePermission('artifacts:manage'),
      schema: {
        tags: ['Charts'],
        summary: 'Cria um gráfico (draft)',
        security: [{ bearerAuth: [] }],
        body: createChartBodySchema,
        response: { 201: chartResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const chart = await createChart(ctx, request.body);
      return reply.status(201).send(serializeChart(chart));
    },
  );
}

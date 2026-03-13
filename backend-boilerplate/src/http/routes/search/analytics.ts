import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { type AggregationResult } from '@/lib/search/query-service';
import { searchQueryService } from '@/lib/search/query-service';

export async function analytics(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/search/analytics',
    {
      schema: {
        tags: ['Search'],
        summary: 'Get aggregations/analytics from indexed documents',
        response: {
          200: z.object({
            types: z.array(z.object({ key: z.string(), count: z.number() })),
            statuses: z.array(z.object({ key: z.string(), count: z.number() })),
            tags: z.array(z.object({ key: z.string(), count: z.number() })),
            categories: z.array(z.object({ key: z.string(), count: z.number() })),
            authors: z.array(z.object({ key: z.string(), count: z.number() })),
            dateHistogram: z.array(z.object({ date: z.string(), count: z.number() })),
          }),
        },
      },
    },
    async (request, reply) => {
      const aggregations = await searchQueryService.aggregate();
      return reply.send(aggregations);
    }
  );
}

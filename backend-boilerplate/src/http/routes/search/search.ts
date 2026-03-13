import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { searchQuerySchema, type SearchResult } from '@/lib/search/query-service';
import { searchQueryService } from '@/lib/search/query-service';

export async function search(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/search',
    {
      schema: {
        tags: ['Search'],
        summary: 'Full-text search with fuzzy matching and filters',
        params: z.object({}),
        querystring: searchQuerySchema,
        response: {
          200: z.object({
            results: z.object({
              hits: z.array(z.any()),
              total: z.number(),
              page: z.number(),
              size: z.number(),
              took: z.number(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const params = searchQuerySchema.parse(request.query);
      const results = await searchQueryService.search(params);
      return reply.send({ results });
    }
  );
}

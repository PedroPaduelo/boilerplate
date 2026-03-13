import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { geoSearchSchema, type GeoSearchResult } from '@/lib/search/query-service';
import { searchQueryService } from '@/lib/search/query-service';

export async function geoSearch(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/search/geo',
    {
      schema: {
        tags: ['Search'],
        summary: 'Geo-spatial search with optional text query',
        params: z.object({}),
        querystring: geoSearchSchema,
        response: {
          200: z.object({
            results: z.object({
              hits: z.array(z.any()),
              total: z.number(),
              took: z.number(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const params = geoSearchSchema.parse(request.query);
      const results = await searchQueryService.geoSearch(params);
      return reply.send({ results });
    }
  );
}

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { autocompleteSchema, type AutocompleteResult } from '@/lib/search/query-service';
import { searchQueryService } from '@/lib/search/query-service';

export async function autocomplete(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/search/autocomplete',
    {
      schema: {
        tags: ['Search'],
        summary: 'Autocomplete suggestions',
        params: z.object({}),
        querystring: autocompleteSchema,
        response: {
          200: z.object({
            suggestions: z.array(z.object({
              text: z.string(),
              score: z.number(),
            })),
          }),
        },
      },
    },
    async (request, reply) => {
      const params = autocompleteSchema.parse(request.query);
      const results = await searchQueryService.autocomplete(params);
      return reply.send(results);
    }
  );
}

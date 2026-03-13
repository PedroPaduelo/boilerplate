import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { auth } from '@/middlewares/auth';
import { searchIndexingService } from '@/lib/search/indexing-service';
import { documentIndexSchema } from '@/lib/search/config';

export async function indexDocument(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/search/index',
    {
      preHandler: [auth],
      schema: {
        tags: ['Search'],
        summary: 'Index a single document',
        body: documentIndexSchema,
        response: {
          201: z.object({
            success: z.boolean(),
            id: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const document = request.body;
      await searchIndexingService.indexDocument(document);
      return reply.status(201).send({ success: true, id: document.id });
    }
  );
}

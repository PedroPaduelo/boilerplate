import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { auth } from '@/middlewares/auth';
import { searchIndexingService } from '@/lib/search/indexing-service';
import { documentIndexSchema } from '@/lib/search/config';

export async function bulkIndex(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/search/bulk',
    {
      preHandler: [auth],
      schema: {
        tags: ['Search'],
        summary: 'Bulk index multiple documents',
        body: z.object({
          documents: z.array(documentIndexSchema),
        }),
        response: {
          201: z.object({
            success: z.boolean(),
            indexed: z.number(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { documents } = request.body;
      await searchIndexingService.bulkIndex(documents);
      return reply.status(201).send({ success: true, indexed: documents.length });
    }
  );
}

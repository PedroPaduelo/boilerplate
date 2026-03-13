import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { auth } from '@/middlewares/auth';
import { searchIndexingService } from '@/lib/search/indexing-service';

export async function adminIndex(app: FastifyInstance) {
  app.post(
    '/search/reindex',
    {
      preHandler: [auth],
      schema: {
        tags: ['Search'],
        summary: 'Recreate search index',
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      await searchIndexingService.reindex();
      return reply.send({ success: true, message: 'Index recreated' });
    }
  );

  app.post(
    '/search/ensure-index',
    {
      preHandler: [auth],
      schema: {
        tags: ['Search'],
        summary: 'Ensure search index exists',
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      await searchIndexingService.ensureIndex();
      return reply.send({ success: true, message: 'Index is ready' });
    }
  );
}

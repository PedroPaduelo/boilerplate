import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { auth } from '@/middlewares/auth';
import { searchIndexingService } from '@/lib/search/indexing-service';

export async function deleteDocument(app: FastifyInstance) {
  app.delete(
    '/search/:id',
    {
      preHandler: [auth],
      schema: {
        tags: ['Search'],
        summary: 'Delete a document from index',
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            deleted: z.number(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await searchIndexingService.deleteDocument(id);
      return reply.send({ success: true, deleted: 1 });
    }
  );
}

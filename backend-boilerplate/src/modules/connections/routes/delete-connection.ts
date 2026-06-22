import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { loadUserContext, requireConnectionForManage } from '../rbac';
import { idParamSchema } from '../schema';
import { deleteConnection } from '../service';

export async function deleteConnectionRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    '/connections/:id',
    {
      schema: {
        tags: ['Connections'],
        summary: 'Remove uma conexão',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: z.object({ id: z.string(), deleted: z.boolean() }) },
      },
    },
    async (request, reply) => {
      const ctx = await loadUserContext(request);
      const existing = await requireConnectionForManage(request.params.id, ctx);
      await deleteConnection(existing.id);
      return reply.send({ id: existing.id, deleted: true });
    }
  );
}

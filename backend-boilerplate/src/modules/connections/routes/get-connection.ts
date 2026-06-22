import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadUserContext, requireConnectionForUse } from '../rbac';
import { connectionResponseSchema, idParamSchema, serializeConnection } from '../schema';

export async function getConnectionRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/connections/:id',
    {
      schema: {
        tags: ['Connections'],
        summary: 'Detalha uma conexão (sem senha)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: connectionResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadUserContext(request);
      const conn = await requireConnectionForUse(request.params.id, ctx);
      return reply.send(serializeConnection(conn));
    }
  );
}

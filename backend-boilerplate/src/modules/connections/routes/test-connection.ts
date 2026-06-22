import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadUserContext, requireConnectionForUse } from '../rbac';
import { idParamSchema, testResultSchema } from '../schema';
import { testConnection } from '../service';

export async function testConnectionRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/connections/:id/test',
    {
      schema: {
        tags: ['Connections'],
        summary: 'Testa conectividade e atualiza status/lastTestedAt',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: testResultSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadUserContext(request);
      const conn = await requireConnectionForUse(request.params.id, ctx);
      const result = await testConnection(conn);
      return reply.send(result);
    }
  );
}

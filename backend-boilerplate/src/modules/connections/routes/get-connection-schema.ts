import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { BadRequestError } from '@/http/routes/_errors';
import { PgRunnerError, SqlGuardError } from '@/lib/pg-runner';
import { loadUserContext, requireConnectionForUse } from '../rbac';
import { idParamSchema, schemaQuerySchema, schemaResponseSchema } from '../schema';
import { introspectSchema } from '../service';

export async function getConnectionSchemaRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/connections/:id/schema',
    {
      schema: {
        tags: ['Connections'],
        summary: 'Introspecção de tabelas/colunas (cache Redis conn:{id}:schema)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        querystring: schemaQuerySchema,
        response: { 200: schemaResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadUserContext(request);
      const conn = await requireConnectionForUse(request.params.id, ctx);
      try {
        const payload = await introspectSchema(conn, { refresh: request.query.refresh });
        return reply.send(payload);
      } catch (err) {
        if (err instanceof SqlGuardError || err instanceof PgRunnerError) {
          throw new BadRequestError(err.message);
        }
        throw err;
      }
    }
  );
}

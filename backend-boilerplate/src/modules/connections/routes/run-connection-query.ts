import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { BadRequestError } from '@/http/routes/_errors';
import { PgRunnerError, SqlGuardError } from '@/lib/pg-runner';
import { loadUserContext, requireConnectionForUse } from '../rbac';
import { idParamSchema, queryResultSchema, runQueryBodySchema } from '../schema';
import { runConnectionQuery } from '../service';

export async function runConnectionQueryRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/connections/:id/query',
    {
      schema: {
        tags: ['Connections'],
        summary: 'Executa SELECT read-only (guardrails: só SELECT, timeout, row cap)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: runQueryBodySchema,
        response: { 200: queryResultSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadUserContext(request);
      const conn = await requireConnectionForUse(request.params.id, ctx);
      const { sql, params, maxRows } = request.body;
      try {
        const result = await runConnectionQuery(conn, sql, params, maxRows);
        return reply.send(result);
      } catch (err) {
        // Guardrail violado ou falha de execução → 400 (não vaza segredo).
        if (err instanceof SqlGuardError || err instanceof PgRunnerError) {
          throw new BadRequestError(err.message);
        }
        throw err;
      }
    }
  );
}

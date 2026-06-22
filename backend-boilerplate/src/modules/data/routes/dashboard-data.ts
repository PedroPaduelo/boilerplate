/**
 * `POST /dashboards/:id/data` — hidratação batch dos blocos de um dashboard (T-C).
 *
 * Autenticado (`artifacts:view`). Body: `{ mode, filters }`.
 *  - `mode=draft`     → executa cada bloco AGORA (sem cache); resposta já traz os dados.
 *  - `mode=published` → cache HIT retorna na hora; MISS enfileira (anti-stampede) e
 *    devolve `state: queued`; o resultado chega depois via Socket.IO (`block:data`).
 *
 * SEGURANÇA: a resposta carrega APENAS o RESULTADO já no shape do bloco — NUNCA o
 * `dataBinding` cru (SQL/connectionId). A visibilidade de cada chart/connection
 * referenciado é revalidada na resolução (block-resolver).
 */
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import {
  dashboardDataBodySchema,
  dashboardDataResponseSchema,
  idParamSchema,
} from '../schema';
import { buildDashboardData } from '../service';

export async function dashboardDataRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/dashboards/:id/data',
    {
      preHandler: requirePermission('artifacts:view'),
      schema: {
        tags: ['Data'],
        summary: 'Hidrata os blocos de um dashboard (batch): cache + fila + socket',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: dashboardDataBodySchema,
        response: { 200: dashboardDataResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const { mode, filters } = request.body;
      const payload = await buildDashboardData(request.params.id, mode, filters, ctx);
      return reply.send(payload);
    },
  );
}

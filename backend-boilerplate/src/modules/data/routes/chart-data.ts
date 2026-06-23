/**
 * `POST /charts/:id/data` — hidratação de UM gráfico isolado (T-C / tela de
 * detalhe do chart).
 *
 * Autenticado (`artifacts:view`). Body: `{ mode }` (draft|published). Executa o
 * `dataBinding` do chart AGORA (inline, sem cache/fila) e devolve um
 * `BlockDataResult` já no shape do `dataContract` — é a versão REST do
 * `preview_chart_data` (MCP), usada pelo playground em `/charts/:id`.
 *
 * SEGURANÇA: a resposta carrega APENAS o RESULTADO já no shape — NUNCA o
 * `dataBinding` cru (SQL/connectionId). A visibilidade do chart e da conexão
 * referenciada é revalidada no service (`buildChartData`).
 */
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import {
  blockDataResultSchema,
  dashboardDataBodySchema,
  idParamSchema,
} from '../schema';
import { buildChartData } from '../service';

export async function chartDataRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/charts/:id/data',
    {
      preHandler: requirePermission('artifacts:view'),
      schema: {
        tags: ['Data'],
        summary: 'Executa o dataBinding de um gráfico e devolve o resultado no shape',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: dashboardDataBodySchema,
        response: { 200: blockDataResultSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const { mode } = request.body;
      const result = await buildChartData(request.params.id, mode, ctx);
      return reply.send(result);
    },
  );
}

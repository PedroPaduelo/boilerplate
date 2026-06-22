import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { publicDashboardDataResponseSchema, tokenParamSchema } from '../schema';
import { openShareLinkData } from '../service';

const errorResponseSchema = z.object({ message: z.string() });

/**
 * Rota PÚBLICA `GET /public/:token/data` — T-G1 bugfix do share público.
 *
 * Retorna o SNAPSHOT materializado de dados do dashboard publicado, no mesmo
 * shape do batch autenticado `POST /dashboards/:id/data` (modo `published`).
 * A página `/public/:token` usa este endpoint para renderizar blocos de dados
 * (KPI/gráfico/tabela) sem precisar de JWT nem executar query.
 *
 * Mesma validação de TTL/revogação do `GET /public/:token`. Erros:
 *   - 403 → revogado
 *   - 410 → expirado
 *   - 404 → token inexistente OU alvo não publicado
 *   - 400 → token aponta para um CHART (não tem dados no sentido de batch)
 *
 * SEGURANÇA: a resposta carrega APENAS o resultado já no shape do bloco —
 * NUNCA `dataBinding` cru (SQL/connectionId). Satisfaz a nota de segurança
 * do reviewer de T-B4. Se o snapshot ainda não foi materializado (publish
 * pré-bugfix), `blocks` vem `{}` (a UI mostra skeleton nos blocos de dados).
 */
export async function publicGetDataRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/public/:token/data',
    {
      schema: {
        tags: ['Share'],
        summary: 'Snapshot público de dados do dashboard (sem auth; T-G1)',
        params: tokenParamSchema,
        response: {
          200: publicDashboardDataResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          410: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await openShareLinkData(request.params.token);

      if (!result.ok) {
        switch (result.reason) {
          case 'revoked':
            return reply.status(403).send({ message: 'This share link has been revoked' });
          case 'expired':
            return reply.status(410).send({ message: 'This share link has expired' });
          case 'wrong_type':
            return reply.status(400).send({
              message: 'This share link does not point to a dashboard',
            });
          default:
            // not_found | not_published → 404 (não distingue, p/ não vazar)
            return reply.status(404).send({ message: 'Share link not found' });
        }
      }

      return reply.send(result.data);
    },
  );
}

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { publicArtifactResponseSchema, tokenParamSchema } from '../schema';
import { openShareLink } from '../service';

const errorResponseSchema = z.object({ message: z.string() });

/**
 * Rota PÚBLICA `GET /public/:token` — registrada num escopo SEM o middleware
 * de autenticação (ver `../index.ts`). Não exige token JWT: o único guard é a
 * validade do token de compartilhamento (existe? revogado? expirado?).
 *
 * Mapeamento de status:
 *   - token inexistente → 404
 *   - revogado          → 403
 *   - expirado          → 410 (Gone)
 *   - alvo não publicado/removido → 404
 *   - válido            → 200 + artefato em modo PUBLISHED (e SOMENTE ele)
 */
export async function publicGetRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/public/:token',
    {
      schema: {
        tags: ['Share'],
        summary: 'Abre um link público (sem auth); inicia o TTL na 1ª abertura',
        params: tokenParamSchema,
        response: {
          200: publicArtifactResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          410: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await openShareLink(request.params.token);

      if (!result.ok) {
        switch (result.reason) {
          case 'revoked':
            return reply.status(403).send({ message: 'This share link has been revoked' });
          case 'expired':
            return reply.status(410).send({ message: 'This share link has expired' });
          default:
            // not_found | not_published → 404 (não distingue, p/ não vazar)
            return reply.status(404).send({ message: 'Share link not found' });
        }
      }

      return reply.send(result.artifact);
    },
  );
}

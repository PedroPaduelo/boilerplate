import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { listCatalogTypes, CATALOG_VERSION } from '@/lib/catalog';
import { requirePermission } from '@/middlewares/rbac';
import { NotFoundError } from '@/http/routes/_errors';
import { getCatalogParamsSchema, getCatalogResponseSchema } from '../schema';
import { getCatalogBlock } from '../service';

/**
 * `GET /catalog/:type` — o manifesto de UM tipo de bloco, com `propsSchema` e
 * `dataContract` completos.
 *
 * É a rota que se consulta no meio de uma correção ("qual é mesmo o enum de
 * `orientation`?"), quando carregar o catálogo inteiro seria desperdício.
 */
export async function getCatalogBlockRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/catalog/:type',
    {
      preHandler: requirePermission('artifacts:view'),
      schema: {
        tags: ['Catalog'],
        summary: 'Detalha um tipo de bloco do catálogo',
        security: [{ bearerAuth: [] }],
        params: getCatalogParamsSchema,
        response: { 200: getCatalogResponseSchema },
      },
    },
    async (request, reply) => {
      const { type } = request.params;
      const block = getCatalogBlock(type);
      if (!block) {
        // A mensagem carrega o vocabulário aceito: quem errou o tipo consegue
        // se corrigir sem uma segunda chamada.
        throw new NotFoundError(
          `catalogType "${type}" não existe. Tipos disponíveis: ${listCatalogTypes()
            .slice(0, 12)
            .join(', ')}… (GET /catalog para a lista completa)`,
        );
      }
      return reply.send({ catalogVersion: CATALOG_VERSION, block });
    },
  );
}

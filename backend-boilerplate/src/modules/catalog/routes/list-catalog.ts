import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requirePermission } from '@/middlewares/rbac';
import { listCatalogQuerySchema, listCatalogResponseSchema } from '../schema';
import { listCatalog } from '../service';

/**
 * `GET /catalog` — os manifestos do catálogo VIVO.
 *
 * Serve o MESMO artefato que o MCP entrega ao agente (`list_catalog`), pela via
 * HTTP: é o que permite comparar, sem adivinhação, o que a galeria mostra e o
 * que a IA enxerga. Enquanto essa rota não existia, os dois lados podiam
 * divergir silenciosamente — o front lê o registry do próprio bundle, o agente
 * lê o JSON gerado no build.
 *
 * Exige `artifacts:view`: o catálogo descreve a superfície de construção de
 * artefatos, então acompanha a permissão de vê-los.
 */
export async function listCatalogRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/catalog',
    {
      preHandler: requirePermission('artifacts:view'),
      schema: {
        tags: ['Catalog'],
        summary: 'Lista os tipos de bloco disponíveis (catálogo vivo)',
        description:
          'Filtre por `kind`, `shape` (formato do dado exigido) ou `search`. ' +
          'Use `includeSchemas=false` para a versão leve, sem os JSON Schemas.',
        security: [{ bearerAuth: [] }],
        querystring: listCatalogQuerySchema,
        response: { 200: listCatalogResponseSchema },
      },
    },
    async (request, reply) => reply.send(listCatalog(request.query)),
  );
}

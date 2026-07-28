import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requirePermission } from '@/middlewares/rbac';
import { validateCatalogBodySchema, validateCatalogResponseSchema } from '../schema';
import { validateCatalogBlock } from '../service';

/**
 * `POST /catalog/validate` — ensaio a seco de um bloco antes de gravá-lo.
 *
 * Responde "isso vai renderizar?" sem criar nada: o tipo existe, as props
 * conformam ao `propsSchema` e o dado conforma ao `shape` do `dataContract`.
 *
 * A rota devolve **200 mesmo quando inválido**, com `valid: false` e a lista de
 * problemas. Isso é deliberado: aqui a resposta é o RESULTADO de uma análise
 * pedida, não a rejeição de uma requisição malformada. Quem chama (a IA, o
 * editor de dashboards, um teste) quer ler os problemas e reescrever o spec —
 * um 4xx transformaria o retorno útil em exceção a ser tratada.
 */
export async function validateCatalogBlockRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/catalog/validate',
    {
      preHandler: requirePermission('artifacts:view'),
      schema: {
        tags: ['Catalog'],
        summary: 'Valida um bloco candidato (tipo + props + dado) sem salvar',
        description:
          'Retorna 200 sempre; use `valid` e `issues[]` para corrigir. Cada issue traz ' +
          '`scope` (catalogType | props | data), `path`, `message` e `hint`.',
        security: [{ bearerAuth: [] }],
        body: validateCatalogBodySchema,
        response: { 200: validateCatalogResponseSchema },
      },
    },
    async (request, reply) => reply.send(validateCatalogBlock(request.body)),
  );
}

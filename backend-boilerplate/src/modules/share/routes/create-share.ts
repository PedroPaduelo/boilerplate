import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import { createShareBodySchema, serializeShareLink, shareLinkResponseSchema } from '../schema';
import { createShareLink } from '../service';

export async function createShareRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/share',
    {
      preHandler: requirePermission('share:create'),
      schema: {
        tags: ['Share'],
        summary: 'Cria um link de compartilhamento (TTL conta da 1ª abertura)',
        security: [{ bearerAuth: [] }],
        body: createShareBodySchema,
        response: { 201: shareLinkResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const link = await createShareLink(ctx, request.body);
      return reply.status(201).send(serializeShareLink(link));
    },
  );
}

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { loadActorContext } from '@/lib/rbac';
import { requireAuth } from '@/middlewares/rbac';
import { idParamSchema } from '../schema';
import { revokeShareLink } from '../service';

export async function deleteShareRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    '/share/:id',
    {
      // Qualquer usuário autenticado pode tentar; a checagem de dono/admin é no
      // service (revokeShareLink) → 403 se não for o criador nem ADMIN.
      preHandler: requireAuth,
      schema: {
        tags: ['Share'],
        summary: 'Revoga um link de compartilhamento (só dono/admin)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: z.object({ id: z.string(), revoked: z.boolean() }) },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const link = await revokeShareLink(ctx, request.params.id);
      return reply.send({ id: link.id, revoked: true });
    },
  );
}

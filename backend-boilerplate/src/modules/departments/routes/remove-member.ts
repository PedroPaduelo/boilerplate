import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { requirePermission } from '@/middlewares/rbac';
import { memberParamSchema } from '../schema';
import { removeMember } from '../service';

export async function removeMemberRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    '/departments/:id/members/:userId',
    {
      preHandler: requirePermission('departments:manage'),
      schema: {
        tags: ['Departments'],
        summary: 'Remove um usuário do departamento (ADMIN)',
        security: [{ bearerAuth: [] }],
        params: memberParamSchema,
        response: { 200: z.object({ departmentId: z.string(), userId: z.string(), removed: z.boolean() }) },
      },
    },
    async (request, reply) => {
      const { id, userId } = request.params;
      await removeMember(id, userId);
      return reply.send({ departmentId: id, userId, removed: true });
    }
  );
}

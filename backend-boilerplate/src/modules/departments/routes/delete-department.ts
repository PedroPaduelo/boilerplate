import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { requirePermission } from '@/middlewares/rbac';
import { idParamSchema } from '../schema';
import { deleteDepartment } from '../service';

export async function deleteDepartmentRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    '/departments/:id',
    {
      preHandler: requirePermission('departments:manage'),
      schema: {
        tags: ['Departments'],
        summary: 'Remove um departamento (ADMIN) — cascata nas memberships',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: z.object({ id: z.string(), deleted: z.boolean() }) },
      },
    },
    async (request, reply) => {
      await deleteDepartment(request.params.id);
      return reply.send({ id: request.params.id, deleted: true });
    }
  );
}

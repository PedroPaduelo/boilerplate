import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requirePermission } from '@/middlewares/rbac';
import {
  departmentResponseSchema,
  idParamSchema,
  serializeDepartment,
  updateDepartmentBodySchema,
} from '../schema';
import { updateDepartment } from '../service';

export async function updateDepartmentRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().patch(
    '/departments/:id',
    {
      preHandler: requirePermission('departments:manage'),
      schema: {
        tags: ['Departments'],
        summary: 'Atualiza um departamento (ADMIN)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateDepartmentBodySchema,
        response: { 200: departmentResponseSchema },
      },
    },
    async (request, reply) => {
      const dep = await updateDepartment(request.params.id, request.body);
      return reply.send(serializeDepartment(dep));
    }
  );
}

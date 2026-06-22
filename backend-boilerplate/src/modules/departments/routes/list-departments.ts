import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requireAuth } from '@/middlewares/rbac';
import {
  listDepartmentsQuerySchema,
  listDepartmentsResponseSchema,
  serializeDepartment,
} from '../schema';
import { listDepartments } from '../service';

export async function listDepartmentsRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/departments',
    {
      preHandler: requireAuth,
      schema: {
        tags: ['Departments'],
        summary: 'Lista departamentos (qualquer usuário autenticado)',
        security: [{ bearerAuth: [] }],
        querystring: listDepartmentsQuerySchema,
        response: { 200: listDepartmentsResponseSchema },
      },
    },
    async (request, reply) => {
      const { page, pageSize, search } = request.query;
      const { departments, total } = await listDepartments({ page, pageSize, search });
      return reply.send({
        departments: departments.map(serializeDepartment),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    }
  );
}

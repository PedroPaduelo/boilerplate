import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requirePermission } from '@/middlewares/rbac';
import {
  createDepartmentBodySchema,
  departmentResponseSchema,
  serializeDepartment,
} from '../schema';
import { createDepartment } from '../service';

export async function createDepartmentRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/departments',
    {
      preHandler: requirePermission('departments:manage'),
      schema: {
        tags: ['Departments'],
        summary: 'Cria um departamento (ADMIN)',
        security: [{ bearerAuth: [] }],
        body: createDepartmentBodySchema,
        response: { 201: departmentResponseSchema },
      },
    },
    async (request, reply) => {
      const dep = await createDepartment(request.body);
      return reply.status(201).send(serializeDepartment(dep));
    }
  );
}

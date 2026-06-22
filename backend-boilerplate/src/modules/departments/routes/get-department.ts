import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requireAuth } from '@/middlewares/rbac';
import {
  departmentDetailResponseSchema,
  idParamSchema,
  serializeDepartment,
  serializeMember,
} from '../schema';
import { getDepartmentDetail } from '../service';

export async function getDepartmentRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/departments/:id',
    {
      preHandler: requireAuth,
      schema: {
        tags: ['Departments'],
        summary: 'Detalha um departamento (com membros)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: departmentDetailResponseSchema },
      },
    },
    async (request, reply) => {
      const dep = await getDepartmentDetail(request.params.id);
      return reply.send({
        ...serializeDepartment(dep),
        members: dep.memberships.map(serializeMember),
      });
    }
  );
}

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requirePermission } from '@/middlewares/rbac';
import { addMemberBodySchema, idParamSchema, memberResponseSchema, serializeMember } from '../schema';
import { addMember } from '../service';

export async function addMemberRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/departments/:id/members',
    {
      preHandler: requirePermission('departments:manage'),
      schema: {
        tags: ['Departments'],
        summary: 'Adiciona um usuário ao departamento (ADMIN)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: addMemberBodySchema,
        response: { 201: memberResponseSchema },
      },
    },
    async (request, reply) => {
      const membership = await addMember(request.params.id, request.body.userId);
      return reply.status(201).send(serializeMember(membership));
    }
  );
}

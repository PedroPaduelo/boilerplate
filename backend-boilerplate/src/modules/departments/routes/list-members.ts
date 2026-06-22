import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requireAuth } from '@/middlewares/rbac';
import { idParamSchema, listMembersResponseSchema, serializeMember } from '../schema';
import { listMembers } from '../service';

export async function listMembersRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/departments/:id/members',
    {
      preHandler: requireAuth,
      schema: {
        tags: ['Departments'],
        summary: 'Lista membros de um departamento',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: { 200: listMembersResponseSchema },
      },
    },
    async (request, reply) => {
      const members = await listMembers(request.params.id);
      return reply.send({ members: members.map(serializeMember) });
    }
  );
}

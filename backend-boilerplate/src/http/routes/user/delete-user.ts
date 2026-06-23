import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { auth } from '@/middlewares/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/http/routes/_errors';

export async function deleteUser(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/users/:id',
      {
        schema: {
          tags: ['Users'],
          summary: 'Delete user by ID',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        await request.requireRole('ADMIN');

        const { id } = request.params;

        const existingUser = await prisma.user.findUnique({
          where: { id },
        });

        if (!existingUser) {
          throw new NotFoundError('User not found');
        }

        await prisma.user.delete({
          where: { id },
        });

        return reply.status(204).send(null);
      }
    );
}

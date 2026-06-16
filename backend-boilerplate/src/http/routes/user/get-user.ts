import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { auth } from '@/middlewares/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/http/routes/_errors';

export async function getUser(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/users/:id',
      {
        schema: {
          tags: ['Users'],
          summary: 'Get user by ID',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string(),
          }),
          response: {
            200: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string(),
              role: z.string(),
              isActive: z.boolean(),
              lastLoginAt: z.date().nullable(),
              createdAt: z.date(),
              updatedAt: z.date(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.requireRole('ADMIN');

        const { id } = request.params;

        const user = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!user) {
          throw new NotFoundError('User not found');
        }

        return reply.send(user);
      }
    );
}

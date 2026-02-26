import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { auth } from '@/middlewares/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/http/routes/_errors';

export async function getMe(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/auth/me',
      {
        schema: {
          tags: ['Auth'],
          summary: 'Get current authenticated user',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string(),
              role: z.string(),
              isActive: z.boolean(),
              createdAt: z.date(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId();

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        });

        if (!user) {
          throw new NotFoundError('User not found');
        }

        return reply.send(user);
      }
    );
}

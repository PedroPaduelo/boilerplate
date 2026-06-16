import { hash } from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { BadRequestError } from '@/http/routes/_errors';
import { auth } from '@/middlewares/auth';
import { prisma } from '@/lib/prisma';
import { passwordSchema } from '@/lib/validators/password';

export async function createUser(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/users',
      {
        schema: {
          tags: ['Users'],
          summary: 'Create a new user',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string().min(1),
            email: z.string().email(),
            password: passwordSchema,
            role: z.enum(['ADMIN', 'USER']).default('USER'),
          }),
          response: {
            201: z.object({
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
        await request.requireRole('ADMIN');

        const { name, email, password, role } = request.body;

        const userWithSameEmail = await prisma.user.findUnique({
          where: { email },
        });

        if (userWithSameEmail) {
          throw new BadRequestError('User with same email already exists');
        }

        const passwordHash = await hash(password, 10);

        const user = await prisma.user.create({
          data: {
            name,
            email,
            password: passwordHash,
            role,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        });

        return reply.status(201).send(user);
      }
    );
}

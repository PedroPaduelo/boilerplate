import { hash } from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { BadRequestError } from '@/http/routes/_errors';
import { prisma } from '@/lib/prisma';
import { passwordSchema } from '@/lib/validators/password';

export async function register(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/register',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Register a new user account',
        body: z.object({
          name: z.string().min(1),
          email: z.string().email(),
          password: passwordSchema,
        }),
        response: {
          201: z.object({
            token: z.string(),
            user: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body;

      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        throw new BadRequestError('User with same email already exists');
      }

      const passwordHash = await hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          role: 'USER',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      const token = await reply.jwtSign(
        { sub: user.id, role: user.role },
        { expiresIn: '1h' }
      );

      return reply.status(201).send({
        token,
        user,
      });
    }
  );
}

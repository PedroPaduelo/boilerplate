import { hash } from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { auth } from '@/middlewares/auth';
import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError } from '@/http/routes/_errors';
import { passwordSchema } from '@/lib/validators/password';

export async function updateUser(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/users/:id',
      {
        schema: {
          tags: ['Users'],
          summary: 'Update user by ID',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string(),
          }),
          body: z.object({
            name: z.string().min(1).optional(),
            email: z.string().email().optional(),
            password: passwordSchema.optional(),
            role: z
              .enum(['ADMIN', 'ANALYST', 'CREATOR', 'VIEWER', 'USER'])
              .optional(),
            isActive: z.boolean().optional(),
          }),
          response: {
            200: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string(),
              role: z.string(),
              isActive: z.boolean(),
              updatedAt: z.date(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.requireRole('ADMIN');

        const { id } = request.params;
        const { name, email, password, role, isActive } = request.body;

        const existingUser = await prisma.user.findUnique({
          where: { id },
        });

        if (!existingUser) {
          throw new NotFoundError('User not found');
        }

        // Check email uniqueness if changing
        if (email && email !== existingUser.email) {
          const userWithEmail = await prisma.user.findUnique({
            where: { email },
          });
          if (userWithEmail) {
            throw new BadRequestError('Email already in use');
          }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (password) updateData.password = await hash(password, 10);

        const user = await prisma.user.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            updatedAt: true,
          },
        });

        return reply.send(user);
      }
    );
}

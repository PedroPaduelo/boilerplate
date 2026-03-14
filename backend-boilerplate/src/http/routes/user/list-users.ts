import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { auth } from '@/middlewares/auth';
import { prisma } from '@/lib/prisma';

export async function listUsers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/users',
      {
        schema: {
          tags: ['Users'],
          summary: 'List all users with pagination',
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            page: z.coerce.number().min(1).default(1),
            pageSize: z.coerce.number().min(1).max(100).default(10),
            role: z.enum(['ADMIN', 'USER']).optional(),
            isActive: z.coerce.boolean().optional(),
            search: z.string().optional(),
          }),
          response: {
            200: z.object({
              users: z.array(
                z.object({
                  id: z.string(),
                  name: z.string().nullable(),
                  email: z.string(),
                  role: z.string(),
                  isActive: z.boolean(),
                  lastLoginAt: z.date().nullable(),
                  createdAt: z.date(),
                })
              ),
              total: z.number(),
              page: z.number(),
              pageSize: z.number(),
              totalPages: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { page, pageSize, role, isActive, search } = request.query;

        const where: any = {};

        if (role) {
          where.role = role;
        }

        if (typeof isActive === 'boolean') {
          where.isActive = isActive;
        }

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ];
        }

        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where,
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.user.count({ where }),
        ]);

        const totalPages = Math.ceil(total / pageSize);

        return reply.send({
          users,
          total,
          page,
          pageSize,
          totalPages,
        });
      }
    );
}

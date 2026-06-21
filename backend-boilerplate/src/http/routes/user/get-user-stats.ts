import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import { auth } from '@/middlewares/auth';
import { prisma } from '@/lib/prisma';

export async function getUserStats(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/users/stats',
      {
        schema: {
          tags: ['Users'],
          summary: 'Get aggregated user statistics',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              total: z.number(),
              active: z.number(),
              inactive: z.number(),
              admins: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        await request.requireRole('ADMIN');

        // Aggregate via counts (no rows pulled) — cheap even with many users.
        const [total, active, admins] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { isActive: true } }),
          prisma.user.count({ where: { role: 'ADMIN' } }),
        ]);

        return reply.send({
          total,
          active,
          inactive: total - active,
          admins,
        });
      }
    );
}

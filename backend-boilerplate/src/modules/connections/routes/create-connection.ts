import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { BadRequestError, ForbiddenError } from '@/http/routes/_errors';
import { prisma } from '@/lib/prisma';
import { canManageConnections, loadUserContext } from '../rbac';
import {
  connectionResponseSchema,
  createConnectionBodySchema,
  serializeConnection,
} from '../schema';
import { createConnection } from '../service';

export async function createConnectionRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/connections',
    {
      schema: {
        tags: ['Connections'],
        summary: 'Cria uma conexão Postgres (senha cifrada at-rest)',
        security: [{ bearerAuth: [] }],
        body: createConnectionBodySchema,
        response: { 201: connectionResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadUserContext(request);
      if (!canManageConnections(ctx.role)) {
        throw new ForbiddenError('You do not have permission to manage connections');
      }

      const input = request.body;

      if (input.visibility === 'DEPARTMENT' && !input.departmentId) {
        throw new BadRequestError('departmentId is required when visibility is DEPARTMENT');
      }

      if (input.departmentId) {
        const dep = await prisma.department.findUnique({
          where: { id: input.departmentId },
        });
        if (!dep) throw new BadRequestError('department not found');
        if (ctx.role !== 'ADMIN' && !ctx.departmentIds.includes(input.departmentId)) {
          throw new ForbiddenError('You are not a member of this department');
        }
      }

      const conn = await createConnection(ctx, input);
      return reply.status(201).send(serializeConnection(conn));
    }
  );
}

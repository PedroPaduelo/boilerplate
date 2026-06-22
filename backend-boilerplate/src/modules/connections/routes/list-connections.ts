import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ForbiddenError } from '@/http/routes/_errors';
import { buildVisibilityWhere, canUseConnections, loadUserContext } from '../rbac';
import {
  listConnectionsQuerySchema,
  listConnectionsResponseSchema,
  serializeConnection,
} from '../schema';
import { listConnections } from '../service';

export async function listConnectionsRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/connections',
    {
      schema: {
        tags: ['Connections'],
        summary: 'Lista conexões visíveis ao usuário (RBAC/visibilidade)',
        security: [{ bearerAuth: [] }],
        querystring: listConnectionsQuerySchema,
        response: { 200: listConnectionsResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadUserContext(request);
      if (!canUseConnections(ctx.role)) {
        throw new ForbiddenError('You do not have permission to use connections');
      }

      const { page, pageSize, search, visibility, isActive } = request.query;

      const filters: Record<string, unknown> = {};
      if (visibility) filters.visibility = visibility;
      if (typeof isActive === 'boolean') filters.isActive = isActive;
      if (search) {
        filters.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { database: { contains: search, mode: 'insensitive' } },
          { host: { contains: search, mode: 'insensitive' } },
        ];
      }

      const where = { AND: [buildVisibilityWhere(ctx), filters] };

      const { connections, total } = await listConnections({ where, page, pageSize });

      return reply.send({
        connections: connections.map(serializeConnection),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    }
  );
}

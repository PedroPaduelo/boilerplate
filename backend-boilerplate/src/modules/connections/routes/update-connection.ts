import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { BadRequestError, ForbiddenError } from '@/http/routes/_errors';
import { prisma } from '@/lib/prisma';
import { loadUserContext, requireConnectionForManage } from '../rbac';
import {
  connectionResponseSchema,
  idParamSchema,
  serializeConnection,
  updateConnectionBodySchema,
} from '../schema';
import { updateConnection } from '../service';

export async function updateConnectionRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().patch(
    '/connections/:id',
    {
      schema: {
        tags: ['Connections'],
        summary: 'Atualiza uma conexão (recifra a senha se enviada)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateConnectionBodySchema,
        response: { 200: connectionResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadUserContext(request);
      const existing = await requireConnectionForManage(request.params.id, ctx);

      const input = request.body;

      // valida departamento se vier (resolve visibilidade efetiva).
      const effectiveVisibility = input.visibility ?? existing.visibility;
      const effectiveDeptId =
        input.departmentId !== undefined ? input.departmentId : existing.departmentId;

      if (effectiveVisibility === 'DEPARTMENT' && !effectiveDeptId) {
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

      const updated = await updateConnection(existing.id, input);
      return reply.send(serializeConnection(updated));
    }
  );
}

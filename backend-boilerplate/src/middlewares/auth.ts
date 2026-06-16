import type { FastifyInstance, FastifyRequest } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';

import { UnauthorizedError, ForbiddenError } from '@/http/routes/_errors';

type TokenPayload = {
  sub: string;
  role?: string;
};

// Extend FastifyRequest type
declare module 'fastify' {
  interface FastifyRequest {
    getCurrentUserId: () => Promise<string>;
    getCurrentUserRole: () => Promise<string>;
    requireRole: (...roles: string[]) => Promise<string>;
  }
}

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request: FastifyRequest) => {
    const verifyToken = async (): Promise<TokenPayload> => {
      try {
        return await request.jwtVerify<TokenPayload>();
      } catch {
        throw new UnauthorizedError('Invalid or expired token');
      }
    };

    request.getCurrentUserId = async () => {
      const { sub } = await verifyToken();
      return sub;
    };

    request.getCurrentUserRole = async () => {
      const { role } = await verifyToken();
      return role ?? 'USER';
    };

    request.requireRole = async (...roles: string[]) => {
      const { role } = await verifyToken();
      const currentRole = role ?? 'USER';

      if (!roles.includes(currentRole)) {
        throw new ForbiddenError(
          'You do not have permission to access this resource'
        );
      }

      return currentRole;
    };
  });
});

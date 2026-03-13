import type { FastifyInstance, FastifyRequest } from 'fastify';
import { fastifyPlugin } from 'fastify-plugin';

import { UnauthorizedError } from '@/http/routes/_errors';

// Extend FastifyRequest type
declare module 'fastify' {
  interface FastifyRequest {
    getCurrentUserId: () => Promise<string>;
    getCurrentUserRole: () => Promise<string>;
  }
}

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request: FastifyRequest) => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>();
        return sub;
      } catch {
        throw new UnauthorizedError('Invalid or expired token');
      }
    };

    request.getCurrentUserRole = async () => {
      try {
        const decoded = await request.jwtVerify<{ sub: string; role?: string }>();
        return decoded.role || 'USER';
      } catch {
        throw new UnauthorizedError('Invalid or expired token');
      }
    };
  });
});

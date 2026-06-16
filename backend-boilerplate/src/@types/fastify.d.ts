import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    getCurrentUserId: () => Promise<string>;
    getCurrentUserRole: () => Promise<string>;
    requireRole: (...roles: string[]) => Promise<string>;
  }
}

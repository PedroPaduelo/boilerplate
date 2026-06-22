/**
 * Middleware RBAC REUTILIZÁVEL (plugável em qualquer rota Fastify como
 * `preHandler`). É o entregável central e COMPARTILHADO da trilha T-B1 —
 * charts/dashboards/share/export devem consumir daqui, sem reimplementar.
 *
 * Depende do plugin `auth` (`@/middlewares/auth`) ter sido registrado no
 * escopo do módulo: ele decora `request.getCurrentUserId` /
 * `request.getCurrentUserRole` no hook `preHandler`, que roda ANTES do
 * `preHandler` de rota (onde estes guards atuam). Sem token válido,
 * `getCurrentUserRole()` lança `UnauthorizedError` (401) — logo `requireRole`
 * e `requirePermission` também impõem autenticação.
 *
 * Uso:
 *   import { auth } from '@/middlewares/auth';
 *   import { requireAuth, requirePermission, requireRole } from '@/middlewares/rbac';
 *
 *   const mod: FastifyPluginAsync = async (app) => {
 *     await app.register(auth);                              // 1x por módulo
 *     app.post('/charts',
 *       { preHandler: requirePermission('artifacts:manage') },  // por rota
 *       handler);
 *   };
 */
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { ForbiddenError } from '@/http/routes/_errors';
import { hasPermission, type Permission } from '@/lib/rbac/permissions';

/** Re-export do plugin de autenticação JWT (registre 1x no escopo do módulo). */
export { auth, auth as requireAuthPlugin } from '@/middlewares/auth';

/**
 * `preHandler` que só requer um usuário AUTENTICADO (qualquer papel). Útil em
 * rotas de leitura abertas a toda conta logada (ex.: listar departamentos).
 * Lança 401 se o token for inválido/ausente.
 */
export const requireAuth: preHandlerHookHandler = async (request: FastifyRequest) => {
  await request.getCurrentUserId();
};

/**
 * Fábrica de `preHandler` que exige um dos `roles` informados. Lança 403 se o
 * papel atual não estiver na lista (e 401 se não autenticado).
 */
export function requireRole(...roles: string[]): preHandlerHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const role = await request.getCurrentUserRole();
    if (!roles.includes(role)) {
      throw new ForbiddenError('You do not have permission to access this resource');
    }
  };
}

/**
 * Fábrica de `preHandler` que exige a permissão `permission` segundo a matriz
 * RBAC (`@/lib/rbac/permissions`). Lança 403 se o papel não a possui (e 401 se
 * não autenticado).
 */
export function requirePermission(permission: Permission): preHandlerHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const role = await request.getCurrentUserRole();
    if (!hasPermission(role, permission)) {
      throw new ForbiddenError(`Missing required permission: ${permission}`);
    }
  };
}

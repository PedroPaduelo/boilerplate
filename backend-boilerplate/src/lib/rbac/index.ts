/**
 * RBAC COMPARTILHADO — barrel.
 *
 * Consumo pelos próximos módulos (charts/dashboards/share/export):
 *
 *   // 1) checagem por papel/permissão em rota (preHandler):
 *   import { requirePermission } from '@/middlewares/rbac';
 *   app.post('/charts', { preHandler: requirePermission('artifacts:manage') }, handler);
 *
 *   // 2) contexto do ator + checagem ad-hoc dentro do handler:
 *   import { loadActorContext, hasPermission } from '@/lib/rbac';
 *   const ctx = await loadActorContext(request);
 *   if (!hasPermission(ctx.role, 'artifacts:publish')) throw new ForbiddenError(...);
 *
 *   // 3) visibilidade (PRIVATE/DEPARTMENT/ORG):
 *   import { buildVisibilityWhere, canViewArtifact } from '@/lib/visibility';
 */
export {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  isRole,
  hasPermission,
  permissionsForRole,
  type Role,
  type Permission,
} from './permissions';

export { loadActorContext, type ActorContext } from './context';

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Skeleton } from '@/components/ui';
import { ForbiddenPage } from '@/shared/components/forbidden-page';
import {
  hasAnyRole,
  hasPermission,
  toRoleList,
  type Permission,
  type Role,
} from '@/shared/lib/rbac';

export interface RequireRoleProps {
  children: React.ReactNode;
  /** Papel (ou lista) exigido. O usuário precisa ter UM dos papéis. */
  roles?: Role | Role[];
  /** Permissão exigida (alternativa/adicional ao papel). */
  permission?: Permission;
  /**
   * O que fazer quando barrado:
   * - `'forbidden'` (default): renderiza a tela 403 inline.
   * - `'redirect'`: navega para `/` (ou `redirectTo`).
   */
  fallback?: 'forbidden' | 'redirect';
  /** Destino do redirect quando `fallback='redirect'`. Default: `/`. */
  redirectTo?: string;
}

/**
 * Guarda de rota/UI por PAPEL e/ou PERMISSÃO. Use ANINHADO dentro do
 * `ProtectedRoute` (que garante o usuário autenticado) ou standalone.
 *
 * Espelha o RBAC do backend (`@/shared/lib/rbac`, que reflete o
 * `requirePermission` das rotas REST). O backend continua sendo a autoridade —
 * este guarda é UX/defesa em profundidade.
 *
 * Exemplo (rota só para quem gerencia conexões):
 *   <RequireRole permission="connections:manage">
 *     <ConnectionsAdmin />
 *   </RequireRole>
 *
 * Exemplo (somente ADMIN, redirecionando):
 *   <RequireRole roles="ADMIN" fallback="redirect"><Settings /></RequireRole>
 */
export function RequireRole({
  children,
  roles,
  permission,
  fallback = 'forbidden',
  redirectTo = '/',
}: RequireRoleProps) {
  const { user, token, isHydrated } = useAuthStore();

  // Aguarda hidratação do store (token persistido) antes de decidir.
  if (!isHydrated) {
    return (
      <div className="flex h-full min-h-[40vh] items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  // Sem token: não autenticado → login.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token presente mas user ainda carregando (AuthProvider busca /auth/me).
  if (!user) {
    return (
      <div className="flex h-full min-h-[40vh] items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  const allowedRoles = toRoleList(roles);
  const roleOk = allowedRoles.length === 0 || hasAnyRole(user.role, allowedRoles);
  const permOk = !permission || hasPermission(user.role, permission);
  const allowed = roleOk && permOk;

  if (!allowed) {
    if (fallback === 'redirect') {
      return <Navigate to={redirectTo} replace />;
    }
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}

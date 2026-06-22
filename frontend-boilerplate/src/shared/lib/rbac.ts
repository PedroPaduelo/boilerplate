/**
 * RBAC do FRONT — espelho da matriz de papéis × permissões do backend (doc 01,
 * módulo `src/lib/rbac` do backend-boilerplate).
 *
 * Fonte da verdade do backend é o `requirePermission` das rotas REST; aqui
 * replicamos a MESMA matriz para guardas de UI (esconder/barrar ações e telas).
 * O backend continua sendo a autoridade final — esta camada é só UX/defesa em
 * profundidade. Mantenha em sincronia com `ROLE_PERMISSIONS` do backend.
 */

/** Papéis do sistema (Prisma `UserRole`). */
export type Role = 'ADMIN' | 'ANALYST' | 'CREATOR' | 'VIEWER' | 'USER';

/** Permissões granulares (mesma nomenclatura do backend). */
export type Permission =
  | 'departments:manage'
  | 'connections:manage'
  | 'connections:use'
  | 'artifacts:manage'
  | 'artifacts:publish'
  | 'artifacts:view'
  | 'artifacts:export'
  | 'share:create';

/**
 * Matriz papel → permissões. Espelha `ROLE_PERMISSIONS` do backend (doc 01):
 * - ADMIN: tudo.
 * - ANALYST: gerencia conexões e artefatos, publica, compartilha.
 * - CREATOR: usa conexões, gerencia/publica artefatos, compartilha.
 * - VIEWER: apenas visualiza e exporta artefatos.
 * - USER: nenhuma permissão de domínio.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: [
    'departments:manage',
    'connections:manage',
    'connections:use',
    'artifacts:manage',
    'artifacts:publish',
    'artifacts:view',
    'artifacts:export',
    'share:create',
  ],
  ANALYST: [
    'connections:manage',
    'connections:use',
    'artifacts:manage',
    'artifacts:publish',
    'artifacts:view',
    'artifacts:export',
    'share:create',
  ],
  CREATOR: [
    'connections:use',
    'artifacts:manage',
    'artifacts:publish',
    'artifacts:view',
    'artifacts:export',
    'share:create',
  ],
  VIEWER: ['artifacts:view', 'artifacts:export'],
  USER: [],
};

/** `true` se o papel concede a permissão. */
export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** `true` se o papel está na lista de papéis permitidos. */
export function hasAnyRole(role: Role | null | undefined, allowed: readonly Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

/** Normaliza `Role | Role[] | undefined` para um array (helper interno/guarda). */
export function toRoleList(roles: Role | readonly Role[] | undefined): readonly Role[] {
  if (!roles) return [];
  return Array.isArray(roles) ? roles : [roles as Role];
}

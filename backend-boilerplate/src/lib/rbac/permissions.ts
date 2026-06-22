/**
 * RBAC COMPARTILHADO — matriz de permissões por papel (FONTE DA VERDADE).
 *
 * Implementa EXATAMENTE a matriz aprovada em
 * `docs/plano/01-fundacao-rbac-tenancy.md` (seção "RBAC aprovado (rodada 6)"):
 *
 * | Ação                                          | ADMIN | ANALYST | CREATOR | VIEWER | USER |
 * |-----------------------------------------------|:-----:|:-------:|:-------:|:------:|:----:|
 * | Gerenciar usuários/departamentos              |  ✅   |   —     |   —     |   —    |  —   |
 * | Cadastrar/editar conexões                     |  ✅   |   ✅    |   —     |   —    |  —   |
 * | Rodar query / usar conexões disponíveis       |  ✅   |   ✅    |   ✅    |   —    |  —   |
 * | Criar/editar charts e dashboards (próprios)   |  ✅   |   ✅    |   ✅    |   —    |  —   |
 * | Publicar/despublicar (próprios)               |  ✅   |   ✅    |   ✅    |   —    |  —   |
 * | Ver dashboards/charts (conforme visibilidade) |  ✅   |   ✅    |   ✅    |   ✅   |  —   |
 * | Exportar PDF / abrir share                    |  ✅   |   ✅    |   ✅    |   ✅   |  —   |
 * | Criar share-link                              |  ✅   |   ✅    |   ✅    |   —    |  —   |
 *
 * Este módulo é PURO (sem Fastify/Prisma) — testável de forma isolada e
 * consumível por qualquer trilha (charts/dashboards/share/export). O wrapper
 * Fastify (preHandler) vive em `src/middlewares/rbac.ts`.
 */

/** Papéis RBAC globais (espelha o enum Prisma `UserRole`). */
export const ROLES = ['ADMIN', 'ANALYST', 'CREATOR', 'VIEWER', 'USER'] as const;
export type Role = (typeof ROLES)[number];

/**
 * Permissões (ações) do sistema. Nome no formato `recurso:ação`. Cada rota
 * declara a permissão que exige via `requirePermission(...)`.
 */
export const PERMISSIONS = [
  /** Gerenciar usuários e departamentos (CRUD + membership). */
  'departments:manage',
  /** Cadastrar/editar/excluir conexões. */
  'connections:manage',
  /** Rodar query / usar conexões disponíveis (test/schema/query/list). */
  'connections:use',
  /** Criar/editar charts e dashboards (próprios). */
  'artifacts:manage',
  /** Publicar/despublicar charts e dashboards (próprios). */
  'artifacts:publish',
  /** Ver dashboards/charts (conforme visibilidade). */
  'artifacts:view',
  /** Exportar PDF / abrir share. */
  'artifacts:export',
  /** Criar share-link. */
  'share:create',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Permissões concedidas a cada papel. ADMIN recebe TODAS as permissões.
 * Qualquer permissão ausente da lista é negada para aquele papel.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: [...PERMISSIONS],
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

/** Type guard: a string é um papel RBAC conhecido? */
export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/**
 * O papel `role` possui a permissão `permission`?
 *
 * Papel desconhecido (ou `USER`) sem a permissão → `false`. Não lança: é uma
 * decisão pura usada tanto pelo middleware quanto por checagens ad-hoc.
 */
export function hasPermission(role: string, permission: Permission): boolean {
  if (!isRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Lista (cópia) das permissões de um papel. Papel desconhecido → `[]`. */
export function permissionsForRole(role: string): Permission[] {
  if (!isRole(role)) return [];
  return [...ROLE_PERMISSIONS[role]];
}

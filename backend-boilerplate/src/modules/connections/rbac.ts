/**
 * RBAC + visibilidade do módulo `connections` (T-A).
 *
 * Matriz aprovada (docs/plano/01-fundacao-rbac-tenancy.md):
 *   - Cadastrar/editar conexões → ADMIN, ANALYST ("manage").
 *   - Rodar query / usar conexões disponíveis → ADMIN, ANALYST, CREATOR ("use").
 *   - VIEWER/USER não acessam conexões.
 *
 * Visibilidade (campo `visibility` + `departmentId` + `ownerId`):
 *   - ADMIN vê tudo.
 *   - dono sempre vê o que é seu.
 *   - ORG → visível para qualquer um que possa usar conexões.
 *   - DEPARTMENT → visível só para membros do `departmentId`.
 *   - PRIVATE → só o dono (e ADMIN).
 *
 * Ownership (doc 01): criação/edição amarradas ao dono. Só o dono (ou ADMIN)
 * pode editar/excluir.
 */
import type { Connection } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { ForbiddenError, NotFoundError } from '@/http/routes/_errors';
import { prisma } from '@/lib/prisma';

export const MANAGE_ROLES = ['ADMIN', 'ANALYST'] as const;
export const USE_ROLES = ['ADMIN', 'ANALYST', 'CREATOR'] as const;

export interface UserContext {
  userId: string;
  role: string;
  departmentIds: string[];
}

/** Resolve o contexto do usuário autenticado (id, papel e departamentos). */
export async function loadUserContext(request: FastifyRequest): Promise<UserContext> {
  const userId = await request.getCurrentUserId();
  const role = await request.getCurrentUserRole();
  const memberships = await prisma.departmentMembership.findMany({
    where: { userId },
    select: { departmentId: true },
  });
  return { userId, role, departmentIds: memberships.map((m) => m.departmentId) };
}

/** Pode criar/editar/excluir conexões? */
export function canManageConnections(role: string): boolean {
  return (MANAGE_ROLES as readonly string[]).includes(role);
}

/** Pode usar conexões (test/schema/query/listar)? */
export function canUseConnections(role: string): boolean {
  return (USE_ROLES as readonly string[]).includes(role);
}

/** Filtro Prisma de visibilidade para LISTAGEM. */
export function buildVisibilityWhere(ctx: UserContext): Record<string, unknown> {
  if (ctx.role === 'ADMIN') return {};
  return {
    OR: [
      { ownerId: ctx.userId },
      { visibility: 'ORG' },
      {
        visibility: 'DEPARTMENT',
        // se o usuário não pertence a nenhum depto, não casa nada.
        departmentId: { in: ctx.departmentIds.length ? ctx.departmentIds : ['__none__'] },
      },
    ],
  };
}

/** O `ctx` pode VER/USAR esta conexão (visibilidade)? */
export function canAccessConnection(conn: Connection, ctx: UserContext): boolean {
  if (ctx.role === 'ADMIN') return true;
  if (conn.ownerId === ctx.userId) return true;
  if (conn.visibility === 'ORG') return true;
  if (
    conn.visibility === 'DEPARTMENT' &&
    conn.departmentId &&
    ctx.departmentIds.includes(conn.departmentId)
  ) {
    return true;
  }
  return false;
}

/** O `ctx` pode EDITAR/EXCLUIR esta conexão (ownership)? */
export function canModifyConnection(conn: Connection, ctx: UserContext): boolean {
  return ctx.role === 'ADMIN' || conn.ownerId === ctx.userId;
}

/**
 * Carrega uma conexão para USO (test/schema/query/get). Aplica gate de papel e
 * de visibilidade. Retorna 404 (e não 403) quando o usuário não tem acesso, para
 * não vazar a existência da conexão.
 */
export async function requireConnectionForUse(
  id: string,
  ctx: UserContext
): Promise<Connection> {
  if (!canUseConnections(ctx.role)) {
    throw new ForbiddenError('You do not have permission to use connections');
  }
  const conn = await prisma.connection.findUnique({ where: { id } });
  if (!conn || !canAccessConnection(conn, ctx)) {
    throw new NotFoundError('Connection not found');
  }
  return conn;
}

/** Carrega uma conexão para GESTÃO (update/delete). Aplica gate de papel + ownership. */
export async function requireConnectionForManage(
  id: string,
  ctx: UserContext
): Promise<Connection> {
  if (!canManageConnections(ctx.role)) {
    throw new ForbiddenError('You do not have permission to manage connections');
  }
  const conn = await prisma.connection.findUnique({ where: { id } });
  if (!conn) {
    throw new NotFoundError('Connection not found');
  }
  if (!canModifyConnection(conn, ctx)) {
    throw new ForbiddenError('You can only modify connections you own');
  }
  return conn;
}

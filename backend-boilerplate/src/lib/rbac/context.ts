/**
 * Contexto do ator (usuário autenticado) para decisões de RBAC/visibilidade.
 *
 * COMPARTILHADO entre módulos: resolve, a partir do request autenticado, o
 * `userId`, o `role` (papel global) e os `departmentIds` (memberships). É o
 * insumo de `requirePermission`/`requireRole` e dos helpers de visibilidade.
 */
import type { FastifyRequest } from 'fastify';
import { prisma } from '@/lib/prisma';

/** Identidade + papel + departamentos do usuário autenticado. */
export interface ActorContext {
  userId: string;
  role: string;
  departmentIds: string[];
}

/**
 * Carrega o `ActorContext` a partir do request (JWT já verificado pelo plugin
 * `auth`). Faz UMA query para resolver os departamentos do usuário.
 *
 * Requer que o módulo tenha registrado o middleware `auth` (que decora
 * `request.getCurrentUserId` / `request.getCurrentUserRole`).
 */
export async function loadActorContext(request: FastifyRequest): Promise<ActorContext> {
  const userId = await request.getCurrentUserId();
  const role = await request.getCurrentUserRole();
  const memberships = await prisma.departmentMembership.findMany({
    where: { userId },
    select: { departmentId: true },
  });
  return { userId, role, departmentIds: memberships.map((m) => m.departmentId) };
}

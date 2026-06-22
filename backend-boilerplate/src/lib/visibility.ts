/**
 * Helper de VISIBILIDADE COMPARTILHADO (PRIVATE / DEPARTMENT / ORG).
 *
 * Fonte da verdade: `docs/plano/01-fundacao-rbac-tenancy.md` (ownership +
 * visibilidade) e o enum Prisma `Visibility`.
 *
 * Regras (válidas para qualquer artefato com `ownerId` + `visibility` +
 * `departmentId`: Connection, Chart, Dashboard, ...):
 *   - ADMIN vê tudo;
 *   - o dono sempre vê o que é seu;
 *   - ORG        → visível para qualquer usuário da prefeitura (mono-org);
 *   - DEPARTMENT → visível só para membros do `departmentId`;
 *   - PRIVATE    → só o dono (e ADMIN).
 *
 * Ownership (edição/exclusão): só o dono (ou ADMIN), independente de visibilidade.
 *
 * Este módulo é o substituto COMPARTILHADO do `rbac.ts` local que `connections`
 * (T-A) implementou de forma própria. Charts/dashboards/share devem consumir
 * ESTE helper em vez de reimplementar a lógica.
 */
import type { ActorContext } from '@/lib/rbac/context';

/** Sentinela para um `IN ()` que nunca casa (usuário sem departamentos). */
const NO_MATCH = '__none__';

/** Subconjunto de campos de um artefato relevantes à visibilidade. */
export interface VisibilityArtifact {
  ownerId: string;
  visibility: string;
  departmentId?: string | null;
}

/**
 * Cláusula Prisma `where` (parcial) que filtra uma LISTAGEM pela visibilidade
 * acessível ao ator. Combine com os demais filtros via `{ AND: [where, ...] }`.
 *
 * ADMIN → `{}` (sem restrição). Demais → OR(dono, ORG, DEPARTMENT∈memberships).
 */
export function buildVisibilityWhere(ctx: ActorContext): Record<string, unknown> {
  if (ctx.role === 'ADMIN') return {};
  return {
    OR: [
      { ownerId: ctx.userId },
      { visibility: 'ORG' },
      {
        visibility: 'DEPARTMENT',
        departmentId: { in: ctx.departmentIds.length ? ctx.departmentIds : [NO_MATCH] },
      },
    ],
  };
}

/** O ator pode VER/USAR este artefato (visibilidade)? */
export function canViewArtifact(artifact: VisibilityArtifact, ctx: ActorContext): boolean {
  if (ctx.role === 'ADMIN') return true;
  if (artifact.ownerId === ctx.userId) return true;
  if (artifact.visibility === 'ORG') return true;
  if (
    artifact.visibility === 'DEPARTMENT' &&
    artifact.departmentId &&
    ctx.departmentIds.includes(artifact.departmentId)
  ) {
    return true;
  }
  return false;
}

/** O ator pode EDITAR/EXCLUIR este artefato (ownership)? */
export function canModifyArtifact(artifact: VisibilityArtifact, ctx: ActorContext): boolean {
  return ctx.role === 'ADMIN' || artifact.ownerId === ctx.userId;
}

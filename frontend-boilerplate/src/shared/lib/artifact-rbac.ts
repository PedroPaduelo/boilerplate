/**
 * RBAC de AÇÕES sobre artefatos (dashboards e gráficos) — lógica PURA e
 * testável, usada pelas telas de listagem (T-F2).
 *
 * Espelha as regras do backend (doc 01 + helpers `@/lib/visibility` /
 * `requirePermission` das rotas REST):
 * - `artifacts:view`   → abrir (a própria rota já exige).
 * - `artifacts:manage` → editar / duplicar / excluir (edição/exclusão também
 *   exigem ownership; ADMIN ignora ownership; duplicar cria um NOVO artefato
 *   do usuário, então NÃO exige ownership da origem).
 * - `artifacts:publish` + ownership (ou ADMIN) → publicar / despublicar.
 * - `share:create`     → compartilhar (só faz sentido quando há versão
 *   PUBLISHED, que é o que o link público expõe).
 * - `artifacts:export` → exportar (VIEWER tem; T-J entrega o PDF real).
 *
 * O backend continua sendo a autoridade final — esta camada é UX/defesa em
 * profundidade (esconder ações que o usuário não pode executar).
 */
import { hasPermission, type Role } from './rbac';

export type ArtifactStatus = 'DRAFT' | 'PUBLISHED';

/** Ações possíveis numa linha/card de artefato. */
export type ArtifactActionKey =
  | 'open'
  | 'edit'
  | 'publish'
  | 'unpublish'
  | 'share'
  | 'export'
  | 'duplicate'
  | 'delete';

export interface ArtifactPermContext {
  role: Role | null | undefined;
  /** Id do usuário logado (para checar ownership). */
  currentUserId: string | null | undefined;
  /** Dono do artefato. */
  ownerId: string;
  /** Status atual (define publish vs unpublish). */
  status: ArtifactStatus | string;
}

/** ADMIN, ou dono com `artifacts:manage`. Espelha `canModifyArtifact` do backend. */
export function canModifyArtifact(ctx: ArtifactPermContext): boolean {
  if (ctx.role === 'ADMIN') return true;
  return (
    hasPermission(ctx.role, 'artifacts:manage') &&
    !!ctx.currentUserId &&
    ctx.currentUserId === ctx.ownerId
  );
}

/** ADMIN, ou dono com `artifacts:publish`. */
export function canPublishArtifact(ctx: ArtifactPermContext): boolean {
  if (ctx.role === 'ADMIN') return true;
  return (
    hasPermission(ctx.role, 'artifacts:publish') &&
    !!ctx.currentUserId &&
    ctx.currentUserId === ctx.ownerId
  );
}

/**
 * Lista, em ordem de exibição, as ações que o usuário pode executar sobre o
 * artefato. VIEWER (só `artifacts:view`/`export`) recebe apenas `open` (e
 * `export`); nunca `edit`/`publish`/`delete`.
 */
export function availableArtifactActions(
  ctx: ArtifactPermContext,
): ArtifactActionKey[] {
  const actions: ArtifactActionKey[] = ['open'];
  const isPublished = ctx.status === 'PUBLISHED';
  const modify = canModifyArtifact(ctx);
  const publish = canPublishArtifact(ctx);

  if (modify) actions.push('edit');
  if (publish) actions.push(isPublished ? 'unpublish' : 'publish');
  // Compartilhar só quando publicado (o link público só expõe a versão PUBLISHED).
  if (isPublished && hasPermission(ctx.role, 'share:create')) actions.push('share');
  if (hasPermission(ctx.role, 'artifacts:export')) actions.push('export');
  // Duplicar cria um novo artefato do usuário → exige manage, não ownership.
  if (hasPermission(ctx.role, 'artifacts:manage')) actions.push('duplicate');
  if (modify) actions.push('delete');

  return actions;
}

/** Açúcar: a ação `key` está disponível no contexto? */
export function canDoArtifactAction(
  ctx: ArtifactPermContext,
  key: ArtifactActionKey,
): boolean {
  return availableArtifactActions(ctx).includes(key);
}

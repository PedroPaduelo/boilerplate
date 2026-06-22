/**
 * Regra de negócio do módulo `share` (T-B4).
 *
 * Link público com TTL contado a partir da 1ª abertura (docs/plano/09 e 30):
 *
 *   - `createShareLink`  gera um token aleatório seguro (crypto). NÃO seta
 *     `expiresAt` ainda — só valida que o alvo existe e que o ator pode
 *     compartilhá-lo (visibilidade via helper COMPARTILHADO da T-B1).
 *   - `revokeShareLink`  marca `revokedAt` (só dono/admin). Idempotente.
 *   - `openShareLink`    rota PÚBLICA (sem auth): na 1ª abertura seta
 *     `firstAccessedAt`+`expiresAt` de forma ATÔMICA (update condicional
 *     `WHERE firstAccessedAt IS NULL`, à prova de corrida); requests seguintes
 *     mantêm a MESMA janela. Retorna o artefato em modo PUBLISHED — e SOMENTE
 *     ele (sem owner/visibilidade/draft).
 *
 * RBAC/visibilidade reutilizam os helpers COMPARTILHADOS da T-B1 (`@/lib/rbac`
 * + `@/lib/visibility`) — este módulo NÃO reimplementa RBAC.
 */
import { randomBytes } from 'node:crypto';
import type { ShareLink, ShareTargetType } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '@/http/routes/_errors';
import { prisma } from '@/lib/prisma';
import type { ActorContext } from '@/lib/rbac';
import { canViewArtifact } from '@/lib/visibility';
import type { CreateShareInput } from './schema';

/** Token público URL-safe (256 bits de entropia). */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Garante que o alvo existe e que o ator pode compartilhá-lo (pode VER, segundo
 * a visibilidade). 404 (não 403) para não vazar a existência de artefatos
 * invisíveis.
 */
async function assertTargetShareable(
  targetType: ShareTargetType,
  targetId: string,
  ctx: ActorContext,
): Promise<void> {
  if (targetType === 'DASHBOARD') {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: targetId },
      select: { ownerId: true, visibility: true, departmentId: true },
    });
    if (!dashboard || !canViewArtifact(dashboard, ctx)) {
      throw new NotFoundError('Target dashboard not found');
    }
    return;
  }
  const chart = await prisma.chart.findUnique({
    where: { id: targetId },
    select: { ownerId: true, visibility: true, departmentId: true },
  });
  if (!chart || !canViewArtifact(chart, ctx)) {
    throw new NotFoundError('Target chart not found');
  }
}

export async function createShareLink(
  ctx: ActorContext,
  input: CreateShareInput,
): Promise<ShareLink> {
  await assertTargetShareable(input.targetType, input.targetId, ctx);

  return prisma.shareLink.create({
    data: {
      token: generateToken(),
      targetType: input.targetType,
      targetId: input.targetId,
      createdById: ctx.userId,
      durationSeconds: input.durationSeconds,
      // firstAccessedAt/expiresAt permanecem null até a 1ª abertura.
    },
  });
}

/** Revoga (marca `revokedAt`). Só o criador ou ADMIN. 404 se inexistente. */
export async function revokeShareLink(ctx: ActorContext, id: string): Promise<ShareLink> {
  const link = await prisma.shareLink.findUnique({ where: { id } });
  if (!link) throw new NotFoundError('Share link not found');
  if (ctx.role !== 'ADMIN' && link.createdById !== ctx.userId) {
    throw new ForbiddenError('You can only revoke share links you created');
  }
  if (link.revokedAt) return link; // idempotente

  return prisma.shareLink.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

/** Artefato em modo PUBLISHED retornado pela rota pública (sem owner/draft). */
export interface PublishedArtifact {
  targetType: ShareTargetType;
  expiresAt: Date | null;
  dashboard?: {
    id: string;
    title: string;
    publishedLayout: unknown;
    /**
     * Snapshot materializado de dados (T-G1 bugfix do share público). Mesmo
     * shape que `POST /dashboards/:id/data` (modo `published`); null se o
     * dashboard ainda não foi publicado com este mecanismo (legado) ou não
     * tem blocos de dados.
     */
    publishedDataPayload: unknown;
    publishedAt: Date;
  };
  chart?: {
    id: string;
    title: string;
    catalogType: string;
    publishedProps: unknown;
    publishedDataBinding: unknown;
    publishedAt: Date;
  };
}

export type OpenShareResult =
  | { ok: true; artifact: PublishedArtifact }
  | { ok: false; reason: 'not_found' | 'revoked' | 'expired' | 'not_published' };

/**
 * Carrega o artefato alvo em modo PUBLISHED. Retorna null se o artefato não
 * existe mais ou ainda não foi publicado (nesse caso não há o que mostrar
 * publicamente — nunca expomos o draft).
 */
async function loadPublishedArtifact(
  targetType: ShareTargetType,
  targetId: string,
  expiresAt: Date | null,
): Promise<PublishedArtifact | null> {
  if (targetType === 'DASHBOARD') {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        title: true,
        publishedLayout: true,
        publishedDataPayload: true,
        publishedAt: true,
      },
    });
    if (!dashboard || dashboard.publishedLayout == null || dashboard.publishedAt == null) {
      return null;
    }
    return {
      targetType,
      expiresAt,
      dashboard: {
        id: dashboard.id,
        title: dashboard.title,
        publishedLayout: dashboard.publishedLayout,
        publishedDataPayload: dashboard.publishedDataPayload ?? null,
        publishedAt: dashboard.publishedAt,
      },
    };
  }

  const chart = await prisma.chart.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      title: true,
      catalogType: true,
      publishedProps: true,
      publishedDataBinding: true,
      publishedAt: true,
    },
  });
  if (!chart || chart.publishedProps == null || chart.publishedAt == null) {
    return null;
  }
  return {
    targetType,
    expiresAt,
    chart: {
      id: chart.id,
      title: chart.title,
      catalogType: chart.catalogType,
      publishedProps: chart.publishedProps,
      publishedDataBinding: chart.publishedDataBinding ?? null,
      publishedAt: chart.publishedAt,
    },
  };
}

/**
 * Resolve um token público. Lógica do TTL-na-1ª-abertura (doc 09):
 *   1. token inexistente → not_found
 *   2. revogado          → revoked
 *   3. 1ª abertura       → seta firstAccessedAt=now e expiresAt=now+duration
 *                          UMA ÚNICA VEZ, via update condicional atômico
 *                          (WHERE firstAccessedAt IS NULL). Em corrida, o
 *                          perdedor relê a janela definida pelo vencedor.
 *   4. expirado          → expired
 *   5. válido            → artefato em modo PUBLISHED (e só ele)
 */
export async function openShareLink(token: string): Promise<OpenShareResult> {
  const link = await prisma.shareLink.findUnique({ where: { token } });
  if (!link) return { ok: false, reason: 'not_found' };
  if (link.revokedAt) return { ok: false, reason: 'revoked' };

  const now = new Date();
  let expiresAt = link.expiresAt;

  if (!link.firstAccessedAt) {
    const computedExpiry = new Date(now.getTime() + link.durationSeconds * 1000);
    // ATÔMICO: só o 1º request com firstAccessedAt ainda NULL grava a janela.
    const claim = await prisma.shareLink.updateMany({
      where: { id: link.id, firstAccessedAt: null },
      data: { firstAccessedAt: now, expiresAt: computedExpiry },
    });
    if (claim.count === 1) {
      expiresAt = computedExpiry;
    } else {
      // Perdeu a corrida: relê a janela que o vencedor gravou (NÃO reseta).
      const fresh = await prisma.shareLink.findUnique({
        where: { id: link.id },
        select: { expiresAt: true },
      });
      expiresAt = fresh?.expiresAt ?? computedExpiry;
    }
  }

  if (expiresAt && now.getTime() > expiresAt.getTime()) {
    return { ok: false, reason: 'expired' };
  }

  const artifact = await loadPublishedArtifact(link.targetType, link.targetId, expiresAt);
  if (!artifact) return { ok: false, reason: 'not_published' };
  return { ok: true, artifact };
}

/**
 * Resolve o token público e devolve o SNAPSHOT de dados materializado do
 * dashboard (T-G1 bugfix do share público). Mesma validação de TTL/revogação
 * do `openShareLink`; só funciona para `targetType === 'DASHBOARD'`.
 *
 * IMPORTANTE: NUNCA devolve `dataBinding` (SQL/connectionId) — só o resultado
 * já no shape do bloco (T-C satisfaz a nota de segurança de T-B4). Se o
 * snapshot ainda não foi materializado (legado / publish pré-bugfix), o
 * `blocks` vem `{}` — a página trata cada bloco com `state: 'skeleton'`.
 */
export interface PublicDashboardDataResult {
  dashboardId: string;
  mode: 'published';
  generatedAt: string;
  blocks: Record<string, unknown>;
}

export type OpenPublicDataResult =
  | { ok: true; data: PublicDashboardDataResult }
  | { ok: false; reason: 'not_found' | 'revoked' | 'expired' | 'not_published' | 'wrong_type' };

export async function openShareLinkData(token: string): Promise<OpenPublicDataResult> {
  const link = await prisma.shareLink.findUnique({ where: { token } });
  if (!link) return { ok: false, reason: 'not_found' };
  if (link.revokedAt) return { ok: false, reason: 'revoked' };

  if (link.targetType !== 'DASHBOARD') {
    return { ok: false, reason: 'wrong_type' };
  }

  const now = new Date();
  let expiresAt = link.expiresAt;

  if (!link.firstAccessedAt) {
    const computedExpiry = new Date(now.getTime() + link.durationSeconds * 1000);
    const claim = await prisma.shareLink.updateMany({
      where: { id: link.id, firstAccessedAt: null },
      data: { firstAccessedAt: now, expiresAt: computedExpiry },
    });
    if (claim.count === 1) {
      expiresAt = computedExpiry;
    } else {
      const fresh = await prisma.shareLink.findUnique({
        where: { id: link.id },
        select: { expiresAt: true },
      });
      expiresAt = fresh?.expiresAt ?? computedExpiry;
    }
  }

  if (expiresAt && now.getTime() > expiresAt.getTime()) {
    return { ok: false, reason: 'expired' };
  }

  const dashboard = await prisma.dashboard.findUnique({
    where: { id: link.targetId },
    select: {
      id: true,
      publishedLayout: true,
      publishedDataPayload: true,
      publishedAt: true,
    },
  });
  if (!dashboard || dashboard.publishedLayout == null || dashboard.publishedAt == null) {
    return { ok: false, reason: 'not_published' };
  }

  // O snapshot pode ser null (legado pré-bugfix OU dashboard sem blocos de dados).
  // Quando presente, é o `{ dashboardId, mode, generatedAt, blocks }` que o
  // publishDashboard materializou. Quando ausente, devolvemos `blocks: {}` e a
  // UI mostra skeleton para blocos de dados — narrativos renderizam normal
  // porque o layout é independente.
  const snapshot = (dashboard.publishedDataPayload ?? null) as
    | { dashboardId?: string; mode?: string; generatedAt?: string; blocks?: Record<string, unknown> }
    | null;
  const blocks = (snapshot && typeof snapshot === 'object' && snapshot.blocks) || {};
  const generatedAt = (snapshot && typeof snapshot === 'object' && snapshot.generatedAt) || '';
  return {
    ok: true,
    data: {
      dashboardId: dashboard.id,
      mode: 'published',
      generatedAt,
      blocks,
    },
  };
}

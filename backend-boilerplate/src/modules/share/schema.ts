/**
 * Schemas Zod (v3) e serialização do módulo `share` (T-B4).
 *
 * Link público com TTL contado a partir da 1ª abertura (docs/plano/09 e 30).
 * Os contratos COMPARTILHADOS (@dashboards/contracts) não definem DTO de
 * ShareLink, então os schemas de request/response são locais ao módulo — mesma
 * decisão da Fase 0 adotada por `connections`, `departments` e `charts`.
 *
 * IMPORTANTE: a resposta da rota PÚBLICA expõe SOMENTE o artefato em modo
 * PUBLISHED (sem owner/visibilidade/draft, sem credenciais de conexão).
 */
import type { ShareLink } from '@prisma/client';
import { z } from 'zod';

export const shareTargetTypeEnum = z.enum(['DASHBOARD', 'CHART']);

/** Limite superior do TTL: 30 dias (em segundos). Mínimo 1s. */
export const MAX_DURATION_SECONDS = 60 * 60 * 24 * 30;

export const createShareBodySchema = z.object({
  targetType: shareTargetTypeEnum,
  targetId: z.string().min(1),
  durationSeconds: z.number().int().min(1).max(MAX_DURATION_SECONDS),
});

export type CreateShareInput = z.infer<typeof createShareBodySchema>;

export const idParamSchema = z.object({ id: z.string().min(1) });
export const tokenParamSchema = z.object({ token: z.string().min(1) });

/**
 * Resposta da CRIAÇÃO (autenticada): metadados do link + token. `expiresAt`/
 * `firstAccessedAt` vêm null (só são setados na 1ª abertura). `url` é o path
 * relativo da rota pública para conveniência do front.
 */
export const shareLinkResponseSchema = z.object({
  id: z.string(),
  token: z.string(),
  url: z.string(),
  targetType: shareTargetTypeEnum,
  targetId: z.string(),
  durationSeconds: z.number(),
  firstAccessedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  revokedAt: z.date().nullable(),
  createdAt: z.date(),
});

export type ShareLinkResponse = z.infer<typeof shareLinkResponseSchema>;

/**
 * Resposta da rota PÚBLICA (GET /public/:token): SOMENTE o artefato em modo
 * published. Um dos dois (`dashboard` | `chart`) é preenchido conforme
 * `targetType`. NÃO inclui ownerId/visibility/departmentId nem campos draft*.
 * Inclui `publishedDataPayload` (snapshot materializado, T-G1 bugfix do share
 * público) para que a página renderize blocos de dados sem precisar de
 * endpoint separado.
 */
export const publicDashboardSchema = z.object({
  id: z.string(),
  title: z.string(),
  publishedLayout: z.any(),
  publishedDataPayload: z.any().nullable(),
  publishedAt: z.date(),
});

export const publicChartSchema = z.object({
  id: z.string(),
  title: z.string(),
  catalogType: z.string(),
  publishedProps: z.any(),
  publishedDataBinding: z.any().nullable(),
  publishedAt: z.date(),
});

export const publicArtifactResponseSchema = z.object({
  targetType: shareTargetTypeEnum,
  expiresAt: z.date().nullable(),
  dashboard: publicDashboardSchema.optional(),
  chart: publicChartSchema.optional(),
});

export type PublicArtifactResponse = z.infer<typeof publicArtifactResponseSchema>;

/**
 * Resposta do `GET /public/:token/data` (rota PÚBLICA de dados). É o snapshot
 * materializado em formato `DashboardDataPayload` do contrato (modo `published`,
 * blocos com `state: 'success'|'error'`). SEMPRE o resultado já no shape do
 * bloco — NUNCA `dataBinding` cru (sem SQL/connectionId).
 */
export const publicDashboardDataResponseSchema = z.object({
  dashboardId: z.string(),
  mode: z.literal('published'),
  generatedAt: z.string(),
  blocks: z.record(z.any()),
});

export type PublicDashboardDataResponse = z.infer<typeof publicDashboardDataResponseSchema>;

/** Serializa o ShareLink (resposta autenticada de criação). */
export function serializeShareLink(link: ShareLink): ShareLinkResponse {
  return {
    id: link.id,
    token: link.token,
    url: `/public/${link.token}`,
    targetType: link.targetType,
    targetId: link.targetId,
    durationSeconds: link.durationSeconds,
    firstAccessedAt: link.firstAccessedAt,
    expiresAt: link.expiresAt,
    revokedAt: link.revokedAt,
    createdAt: link.createdAt,
  };
}

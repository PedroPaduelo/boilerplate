/**
 * Schemas Zod (v3) e serialização do módulo `dashboards` (T-B3).
 *
 * O LAYOUT (`{ filters, rows }`) é validado contra o CONTRATO COMPARTILHADO
 * (`@dashboards/contracts` → `validateDashboardLayout`, doc 20) no service —
 * aqui a validação Zod é propositalmente FROUXA no conteúdo do layout (arrays
 * de itens livres) para que layouts malformados cheguem ao validador de
 * contrato e retornem um 400 com mensagem clara do ajv (e não um erro de Zod
 * genérico). Os DTOs de request/response são locais ao módulo, mesma decisão
 * adotada por `connections`/`departments`/`charts`.
 *
 * Modelo draft/published SEM histórico (docs/plano/08): só `draftLayout` é
 * editável; `publish` copia draft→published; `unpublish` zera os `published*`.
 */
import type { Dashboard } from '@prisma/client';
import { z } from 'zod';

export const visibilityEnum = z.enum(['PRIVATE', 'DEPARTMENT', 'ORG']);
export const statusEnum = z.enum(['DRAFT', 'PUBLISHED']);
export const layoutModeEnum = z.enum(['draft', 'published']);

/**
 * Forma mínima do layout salvo em `draft_layout` (doc 20: `{ filters, rows }`).
 * O conteúdo de cada filtro/row/bloco é validado no service contra o contrato.
 */
export const layoutInputSchema = z.object({
  filters: z.array(z.any()),
  rows: z.array(z.any()),
});

export type LayoutInput = z.infer<typeof layoutInputSchema>;

export const createDashboardBodySchema = z.object({
  title: z.string().min(1).max(200),
  draftLayout: layoutInputSchema,
  departmentId: z.string().nullish(),
  visibility: visibilityEnum.default('PRIVATE'),
});

export type CreateDashboardInput = z.infer<typeof createDashboardBodySchema>;

export const updateDashboardBodySchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    draftLayout: layoutInputSchema.optional(),
    departmentId: z.string().nullish(),
    visibility: visibilityEnum.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'at least one field must be provided',
  });

export type UpdateDashboardInput = z.infer<typeof updateDashboardBodySchema>;

/**
 * Insere um bloco que referencia um Chart existente numa row/posição do
 * `draftLayout` (operação `add_chart_to_dashboard`, doc 20). Se `rowId` for
 * omitido, uma nova row é criada ao final.
 */
export const addChartBodySchema = z.object({
  chartId: z.string().min(1),
  rowId: z.string().min(1).optional(),
  span: z.number().int().min(1).max(12).default(6),
  position: z.number().int().min(0).optional(),
  blockId: z.string().min(1).optional(),
  props: z.record(z.any()).optional(),
});

export type AddChartInput = z.infer<typeof addChartBodySchema>;

export const listDashboardsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: statusEnum.optional(),
  visibility: visibilityEnum.optional(),
});

export const idParamSchema = z.object({ id: z.string().min(1) });

export const getDashboardQuerySchema = z.object({
  mode: layoutModeEnum.optional(),
});

/** Registro completo do dashboard (draft + published embutidos). */
export const dashboardResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  ownerId: z.string(),
  departmentId: z.string().nullable(),
  visibility: z.string(),
  status: z.string(),
  draftLayout: z.any(),
  publishedLayout: z.any().nullable(),
  publishedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;

/**
 * Resposta do `GET /public/:token` (rota PÚBLICA). Inclui o layout publicado
 * E o SNAPSHOT materializado de dados (`publishedDataPayload`, T-G1 bugfix do
 * share público). NUNCA expõe `draftLayout`, `ownerId`, `visibility` ou
 * credenciais.
 */
export const publicDashboardResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  publishedLayout: z.any(),
  publishedDataPayload: z.any().nullable(),
  publishedAt: z.date(),
});

export type PublicDashboardResponse = z.infer<typeof publicDashboardResponseSchema>;

/**
 * Resposta do `GET /public/:token/data` (rota PÚBLICA de dados). É o snapshot
 * materializado em formato `DashboardDataPayload` do contrato (modo `published`,
 * blocos com `state: 'success'|'error'` e `cached: true`). Sem dataBinding cru.
 */
export const publicDashboardDataResponseSchema = z.object({
  dashboardId: z.string(),
  mode: z.literal('published'),
  generatedAt: z.string(),
  blocks: z.record(z.any()),
});

export type PublicDashboardDataResponse = z.infer<typeof publicDashboardDataResponseSchema>;

/** Resposta do GET por modo: metadados + o layout resolvido para o `mode`. */
export const dashboardDetailResponseSchema = dashboardResponseSchema.extend({
  mode: layoutModeEnum,
  layout: z.any(),
});

export const listDashboardsResponseSchema = z.object({
  dashboards: z.array(dashboardResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

/** Serializa um Dashboard para resposta pública. */
export function serializeDashboard(dashboard: Dashboard): DashboardResponse {
  return {
    id: dashboard.id,
    title: dashboard.title,
    ownerId: dashboard.ownerId,
    departmentId: dashboard.departmentId,
    visibility: dashboard.visibility,
    status: dashboard.status,
    draftLayout: dashboard.draftLayout as unknown,
    publishedLayout: (dashboard.publishedLayout ?? null) as unknown,
    publishedAt: dashboard.publishedAt,
    createdAt: dashboard.createdAt,
    updatedAt: dashboard.updatedAt,
  };
}

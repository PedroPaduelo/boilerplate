/**
 * Schemas Zod (v3) e serialização do módulo `charts` (T-B2).
 *
 * Os contratos COMPARTILHADOS (@dashboards/contracts) não definem DTO de Chart
 * (Chart embute `draftProps`/`draftDataBinding` como JSON livre, validados
 * contra o catálogo VIVO em runtime), então os schemas de request/response são
 * locais ao módulo — mesma decisão da Fase 0 adotada por `connections` e
 * `departments`.
 *
 * Modelo draft/published SEM histórico (docs/plano/08 e 30): só os campos
 * `draft*` são editáveis; `publish` copia draft→published; `unpublish` os zera.
 */
import type { Chart } from '@prisma/client';
import { z } from 'zod';

export const visibilityEnum = z.enum(['PRIVATE', 'DEPARTMENT', 'ORG']);
export const statusEnum = z.enum(['DRAFT', 'PUBLISHED']);

/**
 * Vínculo de dados de um gráfico (doc 30): qual conexão, qual query, params,
 * transformação opcional e TTL de cache. A EXISTÊNCIA do `connectionId` é
 * validada no service (consulta ao banco); aqui validamos só a FORMA.
 */
export const dataBindingSchema = z.object({
  connectionId: z.string().min(1),
  query: z.string().min(1),
  params: z.array(z.any()).optional(),
  transform: z.unknown().optional(),
  ttlSeconds: z.number().int().min(0).max(86400).optional(),
});

export type DataBindingInput = z.infer<typeof dataBindingSchema>;

/** props visuais do bloco — objeto livre validado contra o `propsSchema` do catálogo. */
const propsSchema = z.record(z.any());

export const createChartBodySchema = z.object({
  title: z.string().min(1).max(200),
  catalogType: z.string().min(1),
  draftProps: propsSchema,
  draftDataBinding: dataBindingSchema,
  departmentId: z.string().nullish(),
  visibility: visibilityEnum.default('PRIVATE'),
});

export type CreateChartInput = z.infer<typeof createChartBodySchema>;

export const updateChartBodySchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    catalogType: z.string().min(1).optional(),
    draftProps: propsSchema.optional(),
    draftDataBinding: dataBindingSchema.optional(),
    departmentId: z.string().nullish(),
    visibility: visibilityEnum.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'at least one field must be provided',
  });

export type UpdateChartInput = z.infer<typeof updateChartBodySchema>;

export const listChartsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  catalogType: z.string().optional(),
  status: statusEnum.optional(),
  visibility: visibilityEnum.optional(),
});

export const chartResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  catalogType: z.string(),
  ownerId: z.string(),
  departmentId: z.string().nullable(),
  visibility: z.string(),
  status: z.string(),
  draftProps: z.any(),
  draftDataBinding: z.any(),
  publishedProps: z.any().nullable(),
  publishedDataBinding: z.any().nullable(),
  publishedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ChartResponse = z.infer<typeof chartResponseSchema>;

export const listChartsResponseSchema = z.object({
  charts: z.array(chartResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export const idParamSchema = z.object({ id: z.string().min(1) });

/** Serializa um Chart para resposta pública (draft + published embutidos). */
export function serializeChart(chart: Chart): ChartResponse {
  return {
    id: chart.id,
    title: chart.title,
    catalogType: chart.catalogType,
    ownerId: chart.ownerId,
    departmentId: chart.departmentId,
    visibility: chart.visibility,
    status: chart.status,
    draftProps: chart.draftProps as unknown,
    draftDataBinding: chart.draftDataBinding as unknown,
    publishedProps: (chart.publishedProps ?? null) as unknown,
    publishedDataBinding: (chart.publishedDataBinding ?? null) as unknown,
    publishedAt: chart.publishedAt,
    createdAt: chart.createdAt,
    updatedAt: chart.updatedAt,
  };
}

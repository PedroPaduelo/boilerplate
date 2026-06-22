/**
 * Schemas Zod (v3) do módulo `data` (T-C).
 *
 * O contrato de DADOS canônico vive em `@dashboards/contracts`
 * (`DashboardDataPayloadSchema` / `BlockDataResultSchema`), mas é JSON Schema
 * neutro (ajv). Para a borda HTTP do Fastify usamos Zod equivalente (mesma forma)
 * — `data`/`meta` ficam abertos porque variam conforme o shape do bloco.
 */
import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().min(1) });

export const dashboardDataBodySchema = z.object({
  /** `draft` = sempre fresco (bypass de cache); `published` = cache + fila. */
  mode: z.enum(['draft', 'published']).default('draft'),
  /** Mapa filterId -> valor (compartilhado entre usuários — não entra na cacheKey por usuário). */
  filters: z.record(z.any()).default({}),
});

export type DashboardDataBody = z.infer<typeof dashboardDataBodySchema>;

export const blockDataResultSchema = z.object({
  blockId: z.string(),
  state: z.enum(['idle', 'queued', 'running', 'success', 'error']),
  shape: z.enum(['scalar', 'series', 'categorical', 'table']).optional(),
  data: z.any().optional(),
  error: z
    .object({ code: z.string().optional(), message: z.string() })
    .optional(),
  meta: z.record(z.any()).optional(),
});

export const dashboardDataResponseSchema = z.object({
  dashboardId: z.string(),
  mode: z.enum(['dev', 'published']),
  generatedAt: z.string(),
  blocks: z.record(blockDataResultSchema),
});

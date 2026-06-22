/**
 * Schemas Zod (v3) do módulo `export` (T-J), para a borda HTTP do Fastify.
 */
import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().min(1) });
export const jobParamSchema = z.object({ jobId: z.string().min(1) });

export const exportPdfBodySchema = z.object({
  /** Modo de dados. Export reflete a tela PUBLICADA por padrão. */
  mode: z.enum(['draft', 'published']).default('published'),
  /** Mapa filterId -> valor aplicado (refletido no PDF). */
  filters: z.record(z.any()).default({}),
  /**
   * `true` (default) → enfileira (BullMQ) e responde 202 com jobId; o PDF é
   * baixado depois via `GET /export/jobs/:jobId/pdf`. `false` → gera de forma
   * síncrona e responde com o arquivo direto (útil p/ dashboards leves).
   */
  async: z.boolean().default(true),
});

export type ExportPdfBody = z.infer<typeof exportPdfBodySchema>;

export const exportQueuedResponseSchema = z.object({
  jobId: z.string(),
  status: z.literal('queued'),
  statusUrl: z.string(),
  downloadUrl: z.string(),
});

export const exportStatusResponseSchema = z.object({
  jobId: z.string(),
  state: z.enum(['queued', 'running', 'done', 'error']),
  dashboardId: z.string(),
  bytes: z.number().optional(),
  message: z.string().optional(),
  requestedAt: z.string(),
  updatedAt: z.string(),
  downloadUrl: z.string().optional(),
});

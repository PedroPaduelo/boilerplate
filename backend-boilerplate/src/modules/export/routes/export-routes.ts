/**
 * Rotas do m\u00f3dulo `export` (T-J).
 *
 *  - `POST /export/dashboards/:id/pdf` \u2014 gera o PDF. `async:true` (default)
 *    enfileira (BullMQ) e responde 202 com `jobId`; `async:false` gera s\u00edncrono
 *    e devolve o arquivo. RBAC `artifacts:export`.
 *  - `GET  /export/jobs/:jobId`        \u2014 status do job (polling). Dono ou ADMIN.
 *  - `GET  /export/jobs/:jobId/pdf`    \u2014 baixa o PDF pronto (stream). Dono ou ADMIN.
 *
 * Autentica\u00e7\u00e3o por sess\u00e3o normal (JWT do usu\u00e1rio). O headless usa OUTRO token
 * (servi\u00e7o, curto) gerado internamente \u2014 ver `token.ts`.
 */
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { randomUUID } from 'node:crypto';
import { ForbiddenError, NotFoundError } from '@/http/routes/_errors';
import { loadActorContext } from '@/lib/rbac';
import { requirePermission } from '@/middlewares/rbac';
import {
  exportPdfBodySchema,
  exportQueuedResponseSchema,
  exportStatusResponseSchema,
  idParamSchema,
  jobParamSchema,
} from '../schema';
import { loadDashboardForExport, realRenderPdf } from '../service';
import { setExportStatus, getExportStatus, getExportPdf } from '../storage';
import { addExportJob } from '../jobs/queue';
import type { ExportJobData } from '../types';

export async function exportRoutes(app: FastifyInstance) {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // POST /export/dashboards/:id/pdf -----------------------------------------
  typed.post(
    '/export/dashboards/:id/pdf',
    {
      preHandler: requirePermission('artifacts:export'),
      schema: {
        tags: ['Export'],
        summary: 'Gera PDF do dashboard (fila quando pesado; sync se async=false)',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: exportPdfBodySchema,
        response: { 202: exportQueuedResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const { id } = request.params;
      const { mode, filters, async: isAsync } = request.body;

      const dash = await loadDashboardForExport(id, mode, ctx);

      const jobId = randomUUID();
      const requestedAt = new Date().toISOString();
      const jobData: ExportJobData = {
        jobId,
        dashboardId: id,
        userId: ctx.userId,
        role: ctx.role,
        mode,
        filters,
        title: dash.title,
        requestedAt,
      };

      if (isAsync) {
        await setExportStatus({
          jobId,
          state: 'queued',
          dashboardId: id,
          userId: ctx.userId,
          requestedAt,
          updatedAt: requestedAt,
        });
        const enqueued = await addExportJob(jobData);
        if (enqueued) {
          return reply.code(202).send({
            jobId,
            status: 'queued',
            statusUrl: `/export/jobs/${jobId}`,
            downloadUrl: `/export/jobs/${jobId}/pdf`,
          });
        }
        // fila indispon\u00edvel (Redis degradado) \u2192 cai para gera\u00e7\u00e3o s\u00edncrona.
      }

      const pdf = await realRenderPdf(jobData);
      reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="dashboard-${id}.pdf"`);
      // Envio bin\u00e1rio: o cast evita o estreitamento do reply.send pelo schema 202
      // (Fastify n\u00e3o serializa Buffers via o serializer Zod; passa o bin\u00e1rio cru).
      return reply.send(pdf as unknown as never);
    },
  );

  // GET /export/jobs/:jobId --------------------------------------------------
  typed.get(
    '/export/jobs/:jobId',
    {
      preHandler: requirePermission('artifacts:export'),
      schema: {
        tags: ['Export'],
        summary: 'Status de um job de export (polling)',
        security: [{ bearerAuth: [] }],
        params: jobParamSchema,
        response: { 200: exportStatusResponseSchema },
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const status = await getExportStatus(request.params.jobId);
      if (!status) throw new NotFoundError('Export job not found');
      if (status.userId !== ctx.userId && ctx.role !== 'ADMIN') {
        throw new ForbiddenError('Not your export job');
      }
      return reply.send({
        jobId: status.jobId,
        state: status.state,
        dashboardId: status.dashboardId,
        bytes: status.bytes,
        message: status.message,
        requestedAt: status.requestedAt,
        updatedAt: status.updatedAt,
        downloadUrl:
          status.state === 'done' ? `/export/jobs/${status.jobId}/pdf` : undefined,
      });
    },
  );

  // GET /export/jobs/:jobId/pdf ---------------------------------------------
  typed.get(
    '/export/jobs/:jobId/pdf',
    {
      preHandler: requirePermission('artifacts:export'),
      schema: {
        tags: ['Export'],
        summary: 'Baixa o PDF de um job conclu\u00eddo',
        security: [{ bearerAuth: [] }],
        params: jobParamSchema,
      },
    },
    async (request, reply) => {
      const ctx = await loadActorContext(request);
      const status = await getExportStatus(request.params.jobId);
      if (!status) throw new NotFoundError('Export job not found');
      if (status.userId !== ctx.userId && ctx.role !== 'ADMIN') {
        throw new ForbiddenError('Not your export job');
      }
      const pdf = await getExportPdf(request.params.jobId);
      if (!pdf) throw new NotFoundError('PDF not ready or expired');
      return reply
        .header('Content-Type', 'application/pdf')
        .header(
          'Content-Disposition',
          `attachment; filename="dashboard-${status.dashboardId}.pdf"`,
        )
        .send(pdf);
    },
  );
}

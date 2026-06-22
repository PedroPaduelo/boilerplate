/**
 * Orquestra\u00e7\u00e3o do m\u00f3dulo `export` (T-J).
 *
 * Camadas:
 *  - `loadDashboardForExport`: valida exist\u00eancia + VISIBILIDADE do ator e devolve
 *    o t\u00edtulo (para o cabe\u00e7alho do PDF). Reusa `@/lib/visibility` (compartilhado).
 *  - `renderDashboardPdf`: n\u00facleo de gera\u00e7\u00e3o (PURO, infra injetada) \u2014 assina o
 *    token de servi\u00e7o curto, monta a URL da rota /print e chama o renderer.
 *  - `realRenderDeps` / `realRenderPdf` / `realWorkerDeps`: instancia\u00e7\u00e3o com a
 *    infra REAL (Playwright + JWT + Redis + Socket.IO), consumida pela rota
 *    (sync) e pelo worker (async).
 */
import { BadRequestError, NotFoundError } from '@/http/routes/_errors';
import { prisma } from '@/lib/prisma';
import type { ActorContext } from '@/lib/rbac';
import { canViewArtifact } from '@/lib/visibility';
import { socketManager } from '@/socket/manager/socket-manager';
import { buildPrintUrl, exportConfig, type ExportConfig } from './config';
import { playwrightRenderer, type BrowserPdfRenderer } from './pdf-service';
import { setExportStatus, storeExportPdf } from './storage';
import { signServiceToken } from './token';
import { processExportJob, type ExportWorkerDeps } from './worker-handler';
import type { ExportJobData, ExportMode, ExportRenderJob } from './types';

export type PrintMode = ExportMode;

/** Metadados m\u00ednimos do dashboard necess\u00e1rios ao export. */
export interface DashboardForExport {
  id: string;
  title: string;
}

/**
 * Carrega o dashboard validando visibilidade do ator. Em `published`, exige que
 * exista uma vers\u00e3o publicada (sen\u00e3o o /print n\u00e3o ter\u00e1 o que renderizar).
 */
export async function loadDashboardForExport(
  dashboardId: string,
  mode: ExportMode,
  ctx: ActorContext,
): Promise<DashboardForExport> {
  const dash = await prisma.dashboard.findUnique({
    where: { id: dashboardId },
    select: {
      id: true,
      title: true,
      ownerId: true,
      visibility: true,
      departmentId: true,
      status: true,
    },
  });
  if (!dash || !canViewArtifact(dash, ctx)) {
    throw new NotFoundError('Dashboard not found');
  }
  if (mode === 'published' && dash.status !== 'PUBLISHED') {
    throw new BadRequestError('Dashboard has no published version to export');
  }
  return { id: dash.id, title: dash.title };
}

// ---------------------------------------------------------------------------
// N\u00facleo de renderiza\u00e7\u00e3o (PURO \u2014 infra injetada)
// ---------------------------------------------------------------------------

export interface RenderDeps {
  renderer: BrowserPdfRenderer;
  signToken: (userId: string, role: string, ttlSeconds: number) => string;
  config: ExportConfig;
  now?: () => Date;
}

/**
 * Gera os bytes do PDF de um dashboard: assina o token de servi\u00e7o, monta a URL
 * da rota /print e delega ao renderer (headless). PURO em rela\u00e7\u00e3o \u00e0 infra.
 */
export async function renderDashboardPdf(
  job: ExportRenderJob,
  deps: RenderDeps,
): Promise<Buffer> {
  const token = deps.signToken(job.userId, job.role, deps.config.tokenTtlSeconds);
  const url = buildPrintUrl(deps.config.printBaseUrl, job.dashboardId, {
    token,
    mode: job.mode,
    filters: job.filters,
  });
  return deps.renderer.render({
    url,
    title: job.title,
    brand: deps.config.brand,
    generatedAt: (deps.now ?? (() => new Date()))(),
    navigationTimeoutMs: deps.config.navigationTimeoutMs,
    readyTimeoutMs: deps.config.readyTimeoutMs,
  });
}

// ---------------------------------------------------------------------------
// Instancia\u00e7\u00e3o com infra REAL
// ---------------------------------------------------------------------------

export const realRenderDeps: RenderDeps = {
  renderer: playwrightRenderer,
  signToken: signServiceToken,
  config: exportConfig,
};

/** Gera o PDF de um job com a infra real (usado pela rota sync e pelo worker). */
export function realRenderPdf(job: ExportJobData): Promise<Buffer> {
  return renderDashboardPdf(job, realRenderDeps);
}

/** Deps reais do worker (render + Redis + socket). */
export const realWorkerDeps: ExportWorkerDeps = {
  renderPdf: realRenderPdf,
  storePdf: storeExportPdf,
  setStatus: setExportStatus,
  notify: (userId, event, payload) => {
    socketManager.sendToUser(userId, event, payload);
  },
};

/** Processa um job de export com a infra real (delegado pelo worker). */
export function runExportJob(job: ExportJobData): Promise<{ jobId: string; bytes: number }> {
  return processExportJob(job, realWorkerDeps);
}

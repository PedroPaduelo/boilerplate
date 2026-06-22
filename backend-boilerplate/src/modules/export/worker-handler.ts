/**
 * Núcleo (PURO, infra injetada) do processamento de um job de export (T-J).
 *
 * Testável sem Redis/Playwright/socket: recebe `deps` com `renderPdf` (gera os
 * bytes), `storePdf`, `setStatus` e `notify`. O fluxo:
 *   status running → renderPdf → storePdf → status done → notify(export:ready)
 * Em falha: status error → notify(export:failed) → relança (BullMQ faz retry).
 */
import type { ExportJobData, ExportStatus } from './types';

export interface ExportWorkerDeps {
  /** Gera os bytes do PDF para um job (real: Playwright; teste: mock). */
  renderPdf: (job: ExportJobData) => Promise<Buffer>;
  /** Persiste o PDF para download posterior. */
  storePdf: (jobId: string, pdf: Buffer) => Promise<void>;
  /** Persiste o estado do export. */
  setStatus: (status: ExportStatus) => Promise<void>;
  /** Notifica o usuário (socket) — best-effort. */
  notify: (userId: string, event: string, payload: unknown) => void;
  /** Relógio injeçável (default Date.now via new Date). */
  now?: () => Date;
}

export interface ExportOutcome {
  jobId: string;
  bytes: number;
}

export async function processExportJob(
  job: ExportJobData,
  deps: ExportWorkerDeps,
): Promise<ExportOutcome> {
  const now = deps.now ?? (() => new Date());

  await deps.setStatus({
    jobId: job.jobId,
    state: 'running',
    dashboardId: job.dashboardId,
    userId: job.userId,
    requestedAt: job.requestedAt,
    updatedAt: now().toISOString(),
  });

  try {
    const pdf = await deps.renderPdf(job);
    await deps.storePdf(job.jobId, pdf);
    await deps.setStatus({
      jobId: job.jobId,
      state: 'done',
      dashboardId: job.dashboardId,
      userId: job.userId,
      bytes: pdf.length,
      requestedAt: job.requestedAt,
      updatedAt: now().toISOString(),
    });
    deps.notify(job.userId, 'export:ready', {
      jobId: job.jobId,
      dashboardId: job.dashboardId,
      bytes: pdf.length,
    });
    return { jobId: job.jobId, bytes: pdf.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'export failed';
    await deps.setStatus({
      jobId: job.jobId,
      state: 'error',
      dashboardId: job.dashboardId,
      userId: job.userId,
      message,
      requestedAt: job.requestedAt,
      updatedAt: now().toISOString(),
    });
    deps.notify(job.userId, 'export:failed', { jobId: job.jobId, message });
    throw err;
  }
}

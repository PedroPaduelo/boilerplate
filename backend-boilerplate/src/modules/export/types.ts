/**
 * Tipos internos do módulo `export` (T-J).
 */

/** Modo de dados do export (espelha o do módulo `data`). */
export type ExportMode = 'draft' | 'published';

/** Parâmetros para RENDERIZAR o PDF (sem infra). */
export interface ExportRenderJob {
  dashboardId: string;
  /** Usuário em nome de quem o PDF é gerado (token de serviço + RBAC). */
  userId: string;
  role: string;
  mode: ExportMode;
  filters: Record<string, unknown>;
  /** Título do dashboard (cabeçalho do PDF). */
  title: string;
}

/** Dados do job BullMQ da fila `export-pdf` (inclui o id do job). */
export interface ExportJobData extends ExportRenderJob {
  jobId: string;
  requestedAt: string;
}

/** Estado de um export (guardado no Redis para polling/download). */
export interface ExportStatus {
  jobId: string;
  state: 'queued' | 'running' | 'done' | 'error';
  dashboardId: string;
  userId: string;
  bytes?: number;
  message?: string;
  requestedAt: string;
  updatedAt: string;
}

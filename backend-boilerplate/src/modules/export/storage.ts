/**
 * Armazenamento do RESULTADO do export (T-J) em Redis — cross-process.
 *
 * O worker (que gera o PDF) e a API (que serve o download) podem rodar em
 * processos diferentes; o Redis é o ponto comum. Guardamos:
 *  - `export:status:{jobId}` → JSON com o estado (queued/running/done/error);
 *  - `export:pdf:{jobId}`    → bytes do PDF em base64.
 *
 * Ambos com TTL curto (`EXPORT_RESULT_TTL_SECONDS`) — export é efêmero. Todas as
 * operações são no-op/`null` quando o Redis não está disponível (best-effort).
 */
import { redisService } from '@/lib/redis';
import { exportConfig } from './config';
import type { ExportStatus } from './types';

export const EXPORT_STATUS_PREFIX = 'export:status:';
export const EXPORT_PDF_PREFIX = 'export:pdf:';

export const statusKey = (jobId: string): string => `${EXPORT_STATUS_PREFIX}${jobId}`;
export const pdfKey = (jobId: string): string => `${EXPORT_PDF_PREFIX}${jobId}`;

export async function setExportStatus(status: ExportStatus): Promise<void> {
  if (!redisService.isReady()) return;
  try {
    await redisService.setValue(
      statusKey(status.jobId),
      JSON.stringify(status),
      exportConfig.resultTtlSeconds,
    );
  } catch {
    // best-effort
  }
}

export async function getExportStatus(jobId: string): Promise<ExportStatus | null> {
  if (!redisService.isReady()) return null;
  try {
    const raw = await redisService.getValue(statusKey(jobId));
    return raw ? (JSON.parse(raw) as ExportStatus) : null;
  } catch {
    return null;
  }
}

export async function storeExportPdf(jobId: string, pdf: Buffer): Promise<void> {
  if (!redisService.isReady()) return;
  try {
    await redisService.setValue(
      pdfKey(jobId),
      pdf.toString('base64'),
      exportConfig.resultTtlSeconds,
    );
  } catch {
    // best-effort
  }
}

export async function getExportPdf(jobId: string): Promise<Buffer | null> {
  if (!redisService.isReady()) return null;
  try {
    const raw = await redisService.getValue(pdfKey(jobId));
    return raw ? Buffer.from(raw, 'base64') : null;
  } catch {
    return null;
  }
}

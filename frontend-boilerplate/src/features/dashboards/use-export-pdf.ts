/**
 * Exportação de um dashboard em PDF — a UI do módulo `export` do backend.
 *
 * O caminho feliz é assíncrono de ponta a ponta: enfileira (202 + jobId), faz
 * polling do status e, quando pronto, baixa o arquivo e dispara o download no
 * navegador. Se a fila estiver degradada o backend responde o PDF direto — o
 * hook trata os dois casos com o mesmo resultado para o usuário: o arquivo cai
 * na pasta de downloads.
 *
 * Decisões de UX que moram aqui:
 * - **Um export por vez.** Gerar PDF é caro (Playwright headless); disparar
 *   cinco em paralelo pela listagem só criaria fila e confusão. O segundo
 *   clique ganha um aviso, não um job.
 * - **Feedback nas três fases.** "Gerando…" na largada (a fila pode levar
 *   segundos e silêncio parece travamento), sucesso quando o download começa,
 *   erro com o motivo quando falhar — inclusive timeout.
 * - **O nome do arquivo é o título do dashboard**, não o id: quem exporta
 *   evidência arquiva o PDF, e `relatorio-frota.pdf` se acha depois;
 *   `a1b2c3.pdf` não.
 */
import { useCallback, useRef, useState } from 'react';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import type { ApiMode } from '@/shared/lib/query-keys';
import { dashboardsApi } from './api';

/** Intervalo entre consultas de status. */
const POLL_INTERVAL_MS = 1500;
/** Tempo máximo de espera (~90 s) antes de desistir com erro honesto. */
const MAX_POLLS = 60;

export interface ExportPdfTarget {
  id: string;
  title: string;
}

export interface ExportPdfOptions {
  /** Modo de dados refletido no PDF (default do backend: `published`). */
  mode?: ApiMode;
  /** Filtros aplicados na tela no momento do export — o PDF os reflete. */
  filters?: Record<string, unknown>;
}

export interface UseExportDashboardPdfResult {
  /** Dispara o fluxo completo. Seguro chamar de menus e toolbars. */
  exportPdf: (target: ExportPdfTarget, options?: ExportPdfOptions) => void;
  /** Id do dashboard em exportação (`null` quando ocioso) — liga spinners. */
  exportingId: string | null;
}

/**
 * Nome de arquivo a partir do título: minúsculo, sem acento, sem símbolo.
 * `Relatório de Frota 2026` → `relatorio-de-frota-2026.pdf`.
 */
function toFileName(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return `${slug || 'dashboard'}.pdf`;
}

/** Dispara o download de um Blob sem sair da página. */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useExportDashboardPdf(): UseExportDashboardPdfResult {
  const toast = useAppToast();
  const [exportingId, setExportingId] = useState<string | null>(null);
  // Espelho síncrono do estado: dois cliques no mesmo tick não abrem dois jobs.
  const busyRef = useRef(false);

  const exportPdf = useCallback(
    (target: ExportPdfTarget, options: ExportPdfOptions = {}) => {
      if (busyRef.current) {
        toast.info('Já existe uma exportação em andamento. Aguarde o download começar.');
        return;
      }
      busyRef.current = true;
      setExportingId(target.id);

      const run = async () => {
        toast.info(`Gerando o PDF de “${target.title}”… O download começa sozinho.`);

        const started = await dashboardsApi.startExport(target.id, {
          mode: options.mode ?? 'published',
          filters: options.filters ?? {},
        });

        // Fila indisponível → o PDF veio na própria resposta. Mesmo desfecho.
        if (started.kind === 'pdf') {
          downloadBlob(started.blob, toFileName(target.title));
          return;
        }

        for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
          await sleep(POLL_INTERVAL_MS);
          const status = await dashboardsApi.getExportStatus(started.job.jobId);
          if (status.state === 'done') {
            const blob = await dashboardsApi.downloadExportPdf(started.job.jobId);
            downloadBlob(blob, toFileName(target.title));
            return;
          }
          if (status.state === 'error') {
            throw new Error(status.message || 'A geração do PDF falhou no servidor.');
          }
        }
        throw new Error(
          'A geração está demorando mais que o normal. Tente de novo em instantes.',
        );
      };

      void run()
        .then(() => toast.success(`PDF de “${target.title}” pronto — download iniciado.`))
        .catch((error: unknown) => {
          // Erros do próprio fluxo (timeout, job com falha) já chegam em
          // português; os de rede passam pelo extrator da API. O fallback só
          // fica genérico quando ninguém tem nada melhor a dizer.
          const fallback =
            error instanceof Error && !('isAxiosError' in error) && error.message
              ? error.message
              : 'Não foi possível exportar o PDF agora.';
          toast.error(getApiErrorMessage(error, fallback));
        })
        .finally(() => {
          busyRef.current = false;
          setExportingId(null);
        });
    },
    [toast],
  );

  return { exportPdf, exportingId };
}

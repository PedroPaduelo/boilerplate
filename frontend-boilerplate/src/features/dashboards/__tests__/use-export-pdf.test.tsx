/**
 * Contrato da exportação em PDF — o que o usuário percebe, não como o hook é
 * escrito por dentro.
 *
 * Os quatro casos cobrem as saídas reais do backend: fila (o caminho normal),
 * geração síncrona (fila degradada), falha do job e o segundo clique enquanto
 * o primeiro ainda roda. Em todos eles a pergunta é a mesma: o arquivo desce
 * e o usuário fica sabendo o que aconteceu?
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { api, toast } = vi.hoisted(() => ({
  api: {
    startExport: vi.fn(),
    getExportStatus: vi.fn(),
    downloadExportPdf: vi.fn(),
  },
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../api', () => ({ dashboardsApi: api }));
vi.mock('@/shared/hooks/use-app-toast', () => ({ useAppToast: () => toast }));

import { useExportDashboardPdf } from '../use-export-pdf';

const TARGET = { id: 'dash1', title: 'Relatório de Frota 2026' };

/** Clique registrado: qual arquivo o navegador foi mandado baixar. */
let downloads: Array<{ name: string }> = [];

beforeEach(() => {
  vi.clearAllMocks();
  downloads = [];

  // jsdom não implementa object URLs nem download de âncora: interceptamos o
  // clique para observar o efeito (nome do arquivo) sem simular o navegador.
  URL.createObjectURL = vi.fn(() => 'blob:fake');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push({ name: this.download });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useExportDashboardPdf', () => {
  it('enfileira, acompanha o job e baixa o PDF com o nome do dashboard', async () => {
    api.startExport.mockResolvedValue({
      kind: 'queued',
      job: { jobId: 'job1', status: 'queued' },
    });
    api.getExportStatus
      .mockResolvedValueOnce({ jobId: 'job1', state: 'running' })
      .mockResolvedValueOnce({ jobId: 'job1', state: 'done' });
    api.downloadExportPdf.mockResolvedValue(
      new Blob(['%PDF'], { type: 'application/pdf' }),
    );

    const { result } = renderHook(() => useExportDashboardPdf());

    act(() => {
      result.current.exportPdf(TARGET, { mode: 'published', filters: { uf: 'SP' } });
    });

    // O aviso de partida é imediato: a fila pode levar segundos e silêncio
    // parece travamento.
    expect(toast.info).toHaveBeenCalledWith(
      expect.stringContaining('Gerando o PDF de “Relatório de Frota 2026”'),
    );
    expect(api.startExport).toHaveBeenCalledWith('dash1', {
      mode: 'published',
      filters: { uf: 'SP' },
    });

    await waitFor(() => expect(downloads).toHaveLength(1), { timeout: 10_000 });
    // Título vira nome de arquivo: quem arquiva evidência acha o PDF depois.
    expect(downloads[0]?.name).toBe('relatorio-de-frota-2026.pdf');
    expect(toast.success).toHaveBeenCalled();
    await waitFor(() => expect(result.current.exportingId).toBeNull());
  }, 15_000);

  it('fila indisponível: o PDF vem na própria resposta e o download acontece igual', async () => {
    api.startExport.mockResolvedValue({
      kind: 'pdf',
      blob: new Blob(['%PDF'], { type: 'application/pdf' }),
    });

    const { result } = renderHook(() => useExportDashboardPdf());
    act(() => result.current.exportPdf(TARGET));

    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(api.getExportStatus).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('job com falha vira mensagem de erro com o motivo do servidor', async () => {
    api.startExport.mockResolvedValue({
      kind: 'queued',
      job: { jobId: 'job2', status: 'queued' },
    });
    api.getExportStatus.mockResolvedValue({
      jobId: 'job2',
      state: 'error',
      message: 'O dashboard não tem versão publicada.',
    });

    const { result } = renderHook(() => useExportDashboardPdf());
    act(() => result.current.exportPdf(TARGET));

    await waitFor(
      () =>
        expect(toast.error).toHaveBeenCalledWith('O dashboard não tem versão publicada.'),
      { timeout: 10_000 },
    );
    expect(downloads).toHaveLength(0);
    // Falhou, mas destravou: o usuário pode tentar de novo na hora.
    await waitFor(() => expect(result.current.exportingId).toBeNull());
  }, 15_000);

  it('um export por vez: o segundo clique avisa em vez de abrir outro job', async () => {
    api.startExport.mockImplementation(
      () => new Promise(() => {}), // fica em voo de propósito
    );

    const { result } = renderHook(() => useExportDashboardPdf());
    act(() => result.current.exportPdf(TARGET));
    act(() => result.current.exportPdf(TARGET));

    expect(api.startExport).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenLastCalledWith(
      expect.stringContaining('Já existe uma exportação em andamento'),
    );
  });
});

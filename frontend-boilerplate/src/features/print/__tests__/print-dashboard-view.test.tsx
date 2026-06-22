import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { dashboardLayoutFixture } from '@dashboards/contracts';

/* ------------------------------------------------------------- mocks ------ */

// Cliente de impressão falso: captura o token usado e devolve layout + dados.
const getMock = vi.fn();
const postMock = vi.fn();
let lastToken: string | null = null;

vi.mock('../lib/print-client', () => ({
  createPrintClient: (token: string) => {
    lastToken = token;
    return { get: getMock, post: postMock };
  },
}));

import { PrintDashboardView } from '../components/print-dashboard-view';

const DASH_ID = 'dash_divida_ativa_2026';

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/print/dashboards/:id" element={<PrintDashboardView />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  getMock.mockReset();
  postMock.mockReset();
  lastToken = null;
  getMock.mockResolvedValue({
    data: {
      id: DASH_ID,
      title: 'Dívida Ativa 2026',
      mode: 'published',
      status: 'PUBLISHED',
      layout: dashboardLayoutFixture,
    },
  });
  postMock.mockResolvedValue({
    data: {
      dashboardId: DASH_ID,
      mode: 'published',
      generatedAt: new Date().toISOString(),
      blocks: {},
    },
  });
});

describe('PrintDashboardView', () => {
  it('SEM token → bloqueia (não autenticado) e NÃO chama a API', () => {
    renderAt(`/print/dashboards/${DASH_ID}`);
    expect(document.querySelector('[data-print-error="unauthorized"]')).not.toBeNull();
    expect(getMock).not.toHaveBeenCalled();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('COM token → autentica com o token de serviço e fica pronto', async () => {
    renderAt(`/print/dashboards/${DASH_ID}?token=svc.token.123&mode=published`);

    await waitFor(() => {
      expect(document.querySelector('[data-print-ready="true"]')).not.toBeNull();
    });

    // o cliente foi criado com o token de serviço da query string
    expect(lastToken).toBe('svc.token.123');
    expect(getMock).toHaveBeenCalled();
    expect(postMock).toHaveBeenCalled();
    // o título do dashboard aparece no cabeçalho do relatório
    expect(screen.getByText('Dívida Ativa 2026')).toBeInTheDocument();
  });

  it('mostra os filtros aplicados no cabeçalho', async () => {
    const filters = encodeURIComponent(JSON.stringify({ f_periodo: '2026' }));
    renderAt(
      `/print/dashboards/${DASH_ID}?token=t&mode=published&filters=${filters}`,
    );
    await waitFor(() => {
      expect(document.querySelector('[data-print-ready="true"]')).not.toBeNull();
    });
    expect(
      document.querySelector('[data-slot="print-applied-filters"]'),
    ).not.toBeNull();
    expect(screen.getByText(/f_periodo: 2026/)).toBeInTheDocument();
  });
});

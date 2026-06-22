import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SOCKET_EVENTS,
  dashboardLayoutFixture,
  dashboardDataPayloadFixture,
  type BlockDataEvent,
  type BlockErrorEvent,
} from '@dashboards/contracts';
import type { DashboardDetail } from '../types';

/* --------------------------------------------------------------- mocks ----- */

const DASH_ID = dashboardDataPayloadFixture.dashboardId; // 'dash_divida_ativa_2026'

const detail: DashboardDetail = {
  id: DASH_ID,
  title: 'Dívida Ativa 2026',
  ownerId: 'me',
  departmentId: null,
  visibility: 'ORG',
  status: 'DRAFT', // → effectiveMode = 'draft' (probe e detail coincidem)
  draftLayout: dashboardLayoutFixture as never,
  publishedLayout: null,
  publishedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  mode: 'draft',
  layout: dashboardLayoutFixture as never,
};

// useDashboard (probe + detail) sempre devolve o detail pronto.
vi.mock('../hooks', () => ({
  useDashboard: () => ({ data: detail, isLoading: false, isError: false }),
}));

// fetchData do batch — captura os filtros enviados. Tipado via genérico para que
// `mock.calls` seja uma tupla (id, mode, filters) sem precisar de param não-usado.
const fetchData = vi.fn<
  (id: string, mode: string, filters: Record<string, unknown>) => Promise<unknown>
>(async () => dashboardDataPayloadFixture);
vi.mock('../api', () => ({
  dashboardsApi: { fetchData: (...args: [string, string, Record<string, unknown>]) => fetchData(...args) },
}));

// Socket fake controlável (mesmo padrão do teste de use-dashboard-realtime).
const socketMock = vi.hoisted(() => {
  type Handler = (payload: unknown) => void;
  const handlers = new Map<string, Set<Handler>>();
  const socket = {
    on(ev: string, h: Handler) {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(h);
      return socket;
    },
    off(ev: string, h: Handler) {
      handlers.get(ev)?.delete(h);
      return socket;
    },
    __receive(ev: string, payload: unknown) {
      handlers.get(ev)?.forEach((h) => h(payload));
    },
  };
  return { socket, joinDashboard: vi.fn(), leaveDashboard: vi.fn() };
});

vi.mock('@/shared/socket', () => ({
  useSocket: () => ({
    connected: true,
    getSocket: () => socketMock.socket,
    joinDashboard: socketMock.joinDashboard,
    leaveDashboard: socketMock.leaveDashboard,
  }),
}));

// Importado depois dos mocks.
import { DashboardView } from '../components/dashboard-view';

function renderView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/dashboards/${DASH_ID}`]}>
        <Routes>
          <Route path="/dashboards/:id" element={<DashboardView />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardView (render por config + batch + socket + filtros)', () => {
  beforeEach(() => {
    fetchData.mockClear();
    socketMock.joinDashboard.mockClear();
  });

  it('desenha o layout (filtros + título + blocos com dados das fixtures)', async () => {
    renderView();

    // título do dashboard (header)
    expect(screen.getByText('Dívida Ativa 2026')).toBeInTheDocument();
    // bloco narrativo title (do layout)
    expect(screen.getByText('Dívida Ativa — 2026')).toBeInTheDocument();
    // FilterBar a partir de layout.filters
    expect(screen.getByText('Período')).toBeInTheDocument();
    expect(screen.getByText('Situação')).toBeInTheDocument();

    // o batch foi disparado e os blocos hidratam com os dados da fixture
    await waitFor(() => expect(fetchData).toHaveBeenCalled());
    // kpi (scalar) renderiza o label vindo dos dados
    await waitFor(() =>
      expect(screen.getByText('Total arrecadado')).toBeInTheDocument(),
    );
    // entrou na sala do dashboard (realtime)
    expect(socketMock.joinDashboard).toHaveBeenCalledWith(DASH_ID);
  });

  it('socket block:data hidrata um bloco que estava queued', async () => {
    renderView();
    // espera o payload do batch aplicar (kpi visível) antes de empurrar o socket
    await waitFor(() =>
      expect(screen.getByText('Total arrecadado')).toBeInTheDocument(),
    );

    // blk_table vem 'queued' na fixture (skeleton) → ainda não há dado
    expect(screen.queryByText('Município X')).not.toBeInTheDocument();

    const ev: BlockDataEvent = {
      dashboardId: DASH_ID,
      blockId: 'blk_table',
      result: {
        blockId: 'blk_table',
        state: 'success',
        shape: 'table',
        data: {
          columns: [{ key: 'municipio', label: 'Município' }],
          rows: [{ municipio: 'Município X' }],
        },
      } as never,
    };
    act(() => socketMock.socket.__receive(SOCKET_EVENTS.BLOCK_DATA, ev));

    await waitFor(() =>
      expect(screen.getByText('Município X')).toBeInTheDocument(),
    );
  });

  it('socket block:error mostra estado de erro no bloco', async () => {
    renderView();
    await waitFor(() =>
      expect(screen.getByText('Total arrecadado')).toBeInTheDocument(),
    );

    const ev: BlockErrorEvent = {
      dashboardId: DASH_ID,
      blockId: 'blk_donut',
      error: { code: 'forbidden_connection', message: 'Sem acesso à conexão' },
    };
    act(() => socketMock.socket.__receive(SOCKET_EVENTS.BLOCK_ERROR, ev));

    await waitFor(() =>
      expect(screen.getByText('Sem acesso à conexão')).toBeInTheDocument(),
    );
  });

  it('mudar um filtro re-dispara o batch com os novos filtros', async () => {
    renderView();
    await waitFor(() => expect(fetchData).toHaveBeenCalled());
    const firstCalls = fetchData.mock.calls.length;

    // filtro "Situação" (type select → input de texto no MVP)
    const input = screen.getByLabelText('Situação') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'quitado' } });

    await waitFor(() => {
      expect(fetchData.mock.calls.length).toBeGreaterThan(firstCalls);
    });
    const lastCall = fetchData.mock.calls[fetchData.mock.calls.length - 1];
    // assinatura: (id, mode, filters)
    expect(lastCall[2]).toMatchObject({ f_situacao: 'quitado' });
  });
});

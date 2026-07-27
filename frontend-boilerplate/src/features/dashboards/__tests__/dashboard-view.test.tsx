/**
 * Regressão da tela de dashboard em modo VIEW (`/dashboards/:id`).
 *
 * Cobre o contrato que faz a tela existir: layout → grid, batch → hidratação,
 * socket → atualização incremental e filtro → novo batch. Mais os quatro
 * estados (carregando, erro, conteúdo e o "sem filtros" da barra).
 *
 * Consultas por papel acessível: os nomes de classe são gerados pelo StyleX.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import {
  SOCKET_EVENTS,
  dashboardLayoutFixture,
  dashboardDataPayloadFixture,
  type BlockDataEvent,
  type BlockErrorEvent,
} from '@dashboards/contracts';
import { renderWithProviders } from '@/test/render';
import type { DashboardDetail } from '../types';

/* --------------------------------------------------------------- mocks ----- */

const DASH_ID = dashboardDataPayloadFixture.dashboardId; // 'dash_divida_ativa_2026'

vi.mock('@/shared/hooks/use-app-toast', () => ({
  useAppToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

const detail: DashboardDetail = {
  id: DASH_ID,
  title: 'Dívida Ativa 2026',
  ownerId: 'me',
  departmentId: null,
  visibility: 'ORG',
  status: 'DRAFT', // → modo efetivo = 'draft'
  draftLayout: dashboardLayoutFixture as never,
  publishedLayout: null,
  publishedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  mode: 'draft',
  layout: dashboardLayoutFixture as never,
};

/** Estado da query de detalhe, controlável por teste. */
const query = {
  data: detail as DashboardDetail | undefined,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};

vi.mock('../hooks', () => ({
  useDashboard: () => query,
}));

// fetchData do batch — captura os filtros enviados.
const fetchData = vi.fn<
  (id: string, mode: string, filters: Record<string, unknown>) => Promise<unknown>
>(async () => dashboardDataPayloadFixture);
vi.mock('../api', () => ({
  dashboardsApi: {
    fetchData: (...args: [string, string, Record<string, unknown>]) => fetchData(...args),
  },
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
const { DashboardView } = await import('../components/dashboard-view');

function renderView() {
  return renderWithProviders(
    <Routes>
      <Route path="/dashboards/:id" element={<DashboardView />} />
    </Routes>,
    { route: `/dashboards/${DASH_ID}` },
  );
}

beforeEach(() => {
  fetchData.mockClear();
  socketMock.joinDashboard.mockClear();
  query.data = detail;
  query.isLoading = false;
  query.isError = false;
});

/* -------------------------------------------------------------- testes ----- */

describe('DashboardView — estados da tela', () => {
  it('carregando: esqueleto no lugar da tela em branco', () => {
    query.isLoading = true;
    query.data = undefined;
    renderView();

    expect(screen.getByLabelText('Carregando dashboard')).toBeInTheDocument();
  });

  it('erro: banner acionável com o motivo provável', () => {
    query.isError = true;
    query.data = undefined;
    renderView();

    expect(
      screen.getByText('Não foi possível carregar este dashboard'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
    // A saída para a listagem continua disponível mesmo no erro.
    expect(screen.getByRole('link', { name: 'Dashboards' })).toHaveAttribute(
      'href',
      '/dashboards',
    );
  });
});

describe('DashboardView — render por config + batch + socket + filtros', () => {
  it('desenha o layout (título, filtros e blocos com dados das fixtures)', async () => {
    renderView();

    expect(
      screen.getByRole('heading', { name: 'Dívida Ativa 2026' }),
    ).toBeInTheDocument();
    // bloco narrativo `title` do layout
    expect(screen.getByText('Dívida Ativa — 2026')).toBeInTheDocument();
    // FilterBar montada a partir de layout.filters
    expect(screen.getByRole('combobox', { name: /Período \(de\)/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Situação')).toBeInTheDocument();

    await waitFor(() => expect(fetchData).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Total arrecadado')).toBeInTheDocument());
    expect(socketMock.joinDashboard).toHaveBeenCalledWith(DASH_ID);
  });

  it('socket block:data hidrata um bloco que estava queued', async () => {
    renderView();
    await waitFor(() => expect(screen.getByText('Total arrecadado')).toBeInTheDocument());

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

    await waitFor(() => expect(screen.getByText('Município X')).toBeInTheDocument());
  });

  it('socket block:error mostra estado de erro no bloco', async () => {
    renderView();
    await waitFor(() => expect(screen.getByText('Total arrecadado')).toBeInTheDocument());

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
    const before = fetchData.mock.calls.length;

    // filtro "Situação" (type select → campo de texto no MVP)
    fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'quitado' } });

    await waitFor(() => expect(fetchData.mock.calls.length).toBeGreaterThan(before));
    const lastCall = fetchData.mock.calls[fetchData.mock.calls.length - 1];
    expect(lastCall[2]).toMatchObject({ f_situacao: 'quitado' });
  });

  it('limpar filtros volta aos valores padrão do layout', async () => {
    renderView();
    const situacao = screen.getByLabelText('Situação') as HTMLInputElement;
    fireEvent.change(situacao, { target: { value: 'quitado' } });
    await waitFor(() => expect(situacao.value).toBe('quitado'));

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    await waitFor(() =>
      expect((screen.getByLabelText('Situação') as HTMLInputElement).value).not.toBe(
        'quitado',
      ),
    );
  });
});

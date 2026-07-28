/**
 * Regressão da tela de VISUALIZAÇÃO do dashboard (`/dashboards/:id/view`, doc 40).
 *
 * Cobre as promessas que fazem esta tela existir:
 *  - RETROCOMPAT: dashboard SEM abas (o que está no banco hoje) renderiza tudo,
 *    e NÃO ganha uma barra de navegação de uma aba só;
 *  - dashboard COM abas: barra lateral, troca de aba troca o conteúdo, e o
 *    conteúdo da outra aba não fica no DOM;
 *  - a aba ativa vem/vai pela URL (`?tab=`), então link e voltar funcionam;
 *  - acessibilidade: a navegação é um landmark rotulado, a aba atual é
 *    anunciada (`aria-current`), o teclado anda pelas abas com as setas e a
 *    barra inteira é UM ponto de tabulação (roving tabindex);
 *  - o INVARIANTE do modelo: nenhuma linha some — inclusive a linha órfã, que é
 *    o caso real de o agente inserir um gráfico sem saber que há abas.
 *
 * Consultas por papel acessível: os nomes de classe são gerados pelo StyleX.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import {
  dashboardLayoutFixture,
  dashboardDataPayloadFixture,
} from '@dashboards/contracts';
import { renderWithProviders } from '@/test/render';
import type { DashboardDetail } from '../types';

/* --------------------------------------------------------------- mocks ----- */

const DASH_ID = dashboardDataPayloadFixture.dashboardId;

vi.mock('@/shared/hooks/use-app-toast', () => ({
  useAppToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

/**
 * Layout COM abas, montado sobre o fixture legado (as mesmas rows).
 * `row_detalhe` fica de fora das abas de propósito: é a linha ÓRFÃ, que o
 * normalizador do contrato precisa recuperar na primeira aba.
 */
const layoutWithTabs = {
  ...dashboardLayoutFixture,
  tabs: [
    { id: 'tab_visao', title: 'Visão geral', rowIds: ['row_intro'] },
    { id: 'tab_evolucao', title: 'Evolução', rowIds: ['row_evolucao'] },
  ],
};

const makeDetail = (layout: unknown): DashboardDetail => ({
  id: DASH_ID,
  title: 'Dívida Ativa 2026',
  ownerId: 'me',
  departmentId: null,
  visibility: 'ORG',
  status: 'DRAFT',
  draftLayout: layout as never,
  publishedLayout: null,
  publishedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  mode: 'draft',
  layout: layout as never,
});

const query = {
  data: makeDetail(dashboardLayoutFixture) as DashboardDetail | undefined,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};

vi.mock('../hooks', () => ({
  useDashboard: () => query,
}));

const fetchData = vi.fn(async () => dashboardDataPayloadFixture);
vi.mock('../api', () => ({
  dashboardsApi: {
    fetchData: () => fetchData(),
  },
}));

// Socket fake: a tela entra na sala do dashboard como a view atual faz.
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

const { DashboardViewer } = await import('../components/dashboard-viewer');

function renderViewer(route = `/dashboards/${DASH_ID}/view`) {
  return renderWithProviders(
    <Routes>
      <Route path="/dashboards/:id/view" element={<DashboardViewer />} />
    </Routes>,
    { route },
  );
}

beforeEach(() => {
  fetchData.mockClear();
  query.data = makeDetail(dashboardLayoutFixture);
  query.isLoading = false;
  query.isError = false;
});

/* -------------------------------------------------------------- testes ----- */

describe('DashboardViewer — estados da tela', () => {
  it('carregando: esqueleto no lugar da tela em branco', () => {
    query.isLoading = true;
    query.data = undefined;
    renderViewer();

    expect(screen.getByLabelText('Carregando dashboard')).toBeInTheDocument();
  });

  it('erro: banner acionável e saída para a listagem', () => {
    query.isError = true;
    query.data = undefined;
    renderViewer();

    expect(
      screen.getByText('Não foi possível carregar este dashboard'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboards' })).toHaveAttribute(
      'href',
      '/dashboards',
    );
  });
});

describe('DashboardViewer — RETROCOMPAT: dashboard sem abas', () => {
  it('renderiza TODAS as linhas do layout legado', async () => {
    renderViewer();

    // bloco narrativo da 1ª row + conteúdo hidratado das demais: o dashboard
    // inteiro aparece, exatamente como na tela de detalhe atual.
    expect(screen.getByText('Dívida Ativa — 2026')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Total arrecadado')).toBeInTheDocument());
  });

  it('NÃO desenha a barra lateral de abas (uma aba só é ruído)', () => {
    renderViewer();

    expect(screen.queryByTestId('dashboard-tabs-sidebar')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Abas do dashboard' }),
    ).not.toBeInTheDocument();
  });
});

describe('DashboardViewer — dashboard com abas', () => {
  beforeEach(() => {
    query.data = makeDetail(layoutWithTabs);
  });

  it('desenha a barra lateral com uma aba por item', () => {
    renderViewer();

    expect(screen.getByTestId('dashboard-tabs-sidebar')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Abas do dashboard' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visão geral' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Evolução' })).toBeInTheDocument();
  });

  it('abre na primeira aba e mostra só o conteúdo dela', () => {
    renderViewer();

    // conteúdo de `row_intro` (1ª aba) presente...
    expect(screen.getByText('Dívida Ativa — 2026')).toBeInTheDocument();
    // ...e o título da row da 2ª aba ausente do DOM (não é só CSS escondendo).
    expect(screen.queryByText('Evolução e distribuição')).not.toBeInTheDocument();
  });

  it('trocar de aba troca o conteúdo renderizado', async () => {
    renderViewer();

    fireEvent.click(screen.getByRole('button', { name: 'Evolução' }));

    await waitFor(() =>
      expect(screen.getByText('Evolução e distribuição')).toBeInTheDocument(),
    );
    // e o conteúdo da aba anterior saiu.
    expect(screen.queryByText('Dívida Ativa — 2026')).not.toBeInTheDocument();
  });

  it('a aba ativa vem da URL (`?tab=`) — link compartilhado abre certo', () => {
    renderViewer(`/dashboards/${DASH_ID}/view?tab=tab_evolucao`);

    expect(screen.getByText('Evolução e distribuição')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Evolução' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('`?tab=` inválido cai na primeira aba em vez de tela vazia', () => {
    renderViewer(`/dashboards/${DASH_ID}/view?tab=aba_que_nao_existe`);

    expect(screen.getByText('Dívida Ativa — 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visão geral' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('INVARIANTE: linha órfã (fora de toda aba) aparece na primeira aba', () => {
    // `row_detalhe` não é citada por aba nenhuma no fixture. É o caso real de o
    // agente inserir uma linha sem saber que o dashboard tem abas — e ela NÃO
    // pode sumir da tela sem erro.
    renderViewer();

    expect(screen.getByText('Detalhamento')).toBeInTheDocument();
  });
});

describe('DashboardViewer — acessibilidade da navegação por abas', () => {
  beforeEach(() => {
    query.data = makeDetail(layoutWithTabs);
  });

  it('a aba selecionada é anunciada com aria-current e as demais não', () => {
    renderViewer();

    expect(screen.getByRole('button', { name: 'Visão geral' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Evolução' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('a barra é UM único ponto de tabulação (roving tabindex)', () => {
    // Sem isso, um dashboard com 8 abas obrigaria 8 Tabs para atravessar a
    // navegação — o padrão WAI-ARIA de tab strip existe justamente para evitar.
    renderViewer();

    expect(screen.getByRole('button', { name: 'Visão geral' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getByRole('button', { name: 'Evolução' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
  });

  it('as setas do teclado movem o foco entre as abas', async () => {
    renderViewer();

    const primeira = screen.getByRole('button', { name: 'Visão geral' });
    const segunda = screen.getByRole('button', { name: 'Evolução' });

    primeira.focus();
    fireEvent.keyDown(primeira, { key: 'ArrowDown' });

    await waitFor(() => expect(segunda).toHaveFocus());
  });

  it('a região de conteúdo é rotulada com o nome da aba ativa', async () => {
    renderViewer();

    expect(
      screen.getByRole('region', { name: 'Conteúdo da aba Visão geral' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Evolução' }));

    await waitFor(() =>
      expect(
        screen.getByRole('region', { name: 'Conteúdo da aba Evolução' }),
      ).toBeInTheDocument(),
    );
  });
});

/**
 * Regressão da VISÃO GERAL (`/home`).
 *
 * O que está travado aqui é comportamento observável: os quatro estados da tela
 * (carregando, erro, primeiro uso e conteúdo), os destinos de cada atalho e o
 * RBAC — ação que o papel não permite não aparece, e a faixa de indicadores não
 * mostra conexões para quem não pode usá-las.
 *
 * A camada mockada é o HOOK de dados (`useHomeOverview`), que já é testado pelo
 * caminho das queries; aqui o alvo é a PÁGINA. Consultas por papel acessível —
 * as classes são geradas pelo StyleX e mudam a cada build do design system.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import type { HomeOverview } from '../use-home-overview';

/* ------------------------------------------------------------------ mocks -- */

const { authState } = vi.hoisted(() => ({
  authState: {
    user: { id: 'me', name: 'Ana Souza', role: 'CREATOR' } as {
      id: string;
      name: string | null;
      role: string;
    } | null,
  },
}));

vi.mock('@/features/auth/store', () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

const { overviewState, retry, create } = vi.hoisted(() => ({
  overviewState: { value: null as HomeOverview | null },
  retry: vi.fn(),
  create: { mutate: vi.fn(), isPending: false },
}));

vi.mock('../use-home-overview', () => ({
  useHomeOverview: () => overviewState.value,
}));

vi.mock('@/features/dashboards/hooks', () => ({
  useCreateDashboard: () => create,
}));

const { HomePage } = await import('../components/home-page');

/* --------------------------------------------------------------- fixtures -- */

function overview(partial: Partial<HomeOverview> = {}): HomeOverview {
  return {
    recentDashboards: [],
    recentCharts: [],
    totalDashboards: 0,
    totalCharts: 0,
    totalConnections: 0,
    healthyConnections: 0,
    isLoadingDashboards: false,
    isLoadingCharts: false,
    isLoadingConnections: false,
    isLoadingCounts: false,
    isFirstRun: false,
    error: null,
    hasConnectionsError: false,
    retry,
    ...partial,
  };
}

function renderHome() {
  return renderWithProviders(<HomePage />, { route: '/home' });
}

beforeEach(() => {
  vi.clearAllMocks();
  authState.user = { id: 'me', name: 'Ana Souza', role: 'CREATOR' };
  create.isPending = false;
  overviewState.value = overview();
});

/* ------------------------------------------------------------------ testes -- */

describe('HomePage — os quatro estados', () => {
  it('carregando: esqueleto com a geometria da faixa, nunca uma tela em branco', () => {
    overviewState.value = overview({
      isLoadingCounts: true,
      isLoadingDashboards: true,
      isLoadingCharts: true,
    });
    renderHome();

    expect(
      screen.getByRole('status', { name: 'Carregando indicadores' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Carregando dashboards recentes' }),
    ).toBeInTheDocument();
  });

  it('erro: banner acionável no lugar do resumo, e o retry vem do hook', async () => {
    const user = userEvent.setup();
    overviewState.value = overview({ error: 'A API não respondeu.' });
    renderHome();

    expect(
      screen.getByText('Não foi possível carregar o resumo do ambiente'),
    ).toBeInTheDocument();
    expect(screen.getByText('A API não respondeu.')).toBeInTheDocument();
    // Nada de faixa/recentes com dado quebrado por trás.
    expect(screen.queryByRole('heading', { name: 'Dashboards recentes' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('primeiro uso: os três passos substituem os recentes (que estariam vazios)', () => {
    // ADMIN: o papel que enxerga os três passos completos (inclusive cadastrar
    // conexão, que é `connections:manage`).
    authState.user = { id: 'a', name: 'Alice', role: 'ADMIN' };
    overviewState.value = overview({ isFirstRun: true });
    renderHome();

    expect(
      screen.getByRole('heading', { name: 'Três passos para o primeiro insight' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Conectar banco' })).toHaveAttribute(
      'href',
      '/connections',
    );
    expect(screen.getByRole('link', { name: 'Abrir o agente' })).toHaveAttribute(
      'href',
      '/chat',
    );
    expect(screen.getByRole('button', { name: 'Criar dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dashboards recentes' })).toBeNull();
  });

  it('primeiro uso: passo já cumprido troca o CTA por um selo', () => {
    overviewState.value = overview({ isFirstRun: true, totalConnections: 2 });
    renderHome();

    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Conectar banco' })).toBeNull();
  });

  it('conteúdo: cada artefato recente leva ao próprio artefato', () => {
    overviewState.value = overview({
      totalDashboards: 1,
      totalCharts: 1,
      recentDashboards: [
        {
          id: 'd1',
          title: 'Vendas Mensais',
          updatedAt: '2024-01-02T00:00:00.000Z',
          status: 'PUBLISHED',
        },
      ],
      recentCharts: [
        {
          id: 'c1',
          title: 'Receita por Região',
          updatedAt: '2024-01-03T00:00:00.000Z',
          status: 'DRAFT',
        },
      ],
    });
    renderHome();

    expect(screen.getByRole('link', { name: /Vendas Mensais/ })).toHaveAttribute(
      'href',
      '/dashboards/d1',
    );
    expect(screen.getByRole('link', { name: /Receita por Região/ })).toHaveAttribute(
      'href',
      '/charts/c1',
    );
    // Estado do artefato nomeado por texto, não só por cor.
    expect(screen.getByText('Publicado')).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it('conteúdo: lista vazia oferece a próxima ação, sem "nenhum dado"', () => {
    overviewState.value = overview({ totalDashboards: 1, recentCharts: [] });
    renderHome();

    expect(
      screen.getByRole('heading', { name: 'Nenhum gráfico ainda' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir o agente' })).toHaveAttribute(
      'href',
      '/chat',
    );
  });
});

describe('HomePage — faixa de indicadores', () => {
  it('cada número é um atalho para a listagem correspondente', () => {
    overviewState.value = overview({ totalDashboards: 12, totalCharts: 7 });
    renderHome();

    expect(screen.getByRole('link', { name: /Dashboards$/ })).toHaveAttribute(
      'href',
      '/dashboards',
    );
    expect(screen.getByRole('link', { name: /Gráficos$/ })).toHaveAttribute(
      'href',
      '/charts',
    );
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('conexões: a saúde é dita por texto, não só pelo ponto colorido', () => {
    overviewState.value = overview({ totalConnections: 3, healthyConnections: 2 });
    renderHome();

    expect(screen.getByRole('link', { name: /Conexões/ })).toHaveAttribute(
      'href',
      '/connections',
    );
    expect(screen.getByText('1 sem resposta')).toBeInTheDocument();
  });

  it('conexões indisponíveis: a faixa assume a ignorância em vez de mentir', () => {
    // Consulta falhou → totais chegam zerados. Dizer "nenhuma cadastrada" aqui
    // faria quem tem 12 conexões concluir que perdeu tudo.
    overviewState.value = overview({ hasConnectionsError: true });
    renderHome();

    expect(screen.queryByText('nenhuma cadastrada')).toBeNull();
    expect(screen.getByText('não foi possível verificar')).toBeInTheDocument();
    // Sem número inventado, e o caminho para resolver continua a um clique.
    const cell = screen.getByRole('link', { name: /Conexões/ });
    expect(cell).toHaveTextContent('—');
    expect(cell).toHaveAttribute('href', '/connections');
  });
});

describe('HomePage — RBAC (o que o papel não pode fazer não aparece)', () => {
  it('VIEWER não vê ações de criação nem a célula de conexões', () => {
    authState.user = { id: 'v', name: 'Vera', role: 'VIEWER' };
    overviewState.value = overview({ isFirstRun: true });
    renderHome();

    expect(screen.queryByRole('button', { name: 'Novo dashboard' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Perguntar ao agente' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Criar dashboard' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Abrir o agente' })).toBeNull();
    // Sem `connections:use` a faixa não fala de conexões.
    expect(screen.queryByRole('link', { name: /Conexões/ })).toBeNull();
    // Mas o que ele PODE fazer continua lá.
    expect(
      screen.getByRole('heading', { name: 'Três passos para o primeiro insight' }),
    ).toBeInTheDocument();
  });

  it('CREATOR usa conexões mas não as cadastra: sem CTA de conectar banco', () => {
    overviewState.value = overview({ isFirstRun: true });
    renderHome();

    expect(screen.queryByRole('link', { name: 'Conectar banco' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Criar dashboard' })).toBeInTheDocument();
  });

  it('ADMIN vê o CTA de conectar banco', () => {
    authState.user = { id: 'a', name: 'Alice', role: 'ADMIN' };
    overviewState.value = overview({ isFirstRun: true });
    renderHome();

    expect(screen.getByRole('link', { name: 'Conectar banco' })).toBeInTheDocument();
  });
});

describe('HomePage — atalhos', () => {
  it('criar dashboard dispara a mutação (o destino depende do id devolvido)', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: 'Novo dashboard' }));
    expect(create.mutate).toHaveBeenCalledTimes(1);
  });

  it('catálogo de blocos é um link, não um botão', () => {
    renderHome();

    expect(
      screen.getByRole('link', { name: /Explore o catálogo de blocos/ }),
    ).toHaveAttribute('href', '/catalog');
  });
});

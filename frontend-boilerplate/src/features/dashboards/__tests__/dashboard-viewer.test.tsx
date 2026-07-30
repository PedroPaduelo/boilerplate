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
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import {
  dashboardLayoutFixture,
  dashboardDataPayloadFixture,
} from '@dashboards/contracts';
import { renderWithProviders } from '@/test/render';
import { useAuthStore } from '@/features/auth/store';
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
  externalUrl: null,
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

/**
 * Sessão do teste: o DONO do dashboard, com papel que concede
 * `artifacts:manage`. É o perfil de MAIOR privilégio que a tela pode receber —
 * e justamente o único que faria uma ação de edição aparecer no cabeçalho.
 * Rodar a suíte inteira sob ele é o que dá valor à guarda de "não edita aqui":
 * sob um usuário anônimo, a ausência do botão seria falta de permissão, não
 * regra da tela.
 */
function signInAsOwner() {
  useAuthStore.setState({
    user: {
      id: 'me',
      email: 'ana@prefeitura.gov.br',
      name: 'Ana Souza',
      role: 'ANALYST',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    token: 'tok',
    isAuthenticated: true,
    isHydrated: true,
  });
}

beforeEach(() => {
  fetchData.mockClear();
  query.data = makeDetail(dashboardLayoutFixture);
  query.isLoading = false;
  query.isError = false;
  signInAsOwner();
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
    // A saída vive no PRÓPRIO aviso, não numa trilha de navegação no topo: esta
    // tela é autônoma (guia própria, sem o menu do app), então sem uma ação
    // explícita aqui quem cai num link quebrado fica sem nada para fazer.
    expect(screen.getByRole('link', { name: 'Ver todos os dashboards' })).toHaveAttribute(
      'href',
      '/dashboards',
    );
  });

  it('desenha a trilha de navegação com saída para a listagem', () => {
    /*
     * REVERSÃO CONSCIENTE de uma decisão anterior, registrada aqui porque o
     * teste antigo afirmava exatamente o contrário ("não desenha trilha").
     *
     * O argumento de antes: a tela é AUTÔNOMA (guia própria, para projetar numa
     * reunião), e trilha é orientação DENTRO de um app. Valia para a tela
     * daquele momento, que era praticamente um slide.
     *
     * O que mudou: a tela ganhou ações de trabalho (compartilhar, período,
     * exportar) — não se está só olhando, se está operando. E o próprio estado
     * de erro já tinha provado que faltava saída: ele precisou de um botão
     * "ver todos os dashboards" justamente porque não havia caminho de volta.
     * Se o erro precisa de saída, a tela precisa de saída sempre — e a trilha,
     * além de sair, diz ONDE se está, o que um botão solto não faz.
     */
    query.isError = false;
    renderViewer();

    const trilha = screen.getByRole('navigation', { name: 'Você está em' });
    expect(trilha).toBeInTheDocument();
    expect(within(trilha).getByRole('link', { name: 'Dashboards' })).toHaveAttribute(
      'href',
      '/dashboards',
    );
  });
});

describe('DashboardViewer — `/view` é somente leitura', () => {
  /*
   * A REGRA da tela, não uma consequência de permissão: em `/view` não se
   * edita. A suíte roda logada como o DONO do dashboard com `artifacts:manage`
   * (ver `signInAsOwner`), ou seja, o único perfil para quem uma ação de edição
   * chegaria a ser desenhada — então se alguém devolver o botão "Editar" ao
   * cabeçalho, estes casos quebram em vez de passar por sorte.
   */
  it('não oferece ação de "Editar" no cabeçalho', () => {
    renderViewer();

    expect(screen.queryByRole('link', { name: 'Editar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
  });

  it('nenhum caminho da tela leva para o editor', () => {
    // Mais amplo que o caso acima: pega também um link de rótulo diferente
    // ("Abrir no editor", um ícone de lápis sem texto, etc.) que aponte para
    // `/edit`. O que não pode existir é a ROTA de edição alcançável daqui.
    const { container } = renderViewer();

    expect(container.querySelector('a[href*="/edit"]')).toBeNull();
  });

  it('mantém as ações de LEITURA visíveis: atualizar e compartilhar', () => {
    // Contrapeso: a remoção da edição não pode levar junto o que o leitor
    // legitimamente faz nesta tela. Estas duas são as que se fazem DURANTE a
    // leitura, então ficam inline.
    renderViewer();

    expect(screen.getByRole('button', { name: 'Atualizar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeInTheDocument();
  });

  it('exportar PDF continua alcançável — no menu de mais ações', async () => {
    /*
     * Exportar saiu da fileira principal por ser caro, lento e pontual: cinco
     * botões lado a lado não é um cabeçalho rico, é um cabeçalho sem opinião.
     * Mas "sair de vista" não pode virar "sumir" — este caso guarda o caminho.
     */
    renderViewer();

    fireEvent.click(screen.getByRole('button', { name: 'Mais ações do dashboard' }));

    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /Exportar PDF/ })).toBeInTheDocument(),
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
    expect(screen.getByRole('link', { name: 'Visão geral' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Evolução' })).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole('link', { name: 'Evolução' }));

    await waitFor(() =>
      expect(screen.getByText('Evolução e distribuição')).toBeInTheDocument(),
    );
    // e o conteúdo da aba anterior saiu.
    expect(screen.queryByText('Dívida Ativa — 2026')).not.toBeInTheDocument();
  });

  it('a aba ativa vem da URL (`?tab=`) — link compartilhado abre certo', () => {
    renderViewer(`/dashboards/${DASH_ID}/view?tab=tab_evolucao`);

    expect(screen.getByText('Evolução e distribuição')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Evolução' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('`?tab=` inválido cai na primeira aba em vez de tela vazia', () => {
    renderViewer(`/dashboards/${DASH_ID}/view?tab=aba_que_nao_existe`);

    expect(screen.getByText('Dívida Ativa — 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Visão geral' })).toHaveAttribute(
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

    expect(screen.getByRole('link', { name: 'Visão geral' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Evolução' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('cada aba é um LINK de verdade, com endereço próprio', () => {
    /*
     * Mudança de padrão consciente: a barra deixou de ser um "tab strip"
     * (`TabList` + roving tabindex) e virou uma NAVEGAÇÃO DE LINKS — hoje a
     * réplica da sidebar do AuditorIA (`@/shared/ui/nav-section`).
     *
     * O motivo foi visual — `orientation="vertical"` do `TabList` só troca as
     * setas do teclado, não empilha, e as abas saíam lado a lado. Mas o ganho é
     * de comportamento: a aba já vivia na URL, então o link é a representação
     * honesta dela. ⌘/Ctrl+clique abre em nova guia, o botão do meio funciona,
     * "copiar endereço do link" funciona — nada disso um `<button>` dá.
     *
     * Roving tabindex é o padrão de tab strip; para uma lista de links o
     * correto é o oposto: TODOS alcançáveis por Tab, como qualquer menu.
     */
    renderViewer();

    const primeira = screen.getByRole('link', { name: 'Visão geral' });
    const segunda = screen.getByRole('link', { name: 'Evolução' });

    expect(primeira).toHaveAttribute('href', expect.stringContaining('tab=tab_visao'));
    expect(segunda).toHaveAttribute('href', expect.stringContaining('tab=tab_evolucao'));
    // Nenhuma aba fora da ordem de tabulação.
    expect(primeira).not.toHaveAttribute('tabindex', '-1');
    expect(segunda).not.toHaveAttribute('tabindex', '-1');
  });

  it('o link da aba preserva os demais parâmetros da URL', async () => {
    // Filtros e modo vivem na mesma query. Se a troca de aba reescrevesse a URL
    // inteira, trocar de aba limparia os filtros aplicados — e o usuário veria
    // números diferentes sem ter mexido em filtro nenhum.
    renderViewer(`/dashboards/${DASH_ID}/view?tab=tab_visao&zona=norte`);

    const segunda = screen.getByRole('link', { name: 'Evolução' });
    const href = segunda.getAttribute('href') ?? '';

    expect(href).toContain('zona=norte');
    expect(href).toContain('tab=tab_evolucao');
  });

  it('a região de conteúdo é rotulada com o nome da aba ativa', async () => {
    renderViewer();

    expect(
      screen.getByRole('region', { name: 'Conteúdo da aba Visão geral' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Evolução' }));

    await waitFor(() =>
      expect(
        screen.getByRole('region', { name: 'Conteúdo da aba Evolução' }),
      ).toBeInTheDocument(),
    );
  });
});

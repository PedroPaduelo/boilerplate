/**
 * Regressão da LISTAGEM de dashboards (`/dashboards`).
 *
 * O que está travado aqui é comportamento observável pelo usuário, não markup:
 * os quatro estados da tela (carregando, erro, vazio, lista), o RBAC do menu de
 * cada linha e o fluxo destrutivo de exclusão (confirmar / cancelar / falhar).
 *
 * As consultas são por PAPEL ACESSÍVEL — as classes são geradas pelo StyleX e
 * mudam a cada build do design system, então qualquer asserção por classe
 * quebraria sozinha.
 *
 * A camada mockada é a de REDE (`../api`): os hooks de dados rodam de verdade,
 * o que mantém o teste sensível a erro de cache/invalidação.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import type { Dashboard, DashboardsResponse } from '../types';

/* ------------------------------------------------------------------ mocks -- */

const { authState } = vi.hoisted(() => ({
  authState: {
    user: { id: 'me', role: 'CREATOR' } as { id: string; role: string } | null,
  },
}));

vi.mock('@/features/auth/store', () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

// Toasts: mantido mockado (o viewport do Layer não interessa a esta suíte).
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/shared/hooks/use-app-toast', () => ({ useAppToast: () => toast }));

vi.mock('@/shared/hooks/use-departments', () => ({
  useDepartments: () => ({ data: { departments: [{ id: 'dep1', name: 'Fazenda' }] } }),
}));

// Diálogo de compartilhamento é território compartilhado: aqui só interessa que
// a tela o ABRA para o dashboard certo.
vi.mock('@/shared/components/share-artifact-dialog', () => ({
  ShareArtifactDialog: ({
    open,
    targetTitle,
  }: {
    open: boolean;
    targetTitle?: string;
  }) => (open ? <div data-testid="share-dialog">{targetTitle}</div> : null),
}));

const list = vi.fn<(params: Record<string, unknown>) => Promise<DashboardsResponse>>();
const getById = vi.fn<(id: string, mode: string) => Promise<unknown>>(async () => ({}));
const remove = vi.fn<(id: string) => Promise<void>>();
const publish = vi.fn<(id: string) => Promise<unknown>>(async () => ({}));
const unpublish = vi.fn<(id: string) => Promise<unknown>>(async () => ({}));
const create = vi.fn<(input: unknown) => Promise<{ id: string }>>(async () => ({
  id: 'novo',
}));

vi.mock('../api', () => ({
  dashboardsApi: {
    list: (params: Record<string, unknown>) => list(params),
    getById: (id: string, mode: string) => getById(id, mode),
    remove: (id: string) => remove(id),
    publish: (id: string) => publish(id),
    unpublish: (id: string) => unpublish(id),
    create: (input: unknown) => create(input),
  },
}));

// Importado depois dos mocks.
const { DashboardsPage } = await import('../components/dashboards-page');

/* --------------------------------------------------------------- fixtures -- */

const dashboards: Dashboard[] = [
  {
    id: 'd1',
    title: 'Vendas Mensais',
    ownerId: 'me',
    departmentId: 'dep1',
    visibility: 'ORG',
    status: 'PUBLISHED',
    draftLayout: { filters: [], rows: [] },
    publishedLayout: { filters: [], rows: [] },
    publishedAt: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'd2',
    title: 'Receita por Região',
    ownerId: 'someone-else',
    departmentId: null,
    visibility: 'DEPARTMENT',
    status: 'DRAFT',
    draftLayout: { filters: [], rows: [] },
    publishedLayout: null,
    publishedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

function page(items: Dashboard[] = dashboards): DashboardsResponse {
  return { dashboards: items, total: items.length, page: 1, pageSize: 12, totalPages: 1 };
}

function renderPage() {
  return renderWithProviders(<DashboardsPage />, { route: '/dashboards' });
}

/** Abre o menu "…" da linha e devolve o menu já aberto. */
async function openRowMenu(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(await screen.findByRole('button', { name: `Ações de ${title}` }));
  return screen.findByRole('menu');
}

beforeEach(() => {
  vi.clearAllMocks();
  authState.user = { id: 'me', role: 'CREATOR' };
  list.mockResolvedValue(page());
  remove.mockResolvedValue(undefined);
});

/* ------------------------------------------------------------------ testes -- */

describe('DashboardsPage — os quatro estados', () => {
  it('carregando: mostra o esqueleto da lista, nunca uma tela em branco', async () => {
    renderPage();
    expect(screen.getByLabelText('Carregando dashboards')).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: 'Vendas Mensais' }),
    ).toBeInTheDocument();
  });

  it('lista: uma LINHA por dashboard, com status e departamento', async () => {
    renderPage();

    const row = (await screen.findByRole('link', { name: 'Vendas Mensais' })).closest(
      'tr',
    );
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText('Publicado')).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText('Fazenda')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Receita por Região' })).toHaveAttribute(
      'href',
      '/dashboards/d2',
    );
  });

  it('erro: banner acionável em vez de lista vazia silenciosa', async () => {
    list.mockRejectedValue(new Error('boom'));
    renderPage();

    expect(
      await screen.findByText('Não foi possível carregar os dashboards'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  it('vazio de primeiro uso: oferece o caminho de criação', async () => {
    list.mockResolvedValue(page([]));
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Crie seu primeiro dashboard' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar dashboard' })).toBeInTheDocument();
  });

  it('vazio por FILTRO: oferece limpar, não criar', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('link', { name: 'Vendas Mensais' });

    list.mockResolvedValue(page([]));
    await user.type(screen.getByRole('textbox', { name: 'Buscar por título' }), 'zzz');

    expect(
      await screen.findByRole('heading', { name: 'Nenhum resultado para esses filtros' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
  });

  it('sem permissão de criar: o botão fica desabilitado (com o motivo), não some', async () => {
    authState.user = { id: 'viewer', role: 'VIEWER' };
    const user = userEvent.setup();
    renderPage();

    // `aria-disabled` (e não `disabled`) mantém o botão focalizável, então o
    // motivo continua alcançável por teclado e leitor de tela.
    const button = await screen.findByRole('button', { name: 'Novo dashboard' });
    expect(button).toHaveAttribute('aria-disabled', 'true');

    await user.hover(button);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Seu perfil não permite criar dashboards.',
    );
  });
});

describe('DashboardsPage — ações da linha (RBAC)', () => {
  it('VIEWER não vê editar/publicar/excluir', async () => {
    authState.user = { id: 'viewer', role: 'VIEWER' };
    const user = userEvent.setup();
    renderPage();

    const menu = await openRowMenu(user, 'Vendas Mensais');
    expect(within(menu).getByRole('menuitem', { name: 'Abrir' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Exportar' })).toBeInTheDocument();
    expect(
      within(menu).queryByRole('menuitem', { name: 'Editar' }),
    ).not.toBeInTheDocument();
    expect(
      within(menu).queryByRole('menuitem', { name: /Publicar|Despublicar/ }),
    ).not.toBeInTheDocument();
    expect(
      within(menu).queryByRole('menuitem', { name: 'Excluir' }),
    ).not.toBeInTheDocument();
  });

  it('CREATOR dono vê editar, despublicar e excluir no dashboard publicado', async () => {
    const user = userEvent.setup();
    renderPage();

    const menu = await openRowMenu(user, 'Vendas Mensais');
    expect(within(menu).getByRole('menuitem', { name: 'Editar' })).toBeInTheDocument();
    expect(
      within(menu).getByRole('menuitem', { name: 'Despublicar' }),
    ).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Excluir' })).toBeInTheDocument();
  });

  it('compartilhar abre o diálogo do dashboard certo', async () => {
    const user = userEvent.setup();
    renderPage();

    const menu = await openRowMenu(user, 'Vendas Mensais');
    await user.click(within(menu).getByRole('menuitem', { name: 'Compartilhar' }));

    expect(await screen.findByTestId('share-dialog')).toHaveTextContent('Vendas Mensais');
  });

  it('despublicar dispara a chamada correspondente', async () => {
    const user = userEvent.setup();
    renderPage();

    const menu = await openRowMenu(user, 'Vendas Mensais');
    await user.click(within(menu).getByRole('menuitem', { name: 'Despublicar' }));

    await waitFor(() => expect(unpublish).toHaveBeenCalledWith('d1'));
    expect(publish).not.toHaveBeenCalled();
  });
});

describe('DashboardsPage — excluir (ação destrutiva)', () => {
  /** Abre o menu da linha e clica em "Excluir". */
  async function startDelete(user: ReturnType<typeof userEvent.setup>) {
    const menu = await openRowMenu(user, 'Vendas Mensais');
    await user.click(within(menu).getByRole('menuitem', { name: 'Excluir' }));
    return screen.findByRole('alertdialog');
  }

  it('pede confirmação nomeando o dashboard e avisando que é irreversível', async () => {
    const user = userEvent.setup();
    renderPage();

    const dialog = await startDelete(user);
    expect(within(dialog).getByText('Excluir Vendas Mensais?')).toBeInTheDocument();
    expect(within(dialog).getByText(/não pode ser desfeita/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('confirmar chama a exclusão com o id certo e fecha ao concluir', async () => {
    const user = userEvent.setup();
    renderPage();

    const dialog = await startDelete(user);
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith('d1'));
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
  });

  it('cancelar não exclui nada', async () => {
    const user = userEvent.setup();
    renderPage();

    const dialog = await startDelete(user);
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it('FALHA na exclusão também fecha a confirmação (nada trava a tela)', async () => {
    remove.mockRejectedValue(new Error('500'));
    const user = userEvent.setup();
    renderPage();

    const dialog = await startDelete(user);
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(remove).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(toast.error).toHaveBeenCalled();
  });
});

describe('DashboardsPage — navegação e prefetch', () => {
  it('hover no título faz prefetch do detalhe no modo publicado', async () => {
    renderPage();

    fireEvent.mouseEnter(await screen.findByRole('link', { name: 'Vendas Mensais' }));

    await waitFor(() => expect(getById).toHaveBeenCalledWith('d1', 'published'));
  });

  it('criar dashboard leva ao editor do rascunho recém-criado', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Novo dashboard' }));

    await waitFor(() => expect(create).toHaveBeenCalled());
  });
});

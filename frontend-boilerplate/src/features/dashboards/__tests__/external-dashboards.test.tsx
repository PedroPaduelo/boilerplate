/**
 * RELATÓRIOS EXTERNOS (legado) na listagem de dashboards.
 *
 * O que está travado aqui é a promessa da feature: um relatório feito fora da
 * plataforma aparece na MESMA lista, mas o clique leva ao sistema de origem
 * (em outra aba) — e o item não finge ter rascunho, publicação, PDF ou link
 * público, porque nada disso existe para ele.
 *
 * A camada mockada é a de REDE (`../api`): os hooks rodam de verdade, então o
 * teste continua sensível ao payload enviado (é ele que diferencia um relatório
 * externo de um dashboard vazio).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
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

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/shared/hooks/use-app-toast', () => ({ useAppToast: () => toast }));

vi.mock('@/shared/hooks/use-departments', () => ({
  useDepartments: () => ({
    data: { departments: [{ id: 'dep1', name: 'Fazenda' }] },
    isLoading: false,
  }),
}));

vi.mock('@/shared/components/share-artifact-dialog', () => ({
  ShareArtifactDialog: () => null,
}));

const list = vi.fn<(params: Record<string, unknown>) => Promise<DashboardsResponse>>();
const create = vi.fn<(input: unknown) => Promise<{ id: string }>>(async () => ({
  id: 'novo',
}));
const update = vi.fn<(id: string, input: unknown) => Promise<{ id: string }>>(
  async (id) => ({ id }),
);
const remove = vi.fn<(id: string) => Promise<void>>(async () => {});
const getById = vi.fn<(id: string, mode: string) => Promise<unknown>>(async () => ({}));

vi.mock('../api', () => ({
  dashboardsApi: {
    list: (params: Record<string, unknown>) => list(params),
    create: (input: unknown) => create(input),
    update: (id: string, input: unknown) => update(id, input),
    remove: (id: string) => remove(id),
    getById: (id: string, mode: string) => getById(id, mode),
    publish: vi.fn(),
    unpublish: vi.fn(),
  },
}));

const { DashboardsPage } = await import('../components/dashboards-page');

/* --------------------------------------------------------------- fixtures -- */

const EXTERNAL_URL = 'https://analytics.bi.fiscaliza.cloud/relatorio/arrecadacao';

const externo: Dashboard = {
  id: 'ext1',
  title: 'Arrecadação (legado)',
  ownerId: 'me',
  departmentId: null,
  visibility: 'ORG',
  status: 'PUBLISHED',
  externalUrl: EXTERNAL_URL,
  draftLayout: { filters: [], rows: [] },
  publishedLayout: { filters: [], rows: [] },
  publishedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const interno: Dashboard = {
  id: 'd1',
  title: 'Vendas Mensais',
  ownerId: 'me',
  departmentId: null,
  visibility: 'ORG',
  status: 'PUBLISHED',
  externalUrl: null,
  draftLayout: { filters: [], rows: [] },
  publishedLayout: { filters: [], rows: [] },
  publishedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-03T00:00:00.000Z',
};

function page(items: Dashboard[]): DashboardsResponse {
  return { dashboards: items, total: items.length, page: 1, pageSize: 12, totalPages: 1 };
}

function renderPage() {
  return renderWithProviders(<DashboardsPage />, { route: '/dashboards' });
}

/** Abre o menu "…" da linha. */
async function openRowMenu(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(await screen.findByRole('button', { name: `Ações de ${title}` }));
  return screen.findByRole('menu');
}

/** Preenche nome + endereço do formulário de relatório externo. */
async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  { title, url }: { title?: string; url: string },
) {
  const form = await screen.findByRole('form', {
    name: 'Formulário de relatório externo',
  });
  if (title !== undefined) {
    const nome = within(form).getByRole('textbox', { name: /Nome do relatório/ });
    await user.clear(nome);
    await user.type(nome, title);
  }
  const endereco = within(form).getByRole('textbox', { name: /Endereço do relatório/ });
  await user.clear(endereco);
  await user.type(endereco, url);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  authState.user = { id: 'me', role: 'CREATOR' };
  list.mockResolvedValue(page([externo, interno]));
});

/* ------------------------------------------------------------------ testes -- */

describe('Listagem — o item legado convive com os daqui', () => {
  it('o clique vai para o endereço ORIGINAL, em outra aba', async () => {
    renderPage();

    const link = await screen.findByRole('link', { name: /Arrecadação \(legado\)/ });
    expect(link).toHaveAttribute('href', EXTERNAL_URL);
    expect(link).toHaveAttribute('target', '_blank');
    // Sem `noopener`, a página aberta ganharia acesso a `window.opener`.
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('mostra "Externo" no status — não finge que a plataforma publicou algo', async () => {
    renderPage();

    const row = (
      await screen.findByRole('link', { name: /Arrecadação \(legado\)/ })
    ).closest('tr') as HTMLElement;
    expect(within(row).getByText('Externo')).toBeInTheDocument();
    // O domínio aparece sob o título: o destino é conhecido ANTES do clique.
    expect(within(row).getByText('analytics.bi.fiscaliza.cloud')).toBeInTheDocument();

    const interna = screen
      .getByRole('link', { name: 'Vendas Mensais' })
      .closest('tr') as HTMLElement;
    expect(within(interna).getByText('Publicado')).toBeInTheDocument();
  });

  it('não pré-carrega detalhe de item externo (não há o que carregar aqui)', async () => {
    renderPage();

    const link = await screen.findByRole('link', { name: /Arrecadação \(legado\)/ });
    await userEvent.setup().hover(link);

    await waitFor(() => expect(getById).not.toHaveBeenCalledWith('ext1', 'published'));
  });
});

describe('Ações do relatório externo', () => {
  it('oferece abrir/editar/remover — e nenhuma ação que dependa de layout', async () => {
    const user = userEvent.setup();
    renderPage();

    const menu = await openRowMenu(user, 'Arrecadação (legado)');
    expect(
      within(menu).getByRole('menuitem', { name: 'Abrir relatório' }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole('menuitem', { name: 'Editar cadastro' }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole('menuitem', { name: 'Remover da lista' }),
    ).toBeInTheDocument();

    for (const proibida of [
      'Publicar',
      'Despublicar',
      'Exportar',
      'Compartilhar',
      'Duplicar',
    ]) {
      expect(
        within(menu).queryByRole('menuitem', { name: proibida }),
      ).not.toBeInTheDocument();
    }
  });

  it('VIEWER só pode abrir', async () => {
    authState.user = { id: 'viewer', role: 'VIEWER' };
    const user = userEvent.setup();
    renderPage();

    const menu = await openRowMenu(user, 'Arrecadação (legado)');
    expect(
      within(menu).getByRole('menuitem', { name: 'Abrir relatório' }),
    ).toBeInTheDocument();
    expect(
      within(menu).queryByRole('menuitem', { name: 'Editar cadastro' }),
    ).not.toBeInTheDocument();
    expect(
      within(menu).queryByRole('menuitem', { name: 'Remover da lista' }),
    ).not.toBeInTheDocument();
  });
});

describe('Cadastro do relatório externo', () => {
  it('envia externalUrl (com https assumido) e NENHUM layout', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Relatório externo' }));
    await fillForm(user, {
      title: 'Painel de IPTU',
      // Sem esquema de propósito: é como o endereço costuma ser colado.
      url: 'analytics.bi.fiscaliza.cloud/iptu',
    });
    await user.click(screen.getByRole('button', { name: 'Cadastrar relatório' }));

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith({
      title: 'Painel de IPTU',
      externalUrl: 'https://analytics.bi.fiscaliza.cloud/iptu',
      visibility: 'ORG',
      departmentId: null,
    });
    // Um `draftLayout` aqui criaria um dashboard vazio DENTRO da plataforma.
    expect(create.mock.calls[0][0]).not.toHaveProperty('draftLayout');
  });

  it('envio DUPLO (dois cliques antes do primeiro terminar) cadastra uma vez só', async () => {
    // Flagrado em teste no navegador real: dois envios em ~100ms criaram dois
    // itens idênticos na lista, e ninguém sabia qual apagar. Os dois `submit`
    // aqui saem no MESMO tick, sem re-render no meio — que é a janela em que
    // `isPending`/`isLoading` ainda não protegem nada.
    const user = userEvent.setup();
    create.mockImplementationOnce(() => new Promise(() => {})); // fica em voo

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Relatório externo' }));
    const form = await fillForm(user, {
      title: 'Dobrado',
      url: 'https://bi.exemplo.gov.br/x',
    });

    fireEvent.submit(form);
    fireEvent.submit(form);

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    // Uma segunda chamada chegaria logo depois da validação assíncrona do
    // formulário — esperar um pouco é o que dá sentido à asserção.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('endereço não navegável é recusado INLINE, sem chamar a API', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Relatório externo' }));
    await fillForm(user, { title: 'Malicioso', url: 'javascript:alert(1)' });
    await user.click(screen.getByRole('button', { name: 'Cadastrar relatório' }));

    expect(
      await screen.findByText('O endereço deve ser um link http:// ou https://'),
    ).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('editar cadastro reabre com os dados atuais e salva com PATCH no id certo', async () => {
    const user = userEvent.setup();
    renderPage();

    const menu = await openRowMenu(user, 'Arrecadação (legado)');
    await user.click(within(menu).getByRole('menuitem', { name: 'Editar cadastro' }));

    const form = await screen.findByRole('form', {
      name: 'Formulário de relatório externo',
    });
    expect(within(form).getByRole('textbox', { name: /Nome do relatório/ })).toHaveValue(
      'Arrecadação (legado)',
    );
    expect(
      within(form).getByRole('textbox', { name: /Endereço do relatório/ }),
    ).toHaveValue(EXTERNAL_URL);

    await fillForm(user, { url: 'https://analytics.bi.fiscaliza.cloud/novo-caminho' });
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith('ext1', {
      title: 'Arrecadação (legado)',
      externalUrl: 'https://analytics.bi.fiscaliza.cloud/novo-caminho',
      visibility: 'ORG',
      departmentId: null,
    });
  });
});

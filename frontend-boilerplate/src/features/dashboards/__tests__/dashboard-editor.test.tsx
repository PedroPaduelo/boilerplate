import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dashboardLayoutFixture } from '@dashboards/contracts';
import { staleTimeFor } from '@/shared/lib/query-policies';
import type { DashboardDetail } from '../types';

/* ---------------------------------------------------------- polyfills ----- */
beforeAll(() => {
  const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
});

/* -------------------------------------------------------------- mocks ------ */

const { authState } = vi.hoisted(() => ({
  authState: {
    user: { id: 'me', role: 'CREATOR' } as { id: string; role: string } | null,
  },
}));

const detail: DashboardDetail = {
  id: 'dash_1',
  title: 'Dívida Ativa 2026',
  ownerId: 'me',
  departmentId: null,
  visibility: 'ORG',
  status: 'DRAFT',
  draftLayout: dashboardLayoutFixture as never,
  publishedLayout: null,
  publishedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  mode: 'draft',
  layout: dashboardLayoutFixture as never,
};

const updateMutate = vi.fn(
  (_vars: unknown, opts?: { onSuccess?: (d?: unknown) => void }) => opts?.onSuccess?.(),
);
const publishMutate = vi.fn(
  (_vars: unknown, opts?: { onSuccess?: (d?: unknown) => void }) => opts?.onSuccess?.(),
);
const addChartMutate = vi.fn();

vi.mock('../hooks', () => ({
  useDashboard: () => ({ data: detail, isLoading: false, isError: false }),
  useUpdateDashboard: () => ({ mutate: updateMutate, isPending: false }),
  usePublishDashboard: () => ({ mutate: publishMutate, isPending: false }),
  useAddChartToDashboard: () => ({ mutate: addChartMutate, isPending: false }),
}));

const useDashboardData = vi.fn((opts?: { mode?: string }) => {
  void opts; // capturado por `mock.calls` para asserção do modo de preview
  return {
    payload: undefined,
    filtersHash: '∅',
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: () => {},
  };
});
vi.mock('../use-dashboard-data', () => ({
  useDashboardData: (opts: unknown) => useDashboardData(opts as never),
}));

vi.mock('@/features/charts/hooks', () => ({
  useCharts: () => ({ data: { charts: [] }, isLoading: false }),
}));

vi.mock('@/features/auth/store', () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

// Importado depois dos mocks.
import { DashboardEditor } from '../components/dashboard-editor';

function renderEditor() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/dashboards/${detail.id}/edit`]}>
        <Routes>
          <Route path="/dashboards/:id/edit" element={<DashboardEditor />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardEditor (T-G2)', () => {
  beforeEach(() => {
    updateMutate.mockClear();
    publishMutate.mockClear();
    addChartMutate.mockClear();
    useDashboardData.mockClear();
    authState.user = { id: 'me', role: 'CREATOR' };
    detail.status = 'DRAFT';
    detail.publishedLayout = null;
    detail.draftLayout = dashboardLayoutFixture as never;
  });

  it('renderiza o editor: título, estado e os blocos do dashboard no canvas', () => {
    renderEditor();
    expect(screen.getByDisplayValue('Dívida Ativa 2026')).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    // O bloco existe no CANVAS (não como item de formulário): a prova é a ação
    // que só existe sobre um bloco desenhado.
    expect(
      screen.getByRole('button', { name: 'Editar o bloco blk_kpi_total' }),
    ).toBeInTheDocument();
    // E a linha do layout é uma região nomeada, selecionável.
    expect(screen.getByRole('button', { name: 'Visão geral' })).toBeInTheDocument();
  });

  it('editar e salvar dispara update com draftLayout saneado (e valida ok)', async () => {
    renderEditor();
    // muda o título → fica dirty → Salvar habilita
    fireEvent.change(screen.getByDisplayValue('Dívida Ativa 2026'), {
      target: { value: 'Dívida Ativa 2026 (rev)' },
    });
    const save = screen.getByRole('button', { name: /Salvar/i });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.click(save);

    expect(updateMutate).toHaveBeenCalledTimes(1);
    const arg = updateMutate.mock.calls[0][0] as {
      id: string;
      input: { title: string; draftLayout: { rows: unknown[] } };
    };
    expect(arg.id).toBe('dash_1');
    expect(arg.input.title).toBe('Dívida Ativa 2026 (rev)');
    expect(arg.input.draftLayout.rows).toHaveLength(3);
  });

  it('layout inválido bloqueia o salvar e mostra erro claro', async () => {
    renderEditor();
    // O bloco é editado onde ele está: seleciona no canvas, o inspetor abre com
    // a fonte de dados dele. Esvaziar o connectionId invalida o layout.
    fireEvent.click(screen.getByRole('button', { name: 'Editar o bloco blk_kpi_total' }));
    const conn = (await screen.findByLabelText(
      /Conexão \(connectionId\)/i,
    )) as HTMLInputElement;
    fireEvent.change(conn, { target: { value: '' } });

    const save = screen.getByRole('button', { name: /Salvar/i });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.click(save);

    expect(await screen.findByText(/Layout inválido/i)).toBeInTheDocument();
    expect(updateMutate).not.toHaveBeenCalled();
    // Timeout ampliado (não é folga arbitrária): este caso monta o editor
    // INTEIRO — filtros, abas, todas as linhas com seus blocos e o painel de
    // pré-visualização — e ainda faz dois `waitFor` encadeados. Sozinho leva
    // ~2,5s; na suíte completa, com os arquivos rodando em paralelo, encosta
    // nos 4,9s do orçamento padrão de 5s e falha por RELÓGIO, não por lógica.
    // As asserções continuam exatamente as mesmas.
  }, 15000);

  it('publicar dispara a mutation e reflete status PUBLICADO', async () => {
    renderEditor();
    const publish = screen.getByRole('button', { name: /Publicar/i });
    fireEvent.click(publish);

    expect(publishMutate).toHaveBeenCalledWith(
      { id: 'dash_1', publish: true },
      expect.anything(),
    );
    // onSuccess do mock altera o estado local → badge muda
    await waitFor(() => expect(screen.getByText('Publicado')).toBeInTheDocument());
  });

  it('modo dev (rascunho) busca dados frescos (mode=draft, staleTime 0)', () => {
    renderEditor();
    const lastOpts = useDashboardData.mock.calls.at(-1)?.[0];
    expect(lastOpts?.mode).toBe('draft');
    expect(staleTimeFor('draft')).toBe(0);
  });

  it('RBAC: usuário sem ownership não edita (403)', () => {
    authState.user = { id: 'outro', role: 'CREATOR' }; // não é dono (ownerId="me")
    renderEditor();
    expect(screen.getByText('Acesso negado')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Dívida Ativa 2026')).not.toBeInTheDocument();
  });

  it('RBAC: VIEWER não edita (403)', () => {
    authState.user = { id: 'me', role: 'VIEWER' };
    renderEditor();
    expect(screen.getByText('Acesso negado')).toBeInTheDocument();
  });
});

/**
 * Regressão do REDESENHO (Astryx): as operações do editor e os quatro estados
 * continuam alcançáveis por papel acessível — nada aqui depende de classe CSS.
 */
describe('DashboardEditor — operações e estados da tela', () => {
  beforeEach(() => {
    updateMutate.mockClear();
    publishMutate.mockClear();
    addChartMutate.mockClear();
    useDashboardData.mockClear();
    authState.user = { id: 'me', role: 'CREATOR' };
    detail.status = 'DRAFT';
    detail.publishedLayout = null;
    detail.draftLayout = dashboardLayoutFixture as never;
  });

  it('vazio: dashboard sem linhas oferece a ação de adicionar', () => {
    detail.draftLayout = { filters: [], rows: [] } as never;
    renderEditor();

    expect(screen.getByText('Dashboard sem linhas')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Adicionar linha' }).length,
    ).toBeGreaterThan(0);
    // Sem filtros o vazio também tem saída própria.
    expect(screen.getByText('Nenhum filtro neste dashboard')).toBeInTheDocument();
  });

  it('adicionar filtro insere um filtro editável na lista', async () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar filtro' }));

    await waitFor(() =>
      expect(screen.getByDisplayValue('Novo filtro')).toBeInTheDocument(),
    );
  });

  it('remover bloco tira o bloco do canvas', async () => {
    renderEditor();
    const remove = screen.getByRole('button', { name: 'Remover o bloco blk_title' });
    fireEvent.click(remove);

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Editar o bloco blk_title' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('rascunho sem publicação explica por que não dá para comparar as versões', () => {
    renderEditor();
    expect(
      screen.getByText('Publique o dashboard para comparar com a versão publicada.'),
    ).toBeInTheDocument();
  });

  /* ------------------------------------------------- canvas + inspetor ----- */

  it('selecionar um bloco abre as propriedades DELE no inspetor', async () => {
    renderEditor();
    // Antes de selecionar, o inspetor é do dashboard (título editável).
    expect(screen.getByDisplayValue('Dívida Ativa 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Editar o bloco blk_bar_mes' }));

    // Propriedades do bloco: identidade, tamanho e fonte de dados.
    expect(await screen.findByText('blk_bar_mes')).toBeInTheDocument();
    expect(screen.getByLabelText(/Altura do bloco/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Conexão \(connectionId\)/i)).toBeInTheDocument();
    // Um bloco por vez: a fonte de dados do OUTRO bloco não está mais na tela.
    expect(screen.getAllByLabelText(/Conexão \(connectionId\)/i)).toHaveLength(1);
  });

  it('selecionar uma linha abre a ALTURA da linha no inspetor', async () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Visão geral' }));

    expect(await screen.findByLabelText(/Altura da linha/i)).toBeInTheDocument();
    // O inspetor da linha também é a porta para os blocos dela.
    expect(screen.getByText('Blocos desta linha')).toBeInTheDocument();
  });

  it('fechar a seleção devolve o inspetor ao dashboard', async () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Editar o bloco blk_bar_mes' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Fechar' }));

    await waitFor(() =>
      expect(screen.getByDisplayValue('Dívida Ativa 2026')).toBeInTheDocument(),
    );
  });

  it('duplicar um bloco coloca a cópia ao lado (mesma consulta, id novo)', async () => {
    renderEditor();
    const before = screen.getAllByRole('button', { name: /^Editar o bloco/ }).length;

    fireEvent.click(
      screen.getByRole('button', { name: 'Duplicar o bloco blk_kpi_total' }),
    );

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /^Editar o bloco/ })).toHaveLength(
        before + 1,
      ),
    );
  });

  it('adicionar gráfico fica bloqueado (com motivo) enquanto há alterações não salvas', async () => {
    renderEditor();
    fireEvent.change(screen.getByDisplayValue('Dívida Ativa 2026'), {
      target: { value: 'Outro título' },
    });

    await waitFor(() =>
      expect(
        screen.getAllByText('Salve o rascunho antes de adicionar um gráfico.').length,
      ).toBeGreaterThan(0),
    );
    expect(screen.getByRole('button', { name: 'Adicionar' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});

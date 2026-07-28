/**
 * Regressão da LISTAGEM de gráficos (`/charts`).
 *
 * O que se trava aqui é o contrato observável da tela, por papel acessível:
 *
 *  - a listagem tem DUAS visões do mesmo conjunto — GRADE de cards (padrão,
 *    porque gráfico se reconhece pela forma) e TABELA (para comparar status,
 *    visibilidade e data em coluna alinhada) —, e a escolha do usuário fica
 *    guardada entre visitas;
 *  - em qualquer das duas, cada item abre o gráfico por um LINK e o menu de
 *    ações é nominal ("Ações de {título}"), senão dois itens na mesma tela
 *    ficam indistinguíveis para quem usa leitor de tela;
 *  - a faixa de resumo conta o acervo e cada célula RECORTA a lista;
 *  - a exclusão passa por um `alertdialog` (destrutivo = confirmação explícita);
 *  - os quatro estados — carregando, erro, vazio e vazio-com-filtro — aparecem
 *    com a saída certa.
 *
 * Nada é consultado por classe CSS: os nomes são gerados pelo StyleX e mudam a
 * cada build do design system.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import type { Chart } from '../types';

const {
  state,
  prefetchFn,
  deleteMutate,
  publishMutate,
  duplicateMutate,
  refetchFn,
  query,
} = vi.hoisted(() => ({
  state: { user: { id: 'me', role: 'CREATOR' } as { id: string; role: string } | null },
  prefetchFn: vi.fn(),
  deleteMutate: vi.fn(),
  publishMutate: vi.fn(),
  duplicateMutate: vi.fn(),
  refetchFn: vi.fn(),
  query: { isLoading: false, isError: false, isDeleting: false },
}));

const charts: Chart[] = [
  {
    id: 'c1',
    title: 'KPI de Receita',
    catalogType: 'kpi',
    ownerId: 'me',
    departmentId: null,
    visibility: 'ORG',
    status: 'PUBLISHED',
    draftProps: {},
    draftDataBinding: { connectionId: 'conn', query: 'select 1' },
    publishedProps: {},
    publishedDataBinding: { connectionId: 'conn', query: 'select 1' },
    publishedAt: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'c2',
    title: 'Receita por mês',
    catalogType: 'bar_chart',
    ownerId: 'outro',
    departmentId: null,
    visibility: 'PRIVATE',
    status: 'DRAFT',
    draftProps: {},
    draftDataBinding: { connectionId: 'conn', query: 'select 2' },
    publishedProps: null,
    publishedDataBinding: null,
    publishedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

vi.mock('../hooks', () => ({
  useCharts: (params: Record<string, unknown> = {}) => {
    // A faixa de resumo pede a MESMA listagem com recortes diferentes
    // (`pageSize: 1` + `status`), então o mock precisa respeitar o filtro —
    // senão "publicados" contaria o acervo inteiro e o teste passaria por acaso.
    const visible =
      params.status === undefined
        ? charts
        : charts.filter((c) => c.status === params.status);
    return {
      data: query.isError
        ? undefined
        : {
            charts: visible,
            total: visible.length,
            page: 1,
            pageSize: 12,
            totalPages: 1,
          },
      isLoading: query.isLoading,
      isError: query.isError,
      refetch: refetchFn,
    };
  },
  // A miniatura dos cards executa a query do gráfico; aqui ela nunca resolve,
  // o que mantém o teste focado no contrato da LISTAGEM.
  useChartData: () => ({ data: undefined, isError: false }),
  usePrefetchChart: () => prefetchFn,
  useDuplicateChart: () => ({ mutate: duplicateMutate, isPending: false }),
  useDeleteChart: () => ({ mutate: deleteMutate, isPending: query.isDeleting }),
  usePublishChart: () => ({ mutate: publishMutate, isPending: false }),
}));

vi.mock('@/shared/hooks/use-departments', () => ({
  useDepartments: () => ({ data: { departments: [] } }),
}));

vi.mock('@/features/auth/store', () => ({
  useAuthStore: (selector: (s: typeof state) => unknown) => selector(state),
}));

// Diálogo compartilhado (fora desta trilha) — irrelevante para o contrato aqui.
vi.mock('@/shared/components/share-artifact-dialog', () => ({
  ShareArtifactDialog: () => null,
}));

import { ChartsPage } from '../components/charts-page';

function montar(route = '/charts') {
  const user = userEvent.setup();
  renderWithProviders(<ChartsPage />, { route });
  return user;
}

/** Troca para a visão de tabela (a grade é o padrão). */
async function verComoTabela() {
  const user = montar();
  await user.click(screen.getByRole('radio', { name: 'Tabela' }));
  return user;
}

/**
 * Monta a listagem e abre o menu "…" do gráfico indicado.
 *
 * O gatilho é procurado por "Ações de {título}": com vários itens na tela, um
 * menu chamado só "Ações" não distinguiria um do outro para quem navega por
 * leitor de tela — e nem para este teste.
 */
async function abrirMenuDe(titulo: string) {
  const user = montar();
  await user.click(
    await screen.findByRole('button', { name: new RegExp(`Ações de ${titulo}`, 'i') }),
  );
  return user;
}

describe('ChartsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // O modo de exibição é preferência PERSISTIDA: sem limpar, um teste que
    // troca para tabela deixaria o próximo começar em tabela.
    window.localStorage.clear();
    state.user = { id: 'me', role: 'CREATOR' };
    query.isLoading = false;
    query.isError = false;
    query.isDeleting = false;
  });

  it('abre na GRADE de cards, com link para o detalhe de cada gráfico', () => {
    montar();

    expect(screen.getAllByTestId('chart-card')).toHaveLength(2);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'KPI de Receita' });
    expect(link).toHaveAttribute('href', '/charts/c1');
    expect(screen.getByRole('link', { name: 'Receita por mês' })).toBeInTheDocument();
  });

  it('o card diz o estado, o alcance e o tipo em TEXTO (não só por cor)', () => {
    montar();

    const cardDe = (titulo: string) =>
      screen
        .getByRole('link', { name: titulo })
        .closest('[data-testid="chart-card"]') as HTMLElement;

    const publicado = cardDe('KPI de Receita');
    expect(within(publicado).getByText('Publicado')).toBeInTheDocument();
    expect(within(publicado).getByText(/Organização/)).toBeInTheDocument();
    // Tipo em linguagem de gente, vindo do manifesto do bloco.
    expect(within(publicado).getByText('KPI')).toBeInTheDocument();

    const rascunho = cardDe('Receita por mês');
    expect(within(rascunho).getByText('Rascunho')).toBeInTheDocument();
    expect(within(rascunho).getByText(/Privado/)).toBeInTheDocument();
  });

  it('dispara o prefetch do detalhe ao passar o mouse no card', async () => {
    const user = montar();

    await user.hover(screen.getByRole('link', { name: 'KPI de Receita' }));
    expect(prefetchFn).toHaveBeenCalledWith('c1', 'draft');
  });

  it('alterna para a TABELA e mantém a escolha guardada', async () => {
    const user = await verComoTabela();

    const tabela = screen.getByRole('table');
    expect(
      within(tabela).getByRole('columnheader', { name: 'Gráfico' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('chart-card')).not.toBeInTheDocument();

    const linha = screen
      .getByRole('link', { name: 'KPI de Receita' })
      .closest('tr') as HTMLElement;
    expect(within(linha).getByText('Publicado')).toBeInTheDocument();
    expect(within(linha).getByText('Organização')).toBeInTheDocument();

    // A preferência sobrevive à próxima montagem da tela.
    expect(window.localStorage.getItem('charts:view')).toBe('"table"');
    await user.click(screen.getByRole('radio', { name: 'Grade' }));
    expect(window.localStorage.getItem('charts:view')).toBe('"grid"');
  });

  it('dispara o prefetch do detalhe ao passar o mouse na linha da tabela', async () => {
    const user = await verComoTabela();

    await user.hover(screen.getByRole('link', { name: 'KPI de Receita' }));
    expect(prefetchFn).toHaveBeenCalledWith('c1', 'draft');
  });

  it('resumo: conta o acervo e cada célula recorta a lista por estado', async () => {
    const user = montar();

    const publicados = screen.getByRole('button', { name: /Publicados/i });
    expect(within(publicados).getByText('1')).toBeInTheDocument();

    await user.click(publicados);

    await waitFor(() => {
      expect(screen.getAllByTestId('chart-card')).toHaveLength(1);
    });
    expect(screen.getByRole('link', { name: 'KPI de Receita' })).toBeInTheDocument();

    // A primeira célula é o caminho de volta para a lista inteira.
    await user.click(screen.getByRole('button', { name: /Gráficos no acervo/i }));
    await waitFor(() => {
      expect(screen.getAllByTestId('chart-card')).toHaveLength(2);
    });
  });

  it('excluir: abre um alertdialog descrevendo a consequência', async () => {
    const user = await abrirMenuDe('KPI de Receita');
    await user.click(await screen.findByRole('menuitem', { name: /Excluir/i }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/Excluir “KPI de Receita”\?/)).toBeInTheDocument();
    expect(within(dialog).getByText(/não pode ser desfeita/i)).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /Sim, excluir/i }),
    ).toBeInTheDocument();
    expect(deleteMutate).not.toHaveBeenCalled();
  });

  it('excluir: confirmar chama a mutação com o id do gráfico', async () => {
    const user = await abrirMenuDe('KPI de Receita');
    await user.click(await screen.findByRole('menuitem', { name: /Excluir/i }));

    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: /Sim, excluir/i }));

    expect(deleteMutate).toHaveBeenCalledWith('c1', expect.any(Object));
  });

  it('excluir: cancelar fecha o diálogo sem chamar a mutação', async () => {
    const user = await abrirMenuDe('KPI de Receita');
    await user.click(await screen.findByRole('menuitem', { name: /Excluir/i }));

    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: /Cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(deleteMutate).not.toHaveBeenCalled();
  });

  it('carregando: mostra o esqueleto da GRADE, nunca uma tela em branco', () => {
    query.isLoading = true;
    montar();

    expect(screen.getByLabelText('Carregando gráficos')).toBeInTheDocument();
    expect(screen.queryByTestId('chart-card')).not.toBeInTheDocument();
  });

  it('erro: mostra um aviso acionável que refaz a busca', async () => {
    query.isError = true;
    const user = montar();

    expect(
      screen.getByText(/Não foi possível carregar os gráficos/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Tentar de novo/i }));
    expect(refetchFn).toHaveBeenCalled();
  });

  it('vazio por filtro: oferece limpar os filtros', async () => {
    const user = montar();

    await user.type(
      screen.getByRole('textbox', { name: /Buscar gráficos por título/i }),
      'zzzz',
    );

    expect(
      await screen.findByRole('heading', {
        name: /Nenhum resultado para esses filtros/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Limpar filtros/i }));
    expect(screen.getAllByTestId('chart-card')).toHaveLength(2);
  });
});

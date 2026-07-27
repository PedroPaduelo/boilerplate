/**
 * Regressão da LISTAGEM de gráficos (`/charts`).
 *
 * O que se trava aqui é o contrato observável da tela, por papel acessível:
 * a lista é uma TABELA (não uma grade de cards), cada linha abre o gráfico por
 * um link, a exclusão passa por um `alertdialog` (destrutivo = confirmação
 * explícita) e os quatro estados — carregando, erro, vazio e vazio-com-filtro —
 * aparecem com a saída certa.
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
  useCharts: () => ({
    data: query.isError
      ? undefined
      : { charts, total: charts.length, page: 1, pageSize: 12, totalPages: 1 },
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: refetchFn,
  }),
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

/**
 * Monta a listagem e abre o menu "…" da LINHA do gráfico indicado.
 *
 * O gatilho é procurado por "Ações de {título}": com várias linhas na tela, um
 * menu chamado só "Ações" não distinguiria uma linha da outra para quem navega
 * por leitor de tela — e nem para este teste.
 */
async function abrirMenuDe(titulo: string) {
  const user = userEvent.setup();
  renderWithProviders(<ChartsPage />, { route: '/charts' });
  await user.click(
    await screen.findByRole('button', { name: new RegExp(`Ações de ${titulo}`, 'i') }),
  );
  return user;
}

describe('ChartsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.user = { id: 'me', role: 'CREATOR' };
    query.isLoading = false;
    query.isError = false;
    query.isDeleting = false;
  });

  it('lista os gráficos como LINHAS de uma tabela, com link para o detalhe', () => {
    renderWithProviders(<ChartsPage />, { route: '/charts' });

    const tabela = screen.getByRole('table');
    expect(
      within(tabela).getByRole('columnheader', { name: 'Gráfico' }),
    ).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'KPI de Receita' });
    expect(link).toHaveAttribute('href', '/charts/c1');
    expect(screen.getByRole('link', { name: 'Receita por mês' })).toBeInTheDocument();
  });

  it('mostra status e visibilidade em texto (não só por cor)', () => {
    renderWithProviders(<ChartsPage />, { route: '/charts' });

    // Escopado por LINHA: os mesmos rótulos são opções dos seletores de
    // Status/Visibilidade da barra de filtros, então uma busca global casaria
    // duas vezes sem que a tabela esteja repetindo nada.
    const publicado = screen.getByRole('link', { name: 'KPI de Receita' }).closest('tr')!;
    expect(within(publicado).getByText('Publicado')).toBeInTheDocument();
    expect(within(publicado).getByText('Organização')).toBeInTheDocument();

    const rascunho = screen.getByRole('link', { name: 'Receita por mês' }).closest('tr')!;
    expect(within(rascunho).getByText('Rascunho')).toBeInTheDocument();
    expect(within(rascunho).getByText('Privado')).toBeInTheDocument();
  });

  it('dispara o prefetch do detalhe ao passar o mouse na linha', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChartsPage />, { route: '/charts' });

    await user.hover(screen.getByRole('link', { name: 'KPI de Receita' }));
    expect(prefetchFn).toHaveBeenCalledWith('c1', 'draft');
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

  it('carregando: mostra o esqueleto da tabela, nunca uma tela em branco', () => {
    query.isLoading = true;
    renderWithProviders(<ChartsPage />, { route: '/charts' });

    expect(screen.getByLabelText('Carregando gráficos')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('erro: mostra um aviso acionável que refaz a busca', async () => {
    query.isError = true;
    const user = userEvent.setup();
    renderWithProviders(<ChartsPage />, { route: '/charts' });

    expect(
      screen.getByText(/Não foi possível carregar os gráficos/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Tentar de novo/i }));
    expect(refetchFn).toHaveBeenCalled();
  });

  it('vazio por filtro: oferece limpar os filtros', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChartsPage />, { route: '/charts' });

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
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});

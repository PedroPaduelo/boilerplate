import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayoutDashboard } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { ListItem } from '@astryxdesign/core/List';
import { renderWithProviders } from '@/test/render';
import { DEFAULT_ARTIFACT_FILTERS } from '@/shared/lib/artifact-filters';
import { ArtifactListView, type ArtifactListViewProps } from '../artifact-list-view';

function renderView(overrides: Partial<ArtifactListViewProps> = {}) {
  const props: ArtifactListViewProps = {
    eyebrow: 'Artefatos',
    title: 'Dashboards',
    description: 'Explore, busque e gerencie os dashboards visíveis para você.',
    emptyIcon: LayoutDashboard,
    noun: { singular: 'dashboard', plural: 'dashboards' },
    searchPlaceholder: 'Buscar dashboards por título…',
    filters: DEFAULT_ARTIFACT_FILTERS,
    onFiltersChange: vi.fn(),
    departments: [{ id: 'dep-1', name: 'Financeiro' }],
    isLoading: false,
    isError: false,
    isEmpty: false,
    shownCount: 2,
    page: 1,
    totalPages: 1,
    onPageChange: vi.fn(),
    children: (
      <>
        <ListItem label="Vendas Mensais" />
        <ListItem label="Receita por Região" />
      </>
    ),
    ...overrides,
  };
  return { props, ...renderWithProviders(<ArtifactListView {...props} />) };
}

describe('ArtifactListView — cabeçalho e filtros', () => {
  it('anuncia a tela com um heading e a ação primária', () => {
    renderView({
      headerAction: <Button label="Novo dashboard" variant="primary" />,
    });

    expect(screen.getByRole('heading', { name: 'Dashboards' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo dashboard' })).toBeInTheDocument();
  });

  it('busca e filtros têm nome acessível e reportam a mudança', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderView({ onFiltersChange });

    const search = screen.getByRole('textbox', { name: 'Buscar por título' });
    await user.type(search, 'v');
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_ARTIFACT_FILTERS,
      search: 'v',
    });

    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Visibilidade' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Departamento' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Dono' })).toBeInTheDocument();
  });
});

describe('ArtifactListView — os quatro estados', () => {
  it('carregando: esqueleto anunciado, nunca uma área em branco', () => {
    renderView({ isLoading: true });

    expect(
      screen.getByRole('status', { name: 'Carregando dashboards' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Vendas Mensais')).not.toBeInTheDocument();
  });

  it('erro: banner acionável e filtros inertes', () => {
    renderView({ isError: true });

    const alert = screen.getByRole('alert');
    expect(
      within(alert).getByText('Não foi possível carregar dashboards'),
    ).toBeInTheDocument();
    expect(
      within(alert).getByRole('button', { name: 'Tentar de novo' }),
    ).toBeInTheDocument();
    // O DS desabilita de forma acessível (`aria-disabled` + motivo), em vez de
    // remover o campo do foco — quem navega por teclado ainda o encontra.
    expect(screen.getByRole('textbox', { name: 'Buscar por título' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('vazio por filtro: a saída oferecida é limpar o filtro', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderView({
      isEmpty: true,
      filters: { ...DEFAULT_ARTIFACT_FILTERS, search: 'zzz' },
      onFiltersChange,
    });

    expect(screen.getByText('Nenhum resultado para esses filtros')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(onFiltersChange).toHaveBeenCalledWith(DEFAULT_ARTIFACT_FILTERS);
  });

  it('vazio de primeiro uso: texto do produto + ação de criar', () => {
    renderView({
      isEmpty: true,
      emptyTitle: 'Crie seu primeiro dashboard',
      emptyDescription: 'Monte um painel do zero ou peça ao agente.',
      emptyAction: <Button label="Novo dashboard" variant="primary" />,
    });

    expect(screen.getByText('Crie seu primeiro dashboard')).toBeInTheDocument();
    expect(
      screen.getByText('Monte um painel do zero ou peça ao agente.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo dashboard' })).toBeInTheDocument();
  });

  it('vazio sem textos do produto cai num fallback com o substantivo certo', () => {
    renderView({ isEmpty: true });
    expect(screen.getByText('Nenhum dashboard por aqui ainda')).toBeInTheDocument();
  });
});

describe('ArtifactListView — sucesso', () => {
  it('apresenta os itens em UMA lista, com a contagem da página', () => {
    renderView();

    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText(/2 dashboards nesta página/)).toBeInTheDocument();
  });

  it('sem páginas extras, nenhuma paginação é desenhada', () => {
    renderView({ totalPages: 1 });
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('com mais de uma página, a paginação navega', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    renderView({ page: 1, totalPages: 3, onPageChange });

    await user.click(screen.getByRole('button', { name: /2/ }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

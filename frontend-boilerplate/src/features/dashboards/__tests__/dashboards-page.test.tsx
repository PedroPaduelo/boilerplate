import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Dashboard } from '../types';

// Polyfills que o Radix (DropdownMenu) usa e o jsdom não implementa.
beforeAll(() => {
  const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
});

/* ------------------------------------------------------------------ mocks -- */

const { state, prefetchFn } = vi.hoisted(() => ({
  // Estado de auth mutável entre testes (papel/usuário logado).
  state: { user: { id: 'me', role: 'CREATOR' } as { id: string; role: string } | null },
  prefetchFn: vi.fn(),
}));

const dashboards: Dashboard[] = [
  {
    id: 'd1',
    title: 'Vendas Mensais',
    ownerId: 'me',
    departmentId: null,
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

vi.mock('../hooks', () => ({
  useDashboards: () => ({
    data: {
      dashboards,
      total: dashboards.length,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    },
    isLoading: false,
    isError: false,
  }),
  usePrefetchDashboard: () => prefetchFn,
  useDuplicateDashboard: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteDashboard: () => ({ mutate: vi.fn(), isPending: false }),
  usePublishDashboard: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/shared/hooks/use-departments', () => ({
  useDepartments: () => ({ data: { departments: [] } }),
}));

vi.mock('@/features/auth/store', () => ({
  useAuthStore: (selector: (s: typeof state) => unknown) => selector(state),
}));

// Importado depois dos mocks.
import { DashboardsPage } from '../components/dashboards-page';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardsPage', () => {
  beforeEach(() => {
    prefetchFn.mockClear();
    state.user = { id: 'me', role: 'CREATOR' };
  });

  it('renderiza os cards da lista (dados mock)', () => {
    renderPage();
    expect(screen.getByText('Vendas Mensais')).toBeInTheDocument();
    expect(screen.getByText('Receita por Região')).toBeInTheDocument();
  });

  it('dispara prefetch ao passar o mouse no card (hover)', () => {
    renderPage();
    const card = screen.getByText('Vendas Mensais').closest('[data-slot="card"]')!;
    fireEvent.mouseEnter(card);
    expect(prefetchFn).toHaveBeenCalledWith('d1', 'published');
  });

  it('VIEWER NÃO vê ações de editar/publicar/excluir no menu', async () => {
    state.user = { id: 'viewer', role: 'VIEWER' };
    const user = userEvent.setup();
    renderPage();

    // Abre o menu de ações do primeiro card.
    const trigger = screen.getByRole('button', { name: /Ações de Vendas Mensais/i });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Abrir/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('menuitem', { name: /Exportar/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Editar/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /Despublicar|Publicar/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Excluir/i })).not.toBeInTheDocument();
  });

  it('CREATOR dono vê editar e despublicar (publicado próprio)', async () => {
    const user = userEvent.setup();
    renderPage();
    const trigger = screen.getByRole('button', { name: /Ações de Vendas Mensais/i });
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Editar/i })).toBeInTheDocument();
    });
    expect(
      screen.getByRole('menuitem', { name: /Despublicar/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Excluir/i })).toBeInTheDocument();
  });
});

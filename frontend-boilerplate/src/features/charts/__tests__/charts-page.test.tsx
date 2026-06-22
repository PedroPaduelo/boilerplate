import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Chart } from '../types';

const { state, prefetchFn } = vi.hoisted(() => ({
  state: { user: { id: 'me', role: 'CREATOR' } as { id: string; role: string } | null },
  prefetchFn: vi.fn(),
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
];

vi.mock('../hooks', () => ({
  useCharts: () => ({
    data: { charts, total: 1, page: 1, pageSize: 12, totalPages: 1 },
    isLoading: false,
    isError: false,
  }),
  usePrefetchChart: () => prefetchFn,
  useDuplicateChart: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteChart: () => ({ mutate: vi.fn(), isPending: false }),
  usePublishChart: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/shared/hooks/use-departments', () => ({
  useDepartments: () => ({ data: { departments: [] } }),
}));

vi.mock('@/features/auth/store', () => ({
  useAuthStore: (selector: (s: typeof state) => unknown) => selector(state),
}));

import { ChartsPage } from '../components/charts-page';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ChartsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ChartsPage', () => {
  beforeEach(() => {
    prefetchFn.mockClear();
    state.user = { id: 'me', role: 'CREATOR' };
  });

  it('renderiza os cards de gráficos (dados mock)', () => {
    renderPage();
    expect(screen.getByText('KPI de Receita')).toBeInTheDocument();
  });

  it('dispara prefetch no hover do card', () => {
    renderPage();
    const card = screen.getByText('KPI de Receita').closest('[data-slot="card"]')!;
    fireEvent.mouseEnter(card);
    expect(prefetchFn).toHaveBeenCalledWith('c1', 'published');
  });
});

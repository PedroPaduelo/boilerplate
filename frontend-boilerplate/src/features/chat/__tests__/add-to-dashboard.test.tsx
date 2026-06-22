import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BlockDataResult } from '@dashboards/contracts';
import { useAuthStore } from '@/features/auth/store';
import type { ChatChartPayload } from '../transport';

/* Mocks das listagens (sem rede). */
vi.mock('@/features/dashboards/hooks', () => ({
  useDashboards: () => ({
    data: {
      dashboards: [
        {
          id: 'dash1',
          title: 'Painel de Demonstração',
          ownerId: 'me',
          status: 'DRAFT',
          visibility: 'ORG',
          departmentId: null,
        },
      ],
    },
    isLoading: false,
  }),
}));
vi.mock('@/features/connections/hooks', () => ({
  useConnections: () => ({
    data: { connections: [{ id: 'conn1', name: 'Postgres Prefeitura' }] },
    isLoading: false,
  }),
}));

/* Mocks da API REAL usada pela mutation. */
const createChart = vi.fn<(input: unknown) => Promise<{ id: string }>>(
  async () => ({ id: 'chart_new' }),
);
const addChart = vi.fn<(id: string, input: unknown) => Promise<{ id: string }>>(
  async () => ({ id: 'dash1' }),
);
vi.mock('@/features/charts/api', () => ({
  chartsApi: { create: (input: unknown) => createChart(input) },
}));
vi.mock('@/features/dashboards/api', () => ({
  dashboardsApi: {
    addChart: (id: string, input: unknown) => addChart(id, input),
  },
}));

import { AddToDashboardDialog } from '../components/add-to-dashboard-dialog';

const chart: ChatChartPayload = {
  title: 'Arrecadação por mês',
  catalogType: 'bar_chart',
  props: { orientation: 'vertical' },
  result: { blockId: 'mock_bar', state: 'success', shape: 'series', data: [] } as BlockDataResult,
  dataBinding: { connectionId: '__mock__', query: 'SELECT mes, valor FROM x', ttlSeconds: 3600 },
};

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AddToDashboardDialog chart={chart} open onOpenChange={() => {}} />
    </QueryClientProvider>,
  );
}

describe('AddToDashboardDialog (usa a API REAL)', () => {
  beforeEach(() => {
    createChart.mockClear();
    addChart.mockClear();
    useAuthStore.setState({
      user: {
        id: 'me',
        email: 'a@x',
        name: 'A',
        role: 'ADMIN',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      token: 't',
      isAuthenticated: true,
      isHydrated: true,
    });
  });

  it('cria o Chart (POST /charts) e adiciona ao dashboard (POST /dashboards/:id/blocks)', async () => {
    renderDialog();

    // defaults efetivos já selecionam dash1 + conn1 → basta confirmar.
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => expect(createChart).toHaveBeenCalledTimes(1));

    // 1) cria o Chart materializando o dataBinding na conexão REAL escolhida
    expect(createChart).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Arrecadação por mês',
        catalogType: 'bar_chart',
        draftDataBinding: expect.objectContaining({
          connectionId: 'conn1',
          query: 'SELECT mes, valor FROM x',
        }),
      }),
    );

    // 2) adiciona ao dashboard com o chartId criado (API CORRETA + payload certo)
    await waitFor(() => expect(addChart).toHaveBeenCalledTimes(1));
    expect(addChart).toHaveBeenCalledWith('dash1', { chartId: 'chart_new' });
  });
});

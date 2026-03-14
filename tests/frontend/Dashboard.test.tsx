import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Toaster } from '@/shared/components/ui/sonner';
import { DashboardPage } from '@/features/dashboard';
import { dashboardApi } from '@/features/dashboard/api';
import {
  mockDashboardStats,
  mockTimeSeriesData,
  mockAgentDistribution,
  mockActivityByHour,
  mockTopAgents,
  mockTableData,
} from './__mocks__/dashboard-api';

vi.mock('@/features/dashboard/api', () => ({
  dashboardApi: {
    getStats: vi.fn(),
    getTimeSeriesData: vi.fn(),
    getAgentDistribution: vi.fn(),
    getActivityByHour: vi.fn(),
    getTopAgents: vi.fn(),
    getTableData: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (component: React.ReactNode) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const setupMockQueries = (queriesOverrides: Record<string, { data: any; isLoading: boolean }> = {}) => {
  (useQuery as ReturnType<typeof vi.fn>).mockImplementation(({ queryKey }) => {
    const key = queryKey[1] as string;
    if (queriesOverrides[key]) {
      return queriesOverrides[key];
    }
    return { data: undefined, isLoading: false };
  });
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard header with title', async () => {
    setupMockQueries({
      stats: { data: mockDashboardStats, isLoading: false },
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });
  });

  it('renders KPI stat cards with correct values', async () => {
    setupMockQueries({
      stats: { data: mockDashboardStats, isLoading: false },
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Usuários')).toBeInTheDocument();
    });

    expect(screen.getByText('1,2K')).toBeInTheDocument();
    expect(screen.getByText('Agentes Ativos')).toBeInTheDocument();
    expect(screen.getByText('56')).toBeInTheDocument();
    expect(screen.getByText('Conversas')).toBeInTheDocument();
    expect(screen.getByText('7,9K')).toBeInTheDocument();
  });

  it('shows loading skeletons while data is loading', () => {
    setupMockQueries({
      stats: { data: undefined, isLoading: true },
    });

    renderWithProviders(<DashboardPage />);

    const skeletons = document.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders date range selector', async () => {
    setupMockQueries({
      stats: { data: mockDashboardStats, isLoading: false },
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Últimos 30 dias')).toBeInTheDocument();
    });
  });

  it('renders data table when table data is available', async () => {
    setupMockQueries({
      stats: { data: mockDashboardStats, isLoading: false },
      tableData: { data: mockTableData, isLoading: false },
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Atividade Recente')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('renders charts when data is available', async () => {
    setupMockQueries({
      stats: { data: mockDashboardStats, isLoading: false },
      timeSeries: { data: mockTimeSeriesData, isLoading: false },
      agentDistribution: { data: mockAgentDistribution, isLoading: false },
      activityByHour: { data: mockActivityByHour, isLoading: false },
      topAgents: { data: mockTopAgents, isLoading: false },
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Uso ao Longo do Tempo')).toBeInTheDocument();
    });

    expect(screen.getByText('Distribuição por Agente')).toBeInTheDocument();
    expect(screen.getByText('Atividade por Horário')).toBeInTheDocument();
    expect(screen.getByText('Top Agentes por Uso')).toBeInTheDocument();
  });
});

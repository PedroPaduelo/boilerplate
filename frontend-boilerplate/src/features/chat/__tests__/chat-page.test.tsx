import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BlockDataResult } from '@dashboards/contracts';
import { useAuthStore } from '@/features/auth/store';
import type {
  ChatChartPayload,
  ChatEvent,
  ChatTransport,
} from '../transport';

/* As listagens do diálogo "adicionar ao dashboard" não devem bater na rede. */
vi.mock('@/features/dashboards/hooks', () => ({
  useDashboards: () => ({ data: { dashboards: [] }, isLoading: false }),
}));
vi.mock('@/features/connections/hooks', () => ({
  useConnections: () => ({ data: { connections: [] }, isLoading: false }),
}));

import { ChatPage } from '../components/chat-page';

const chartResult: BlockDataResult = {
  blockId: 'mock_bar',
  state: 'success',
  shape: 'series',
  data: [
    { x: 'Jan', y: 120000 },
    { x: 'Fev', y: 98000 },
  ],
} as BlockDataResult;

const chartPayload: ChatChartPayload = {
  title: 'Arrecadação por mês',
  catalogType: 'bar_chart',
  props: { orientation: 'vertical' },
  result: chartResult,
  dataBinding: { connectionId: '__mock__', query: 'SELECT 1' },
};

/** Transport FALSO injetado (prova que a UI funciona com qualquer ChatTransport). */
const fakeTransport: ChatTransport = {
  async *sendMessage(): AsyncIterable<ChatEvent> {
    yield { type: 'message_start', messageId: 'a1' };
    yield { type: 'text_delta', messageId: 'a1', delta: 'Aqui está ' };
    yield { type: 'text_delta', messageId: 'a1', delta: 'o gráfico.' };
    yield { type: 'chart', messageId: 'a1', chart: chartPayload };
    yield { type: 'message_end', messageId: 'a1' };
  },
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChatPage transport={fakeTransport} />
    </QueryClientProvider>,
  );
}

describe('ChatPage (chat embutido mockado)', () => {
  beforeEach(() => {
    // usuário ADMIN → canManage true (mostra "adicionar ao dashboard").
    useAuthStore.setState({
      user: {
        id: 'me',
        email: 'admin@x',
        name: 'Admin',
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

  it('envia mensagem → resposta em streaming → gráfico inline renderiza (BlockRenderer)', async () => {
    renderPage();

    const input = screen.getByLabelText('Mensagem') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'mostre arrecadação por mês' } });
    fireEvent.click(screen.getByLabelText('Enviar'));

    // a mensagem do usuário aparece
    await waitFor(() =>
      expect(screen.getByText('mostre arrecadação por mês')).toBeInTheDocument(),
    );

    // o texto do assistente (montado pelos deltas) aparece
    await waitFor(() =>
      expect(screen.getByText('Aqui está o gráfico.')).toBeInTheDocument(),
    );

    // o gráfico inline renderiza via render-engine (bloco bar_chart, estado success)
    await waitFor(() => {
      const block = document.querySelector('[data-block-type="bar_chart"]');
      expect(block).not.toBeNull();
      expect(block?.getAttribute('data-block-state')).toBe('success');
    });

    // título do gráfico + botão de adicionar ao dashboard (RBAC: ADMIN)
    expect(screen.getByText('Arrecadação por mês')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Adicionar a um dashboard'),
    ).toBeInTheDocument();
  });
});

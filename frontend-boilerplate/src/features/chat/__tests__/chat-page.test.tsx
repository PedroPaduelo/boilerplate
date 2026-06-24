import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store';

/* Mock das listagens do diálogo. */
vi.mock('@/features/dashboards/hooks', () => ({
  useDashboards: () => ({ data: { dashboards: [] }, isLoading: false }),
}));
vi.mock('@/features/connections/hooks', () => ({
  useConnections: () => ({ data: { connections: [] }, isLoading: false }),
}));

/* Mock da API do agent — simula conversa + health. */
vi.mock('../api', () => ({
  agentApi: {
    listConversations: vi.fn().mockResolvedValue([
      {
        id: 'conv1',
        title: 'Teste',
        userId: 'me',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      },
    ]),
    createConversation: vi.fn().mockResolvedValue({
      id: 'conv_new',
      title: 'Nova conversa',
      userId: 'me',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    getConversation: vi.fn().mockResolvedValue({
      id: 'conv1',
      title: 'Teste',
      userId: 'me',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    }),
    deleteConversation: vi.fn().mockResolvedValue(undefined),
    updateConversation: vi.fn().mockResolvedValue({ id: 'conv1', title: 'Teste' }),
    checkHealth: vi.fn().mockResolvedValue({ configured: true, model: 'test' }),
  },
}));

/* Mock do HttpChatTransport — simula streaming do agent. */
vi.mock('../transport/http-transport', () => ({
  HttpChatTransport: vi.fn().mockImplementation(() => ({
    sendMessage: async function* () {
      yield { type: 'message_start', messageId: 'a1' };
      yield { type: 'text_delta', messageId: 'a1', delta: 'Olá!' };
      yield { type: 'message_end', messageId: 'a1' };
    },
  })),
}));

import { ChatPage } from '../components/chat-page';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChatPage />
    </QueryClientProvider>,
  );
}

describe('ChatPage (agent integrado)', () => {
  beforeEach(() => {
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

  it('renderiza sidebar + cria conversa', async () => {
    renderPage();

    // Botão "Nova conversa" aparece
    await waitFor(() => {
      expect(screen.getByText('Nova conversa')).toBeInTheDocument();
    });
  });

  it('mostra conversas na sidebar', async () => {
    renderPage();

    // A conversa mockada aparece na sidebar
    await waitFor(() => {
      const els = screen.getAllByText('Teste');
      expect(els.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});

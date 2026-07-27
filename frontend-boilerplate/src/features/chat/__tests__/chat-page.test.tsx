/**
 * Contrato da tela do chat: a lista de conversas, o cabeçalho da conversa
 * aberta, o vazio com sugestões que já disparam a pergunta e o composer.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';

vi.mock('@/shared/socket', () => ({
  useSocket: () => ({ getSocket: () => null, connected: false }),
}));

const { startRun } = vi.hoisted(() => ({
  // Assinatura explícita: o dublê aceita os mesmos argumentos do transporte
  // real (é o que permite `toHaveBeenCalledWith` validar o contrato) e devolve
  // um id derivado deles, para que uma troca de ordem apareça no teste.
  startRun: vi.fn(async (conversationId: string, message: string) => ({
    runId: `run:${conversationId}:${message.length}`,
  })),
}));

vi.mock('../transport/socket-transport', () => ({
  attachToConversation: () => () => {},
  fetchRunState: async () => null,
  startRun: (conversationId: string, message: string) =>
    startRun(conversationId, message),
}));

const { agentApi } = vi.hoisted(() => ({
  agentApi: {
    listConversations: vi.fn(),
    createConversation: vi.fn(),
    getConversation: vi.fn(),
    deleteConversation: vi.fn(),
    checkHealth: vi.fn(),
  },
}));

vi.mock('../api', () => ({ agentApi }));

import { ChatPage } from '../components/chat-page';

const CONVERSATION = {
  id: 'conv1',
  title: 'Vendas por mês',
  userId: 'me',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agentApi.listConversations.mockResolvedValue([CONVERSATION]);
    agentApi.getConversation.mockResolvedValue({ ...CONVERSATION, messages: [] });
    agentApi.createConversation.mockResolvedValue({ ...CONVERSATION, id: 'conv2' });
    agentApi.deleteConversation.mockResolvedValue(undefined);
    agentApi.checkHealth.mockResolvedValue({ configured: true, model: 'test' });
  });

  it('lista as conversas e abre a primeira', async () => {
    renderWithProviders(<ChatPage />, { route: '/chat' });

    expect(
      await screen.findByRole('button', { name: 'Vendas por mês' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Vendas por mês' }),
    ).toBeInTheDocument();
  });

  it('mostra o composer e as sugestões de partida na conversa vazia', async () => {
    renderWithProviders(<ChatPage />, { route: '/chat' });

    expect(await screen.findByLabelText('Mensagem')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'O que você quer investigar hoje?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gerar um gráfico/ })).toBeInTheDocument();
  });

  it('clicar numa sugestão envia a pergunta ao agente', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPage />, { route: '/chat' });

    await user.click(await screen.findByRole('button', { name: /Gerar um gráfico/ }));

    await waitFor(() => expect(startRun).toHaveBeenCalledTimes(1));
    expect(startRun).toHaveBeenCalledWith(
      'conv1',
      'Monte um gráfico de barras com o total por mês no último ano.',
    );
  });

  it('sem agente configurado, avisa e desabilita o envio', async () => {
    agentApi.checkHealth.mockResolvedValue({ configured: false, model: '' });
    renderWithProviders(<ChatPage />, { route: '/chat' });

    expect(await screen.findByText('Agente indisponível')).toBeInTheDocument();
    expect(await screen.findByText(/ANTHROPIC_API_KEY/)).toBeInTheDocument();
  });

  it('sem conversas, oferece criar a primeira', async () => {
    agentApi.listConversations.mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithProviders(<ChatPage />, { route: '/chat' });

    expect(
      await screen.findByRole('heading', { name: 'Nenhuma conversa ainda' }),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Nova conversa' })[0]!);
    await waitFor(() => expect(agentApi.createConversation).toHaveBeenCalledTimes(1));
  });

  it('falha ao listar → banner acionável que refaz a busca', async () => {
    agentApi.listConversations.mockRejectedValueOnce(new Error('boom'));
    const user = userEvent.setup();
    renderWithProviders(<ChatPage />, { route: '/chat' });

    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByText('Não foi possível carregar as conversas'),
    ).toBeInTheDocument();

    await user.click(within(alert).getByRole('button', { name: 'Tentar de novo' }));
    await waitFor(() => expect(agentApi.listConversations).toHaveBeenCalledTimes(2));
  });

  it('excluir a conversa pede confirmação antes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPage />, { route: '/chat' });

    await user.click(await screen.findByRole('button', { name: 'Excluir conversa' }));
    expect(agentApi.deleteConversation).not.toHaveBeenCalled();

    await user.click(
      await screen.findByRole('button', { name: 'Excluir definitivamente' }),
    );
    await waitFor(() =>
      expect(agentApi.deleteConversation).toHaveBeenCalledWith('conv1'),
    );
  });
});

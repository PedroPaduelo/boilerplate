/**
 * Regressão de mobile no chat.
 *
 * Medido num iPhone de 390px de largura, antes: a lista de conversas era fixa
 * em 256px (66% da tela) e sobrava tão pouco espaço que o campo de digitar
 * ficava com 8px. O contrato travado aqui é o comportamento, não o pixel:
 * abaixo de `md` a lista sai do fluxo e passa a ser acionada por um botão.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';

vi.mock('@/shared/socket', () => ({
  useSocket: () => ({ getSocket: () => null, connected: false }),
}));

vi.mock('../transport/socket-transport', () => ({
  attachToConversation: () => () => {},
  fetchRunState: async () => null,
  startRun: async () => ({ runId: 'run_1' }),
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
  id: 'c1',
  title: 'Vendas por mês',
  userId: 'me',
  createdAt: '',
  updatedAt: '',
};

/** Faz `useMediaQuery('(max-width: 767px)')` responder verdadeiro. */
function useCompactViewport() {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: query.includes('max-width: 767px'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

describe('ChatPage no mobile', () => {
  let restoreViewport: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    agentApi.listConversations.mockResolvedValue([CONVERSATION]);
    agentApi.getConversation.mockResolvedValue({ ...CONVERSATION, messages: [] });
    agentApi.createConversation.mockResolvedValue({ ...CONVERSATION, id: 'c2' });
    agentApi.deleteConversation.mockResolvedValue(undefined);
    agentApi.checkHealth.mockResolvedValue({ configured: true, model: 'x' });
    restoreViewport = useCompactViewport();
  });

  afterEach(() => restoreViewport());

  it('tira a lista fixa do fluxo e oferece o botão que a abre', async () => {
    renderWithProviders(<ChatPage />, { route: '/chat' });

    expect(
      await screen.findByRole('button', { name: 'Ver conversas' }),
    ).toBeInTheDocument();
    // A lista não está visível: seus controles não existem na tela.
    expect(
      screen.queryByRole('button', { name: 'Nova conversa' }),
    ).not.toBeInTheDocument();
  });

  it('abre o diálogo com a lista ao tocar no botão', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPage />, { route: '/chat' });

    await user.click(await screen.findByRole('button', { name: 'Ver conversas' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('button', { name: 'Nova conversa' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Vendas por mês' }),
    ).toBeInTheDocument();
  });

  it('escolher uma conversa fecha o diálogo', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatPage />, { route: '/chat' });

    await user.click(await screen.findByRole('button', { name: 'Ver conversas' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Vendas por mês' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

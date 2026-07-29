/**
 * O FIM DO TURNO NÃO PODE APAGAR A RESPOSTA.
 *
 * Relato de produção: o agente responde, o texto aparece inteiro, e no instante
 * em que o turno fecha a resposta some da tela — sobra a pergunta do usuário,
 * como se ninguém tivesse respondido.
 *
 * A causa é a recarga do histórico disparada por `chat:turn-complete`: ela
 * substituía o que estava na tela pelo que o servidor devolvesse, mesmo quando
 * o servidor devolvia MENOS (a persistência da resposta falhou, atrasou, ou a
 * leitura pegou o estado anterior). Uma resposta que o usuário já leu não pode
 * desaparecer por causa de uma releitura de histórico.
 *
 * Estes testes cobrem o ciclo inteiro pelo caminho real: socket → reducer →
 * tela.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import type { ChatEvent } from '../transport';

/** Socket falso: guarda os handlers para o teste disparar os eventos. */
const socket = vi.hoisted(() => {
  const handlers = new Map<string, Set<(payload: unknown) => void>>();
  return {
    on(event: string, handler: (payload: unknown) => void) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
    },
    off(event: string, handler: (payload: unknown) => void) {
      handlers.get(event)?.delete(handler);
    },
    emit: vi.fn(),
    /** Dispara um evento do servidor para quem estiver escutando. */
    server(event: string, payload: unknown) {
      for (const handler of handlers.get(event) ?? []) handler(payload);
    },
    reset() {
      handlers.clear();
    },
  };
});

vi.mock('@/shared/socket', () => ({
  useSocket: () => ({ getSocket: () => socket, connected: true }),
}));

/** Canal do transporte: o teste empurra eventos como o socket empurraria. */
const transport = vi.hoisted(() => ({
  listeners: new Set<(event: unknown) => void>(),
  push(event: unknown) {
    for (const listener of this.listeners) listener(event);
  },
  startRun: vi.fn(async () => ({ runId: 'run_1' })),
}));

vi.mock('../transport/socket-transport', () => ({
  attachToConversation: (
    _conversationId: string,
    { onEvent }: { onEvent: (event: unknown) => void },
  ) => {
    transport.listeners.add(onEvent);
    return () => transport.listeners.delete(onEvent);
  },
  fetchRunState: async () => null,
  startRun: () => transport.startRun(),
}));

const { agentApi } = vi.hoisted(() => ({
  agentApi: {
    listConversations: vi.fn(),
    createConversation: vi.fn(),
    getConversation: vi.fn(),
    deleteConversation: vi.fn(),
    updateConversation: vi.fn(),
    checkHealth: vi.fn(),
  },
}));

vi.mock('../api', () => ({ agentApi }));

import { ChatConversation } from '../components/chat-conversation';

const CONVERSATION = {
  id: 'conv1',
  title: 'Auditoria',
  userId: 'me',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const RESPOSTA =
  'Foram 128 notas em julho, 32% abaixo de junho. A queda se concentra no canal digital.';

/**
 * O texto visível da conversa, normalizado.
 *
 * O markdown do DS fatia a resposta em vários `<span>` (é o que dá o efeito de
 * revelação), então um `getByText` casaria com o pedaço em vez da frase. Quem
 * responde a pergunta "a resposta está na tela?" é o texto inteiro.
 */
function textoDaTela(): string {
  return (document.body.textContent ?? '').replace(/\s+/g, ' ');
}

/**
 * Fecha o turno como o servidor fecha: `chat:done` e, no tick seguinte,
 * `chat:turn-complete`. Os dois eventos chegam separados na rede — juntar os
 * dois no mesmo tick esconderia justamente a recarga que apaga a resposta.
 */
async function fecharTurno() {
  await act(async () => {
    transport.push({ type: 'message_end', messageId: 'asg_1', text: RESPOSTA });
  });
  await act(async () => {
    socket.server('chat:turn-complete', { conversationId: 'conv1' });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** Uma pergunta enviada e respondida inteira, pelo caminho real. */
async function perguntarEReceberResposta() {
  const user = userEvent.setup();
  renderWithProviders(<ChatConversation conversationId="conv1" isAgentReady />, {
    route: '/chat',
  });

  const composer = await screen.findByLabelText('Mensagem');
  await user.click(composer);
  await user.keyboard('quantas notas em julho?');
  await user.keyboard('{Enter}');

  await waitFor(() => expect(transport.startRun).toHaveBeenCalled());

  const deltas: ChatEvent[] = [
    { type: 'text_delta', messageId: 'asg_1', delta: RESPOSTA },
  ];
  for (const event of deltas) transport.push(event);

  await waitFor(() => expect(textoDaTela()).toContain('128 notas em julho'));
  return user;
}

describe('fim do turno', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socket.reset();
    transport.listeners.clear();
    agentApi.getConversation.mockResolvedValue({ ...CONVERSATION, messages: [] });
    agentApi.checkHealth.mockResolvedValue({ configured: true, model: 'test' });
  });

  it('a resposta continua na tela depois que o turno fecha', async () => {
    await perguntarEReceberResposta();

    // O servidor já persistiu: a recarga devolve os dois lados da conversa.
    agentApi.getConversation.mockResolvedValue({
      ...CONVERSATION,
      messages: [
        {
          id: 'msg_1',
          conversationId: 'conv1',
          role: 'user',
          content: 'quantas notas em julho?',
          toolData: null,
          tokensIn: null,
          tokensOut: null,
          createdAt: '2026-01-01T00:00:01.000Z',
        },
        {
          id: 'msg_2',
          conversationId: 'conv1',
          role: 'assistant',
          content: RESPOSTA,
          toolData: null,
          tokensIn: null,
          tokensOut: null,
          createdAt: '2026-01-01T00:00:02.000Z',
        },
      ],
    });

    await fecharTurno();

    await waitFor(() => expect(agentApi.getConversation).toHaveBeenCalledTimes(2));
    expect(textoDaTela()).toContain('128 notas em julho');
  });

  /**
   * O caso do relato. A recarga responde SEM a resposta — foi o que aconteceu em
   * produção, e a tela obedeceu: apagou a resposta que o usuário estava lendo e
   * deixou só a pergunta dele.
   */
  it('a resposta NÃO some quando a recarga volta sem ela', async () => {
    await perguntarEReceberResposta();

    agentApi.getConversation.mockResolvedValue({
      ...CONVERSATION,
      messages: [
        {
          id: 'msg_1',
          conversationId: 'conv1',
          role: 'user',
          content: 'quantas notas em julho?',
          toolData: null,
          tokensIn: null,
          tokensOut: null,
          createdAt: '2026-01-01T00:00:01.000Z',
        },
      ],
    });

    await fecharTurno();

    await waitFor(() => expect(agentApi.getConversation).toHaveBeenCalledTimes(2));
    // Dá tempo de o dispatch da recarga chegar à tela antes de afirmar.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(textoDaTela()).toContain('128 notas em julho');
  });
});

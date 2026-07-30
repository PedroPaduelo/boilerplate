/**
 * QUANDO A CONEXÃO CAI NO MEIO DA RESPOSTA.
 *
 * Relato: "não está fluindo, cai toda hora, a resposta some". A queda em si é
 * inevitável (deploy do backend, wifi, notebook suspenso); o que não pode
 * acontecer é a tela ficar presa em "o agente está escrevendo" sobre uma
 * resposta que já terminou e está gravada no banco.
 *
 * O turno vive no SERVIDOR. Existem duas notícias do fim que não dependem da
 * sala da conversa (a sala é o que se perde numa reconexão):
 *
 *   1. `chat:turn-complete`, que chega pelo canal do usuário;
 *   2. a resposta do servidor à pergunta "onde está o turno?", feita a cada
 *      reconexão.
 *
 * Estes testes travam as duas — eram os dois caminhos de volta que existiam e
 * estavam desligados.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { AttachOptions } from '../transport/socket-transport';

const { startRunMock, stopRunMock, attachMock, ligacao } = vi.hoisted(() => ({
  startRunMock: vi.fn(),
  stopRunMock: vi.fn(),
  attachMock: vi.fn(),
  /** Guarda os callbacks entregues ao transporte, para o teste acioná-los. */
  ligacao: { atual: null as AttachOptions | null },
}));

vi.mock('../transport/socket-transport', () => ({
  startRun: startRunMock,
  stopRun: stopRunMock,
  fetchRunState: vi.fn().mockResolvedValue(null),
  attachToConversation: (conversationId: string, options: AttachOptions) => {
    ligacao.atual = options;
    attachMock(conversationId);
    return () => {
      ligacao.atual = null;
    };
  },
}));

/** Socket do usuário: por ele chega o aviso de fim de turno. */
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
    server(event: string, payload: unknown) {
      for (const handler of [...(handlers.get(event) ?? [])]) handler(payload);
    },
    reset: () => handlers.clear(),
  };
});

vi.mock('@/shared/socket', () => ({
  useSocket: () => ({ getSocket: () => socket, connected: true }),
}));

const { agentApi } = vi.hoisted(() => ({
  agentApi: { getConversation: vi.fn() },
}));
vi.mock('../api', () => ({ agentApi }));

import { useConversationStream } from '../use-conversation-stream';

const RESPOSTA = 'Foram 128 notas em julho, 32% abaixo de junho.';

/** O que o servidor devolve depois de gravar a resposta. */
const historicoCompleto = {
  id: 'conv-1',
  messages: [
    {
      id: 'msg_1',
      role: 'user',
      content: 'quantas notas em julho?',
      createdAt: '2026-01-01T00:00:01.000Z',
    },
    {
      id: 'msg_2',
      role: 'assistant',
      content: RESPOSTA,
      createdAt: '2026-01-01T00:00:02.000Z',
    },
  ],
};

async function perguntar() {
  const { result } = renderHook(() => useConversationStream('conv-1'));
  await waitFor(() => expect(attachMock).toHaveBeenCalled());

  act(() => result.current.send('quantas notas em julho?'));
  await waitFor(() => expect(startRunMock).toHaveBeenCalled());
  expect(result.current.isStreaming).toBe(true);

  return result;
}

describe('a conexão cai no meio da resposta', () => {
  beforeEach(() => {
    socket.reset();
    ligacao.atual = null;
    attachMock.mockReset();
    startRunMock.mockReset().mockResolvedValue({ runId: 'run_1' });
    stopRunMock.mockReset().mockResolvedValue(undefined);
    agentApi.getConversation.mockReset().mockResolvedValue({ id: 'conv-1', messages: [] });
  });

  /**
   * O `chat:done` viaja pela SALA da conversa e some junto com a conexão. O
   * aviso de fim de turno viaja pelo canal do usuário e chega. A tela ignorava
   * esse aviso justamente enquanto se achava em voo — ou seja, exatamente no
   * caso em que ele é a única notícia.
   */
  it('o aviso de fim de turno destrava a tela e traz a resposta', async () => {
    const result = await perguntar();

    // O agente terminou; o fechamento se perdeu na queda. Só o aviso chega.
    agentApi.getConversation.mockResolvedValue(historicoCompleto);
    await act(async () => {
      socket.server('chat:turn-complete', { conversationId: 'conv-1' });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(result.current.messages.map((m) => m.content)).toContain(RESPOSTA);
  });

  it('aviso de outra conversa não mexe nesta', async () => {
    const result = await perguntar();

    await act(async () => {
      socket.server('chat:turn-complete', { conversationId: 'outra' });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isStreaming).toBe(true);
  });

  /**
   * O outro caminho de volta: a tela ficou offline o turno inteiro e nem o
   * aviso chegou. Ao reconectar, o servidor responde que o turno terminou — e é
   * essa resposta que precisa destravar a tela.
   */
  it('reconectar depois do fim do turno recupera a resposta', async () => {
    const result = await perguntar();

    agentApi.getConversation.mockResolvedValue(historicoCompleto);
    await act(async () => {
      ligacao.atual?.onResync?.({
        runId: 'run_1',
        conversationId: 'conv-1',
        messageId: 'asg_1',
        status: 'done',
        text: RESPOSTA,
        seq: 42,
        toolSteps: [],
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(result.current.messages.map((m) => m.content)).toContain(RESPOSTA);
  });

  /** Reconectar com o turno AINDA em andamento retoma, não encerra. */
  it('reconectar no meio do turno retoma o texto já produzido', async () => {
    const result = await perguntar();

    act(() => {
      ligacao.atual?.onResync?.({
        runId: 'run_1',
        conversationId: 'conv-1',
        messageId: 'asg_1',
        status: 'running',
        text: 'Foram 128 notas',
        seq: 12,
        toolSteps: [],
      });
    });

    expect(result.current.isStreaming).toBe(true);
    expect(result.current.messages.map((m) => m.content)).toContain('Foram 128 notas');
  });
});

/**
 * A ESCUTA da conversa — a camada que estava sem teste.
 *
 * Os testes de chat existentes mockam `socket-transport` inteiro e exercitam o
 * reducer. Isso deixou de fora justamente o pedaço onde a resposta se perde: o
 * filtro de sequência e a inscrição na sala. Os casos abaixo são relatos reais
 * reproduzidos pelo caminho de verdade (socket → transporte).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChatEvent } from '../transport/types';

/** Socket falso: registra handlers e deixa o teste agir como servidor. */
const socket = vi.hoisted(() => {
  const handlers = new Map<string, Set<(payload: unknown) => void>>();
  return {
    connected: true,
    on(event: string, handler: (payload: unknown) => void) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
    },
    off(event: string, handler: (payload: unknown) => void) {
      handlers.get(event)?.delete(handler);
    },
    emit: vi.fn(),
    /** Empurra um evento do servidor para quem estiver escutando. */
    server(event: string, payload?: unknown) {
      for (const handler of [...(handlers.get(event) ?? [])]) handler(payload);
    },
    listenerCount(event: string) {
      return handlers.get(event)?.size ?? 0;
    },
    reset() {
      handlers.clear();
      this.emit.mockClear();
      this.connected = true;
    },
  };
});

const apiClient = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/shared/socket/socket-client', () => ({ getSocket: () => socket }));
vi.mock('@/shared/lib/api-client', () => ({ apiClient }));

import { attachToConversation, type RunState } from '../transport/socket-transport';

/** Resposta do `GET /run` — o estado do turno no servidor. */
function runNoServidor(run: Partial<RunState> | null) {
  apiClient.get.mockResolvedValue({
    data: {
      run: run && {
        runId: 'run_1',
        conversationId: 'conv1',
        messageId: 'asg_1',
        status: 'running',
        text: '',
        seq: 0,
        toolSteps: [],
        ...run,
      },
    },
  });
}

/** Deixa a sincronização inicial (uma ida ao servidor) terminar. */
const assentar = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Coletor do que chega à tela. */
function escutar(conversationId = 'conv1') {
  const eventos: ChatEvent[] = [];
  const resyncs: RunState[] = [];
  const detach = attachToConversation(conversationId, {
    onEvent: (evento) => eventos.push(evento),
    onResync: (run) => resyncs.push(run),
  });
  return { eventos, resyncs, detach };
}

const delta = (seq: number, texto: string, messageId = 'asg_1') => ({
  conversationId: 'conv1',
  messageId,
  delta: texto,
  seq,
});

describe('escuta da conversa', () => {
  beforeEach(() => {
    socket.reset();
    apiClient.get.mockReset();
    runNoServidor(null);
  });

  it('entra na sala da conversa ao começar a escutar', async () => {
    escutar();
    await assentar();
    expect(socket.emit).toHaveBeenCalledWith('chat:join', 'conv1');
  });

  it('não repete o que já apareceu na tela (retomada de turno)', async () => {
    // Retomando um turno que já entregou 12 pedaços: os 12 primeiros não podem
    // aparecer de novo, mas o 13º sim.
    runNoServidor({ messageId: 'asg_1', seq: 12, text: 'já lido' });
    const { eventos, resyncs } = escutar();
    await assentar();

    socket.server('chat:delta', delta(11, 'repetido'));
    socket.server('chat:delta', delta(12, 'repetido'));
    socket.server('chat:delta', delta(13, 'novo'));

    expect(resyncs).toHaveLength(1);
    expect(resyncs[0]).toMatchObject({ messageId: 'asg_1', text: 'já lido' });
    expect(eventos).toEqual([{ type: 'text_delta', messageId: 'asg_1', delta: 'novo' }]);
  });

  /**
   * O BUG DO RELATO ("a resposta some").
   *
   * A numeração dos pedaços é POR TURNO: cada resposta nova começa em 1. O
   * filtro de repetição, porém, era um contador que só crescia enquanto a tela
   * estivesse aberta. Resultado: a partir da SEGUNDA resposta da conversa, todo
   * pedaço chegava com número menor que o do turno anterior e era descartado
   * como "repetido" — a tela ficava com o cursor piscando e nada aparecia.
   */
  it('a resposta SEGUINTE aparece, mesmo com a numeração recomeçando', async () => {
    runNoServidor({ messageId: 'asg_1', seq: 12, text: 'turno anterior' });
    const { eventos } = escutar();
    await assentar();

    // Turno novo: outro messageId, contagem reiniciada.
    socket.server('chat:delta', delta(1, 'Foram 128 notas', 'asg_2'));
    socket.server('chat:delta', delta(2, ' em julho.', 'asg_2'));

    expect(eventos).toEqual([
      { type: 'text_delta', messageId: 'asg_2', delta: 'Foram 128 notas' },
      { type: 'text_delta', messageId: 'asg_2', delta: ' em julho.' },
    ]);
  });

  /**
   * O BUG DO RELATO ("cai toda hora").
   *
   * A sala do socket é por CONEXÃO. Quando o socket cai e volta (deploy do
   * backend, wifi oscilando, notebook suspenso), o servidor tem uma conexão
   * nova — e ela não está em sala nenhuma. Sem reentrar, os pedaços seguintes
   * são emitidos para uma sala vazia e a resposta para no meio, para sempre.
   */
  it('volta para a sala depois de reconectar', async () => {
    escutar();
    await assentar();
    socket.emit.mockClear();

    socket.server('connect');

    expect(socket.emit).toHaveBeenCalledWith('chat:join', 'conv1');
  });

  /**
   * Reentrar na sala só garante o que vem DAQUI PARA A FRENTE. O que o agente
   * escreveu enquanto a conexão estava fora está no servidor — e sem perguntar,
   * ficaria um buraco no meio da resposta.
   */
  it('ao reconectar, pergunta ao servidor o que perdeu', async () => {
    const { resyncs, eventos } = escutar();
    await assentar();

    runNoServidor({ messageId: 'asg_1', seq: 40, text: 'texto completo até aqui' });
    socket.server('connect');
    await assentar();

    expect(resyncs[resyncs.length - 1]).toMatchObject({
      seq: 40,
      text: 'texto completo até aqui',
    });

    // E a escuta continua do ponto certo: o que já está no texto não repete.
    socket.server('chat:delta', delta(40, 'repetido'));
    socket.server('chat:delta', delta(41, ' e o resto.'));
    expect(eventos).toEqual([
      { type: 'text_delta', messageId: 'asg_1', delta: ' e o resto.' },
    ]);
  });

  /**
   * O buraco do tamanho de uma ida e volta HTTP: entre entrar na sala e receber
   * o estado do servidor chegam pedaços. Aplicá-los antes da resposta era
   * inútil (o estado do servidor sobrescreve o texto) e descartá-los, pior
   * ainda. Eles ficam represados e entram depois, na ordem.
   */
  it('não perde os pedaços que chegam durante a sincronização', async () => {
    let responder: (() => void) | undefined;
    apiClient.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          responder = () =>
            resolve({
              data: {
                run: {
                  runId: 'run_1',
                  conversationId: 'conv1',
                  messageId: 'asg_1',
                  status: 'running',
                  text: 'começo',
                  seq: 3,
                  toolSteps: [],
                },
              },
            });
        }),
    );

    const { eventos } = escutar();

    // Chegam enquanto o servidor ainda não respondeu.
    socket.server('chat:delta', delta(3, 'já está no texto'));
    socket.server('chat:delta', delta(4, ' continuação'));
    expect(eventos).toEqual([]);

    responder?.();
    await assentar();

    expect(eventos).toEqual([
      { type: 'text_delta', messageId: 'asg_1', delta: ' continuação' },
    ]);
  });

  it('servidor fora do ar na sincronização não derruba a escuta', async () => {
    apiClient.get.mockRejectedValue(new Error('offline'));
    const { eventos } = escutar();
    await assentar();

    socket.server('chat:delta', delta(1, 'segue funcionando'));

    expect(eventos).toEqual([
      { type: 'text_delta', messageId: 'asg_1', delta: 'segue funcionando' },
    ]);
  });

  it('parar de escutar sai da sala e solta os handlers', async () => {
    const { detach, eventos } = escutar();
    await assentar();
    detach();

    socket.server('chat:delta', delta(1, 'tarde demais'));

    expect(socket.emit).toHaveBeenCalledWith('chat:leave', 'conv1');
    expect(eventos).toEqual([]);
    expect(socket.listenerCount('chat:delta')).toBe(0);
    expect(socket.listenerCount('connect')).toBe(0);
  });

  it('ignora o que é de outra conversa', async () => {
    const { eventos } = escutar();
    await assentar();

    socket.server('chat:delta', { ...delta(1, 'de outra'), conversationId: 'conv2' });
    socket.server('chat:done', { conversationId: 'conv2', messageId: 'x', text: 'y' });

    expect(eventos).toEqual([]);
  });

  it('o fechamento do turno chega com o texto final', async () => {
    const { eventos } = escutar();
    await assentar();

    socket.server('chat:done', {
      conversationId: 'conv1',
      messageId: 'asg_1',
      text: 'Foram 128 notas em julho.',
    });

    expect(eventos).toEqual([
      { type: 'message_end', messageId: 'asg_1', text: 'Foram 128 notas em julho.' },
    ]);
  });
});

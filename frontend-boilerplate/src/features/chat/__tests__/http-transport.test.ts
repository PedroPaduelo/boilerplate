/**
 * Regressão do parser SSE do HttpChatTransport.
 *
 * Contexto: o agente passou a usar streaming token-a-token, então uma resposta
 * gera CENTENAS de eventos SSE pequenos. Isso torna rotineiro um evento ser
 * partido entre dois chunks de rede — cenário em que o parser antigo perdia o
 * evento em silêncio (o texto simplesmente sumia da tela).
 *
 * Estes testes montam chunks com cortes propositalmente cruéis para travar
 * esse comportamento.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpChatTransport } from '../transport/http-transport';
import type { ChatEvent, ChatMessage } from '../transport/types';

vi.mock('@/shared/lib/env', () => ({ env: { API_URL: 'http://test.local' } }));
vi.mock('@/features/auth/store', () => ({
  useAuthStore: { getState: () => ({ token: 'tok' }) },
}));

/** Responde um SSE cujo corpo é entregue exatamente nos pedaços informados. */
function mockSse(chunks: string[]) {
  const encoder = new TextEncoder();
  let i = 0;
  const body = {
    getReader: () => ({
      read: async () =>
        i < chunks.length
          ? { done: false, value: encoder.encode(chunks[i++]) }
          : { done: true, value: undefined },
      cancel: async () => {},
    }),
  };
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, body, status: 200, statusText: 'OK' }),
  );
}

async function collect(): Promise<ChatEvent[]> {
  const t = new HttpChatTransport({ conversationId: 'c1' });
  const history: ChatMessage[] = [
    { id: 'u1', role: 'user', content: 'oi', createdAt: new Date().toISOString() },
  ];
  const out: ChatEvent[] = [];
  for await (const ev of t.sendMessage(history)) out.push(ev);
  return out;
}

const textOf = (evs: ChatEvent[]) =>
  evs
    .filter(
      (e): e is Extract<ChatEvent, { type: 'text_delta' }> => e.type === 'text_delta',
    )
    .map((e) => e.delta)
    .join('');

describe('HttpChatTransport — parser SSE', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('monta eventos partidos entre chunks (o bug que comia texto)', async () => {
    // Corte no meio do nome do evento, do JSON e da linha em branco final.
    mockSse([
      'event: message_start\ndata: {"messageId":"m1"}\n\n',
      'event: text_de',
      'lta\ndata: {"messageId":"m1","del',
      'ta":"Olá "}\n',
      '\nevent: text_delta\ndata: {"messageId":"m1","delta":"mundo"}\n\n',
      'event: final\ndata: {"finishReason":"stop"}\n\n',
    ]);

    const evs = await collect();
    expect(textOf(evs)).toBe('Olá mundo');
    expect(evs[0]).toMatchObject({ type: 'message_start', messageId: 'm1' });
  });

  it('não perde evento quando vários chegam grudados no mesmo chunk', async () => {
    const deltas = Array.from({ length: 50 }, (_, n) => `${n},`);
    mockSse([
      'event: message_start\ndata: {"messageId":"m1"}\n\n' +
        deltas
          .map((d) => `event: text_delta\ndata: {"messageId":"m1","delta":"${d}"}\n\n`)
          .join('') +
        'event: final\ndata: {"finishReason":"stop"}\n\n',
    ]);

    expect(textOf(await collect())).toBe(deltas.join(''));
  });

  it('encerra (em vez de travar) se o stream fecha sem o evento final', async () => {
    // Servidor caiu no meio: sem `final`, o gerador precisa terminar mesmo
    // assim — senão o chat fica preso em "pensando" e o input travado.
    mockSse(['event: text_delta\ndata: {"messageId":"m1","delta":"parcial"}\n\n']);

    const evs = await Promise.race([
      collect(),
      new Promise<ChatEvent[]>((_, rej) =>
        setTimeout(() => rej(new Error('travou')), 2000),
      ),
    ]);
    expect(textOf(evs)).toBe('parcial');
  });

  it('propaga o evento error do backend', async () => {
    mockSse(['event: error\ndata: {"message":"Invalid JSON response"}\n\n']);
    expect(await collect()).toContainEqual({
      type: 'error',
      message: 'Invalid JSON response',
    });
  });
});

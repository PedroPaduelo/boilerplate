import { describe, it, expect } from 'vitest';
import { MockChatTransport } from '../transport/mock-transport';
import type {
  ChatEvent,
  ChatMessage,
  ChatTransport,
} from '../transport/types';

function userMsg(content: string): ChatMessage {
  return { id: 'u1', role: 'user', content, createdAt: '2026-01-01T00:00:00Z' };
}

/** Drena um transport QUALQUER (prova que a UI/consumo só depende da interface). */
async function drain(
  transport: ChatTransport,
  history: ChatMessage[],
  signal?: AbortSignal,
): Promise<ChatEvent[]> {
  const events: ChatEvent[] = [];
  for await (const ev of transport.sendMessage(history, { signal })) {
    events.push(ev);
  }
  return events;
}

describe('MockChatTransport (camada de transporte mockada)', () => {
  it('faz streaming: message_start → text_delta(s) → chart → message_end', async () => {
    const transport = new MockChatTransport({ delayMs: 0 });
    const events = await drain(transport, [
      userMsg('mostre a arrecadação por mês em barras'),
    ]);

    expect(events[0]?.type).toBe('message_start');
    expect(events.at(-1)?.type).toBe('message_end');

    const deltas = events.filter((e) => e.type === 'text_delta');
    expect(deltas.length).toBeGreaterThan(0);

    const chartEv = events.find((e) => e.type === 'chart');
    expect(chartEv).toBeDefined();
    if (chartEv?.type === 'chart') {
      expect(chartEv.chart.catalogType).toBe('bar_chart');
      // dado JÁ no shape do contrato (alimenta o BlockRenderer inline)
      expect(chartEv.chart.result.state).toBe('success');
      // dataBinding com query (materializa um Chart real ao adicionar ao dashboard)
      expect(chartEv.chart.dataBinding?.query).toContain('SELECT');
    }
  });

  it('escolhe o tipo de gráfico pelo texto (distribuição → donut)', async () => {
    const transport = new MockChatTransport({ delayMs: 0 });
    const events = await drain(transport, [
      userMsg('qual a distribuição da dívida por situação?'),
    ]);
    const chartEv = events.find((e) => e.type === 'chart');
    expect(chartEv?.type === 'chart' && chartEv.chart.catalogType).toBe('donut');
  });

  it('não anexa gráfico quando a mensagem não pede dados', async () => {
    const transport = new MockChatTransport({ delayMs: 0 });
    const events = await drain(transport, [userMsg('olá, tudo bem?')]);
    expect(events.some((e) => e.type === 'chart')).toBe(false);
    expect(events.at(-1)?.type).toBe('message_end');
  });

  it('respeita AbortSignal (interrompe o stream cedo)', async () => {
    const transport = new MockChatTransport({ delayMs: 0 });
    const controller = new AbortController();
    controller.abort();
    const events = await drain(
      transport,
      [userMsg('gráfico de barras')],
      controller.signal,
    );
    // após abortado, não há gráfico nem fechamento normal
    expect(events.some((e) => e.type === 'chart')).toBe(false);
  });

  it('é trocável: qualquer objeto que implemente ChatTransport funciona', async () => {
    // Prova a costura: um transport ALTERNATIVO (estilo o futuro HttpChatTransport)
    // é consumido pela MESMA interface, sem nada do mock.
    const fake: ChatTransport = {
      async *sendMessage() {
        yield { type: 'message_start', messageId: 'x' } satisfies ChatEvent;
        yield { type: 'text_delta', messageId: 'x', delta: 'oi' } satisfies ChatEvent;
        yield { type: 'message_end', messageId: 'x' } satisfies ChatEvent;
      },
    };
    const events = await drain(fake, [userMsg('qualquer')]);
    expect(events.map((e) => e.type)).toEqual([
      'message_start',
      'text_delta',
      'message_end',
    ]);
  });
});

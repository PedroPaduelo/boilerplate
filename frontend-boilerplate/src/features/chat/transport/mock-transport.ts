/**
 * MockChatTransport — implementação MOCK do {@link ChatTransport}.
 *
 * Simula o agente externo: streaming de texto (efeito "digitando") + um gráfico
 * inline quando a mensagem do usuário pede dados. É o ÚNICO componente mockado do
 * projeto. A T-H2 substitui esta classe por um `HttpChatTransport` (mesma
 * interface) que fala com a API real — sem tocar a UI.
 *
 * O `delayMs` é detalhe INTERNO desta implementação (controla a velocidade do
 * streaming simulado); a interface pública continua sendo só `sendMessage`.
 */
import type {
  ChatEvent,
  ChatMessage,
  ChatTransport,
  SendMessageOptions,
} from './types';
import { buildMockChart, pickChartKind, wantsChart } from './mock-data';

export interface MockChatTransportOptions {
  /** Atraso (ms) entre os pedaços de texto do streaming. Use 0 em testes. */
  delayMs?: number;
}

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${counter}_${rand}`;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

/** Quebra um texto em pedaços (palavras) para simular tokens de streaming. */
function tokenize(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [text];
}

export class MockChatTransport implements ChatTransport {
  private readonly delayMs: number;

  constructor(options: MockChatTransportOptions = {}) {
    this.delayMs = options.delayMs ?? 18;
  }

  async *sendMessage(
    history: ChatMessage[],
    options: SendMessageOptions = {},
  ): AsyncIterable<ChatEvent> {
    const { signal } = options;
    const lastUser = [...history].reverse().find((m) => m.role === 'user');
    const userText = lastUser?.content ?? '';

    const messageId = nextId('asg');
    yield { type: 'message_start', messageId };

    const includeChart = wantsChart(userText);
    const narrative = buildNarrative(userText, includeChart);

    for (const token of tokenize(narrative)) {
      if (signal?.aborted) return;
      await delay(this.delayMs, signal);
      yield { type: 'text_delta', messageId, delta: token };
    }

    if (includeChart) {
      if (signal?.aborted) return;
      await delay(this.delayMs * 2, signal);
      const chart = buildMockChart(pickChartKind(userText));
      yield { type: 'chart', messageId, chart };
    }

    yield { type: 'message_end', messageId };
  }
}

function buildNarrative(userText: string, withChart: boolean): string {
  if (!userText.trim()) {
    return 'Olá! Posso te ajudar a montar relatórios e gráficos a partir das suas conexões. O que você gostaria de visualizar?';
  }
  if (withChart) {
    return (
      'Analisei a sua solicitação e consultei os dados. Aqui está uma visualização ' +
      'com base no que você pediu. Se fizer sentido, você pode adicioná-la a um ' +
      'dashboard usando o botão abaixo do gráfico.'
    );
  }
  return (
    'Entendi. Para gerar um gráfico, me diga sobre QUAL conjunto de dados (ex.: ' +
    'dívida ativa, arrecadação) e que tipo de visualização você quer — por exemplo ' +
    '"mostre a arrecadação por mês em barras" ou "a distribuição por situação".'
  );
}

/** Instância padrão usada pelo provider (default da aplicação). */
export const defaultMockTransport = new MockChatTransport();

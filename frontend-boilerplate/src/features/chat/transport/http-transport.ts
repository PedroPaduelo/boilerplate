/**
 * HttpChatTransport — implementação REAL do ChatTransport.
 *
 * Conecta com o backend (POST /agent/chat/:conversationId) via SSE (fetch + ReadableStream).
 * Não usa EventSource porque este não suporta POST + Authorization header.
 *
 * O SSE vem no formato:
 *   event: message_start  \n data: { messageId }
 *   event: text_delta     \n data: { messageId, delta }
 *   event: chart          \n data: { messageId, chart }
 *   event: tool_step      \n data: { toolName, ... }
 *   event: usage          \n data: { inputTokens, ... }
 *   event: message_end    \n data: { messageId }
 *   event: final          \n data: { finishReason, steps, elapsedMs }
 *   event: error          \n data: { message }
 */

import { env } from '@/shared/lib/env';
import { useAuthStore } from '@/features/auth/store';
import type {
  ChatChartPayload,
  ChatEvent,
  ChatMessage,
  ChatTransport,
  SendMessageOptions,
} from './types';

/** Extrai `message` de um corpo de erro desconhecido, sem recorrer a `any`. */
function errorMessageOf(body: unknown, fallback: string): string {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const { message } = body as { message: unknown };
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}

export interface HttpChatTransportOptions {
  /** conversationId para enviar as mensagens */
  conversationId: string;
}

/**
 * Lê o stream SSE e entrega um evento por vez.
 *
 * O estado do evento em montagem (`currentEvent`/`currentData`) vive FORA do
 * laço de leitura de propósito: um evento SSE não tem relação nenhuma com a
 * fatia de rede que o carrega. `event: text_delta` pode chegar num chunk e o
 * `data: {...}` correspondente no chunk seguinte — se o estado fosse reiniciado
 * a cada chunk (como já foi), esse evento era descartado em silêncio e o texto
 * sumia da tela. Com streaming token-a-token são centenas de eventos por
 * resposta, então essa quebra deixa de ser rara e vira perda de texto visível.
 */
async function parseSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (eventType: string, data: Record<string, unknown>) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';
  let currentData: string[] = [];

  const flush = () => {
    if (currentEvent && currentData.length > 0) {
      try {
        onEvent(currentEvent, JSON.parse(currentData.join('\n')));
      } catch {
        // evento malformado: ignora em vez de derrubar o stream inteiro
      }
    }
    currentEvent = '';
    currentData = [];
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    // A última fatia pode ser uma linha parcial — devolve ao buffer.
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        // Spec do SSE: um único espaço opcional depois do ':'.
        currentData.push(line.slice(5).replace(/^ /, ''));
      } else if (line === '') {
        flush();
      }
    }
  }

  // Último evento pode não ter vindo com a linha em branco final.
  flush();
}

export class HttpChatTransport implements ChatTransport {
  private readonly conversationId: string;

  constructor(options: HttpChatTransportOptions) {
    this.conversationId = options.conversationId;
  }

  async *sendMessage(
    history: ChatMessage[],
    options: SendMessageOptions = {},
  ): AsyncIterable<ChatEvent> {
    const { signal } = options;

    // Pega a última mensagem do usuário
    const lastUser = [...history].reverse().find((m) => m.role === 'user');
    const message = lastUser?.content ?? '';
    if (!message) return;

    const token = useAuthStore.getState().token;
    const url = `${env.API_URL}/agent/chat/${this.conversationId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message }),
      signal,
    });

    if (!response.ok) {
      const err: unknown = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      yield { type: 'error', message: errorMessageOf(err, `HTTP ${response.status}`) };
      return;
    }

    if (!response.body) return;

    const reader = response.body.getReader();
    const queue: ChatEvent[] = [];
    let resolveWait: (() => void) | null = null;
    let done = false;

    const onEvent = (eventType: string, data: Record<string, unknown>) => {
      switch (eventType) {
        case 'message_start':
          queue.push({ type: 'message_start', messageId: data.messageId as string });
          break;
        case 'text_delta':
          queue.push({
            type: 'text_delta',
            messageId: data.messageId as string,
            delta: data.delta as string,
          });
          break;
        case 'chart':
          queue.push({
            type: 'chart',
            messageId: data.messageId as string,
            chart: data.chart as ChatChartPayload,
          });
          break;
        case 'tool_step':
          queue.push({
            type: 'tool_step',
            toolName: data.toolName as string,
            toolCallId: data.toolCallId as string,
            phase: data.phase as 'call' | 'result',
            args: data.args as Record<string, unknown> | undefined,
            output: data.output,
          });
          break;
        case 'usage':
          queue.push({
            type: 'usage',
            inputTokens: data.inputTokens as number | undefined,
            outputTokens: data.outputTokens as number | undefined,
            cachedInputTokens: data.cachedInputTokens as number | undefined,
          });
          break;
        case 'message_end':
          queue.push({ type: 'message_end', messageId: data.messageId as string });
          break;
        case 'final':
          // Stream finished
          done = true;
          break;
        case 'error':
          queue.push({
            type: 'error',
            message: (data.message as string) ?? 'Unknown error',
          });
          break;
      }
      resolveWait?.();
    };

    // Lê o SSE em background alimentando a fila.
    //
    // `finally` (e não só `catch`): quando o servidor fecha a conexão SEM
    // mandar `final` — deploy no meio da resposta, proxy derrubando conexão
    // ociosa — o parser RESOLVE normalmente. Com apenas `catch`, `done` nunca
    // virava true, o laço abaixo ficava esperando uma promise que ninguém
    // resolvia e o chat congelava em "pensando", com o input travado, até dar
    // refresh na página.
    parseSseStream(reader, onEvent).finally(() => {
      done = true;
      resolveWait?.();
    });

    try {
      // Yield events from the queue
      while (true) {
        while (queue.length > 0) {
          yield queue.shift()!;
        }
        if (done) break;
        // Wait for next event
        await new Promise<void>((resolve) => {
          resolveWait = resolve;
        });
        resolveWait = null;
      }
    } finally {
      // Saímos assim que chega `final`, então o corpo pode ainda estar aberto.
      // Sem cancelar, a conexão fica pendurada até o GC.
      reader.cancel().catch(() => {});
    }
  }
}

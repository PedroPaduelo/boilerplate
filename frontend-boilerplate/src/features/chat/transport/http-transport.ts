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
  ChatEvent,
  ChatMessage,
  ChatTransport,
  SendMessageOptions,
} from './types';

export interface HttpChatTransportOptions {
  /** conversationId para enviar as mensagens */
  conversationId: string;
}

function parseSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (eventType: string, data: Record<string, unknown>) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  return reader.read().then(function process({ done, value }): Promise<void> {
    if (done) return Promise.resolve();

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    let currentEvent = '';
    let currentData = '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        currentData += line.slice(6);
      } else if (line === '' && currentEvent) {
        // Empty line = end of event
        try {
          const data = JSON.parse(currentData);
          onEvent(currentEvent, data);
        } catch {
          // skip malformed
        }
        currentEvent = '';
        currentData = '';
      }
    }

    return reader.read().then(process);
  });
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
      const err = await response.json().catch(() => ({ message: response.statusText }));
      yield { type: 'error', message: (err as any).message ?? `HTTP ${response.status}` };
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
            chart: data.chart as any,
          });
          break;
        case 'tool_step':
          queue.push({
            type: 'tool_step',
            toolName: data.toolName as string,
            toolCallId: data.toolCallId as string,
            phase: data.phase as 'call' | 'result',
            args: data.args,
            output: data.output,
          } as any);
          break;
        case 'usage':
          queue.push({ type: 'usage', ...data } as any);
          break;
        case 'message_end':
          queue.push({ type: 'message_end', messageId: data.messageId as string });
          break;
        case 'final':
          // Stream finished
          done = true;
          break;
        case 'error':
          queue.push({ type: 'error', message: (data.message as string) ?? 'Unknown error' });
          break;
      }
      resolveWait?.();
    };

    // Start reading SSE in background
    parseSseStream(reader, onEvent).catch(() => {
      done = true;
      resolveWait?.();
    });

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
  }
}

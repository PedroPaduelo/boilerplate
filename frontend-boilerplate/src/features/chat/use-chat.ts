/**
 * useChat — estado do chat embutido (T-H) e consumo do {@link ChatTransport}.
 *
 * Responsabilidades:
 * - manter a lista de mensagens (sessão em memória — sem persistência nossa);
 * - enviar a mensagem do usuário e consumir o stream de `ChatEvent` aplicando os
 *   deltas de texto à mensagem do assistente (efeito "digitando");
 * - expor `isStreaming` (indicador de "pensando") e `stop()` (abortar o stream).
 *
 * Toda a fonte das respostas vem do transport INJETADO (`useChatTransport`), nunca
 * de um import direto do mock — assim a T-H2 troca a implementação sem tocar aqui.
 */
import { useCallback, useRef, useState } from 'react';
import { useChatTransport } from './transport';
import type { ChatMessage } from './transport';

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export interface UseChatResult {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  /** Envia uma mensagem do usuário e consome a resposta do agente em streaming. */
  send: (text: string) => Promise<void>;
  /** Aborta o stream em andamento. */
  stop: () => void;
  /** Limpa a conversa. */
  reset: () => void;
}

export function useChat(initialMessages: ChatMessage[] = []): UseChatResult {
  const transport = useChatTransport();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Espelha as mensagens para montar o histórico sem depender do closure.
  const messagesRef = useRef<ChatMessage[]>(initialMessages);

  const commit = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        messagesRef.current = next;
        return next;
      });
    },
    [],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMessage: ChatMessage = {
        id: makeId('usr'),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const history = [...messagesRef.current, userMessage];
      commit(() => history);
      setIsStreaming(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        for await (const ev of transport.sendMessage(history, {
          signal: controller.signal,
        })) {
          switch (ev.type) {
            case 'message_start':
              commit((prev) => [
                ...prev,
                {
                  id: ev.messageId,
                  role: 'assistant',
                  content: '',
                  createdAt: new Date().toISOString(),
                },
              ]);
              break;
            case 'text_delta':
              commit((prev) =>
                prev.map((m) =>
                  m.id === ev.messageId
                    ? { ...m, content: m.content + ev.delta }
                    : m,
                ),
              );
              break;
            case 'chart':
              commit((prev) =>
                prev.map((m) =>
                  m.id === ev.messageId ? { ...m, chart: ev.chart } : m,
                ),
              );
              break;
            case 'error':
              setError(ev.message);
              break;
            case 'message_end':
            default:
              break;
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : 'Falha ao falar com o agente.',
          );
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [transport, isStreaming, commit],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    messagesRef.current = [];
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, error, send, stop, reset };
}

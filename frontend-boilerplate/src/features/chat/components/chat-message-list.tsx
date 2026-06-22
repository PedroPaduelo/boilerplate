/** Lista rolável das mensagens do chat. */
import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import type { ChatMessage } from '../transport';
import { ChatMessageBubble } from './chat-message-bubble';

export interface ChatMessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function ChatMessageList({ messages, isStreaming }: ChatMessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  // Auto-scroll para a última mensagem (efeito é permitido; só DOM, sem setState).
  useEffect(() => {
    // `scrollIntoView` não existe no jsdom (testes) — guardamos a chamada.
    if (typeof endRef.current?.scrollIntoView === 'function') {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div
        data-slot="chat-empty"
        className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground"
      >
        <MessageSquare className="size-10 opacity-40" />
        <div className="max-w-sm text-sm">
          Peça um relatório ou gráfico. Ex.:{' '}
          <em>"mostre a arrecadação por mês em barras"</em> ou{' '}
          <em>"a distribuição da dívida por situação"</em>.
        </div>
      </div>
    );
  }

  return (
    <div data-slot="chat-messages" className="flex flex-col gap-5">
      {messages.map((m) => (
        <ChatMessageBubble
          key={m.id}
          message={m}
          streaming={isStreaming && m.id === lastAssistantId}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}

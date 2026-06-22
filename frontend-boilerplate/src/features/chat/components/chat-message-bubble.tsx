/** Bolha de uma mensagem do chat (user à direita, assistant à esquerda). */
import { Bot, User as UserIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ChatMessage } from '../transport';
import { InlineChart } from './inline-chart';
import { ThinkingIndicator } from './thinking-indicator';

export interface ChatMessageBubbleProps {
  message: ChatMessage;
  /** true quando é a última mensagem do assistente e o stream ainda corre. */
  streaming?: boolean;
}

export function ChatMessageBubble({ message, streaming }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  // Assistente sem texto ainda e em streaming → mostra "pensando".
  const showThinking = !isUser && streaming && message.content.length === 0 && !message.chart;

  return (
    <div
      data-slot="chat-message"
      data-role={message.role}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        )}
      >
        {isUser ? <UserIcon className="size-4" /> : <Bot className="size-4" />}
      </div>

      <div className={cn('flex max-w-[80%] flex-col', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap',
            isUser
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm bg-muted text-foreground',
          )}
        >
          {showThinking ? (
            <ThinkingIndicator />
          ) : (
            <span data-slot="chat-message-content">{message.content}</span>
          )}
        </div>

        {message.chart ? (
          <div className="w-full min-w-[18rem]">
            <InlineChart chart={message.chart} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Bolha de uma mensagem do chat (user à direita, assistant à esquerda). */
import { memo } from 'react';
import { Bot, User as UserIcon } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { cn } from '@/shared/lib/utils';
import type { ChatMessage } from '../transport';
import { InlineChart } from './inline-chart';

// Configura marked para output limpo
marked.setOptions({
  breaks: true,
  gfm: true,
});

/** Renderiza markdown seguro (sanitizado com DOMPurify). */
function MarkdownContent({ content }: { content: string }) {
  const html = DOMPurify.sanitize(marked.parse(content, { async: false }) as string);
  return (
    <div
      data-slot="chat-markdown"
      className="min-w-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export interface ChatMessageBubbleProps {
  message: ChatMessage;
  streaming?: boolean;
}

function ChatMessageBubbleImpl({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

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

      <div
        className={cn(
          'flex min-w-0 flex-col',
          isUser ? 'max-w-[80%] items-end' : 'max-w-[92%] flex-1 items-start',
        )}
      >
        <div
          className={cn(
            'min-w-0 max-w-full rounded-2xl text-sm',
            isUser
              ? 'rounded-tr-sm bg-primary px-4 py-2 text-primary-foreground'
              : // Assistant: área mais larga e arejada (card) p/ markdown rica
                'rounded-tl-sm border border-border bg-card px-4 py-3 text-foreground',
            // Usuário não precisa de markdown (texto puro)
            isUser && 'whitespace-pre-wrap',
          )}
        >
          {isUser ? (
            <span data-slot="chat-message-content">{message.content}</span>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        {message.chart ? (
          <div className="mt-2 w-full min-w-[18rem]">
            <InlineChart chart={message.chart} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const ChatMessageBubble = memo(ChatMessageBubbleImpl);

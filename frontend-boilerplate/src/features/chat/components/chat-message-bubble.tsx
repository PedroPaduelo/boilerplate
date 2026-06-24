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
      className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_pre]:my-2 [&_table]:text-xs [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_strong]:font-semibold"
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

      <div className={cn('flex max-w-[80%] flex-col', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2 text-sm',
            isUser
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm bg-muted text-foreground',
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

/**
 * Uma mensagem do chat.
 *
 * `ChatMessage` do DS resolve avatar, alinhamento e densidade a partir do
 * `sender`; a bolha do usuário é `filled` (texto puro) e a do agente é `ghost`
 * (a resposta é markdown rica e pede uma coluna larga, não um balão).
 *
 * O texto em streaming passa por `useStreamingText`: o socket entrega rajadas
 * irregulares de deltas e o hook as transforma numa revelação contínua, cortando
 * em fronteira de palavra/sintaxe para não quebrar o markdown no meio.
 */
import { memo } from 'react';
import {
  ChatMessage as ChatMessageRow,
  ChatMessageBubble,
} from '@astryxdesign/core/Chat';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Markdown } from '@astryxdesign/core/Markdown';
import { VStack } from '@astryxdesign/core/Stack';
import { useStreamingText } from '@astryxdesign/core/hooks';
import type { ChatMessage } from '../transport';
import { InlineChart } from './inline-chart';

export interface ChatMessageItemProps {
  message: ChatMessage;
  /** Verdadeiro só para a última mensagem do agente enquanto ela chega. */
  isStreaming?: boolean;
}

function AssistantMessage({ message, isStreaming = false }: ChatMessageItemProps) {
  const text = useStreamingText(message.content, isStreaming);

  return (
    <ChatMessageRow sender="assistant" avatar={<Avatar name="Agente" size="sm" />}>
      <ChatMessageBubble variant="ghost">
        <VStack gap={3}>
          {/* `headingLevelStart={3}` mantém a hierarquia: o título da conversa
              é o h1 da tela e os cabeçalhos da resposta vêm abaixo dele. */}
          <Markdown density="compact" headingLevelStart={3} isStreaming={isStreaming}>
            {text}
          </Markdown>
          {message.chart ? <InlineChart chart={message.chart} /> : null}
        </VStack>
      </ChatMessageBubble>
    </ChatMessageRow>
  );
}

function ChatMessageItemImpl({ message, isStreaming }: ChatMessageItemProps) {
  if (message.role === 'user') {
    return (
      <ChatMessageRow sender="user">
        <ChatMessageBubble>{message.content}</ChatMessageBubble>
      </ChatMessageRow>
    );
  }

  return <AssistantMessage message={message} isStreaming={isStreaming} />;
}

export const ChatMessageItem = memo(ChatMessageItemImpl);

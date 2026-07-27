/**
 * Área de conversa: mensagens + composer.
 *
 * Todo o comportamento de scroll (auto-scroll ao chegar texto, botão "novas
 * mensagens" quando o usuário sobe a lista e a doca fosca do composer) vem do
 * `ChatLayout` — antes eram três efeitos manuais aqui dentro.
 */
import { useState } from 'react';
import {
  ChatComposer,
  ChatComposerInput,
  ChatLayout,
  ChatMessageList,
  ChatSendButton,
  ChatSystemMessage,
  ChatToolCalls,
} from '@astryxdesign/core/Chat';
import { Spinner } from '@astryxdesign/core/Spinner';
import { useConversationStream } from '../use-conversation-stream';
import { toChatToolCalls } from '../lib/chat-tools';
import { ChatEmptyState } from './chat-empty-state';
import { ChatMessageItem } from './chat-message-item';
import { ChatTurnError } from './chat-turn-error';

export interface ChatConversationProps {
  conversationId: string;
  /** `false` quando a chave do provedor não está configurada no servidor. */
  isAgentReady: boolean | null;
}

const AGENT_OFFLINE_REASON =
  'O agente está indisponível: a variável ANTHROPIC_API_KEY não está configurada no servidor.';

export function ChatConversation({
  conversationId,
  isAgentReady,
}: ChatConversationProps) {
  const { messages, toolSteps, isStreaming, error, lastPrompt, send, stop } =
    useConversationStream(conversationId);
  const [draft, setDraft] = useState('');

  const isOffline = isAgentReady === false;
  const toolCalls = toChatToolCalls(toolSteps);

  // A última mensagem do agente é renderizada DEPOIS das tool calls: primeiro o
  // que ele está fazendo, depois o que ele está respondendo.
  const lastMessage = messages[messages.length - 1];
  const isLastStreaming = isStreaming && lastMessage?.role === 'assistant';
  const history = isLastStreaming ? messages.slice(0, -1) : messages;
  const isThinking = isStreaming && !isLastStreaming;

  const hasContent =
    messages.length > 0 || toolCalls.length > 0 || isStreaming || !!error;

  return (
    <ChatLayout
      composer={
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSubmit={send}
          onStop={stop}
          isStopShown={isStreaming}
          isDisabled={isOffline}
          placeholder="Pergunte sobre seus dados…"
          input={<ChatComposerInput label="Mensagem" />}
          sendButton={<ChatSendButton />}
          status={
            isOffline ? { type: 'warning', message: AGENT_OFFLINE_REASON } : undefined
          }
        />
      }
      emptyState={<ChatEmptyState onPick={send} isDisabled={isOffline} />}
    >
      {hasContent ? (
        <ChatMessageList isStreaming={isStreaming}>
          {history.map((message) => (
            <ChatMessageItem key={message.id} message={message} />
          ))}

          {toolCalls.length > 0 ? (
            <ChatToolCalls calls={toolCalls} label="Ferramentas usadas nesta resposta" />
          ) : null}

          {isThinking ? (
            <ChatSystemMessage icon={<Spinner size="sm" />}>
              O agente está trabalhando…
            </ChatSystemMessage>
          ) : null}

          {isLastStreaming ? <ChatMessageItem message={lastMessage} isStreaming /> : null}

          {error ? (
            <ChatTurnError
              detail={error}
              onRetry={lastPrompt ? () => send(lastPrompt) : undefined}
            />
          ) : null}
        </ChatMessageList>
      ) : null}
    </ChatLayout>
  );
}

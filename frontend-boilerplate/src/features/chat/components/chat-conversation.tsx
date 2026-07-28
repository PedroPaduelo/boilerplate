/**
 * Área de conversa: mensagens + composer.
 *
 * Todo o comportamento de scroll (auto-scroll ao chegar texto, botão "novas
 * mensagens" quando o usuário sobe a lista e a doca fosca do composer) vem do
 * `ChatLayout` — antes eram três efeitos manuais aqui dentro.
 *
 * A ordem dentro de cada resposta é deliberada: **primeiro a trilha, depois o
 * texto**. Num produto de auditoria a pergunta que importa não é só "qual é o
 * número?", é "de onde ele saiu?" — quem lê a resposta passa antes pelo que o
 * agente fez para chegar nela. Durante o turno essa mesma trilha é o indicador
 * de progresso: ela se escreve sozinha enquanto o agente trabalha.
 */
import { useState } from 'react';
import {
  ChatComposer,
  ChatComposerInput,
  ChatLayout,
  ChatMessageList,
  ChatSendButton,
} from '@astryxdesign/core/Chat';
import { useConversationStream } from '../use-conversation-stream';
import { selectPendingTrail, selectTrail } from '../lib/conversation-state';
import { ChatEmptyState } from './chat-empty-state';
import { ChatMessageItem } from './chat-message-item';
import { ChatTurnError } from './chat-turn-error';
import { AuditTrail } from './audit-trail';

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
  const state = useConversationStream(conversationId);
  const { messages, phaseLabel, isStreaming, error, lastPrompt, send, stop } = state;
  const [draft, setDraft] = useState('');

  const isOffline = isAgentReady === false;

  /**
   * Passos que já aconteceram mas ainda não têm resposta a que se prender: as
   * ferramentas rodam ANTES do primeiro delta, que é o que abre a bolha do
   * agente. Sem isto o usuário fica olhando para o nada nos primeiros segundos
   * — justo quando o agente está fazendo o trabalho mais pesado.
   */
  const pendingTrail = selectPendingTrail(state);
  const lastMessage = messages[messages.length - 1];
  const isLastStreaming = isStreaming && lastMessage?.role === 'assistant';
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  const hasContent = messages.length > 0 || isStreaming || !!error;

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
          {messages.map((message) => {
            const isThisStreaming = isLastStreaming && message.id === lastMessage.id;
            const trail = selectTrail(state, message.id);

            if (message.role === 'user') {
              return <ChatMessageItem key={message.id} message={message} />;
            }

            return (
              <div key={message.id}>
                <AuditTrail
                  trail={trail}
                  phaseLabel={isThisStreaming ? phaseLabel : null}
                  isStreaming={isThisStreaming}
                />
                <ChatMessageItem
                  message={message}
                  isStreaming={isThisStreaming}
                  trail={trail}
                  // Refazer só na ÚLTIMA resposta: reenviar uma pergunta do meio
                  // reescreveria o fim da conversa que veio depois dela.
                  onRetry={
                    message.id === lastAssistantId && lastPrompt && !isStreaming
                      ? () => send(lastPrompt)
                      : undefined
                  }
                  onFollowUp={send}
                  isFollowUpDisabled={isStreaming || isOffline}
                />
              </div>
            );
          })}

          {/* Turno em voo antes de a resposta abrir: a trilha é o progresso. */}
          {isStreaming && !isLastStreaming ? (
            <AuditTrail trail={pendingTrail} phaseLabel={phaseLabel} isStreaming />
          ) : null}

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

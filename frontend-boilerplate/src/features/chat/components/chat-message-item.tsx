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
 *
 * A resposta do agente é mais do que o texto: abaixo dele vêm o gráfico, os
 * artefatos criados no turno, as continuações sugeridas e o rodapé com horário
 * e ações. É esta ordem que fecha o ciclo "perguntei → vi a evidência → salvei →
 * continuei" sem obrigar o usuário a caçar nada na barra lateral.
 */
import { memo, useMemo } from 'react';
import {
  ChatMessage as ChatMessageRow,
  ChatMessageBubble,
} from '@astryxdesign/core/Chat';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Markdown } from '@astryxdesign/core/Markdown';
import { VStack } from '@astryxdesign/core/Stack';
import { useStreamingText } from '@astryxdesign/core/hooks';
import type { ChatMessage } from '../transport';
import type { ChatMessageTrail } from '../model';
import { deriveFollowUps } from '../lib/follow-ups';
import { ArtifactCard } from './artifact-card';
import { FollowUps } from './follow-ups';
import { InlineChart } from './inline-chart';
import { MessageActions, type MessageFeedback } from './message-actions';

export interface ChatMessageItemProps {
  message: ChatMessage;
  /** Verdadeiro só para a última mensagem do agente enquanto ela chega. */
  isStreaming?: boolean;
  /** Artefatos e consumo DESTA resposta (a trilha vive junto da mensagem). */
  trail?: ChatMessageTrail;
  /**
   * Reenvia a pergunta que originou esta resposta. Faz sentido na ÚLTIMA
   * resposta; passar em respostas antigas reescreveria o fim da conversa.
   */
  onRetry?: () => void;
  /** Voto do usuário (`null` ao desmarcar). A persistência é de outra camada. */
  onFeedback?: (feedback: MessageFeedback | null) => void;
  /** Clique numa continuação sugerida — envia na hora, como no estado vazio. */
  onFollowUp?: (prompt: string) => void;
  /** Turno em voo ou agente offline: as continuações ficam visíveis e inativas. */
  isFollowUpDisabled?: boolean;
}

function AssistantMessage({
  message,
  isStreaming = false,
  trail,
  onRetry,
  onFeedback,
  onFollowUp,
  isFollowUpDisabled = false,
}: ChatMessageItemProps) {
  const text = useStreamingText(message.content, isStreaming);

  /**
   * Nada de rodapé nem de sugestão com o texto pela metade: copiar uma resposta
   * que ainda está sendo escrita entrega um pedaço, e sugestões derivadas de um
   * parágrafo incompleto mudam a cada delta.
   */
  const isSettled = !isStreaming;
  const followUps = useMemo(
    () => (isSettled && onFollowUp ? deriveFollowUps(message.content) : []),
    [isSettled, onFollowUp, message.content],
  );
  const artifacts = trail?.artifacts ?? [];

  return (
    <ChatMessageRow sender="assistant" avatar={<Avatar name="Agente" size="sm" />}>
      <ChatMessageBubble
        variant="ghost"
        // O cursor piscando só existe enquanto o texto está CHEGANDO. É o que
        // distingue "o modelo pausou entre parágrafos" de "a conexão caiu" —
        // ver `.app-streaming` em app/index.css.
        className={isStreaming ? 'app-streaming' : undefined}
        metadata={
          isSettled ? (
            <MessageActions
              content={message.content}
              createdAt={message.createdAt}
              usage={trail?.usage}
              onRetry={onRetry}
              onFeedback={onFeedback}
            />
          ) : undefined
        }
      >
        <VStack gap={3}>
          {/* `headingLevelStart={3}` mantém a hierarquia: o título da conversa
              é o h1 da tela e os cabeçalhos da resposta vêm abaixo dele. */}
          <Markdown density="compact" headingLevelStart={3} isStreaming={isStreaming}>
            {text}
          </Markdown>

          {message.chart ? <InlineChart chart={message.chart} /> : null}

          {artifacts.length > 0 ? (
            <VStack gap={2}>
              {artifacts.map((artifact) => (
                <ArtifactCard
                  key={`${artifact.kind}:${artifact.id}:${artifact.action}`}
                  artifact={artifact}
                />
              ))}
            </VStack>
          ) : null}

          {onFollowUp ? (
            <FollowUps
              suggestions={followUps}
              onSelect={onFollowUp}
              isDisabled={isFollowUpDisabled}
            />
          ) : null}
        </VStack>
      </ChatMessageBubble>
    </ChatMessageRow>
  );
}

function ChatMessageItemImpl(props: ChatMessageItemProps) {
  if (props.message.role === 'user') {
    return (
      <ChatMessageRow sender="user">
        <ChatMessageBubble>{props.message.content}</ChatMessageBubble>
      </ChatMessageRow>
    );
  }

  return <AssistantMessage {...props} />;
}

export const ChatMessageItem = memo(ChatMessageItemImpl);

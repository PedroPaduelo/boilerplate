/**
 * Uma mensagem do chat.
 *
 * `ChatMessage` do DS resolve alinhamento e densidade a partir do `sender`;
 * a bolha do usuário é `filled` (texto puro) e a do agente é `ghost`
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
import { VStack } from '@astryxdesign/core/Stack';
import { useStreamingText } from '@astryxdesign/core/hooks';
import type { ChatMessage } from '../transport';
import type { ChatMessageTrail } from '../model';
import { deriveFollowUps } from '../lib/follow-ups';
import { ArtifactCard } from './artifact-card';
import { FollowUps } from './follow-ups';
import { MessageActions, type MessageFeedback } from './message-actions';
import { ResponseBody } from './response-body';

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
  const charts = message.charts ?? [];

  return (
    /*
     * SEM avatar por mensagem — e a ausência aqui é estrutural, não estética.
     *
     * Quem fala já está identificado no cabeçalho da tela, então o avatar
     * repetido a cada resposta era só ruído. Mas o custo real era de
     * alinhamento: com `avatar`, o DS acrescenta um slot flex E um `gap` de
     * 8px na linha, e o cartão inteiro nasce 8px à direita da coluna. A trilha
     * de auditoria, que fica FORA do cartão, ficava nesses 8px sobrando —
     * começando à esquerda do cartão que ela descreve, como se vazasse dele.
     *
     * Esconder o avatar por CSS (`display: none`) não resolvia: o slot continua
     * sendo um item flex e o `gap` continua contando. Só não passar a prop
     * remove os dois — ver `hasAvatar` em ChatMessage do DS.
     */
    <ChatMessageRow sender="assistant">
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
          {/* Texto e gráficos INTERCALADOS: cada gráfico aparece no ponto da
              narrativa em que é a evidência, e não empilhado no fim como
              anexo. Quem decide a ordem é a resposta do agente, através das
              marcas `[[grafico:N]]` — ver `lib/response-composition.ts`. */}
          <ResponseBody
            text={text}
            charts={charts}
            messageId={message.id}
            isStreaming={isStreaming}
          />

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

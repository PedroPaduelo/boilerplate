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
      /**
       * COLUNA DE LEITURA. Sem isto a tela mede assim, num monitor de 1911px:
       * texto da resposta em 712px, trilha de auditoria em 1332px e composer em
       * 1340px — três larguras diferentes empilhadas na mesma coluna, o que dá
       * a sensação de bagunça mesmo com cada peça correta isoladamente.
       *
       * O número não é gosto: a 14px, a linha do agente ficava com 97
       * caracteres. O intervalo em que o olho reencontra o início da linha
       * seguinte sem esforço é 45–75; acima disso a leitura corrida cansa e o
       * leitor pula linha. Em 720px a mesma resposta cai para 70 caracteres —
       * medido na tela, não estimado.
       *
       * Aplicado nos FILHOS diretos (mensagens e composer) para que os dois
       * compartilhem exatamente o mesmo eixo. O fundo continua ocupando a
       * largura toda: quem centraliza é o conteúdo, não a moldura.
       *
       * 75rem (1200px), depois de duas tentativas erradas: 45rem deixou 65% do
       * monitor vazio e 56rem ainda espremia a resposta numa faixa estreita no
       * meio da tela.
       *
       * O erro era tratar como escolha binária entre "usa a tela" e "texto
       * legível". Não é: o que precisa ficar estreito é a PROSA (uma linha de
       * 110 caracteres cansa), e o que precisa de espaço é o resto — tabela de
       * resultado, SQL, gráfico, trilha de auditoria. Aqui o contêiner fica
       * largo (72% da área útil) e só o parágrafo se contém, por `max-width`
       * em ch dentro do markdown (ver `.app-chat` em app/index.css).
       *
       * `app-chat` é o escopo do redesenho visual — sem ele, as regras de
       * superfície do chat vazariam para o resto do app.
       */
      className="app-chat [&>*]:mx-auto [&>*]:w-full [&>*]:max-w-[75rem]"
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

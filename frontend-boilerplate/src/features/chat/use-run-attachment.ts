/**
 * Ligação da tela com o turno do agente: entra na sala da conversa e RETOMA o
 * que já estava rodando.
 *
 * Mora separado do `useConversationStream` porque é a parte mais delicada do
 * chat: o turno vive no servidor, não na tela. Quem escuta precisa saber em que
 * ponto o turno está — ao abrir a conversa E toda vez que a conexão cai e
 * volta. Essa sincronização é do transporte (`attachToConversation`, que
 * também reentra na sala); aqui fica só a tradução para o estado da tela.
 */
import { useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import { attachToConversation, type RunState } from './transport/socket-transport';
import type { ConversationAction } from './lib/conversation-state';

export interface RunAttachmentHandlers {
  /**
   * O turno acabou enquanto a tela não estava escutando.
   *
   * Acontece quando o socket cai ANTES do fim do turno: `chat:done` e
   * `chat:turn-complete` foram emitidos para uma conexão que não existia mais.
   * Ao voltar, o servidor diz que o turno terminou — e a única forma de saber o
   * que ele respondeu é reler o histórico. Sem isto, a tela ficava com o cursor
   * piscando para sempre sobre uma resposta que já existia no banco.
   */
  onTurnEnded?: () => void;
}

export function useRunAttachment(
  conversationId: string,
  dispatch: Dispatch<ConversationAction>,
  { onTurnEnded }: RunAttachmentHandlers = {},
): void {
  // O callback muda a cada render de quem chama; guardá-lo num ref evita
  // desligar e religar a escuta (e reentrar na sala) a cada render.
  const aoTerminar = useRef(onTurnEnded);
  useEffect(() => {
    aoTerminar.current = onTurnEnded;
  }, [onTurnEnded]);

  useEffect(() => {
    const aplicar = (run: RunState) => {
      if (run.status === 'running') {
        dispatch({
          type: 'resumed',
          messageId: run.messageId,
          text: run.text,
          // Os passos já executados vêm junto: quem recarrega no meio do turno
          // reencontra a trilha inteira, e não só o texto acumulado.
          steps: run.toolSteps ?? [],
        });
        return;
      }
      // Turno encerrado. Só interessa a quem ainda achava que estava em voo —
      // quem trata sabe disso (ver `onTurnEnded`).
      aoTerminar.current?.();
    };

    return attachToConversation(conversationId, {
      onEvent: (event) => dispatch({ type: 'event', event }),
      onResync: aplicar,
    });
  }, [conversationId, dispatch]);
}

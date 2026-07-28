/**
 * Ligação da tela com o turno do agente: entra na sala da conversa e RETOMA o
 * que já estava rodando.
 *
 * Mora separado do `useConversationStream` porque é a parte mais delicada do
 * chat: o turno vive no servidor, não na tela. Ao abrir (ou reabrir) uma
 * conversa é preciso perguntar em que ponto o turno está (`fetchRunState`),
 * mostrar o texto já acumulado e só então passar a escutar A PARTIR daquele
 * ponto (`fromSeq`) — sem buraco no meio e sem repetir o que já apareceu.
 */
import { useEffect } from 'react';
import type { Dispatch } from 'react';
import { attachToConversation, fetchRunState } from './transport/socket-transport';
import type { ConversationAction } from './lib/conversation-state';

export function useRunAttachment(
  conversationId: string,
  dispatch: Dispatch<ConversationAction>,
): void {
  useEffect(() => {
    let alive = true;
    let detach: (() => void) | null = null;

    void (async () => {
      let fromSeq = 0;
      try {
        const run = await fetchRunState(conversationId);
        if (!alive) return;
        if (run) {
          fromSeq = run.seq;
          if (run.status === 'running') {
            dispatch({
              type: 'resumed',
              messageId: run.messageId,
              text: run.text,
              // Os passos já executados vêm junto: quem recarrega no meio do
              // turno reencontra a trilha inteira, e não só o texto acumulado.
              steps: run.toolSteps ?? [],
            });
          }
        }
      } catch {
        // Sem estado de execução: segue só escutando o que vier.
      }
      if (!alive) return;
      detach = attachToConversation(conversationId, {
        fromSeq,
        onEvent: (event) => dispatch({ type: 'event', event }),
      });
    })();

    return () => {
      alive = false;
      detach?.();
    };
  }, [conversationId, dispatch]);
}

/**
 * Mantém a interface em dia com o que o AGENTE faz no servidor.
 *
 * Dois furos que este hook fecha:
 *
 * 1. O agente cria/publica um gráfico ou dashboard e a tela seguia mostrando o
 *    estado velho até um F5. Como o trabalho acontece no servidor, o front não
 *    tinha como saber que algo mudou.
 *
 * 2. Sair da tela do chat parecia matar a resposta. Não matava: o SSE morre com
 *    a navegação, mas a execução continua no servidor e a resposta é
 *    persistida. Faltava o caminho de volta — sem aviso, quem saía e voltava
 *    via a conversa sem a resposta.
 *
 * Fica montado uma vez no shell, para valer em qualquer tela: o usuário pode
 * pedir um gráfico no chat, navegar para os dashboards e ver o resultado
 * aparecer sozinho.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/lib/query-keys';
import { useSocket } from './use-socket';

const ARTIFACT_CHANGED_EVENT = 'artifact:changed';
export const CHAT_TURN_COMPLETE_EVENT = 'chat:turn-complete';
const CHAT_TITLE_EVENT = 'chat:title';

interface ArtifactChangedPayload {
  kind: 'chart' | 'dashboard';
  tool: string;
  chartId?: string;
  dashboardId?: string;
}

interface ChatTitlePayload {
  conversationId: string;
  title: string;
}

export function useAgentLiveUpdates() {
  const { getSocket, connected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onArtifactChanged = (payload: ArtifactChangedPayload) => {
      // Invalida a RAIZ da entidade (lista e detalhes de uma vez). Uma
      // publicação muda a listagem e o próprio artefato; invalidar só o id
      // deixaria a lista desatualizada.
      if (payload.kind === 'dashboard') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
        // Um dashboard pode ter ganhado um gráfico novo.
        void queryClient.invalidateQueries({ queryKey: queryKeys.charts.all });
      } else {
        void queryClient.invalidateQueries({ queryKey: queryKeys.charts.all });
      }
    };

    const onChatTurnComplete = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.charts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
      // A lista de conversas mora no cache da Query (`queryKeys.chat.*`): o
      // turno pode ter mexido na ordem (a conversa sobe ao topo) e na prévia.
      void queryClient.invalidateQueries({ queryKey: queryKeys.chat.all });
    };

    /**
     * O servidor batiza a conversa com a primeira pergunta ao fim do turno
     * inicial. Sem escutar isso, a barra lateral continuava dizendo "Nova
     * conversa" até o usuário sair da tela e voltar — ele já tinha perguntado,
     * já tinha a resposta, e a conversa seguia sem nome.
     *
     * Escrita direta no cache (e não invalidação): o título já veio no evento,
     * então buscar a lista de novo só para descobrir o que já sabemos gastaria
     * uma ida ao servidor para chegar ao mesmo lugar, mais devagar.
     */
    const onChatTitle = ({ conversationId, title }: ChatTitlePayload) => {
      if (!conversationId || !title) return;
      queryClient.setQueryData<Array<{ id: string; title: string }>>(
        queryKeys.chat.conversations(),
        (previous) =>
          previous?.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, title }
              : conversation,
          ),
      );
    };

    socket.on(ARTIFACT_CHANGED_EVENT, onArtifactChanged);
    socket.on(CHAT_TURN_COMPLETE_EVENT, onChatTurnComplete);
    socket.on(CHAT_TITLE_EVENT, onChatTitle);
    return () => {
      socket.off(ARTIFACT_CHANGED_EVENT, onArtifactChanged);
      socket.off(CHAT_TURN_COMPLETE_EVENT, onChatTurnComplete);
      socket.off(CHAT_TITLE_EVENT, onChatTitle);
    };
  }, [getSocket, connected, queryClient]);
}

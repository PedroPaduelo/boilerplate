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

export const ARTIFACT_CHANGED_EVENT = 'artifact:changed';
export const CHAT_TURN_COMPLETE_EVENT = 'chat:turn-complete';

interface ArtifactChangedPayload {
  kind: 'chart' | 'dashboard';
  tool: string;
  chartId?: string;
  dashboardId?: string;
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
      // As conversas ficam em estado local do chat, não no cache do React
      // Query; a página escuta o mesmo evento por conta própria. Aqui só
      // atualizamos o que o turno pode ter produzido de artefato.
      void queryClient.invalidateQueries({ queryKey: queryKeys.charts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboards.all });
    };

    socket.on(ARTIFACT_CHANGED_EVENT, onArtifactChanged);
    socket.on(CHAT_TURN_COMPLETE_EVENT, onChatTurnComplete);
    return () => {
      socket.off(ARTIFACT_CHANGED_EVENT, onArtifactChanged);
      socket.off(CHAT_TURN_COMPLETE_EVENT, onChatTurnComplete);
    };
  }, [getSocket, connected, queryClient]);
}

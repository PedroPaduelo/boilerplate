/**
 * Turno do agente para a conversa aberta.
 *
 * Sair da tela NÃO mata o agente: o turno é disparado por POST e o conteúdo
 * chega pela sala do socket. Este hook cuida de três coisas que dependem disso:
 *  - carregar o histórico ao abrir/trocar de conversa;
 *  - RETOMAR um turno em andamento (texto acumulado + escuta a partir do último
 *    pedaço, sem buraco e sem repetição);
 *  - recarregar quando o servidor avisa que um turno terminou fora da tela.
 */
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useSocket } from '@/shared/socket';
import { CHAT_TURN_COMPLETE_EVENT } from '@/shared/socket/use-agent-live-updates';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { agentApi, type ChatMessageRecord } from './api';
import { startRun } from './transport/socket-transport';
import type { ChatMessage, ChatRole } from './transport';
import { useRunAttachment } from './use-run-attachment';
import {
  conversationReducer,
  initialConversationState,
  type ConversationState,
} from './lib/conversation-state';

export interface UseConversationStreamResult extends ConversationState {
  send: (text: string) => void;
  stop: () => void;
}

function toUiMessage(record: ChatMessageRecord): ChatMessage {
  return {
    id: record.id,
    role: (record.role === 'user' ? 'user' : 'assistant') as ChatRole,
    content: record.content,
    createdAt: record.createdAt,
  };
}

export function useConversationStream(
  conversationId: string,
): UseConversationStreamResult {
  const [state, dispatch] = useReducer(conversationReducer, initialConversationState);
  const { getSocket, connected } = useSocket();

  /**
   * Espelha `isStreaming` para o listener de socket sem recriá-lo a cada delta.
   * A escrita vai num efeito (e não no corpo do render) porque ref é estado
   * externo ao React: escrever durante o render torna o resultado dependente
   * de quantas vezes o componente renderizou.
   */
  const isStreamingRef = useRef(false);
  useEffect(() => {
    isStreamingRef.current = state.isStreaming;
  }, [state.isStreaming]);

  const reload = useCallback(async () => {
    const conversation = await agentApi.getConversation(conversationId);
    dispatch({
      type: 'loaded',
      messages: (conversation.messages ?? []).map(toUiMessage),
    });
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;
    void reload().catch(() => {
      if (!cancelled) dispatch({ type: 'loaded', messages: [] });
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  /**
   * Sem escutar este aviso, quem saía e voltava via a conversa sem a resposta e
   * concluía que o agente tinha travado.
   */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onTurnComplete = (payload: { conversationId: string }) => {
      if (payload?.conversationId !== conversationId) return;
      // Enquanto streamamos, a tela já tem o texto ao vivo: recarregar piscaria.
      if (isStreamingRef.current) return;
      void reload();
    };
    socket.on(CHAT_TURN_COMPLETE_EVENT, onTurnComplete);
    return () => {
      socket.off(CHAT_TURN_COMPLETE_EVENT, onTurnComplete);
    };
  }, [getSocket, connected, conversationId, reload]);

  // Entra na sala da conversa e retoma um turno em andamento (ver o hook).
  useRunAttachment(conversationId, dispatch);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreamingRef.current) return;

      dispatch({
        type: 'sent',
        message: {
          id: `usr_${Date.now()}`,
          role: 'user',
          content: trimmed,
          createdAt: new Date().toISOString(),
        },
      });

      // Dispara e pronto: o POST responde na hora (202) e o conteúdo chega pela
      // sala do socket, que já está escutando.
      startRun(conversationId, trimmed).catch((err: unknown) => {
        dispatch({
          type: 'failed',
          message: getApiErrorMessage(err, 'Falha ao falar com o agente.'),
        });
      });
    },
    [conversationId],
  );

  // Só desliga a exibição local: o turno segue no servidor e a resposta continua
  // sendo persistida (é o que permite voltar e encontrá-la).
  const stop = useCallback(() => dispatch({ type: 'stopped' }), []);

  return { ...state, send, stop };
}

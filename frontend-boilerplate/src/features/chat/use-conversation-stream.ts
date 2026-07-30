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
import { startRun, stopRun } from './transport/socket-transport';
import type { ChatMessage, ChatRole } from './transport';
import { useRunAttachment } from './use-run-attachment';
import {
  buildTrails,
  conversationReducer,
  initialConversationState,
  type ConversationState,
} from './lib/conversation-state';
import { readPersistedCharts } from './lib/chat-tools';

export interface UseConversationStreamResult extends ConversationState {
  send: (text: string) => void;
  stop: () => void;
}

/**
 * Dispara o turno e, se a conversa estiver marcada como OCUPADA, destrava e
 * tenta uma vez mais.
 *
 * O 409 significa "já existe uma resposta em andamento". Ele acontece quando um
 * turno anterior ficou pendurado no servidor — e o efeito para quem usa era
 * brutal: a conversa parava de aceitar mensagens e só voltava sozinha quando o
 * estado expirava, 30 minutos depois. Não existia caminho de volta pela tela.
 *
 * Como o usuário está EXPLICITAMENTE mandando uma nova pergunta nesta conversa,
 * encerrar o turno anterior é o que ele quer — é a mesma decisão do botão
 * "parar", tomada por quem já seguiu em frente. Uma tentativa só: se o segundo
 * envio falhar, o erro sobe e vira mensagem na tela em vez de laço.
 */
async function dispararTurno(conversationId: string, texto: string): Promise<void> {
  try {
    await startRun(conversationId, texto);
    return;
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status !== 409) throw err;
  }
  await stopRun(conversationId);
  await startRun(conversationId, texto);
}

function toUiMessage(record: ChatMessageRecord): ChatMessage {
  // Os gráficos gravados junto da mensagem voltam com ela — sem isto, o F5
  // apagava o resultado da resposta e sobrava só o texto (metade da evidência).
  const charts = readPersistedCharts(record);
  return {
    id: record.id,
    role: (record.role === 'user' ? 'user' : 'assistant') as ChatRole,
    content: record.content,
    createdAt: record.createdAt,
    ...(charts.length > 0 ? { charts } : {}),
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
    const records = conversation.messages ?? [];
    dispatch({
      type: 'loaded',
      messages: records.map(toUiMessage),
      // A trilha vem do banco junto com o texto: é o que faz a auditoria
      // sobreviver ao recarregar em vez de existir só durante o streaming.
      trails: buildTrails(records),
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
   * O turno acabou — o servidor avisando por fora da sala da conversa.
   *
   * Este aviso é a REDE DE SEGURANÇA do chat, e por isso ele é incondicional.
   * Ele chega pelo canal do usuário (não pela sala), então sobrevive a uma
   * reconexão que a sala não sobrevive: é justamente quando `chat:done` se
   * perde que ele é a única notícia de que a resposta ficou pronta.
   *
   * Havia aqui uma condição `if (isStreaming) return` para evitar piscar a
   * tela. Ela desligava o socorro exatamente no caso em que ele é necessário:
   * a tela só continua "em voo" no fim do turno porque perdeu o fechamento —
   * e aí ignorava o aviso, ficava com o cursor piscando para sempre e a
   * resposta, já gravada no banco, não aparecia.
   *
   * A recarga REPÕE (ids reais, trilha gravada) sem tirar nada: se o servidor
   * responder sem a resposta que já está na tela, ela fica — ver
   * `reconcileHistory`.
   */
  const encerrarTurno = useCallback(() => {
    dispatch({ type: 'turn_ended' });
    // Falhar em reler o histórico não muda nada na tela — o que está posto
    // continua posto. Engolir aqui evita uma rejeição solta no console.
    void reload().catch(() => {});
  }, [reload]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onTurnComplete = (payload: { conversationId: string }) => {
      if (payload?.conversationId !== conversationId) return;
      encerrarTurno();
    };
    socket.on(CHAT_TURN_COMPLETE_EVENT, onTurnComplete);
    return () => {
      socket.off(CHAT_TURN_COMPLETE_EVENT, onTurnComplete);
    };
  }, [getSocket, connected, conversationId, encerrarTurno]);

  /**
   * Entra na sala da conversa, retoma o turno em andamento e reentra a cada
   * reconexão (ver o hook). `onTurnEnded` cobre o caso em que o turno terminou
   * com a tela desconectada: nem `chat:done` nem `chat:turn-complete` chegaram,
   * e é a volta da conexão que descobre isso.
   */
  useRunAttachment(conversationId, dispatch, {
    onTurnEnded: () => {
      if (!isStreamingRef.current) return;
      encerrarTurno();
    },
  });

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
      dispararTurno(conversationId, trimmed).catch((err: unknown) => {
        dispatch({
          type: 'failed',
          message: getApiErrorMessage(err, 'Falha ao falar com o agente.'),
        });
      });
    },
    [conversationId],
  );

  /**
   * Para de verdade: encerra o turno NO SERVIDOR e libera a conversa.
   *
   * Antes isto só desligava a exibição local. O turno continuava rodando, a
   * conversa seguia marcada como ocupada e a próxima pergunta era recusada com
   * 409 — ou seja, quem apertava "parar" perdia a conversa até o estado expirar
   * (30 min). Desligar a tela primeiro mantém a resposta imediata; a chamada
   * segue em paralelo e não lança (ver `stopRun`).
   */
  const stop = useCallback(() => {
    dispatch({ type: 'stopped' });
    void stopRun(conversationId);
  }, [conversationId]);

  return { ...state, send, stop };
}

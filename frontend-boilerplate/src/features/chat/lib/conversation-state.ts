/**
 * Estado de UMA conversa em andamento — reducer puro.
 *
 * Ficava espalhado em cinco `useState` dentro da página, o que obrigava cada
 * evento do agente a orquestrar vários setters em sequência (e a ordem entre
 * eles importava). Como reducer, cada evento vira UMA transição declarada, e o
 * arquivo pode ser lido (e testado) sem React no meio.
 */
import type { ChatEvent, ChatMessage, ChatRole } from '../transport';
import type { ChatToolStep } from './chat-tools';

export interface ConversationState {
  messages: ChatMessage[];
  /** Ferramentas usadas no turno atual — zeradas a cada nova pergunta. */
  toolSteps: ChatToolStep[];
  isStreaming: boolean;
  /** Falha do agente, em texto técnico (a UI traduz para linguagem de gente). */
  error: string | null;
  /** Última pergunta enviada — permite reenviar depois de uma falha. */
  lastPrompt: string;
}

export type ConversationAction =
  /** Histórico recarregado do servidor (abertura da conversa ou fim de turno). */
  | { type: 'loaded'; messages: ChatMessage[] }
  /** Pergunta do usuário acabou de ser enviada. */
  | { type: 'sent'; message: ChatMessage }
  /** Turno já em execução no servidor, retomado ao reabrir a tela. */
  | { type: 'resumed'; messageId: string; text: string }
  /** Evento vindo do socket. */
  | { type: 'event'; event: ChatEvent }
  /** Falha local (o POST que dispara o turno não passou). */
  | { type: 'failed'; message: string }
  /** Usuário parou de acompanhar a resposta (o turno segue no servidor). */
  | { type: 'stopped' };

export const initialConversationState: ConversationState = {
  messages: [],
  toolSteps: [],
  isStreaming: false,
  error: null,
  lastPrompt: '',
};

/** Insere ou atualiza um passo de ferramenta pela chave natural. */
function upsertToolStep(steps: ChatToolStep[], next: ChatToolStep): ChatToolStep[] {
  const index = steps.findIndex((step) => step.toolCallId === next.toolCallId);
  if (index === -1) return [...steps, next];
  const updated = steps.slice();
  updated[index] = next;
  return updated;
}

function applyEvent(state: ConversationState, event: ChatEvent): ConversationState {
  switch (event.type) {
    case 'message_start':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: event.messageId,
            role: 'assistant' as ChatRole,
            content: '',
            createdAt: new Date().toISOString(),
          },
        ],
      };
    case 'text_delta': {
      // O socket não emite `message_start`: o primeiro delta é que abre a bolha
      // do agente. Sem este upsert os deltas caíam no vazio e o texto só
      // aparecia no fim do turno, quando a conversa era recarregada.
      const exists = state.messages.some((message) => message.id === event.messageId);
      if (!exists) {
        return {
          ...state,
          isStreaming: true,
          messages: [
            ...state.messages,
            {
              id: event.messageId,
              role: 'assistant' as ChatRole,
              content: event.delta,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === event.messageId
            ? { ...message, content: message.content + event.delta }
            : message,
        ),
      };
    }
    case 'chart':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === event.messageId ? { ...message, chart: event.chart } : message,
        ),
      };
    case 'tool_step':
      return {
        ...state,
        toolSteps: upsertToolStep(state.toolSteps, {
          toolCallId: event.toolCallId,
          toolName: event.toolName,
          phase: event.phase,
        }),
      };
    case 'error':
      return { ...state, error: event.message, isStreaming: false };
    case 'message_end':
      return { ...state, isStreaming: false };
    case 'usage':
      return state;
  }
}

export function conversationReducer(
  state: ConversationState,
  action: ConversationAction,
): ConversationState {
  switch (action.type) {
    case 'loaded':
      return { ...initialConversationState, messages: action.messages };
    case 'sent':
      return {
        ...state,
        messages: [...state.messages, action.message],
        toolSteps: [],
        isStreaming: true,
        error: null,
        lastPrompt: action.message.content,
      };
    case 'resumed':
      return {
        ...state,
        isStreaming: true,
        messages: [
          ...state.messages.filter((message) => message.id !== action.messageId),
          {
            id: action.messageId,
            role: 'assistant' as ChatRole,
            content: action.text,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    case 'event':
      return applyEvent(state, action.event);
    case 'failed':
      return { ...state, isStreaming: false, error: action.message };
    case 'stopped':
      return { ...state, isStreaming: false };
  }
}

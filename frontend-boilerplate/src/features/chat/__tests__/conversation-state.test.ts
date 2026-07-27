/**
 * Transições do turno do agente.
 *
 * O caso que mais importa aqui: o socket NÃO emite `message_start`; o primeiro
 * `text_delta` é que precisa abrir a bolha do agente. Sem isso os deltas caem no
 * vazio e a resposta só aparece quando a conversa é recarregada — que era
 * exatamente o sintoma de "o agente não está digitando".
 */
import { describe, it, expect } from 'vitest';
import {
  conversationReducer,
  initialConversationState,
  type ConversationState,
} from '../lib/conversation-state';

function reduce(
  state: ConversationState,
  ...actions: Parameters<typeof conversationReducer>[1][]
): ConversationState {
  return actions.reduce(conversationReducer, state);
}

describe('conversationReducer', () => {
  it('o primeiro delta abre a bolha do agente', () => {
    const state = reduce(initialConversationState, {
      type: 'event',
      event: { type: 'text_delta', messageId: 'asg_1', delta: 'Olá' },
    });

    expect(state.messages).toEqual([
      expect.objectContaining({ id: 'asg_1', role: 'assistant', content: 'Olá' }),
    ]);
    expect(state.isStreaming).toBe(true);
  });

  it('deltas seguintes acumulam no mesmo texto', () => {
    const state = reduce(
      initialConversationState,
      { type: 'event', event: { type: 'text_delta', messageId: 'asg_1', delta: 'Olá' } },
      {
        type: 'event',
        event: { type: 'text_delta', messageId: 'asg_1', delta: ', mundo' },
      },
    );

    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]?.content).toBe('Olá, mundo');
  });

  it('enviar zera as ferramentas do turno anterior e guarda a pergunta', () => {
    const withStep = reduce(initialConversationState, {
      type: 'event',
      event: {
        type: 'tool_step',
        toolCallId: 't1',
        toolName: 'run_query',
        phase: 'result',
      },
    });
    expect(withStep.toolSteps).toHaveLength(1);

    const sent = conversationReducer(withStep, {
      type: 'sent',
      message: {
        id: 'usr_1',
        role: 'user',
        content: 'quantas notas?',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });

    expect(sent.toolSteps).toEqual([]);
    expect(sent.isStreaming).toBe(true);
    expect(sent.lastPrompt).toBe('quantas notas?');
  });

  it('a mesma ferramenta é atualizada no lugar quando o resultado chega', () => {
    const state = reduce(
      initialConversationState,
      {
        type: 'event',
        event: {
          type: 'tool_step',
          toolCallId: 't1',
          toolName: 'run_query',
          phase: 'call',
        },
      },
      {
        type: 'event',
        event: {
          type: 'tool_step',
          toolCallId: 't1',
          toolName: 'run_query',
          phase: 'result',
        },
      },
    );

    expect(state.toolSteps).toHaveLength(1);
    expect(state.toolSteps[0]?.phase).toBe('result');
  });

  it('erro do agente encerra o streaming e preserva a última pergunta', () => {
    const state = reduce(
      initialConversationState,
      {
        type: 'sent',
        message: {
          id: 'usr_1',
          role: 'user',
          content: 'quebra',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      },
      { type: 'event', event: { type: 'error', message: 'Invalid JSON response' } },
    );

    expect(state.isStreaming).toBe(false);
    expect(state.error).toBe('Invalid JSON response');
    expect(state.lastPrompt).toBe('quebra');
  });

  it('retomar substitui a bolha parcial pelo texto já produzido no servidor', () => {
    const state = reduce(
      initialConversationState,
      { type: 'event', event: { type: 'text_delta', messageId: 'asg_1', delta: 'par' } },
      { type: 'resumed', messageId: 'asg_1', text: 'parcial completo' },
    );

    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]?.content).toBe('parcial completo');
    expect(state.isStreaming).toBe(true);
  });
});

/**
 * Transições do turno do agente.
 *
 * Dois casos mandam neste arquivo:
 *
 * 1. o socket NÃO emite `message_start` — o primeiro `text_delta` é que precisa
 *    abrir a bolha do agente. Sem isso os deltas caem no vazio e a resposta só
 *    aparece quando a conversa é recarregada;
 * 2. a TRILHA pertence à mensagem. Enquanto foi um campo único da conversa, a
 *    auditoria da resposta anterior sumia na pergunta seguinte e nada
 *    sobrevivia ao F5 — mesmo com os passos já gravados no banco.
 */
import { describe, it, expect } from 'vitest';
import {
  buildTrails,
  conversationReducer,
  initialConversationState,
  selectPendingTrail,
  selectTrail,
  type ConversationState,
} from '../lib/conversation-state';
import type { ChatEvent } from '../transport';

function reduce(
  state: ConversationState,
  ...actions: Parameters<typeof conversationReducer>[1][]
): ConversationState {
  return actions.reduce(conversationReducer, state);
}

const ask = (id: string, content: string): Parameters<typeof conversationReducer>[1] => ({
  type: 'sent',
  message: { id, role: 'user', content, createdAt: '2026-01-01T00:00:00.000Z' },
});

const toolCall = (
  toolCallId: string,
  extra: Record<string, unknown> = {},
): Parameters<typeof conversationReducer>[1] => ({
  type: 'event',
  event: {
    type: 'tool_step',
    toolCallId,
    toolName: 'run_query',
    phase: 'call',
    ...extra,
  },
});

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

  it('erro do agente encerra o streaming e preserva a última pergunta', () => {
    const state = reduce(initialConversationState, ask('usr_1', 'quebra'), {
      type: 'event',
      event: { type: 'error', message: 'Invalid JSON response' },
    });

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

describe('fusão dos passos de ferramenta', () => {
  it('call e result do mesmo id viram UM passo, de rodando para concluído', () => {
    const running = reduce(
      initialConversationState,
      toolCall('t1', { title: 'Executando consulta', target: 'messages' }),
    );
    expect(selectPendingTrail(running).steps).toEqual([
      expect.objectContaining({ toolCallId: 't1', status: 'running' }),
    ]);

    const done = reduce(running, {
      type: 'event',
      event: {
        type: 'tool_step',
        toolCallId: 't1',
        toolName: 'run_query',
        phase: 'result',
        status: 'ok',
        durationMs: 340,
        rowCount: 128,
        sql: 'SELECT 1',
      },
    });

    const [step, ...rest] = selectPendingTrail(done).steps;
    expect(rest).toHaveLength(0);
    expect(step).toMatchObject({
      status: 'ok',
      // Campos que só o `call` trouxe continuam lá: o `result` completa, não zera.
      title: 'Executando consulta',
      target: 'messages',
      durationMs: 340,
      rowCount: 128,
      sql: 'SELECT 1',
    });
  });

  it('o result que falhou carrega a mensagem de erro', () => {
    const state = reduce(initialConversationState, toolCall('t1'), {
      type: 'event',
      event: {
        type: 'tool_step',
        toolCallId: 't1',
        toolName: 'run_query',
        phase: 'result',
        status: 'error',
        errorMessage: 'relation "notas" does not exist',
      },
    });

    expect(selectPendingTrail(state).steps[0]).toMatchObject({
      status: 'error',
      errorMessage: 'relation "notas" does not exist',
    });
  });

  it('ferramenta que apaga é marcada como destrutiva mesmo sem o servidor avisar', () => {
    const state = reduce(initialConversationState, {
      type: 'event',
      event: {
        type: 'tool_step',
        toolCallId: 't1',
        toolName: 'delete_dashboard',
        phase: 'result',
      },
    });

    expect(selectPendingTrail(state).steps[0]?.isDestructive).toBe(true);
  });
});

describe('a trilha pertence à mensagem', () => {
  it('os passos executados antes do texto passam a ser da mensagem que abriu', () => {
    const state = reduce(initialConversationState, toolCall('t1'), {
      type: 'event',
      event: { type: 'text_delta', messageId: 'asg_1', delta: 'Foram 128.' },
    });

    expect(selectTrail(state, 'asg_1').steps).toHaveLength(1);
    // Não fica duplicado no depósito temporário.
    expect(selectPendingTrail(state).steps).toHaveLength(0);
  });

  it('a trilha da resposta anterior sobrevive à pergunta seguinte', () => {
    const primeira = reduce(
      initialConversationState,
      ask('usr_1', 'quantas notas?'),
      toolCall('t1'),
      { type: 'event', event: { type: 'text_delta', messageId: 'asg_1', delta: '128' } },
      { type: 'event', event: { type: 'message_end', messageId: 'asg_1' } },
    );

    const segunda = reduce(primeira, ask('usr_2', 'e no mês passado?'), toolCall('t2'), {
      type: 'event',
      event: { type: 'text_delta', messageId: 'asg_2', delta: '96' },
    });

    expect(selectTrail(segunda, 'asg_1').steps.map((step) => step.toolCallId)).toEqual([
      't1',
    ]);
    expect(selectTrail(segunda, 'asg_2').steps.map((step) => step.toolCallId)).toEqual([
      't2',
    ]);
  });

  it('consumo e artefato do turno entram na trilha da mensagem', () => {
    const state = reduce(
      initialConversationState,
      { type: 'event', event: { type: 'text_delta', messageId: 'asg_1', delta: 'ok' } },
      {
        type: 'event',
        event: {
          type: 'artifact',
          kind: 'dashboard',
          id: 'dsh_1',
          title: 'Vendas',
          action: 'created',
        },
      },
      {
        type: 'event',
        event: { type: 'usage', messageId: 'asg_1', inputTokens: 10, elapsedMs: 1400 },
      },
    );

    const trail = selectTrail(state, 'asg_1');
    expect(trail.artifacts).toEqual([
      { kind: 'dashboard', id: 'dsh_1', title: 'Vendas', action: 'created' },
    ]);
    expect(trail.usage).toMatchObject({ inputTokens: 10, elapsedMs: 1400 });
  });

  it('o gráfico que chega antes do texto abre a bolha em vez de se perder', () => {
    const chart = {
      title: 'Notas por mês',
      catalogType: 'bar_chart',
      result: { rows: [] },
    } as unknown as Extract<ChatEvent, { type: 'chart' }>['chart'];

    const state = reduce(
      initialConversationState,
      { type: 'event', event: { type: 'chart', messageId: 'asg_1', chart } },
      {
        type: 'event',
        event: { type: 'text_delta', messageId: 'asg_1', delta: 'Segue' },
      },
    );

    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toMatchObject({ id: 'asg_1', content: 'Segue', chart });
  });

  it('a fase corrente fica disponível para a tela e some no fim do turno', () => {
    const trabalhando = reduce(initialConversationState, {
      type: 'event',
      event: { type: 'phase', phase: 'tool', label: 'Consultando teste · Postgres' },
    });
    expect(trabalhando.phase).toBe('tool');
    expect(trabalhando.phaseLabel).toBe('Consultando teste · Postgres');

    const fim = reduce(trabalhando, {
      type: 'event',
      event: { type: 'message_end', messageId: 'asg_1' },
    });
    expect(fim.phase).toBeNull();
    expect(fim.phaseLabel).toBeNull();
  });

  it('retomar um turno em andamento reconstrói os passos já executados', () => {
    const state = reduce(initialConversationState, {
      type: 'resumed',
      messageId: 'asg_1',
      text: 'parcial',
      steps: [
        { toolCallId: 't1', toolName: 'run_query', phase: 'call', sql: 'SELECT 1' },
        { toolCallId: 't1', toolName: 'run_query', phase: 'result', rowCount: 128 },
        { toolCallId: 't2', toolName: 'create_chart', phase: 'call' },
      ],
    });

    const steps = selectTrail(state, 'asg_1').steps;
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ status: 'ok', sql: 'SELECT 1', rowCount: 128 });
    expect(steps[1]).toMatchObject({ toolCallId: 't2', status: 'running' });
  });
});

describe('trilha reconstruída do histórico', () => {
  it('lê o formato novo: passos, artefatos e consumo', () => {
    const trails = buildTrails([
      {
        id: 'msg_1',
        toolData: {
          steps: [
            {
              toolCallId: 't1',
              toolName: 'run_query',
              title: 'Executando consulta',
              status: 'ok',
              connectionName: 'teste · Postgres',
              sql: 'SELECT count(*) FROM notas',
              rowCount: 128,
              durationMs: 340,
              preview: { columns: ['total'], rows: [[128]], totalRows: 128 },
            },
          ],
          artifacts: [{ kind: 'chart', id: 'cht_1', title: 'Notas', action: 'created' }],
          usage: { inputTokens: 900, outputTokens: 120, elapsedMs: 2100, steps: 1 },
        },
      },
    ]);

    expect(trails.msg_1?.steps[0]).toMatchObject({
      title: 'Executando consulta',
      status: 'ok',
      connectionName: 'teste · Postgres',
      sql: 'SELECT count(*) FROM notas',
      rowCount: 128,
      preview: { columns: ['total'], totalRows: 128 },
    });
    expect(trails.msg_1?.artifacts).toHaveLength(1);
    expect(trails.msg_1?.usage).toMatchObject({ elapsedMs: 2100 });
  });

  it('lê o formato ANTIGO e recupera o SQL, as linhas e o tempo do resultado', () => {
    const trails = buildTrails([
      {
        id: 'msg_2',
        toolData: [
          {
            toolCallId: 't1',
            toolName: 'run_query',
            args: { connectionId: 'con_1', sql: 'SELECT 1' },
            output: { rowCount: 42, durationMs: 12 },
          },
        ],
        tokensIn: 100,
        tokensOut: 50,
      },
    ]);

    expect(trails.msg_2?.steps[0]).toMatchObject({
      toolCallId: 't1',
      // Sem `title` gravado, o rótulo vem do nome técnico traduzido.
      title: 'Executando consulta',
      status: 'ok',
      sql: 'SELECT 1',
      rowCount: 42,
      durationMs: 12,
    });
    // Tokens já eram gravados em colunas próprias — e ninguém os lia.
    expect(trails.msg_2?.usage).toMatchObject({ inputTokens: 100, outputTokens: 50 });
  });

  it('toolData nulo, malformado ou de tipo errado não derruba a conversa', () => {
    expect(
      buildTrails([
        { id: 'a', toolData: null },
        { id: 'b', toolData: undefined },
        { id: 'c', toolData: 'não é json' },
        { id: 'd', toolData: { steps: 'também não' } },
        { id: 'e', toolData: [null, 42, { semToolCallId: true }] },
        { id: 'f', toolData: { steps: [{ toolCallId: 'ok', toolName: 'run_query' }] } },
      ]),
    ).toEqual({
      // Só a mensagem com um passo legível vira trilha; as outras somem sem erro.
      f: {
        steps: [expect.objectContaining({ toolCallId: 'ok', status: 'ok' })],
        artifacts: [],
        usage: undefined,
      },
    });
  });

  it('o histórico recarregado repõe as trilhas sem apagar o resto do estado', () => {
    const state = reduce(initialConversationState, {
      type: 'loaded',
      messages: [
        { id: 'msg_1', role: 'assistant', content: '128', createdAt: '2026-01-01' },
      ],
      trails: buildTrails([
        { id: 'msg_1', toolData: [{ toolCallId: 't1', toolName: 'run_query' }] },
      ]),
    });

    expect(selectTrail(state, 'msg_1').steps).toHaveLength(1);
    expect(selectTrail(state, 'inexistente').steps).toEqual([]);
  });
});

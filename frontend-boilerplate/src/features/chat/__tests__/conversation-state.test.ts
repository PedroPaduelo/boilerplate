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

  /**
   * O fechamento do turno pode ser a PRIMEIRA notícia da resposta: se a conexão
   * caiu no meio, nenhum pedaço abriu a bolha do agente. Enquanto isto era um
   * `map`, o texto final não encontrava mensagem para atualizar e era descartado
   * em silêncio — a tela ficava com a pergunta do usuário sozinha, que é o
   * relato de "a resposta some".
   */
  it('o fechamento mostra a resposta mesmo se nenhum pedaço tiver chegado', () => {
    const state = reduce(initialConversationState, ask('usr_1', 'quantas notas?'), {
      type: 'event',
      event: {
        type: 'message_end',
        messageId: 'asg_1',
        text: 'Foram 128 notas em julho.',
      },
    });

    expect(state.messages.map((message) => message.content)).toEqual([
      'quantas notas?',
      'Foram 128 notas em julho.',
    ]);
    expect(state.isStreaming).toBe(false);
  });

  it('a trilha do turno passa a ser da mensagem que o fechamento criou', () => {
    const state = reduce(initialConversationState, toolCall('t1'), {
      type: 'event',
      event: { type: 'message_end', messageId: 'asg_1', text: 'x'.repeat(30) },
    });

    expect(selectTrail(state, 'asg_1').steps).toHaveLength(1);
    expect(selectPendingTrail(state).steps).toHaveLength(0);
  });

  /**
   * O aviso de fim de turno chega por FORA da sala da conversa — é o que
   * sobrevive a uma queda de conexão que engoliu o `chat:done`. Sem ele a tela
   * ficava presa em "o agente está escrevendo" para sempre.
   */
  it('o aviso de fim de turno desliga o estado de execução', () => {
    const emVoo = reduce(initialConversationState, ask('usr_1', 'e aí?'), {
      type: 'event',
      event: { type: 'text_delta', messageId: 'asg_1', delta: 'parcial' },
    });
    expect(emVoo.isStreaming).toBe(true);

    const fim = reduce(emVoo, { type: 'turn_ended' });

    expect(fim.isStreaming).toBe(false);
    expect(fim.phase).toBeNull();
    // Não mexe no conteúdo: quem repõe é a recarga do histórico.
    expect(fim.messages.map((message) => message.content)).toEqual(['e aí?', 'parcial']);
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
    expect(state.messages[0]).toMatchObject({
      id: 'asg_1',
      content: 'Segue',
      charts: [chart],
    });
  });

  /**
   * Um pedido de painel ("monte um dashboard de mensagens") rende KPIs, série e
   * distribuição no MESMO turno — um evento `chart` para cada. Enquanto a
   * mensagem guardava um gráfico só, cada evento apagava o anterior e a resposta
   * chegava à tela com um gráfico, mandando o usuário procurar o resto fora do
   * chat.
   */
  it('acumula TODOS os gráficos do turno, na ordem de chegada', () => {
    const grafico = (id: string, title: string) =>
      ({
        chartId: id,
        title,
        catalogType: 'bar_chart',
        result: { rows: [] },
      }) as unknown as Extract<ChatEvent, { type: 'chart' }>['chart'];

    const state = reduce(
      initialConversationState,
      {
        type: 'event',
        event: { type: 'chart', messageId: 'asg_1', chart: grafico('c1', 'KPI') },
      },
      {
        type: 'event',
        event: { type: 'chart', messageId: 'asg_1', chart: grafico('c2', 'Barras') },
      },
      {
        type: 'event',
        event: { type: 'chart', messageId: 'asg_1', chart: grafico('c3', 'Donut') },
      },
    );

    expect(state.messages[0]?.charts?.map((chart) => chart.chartId)).toEqual([
      'c1',
      'c2',
      'c3',
    ]);
  });

  /**
   * Reconexão do socket e retomada de turno reentregam eventos já vistos. Sem
   * identidade, a resposta ganharia uma cópia do gráfico a cada reconexão.
   */
  it('o mesmo gráfico reemitido substitui no lugar, sem duplicar', () => {
    const versao = (value: number) =>
      ({
        chartId: 'c1',
        title: 'Total',
        catalogType: 'kpi',
        result: { value },
      }) as unknown as Extract<ChatEvent, { type: 'chart' }>['chart'];

    const state = reduce(
      initialConversationState,
      {
        type: 'event',
        event: { type: 'chart', messageId: 'asg_1', chart: versao(1) },
      },
      {
        type: 'event',
        event: { type: 'chart', messageId: 'asg_1', chart: versao(2) },
      },
    );

    expect(state.messages[0]?.charts).toHaveLength(1);
    expect(state.messages[0]?.charts?.[0]?.result).toMatchObject({ value: 2 });
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
      // Sem `title` gravado, o rótulo vem do nome técnico traduzido — o mesmo
      // texto que o backend manda hoje (`TOOL_TITLES`), para o passo não ter um
      // nome numa conversa velha e outro numa nova.
      title: 'Consultando os dados',
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

  /**
   * O bug que chegou de produção: o agente terminava de responder e a resposta
   * SUMIA da tela, sobrando só a pergunta do usuário.
   *
   * O fim do turno dispara uma recarga do histórico. Quando ela voltava sem a
   * resposta — a gravação falhou, atrasou, ou a leitura pegou o estado de antes
   * —, a tela obedecia e apagava o que o usuário estava lendo. Recarregar é
   * leitura: não pode desfazer o que já foi entregue.
   */
  describe('recarregar não apaga o que está na tela', () => {
    const respondido = () =>
      reduce(
        initialConversationState,
        ask('usr_1', 'quantas notas em julho?'),
        {
          type: 'event',
          event: { type: 'text_delta', messageId: 'asg_1', delta: 'Foram 128.' },
        },
        { type: 'event', event: { type: 'message_end', messageId: 'asg_1' } },
      );

    const doServidor = (id: string, role: 'user' | 'assistant', content: string) => ({
      id,
      role,
      content,
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    it('a resposta fica quando o servidor devolve o histórico sem ela', () => {
      const state = reduce(respondido(), {
        type: 'loaded',
        messages: [doServidor('msg_1', 'user', 'quantas notas em julho?')],
      });

      expect(state.messages.map((message) => message.content)).toEqual([
        'quantas notas em julho?',
        'Foram 128.',
      ]);
    });

    it('o servidor manda no que ele conhece: os ids reais entram sem duplicar', () => {
      const state = reduce(respondido(), {
        type: 'loaded',
        messages: [
          doServidor('msg_1', 'user', 'quantas notas em julho?'),
          doServidor('msg_2', 'assistant', 'Foram 128.'),
        ],
      });

      expect(state.messages.map((message) => message.id)).toEqual(['msg_1', 'msg_2']);
    });

    it('a pergunta recém-enviada não some enquanto o servidor não a registra', () => {
      const enviando = reduce(respondido(), ask('usr_2', 'e no mês passado?'));

      const state = reduce(enviando, {
        type: 'loaded',
        messages: [
          doServidor('msg_1', 'user', 'quantas notas em julho?'),
          doServidor('msg_2', 'assistant', 'Foram 128.'),
        ],
      });

      expect(state.messages[state.messages.length - 1]).toMatchObject({
        role: 'user',
        content: 'e no mês passado?',
      });
    });

    /**
     * Uma recarga no meio da resposta não pode desligar o turno: o cursor
     * pararia de piscar e o composer voltaria a aceitar envio enquanto o agente
     * ainda está escrevendo.
     */
    it('o turno em voo sobrevive a uma recarga', () => {
      const emVoo = reduce(initialConversationState, ask('usr_1', 'e agora?'), {
        type: 'event',
        event: { type: 'text_delta', messageId: 'asg_1', delta: 'Estou vendo' },
      });

      const state = reduce(emVoo, {
        type: 'loaded',
        messages: [doServidor('msg_1', 'user', 'e agora?')],
      });

      expect(state.isStreaming).toBe(true);
      expect(state.activeMessageId).toBe('asg_1');
      expect(state.messages.map((message) => message.content)).toEqual([
        'e agora?',
        'Estou vendo',
      ]);
    });

    it('o gráfico da resposta sobrevive a uma recarga que não o traz', () => {
      const chart = {
        chartId: 'cht_1',
        title: 'Notas por mês',
        catalogType: 'bar_chart',
        result: { rows: [] },
      } as unknown as Extract<ChatEvent, { type: 'chart' }>['chart'];

      const comGrafico = reduce(
        initialConversationState,
        ask('usr_1', 'gráfico por mês'),
        { type: 'event', event: { type: 'chart', messageId: 'asg_1', chart } },
        {
          type: 'event',
          event: { type: 'text_delta', messageId: 'asg_1', delta: 'Segue.' },
        },
        { type: 'event', event: { type: 'message_end', messageId: 'asg_1' } },
      );

      const state = reduce(comGrafico, {
        type: 'loaded',
        messages: [
          doServidor('msg_1', 'user', 'gráfico por mês'),
          // Gráfico grande demais não é persistido junto da mensagem.
          doServidor('msg_2', 'assistant', 'Segue.'),
        ],
      });

      expect(state.messages[1]?.charts?.map((c) => c.chartId)).toEqual(['cht_1']);
    });

    it('a trilha acompanha a mensagem que o servidor confirmou', () => {
      const state = reduce(respondido(), {
        type: 'loaded',
        messages: [
          doServidor('msg_1', 'user', 'quantas notas em julho?'),
          doServidor('msg_2', 'assistant', 'Foram 128.'),
        ],
        trails: buildTrails([
          { id: 'msg_2', toolData: [{ toolCallId: 't1', toolName: 'run_query' }] },
        ]),
      });

      expect(selectTrail(state, 'msg_2').steps).toHaveLength(1);
      // Trilha órfã (id que não existe mais) não fica acumulando no estado.
      expect(Object.keys(state.trails)).toEqual(['msg_2']);
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

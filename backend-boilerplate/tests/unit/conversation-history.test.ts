/**
 * Regressão: o histórico precisa devolver as TOOL CALLS, não só o texto.
 *
 * Antes, `loadConversationHistory` devolvia apenas `{role, content}`. O agente
 * herdava o que tinha ESCRITO, mas perdia o que tinha DESCOBERTO — qual
 * connectionId estava usando, o schema já lido, o chartId recém-criado. Na
 * prática ele refazia a descoberta a cada mensagem (gastando passos, tokens e
 * tempo) ou chutava um id de memória e falhava com "a conexão não está
 * respondendo".
 *
 * Medido numa conversa de 3 turnos, antes/depois:
 *   turno 2: list_connections + get_connection_schema  ->  só get_connection_schema
 *   turno 3: run_query FALHANDO (id chutado)           ->  run_query OK
 */

const findMany = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    chatMessage: { findMany: (...a: unknown[]) => findMany(...a) },
  },
}));

import { loadConversationHistory } from '@/modules/agent/services/conversation';

type Linha = {
  role: string;
  content: string;
  toolData?: unknown;
};

const comMensagens = (linhas: Linha[]) =>
  findMany.mockResolvedValueOnce(linhas.map((l) => ({ toolData: null, ...l })));

beforeEach(() => findMany.mockReset());

describe('loadConversationHistory', () => {
  it('mantém mensagens simples de texto como antes', async () => {
    comMensagens([
      { role: 'user', content: 'oi' },
      { role: 'assistant', content: 'olá' },
    ]);

    expect(await loadConversationHistory('c1')).toEqual([
      { role: 'user', content: 'oi' },
      { role: 'assistant', content: 'olá' },
    ]);
  });

  it('reinjeta a tool call E o resultado, no par assistant -> tool', async () => {
    comMensagens([
      { role: 'user', content: 'quantas linhas tem messages?' },
      {
        role: 'assistant',
        content: 'A tabela tem 2.613 linhas.',
        toolData: [
          {
            toolCallId: 'call_1',
            toolName: 'list_connections',
            args: {},
            output: { connections: [{ id: 'conn_abc', name: 'teste' }] },
          },
        ],
      },
    ]);

    const hist = await loadConversationHistory('c1');

    expect(hist).toHaveLength(3);
    const assistant = hist[1] as { role: string; content: Array<Record<string, unknown>> };
    expect(assistant.role).toBe('assistant');
    expect(assistant.content).toEqual([
      { type: 'text', text: 'A tabela tem 2.613 linhas.' },
      { type: 'tool-call', toolCallId: 'call_1', toolName: 'list_connections', input: {} },
    ]);

    const tool = hist[2] as { role: string; content: Array<Record<string, unknown>> };
    expect(tool.role).toBe('tool');
    expect(tool.content[0]).toMatchObject({
      type: 'tool-result',
      toolCallId: 'call_1',
      toolName: 'list_connections',
    });
    // O id da conexão precisa sobreviver: é justamente o que o agente chutava.
    expect(JSON.stringify(tool.content[0])).toContain('conn_abc');
  });

  it('descarta passo sem toolCallId (tool-call órfã é rejeitada pela API)', async () => {
    comMensagens([
      {
        role: 'assistant',
        content: 'texto',
        toolData: [{ toolName: 'run_query', output: 'x' }],
      },
    ]);

    // Sem passo válido, cai no formato simples de texto.
    expect(await loadConversationHistory('c1')).toEqual([
      { role: 'assistant', content: 'texto' },
    ]);
  });

  it('trunca resultado gigante para não estourar o contexto, avisando do corte', async () => {
    const enorme = 'x'.repeat(50_000);
    comMensagens([
      {
        role: 'assistant',
        content: 'ok',
        toolData: [
          { toolCallId: 'c1', toolName: 'get_connection_schema', args: {}, output: enorme },
        ],
      },
    ]);

    const hist = await loadConversationHistory('c1');
    const tool = hist[1] as { content: Array<{ output: { value: string } }> };
    const valor = tool.content[0].output.value;

    expect(valor.length).toBeLessThan(5000);
    expect(valor).toContain('truncado');
  });

  it('preserva a ordem cronológica em conversa de vários turnos', async () => {
    comMensagens([
      { role: 'user', content: 'p1' },
      {
        role: 'assistant',
        content: 'r1',
        toolData: [{ toolCallId: 'a', toolName: 't', args: {}, output: 1 }],
      },
      { role: 'user', content: 'p2' },
      { role: 'assistant', content: 'r2' },
    ]);

    expect((await loadConversationHistory('c1')).map((m) => m.role)).toEqual([
      'user',
      'assistant',
      'tool',
      'user',
      'assistant',
    ]);
  });
});

/**
 * T9 — Teste de INTEGRAÇÃO do mcp-adapter no caminho real do AI SDK.
 *
 * Os testes unitários em `mcp-adapter-unwrap.test.ts` provam as funções puras.
 * Este teste pega uma ToolDefinition REAL do MCP, builda a tool do AI SDK via
 * `convertMcpTool` (privada — re-exportada via `buildMcpToolsForActor`), chama
 * `tool.execute(...)` com args BUGADOS simulando o que o Claude manda, e
 * verifica que o HANDLER MCP recebe os args JÁ NORMALIZADOS.
 *
 * Como o handler MCP real toca banco/Redis, mockamos via `jest.mock` para
 * isolar. O que importa é: o Zod do `createDashboardBodySchema` é estrito —
 * se os args chegarem errados, ele rejeita com `invalid_type`. Se chegarem
 * normalizados, ele passa e o handler mockado registra os args recebidos.
 */

import type { ToolDefinition } from '@/modules/mcp/tools/types';

// Mock do registry TOOLS do MCP — usamos só create_dashboard, mockamos o handler.
const capturedHandlerArgs: unknown[] = [];
const mockedTool: ToolDefinition = {
  name: 'create_dashboard',
  description: 'mock create_dashboard',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'draftLayout'],
    properties: {
      title: { type: 'string' },
      draftLayout: {
        type: 'object',
        additionalProperties: false,
        required: ['filters', 'rows'],
        properties: {
          filters: { type: 'array', items: {} },
          rows: { type: 'array', items: {} },
        },
      },
    },
  },
  handler: async (args: unknown) => {
    capturedHandlerArgs.push(args);
    // Validação Zod real para garantir que passou pela validação do MCP.
    // (Aqui só capturamos — sem chamar service de verdade.)
    return { id: 'mock-id', receivedArgs: args };
  },
};

jest.mock('@/modules/mcp/tools', () => ({
  TOOLS: [
    {
      name: 'create_dashboard',
      description: 'mock create_dashboard',
      inputSchema: mockedTool.inputSchema,
      handler: mockedTool.handler,
    },
  ],
}));

import { buildMcpToolsForAgent } from '@/modules/agent/tools/mcp-adapter';

describe('T9 — INTEGRAÇÃO: builda a tool real e chama execute() com args bugados', () => {
  beforeEach(() => {
    capturedHandlerArgs.length = 0;
  });

  const actor = {
    userId: 'u-test',
    role: 'ADMIN' as const,
    isAdmin: true,
    departmentIds: [],
  } as any;

  function getTool() {
    const tools = buildMcpToolsForAgent(actor);
    const t = tools['create_dashboard'];
    if (!t) throw new Error('create_dashboard tool não encontrada');
    return t as any;
  }

  it('Args com filters/rows = "" chegam normalizados como [] no handler', async () => {
    const tool = getTool();
    const result = await tool.execute(
      { title: 'X', draftLayout: { filters: '', rows: '' } },
      { toolCallId: 'mock-call', messages: [] },
    );
    expect(capturedHandlerArgs).toHaveLength(1);
    expect(capturedHandlerArgs[0]).toEqual({
      title: 'X',
      draftLayout: { filters: [], rows: [] },
    });
    expect(result).toMatchObject({ id: 'mock-id' });
  });

  it('Args com draftLayout = JSON string chegam normalizados como objeto', async () => {
    const tool = getTool();
    const result = await tool.execute(
      { title: 'X', draftLayout: '{"filters":[],"rows":[]}' },
      { toolCallId: 'mock-call', messages: [] },
    );
    expect(capturedHandlerArgs).toHaveLength(1);
    expect(capturedHandlerArgs[0]).toEqual({
      title: 'X',
      draftLayout: { filters: [], rows: [] },
    });
    expect(result).toMatchObject({ id: 'mock-id' });
  });

  it('Args no formato CORRETO (regressão): chegam inalterados', async () => {
    const tool = getTool();
    await tool.execute(
      { title: 'X', draftLayout: { filters: [], rows: [] } },
      { toolCallId: 'mock-call', messages: [] },
    );
    expect(capturedHandlerArgs).toHaveLength(1);
    expect(capturedHandlerArgs[0]).toEqual({
      title: 'X',
      draftLayout: { filters: [], rows: [] },
    });
  });

  it('Args no formato LEGADO {item:[…]} chegam normalizados (T4 ainda funciona)', async () => {
    const tool = getTool();
    await tool.execute(
      {
        title: 'X',
        draftLayout: {
          filters: { item: [{ field: 'ano' }] },
          rows: { item: [] },
        },
      },
      { toolCallId: 'mock-call', messages: [] },
    );
    expect(capturedHandlerArgs).toHaveLength(1);
    expect(capturedHandlerArgs[0]).toEqual({
      title: 'X',
      draftLayout: {
        filters: [{ field: 'ano' }],
        rows: [],
      },
    });
  });

  it('Args com title mas SEM draftLayout chegam normalizados (filtra objeto ausente)', async () => {
    const tool = getTool();
    await tool.execute(
      { title: 'X' },
      { toolCallId: 'mock-call', messages: [] },
    );
    expect(capturedHandlerArgs).toHaveLength(1);
    expect(capturedHandlerArgs[0]).toEqual({ title: 'X' });
  });
});

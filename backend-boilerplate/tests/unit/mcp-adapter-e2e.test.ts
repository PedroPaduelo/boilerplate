/**
 * Testes de INTEGRAÇÃO do mcp-adapter no caminho real do AI SDK.
 *
 * Os testes unitários em `mcp-adapter-unwrap.test.ts` provam as funções puras.
 * Este arquivo pega uma ToolDefinition REAL do MCP, builda a tool do AI SDK
 * via `buildMcpToolsForAgent`, chama `tool.execute(...)` com args BUGADOS
 * simulando o que o Claude manda, e verifica que o HANDLER MCP recebe os
 * args JÁ NORMALIZADOS.
 *
 * Como o handler MCP real toca banco/Redis, mockamos via `jest.mock` para
 * isolar. O que importa: se os args chegarem errados, o Zod do handler MCP
 * rejeita com `invalid_type`. Se chegarem normalizados, ele passa e o
 * handler mockado registra os args recebidos.
 *
 * Cobre T9 (array/object) E T10 (integer/number/boolean).
 */

import type { ToolDefinition } from '@/modules/mcp/tools/types';

// Mock do registry TOOLS do MCP — duas tools: create_dashboard + add_chart_to_dashboard
// Cada uma captura seus args num array separado para inspeção.
const createCaptured: unknown[] = [];
const addCaptured: unknown[] = [];

const createDashboardTool: ToolDefinition = {
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
    createCaptured.push(args);
    return { id: 'mock-dash-id', receivedArgs: args };
  },
};

const addChartTool: ToolDefinition = {
  name: 'add_chart_to_dashboard',
  description: 'mock add_chart_to_dashboard',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['dashboardId', 'chartId'],
    properties: {
      dashboardId: { type: 'string' },
      chartId: { type: 'string' },
      rowId: { type: 'string' },
      span: { type: 'integer', minimum: 1, maximum: 12 },
      position: { type: 'integer', minimum: 0 },
      blockId: { type: 'string' },
      props: { type: 'object' },
    },
  },
  handler: async (args: unknown) => {
    addCaptured.push(args);
    return { id: 'mock-block-id', receivedArgs: args };
  },
};

jest.mock('@/modules/mcp/tools', () => ({
  TOOLS: [createDashboardTool, addChartTool],
}));

import { buildMcpToolsForAgent } from '@/modules/agent/tools/mcp-adapter';

const actor = {
  userId: 'u-test',
  role: 'ADMIN' as const,
  isAdmin: true,
  departmentIds: [],
} as any;

function getTool(name: string) {
  const tools = buildMcpToolsForAgent(actor);
  const t = tools[name];
  if (!t) throw new Error(`${name} tool não encontrada`);
  return t as any;
}

const ctx = { toolCallId: 'mock-call', messages: [] };

describe('T9 — INTEGRAÇÃO create_dashboard: array/object', () => {
  beforeEach(() => {
    createCaptured.length = 0;
    addCaptured.length = 0;
  });

  it('Args com filters/rows = "" chegam normalizados como [] no handler', async () => {
    const tool = getTool('create_dashboard');
    const result = await tool.execute(
      { title: 'X', draftLayout: { filters: '', rows: '' } },
      ctx,
    );
    expect(createCaptured).toHaveLength(1);
    expect(createCaptured[0]).toEqual({
      title: 'X',
      draftLayout: { filters: [], rows: [] },
    });
    expect(result).toMatchObject({ id: 'mock-dash-id' });
  });

  it('Args com draftLayout = JSON string chegam normalizados como objeto', async () => {
    const tool = getTool('create_dashboard');
    const result = await tool.execute(
      { title: 'X', draftLayout: '{"filters":[],"rows":[]}' },
      ctx,
    );
    expect(createCaptured).toHaveLength(1);
    expect(createCaptured[0]).toEqual({
      title: 'X',
      draftLayout: { filters: [], rows: [] },
    });
    expect(result).toMatchObject({ id: 'mock-dash-id' });
  });

  it('Args no formato CORRETO (regressão): chegam inalterados', async () => {
    const tool = getTool('create_dashboard');
    await tool.execute(
      { title: 'X', draftLayout: { filters: [], rows: [] } },
      ctx,
    );
    expect(createCaptured).toHaveLength(1);
    expect(createCaptured[0]).toEqual({
      title: 'X',
      draftLayout: { filters: [], rows: [] },
    });
  });

  it('Args no formato LEGADO {item:[…]} chegam normalizados (T4 ainda funciona)', async () => {
    const tool = getTool('create_dashboard');
    await tool.execute(
      {
        title: 'X',
        draftLayout: {
          filters: { item: [{ field: 'ano' }] },
          rows: { item: [] },
        },
      },
      ctx,
    );
    expect(createCaptured).toHaveLength(1);
    expect(createCaptured[0]).toEqual({
      title: 'X',
      draftLayout: {
        filters: [{ field: 'ano' }],
        rows: [],
      },
    });
  });

  it('Args com title mas SEM draftLayout chegam normalizados (filtra objeto ausente)', async () => {
    const tool = getTool('create_dashboard');
    await tool.execute({ title: 'X' }, ctx);
    expect(createCaptured).toHaveLength(1);
    expect(createCaptured[0]).toEqual({ title: 'X' });
  });
});

describe('T10 — INTEGRAÇÃO add_chart_to_dashboard: coerce string → number', () => {
  beforeEach(() => {
    createCaptured.length = 0;
    addCaptured.length = 0;
  });

  it('span="4" (string) → 4 (number) no handler — caso exato do test-sequencial.stream', async () => {
    const tool = getTool('add_chart_to_dashboard');
    await tool.execute(
      {
        dashboardId: 'd1',
        chartId: 'c1',
        span: '4',
      },
      ctx,
    );
    expect(addCaptured).toHaveLength(1);
    expect(addCaptured[0]).toEqual({
      dashboardId: 'd1',
      chartId: 'c1',
      span: 4,
    });
    expect(typeof (addCaptured[0] as any).span).toBe('number');
  });

  it('span=4 (number nativo) → preserva 4', async () => {
    const tool = getTool('add_chart_to_dashboard');
    await tool.execute(
      {
        dashboardId: 'd1',
        chartId: 'c1',
        span: 4,
      },
      ctx,
    );
    expect(addCaptured).toHaveLength(1);
    expect(addCaptured[0]).toEqual({
      dashboardId: 'd1',
      chartId: 'c1',
      span: 4,
    });
  });

  it('span e position ambos strings → ambos viram number', async () => {
    const tool = getTool('add_chart_to_dashboard');
    await tool.execute(
      {
        dashboardId: 'd1',
        chartId: 'c1',
        span: '6',
        position: '0',
      },
      ctx,
    );
    expect(addCaptured).toHaveLength(1);
    const captured = addCaptured[0] as any;
    expect(captured.span).toBe(6);
    expect(captured.position).toBe(0);
    expect(typeof captured.span).toBe('number');
    expect(typeof captured.position).toBe('number');
  });

  it('span inválida "abc" → preserva string (Zod rejeita depois)', async () => {
    // CRÍTICO: não substituir por undefined. Zod precisa ver a string
    // para emitir "Expected number, received string".
    const tool = getTool('add_chart_to_dashboard');
    await tool.execute(
      {
        dashboardId: 'd1',
        chartId: 'c1',
        span: 'abc',
      },
      ctx,
    );
    expect(addCaptured).toHaveLength(1);
    const captured = addCaptured[0] as any;
    expect(captured.span).toBe('abc');
    expect(typeof captured.span).toBe('string');
  });

  it('campos string (dashboardId, chartId) NÃO são tocados mesmo se valor for número', async () => {
    const tool = getTool('add_chart_to_dashboard');
    await tool.execute(
      {
        dashboardId: 'd1',
        chartId: 'c1',
        span: '4',
        // args extra não usados — preservados
        rowId: 'r1',
        blockId: 'b1',
      },
      ctx,
    );
    expect(addCaptured).toHaveLength(1);
    const captured = addCaptured[0] as any;
    expect(captured.dashboardId).toBe('d1');
    expect(captured.chartId).toBe('c1');
    expect(captured.rowId).toBe('r1');
    expect(captured.blockId).toBe('b1');
    expect(captured.span).toBe(4); // coerced
  });

  it('add_chart SEM span (campo ausente) → continua sem span no handler', async () => {
    // Regressão: o adapter não deve inventar span quando ele está ausente
    // (a tool usa o default 6 internamente).
    const tool = getTool('add_chart_to_dashboard');
    await tool.execute(
      {
        dashboardId: 'd1',
        chartId: 'c1',
      },
      ctx,
    );
    expect(addCaptured).toHaveLength(1);
    expect(addCaptured[0]).toEqual({
      dashboardId: 'd1',
      chartId: 'c1',
    });
  });
});

/**
 * Testes unitários do MCP adapter (T4 — fix arrays `{item:[]}`).
 *
 * O adapter converte ToolDefinitions do MCP em tools() do AI SDK. O problema
 * original: o LLM (Claude) às vezes emite `tables: {item: [...]}` no lugar
 * de `tables: [...]`. O AI SDK NÃO envolve arrays (verificado em
 * `node_modules/ai/dist/index.mjs`); o MCP server TAMBÉM não envolve
 * (verificado em `backend-boilerplate/src/modules/mcp/tools/*.ts`). O bug
 * é alucinação do modelo. Esta camada DEFENSIVA no adapter normaliza antes
 * do Zod dos handlers MCP rejeitar a forma.
 *
 * Estes testes cobrem as funções puras (`looksLikeItemWrapper`,
 * `collectArrayPaths`, `unwrapArrayWrappers`) SEM importar o adapter
 * inteiro (para não puxar `@/modules/mcp/tools` → `assertPermission` → que
 * exige o módulo `permissions` carregado). Os testes cobrem:
 *
 *   1. Heurística do wrapper: reconhece `{item:T}`, ignora arrays/objects
 *      com outras chaves, ignora null/primitivos.
 *   2. Coleta de paths array a partir do JSON schema (top-level, aninhado,
 *      mistura, schema vazio, $ref é pulado).
 *   3. Desempacotamento: array cru → inalterado; wrapper → desempacotado;
 *      path inválido (sub-obj ausente) → no-op; objeto legítimo com
 *      campo `item` mas outras chaves → não toca.
 *   4. Caso REAL do briefing: `get_connection_schema` com
 *      `tables: {item: ["biblioteca.aluno"]}` é normalizado.
 *   5. Caso `create_dashboard`: aninhamento profundo
 *      `draftLayout.filters: {item: [...]}` é normalizado.
 */

import {
  looksLikeItemWrapper,
  collectArrayPaths,
  unwrapArrayWrappers,
} from '@/modules/agent/tools/mcp-adapter';

describe('MCP adapter — looksLikeItemWrapper (heurística)', () => {
  it('reconhece `{item: [...]}` (caso clássico do bug)', () => {
    expect(looksLikeItemWrapper({ item: ['x'] })).toBe(true);
    expect(looksLikeItemWrapper({ item: [] })).toBe(true);
  });

  it('NÃO reconhece um array puro (já canônico)', () => {
    expect(looksLikeItemWrapper(['x'])).toBe(false);
  });

  it('NÃO reconhece objeto com outras chaves (não é wrapper)', () => {
    expect(looksLikeItemWrapper({ item: 'x', other: 'y' })).toBe(false);
    expect(looksLikeItemWrapper({ field: 'item', op: '=' })).toBe(false);
  });

  it('NÃO reconhece objeto vazio', () => {
    expect(looksLikeItemWrapper({})).toBe(false);
  });

  it('NÃO reconhece null/undefined/primitivos', () => {
    expect(looksLikeItemWrapper(null)).toBe(false);
    expect(looksLikeItemWrapper(undefined)).toBe(false);
    expect(looksLikeItemWrapper('item')).toBe(false);
    expect(looksLikeItemWrapper(42)).toBe(false);
  });
});

describe('MCP adapter — collectArrayPaths (paths a partir do JSON schema)', () => {
  it('top-level array', () => {
    const schema = {
      type: 'object',
      properties: { tables: { type: 'array', items: { type: 'string' } } },
    };
    expect(collectArrayPaths(schema)).toEqual([['tables']]);
  });

  it('aninhado em sub-objeto (create_chart.draftDataBinding.params)', () => {
    const schema = {
      type: 'object',
      properties: {
        draftDataBinding: {
          type: 'object',
          properties: { params: { type: 'array', items: {} } },
        },
      },
    };
    expect(collectArrayPaths(schema)).toEqual([['draftDataBinding', 'params']]);
  });

  it('múltiplos paths (create_dashboard.draftLayout.filters e rows)', () => {
    const schema = {
      type: 'object',
      properties: {
        draftLayout: {
          type: 'object',
          properties: {
            filters: { type: 'array', items: {} },
            rows: { type: 'array', items: {} },
          },
        },
      },
    };
    const paths = collectArrayPaths(schema);
    expect(paths).toContainEqual(['draftLayout', 'filters']);
    expect(paths).toContainEqual(['draftLayout', 'rows']);
    expect(paths).toHaveLength(2);
  });

  it('misto: campo não-array e array no mesmo nível', () => {
    const schema = {
      type: 'object',
      properties: {
        connectionId: { type: 'string' },
        tables: { type: 'array', items: { type: 'string' } },
      },
    };
    expect(collectArrayPaths(schema)).toEqual([['tables']]);
  });

  it('schema vazio/undefined → []', () => {
    expect(collectArrayPaths(undefined)).toEqual([]);
    expect(collectArrayPaths({})).toEqual([]);
    expect(collectArrayPaths({ type: 'object' })).toEqual([]);
  });

  it('pula $ref (sem resolver — não sabemos se é array)', () => {
    const schema = {
      type: 'object',
      properties: {
        ref: { $ref: '#/$defs/whatever' },
        tables: { type: 'array', items: { type: 'string' } },
      },
    };
    expect(collectArrayPaths(schema)).toEqual([['tables']]);
  });
});

describe('MCP adapter — unwrapArrayWrappers (desempacotamento)', () => {
  it('array puro → inalterado', () => {
    const args = { tables: ['x', 'y'] };
    unwrapArrayWrappers(args, [['tables']]);
    expect(args.tables).toEqual(['x', 'y']);
  });

  it('wrapper `{item:[...]}` → desempacotado para array', () => {
    const args = { tables: { item: ['biblioteca.aluno'] } };
    unwrapArrayWrappers(args, [['tables']]);
    expect(args.tables).toEqual(['biblioteca.aluno']);
  });

  it('sub-objeto ausente → no-op (não crasha)', () => {
    const args = { connectionId: 'c1' };
    unwrapArrayWrappers(args, [['draftDataBinding', 'params']]);
    expect(args).toEqual({ connectionId: 'c1' });
  });

  it('objeto legítimo com campo `item` mas outras chaves → NÃO mexe', () => {
    // Defesa: não podemos interpretar QUALQUER `{item:X}` como wrapper
    // porque o usuário poderia ter passado um filtro `{field:'item', op:'='}`
    // num path não-array. Aqui o path é top-level e o schema não tem array
    // nesse caminho, então nem entramos em unwrap.
    const args = { filter: { field: 'item', op: '=' } };
    unwrapArrayWrappers(args, [['tables']]); // só age em `tables`
    expect(args.filter).toEqual({ field: 'item', op: '=' });
  });

  it('campo array ausente → no-op', () => {
    const args = { connectionId: 'c1' };
    unwrapArrayWrappers(args, [['tables']]);
    expect(args).toEqual({ connectionId: 'c1' });
  });

  it('aninhado: draftLayout.filters wrapper → desempacotado', () => {
    const args = {
      draftLayout: {
        filters: { item: [{ field: 'x' }] },
        rows: [],
      },
    };
    unwrapArrayWrappers(args, [
      ['draftLayout', 'filters'],
      ['draftLayout', 'rows'],
    ]);
    expect(args.draftLayout.filters).toEqual([{ field: 'x' }]);
    expect(args.draftLayout.rows).toEqual([]);
  });

  it('aninhado: sub-obj null → no-op (sem crash)', () => {
    const args = { draftLayout: null };
    unwrapArrayWrappers(args, [['draftLayout', 'filters']]);
    expect(args).toEqual({ draftLayout: null });
  });

  it('aninhado: sub-obj é array → no-op', () => {
    const args = { draftLayout: ['x'] };
    unwrapArrayWrappers(args, [['draftLayout', 'filters']]);
    expect(args).toEqual({ draftLayout: ['x'] });
  });
});

describe('MCP adapter — integração com inputSchema REAL das tools', () => {
  it('get_connection_schema: arrays no top-level (tables)', () => {
    const schema = {
      type: 'object',
      properties: {
        connectionId: { type: 'string' },
        tables: { type: 'array', items: { type: 'string' } },
        page: { type: 'integer' },
      },
    };
    const paths = collectArrayPaths(schema);
    const args = {
      connectionId: 'c1',
      tables: { item: ['biblioteca.aluno'] }, // BUG original
      page: 1,
    };
    unwrapArrayWrappers(args, paths);
    expect(args.tables).toEqual(['biblioteca.aluno']);
    expect(args.connectionId).toBe('c1');
    expect(args.page).toBe(1);
  });

  it('create_chart: array aninhado em draftDataBinding.params', () => {
    const schema = {
      type: 'object',
      properties: {
        draftDataBinding: {
          type: 'object',
          properties: {
            params: { type: 'array', items: {} },
          },
        },
      },
    };
    const paths = collectArrayPaths(schema);
    const args = {
      draftDataBinding: {
        connectionId: 'c1',
        query: 'SELECT $1::int',
        params: { item: [42] }, // BUG aninhado
      },
    };
    unwrapArrayWrappers(args, paths);
    expect(args.draftDataBinding.params).toEqual([42]);
    expect(args.draftDataBinding.connectionId).toBe('c1');
  });

  it('create_dashboard: arrays aninhados em draftLayout', () => {
    const schema = {
      type: 'object',
      properties: {
        draftLayout: {
          type: 'object',
          properties: {
            filters: { type: 'array', items: {} },
            rows: { type: 'array', items: {} },
          },
        },
      },
    };
    const paths = collectArrayPaths(schema);
    const args = {
      title: 'D',
      draftLayout: {
        filters: { item: [{ field: 'ano', op: '=', value: 2025 }] },
        rows: { item: [{ id: 'r1', blocks: [] }] },
      },
    };
    unwrapArrayWrappers(args, paths);
    expect(args.draftLayout.filters).toEqual([
      { field: 'ano', op: '=', value: 2025 },
    ]);
    expect(args.draftLayout.rows).toEqual([{ id: 'r1', blocks: [] }]);
  });
});
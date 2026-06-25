/**
 * Testes do T9 — defesa contra serialização errada do LLM em strings.
 *
 * O T4 já trata o caso `{item:[...]}` (wrapper). O T9 cobre TRÊS novos
 * formatos que o Claude emite às vezes (reproduzidos via SSE em
 * `_meta/agent-e2e/test-vazio.stream`):
 *
 *   A. String vazia `""` no lugar de array  → vira `[]`
 *      Ex.: `args.draftLayout.filters = ""`
 *
 *   B. String vazia `""` no lugar de objeto → vira `{}`
 *      Ex.: `args.draftLayout = ""` (defensivo — Zod ainda rejeita `{}`
 *      porque draftLayout exige `filters` e `rows`, mas pelo menos não
 *      estoura com "Expected object, received string")
 *
 *   C. String JSON serializada no lugar de objeto/array → vira objeto/array
 *      Ex.: `args.draftLayout = "{\"filters\":[],\"rows\":[]}"`
 *
 *   D. (legado T4) `{item: [...]}` → vira array
 *
 * Estes testes cobrem as funções puras sem importar o adapter inteiro
 * (evita `@/modules/mcp/tools` → `assertPermission`).
 */

import {
  collectArrayPaths,
  collectObjectPaths,
  looksLikeItemWrapper,
  unwrapArrayWrappers,
} from '@/modules/agent/tools/mcp-adapter';

// ----------------------------------------------------------------------------
// collectObjectPaths — paths esperados como OBJETO
// ----------------------------------------------------------------------------

describe('MCP adapter — collectObjectPaths', () => {
  it('top-level object (sub-objeto do args raiz)', () => {
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
    expect(collectObjectPaths(schema)).toEqual([['draftLayout']]);
  });

  it('NÃO inclui a raiz []', () => {
    const schema = {
      type: 'object',
      properties: { x: { type: 'string' } },
    };
    // O args raiz é SEMPRE objeto, não conta como path.
    expect(collectObjectPaths(schema)).toEqual([]);
  });

  it('aninhado em mais de um nível', () => {
    const schema = {
      type: 'object',
      properties: {
        a: {
          type: 'object',
          properties: {
            b: {
              type: 'object',
              properties: { c: { type: 'string' } },
            },
          },
        },
      },
    };
    expect(collectObjectPaths(schema)).toEqual([['a'], ['a', 'b']]);
  });

  it('múltiplos objects no mesmo nível', () => {
    const schema = {
      type: 'object',
      properties: {
        x: { type: 'object', properties: {} },
        y: { type: 'object', properties: { z: { type: 'string' } } },
      },
    };
    expect(collectObjectPaths(schema)).toEqual([['x'], ['y']]);
  });

  it('campo string/array NÃO entra nos object paths', () => {
    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        rows: { type: 'array', items: {} },
        draftLayout: { type: 'object', properties: {} },
      },
    };
    expect(collectObjectPaths(schema)).toEqual([['draftLayout']]);
  });

  it('schema vazio/undefined → []', () => {
    expect(collectObjectPaths(undefined)).toEqual([]);
    expect(collectObjectPaths({})).toEqual([]);
    expect(collectObjectPaths({ type: 'object' })).toEqual([]);
  });

  it('pula $ref', () => {
    const schema = {
      type: 'object',
      properties: {
        ref: { $ref: '#/$defs/x' },
        draftLayout: { type: 'object', properties: {} },
      },
    };
    expect(collectObjectPaths(schema)).toEqual([['draftLayout']]);
  });

  it('create_chart — schema real: draftDataBinding é object, draftProps é object', () => {
    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        catalogType: { type: 'string' },
        draftProps: { type: 'object' }, // na prática pode ter properties
        draftDataBinding: {
          type: 'object',
          properties: { params: { type: 'array', items: {} } },
        },
      },
    };
    const paths = collectObjectPaths(schema);
    expect(paths).toContainEqual(['draftProps']);
    expect(paths).toContainEqual(['draftDataBinding']);
    expect(paths).not.toContainEqual([]);
  });
});

// ----------------------------------------------------------------------------
// Caso A — string vazia no lugar de array
// ----------------------------------------------------------------------------

describe('T9 — string vazia "" no lugar de array → []', () => {
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      draftLayout: {
        type: 'object',
        properties: {
          filters: { type: 'array', items: {} },
          rows: { type: 'array', items: {} },
        },
      },
    },
  };

  it('draftLayout.filters: "" → []', () => {
    const args: any = { title: 'X', draftLayout: { filters: '', rows: [{ id: 'r1' }] } };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.draftLayout.filters).toEqual([]);
  });

  it('draftLayout.rows: "" → []', () => {
    const args: any = { title: 'X', draftLayout: { filters: [{ f: 1 }], rows: '' } };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.draftLayout.rows).toEqual([]);
  });

  it('ambos os campos vazios → ambos viram []', () => {
    const args: any = { title: 'X', draftLayout: { filters: '', rows: '' } };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.draftLayout.filters).toEqual([]);
    expect(args.draftLayout.rows).toEqual([]);
  });

  it('string com só whitespace → []', () => {
    const args: any = { draftLayout: { filters: '   ', rows: [] } };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.draftLayout.filters).toEqual([]);
  });

  it('array vazio explícito → preserva []', () => {
    const args: any = { draftLayout: { filters: [], rows: [] } };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.draftLayout.filters).toEqual([]);
    expect(args.draftLayout.rows).toEqual([]);
  });

  it('array com itens → preserva (intocado)', () => {
    const args: any = { draftLayout: { filters: [], rows: [{ id: 'r1', blocks: [] }] } };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.draftLayout.rows).toEqual([{ id: 'r1', blocks: [] }]);
  });

  it('top-level array (get_connection_schema.tables): "" → []', () => {
    const schema2 = {
      type: 'object',
      properties: { tables: { type: 'array', items: { type: 'string' } } },
    };
    const args: any = { tables: '' };
    unwrapArrayWrappers(args, collectArrayPaths(schema2), collectObjectPaths(schema2));
    expect(args.tables).toEqual([]);
  });
});

// ----------------------------------------------------------------------------
// Caso B — string vazia no lugar de objeto → {}
// ----------------------------------------------------------------------------

describe('T9 — string vazia "" no lugar de objeto → {}', () => {
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      draftLayout: {
        type: 'object',
        properties: {
          filters: { type: 'array', items: {} },
          rows: { type: 'array', items: {} },
        },
      },
    },
  };

  it('draftLayout: "" → {} (vazio)', () => {
    const args: any = { title: 'X', draftLayout: '' };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.draftLayout).toEqual({});
  });

  it('draftLayout é criado como {} e arrays filhos permanecem undefined', () => {
    const args: any = { title: 'X', draftLayout: '' };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    // filters/rows NÃO são criados (não estavam presentes antes) — Zod
    // sinaliza "Required" depois, mas com mensagem mais útil que "Expected
    // object, received string".
    expect(args.draftLayout).toEqual({});
  });
});

// ----------------------------------------------------------------------------
// Caso C — string JSON serializada
// ----------------------------------------------------------------------------

describe('T9 — string JSON serializada → objeto/array parseado', () => {
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      draftLayout: {
        type: 'object',
        properties: {
          filters: { type: 'array', items: {} },
          rows: { type: 'array', items: {} },
        },
      },
    },
  };

  it('draftLayout: \'{"filters":[],"rows":[]}\' → objeto parseado', () => {
    const args: any = {
      title: 'X',
      draftLayout: '{"filters":[],"rows":[]}',
    };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.draftLayout).toEqual({ filters: [], rows: [] });
  });

  it('draftLayout: \'{"filters":[],"rows":[{"id":"r1"}]}\' → objeto parseado', () => {
    const args: any = {
      title: 'X',
      draftLayout: '{"filters":[],"rows":[{"id":"r1","blocks":[]}]}',
    };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.draftLayout).toEqual({
      filters: [],
      rows: [{ id: 'r1', blocks: [] }],
    });
  });

  it('JSON inválido no caminho de objeto → NÃO mexe (preserva string)', () => {
    const args: any = { title: 'X', draftLayout: '{not valid json}' };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    // Não parseou (não começa com `{` válido), mantém string. Zod vai
    // rejeitar depois — mas é um erro que o LLM pode corrigir.
    expect(typeof args.draftLayout).toBe('string');
  });

  it('string num path de array: \'[1,2,3]\' → array parseado', () => {
    // caso hipotético: params em draftDataBinding chega como string JSON
    const schema2 = {
      type: 'object',
      properties: {
        draftDataBinding: {
          type: 'object',
          properties: { params: { type: 'array', items: {} } },
        },
      },
    };
    const args: any = {
      draftDataBinding: { connectionId: 'c1', query: 'SELECT $1', params: '[42,"x"]' },
    };
    unwrapArrayWrappers(args, collectArrayPaths(schema2), collectObjectPaths(schema2));
    expect(args.draftDataBinding.params).toEqual([42, 'x']);
  });

  it('JSON que parseia para OBJETO num path de ARRAY → NÃO aplica (mismatch)', () => {
    const args: any = { draftLayout: { filters: '{"foo":1}', rows: [] } };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    // filters continua string — o JSON era objeto, não array.
    expect(args.draftLayout.filters).toBe('{"foo":1}');
  });
});

// ----------------------------------------------------------------------------
// Caso D — legado {item:[...]} ainda funciona (regressão T4)
// ----------------------------------------------------------------------------

describe('T9 — legado {item:[…]} ainda funciona (regressão T4)', () => {
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

  it('rows: {item:[…]} → rows: […]', () => {
    const args: any = {
      draftLayout: {
        filters: [],
        rows: { item: [{ id: 'r1', blocks: [{ id: 'b1', type: 'kpi', span: 4 }] }] },
      },
    };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.draftLayout.rows).toEqual([
      { id: 'r1', blocks: [{ id: 'b1', type: 'kpi', span: 4 }] },
    ]);
  });

  it('filters: {item:[…]} → filters: […]', () => {
    const args: any = {
      draftLayout: {
        filters: { item: [{ field: 'ano', op: '=', value: 2025 }] },
        rows: [],
      },
    };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.draftLayout.filters).toEqual([
      { field: 'ano', op: '=', value: 2025 },
    ]);
  });
});

// ----------------------------------------------------------------------------
// Sanidade — campos NÃO esperados (strings esperadas como string) NÃO mexem
// ----------------------------------------------------------------------------

describe('T9 — campos NÃO-array/NÃO-objeto NÃO são tocados', () => {
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      connectionId: { type: 'string' },
      visibility: { type: 'string', enum: ['PRIVATE', 'DEPARTMENT', 'ORG'] },
      draftLayout: {
        type: 'object',
        properties: {
          filters: { type: 'array', items: {} },
          rows: { type: 'array', items: {} },
        },
      },
    },
  };

  it('title é string esperada como string → preserva (não vira objeto/array)', () => {
    const args: any = { title: 'Dashboard vazio', draftLayout: { filters: [], rows: [] } };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.title).toBe('Dashboard vazio');
  });

  it('connectionId preservado mesmo se vier "{}" (não está em objectPaths)', () => {
    const args: any = { connectionId: '{}', draftLayout: { filters: [], rows: [] } };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.connectionId).toBe('{}');
  });

  it('visibility preservado (não toca em strings enum)', () => {
    const args: any = {
      visibility: 'PRIVATE',
      draftLayout: { filters: [], rows: [] },
    };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.visibility).toBe('PRIVATE');
  });
});

// ----------------------------------------------------------------------------
// Cenário real do bug — arg que o Claude mandou em _meta/agent-e2e/test-vazio
// ----------------------------------------------------------------------------

describe('T9 — reprodução exata dos args do bug real', () => {
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      draftLayout: {
        type: 'object',
        properties: {
          filters: { type: 'array', items: {} },
          rows: { type: 'array', items: {} },
        },
      },
    },
  };

  it('Tentativa 1 do LLM: filters/rows como ""', () => {
    const args: any = {
      title: 'Dashboard vazio',
      draftLayout: { filters: '', rows: '' },
    };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    // Esperado: passa o Zod de `createDashboardBodySchema` (filters/rows []).
    expect(args).toEqual({
      title: 'Dashboard vazio',
      draftLayout: { filters: [], rows: [] },
    });
  });

  it('Tentativa 3 do LLM: draftLayout inteiro como JSON string', () => {
    const args: any = {
      title: 'Dashboard vazio',
      draftLayout: '{"filters":[],"rows":[]}',
    };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args).toEqual({
      title: 'Dashboard vazio',
      draftLayout: { filters: [], rows: [] },
    });
  });

  it('Mistura: draftLayout objeto + filters "" + rows JSON string', () => {
    // Edge case improvável mas defensivo.
    const args: any = {
      title: 'X',
      draftLayout: { filters: '', rows: '[]' },
    };
    unwrapArrayWrappers(args, collectArrayPaths(schema), collectObjectPaths(schema));
    expect(args.draftLayout.filters).toEqual([]);
    expect(args.draftLayout.rows).toEqual([]);
  });
});

// ----------------------------------------------------------------------------
// looksLikeItemWrapper (smoke)
// ----------------------------------------------------------------------------

describe('T9 — looksLikeItemWrapper (smoke)', () => {
  it('regressão continua reconhecendo {item:[…]}', () => {
    expect(looksLikeItemWrapper({ item: ['x'] })).toBe(true);
    expect(looksLikeItemWrapper({ item: [] })).toBe(true);
  });

  it('regressão continua rejeitando objetos legítimos', () => {
    expect(looksLikeItemWrapper({ field: 'item', op: '=' })).toBe(false);
    expect(looksLikeItemWrapper({ item: 'x', other: 'y' })).toBe(false);
    expect(looksLikeItemWrapper(null)).toBe(false);
    expect(looksLikeItemWrapper(undefined)).toBe(false);
    expect(looksLikeItemWrapper('item')).toBe(false);
  });
});
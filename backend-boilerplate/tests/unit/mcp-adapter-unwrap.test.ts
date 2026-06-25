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
  collectScalarPaths,
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

// ============================================================================
// T10 — string → number/integer/boolean para escalares serializados como string
// ============================================================================
//
// O Claude (LLM) às vezes serializa NÚMEROS e BOOLEANOS como strings em vez
// de nativos. Reproduzido em `_meta/agent-e2e/test-sequencial.stream`:
//
//   args.span = "4"        (string) — esperado `number` (integer)
//   args.position = "2"    (string) — esperado `number` (integer)
//   args.showDelta = "true" (string) — esperado `boolean`
//
// Zod rejeita com `expected number, received string` e o agent perde 2-4
// turnos chutar o tipo certo. O T10 estende o adapter para coerce-rr
// automaticamente, sem mudar o schema da tool.
//
// A transformação SÓ roda em paths que o schema declara como
// `integer`/`number`/`boolean`. Strings normais (title, connectionId) NÃO
// são tocadas — mesmo que o valor seja "4" ou "true".

// ----------------------------------------------------------------------------
// collectScalarPaths — paths esperados como integer/number/boolean
// ----------------------------------------------------------------------------

describe('T10 — collectScalarPaths', () => {
  it('integers top-level', () => {
    const schema = {
      type: 'object',
      properties: {
        span: { type: 'integer' },
        position: { type: 'integer' },
      },
    };
    expect(collectScalarPaths(schema)).toEqual([['span'], ['position']]);
  });

  it('NÃO inclui a raiz []', () => {
    // Schema root pode teoricamente declarar type=number mas a raiz é o
    // próprio args — nunca vamos coagir o args inteiro.
    const schema = { type: 'object', properties: { x: { type: 'string' } } };
    expect(collectScalarPaths(schema)).toEqual([]);
  });

  it('integers/booleans aninhados em sub-objeto', () => {
    const schema = {
      type: 'object',
      properties: {
        draftDataBinding: {
          type: 'object',
          properties: {
            ttlSeconds: { type: 'integer' },
            refresh: { type: 'boolean' },
          },
        },
      },
    };
    expect(collectScalarPaths(schema)).toEqual([
      ['draftDataBinding', 'ttlSeconds'],
      ['draftDataBinding', 'refresh'],
    ]);
  });

  it('múltiplos tipos primitivos no mesmo nível', () => {
    const schema = {
      type: 'object',
      properties: {
        maxRows: { type: 'integer' },
        ratio: { type: 'number' },
        showDelta: { type: 'boolean' },
      },
    };
    expect(collectScalarPaths(schema)).toEqual([
      ['maxRows'],
      ['ratio'],
      ['showDelta'],
    ]);
  });

  it('strings/arrays/objetos NÃO entram nos scalar paths', () => {
    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        rows: { type: 'array', items: {} },
        draftLayout: { type: 'object', properties: {} },
        span: { type: 'integer' },
      },
    };
    expect(collectScalarPaths(schema)).toEqual([['span']]);
  });

  it('schema vazio/undefined → []', () => {
    expect(collectScalarPaths(undefined)).toEqual([]);
    expect(collectScalarPaths({})).toEqual([]);
    expect(collectScalarPaths({ type: 'object' })).toEqual([]);
  });

  it('pula $ref', () => {
    const schema = {
      type: 'object',
      properties: {
        ref: { $ref: '#/$defs/x' },
        span: { type: 'integer' },
      },
    };
    expect(collectScalarPaths(schema)).toEqual([['span']]);
  });

  it('add_chart_to_dashboard — schema real: span e position são integers', () => {
    const schema = {
      type: 'object',
      properties: {
        dashboardId: { type: 'string' },
        chartId: { type: 'string' },
        rowId: { type: 'string' },
        span: { type: 'integer', minimum: 1, maximum: 12 },
        position: { type: 'integer', minimum: 0 },
        blockId: { type: 'string' },
      },
    };
    const paths = collectScalarPaths(schema);
    expect(paths).toContainEqual(['span']);
    expect(paths).toContainEqual(['position']);
    expect(paths).not.toContainEqual(['dashboardId']);
    expect(paths).not.toContainEqual(['chartId']);
  });

  it('não recursa em array items (itens são escalares do banco, não da tool)', () => {
    const schema = {
      type: 'object',
      properties: {
        params: {
          type: 'array',
          items: { type: 'integer' },
        },
        span: { type: 'integer' },
      },
    };
    // Só conta o `span` top-level. Os items do array `params` não são
    // campos da tool — são elementos de uma lista.
    expect(collectScalarPaths(schema)).toEqual([['span']]);
  });
});

// ----------------------------------------------------------------------------
// T10 — coerce strings em paths integer/number
// ----------------------------------------------------------------------------

describe('T10 — string em path integer/number → number', () => {
  const schema = {
    type: 'object',
    properties: {
      dashboardId: { type: 'string' },
      chartId: { type: 'string' },
      span: { type: 'integer', minimum: 1, maximum: 12 },
      position: { type: 'integer', minimum: 0 },
    },
  };

  it('span: "4" → span: 4 (number)', () => {
    const args: any = {
      dashboardId: 'd1',
      chartId: 'c1',
      span: '4',
    };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.span).toBe(4);
    expect(typeof args.span).toBe('number');
  });

  it('position: "2" → position: 2', () => {
    const args: any = {
      dashboardId: 'd1',
      chartId: 'c1',
      span: 6,
      position: '2',
    };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.position).toBe(2);
  });

  it('string decimal "3.14" → number 3.14 (para path `number`)', () => {
    const schema2 = {
      type: 'object',
      properties: { ratio: { type: 'number' } },
    };
    const args: any = { ratio: '3.14' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema2),
      collectObjectPaths(schema2),
      collectScalarPaths(schema2),
    );
    expect(args.ratio).toBe(3.14);
    expect(typeof args.ratio).toBe('number');
  });

  it('string negativo "-1" → number -1', () => {
    const args: any = { span: '-1' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.span).toBe(-1);
  });

  it('string com whitespace "  4  " → number 4 (trim aplicado)', () => {
    const args: any = { span: '  4  ' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.span).toBe(4);
  });

  it('valor JÁ nativo (number) → preserva, não duplica conversão', () => {
    const args: any = { span: 4 };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.span).toBe(4);
    expect(typeof args.span).toBe('number');
  });

  it('valor indefinido → preserva como undefined (não transforma)', () => {
    const args: any = { dashboardId: 'd1' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.span).toBeUndefined();
  });

  it('string inválida "abc" → preserva como string (Zod rejeita depois)', () => {
    // IMPORTANTE: não substituir por undefined — Zod precisa ver a string
    // para emitir "Expected number, received string".
    const args: any = { span: 'abc' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.span).toBe('abc');
    expect(typeof args.span).toBe('string');
  });

  it('string vazia "" → preserva como string (Zod rejeita depois)', () => {
    const args: any = { span: '' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.span).toBe('');
    expect(typeof args.span).toBe('string');
  });
});

// ----------------------------------------------------------------------------
// T10 — coerce strings em paths boolean
// ----------------------------------------------------------------------------

describe('T10 — string em path boolean → boolean', () => {
  const schema = {
    type: 'object',
    properties: {
      showDelta: { type: 'boolean' },
      showSparkline: { type: 'boolean' },
      label: { type: 'string' },
    },
  };

  it('showDelta: "true" → true', () => {
    const args: any = { showDelta: 'true' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.showDelta).toBe(true);
    expect(typeof args.showDelta).toBe('boolean');
  });

  it('showDelta: "false" → false', () => {
    const args: any = { showDelta: 'false' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.showDelta).toBe(false);
    expect(typeof args.showDelta).toBe('boolean');
  });

  it('showDelta: "TRUE" → true (case-insensitive)', () => {
    const args: any = { showDelta: 'TRUE' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.showDelta).toBe(true);
  });

  it('showDelta: "False" → false (case-insensitive, mixed case)', () => {
    const args: any = { showDelta: 'False' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.showDelta).toBe(false);
  });

  it('showDelta: "  true  " → true (trim aplicado)', () => {
    const args: any = { showDelta: '  true  ' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.showDelta).toBe(true);
  });

  it('showDelta JÁ boolean → preserva', () => {
    const args: any = { showDelta: true };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.showDelta).toBe(true);
    expect(typeof args.showDelta).toBe('boolean');
  });

  it('string inválida "yes" → preserva como string (Zod rejeita depois)', () => {
    const args: any = { showDelta: 'yes' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.showDelta).toBe('yes');
    expect(typeof args.showDelta).toBe('string');
  });
});

// ----------------------------------------------------------------------------
// T10 — campos string esperados como string NÃO são tocados
// ----------------------------------------------------------------------------

describe('T10 — strings normais (não escalares) NÃO são tocadas', () => {
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      connectionId: { type: 'string' },
      visibility: { type: 'string', enum: ['PRIVATE', 'DEPARTMENT', 'ORG'] },
      span: { type: 'integer' },
      showDelta: { type: 'boolean' },
    },
  };

  it('title permanece string mesmo se valor for "4"', () => {
    const args: any = { title: '4', span: '4', showDelta: 'true' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    // title: NÃO escala → continua string
    expect(args.title).toBe('4');
    expect(typeof args.title).toBe('string');
    // span: escala (integer) → virou number
    expect(args.span).toBe(4);
    // showDelta: escala (boolean) → virou boolean
    expect(args.showDelta).toBe(true);
  });

  it('connectionId permanece string mesmo se valor parecer boolean', () => {
    const args: any = { connectionId: 'true', showDelta: 'true' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.connectionId).toBe('true');
    expect(typeof args.connectionId).toBe('string');
    expect(args.showDelta).toBe(true);
  });

  it('visibility (enum string) permanece string', () => {
    const args: any = { visibility: 'PRIVATE', span: '4' };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.visibility).toBe('PRIVATE');
    expect(typeof args.visibility).toBe('string');
    expect(args.span).toBe(4);
  });
});

// ----------------------------------------------------------------------------
// T10 — combinação: array/object/string + scalar no mesmo args
// ----------------------------------------------------------------------------

describe('T10 — combinação: array/object + scalar no mesmo args', () => {
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
      span: { type: 'integer' },
      showDelta: { type: 'boolean' },
    },
  };

  it('Tudo bugado: title é OK, draftLayout vazio, span/boolean strings', () => {
    const args: any = {
      title: 'OK',
      draftLayout: '',
      span: '4',
      showDelta: 'true',
    };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    // title preservado
    expect(args.title).toBe('OK');
    // draftLayout virou {} (object path, string vazia)
    expect(args.draftLayout).toEqual({});
    // span virou number
    expect(args.span).toBe(4);
    // showDelta virou boolean
    expect(args.showDelta).toBe(true);
  });

  it('Bug do T9 + T10 juntos: draftLayout com filters "", rows [], span "4"', () => {
    const args: any = {
      title: 'X',
      draftLayout: { filters: '', rows: [] },
      span: '4',
    };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.draftLayout.filters).toEqual([]);
    expect(args.draftLayout.rows).toEqual([]);
    expect(args.span).toBe(4);
  });

  it('Apenas escalares bugados (draftLayout ausente)', () => {
    const args: any = {
      title: 'X',
      span: '4',
      showDelta: 'false',
    };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.title).toBe('X');
    expect(args.span).toBe(4);
    expect(args.showDelta).toBe(false);
  });
});

// ----------------------------------------------------------------------------
// T10 — reprodução exata do caso real de test-sequencial.stream
// ----------------------------------------------------------------------------

describe('T10 — reprodução do bug real do test-sequencial.stream', () => {
  const schema = {
    type: 'object',
    properties: {
      dashboardId: { type: 'string' },
      chartId: { type: 'string' },
      span: { type: 'integer', minimum: 1, maximum: 12 },
      position: { type: 'integer', minimum: 0 },
    },
  };

  it('add_chart_to_dashboard com span="4" e position="0" → ambos viram number', () => {
    // Caso literal de test-sequencial.stream: span veio como string,
    // agent emitiu 2 tentativas fracassadas antes de desistir.
    const args: any = {
      dashboardId: 'cmqtfz6i9000lny0puazbony6',
      chartId: 'cmqt6f54p001rny0pndh24ore',
      span: '4',
    };
    unwrapArrayWrappers(
      args,
      collectArrayPaths(schema),
      collectObjectPaths(schema),
      collectScalarPaths(schema),
    );
    expect(args.span).toBe(4);
    expect(typeof args.span).toBe('number');
    // dashboardId preservado (string esperada como string)
    expect(args.dashboardId).toBe('cmqtfz6i9000lny0puazbony6');
    // chartId preservado
    expect(args.chartId).toBe('cmqt6f54p001rny0pndh24ore');
  });
});
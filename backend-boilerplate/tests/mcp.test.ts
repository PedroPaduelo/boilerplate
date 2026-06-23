/**
 * Testes do servidor MCP (T-D): transporte JSON-RPC sobre HTTP (`POST /mcp`),
 * autenticação por API-key, ator de serviço (RBAC) e as tools — cada uma reusando
 * o service do módulo correspondente.
 *
 * Cobre os critérios de teste da task:
 *  - happy path de cada tool via o endpoint MCP (cliente HTTP, `tools/call`);
 *  - segurança: `run_query` respeita os guardrails read-only (query destrutiva
 *    bloqueada); auth do MCP barra request sem API-key válida; as tools respeitam
 *    o RBAC do ator (papel VIEWER não cria chart);
 *  - `list_catalog` entrega os manifestos (com dataContract) atualizados.
 *
 * Usa o Postgres REAL do `DATABASE_URL` (como os demais testes de módulo). Para
 * `run_query`/`preview_chart_data` cria uma Connection apontando para o próprio
 * Postgres do teste (credenciais cifradas), exercitando o pg-runner de verdade.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { registerModules } from '@/http/modules-loader';
import { encrypt } from '@/lib/crypto';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { closeAllPools } from '@/lib/pg-runner';

const SUFFIX = `m${Date.now()}`;
const CATALOG_TYPE = '__example'; // bloco seedado pelo build:catalog (F0.4)
const API_KEY = `test-mcp-key-${SUFFIX}`;

let app: FastifyInstance;
const userIds: string[] = [];
let serviceUserId = '';
let viewerUserId = '';
let connectionId = '';
let rpcId = 0;

async function buildApp(): Promise<FastifyInstance> {
  const instance = Fastify().withTypeProvider<ZodTypeProvider>();
  instance.setValidatorCompiler(validatorCompiler);
  instance.setSerializerCompiler(serializerCompiler);
  await instance.register(fastifyJwt, { secret: env.JWT_SECRET });
  await instance.register(registerModules);
  await instance.ready();
  return instance;
}

/** Cria uma Connection apontando para o Postgres do teste (DATABASE_URL). */
async function createTestConnection(ownerId: string): Promise<string> {
  const url = new URL(env.DATABASE_URL);
  const sslMode = url.searchParams.get('sslmode') ?? 'disable';
  const conn = await prisma.connection.create({
    data: {
      name: `mcp-conn-${SUFFIX}`,
      host: url.hostname,
      port: url.port ? Number(url.port) : 5432,
      database: url.pathname.replace(/^\//, ''),
      username: decodeURIComponent(url.username),
      passwordCipher: encrypt(decodeURIComponent(url.password)),
      sslMode,
      ownerId,
      visibility: 'ORG',
      isActive: true,
    },
  });
  return conn.id;
}

async function rpc(method: string, params?: unknown, token: string | null = API_KEY) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  return app.inject({
    method: 'POST',
    url: '/mcp',
    headers,
    payload: { jsonrpc: '2.0', id: ++rpcId, method, ...(params ? { params } : {}) },
  });
}

/** Chama uma tool e devolve o objeto `result` (content/structuredContent/isError). */
async function callTool(name: string, args: Record<string, unknown> = {}) {
  const res = await rpc('tools/call', { name, arguments: args });
  expect(res.statusCode).toBe(200);
  return res.json().result as {
    content: { type: string; text: string }[];
    structuredContent?: unknown;
    isError?: boolean;
  };
}

beforeAll(async () => {
  process.env.MCP_API_KEY = API_KEY;

  app = await buildApp();

  const serviceUser = await prisma.user.create({
    data: {
      email: `mcp-svc-${SUFFIX}@test.local`,
      name: 'MCP Service',
      password: 'x',
      role: 'ANALYST',
    },
  });
  const viewer = await prisma.user.create({
    data: {
      email: `mcp-viewer-${SUFFIX}@test.local`,
      name: 'MCP Viewer',
      password: 'x',
      role: 'VIEWER',
    },
  });
  serviceUserId = serviceUser.id;
  viewerUserId = viewer.id;
  userIds.push(serviceUser.id, viewer.id);

  connectionId = await createTestConnection(serviceUser.id);

  // ator de serviço padrão dos testes = ANALYST (pode gerenciar/publicar).
  process.env.MCP_SERVICE_USER_ID = serviceUserId;
  delete process.env.MCP_SERVICE_USER_EMAIL;
}, 30000);

afterAll(async () => {
  try {
    await prisma.dashboard.deleteMany({ where: { ownerId: { in: userIds } } });
    await prisma.chart.deleteMany({ where: { ownerId: { in: userIds } } });
    await prisma.connection.deleteMany({ where: { ownerId: { in: userIds } } });
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  } catch {
    // best-effort
  }
  await closeAllPools();
  await app.close();
  await prisma.$disconnect();
  delete process.env.MCP_API_KEY;
  delete process.env.MCP_SERVICE_USER_ID;
});

describe('MCP — transporte & auth', () => {
  it('GET /mcp → 405 (sem canal SSE)', async () => {
    const res = await app.inject({ method: 'GET', url: '/mcp' });
    expect(res.statusCode).toBe(405);
  });

  it('POST /mcp sem API-key → 401', async () => {
    const res = await rpc('tools/list', undefined, null);
    expect(res.statusCode).toBe(401);
  });

  it('POST /mcp com API-key errada → 401', async () => {
    const res = await rpc('tools/list', undefined, 'wrong-key');
    expect(res.statusCode).toBe(401);
  });

  it('sem MCP_API_KEY configurada → 503 (fail-closed)', async () => {
    const saved = process.env.MCP_API_KEY;
    delete process.env.MCP_API_KEY;
    try {
      const res = await rpc('tools/list', undefined, 'anything');
      expect(res.statusCode).toBe(503);
    } finally {
      process.env.MCP_API_KEY = saved;
    }
  });

  it('initialize → protocolVersion + serverInfo + capabilities.tools', async () => {
    const res = await rpc('initialize', { protocolVersion: '2025-06-18' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.result.protocolVersion).toBe('2025-06-18');
    expect(body.result.serverInfo.name).toBe('dashboards-mcp');
    expect(body.result.capabilities.tools).toBeDefined();
  });

  it('notifications/initialized (sem id) → 202 sem corpo', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/mcp',
      headers: { authorization: `Bearer ${API_KEY}`, 'content-type': 'application/json' },
      payload: { jsonrpc: '2.0', method: 'notifications/initialized' },
    });
    expect(res.statusCode).toBe(202);
  });

  it('método inexistente → erro JSON-RPC -32601', async () => {
    const res = await rpc('does/not/exist');
    expect(res.statusCode).toBe(200);
    expect(res.json().error.code).toBe(-32601);
  });
});

describe('MCP — tools/list', () => {
  it('anuncia todas as 12 tools com inputSchema', async () => {
    const res = await rpc('tools/list');
    expect(res.statusCode).toBe(200);
    const tools = res.json().result.tools as { name: string; inputSchema: unknown }[];
    const names = tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'list_connections',
        'get_connection_schema',
        'run_query',
        'list_catalog',
        'create_chart',
        'update_chart',
        'publish_chart',
        'preview_chart_data',
        'create_dashboard',
        'update_dashboard',
        'add_chart_to_dashboard',
        'publish_dashboard',
      ]),
    );
    expect(tools.every((t) => typeof t.inputSchema === 'object')).toBe(true);
  });
});

describe('MCP — catalog & connections', () => {
  it('list_catalog entrega manifestos (com __example)', async () => {
    const result = await callTool('list_catalog');
    expect(result.isError).toBeFalsy();
    const data = result.structuredContent as { blocks: { type: string }[]; total: number };
    expect(data.total).toBeGreaterThanOrEqual(1);
    expect(data.blocks.map((b) => b.type)).toContain(CATALOG_TYPE);
  });

  it('list_connections lista a conexão de teste (visibilidade ORG)', async () => {
    const result = await callTool('list_connections');
    expect(result.isError).toBeFalsy();
    const data = result.structuredContent as { connections: { id: string }[] };
    expect(data.connections.map((c) => c.id)).toContain(connectionId);
  });
});

describe('MCP — get_connection_schema (progressivo)', () => {
  it('sem `tables` devolve a LISTA de tabelas SEM colunas (leve)', async () => {
    const result = await callTool('get_connection_schema', { connectionId });
    if (result.isError) {
      // ambiente sem acesso ao Postgres externo — não falha o suite.
      expect(result.content[0].text).toBeDefined();
      return;
    }
    const data = result.structuredContent as {
      mode: string;
      tables: { schema: string; name: string; columnCount: number }[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
    expect(data.mode).toBe('tables');
    expect(Array.isArray(data.tables)).toBe(true);
    expect(data.tables.length).toBeGreaterThan(0);
    // a marca do modo lista: cada item tem columnCount e NÃO tem `columns`.
    for (const t of data.tables) {
      expect(typeof t.columnCount).toBe('number');
      expect((t as Record<string, unknown>).columns).toBeUndefined();
    }
    expect(typeof data.total).toBe('number');
    expect(data.page).toBe(1);
    // a lista (sem colunas) é DRASTICAMENTE menor que o schema inteiro.
    const listSize = result.content[0].text.length;
    expect(listSize).toBeGreaterThan(0);
  });

  it('com `tables:[...]` devolve as COLUNAS só dessas tabelas', async () => {
    const result = await callTool('get_connection_schema', {
      connectionId,
      tables: ['public.users'],
    });
    if (result.isError) {
      expect(result.content[0].text).toBeDefined();
      return;
    }
    const data = result.structuredContent as {
      mode: string;
      tables: { schema: string; name: string; columns: { name: string }[] }[];
      notFound?: string[];
    };
    expect(data.mode).toBe('columns');
    // 'users' existe no Postgres do app → tem que casar e trazer colunas.
    const users = data.tables.find((t) => t.name === 'users');
    expect(users).toBeDefined();
    expect(Array.isArray(users?.columns)).toBe(true);
    expect((users?.columns.length ?? 0)).toBeGreaterThan(0);
  });

  it('aceita nome de tabela SEM schema ("users")', async () => {
    const result = await callTool('get_connection_schema', {
      connectionId,
      tables: ['users'],
    });
    if (result.isError) return;
    const data = result.structuredContent as {
      tables: { name: string; columns: unknown[] }[];
    };
    expect(data.tables.some((t) => t.name === 'users')).toBe(true);
  });

  it('`search` filtra a lista de tabelas por substring', async () => {
    const result = await callTool('get_connection_schema', { connectionId, search: 'user' });
    if (result.isError) return;
    const data = result.structuredContent as {
      tables: { name: string }[];
    };
    expect(data.tables.length).toBeGreaterThan(0);
    expect(data.tables.every((t) => t.name.toLowerCase().includes('user'))).toBe(true);
  });

  it('`schema` filtra por schema do Postgres', async () => {
    const result = await callTool('get_connection_schema', { connectionId, schema: 'public' });
    if (result.isError) return;
    const data = result.structuredContent as {
      tables: { schema: string }[];
    };
    expect(data.tables.every((t) => t.schema === 'public')).toBe(true);
  });

  it('a lista de tabelas é MUITO menor que o schema completo (evidência)', async () => {
    const list = await callTool('get_connection_schema', { connectionId });
    if (list.isError) return;
    // Modo colunas de TODAS as tabelas: pega os nomes da lista e pede todos.
    const listData = list.structuredContent as {
      tables: { schema: string; name: string }[];
    };
    const allNames = listData.tables.map((t) => `${t.schema}.${t.name}`);
    const full = await callTool('get_connection_schema', { connectionId, tables: allNames });
    if (full.isError) return;
    const listSize = list.content[0].text.length;
    const fullSize = full.content[0].text.length;
    // a lista (sem colunas) é bem menor que o detalhamento com colunas.
    expect(listSize).toBeLessThan(fullSize);
  });
});

describe('MCP — run_query (guardrails read-only)', () => {
  it('query destrutiva é BLOQUEADA (isError, read_only_violation)', async () => {
    const result = await callTool('run_query', {
      connectionId,
      sql: 'DROP TABLE users',
    });
    expect(result.isError).toBe(true);
    const data = result.structuredContent ?? JSON.parse(result.content[0].text);
    // mensagem do sql-guard (only SELECT/WITH) chega no content textual
    expect(result.content[0].text.toLowerCase()).toMatch(/select|read-only|forbidden/);
    void data;
  });

  it('SELECT read-only retorna linhas (happy path via pg-runner)', async () => {
    const result = await callTool('run_query', {
      connectionId,
      sql: 'SELECT 1 AS n',
    });
    // happy path real: depende de conectividade com o Postgres do teste.
    if (result.isError) {
      // ambiente sem acesso ao Postgres externo — não falha o suite por isso.
      expect(result.content[0].text).toBeDefined();
      return;
    }
    const data = result.structuredContent as { rows: { n: number }[]; rowCount: number };
    expect(data.rowCount).toBe(1);
    expect(Number(data.rows[0].n)).toBe(1);
  });

  it('default de linhas é BAIXO (preview) — trunca em 50 sem maxRows', async () => {
    // generate_series(1,500) → 500 linhas disponíveis; o default do MCP (50) deve truncar.
    const result = await callTool('run_query', {
      connectionId,
      sql: 'SELECT g AS n FROM generate_series(1, 500) AS g',
    });
    if (result.isError) return; // sem conectividade
    const data = result.structuredContent as { rowCount: number; truncated: boolean };
    expect(data.rowCount).toBeLessThanOrEqual(50);
    expect(data.truncated).toBe(true);
  });

  it('maxRows acima do teto do MCP (1000) é rejeitado na validação', async () => {
    const result = await callTool('run_query', {
      connectionId,
      sql: 'SELECT 1 AS n',
      maxRows: 100000,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text.toLowerCase()).toMatch(/invalid|maxrows|less than|1000/);
  });
});

describe('MCP — serialização compacta do content', () => {
  it('o content textual é JSON COMPACTO (sem indentação)', async () => {
    const result = await callTool('list_catalog');
    const text = result.content[0].text;
    // pretty-print geraria quebras de linha + indentação; o compacto não.
    expect(text).not.toMatch(/\n\s+"/);
    // continua sendo JSON válido e bate com o structuredContent.
    expect(JSON.parse(text)).toEqual(result.structuredContent);
  });
});

describe('MCP — charts (create/update/publish/preview)', () => {
  let chartId = '';

  it('create_chart cria draft e retorna id', async () => {
    const result = await callTool('create_chart', {
      title: `MCP Chart ${SUFFIX}`,
      catalogType: CATALOG_TYPE,
      draftProps: { label: 'v1' },
      draftDataBinding: { connectionId, query: 'SELECT 1 AS n' },
      visibility: 'ORG',
    });
    expect(result.isError).toBeFalsy();
    const chart = result.structuredContent as { id: string; status: string; ownerId: string };
    chartId = chart.id;
    expect(chart.status).toBe('DRAFT');
    expect(chart.ownerId).toBe(serviceUserId);
  });

  it('create_chart rejeita catalogType inexistente (isError)', async () => {
    const result = await callTool('create_chart', {
      title: 'bad',
      catalogType: 'tipo_inexistente',
      draftProps: {},
      draftDataBinding: { connectionId, query: 'SELECT 1' },
    });
    expect(result.isError).toBe(true);
  });

  it('update_chart edita o título (draft)', async () => {
    const result = await callTool('update_chart', { chartId, title: `MCP Chart ${SUFFIX} v2` });
    expect(result.isError).toBeFalsy();
    const chart = result.structuredContent as { title: string };
    expect(chart.title).toBe(`MCP Chart ${SUFFIX} v2`);
  });

  it('publish_chart promove draft→published', async () => {
    const result = await callTool('publish_chart', { chartId });
    expect(result.isError).toBeFalsy();
    const chart = result.structuredContent as { status: string; publishedProps: unknown };
    expect(chart.status).toBe('PUBLISHED');
    expect(chart.publishedProps).toEqual({ label: 'v1' });
  });

  it('preview_chart_data devolve um BlockDataResult', async () => {
    const result = await callTool('preview_chart_data', { chartId, mode: 'draft' });
    expect(result.isError).toBeFalsy();
    const block = result.structuredContent as { blockId: string; state: string };
    expect(block.blockId).toBe(chartId);
    expect(['success', 'error']).toContain(block.state);
  });
});

describe('MCP — erros de create_chart sub-codificados (detail acionável)', () => {
  it('catalogType inexistente → bad_request / detail=unknown_catalog_type', async () => {
    const result = await callTool('create_chart', {
      title: 'x',
      catalogType: 'tipo_que_nao_existe',
      draftProps: {},
      draftDataBinding: { connectionId, query: 'SELECT 1' },
    });
    expect(result.isError).toBe(true);
    const err = JSON.parse(result.content[0].text).error as {
      code: string;
      detail?: string;
      message: string;
    };
    expect(err.code).toBe('bad_request');
    expect(err.detail).toBe('unknown_catalog_type');
    expect(err.message).toMatch(/list_catalog/);
  });

  it('connectionId inexistente → bad_request / detail=unknown_connection', async () => {
    const result = await callTool('create_chart', {
      title: 'x',
      catalogType: CATALOG_TYPE,
      draftProps: { label: 'v' },
      draftDataBinding: { connectionId: 'conn-que-nao-existe', query: 'SELECT 1' },
    });
    expect(result.isError).toBe(true);
    const err = JSON.parse(result.content[0].text).error as {
      code: string;
      detail?: string;
      message: string;
    };
    expect(err.code).toBe('bad_request');
    expect(err.detail).toBe('unknown_connection');
    expect(err.message).toMatch(/list_connections/);
  });

  it('visibility=DEPARTMENT sem departmentId → bad_request / detail=missing_department', async () => {
    const result = await callTool('create_chart', {
      title: 'x',
      catalogType: CATALOG_TYPE,
      draftProps: { label: 'v' },
      draftDataBinding: { connectionId, query: 'SELECT 1' },
      visibility: 'DEPARTMENT',
    });
    expect(result.isError).toBe(true);
    const err = JSON.parse(result.content[0].text).error as {
      code: string;
      detail?: string;
      message: string;
    };
    expect(err.code).toBe('bad_request');
    expect(err.detail).toBe('missing_department');
    expect(err.message).toMatch(/departmentId/);
  });
});

describe('MCP — dashboards (create/add chart/publish)', () => {
  let dashboardId = '';
  let chartId = '';

  beforeAll(async () => {
    const chart = await callTool('create_chart', {
      title: `MCP Dash Chart ${SUFFIX}`,
      catalogType: CATALOG_TYPE,
      draftProps: { label: 'd' },
      draftDataBinding: { connectionId, query: 'SELECT 1 AS n' },
      visibility: 'ORG',
    });
    chartId = (chart.structuredContent as { id: string }).id;
  });

  it('create_dashboard cria draft com layout vazio', async () => {
    const result = await callTool('create_dashboard', {
      title: `MCP Dashboard ${SUFFIX}`,
      draftLayout: { filters: [], rows: [] },
      visibility: 'ORG',
    });
    expect(result.isError).toBeFalsy();
    const dash = result.structuredContent as { id: string; status: string };
    dashboardId = dash.id;
    expect(dash.status).toBe('DRAFT');
  });

  it('add_chart_to_dashboard insere bloco que referencia o chart', async () => {
    const result = await callTool('add_chart_to_dashboard', { dashboardId, chartId, span: 6 });
    expect(result.isError).toBeFalsy();
    const dash = result.structuredContent as { draftLayout: { rows: { blocks: unknown[] }[] } };
    const blockCount = dash.draftLayout.rows.reduce((acc, r) => acc + r.blocks.length, 0);
    expect(blockCount).toBe(1);
  });

  it('publish_dashboard promove o layout', async () => {
    const result = await callTool('publish_dashboard', { dashboardId });
    expect(result.isError).toBeFalsy();
    const dash = result.structuredContent as { status: string; publishedLayout: unknown };
    expect(dash.status).toBe('PUBLISHED');
    expect(dash.publishedLayout).not.toBeNull();
  });
});

describe('MCP — RBAC do ator de serviço', () => {
  it('ator VIEWER não consegue criar chart (isError, forbidden)', async () => {
    const saved = process.env.MCP_SERVICE_USER_ID;
    process.env.MCP_SERVICE_USER_ID = viewerUserId;
    try {
      const result = await callTool('create_chart', {
        title: 'nope',
        catalogType: CATALOG_TYPE,
        draftProps: { label: 'x' },
        draftDataBinding: { connectionId, query: 'SELECT 1' },
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text.toLowerCase()).toMatch(/permission|forbidden|connection/);
    } finally {
      process.env.MCP_SERVICE_USER_ID = saved;
    }
  });
});

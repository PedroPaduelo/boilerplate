/**
 * Testes das tools MCP de LISTAGEM + LINK (T16):
 *   - list_dashboards          → lista dashboards visíveis (RBAC), metadados leves.
 *   - list_charts              → lista charts visíveis (RBAC), metadados leves.
 *   - create_dashboard_share_link → gera URL pública `${WEB_APP_URL}/public/<token>`.
 *
 * Reusa o transporte MCP real (POST /mcp + API-key) e o Postgres do
 * `DATABASE_URL`, no mesmo padrão de `tests/mcp.test.ts`.
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

const SUFFIX = `ls${Date.now()}`;
const CATALOG_TYPE = '__example';
const API_KEY = `test-mcp-ls-key-${SUFFIX}`;

let app: FastifyInstance;
const userIds: string[] = [];
let serviceUserId = '';
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

async function createTestConnection(ownerId: string): Promise<string> {
  const url = new URL(env.DATABASE_URL);
  const sslMode = url.searchParams.get('sslmode') ?? 'disable';
  const conn = await prisma.connection.create({
    data: {
      name: `mcp-ls-conn-${SUFFIX}`,
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
      email: `mcp-ls-svc-${SUFFIX}@test.local`,
      name: 'MCP LS Service',
      password: 'x',
      role: 'ANALYST',
    },
  });
  serviceUserId = serviceUser.id;
  userIds.push(serviceUser.id);

  connectionId = await createTestConnection(serviceUser.id);

  process.env.MCP_SERVICE_USER_ID = serviceUserId;
  delete process.env.MCP_SERVICE_USER_EMAIL;
}, 30000);

afterAll(async () => {
  try {
    await prisma.shareLink.deleteMany({ where: { createdById: { in: userIds } } });
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

describe('MCP — tools/list inclui as tools novas (T16)', () => {
  it('anuncia list_dashboards, list_charts e create_dashboard_share_link', async () => {
    const res = await rpc('tools/list');
    expect(res.statusCode).toBe(200);
    const names = (res.json().result.tools as { name: string }[]).map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'list_dashboards',
        'list_charts',
        'create_dashboard_share_link',
      ]),
    );
  });
});

describe('MCP — list_dashboards / list_charts / create_dashboard_share_link', () => {
  let chartId = '';
  let publishedDashboardId = '';
  let draftDashboardId = '';

  beforeAll(async () => {
    // 1) chart
    const chart = await callTool('create_chart', {
      title: `LS Chart ${SUFFIX}`,
      catalogType: CATALOG_TYPE,
      draftProps: { label: 'v' },
      draftDataBinding: { connectionId, query: 'SELECT 1 AS n' },
      visibility: 'ORG',
    });
    chartId = (chart.structuredContent as { id: string }).id;

    // 2) dashboard PUBLISHED
    const pub = await callTool('create_dashboard', {
      title: `LS Dashboard PUB ${SUFFIX}`,
      draftLayout: { filters: [], rows: [] },
      visibility: 'ORG',
    });
    publishedDashboardId = (pub.structuredContent as { id: string }).id;
    await callTool('publish_dashboard', { dashboardId: publishedDashboardId });

    // 3) dashboard DRAFT (não publicado)
    const draft = await callTool('create_dashboard', {
      title: `LS Dashboard DRAFT ${SUFFIX}`,
      draftLayout: { filters: [], rows: [] },
      visibility: 'ORG',
    });
    draftDashboardId = (draft.structuredContent as { id: string }).id;
  }, 30000);

  it('list_dashboards retorna a lista com metadados leves (sem layout)', async () => {
    const result = await callTool('list_dashboards', { search: `LS Dashboard` });
    expect(result.isError).toBeFalsy();
    const data = result.structuredContent as {
      dashboards: { id: string; title: string; status: string; draftLayout?: unknown }[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
    const ids = data.dashboards.map((d) => d.id);
    expect(ids).toEqual(expect.arrayContaining([publishedDashboardId, draftDashboardId]));
    // metadados leves: NÃO traz o layout
    for (const d of data.dashboards) {
      expect((d as Record<string, unknown>).draftLayout).toBeUndefined();
      expect(typeof d.status).toBe('string');
    }
    expect(typeof data.total).toBe('number');
    expect(data.page).toBe(1);
  });

  it('list_dashboards filtra por status=PUBLISHED', async () => {
    const result = await callTool('list_dashboards', {
      search: `LS Dashboard`,
      status: 'PUBLISHED',
    });
    const data = result.structuredContent as { dashboards: { id: string; status: string }[] };
    expect(data.dashboards.every((d) => d.status === 'PUBLISHED')).toBe(true);
    expect(data.dashboards.map((d) => d.id)).toContain(publishedDashboardId);
    expect(data.dashboards.map((d) => d.id)).not.toContain(draftDashboardId);
  });

  it('list_charts retorna a lista com metadados leves (sem props/dataBinding)', async () => {
    const result = await callTool('list_charts', { search: `LS Chart` });
    expect(result.isError).toBeFalsy();
    const data = result.structuredContent as {
      charts: { id: string; title: string; catalogType: string; draftProps?: unknown }[];
      total: number;
    };
    expect(data.charts.map((c) => c.id)).toContain(chartId);
    for (const c of data.charts) {
      expect((c as Record<string, unknown>).draftProps).toBeUndefined();
      expect((c as Record<string, unknown>).draftDataBinding).toBeUndefined();
      expect(typeof c.catalogType).toBe('string');
    }
  });

  it('create_dashboard_share_link (PUBLISHED) retorna url ${WEB_APP_URL}/public/<token>', async () => {
    const result = await callTool('create_dashboard_share_link', {
      dashboardId: publishedDashboardId,
    });
    expect(result.isError).toBeFalsy();
    const data = result.structuredContent as {
      token: string;
      url: string;
      dashboardId: string;
      durationSeconds: number;
      status: string;
      warning?: string;
    };
    expect(data.dashboardId).toBe(publishedDashboardId);
    expect(data.status).toBe('PUBLISHED');
    expect(data.durationSeconds).toBe(604800);
    expect(typeof data.token).toBe('string');
    expect(data.token.length).toBeGreaterThan(0);
    expect(data.url).toBe(`${env.WEB_APP_URL}/public/${data.token}`);
    expect(data.warning).toBeUndefined();
  });

  it('create_dashboard_share_link (DRAFT) inclui warning de publicar antes', async () => {
    const result = await callTool('create_dashboard_share_link', {
      dashboardId: draftDashboardId,
    });
    expect(result.isError).toBeFalsy();
    const data = result.structuredContent as {
      url: string;
      status: string;
      warning?: string;
    };
    expect(data.status).toBe('DRAFT');
    expect(data.url).toMatch(/\/public\//);
    expect(data.warning).toMatch(/DRAFT|publique/i);
  });

  it('create_dashboard_share_link respeita durationSeconds custom', async () => {
    const result = await callTool('create_dashboard_share_link', {
      dashboardId: publishedDashboardId,
      durationSeconds: 3600,
    });
    const data = result.structuredContent as { durationSeconds: number };
    expect(data.durationSeconds).toBe(3600);
  });

  it('create_dashboard_share_link de dashboard inexistente → isError (not_found)', async () => {
    const result = await callTool('create_dashboard_share_link', {
      dashboardId: 'dash-que-nao-existe',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text.toLowerCase()).toMatch(/not found|not_found/);
  });
});

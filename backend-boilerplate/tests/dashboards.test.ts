/**
 * Testes de rota do módulo `dashboards` (T-B3): CRUD + publish/unpublish no
 * modelo draft/published SEM histórico, validação de LAYOUT contra o CONTRATO
 * COMPARTILHADO (`@dashboards/contracts` → `validateDashboardLayout`, doc 20),
 * operação `add_chart_to_dashboard`, GET por modo e o gate RBAC COMPARTILHADO
 * (T-B1) aplicado de verdade.
 *
 * Cobre os critérios de teste da task:
 *  - CRUD + publish/unpublish (estados DRAFT→PUBLISHED→DRAFT, publishedAt);
 *  - publish/unpublish INVALIDAM o cache de layout em `dash:{id}:published`
 *    (verificado via fake Redis em memória);
 *  - layout inválido (span fora do range / bloco sem campo obrigatório / filtro
 *    malformado) é REJEITADO com 400;
 *  - add_chart_to_dashboard insere um bloco referenciando chartId; chartId
 *    inexistente → 404;
 *  - GET /dashboards/:id?mode=draft|published retorna o layout do modo certo;
 *  - RBAC: VIEWER não cria/publica; ownership respeitado; visibilidade filtra.
 *
 * Usa o Postgres REAL do `DATABASE_URL` (como charts/departments/connections).
 */
import fastifyJwt from '@fastify/jwt';
import Fastify, { type FastifyInstance } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { ZodError } from 'zod';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/http/routes/_errors';
import { registerModules } from '@/http/modules-loader';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { closeAllPools } from '@/lib/pg-runner';
import { redisInstance, redisService } from '@/lib/redis';
import { publishedLayoutCacheKey } from '@/modules/dashboards/service';

// --- fake Redis em memória (apenas os métodos usados pelo RedisService) ------
class FakeRedis {
  store = new Map<string, string>();
  async get(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  async set(key: string, value: string) {
    this.store.set(key, value);
    return 'OK';
  }
  async del(key: string) {
    return this.store.delete(key) ? 1 : 0;
  }
  async exists(key: string) {
    return this.store.has(key) ? 1 : 0;
  }
  async expire() {
    return 1;
  }
  async keys() {
    return [...this.store.keys()];
  }
}

const SUFFIX = `d${Date.now()}`;
const CATALOG_TYPE = '__example';

let app: FastifyInstance;
const userIds: string[] = [];
const deptIds: string[] = [];
let connectionId = '';
let chartId = '';
let deptId = '';

let adminToken = '';
let creatorToken = '';
let creator2Token = '';
let viewerToken = '';
let creatorId = '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function testErrorHandler(error: any, _req: unknown, reply: any) {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({ message: 'Validation error' });
  }
  if (error instanceof ZodError) return reply.status(422).send({ message: 'unprocessable_entity' });
  if (error instanceof BadRequestError) return reply.status(400).send({ message: error.message });
  if (error instanceof UnauthorizedError) return reply.status(401).send({ message: error.message });
  if (error instanceof ForbiddenError) return reply.status(403).send({ message: error.message });
  if (error instanceof NotFoundError) return reply.status(404).send({ message: error.message });
  return reply.status(500).send({ message: 'Internal server error' });
}

async function buildApp(): Promise<FastifyInstance> {
  const instance = Fastify().withTypeProvider<ZodTypeProvider>();
  instance.setValidatorCompiler(validatorCompiler);
  instance.setSerializerCompiler(serializerCompiler);
  instance.setErrorHandler(testErrorHandler);
  await instance.register(fastifyJwt, { secret: env.JWT_SECRET });
  await instance.register(registerModules);
  await instance.ready();
  return instance;
}

const authHeader = (token: string) => ({ authorization: `Bearer ${token}` });

/** Layout mínimo VÁLIDO contra o contrato (doc 20): 1 row, 1 bloco narrativo. */
const validLayout = () => ({
  filters: [
    { id: 'f_periodo', type: 'date_range', label: 'Período', default: { from: '2026-01-01' } },
  ],
  rows: [
    {
      id: 'row_1',
      title: 'Visão geral',
      blocks: [{ id: 'blk_title', type: 'title', span: 12, props: { text: 'Olá' } }],
    },
  ],
});

const baseDashboard = (overrides: Record<string, unknown> = {}) => ({
  title: `Dashboard ${SUFFIX}`,
  draftLayout: validLayout(),
  ...overrides,
});

beforeAll(async () => {
  // injeta fake Redis para exercitar o caminho de invalidação de cache.
  redisInstance.setClient(new FakeRedis() as never);

  app = await buildApp();

  const admin = await prisma.user.create({
    data: { email: `db-admin-${SUFFIX}@test.local`, name: 'Admin', password: 'x', role: 'ADMIN' },
  });
  const creator = await prisma.user.create({
    data: { email: `db-creator-${SUFFIX}@test.local`, name: 'Creator', password: 'x', role: 'CREATOR' },
  });
  const creator2 = await prisma.user.create({
    data: { email: `db-creator2-${SUFFIX}@test.local`, name: 'Creator2', password: 'x', role: 'CREATOR' },
  });
  const viewer = await prisma.user.create({
    data: { email: `db-viewer-${SUFFIX}@test.local`, name: 'Viewer', password: 'x', role: 'VIEWER' },
  });
  userIds.push(admin.id, creator.id, creator2.id, viewer.id);
  creatorId = creator.id;

  adminToken = app.jwt.sign({ sub: admin.id, role: 'ADMIN' });
  creatorToken = app.jwt.sign({ sub: creator.id, role: 'CREATOR' });
  creator2Token = app.jwt.sign({ sub: creator2.id, role: 'CREATOR' });
  viewerToken = app.jwt.sign({ sub: viewer.id, role: 'VIEWER' });

  const dep = await prisma.department.create({
    data: { name: `Dep ${SUFFIX}`, slug: `dep-${SUFFIX}` },
  });
  deptId = dep.id;
  deptIds.push(dep.id);
  await prisma.departmentMembership.create({ data: { departmentId: dep.id, userId: creator.id } });

  // conexão + chart reais (ORG) para a operação add_chart_to_dashboard.
  const conn = await prisma.connection.create({
    data: {
      name: `conn-${SUFFIX}`,
      host: 'localhost',
      database: 'db',
      username: 'u',
      passwordCipher: 'x',
      ownerId: creator.id,
      visibility: 'ORG',
    },
  });
  connectionId = conn.id;

  const chart = await prisma.chart.create({
    data: {
      title: `Chart ${SUFFIX}`,
      catalogType: CATALOG_TYPE,
      draftProps: { label: 'v1' },
      draftDataBinding: { connectionId, query: 'SELECT 1' },
      ownerId: creator.id,
      visibility: 'ORG',
    },
  });
  chartId = chart.id;
}, 30000);

afterAll(async () => {
  try {
    await prisma.dashboard.deleteMany({ where: { ownerId: { in: userIds } } });
    await prisma.chart.deleteMany({ where: { ownerId: { in: userIds } } });
    await prisma.connection.deleteMany({ where: { ownerId: { in: userIds } } });
    if (deptIds.length) {
      await prisma.departmentMembership.deleteMany({ where: { departmentId: { in: deptIds } } });
      await prisma.department.deleteMany({ where: { id: { in: deptIds } } });
    }
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  } catch {
    // best-effort
  }
  await closeAllPools();
  await app.close();
  await prisma.$disconnect();
});

describe('dashboards — RBAC do gate', () => {
  it('sem token → 401', async () => {
    const res = await app.inject({ method: 'POST', url: '/dashboards', payload: baseDashboard() });
    expect(res.statusCode).toBe(401);
  });

  it('VIEWER não pode criar dashboard (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(viewerToken),
      payload: baseDashboard(),
    });
    expect(res.statusCode).toBe(403);
  });

  it('VIEWER PODE listar dashboards (artifacts:view)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/dashboards',
      headers: authHeader(viewerToken),
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('dashboards — CRUD + validação de layout', () => {
  let dashId = '';

  it('POST /dashboards cria draft (201); status DRAFT, publishedLayout nulo', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(creatorToken),
      payload: baseDashboard(),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    dashId = body.id;
    expect(body.status).toBe('DRAFT');
    expect(body.ownerId).toBe(creatorId);
    expect(body.publishedLayout).toBeNull();
    expect(body.publishedAt).toBeNull();
    expect(body.draftLayout.rows).toHaveLength(1);
  });

  it('POST /dashboards rejeita layout com span fora do range (400)', async () => {
    const bad = validLayout();
    bad.rows[0].blocks[0].span = 99;
    const res = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(creatorToken),
      payload: baseDashboard({ draftLayout: bad }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /dashboards rejeita bloco sem campo obrigatório (sem span) (400)', async () => {
    const bad = {
      filters: [],
      rows: [{ id: 'row_1', blocks: [{ id: 'blk_x', type: 'title' }] }],
    };
    const res = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(creatorToken),
      payload: baseDashboard({ draftLayout: bad }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /dashboards rejeita filtro malformado (type inválido) (400)', async () => {
    const bad = {
      filters: [{ id: 'f1', type: 'tipo_invalido', label: 'X' }],
      rows: [],
    };
    const res = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(creatorToken),
      payload: baseDashboard({ draftLayout: bad }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('GET /dashboards/:id detalha (200) e default mode=draft', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/dashboards/${dashId}`,
      headers: authHeader(creatorToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(dashId);
    expect(body.mode).toBe('draft');
    expect(body.layout.rows).toHaveLength(1);
  });

  it('GET /dashboards/:id inexistente → 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/dashboards/nope',
      headers: authHeader(creatorToken),
    });
    expect(res.statusCode).toBe(404);
  });

  it('PATCH /dashboards/:id edita o título (200)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/dashboards/${dashId}`,
      headers: authHeader(creatorToken),
      payload: { title: `Dashboard ${SUFFIX} v2` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().title).toBe(`Dashboard ${SUFFIX} v2`);
  });

  it('PATCH /dashboards/:id com layout inválido → 400', async () => {
    const bad = validLayout();
    bad.rows[0].blocks[0].span = 0;
    const res = await app.inject({
      method: 'PATCH',
      url: `/dashboards/${dashId}`,
      headers: authHeader(creatorToken),
      payload: { draftLayout: bad },
    });
    expect(res.statusCode).toBe(400);
  });

  it('DELETE /dashboards/:id remove (200)', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/dashboards/${dashId}`,
      headers: authHeader(creatorToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id: dashId, deleted: true });
    const after = await app.inject({
      method: 'GET',
      url: `/dashboards/${dashId}`,
      headers: authHeader(creatorToken),
    });
    expect(after.statusCode).toBe(404);
  });
});

describe('dashboards — publish/unpublish + invalidação de cache + GET por modo', () => {
  let dashId = '';

  beforeAll(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(creatorToken),
      payload: baseDashboard(),
    });
    dashId = res.json().id;
  });

  it('GET ?mode=published antes de publicar → 400', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/dashboards/${dashId}?mode=published`,
      headers: authHeader(creatorToken),
    });
    expect(res.statusCode).toBe(400);
  });

  it('VIEWER não pode publicar (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/dashboards/${dashId}/publish`,
      headers: authHeader(viewerToken),
    });
    expect(res.statusCode).toBe(403);
  });

  it('publish copia draft→published, seta publishedAt/status e INVALIDA dash:{id}:published', async () => {
    // pré-popula o cache de layout publicado para provar a invalidação.
    const key = publishedLayoutCacheKey(dashId);
    await redisService.setValue(key, JSON.stringify({ stale: true }));
    expect(await redisService.hasKey(key)).toBe(true);

    const res = await app.inject({
      method: 'POST',
      url: `/dashboards/${dashId}/publish`,
      headers: authHeader(creatorToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('PUBLISHED');
    expect(body.publishedAt).not.toBeNull();
    expect(body.publishedLayout.rows).toHaveLength(1);

    // cache de layout publicado foi invalidado.
    expect(await redisService.hasKey(key)).toBe(false);
  });

  it('T-G1 bugfix: publish materializa snapshot em publishedDataPayload (T-C executeBlockData inline)', async () => {
    // Dashboard do beforeAll deste describe tem blocos narrativos (title/rich_text)
    // — sem dataBinding — então o snapshot é gerado com `blocks: {}` (sem
    // erro, sem execução). O importante: o CAMPO existe no banco e tem o
    // shape DashboardDataPayload (dashboardId, mode, generatedAt, blocks).
    const row = await prisma.dashboard.findUnique({ where: { id: dashId } });
    expect(row).not.toBeNull();
    const payload = row!.publishedDataPayload as
      | { dashboardId?: string; mode?: string; generatedAt?: string; blocks?: Record<string, unknown> }
      | null;
    expect(payload).not.toBeNull();
    expect(payload!.dashboardId).toBe(dashId);
    expect(payload!.mode).toBe('published');
    expect(typeof payload!.generatedAt).toBe('string');
    expect(typeof payload!.blocks).toBe('object');
    expect(payload!.blocks).toEqual({}); // narrativos não produzem resultado de dados
  });

  it('GET ?mode=published agora retorna o layout publicado (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/dashboards/${dashId}?mode=published`,
      headers: authHeader(creatorToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.mode).toBe('published');
    expect(body.layout.rows).toHaveLength(1);
  });

  it('CRÍTICO: editar o draft de um dashboard PUBLICADO NÃO altera o publishedLayout', async () => {
    const twoRows = {
      filters: [],
      rows: [
        { id: 'row_1', blocks: [{ id: 'b1', type: 'title', span: 12, props: { text: 'a' } }] },
        { id: 'row_2', blocks: [{ id: 'b2', type: 'rich_text', span: 12, props: { markdown: '# b' } }] },
      ],
    };
    const patch = await app.inject({
      method: 'PATCH',
      url: `/dashboards/${dashId}`,
      headers: authHeader(creatorToken),
      payload: { draftLayout: twoRows },
    });
    expect(patch.statusCode).toBe(200);
    const body = patch.json();
    expect(body.draftLayout.rows).toHaveLength(2);
    // o publicado continua com 1 row e o status permanece PUBLISHED
    expect(body.publishedLayout.rows).toHaveLength(1);
    expect(body.status).toBe('PUBLISHED');
  });

  it('unpublish zera publishedLayout, volta status=DRAFT e invalida o cache', async () => {
    const key = publishedLayoutCacheKey(dashId);
    await redisService.setValue(key, JSON.stringify({ stale: true }));

    const res = await app.inject({
      method: 'POST',
      url: `/dashboards/${dashId}/unpublish`,
      headers: authHeader(creatorToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('DRAFT');
    expect(body.publishedLayout).toBeNull();
    expect(body.publishedAt).toBeNull();
    // o draft (2 rows) é preservado
    expect(body.draftLayout.rows).toHaveLength(2);
    expect(await redisService.hasKey(key)).toBe(false);
  });
});

describe('dashboards — add_chart_to_dashboard', () => {
  let dashId = '';

  beforeAll(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(creatorToken),
      payload: baseDashboard(),
    });
    dashId = res.json().id;
  });

  it('insere um bloco referenciando chartId numa nova row', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/dashboards/${dashId}/blocks`,
      headers: authHeader(creatorToken),
      payload: { chartId, span: 6 },
    });
    expect(res.statusCode).toBe(200);
    const layout = res.json().draftLayout;
    // havia 1 row; agora 2 (a nova com o bloco do chart).
    expect(layout.rows).toHaveLength(2);
    const allBlocks = layout.rows.flatMap((r: { blocks: unknown[] }) => r.blocks);
    const chartBlock = allBlocks.find(
      (b: { props?: { chartId?: string } }) => b.props?.chartId === chartId,
    );
    expect(chartBlock).toBeDefined();
    expect(chartBlock.type).toBe(CATALOG_TYPE);
    expect(chartBlock.span).toBe(6);
  });

  it('insere numa row existente quando rowId é informado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/dashboards/${dashId}/blocks`,
      headers: authHeader(creatorToken),
      payload: { chartId, rowId: 'row_1', span: 4 },
    });
    expect(res.statusCode).toBe(200);
    const layout = res.json().draftLayout;
    const row1 = layout.rows.find((r: { id: string }) => r.id === 'row_1');
    expect(row1.blocks.some((b: { props?: { chartId?: string } }) => b.props?.chartId === chartId)).toBe(
      true,
    );
  });

  it('rowId inexistente → 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/dashboards/${dashId}/blocks`,
      headers: authHeader(creatorToken),
      payload: { chartId, rowId: 'row_ghost' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('chartId inexistente → 404', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/dashboards/${dashId}/blocks`,
      headers: authHeader(creatorToken),
      payload: { chartId: 'ghost-chart' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('create com layout que referencia chartId inexistente → 400', async () => {
    const layout = {
      filters: [],
      rows: [
        {
          id: 'row_1',
          blocks: [{ id: 'b1', type: CATALOG_TYPE, span: 6, props: { chartId: 'ghost-chart' } }],
        },
      ],
    };
    const res = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(creatorToken),
      payload: baseDashboard({ draftLayout: layout }),
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('dashboards — ownership', () => {
  let dashId = '';

  beforeAll(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(creatorToken),
      payload: baseDashboard({ visibility: 'ORG' }),
    });
    dashId = res.json().id;
  });

  it('outro CREATOR não pode editar dashboard alheio (403)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/dashboards/${dashId}`,
      headers: authHeader(creator2Token),
      payload: { title: 'hijack' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('outro CREATOR não pode publicar dashboard alheio (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/dashboards/${dashId}/publish`,
      headers: authHeader(creator2Token),
    });
    expect(res.statusCode).toBe(403);
  });

  it('ADMIN pode editar dashboard de outro (ownership override)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/dashboards/${dashId}`,
      headers: authHeader(adminToken),
      payload: { title: `admin-edit ${SUFFIX}` },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('dashboards — visibilidade (get + lista)', () => {
  let privateId = '';
  let orgId = '';

  beforeAll(async () => {
    const priv = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(creatorToken),
      payload: baseDashboard({ visibility: 'PRIVATE' }),
    });
    privateId = priv.json().id;

    const org = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(creatorToken),
      payload: baseDashboard({ visibility: 'ORG' }),
    });
    orgId = org.json().id;
  });

  it('PRIVATE de outro dono → 404 no GET', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/dashboards/${privateId}`,
      headers: authHeader(creator2Token),
    });
    expect(res.statusCode).toBe(404);
  });

  it('ORG de outro dono → 200 no GET', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/dashboards/${orgId}`,
      headers: authHeader(creator2Token),
    });
    expect(res.statusCode).toBe(200);
  });

  it('lista do creator2 inclui ORG mas exclui PRIVATE alheio', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/dashboards?pageSize=100',
      headers: authHeader(creator2Token),
    });
    expect(res.statusCode).toBe(200);
    const ids = res.json().dashboards.map((d: { id: string }) => d.id);
    expect(ids).toContain(orgId);
    expect(ids).not.toContain(privateId);
  });
});

describe('dashboards — visibilidade DEPARTMENT (membership na criação)', () => {
  it('membro do depto cria dashboard DEPARTMENT (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(creatorToken),
      payload: baseDashboard({ visibility: 'DEPARTMENT', departmentId: deptId }),
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().departmentId).toBe(deptId);
  });

  it('não-membro NÃO cria dashboard no depto (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(creator2Token),
      payload: baseDashboard({ visibility: 'DEPARTMENT', departmentId: deptId }),
    });
    expect(res.statusCode).toBe(403);
  });

  it('DEPARTMENT sem departmentId → 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/dashboards',
      headers: authHeader(creatorToken),
      payload: baseDashboard({ visibility: 'DEPARTMENT' }),
    });
    expect(res.statusCode).toBe(400);
  });
});

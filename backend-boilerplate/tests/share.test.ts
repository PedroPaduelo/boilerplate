/**
 * Testes de rota do módulo `share` (T-B4): link público com TTL contado a
 * partir da 1ª abertura (docs/plano/09 e 30).
 *
 * Cobre os critérios de teste da task:
 *  - CRÍTICO TTL: a 1ª request a /public/:token seta firstAccessedAt+expiresAt;
 *    requests seguintes mantêm a MESMA janela (não resetam); após expirar
 *    bloqueia com 410.
 *  - link revogado bloqueia (403);
 *  - token inexistente → 404;
 *  - GET /public/:token funciona SEM auth (sem header Authorization);
 *  - POST /share exige share:create (VIEWER → 403); targetId inexistente → 404;
 *  - a resposta pública NÃO contém campos sensíveis (sem passwordCipher, sem
 *    draft, sem owner/visibilidade).
 *
 * Usa o Postgres REAL do `DATABASE_URL` (como `charts.test.ts`).
 */
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
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

const SUFFIX = `s${Date.now()}`;

let app: FastifyInstance;
const userIds: string[] = [];

let adminToken = '';
let creatorToken = '';
let creator2Token = '';
let viewerToken = '';

let publishedDashboardId = '';
let publishedChartId = '';
let unpublishedDashboardId = '';

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

const LAYOUT = { filters: [], rows: [] };

beforeAll(async () => {
  app = await buildApp();

  const admin = await prisma.user.create({
    data: { email: `sh-admin-${SUFFIX}@test.local`, name: 'Admin', password: 'x', role: 'ADMIN' },
  });
  const creator = await prisma.user.create({
    data: {
      email: `sh-creator-${SUFFIX}@test.local`,
      name: 'Creator',
      password: 'x',
      role: 'CREATOR',
    },
  });
  const creator2 = await prisma.user.create({
    data: {
      email: `sh-creator2-${SUFFIX}@test.local`,
      name: 'Creator2',
      password: 'x',
      role: 'CREATOR',
    },
  });
  const viewer = await prisma.user.create({
    data: {
      email: `sh-viewer-${SUFFIX}@test.local`,
      name: 'Viewer',
      password: 'x',
      role: 'VIEWER',
    },
  });
  userIds.push(admin.id, creator.id, creator2.id, viewer.id);

  adminToken = app.jwt.sign({ sub: admin.id, role: 'ADMIN' });
  creatorToken = app.jwt.sign({ sub: creator.id, role: 'CREATOR' });
  creator2Token = app.jwt.sign({ sub: creator2.id, role: 'CREATOR' });
  viewerToken = app.jwt.sign({ sub: viewer.id, role: 'VIEWER' });

  // Dashboard PUBLICADO (alvo válido do share).
  const dashboard = await prisma.dashboard.create({
    data: {
      title: `Dash ${SUFFIX}`,
      ownerId: creator.id,
      visibility: 'ORG',
      status: 'PUBLISHED',
      draftLayout: LAYOUT,
      publishedLayout: LAYOUT,
      publishedAt: new Date(),
    },
  });
  publishedDashboardId = dashboard.id;

  // Dashboard NÃO publicado (publishedLayout null) — não há o que mostrar.
  const draftDashboard = await prisma.dashboard.create({
    data: {
      title: `Draft Dash ${SUFFIX}`,
      ownerId: creator.id,
      visibility: 'ORG',
      status: 'DRAFT',
      draftLayout: LAYOUT,
    },
  });
  unpublishedDashboardId = draftDashboard.id;

  // Chart PUBLICADO com dataBinding (connectionId/query — NÃO é credencial).
  const chart = await prisma.chart.create({
    data: {
      title: `Chart ${SUFFIX}`,
      catalogType: '__example',
      ownerId: creator.id,
      visibility: 'ORG',
      status: 'PUBLISHED',
      draftProps: { label: 'draft-secret' },
      draftDataBinding: { connectionId: 'conn-x', query: 'SELECT 1' },
      publishedProps: { label: 'published' },
      publishedDataBinding: { connectionId: 'conn-x', query: 'SELECT 1' },
      publishedAt: new Date(),
    },
  });
  publishedChartId = chart.id;
}, 30000);

afterAll(async () => {
  try {
    await prisma.shareLink.deleteMany({ where: { createdById: { in: userIds } } });
    await prisma.chart.deleteMany({ where: { ownerId: { in: userIds } } });
    await prisma.dashboard.deleteMany({ where: { ownerId: { in: userIds } } });
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  } catch {
    // best-effort
  }
  await app.close();
  await prisma.$disconnect();
});

/** Helper: cria um share-link via API e devolve o body. */
async function createShare(
  token: string,
  payload: Record<string, unknown>,
): Promise<{ statusCode: number; body: Record<string, unknown> }> {
  const res = await app.inject({
    method: 'POST',
    url: '/share',
    headers: authHeader(token),
    payload,
  });
  return { statusCode: res.statusCode, body: res.json() };
}

describe('share — POST /share (RBAC + validação do alvo)', () => {
  it('sem token → 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/share',
      payload: { targetType: 'DASHBOARD', targetId: publishedDashboardId, durationSeconds: 60 },
    });
    expect(res.statusCode).toBe(401);
  });

  it('VIEWER não pode criar share (sem share:create) → 403', async () => {
    const { statusCode } = await createShare(viewerToken, {
      targetType: 'DASHBOARD',
      targetId: publishedDashboardId,
      durationSeconds: 60,
    });
    expect(statusCode).toBe(403);
  });

  it('targetId inexistente → 404', async () => {
    const { statusCode } = await createShare(creatorToken, {
      targetType: 'DASHBOARD',
      targetId: 'ghost-dashboard',
      durationSeconds: 60,
    });
    expect(statusCode).toBe(404);
  });

  it('durationSeconds inválido (0) → 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/share',
      headers: authHeader(creatorToken),
      payload: { targetType: 'DASHBOARD', targetId: publishedDashboardId, durationSeconds: 0 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('CREATOR cria share de dashboard publicado → 201; expiresAt/firstAccessedAt null', async () => {
    const { statusCode, body } = await createShare(creatorToken, {
      targetType: 'DASHBOARD',
      targetId: publishedDashboardId,
      durationSeconds: 3600,
    });
    expect(statusCode).toBe(201);
    expect(typeof body.token).toBe('string');
    expect((body.token as string).length).toBeGreaterThan(20);
    expect(body.url).toBe(`/public/${body.token}`);
    expect(body.firstAccessedAt).toBeNull();
    expect(body.expiresAt).toBeNull();
  });
});

describe('share — GET /public/:token (sem auth + TTL na 1ª abertura)', () => {
  let token = '';

  beforeAll(async () => {
    const { body } = await createShare(creatorToken, {
      targetType: 'DASHBOARD',
      targetId: publishedDashboardId,
      durationSeconds: 3600,
    });
    token = body.token as string;
  });

  it('funciona SEM header Authorization → 200 e retorna o dashboard publicado', async () => {
    const res = await app.inject({ method: 'GET', url: `/public/${token}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.targetType).toBe('DASHBOARD');
    expect(body.dashboard.id).toBe(publishedDashboardId);
    expect(body.dashboard.publishedLayout).toEqual(LAYOUT);
  });

  it('1ª abertura setou firstAccessedAt e expiresAt = first + duration', async () => {
    const link = await prisma.shareLink.findUnique({ where: { token } });
    expect(link?.firstAccessedAt).not.toBeNull();
    expect(link?.expiresAt).not.toBeNull();
    const first = link!.firstAccessedAt!.getTime();
    const exp = link!.expiresAt!.getTime();
    expect(exp - first).toBe(3600 * 1000);
  });

  it('CRÍTICO: requests seguintes mantêm a MESMA janela (não resetam)', async () => {
    const before = await prisma.shareLink.findUnique({ where: { token } });
    // pequena espera para garantir que um eventual reset mudaria os timestamps
    await new Promise((r) => setTimeout(r, 25));
    const res = await app.inject({ method: 'GET', url: `/public/${token}` });
    expect(res.statusCode).toBe(200);
    const after = await prisma.shareLink.findUnique({ where: { token } });
    expect(after?.firstAccessedAt?.getTime()).toBe(before?.firstAccessedAt?.getTime());
    expect(after?.expiresAt?.getTime()).toBe(before?.expiresAt?.getTime());
  });

  it('a resposta pública NÃO contém campos sensíveis (owner/visibility/draft)', async () => {
    const res = await app.inject({ method: 'GET', url: `/public/${token}` });
    const text = res.payload;
    expect(text).not.toContain('ownerId');
    expect(text).not.toContain('visibility');
    expect(text).not.toContain('draftLayout');
    expect(text).not.toContain('departmentId');
    const body = res.json();
    expect(body.dashboard.ownerId).toBeUndefined();
    expect(body.dashboard.draftLayout).toBeUndefined();
  });

  it('token inexistente → 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/public/does-not-exist' });
    expect(res.statusCode).toBe(404);
  });
});

describe('share — chart publicado expõe published* sem draft/credenciais', () => {
  it('GET /public/:token de chart retorna publishedProps + publishedDataBinding, sem draft', async () => {
    const { body } = await createShare(creatorToken, {
      targetType: 'CHART',
      targetId: publishedChartId,
      durationSeconds: 3600,
    });
    const token = body.token as string;

    const res = await app.inject({ method: 'GET', url: `/public/${token}` });
    expect(res.statusCode).toBe(200);
    const out = res.json();
    expect(out.targetType).toBe('CHART');
    expect(out.chart.id).toBe(publishedChartId);
    expect(out.chart.catalogType).toBe('__example');
    expect(out.chart.publishedProps).toEqual({ label: 'published' });
    expect(out.chart.publishedDataBinding).toMatchObject({ connectionId: 'conn-x' });
    // o DRAFT nunca é exposto
    expect(res.payload).not.toContain('draft-secret');
    expect(out.chart.draftProps).toBeUndefined();
    expect(res.payload).not.toContain('passwordCipher');
  });
});

describe('share — alvo não publicado', () => {
  it('dashboard sem publishedLayout → 404 na rota pública', async () => {
    const { body } = await createShare(creatorToken, {
      targetType: 'DASHBOARD',
      targetId: unpublishedDashboardId,
      durationSeconds: 3600,
    });
    const res = await app.inject({ method: 'GET', url: `/public/${body.token}` });
    expect(res.statusCode).toBe(404);
  });
});

describe('share — DELETE /share/:id (revogação)', () => {
  let id = '';
  let token = '';

  beforeAll(async () => {
    const { body } = await createShare(creatorToken, {
      targetType: 'DASHBOARD',
      targetId: publishedDashboardId,
      durationSeconds: 3600,
    });
    id = body.id as string;
    token = body.token as string;
  });

  it('outro CREATOR não pode revogar link alheio → 403', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/share/${id}`,
      headers: authHeader(creator2Token),
    });
    expect(res.statusCode).toBe(403);
  });

  it('dono revoga → 200', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/share/${id}`,
      headers: authHeader(creatorToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id, revoked: true });
  });

  it('link revogado bloqueia na rota pública → 403', async () => {
    const res = await app.inject({ method: 'GET', url: `/public/${token}` });
    expect(res.statusCode).toBe(403);
  });

  it('revogar link inexistente → 404', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/share/ghost-id',
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('share — expiração', () => {
  it('após expirar (janela no passado) → 410', async () => {
    const { body } = await createShare(creatorToken, {
      targetType: 'DASHBOARD',
      targetId: publishedDashboardId,
      durationSeconds: 1,
    });
    const token = body.token as string;

    // simula uma janela já vencida (1ª abertura no passado)
    const past = new Date(Date.now() - 10_000);
    await prisma.shareLink.update({
      where: { id: body.id as string },
      data: { firstAccessedAt: past, expiresAt: new Date(past.getTime() + 1000) },
    });

    const res = await app.inject({ method: 'GET', url: `/public/${token}` });
    expect(res.statusCode).toBe(410);
  });

  it('ADMIN pode revogar link de outro (override) → 200', async () => {
    const { body } = await createShare(creatorToken, {
      targetType: 'DASHBOARD',
      targetId: publishedDashboardId,
      durationSeconds: 60,
    });
    const res = await app.inject({
      method: 'DELETE',
      url: `/share/${body.id}`,
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(200);
  });
});

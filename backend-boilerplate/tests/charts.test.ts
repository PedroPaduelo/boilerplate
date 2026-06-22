/**
 * Testes de rota do módulo `charts` (T-B2): CRUD + publish/unpublish no modelo
 * draft/published SEM histórico, com o gate RBAC COMPARTILHADO (T-B1) aplicado
 * de verdade (`requirePermission` + ownership/visibilidade).
 *
 * Cobre os critérios de teste da task:
 *  - estados corretos de publish/unpublish (DRAFT→PUBLISHED→DRAFT, publishedAt);
 *  - ISOLAMENTO draft↔published: editar o draft de um chart publicado NÃO altera
 *    os campos published* até um novo publish;
 *  - rejeição de catalogType inexistente e de connectionId inválido;
 *  - RBAC: VIEWER não cria/publica; ownership respeitado; visibilidade filtra.
 *
 * Usa o Postgres REAL do `DATABASE_URL` (como `departments.test.ts`/`connections.test.ts`).
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
import { closeAllPools } from '@/lib/pg-runner';

const SUFFIX = `c${Date.now()}`;
const CATALOG_TYPE = '__example'; // bloco seedado pelo build:catalog (F0.4)

let app: FastifyInstance;
const userIds: string[] = [];
const deptIds: string[] = [];
let connectionId = '';
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

const validBinding = () => ({ connectionId, query: 'SELECT 1' });
const baseChart = (overrides: Record<string, unknown> = {}) => ({
  title: `Chart ${SUFFIX}`,
  catalogType: CATALOG_TYPE,
  draftProps: { label: 'v1' },
  draftDataBinding: validBinding(),
  ...overrides,
});

beforeAll(async () => {
  app = await buildApp();

  const admin = await prisma.user.create({
    data: { email: `ch-admin-${SUFFIX}@test.local`, name: 'Admin', password: 'x', role: 'ADMIN' },
  });
  const creator = await prisma.user.create({
    data: { email: `ch-creator-${SUFFIX}@test.local`, name: 'Creator', password: 'x', role: 'CREATOR' },
  });
  const creator2 = await prisma.user.create({
    data: { email: `ch-creator2-${SUFFIX}@test.local`, name: 'Creator2', password: 'x', role: 'CREATOR' },
  });
  const viewer = await prisma.user.create({
    data: { email: `ch-viewer-${SUFFIX}@test.local`, name: 'Viewer', password: 'x', role: 'VIEWER' },
  });
  userIds.push(admin.id, creator.id, creator2.id, viewer.id);
  creatorId = creator.id;

  adminToken = app.jwt.sign({ sub: admin.id, role: 'ADMIN' });
  creatorToken = app.jwt.sign({ sub: creator.id, role: 'CREATOR' });
  creator2Token = app.jwt.sign({ sub: creator2.id, role: 'CREATOR' });
  viewerToken = app.jwt.sign({ sub: viewer.id, role: 'VIEWER' });

  // departamento + membership do `creator` (para testar visibilidade DEPARTMENT)
  const dep = await prisma.department.create({
    data: { name: `Dep ${SUFFIX}`, slug: `dep-${SUFFIX}` },
  });
  deptId = dep.id;
  deptIds.push(dep.id);
  await prisma.departmentMembership.create({ data: { departmentId: dep.id, userId: creator.id } });

  // conexão real (não conectamos; só validamos a EXISTÊNCIA do connectionId)
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
}, 30000);

afterAll(async () => {
  try {
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

describe('charts — RBAC do gate', () => {
  it('sem token → 401', async () => {
    const res = await app.inject({ method: 'POST', url: '/charts', payload: baseChart() });
    expect(res.statusCode).toBe(401);
  });

  it('VIEWER não pode criar chart (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/charts',
      headers: authHeader(viewerToken),
      payload: baseChart(),
    });
    expect(res.statusCode).toBe(403);
  });

  it('VIEWER PODE listar charts (artifacts:view)', async () => {
    const res = await app.inject({ method: 'GET', url: '/charts', headers: authHeader(viewerToken) });
    expect(res.statusCode).toBe(200);
  });
});

describe('charts — CRUD + validações', () => {
  let chartId = '';

  it('POST /charts cria draft (201); status DRAFT, published* nulos', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/charts',
      headers: authHeader(creatorToken),
      payload: baseChart(),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    chartId = body.id;
    expect(body.status).toBe('DRAFT');
    expect(body.ownerId).toBe(creatorId);
    expect(body.publishedProps).toBeNull();
    expect(body.publishedDataBinding).toBeNull();
    expect(body.publishedAt).toBeNull();
    expect(body.draftProps).toEqual({ label: 'v1' });
  });

  it('POST /charts rejeita catalogType inexistente (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/charts',
      headers: authHeader(creatorToken),
      payload: baseChart({ catalogType: 'tipo_que_nao_existe' }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /charts rejeita connectionId inexistente (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/charts',
      headers: authHeader(creatorToken),
      payload: baseChart({ draftDataBinding: { connectionId: 'ghost-conn', query: 'SELECT 1' } }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /charts rejeita props fora do propsSchema do catálogo (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/charts',
      headers: authHeader(creatorToken),
      payload: baseChart({ draftProps: { campoDesconhecido: 123 } }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('GET /charts/:id detalha (200)', async () => {
    const res = await app.inject({ method: 'GET', url: `/charts/${chartId}`, headers: authHeader(creatorToken) });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(chartId);
  });

  it('GET /charts/:id inexistente → 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/charts/nope', headers: authHeader(creatorToken) });
    expect(res.statusCode).toBe(404);
  });

  it('PATCH /charts/:id edita o título (200)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/charts/${chartId}`,
      headers: authHeader(creatorToken),
      payload: { title: `Chart ${SUFFIX} v2` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().title).toBe(`Chart ${SUFFIX} v2`);
  });

  it('DELETE /charts/:id remove (200)', async () => {
    const res = await app.inject({ method: 'DELETE', url: `/charts/${chartId}`, headers: authHeader(creatorToken) });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id: chartId, deleted: true });
    const after = await app.inject({ method: 'GET', url: `/charts/${chartId}`, headers: authHeader(creatorToken) });
    expect(after.statusCode).toBe(404);
  });
});

describe('charts — publish/unpublish (estados) + isolamento draft↔published', () => {
  let chartId = '';

  beforeAll(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/charts',
      headers: authHeader(creatorToken),
      payload: baseChart({ draftProps: { label: 'v1' } }),
    });
    chartId = res.json().id;
  });

  it('VIEWER não pode publicar (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/charts/${chartId}/publish`,
      headers: authHeader(viewerToken),
    });
    expect(res.statusCode).toBe(403);
  });

  it('publish copia draft→published, seta publishedAt e status=PUBLISHED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/charts/${chartId}/publish`,
      headers: authHeader(creatorToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('PUBLISHED');
    expect(body.publishedAt).not.toBeNull();
    expect(body.publishedProps).toEqual({ label: 'v1' });
    expect(body.publishedDataBinding).toMatchObject({ connectionId, query: 'SELECT 1' });
  });

  it('CRÍTICO: editar o draft de um chart PUBLICADO NÃO altera os published*', async () => {
    const patch = await app.inject({
      method: 'PATCH',
      url: `/charts/${chartId}`,
      headers: authHeader(creatorToken),
      payload: { draftProps: { label: 'v2' } },
    });
    expect(patch.statusCode).toBe(200);
    const body = patch.json();
    // draft mudou…
    expect(body.draftProps).toEqual({ label: 'v2' });
    // …mas o publicado continua na versão antiga e o status permanece PUBLISHED
    expect(body.publishedProps).toEqual({ label: 'v1' });
    expect(body.status).toBe('PUBLISHED');
  });

  it('um novo publish promove a nova versão do draft', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/charts/${chartId}/publish`,
      headers: authHeader(creatorToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().publishedProps).toEqual({ label: 'v2' });
  });

  it('unpublish zera published* e volta status=DRAFT', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/charts/${chartId}/unpublish`,
      headers: authHeader(creatorToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('DRAFT');
    expect(body.publishedProps).toBeNull();
    expect(body.publishedDataBinding).toBeNull();
    expect(body.publishedAt).toBeNull();
    // o draft é preservado
    expect(body.draftProps).toEqual({ label: 'v2' });
  });
});

describe('charts — ownership', () => {
  let chartId = '';

  beforeAll(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/charts',
      headers: authHeader(creatorToken),
      payload: baseChart({ visibility: 'ORG' }),
    });
    chartId = res.json().id;
  });

  it('outro CREATOR não pode editar chart alheio (403)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/charts/${chartId}`,
      headers: authHeader(creator2Token),
      payload: { title: 'hijack' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('outro CREATOR não pode publicar chart alheio (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/charts/${chartId}/publish`,
      headers: authHeader(creator2Token),
    });
    expect(res.statusCode).toBe(403);
  });

  it('ADMIN pode editar chart de outro (ownership override)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/charts/${chartId}`,
      headers: authHeader(adminToken),
      payload: { title: `admin-edit ${SUFFIX}` },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('charts — visibilidade (get + lista)', () => {
  let privateId = '';
  let orgId = '';

  beforeAll(async () => {
    const priv = await app.inject({
      method: 'POST',
      url: '/charts',
      headers: authHeader(creatorToken),
      payload: baseChart({ visibility: 'PRIVATE' }),
    });
    privateId = priv.json().id;

    const org = await app.inject({
      method: 'POST',
      url: '/charts',
      headers: authHeader(creatorToken),
      payload: baseChart({ visibility: 'ORG' }),
    });
    orgId = org.json().id;
  });

  it('PRIVATE de outro dono → 404 no GET', async () => {
    const res = await app.inject({ method: 'GET', url: `/charts/${privateId}`, headers: authHeader(creator2Token) });
    expect(res.statusCode).toBe(404);
  });

  it('ORG de outro dono → 200 no GET', async () => {
    const res = await app.inject({ method: 'GET', url: `/charts/${orgId}`, headers: authHeader(creator2Token) });
    expect(res.statusCode).toBe(200);
  });

  it('lista do creator2 inclui ORG mas exclui PRIVATE alheio', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/charts?pageSize=100',
      headers: authHeader(creator2Token),
    });
    expect(res.statusCode).toBe(200);
    const ids = res.json().charts.map((c: { id: string }) => c.id);
    expect(ids).toContain(orgId);
    expect(ids).not.toContain(privateId);
  });
});

describe('charts — visibilidade DEPARTMENT (membership na criação)', () => {
  it('membro do depto cria chart DEPARTMENT (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/charts',
      headers: authHeader(creatorToken),
      payload: baseChart({ visibility: 'DEPARTMENT', departmentId: deptId }),
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().departmentId).toBe(deptId);
  });

  it('não-membro NÃO cria chart no depto (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/charts',
      headers: authHeader(creator2Token),
      payload: baseChart({ visibility: 'DEPARTMENT', departmentId: deptId }),
    });
    expect(res.statusCode).toBe(403);
  });

  it('DEPARTMENT sem departmentId → 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/charts',
      headers: authHeader(creatorToken),
      payload: baseChart({ visibility: 'DEPARTMENT' }),
    });
    expect(res.statusCode).toBe(400);
  });
});

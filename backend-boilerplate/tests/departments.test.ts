/**
 * Testes de rota do módulo `departments` (T-B1): CRUD de departamentos +
 * gestão de membership, com o gate RBAC (`requirePermission('departments:manage')`)
 * aplicado de verdade nas rotas.
 *
 * Usa o Postgres REAL do `DATABASE_URL` (como `connections.test.ts`). Limpeza
 * best-effort no `afterAll`.
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

const SUFFIX = `t${Date.now()}`;

let app: FastifyInstance;
const userIds: string[] = [];
const createdDeptIds: string[] = [];
let adminToken = '';
let analystToken = '';
let memberUserId = '';

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

beforeAll(async () => {
  app = await buildApp();

  const admin = await prisma.user.create({
    data: { email: `dep-admin-${SUFFIX}@test.local`, name: 'Admin', password: 'x', role: 'ADMIN' },
  });
  const analyst = await prisma.user.create({
    data: { email: `dep-analyst-${SUFFIX}@test.local`, name: 'Analyst', password: 'x', role: 'ANALYST' },
  });
  const member = await prisma.user.create({
    data: { email: `dep-member-${SUFFIX}@test.local`, name: 'Member', password: 'x', role: 'CREATOR' },
  });
  userIds.push(admin.id, analyst.id, member.id);
  memberUserId = member.id;

  adminToken = app.jwt.sign({ sub: admin.id, role: 'ADMIN' });
  analystToken = app.jwt.sign({ sub: analyst.id, role: 'ANALYST' });
}, 30000);

afterAll(async () => {
  try {
    if (createdDeptIds.length) {
      await prisma.departmentMembership.deleteMany({ where: { departmentId: { in: createdDeptIds } } });
      await prisma.department.deleteMany({ where: { id: { in: createdDeptIds } } });
    }
    if (userIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  } catch {
    // best-effort
  }
  await closeAllPools();
  await app.close();
  await prisma.$disconnect();
});

describe('departments — RBAC do gate', () => {
  it('sem token → 401', async () => {
    const res = await app.inject({ method: 'POST', url: '/departments', payload: { name: 'x', slug: 'x' } });
    expect(res.statusCode).toBe(401);
  });

  it('ANALYST não pode criar departamento (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/departments',
      headers: authHeader(analystToken),
      payload: { name: `Dep ${SUFFIX}`, slug: `dep-${SUFFIX}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('ANALYST PODE listar departamentos (rota só requer auth)', async () => {
    const res = await app.inject({ method: 'GET', url: '/departments', headers: authHeader(analystToken) });
    expect(res.statusCode).toBe(200);
  });
});

describe('departments — CRUD (ADMIN)', () => {
  let depId = '';

  it('POST /departments cria (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/departments',
      headers: authHeader(adminToken),
      payload: { name: `Finanças ${SUFFIX}`, slug: `financas-${SUFFIX}` },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    depId = body.id;
    createdDeptIds.push(depId);
    expect(body.slug).toBe(`financas-${SUFFIX}`);
    expect(body.memberCount).toBe(0);
  });

  it('POST /departments rejeita slug inválido (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/departments',
      headers: authHeader(adminToken),
      payload: { name: 'Bad', slug: 'Inválido Com Espaço' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /departments rejeita slug duplicado (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/departments',
      headers: authHeader(adminToken),
      payload: { name: 'Dup', slug: `financas-${SUFFIX}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it('GET /departments/:id detalha com members vazio', async () => {
    const res = await app.inject({ method: 'GET', url: `/departments/${depId}`, headers: authHeader(adminToken) });
    expect(res.statusCode).toBe(200);
    expect(res.json().members).toEqual([]);
  });

  it('GET /departments/:id inexistente → 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/departments/nope-id', headers: authHeader(adminToken) });
    expect(res.statusCode).toBe(404);
  });

  it('PATCH /departments/:id atualiza nome', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/departments/${depId}`,
      headers: authHeader(adminToken),
      payload: { name: `Finanças ${SUFFIX} v2` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe(`Finanças ${SUFFIX} v2`);
  });

  it('PATCH por ANALYST → 403', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/departments/${depId}`,
      headers: authHeader(analystToken),
      payload: { name: 'nope' },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('departments — membership', () => {
  let depId = '';

  beforeAll(async () => {
    const dep = await prisma.department.create({
      data: { name: `RH ${SUFFIX}`, slug: `rh-${SUFFIX}` },
    });
    depId = dep.id;
    createdDeptIds.push(depId);
  });

  it('POST /:id/members adiciona usuário (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/departments/${depId}/members`,
      headers: authHeader(adminToken),
      payload: { userId: memberUserId },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().userId).toBe(memberUserId);
  });

  it('POST /:id/members duplicado → 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/departments/${depId}/members`,
      headers: authHeader(adminToken),
      payload: { userId: memberUserId },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /:id/members com user inexistente → 404', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/departments/${depId}/members`,
      headers: authHeader(adminToken),
      payload: { userId: 'ghost-user' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('GET /:id/members lista o membro', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/departments/${depId}/members`,
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(200);
    const members = res.json().members;
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe(memberUserId);
  });

  it('memberCount reflete no detalhe', async () => {
    const res = await app.inject({ method: 'GET', url: `/departments/${depId}`, headers: authHeader(adminToken) });
    expect(res.json().memberCount).toBe(1);
  });

  it('POST /:id/members por ANALYST → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/departments/${depId}/members`,
      headers: authHeader(analystToken),
      payload: { userId: memberUserId },
    });
    expect(res.statusCode).toBe(403);
  });

  it('DELETE /:id/members/:userId remove', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/departments/${depId}/members/${memberUserId}`,
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().removed).toBe(true);

    const after = await app.inject({
      method: 'GET',
      url: `/departments/${depId}/members`,
      headers: authHeader(adminToken),
    });
    expect(after.json().members).toHaveLength(0);
  });

  it('DELETE membership inexistente → 404', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/departments/${depId}/members/${memberUserId}`,
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('departments — delete + cascata', () => {
  it('DELETE remove o departamento e suas memberships', async () => {
    const dep = await prisma.department.create({ data: { name: `Tmp ${SUFFIX}`, slug: `tmp-${SUFFIX}` } });
    await prisma.departmentMembership.create({ data: { departmentId: dep.id, userId: memberUserId } });

    const res = await app.inject({ method: 'DELETE', url: `/departments/${dep.id}`, headers: authHeader(adminToken) });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id: dep.id, deleted: true });

    const memberships = await prisma.departmentMembership.findMany({ where: { departmentId: dep.id } });
    expect(memberships).toHaveLength(0);

    const after = await app.inject({ method: 'GET', url: `/departments/${dep.id}`, headers: authHeader(adminToken) });
    expect(after.statusCode).toBe(404);
  });
});

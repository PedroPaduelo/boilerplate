/**
 * Testes de rota + SEGURANÇA do módulo `connections` (T-A).
 *
 * Cobrem CRUD (com senha cifrada at-rest e nunca exposta), test/schema/query
 * contra um Postgres REAL e os guardrails de segurança:
 *   (a) query destrutiva (UPDATE/DROP/multi-statement) é BLOQUEADA;
 *   (b) a senha NUNCA vaza em nenhum GET/response.
 *
 * O "Postgres externo" usado nos testes é o próprio banco do app (DATABASE_URL)
 * — credenciais reais, conforme orientação da task. RBAC/visibilidade é exercido
 * com usuários de papéis e departamentos distintos.
 *
 * Cache de schema: injetamos um fake Redis em `redisInstance` para validar o
 * caminho conn:{id}:schema (miss → store → hit) de forma determinística.
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
import { decrypt } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';
import { closeAllPools } from '@/lib/pg-runner';
import { redisInstance } from '@/lib/redis';

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

// --- alvo Postgres real (parse da DATABASE_URL) ------------------------------
function externalTarget() {
  const url = new URL(process.env.DATABASE_URL as string);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    database: url.pathname.replace(/^\//, ''),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    sslMode: url.searchParams.get('sslmode') ?? 'disable',
  };
}

const SUFFIX = `t${Date.now()}`;
const target = externalTarget();

let app: FastifyInstance;

// ids criados (limpeza no final)
const userIds: string[] = [];
let dep1Id = '';
let dep2Id = '';
let ownerToken = '';
let viewerToken = '';
let creatorToken = '';
let otherAnalystToken = '';
let connId = '';

// Error handler local (mesma semântica do src/http/error-handler.ts). Definido
// aqui para não importar o error-handler do app, que possui erros de tipagem
// PRÉ-EXISTENTES (fora do escopo desta task) que o ts-jest acusaria.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function testErrorHandler(error: any, _req: unknown, reply: any) {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({ message: 'Validation error' });
  }
  if (error instanceof ZodError) {
    return reply.status(422).send({ message: 'unprocessable_entity' });
  }
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

function authHeader(token: string) {
  return { authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  // injeta fake Redis para o caminho de cache do schema.
  redisInstance.setClient(new FakeRedis() as never);

  app = await buildApp();

  // departamentos
  const dep1 = await prisma.department.create({
    data: { name: `Dep1 ${SUFFIX}`, slug: `dep1-${SUFFIX}` },
  });
  const dep2 = await prisma.department.create({
    data: { name: `Dep2 ${SUFFIX}`, slug: `dep2-${SUFFIX}` },
  });
  dep1Id = dep1.id;
  dep2Id = dep2.id;

  // usuários (papel + membership)
  const owner = await prisma.user.create({
    data: {
      email: `owner-${SUFFIX}@test.local`,
      name: 'Owner Analyst',
      password: 'x',
      role: 'ANALYST',
      memberships: { create: { departmentId: dep1Id } },
    },
  });
  const viewer = await prisma.user.create({
    data: {
      email: `viewer-${SUFFIX}@test.local`,
      name: 'Viewer',
      password: 'x',
      role: 'VIEWER',
    },
  });
  const creator = await prisma.user.create({
    data: {
      email: `creator-${SUFFIX}@test.local`,
      name: 'Creator Member',
      password: 'x',
      role: 'CREATOR',
      memberships: { create: { departmentId: dep1Id } },
    },
  });
  const otherAnalyst = await prisma.user.create({
    data: {
      email: `other-${SUFFIX}@test.local`,
      name: 'Other Analyst',
      password: 'x',
      role: 'ANALYST',
      memberships: { create: { departmentId: dep2Id } },
    },
  });

  userIds.push(owner.id, viewer.id, creator.id, otherAnalyst.id);

  ownerToken = app.jwt.sign({ sub: owner.id, role: 'ANALYST' });
  viewerToken = app.jwt.sign({ sub: viewer.id, role: 'VIEWER' });
  creatorToken = app.jwt.sign({ sub: creator.id, role: 'CREATOR' });
  otherAnalystToken = app.jwt.sign({ sub: otherAnalyst.id, role: 'ANALYST' });
}, 30000);

afterAll(async () => {
  try {
    if (userIds.length) {
      await prisma.connection.deleteMany({ where: { ownerId: { in: userIds } } });
      await prisma.departmentMembership.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (dep1Id || dep2Id) {
      await prisma.department.deleteMany({ where: { id: { in: [dep1Id, dep2Id] } } });
    }
  } catch {
    // best-effort cleanup
  }
  await closeAllPools();
  await app.close();
  await prisma.$disconnect();
});

describe('connections — CRUD + cifragem', () => {
  it('POST /connections cria conexão e NÃO retorna senha/cipher', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/connections',
      headers: authHeader(ownerToken),
      payload: {
        name: `Conn ${SUFFIX}`,
        description: 'test conn',
        host: target.host,
        port: target.port,
        database: target.database,
        username: target.username,
        password: target.password,
        sslMode: target.sslMode,
        visibility: 'DEPARTMENT',
        departmentId: dep1Id,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    connId = body.id;
    expect(body.name).toBe(`Conn ${SUFFIX}`);
    expect(body.status).toBe('unknown');
    expect(body.ownerId).toBe(userIds[0]);
    // SEGURANÇA: nenhum campo de senha presente.
    expect(body.password).toBeUndefined();
    expect(body.passwordCipher).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain(target.password);
  });

  it('persiste a senha CIFRADA at-rest (decifra para o plaintext original)', async () => {
    const row = await prisma.connection.findUnique({ where: { id: connId } });
    expect(row).not.toBeNull();
    expect(row!.passwordCipher).not.toBe(target.password);
    expect(decrypt(row!.passwordCipher)).toBe(target.password);
  });

  it('GET /connections/:id retorna a conexão sem senha (dono)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/connections/${connId}`,
      headers: authHeader(ownerToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(connId);
    expect(body.passwordCipher).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain(target.password);
  });

  it('GET /connections lista incluindo a conexão do dono', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/connections',
      headers: authHeader(ownerToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.connections.some((c: { id: string }) => c.id === connId)).toBe(true);
    expect(JSON.stringify(body)).not.toContain(target.password);
  });

  it('PATCH /connections/:id atualiza e RECIFRA a senha', async () => {
    const newPw = 'new-secret-pw-123';
    const res = await app.inject({
      method: 'PATCH',
      url: `/connections/${connId}`,
      headers: authHeader(ownerToken),
      payload: { name: `Conn ${SUFFIX} v2`, password: newPw },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.name).toBe(`Conn ${SUFFIX} v2`);
    expect(JSON.stringify(body)).not.toContain(newPw);

    const row = await prisma.connection.findUnique({ where: { id: connId } });
    expect(decrypt(row!.passwordCipher)).toBe(newPw);

    // restaura a senha real para os testes de conectividade abaixo.
    await app.inject({
      method: 'PATCH',
      url: `/connections/${connId}`,
      headers: authHeader(ownerToken),
      payload: { password: target.password },
    });
  });
});

describe('connections — RBAC / visibilidade', () => {
  it('VIEWER não pode listar conexões (403)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/connections',
      headers: authHeader(viewerToken),
    });
    expect(res.statusCode).toBe(403);
  });

  it('VIEWER não pode criar conexão (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/connections',
      headers: authHeader(viewerToken),
      payload: {
        name: 'nope',
        host: target.host,
        database: target.database,
        username: target.username,
        password: 'x',
        visibility: 'PRIVATE',
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it('ANALYST de outro departamento não vê conexão DEPARTMENT (404)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/connections/${connId}`,
      headers: authHeader(otherAnalystToken),
    });
    expect(res.statusCode).toBe(404);
  });

  it('CREATOR membro do departamento PODE ver/usar a conexão', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/connections/${connId}`,
      headers: authHeader(creatorToken),
    });
    expect(res.statusCode).toBe(200);
  });

  it('requisição sem token é rejeitada (401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/connections' });
    expect(res.statusCode).toBe(401);
  });
});

describe('connections — test / schema / query (Postgres real)', () => {
  it('POST /connections/:id/test conecta e marca status=ok', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/connections/${connId}/test`,
      headers: authHeader(ownerToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe('ok');
    expect(body.lastTestedAt).not.toBeNull();
  }, 20000);

  it('GET /connections/:id/schema introspecta tabelas (cache miss → hit)', async () => {
    const first = await app.inject({
      method: 'GET',
      url: `/connections/${connId}/schema`,
      headers: authHeader(ownerToken),
    });
    expect(first.statusCode).toBe(200);
    const b1 = first.json();
    expect(b1.cached).toBe(false);
    expect(b1.tableCount).toBeGreaterThan(0);
    const names = b1.tables.map((t: { name: string }) => t.name);
    expect(names).toContain('connections');
    expect(names).toContain('users');

    const second = await app.inject({
      method: 'GET',
      url: `/connections/${connId}/schema`,
      headers: authHeader(ownerToken),
    });
    expect(second.statusCode).toBe(200);
    expect(second.json().cached).toBe(true);
  }, 20000);

  it('POST /connections/:id/query executa SELECT read-only', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/connections/${connId}/query`,
      headers: authHeader(ownerToken),
      payload: { sql: 'SELECT 1 AS n, $1::text AS label', params: ['hi'] },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.columns.map((c: { name: string }) => c.name)).toEqual(['n', 'label']);
    expect(Number(body.rows[0].n)).toBe(1);
    expect(body.rows[0].label).toBe('hi');
    expect(body.truncated).toBe(false);
  }, 20000);

  it('query respeita o row cap (truncated)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/connections/${connId}/query`,
      headers: authHeader(ownerToken),
      payload: { sql: 'SELECT g FROM generate_series(1, 100) AS g', maxRows: 10 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.rowCount).toBe(10);
    expect(body.truncated).toBe(true);
  }, 20000);
});

describe('connections — SEGURANÇA', () => {
  it('bloqueia DROP (não-SELECT) com 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/connections/${connId}/query`,
      headers: authHeader(ownerToken),
      payload: { sql: 'DROP TABLE users' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('bloqueia UPDATE (DML) com 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/connections/${connId}/query`,
      headers: authHeader(ownerToken),
      payload: { sql: 'UPDATE users SET name = $1', params: ['x'] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('bloqueia múltiplos statements com 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/connections/${connId}/query`,
      headers: authHeader(ownerToken),
      payload: { sql: 'SELECT 1; DROP TABLE users' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('bloqueia CTE data-modifying (WITH ... DELETE) com 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/connections/${connId}/query`,
      headers: authHeader(ownerToken),
      payload: { sql: 'WITH x AS (DELETE FROM users RETURNING *) SELECT * FROM x' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('a senha NUNCA aparece em nenhuma resposta da API', async () => {
    const get = await app.inject({
      method: 'GET',
      url: `/connections/${connId}`,
      headers: authHeader(ownerToken),
    });
    const list = await app.inject({
      method: 'GET',
      url: '/connections',
      headers: authHeader(ownerToken),
    });
    expect(get.body).not.toContain(target.password);
    expect(get.body).not.toContain('passwordCipher');
    expect(get.body).not.toContain('password_cipher');
    expect(list.body).not.toContain(target.password);
    expect(list.body).not.toContain('passwordCipher');
  });
});

describe('connections — delete', () => {
  it('DELETE /connections/:id remove (dono)', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/connections/${connId}`,
      headers: authHeader(ownerToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id: connId, deleted: true });

    const after = await app.inject({
      method: 'GET',
      url: `/connections/${connId}`,
      headers: authHeader(ownerToken),
    });
    expect(after.statusCode).toBe(404);
  });
});

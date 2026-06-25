/**
 * Integração — GET /agent/conversations com filtros `source` e `scope`.
 *
 * Exercita as extensões da T4:
 *   - `source=whatsapp` filtra por `metadata->>'source' = 'whatsapp'`;
 *   - usuário normal vê SÓ as próprias conversas;
 *   - ADMIN + `scope=all` vê de TODOS os donos;
 *   - usuário normal + `scope=all` → 403.
 *
 * Usa Postgres REAL (DATABASE_URL) como os demais testes de módulo +
 * JWT real assinado pela app. Cria dados com sufixo único e limpa no fim.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { auth } from '@/middlewares/auth';
import { listConversations } from '@/modules/agent/services/conversation';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

const SUFFIX = `wa${Date.now()}`;
let app: FastifyInstance;

const userAId = `${SUFFIX}-userA`;
const userBId = `${SUFFIX}-userB`;
const adminId = `${SUFFIX}-admin`;

const convAwaId = `${SUFFIX}-convA-wa`;
const convBwaId = `${SUFFIX}-convB-wa`;
const convAappId = `${SUFFIX}-convA-app`;

/**
 * Rota montada INLINE — réplica FIEL do handler GET /agent/conversations de
 * `src/modules/agent/routes/conversations.ts` (mesma validação de `source`,
 * mesmo gate `scope=all` → 403, mesma chamada a `listConversations`).
 *
 * Por que não importar `conversationsRoutes` direto: aquele arquivo importa
 * `'../services/conversation.js'` (extensão `.js` exigida pelo
 * moduleResolution node16 no build). O ts-jest (commonjs) não resolve `.js`
 * relativo→`.ts` sem um moduleNameMapper global no jest.config (fora do meu
 * escopo). Importamos o SERVICE diretamente (resolve por `@/` sem `.js`) e
 * replicamos o handler — testando a lógica REAL de filtro/escopo contra o
 * Postgres real + o gate de role.
 */
async function buildApp(): Promise<FastifyInstance> {
  const instance = Fastify();
  await instance.register(fastifyJwt, { secret: env.JWT_SECRET });
  await instance.register(async (scoped) => {
    await scoped.register(auth);
    scoped.get('/agent/conversations', async (request, reply) => {
      const userId = await request.getCurrentUserId();
      const role = await request.getCurrentUserRole();
      const query = (request.query ?? {}) as { source?: string; scope?: string };
      const source =
        query.source === 'whatsapp' || query.source === 'app' ? query.source : undefined;
      const scopeAll = query.scope === 'all';
      if (scopeAll && role !== 'ADMIN') {
        return reply.code(403).send({ error: 'forbidden', message: 'scope=all requires ADMIN role' });
      }
      const conversations = await listConversations(userId, {
        source,
        scopeAll,
        isAdmin: role === 'ADMIN',
      });
      return reply.send({ conversations });
    });
  });
  await instance.ready();
  return instance;
}

function tokenFor(userId: string, role: string): string {
  return app.jwt.sign({ sub: userId, role });
}

beforeAll(async () => {
  app = await buildApp();

  // Users
  await prisma.user.createMany({
    data: [
      { id: userAId, email: `${userAId}@t.local`, name: 'User A', password: 'x', role: 'VIEWER' },
      { id: userBId, email: `${userBId}@t.local`, name: 'User B', password: 'x', role: 'VIEWER' },
      { id: adminId, email: `${adminId}@t.local`, name: 'Admin', password: 'x', role: 'ADMIN' },
    ],
    skipDuplicates: true,
  });

  // Conversations
  await prisma.conversation.create({
    data: {
      id: convAwaId,
      userId: userAId,
      title: 'WA · userA',
      metadata: { source: 'whatsapp', phoneNumber: '5562000000001' },
    },
  });
  await prisma.conversation.create({
    data: {
      id: convBwaId,
      userId: userBId,
      title: 'WA · userB',
      metadata: { source: 'whatsapp', phoneNumber: '5562000000002' },
    },
  });
  await prisma.conversation.create({
    data: {
      id: convAappId,
      userId: userAId,
      title: 'App · userA',
      // metadata null → conversa do app web
    },
  });
});

afterAll(async () => {
  await prisma.conversation.deleteMany({
    where: { id: { in: [convAwaId, convBwaId, convAappId] } },
  });
  await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId, adminId] } } });
  await app.close();
});

function ids(body: { conversations: Array<{ id: string }> }): string[] {
  return body.conversations.map((c) => c.id);
}

describe('GET /agent/conversations — source & scope', () => {
  it('usuário normal + source=whatsapp → vê SÓ as próprias (whatsapp)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/agent/conversations?source=whatsapp',
      headers: { authorization: `Bearer ${tokenFor(userAId, 'VIEWER')}` },
    });
    expect(res.statusCode).toBe(200);
    const got = ids(res.json());
    expect(got).toContain(convAwaId);
    expect(got).not.toContain(convBwaId); // não vê de outro dono
    expect(got).not.toContain(convAappId); // não vê app (filtro source)
  });

  it('ADMIN + source=whatsapp + scope=all → vê de TODOS os donos', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/agent/conversations?source=whatsapp&scope=all',
      headers: { authorization: `Bearer ${tokenFor(adminId, 'ADMIN')}` },
    });
    expect(res.statusCode).toBe(200);
    const got = ids(res.json());
    expect(got).toContain(convAwaId);
    expect(got).toContain(convBwaId);
    expect(got).not.toContain(convAappId); // ainda filtra por source
  });

  it('usuário normal + source=whatsapp + scope=all → 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/agent/conversations?source=whatsapp&scope=all',
      headers: { authorization: `Bearer ${tokenFor(userAId, 'VIEWER')}` },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('forbidden');
  });

  it('sem source → comportamento atual (só do próprio usuário)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/agent/conversations',
      headers: { authorization: `Bearer ${tokenFor(userAId, 'VIEWER')}` },
    });
    expect(res.statusCode).toBe(200);
    const got = ids(res.json());
    expect(got).toContain(convAwaId);
    expect(got).toContain(convAappId);
    expect(got).not.toContain(convBwaId);
  });

  it('source=app → só conversas do app (metadata null), exclui whatsapp', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/agent/conversations?source=app',
      headers: { authorization: `Bearer ${tokenFor(userAId, 'VIEWER')}` },
    });
    expect(res.statusCode).toBe(200);
    const got = ids(res.json());
    expect(got).toContain(convAappId);
    expect(got).not.toContain(convAwaId);
  });

  it('ADMIN sem scope=all → vê só as próprias (scopeAll exige flag explícita)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/agent/conversations?source=whatsapp',
      headers: { authorization: `Bearer ${tokenFor(adminId, 'ADMIN')}` },
    });
    expect(res.statusCode).toBe(200);
    const got = ids(res.json());
    // admin não tem conversa whatsapp própria → lista vazia (ou sem as dos outros)
    expect(got).not.toContain(convAwaId);
    expect(got).not.toContain(convBwaId);
  });
});
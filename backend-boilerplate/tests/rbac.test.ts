/**
 * Testes do RBAC COMPARTILHADO (T-B1):
 *   (1) matriz de permissões PURA (papel × permissão) — `@/lib/rbac/permissions`;
 *   (2) helper de VISIBILIDADE PURO (PRIVATE/DEPARTMENT/ORG) — `@/lib/visibility`;
 *   (3) middleware `requirePermission`/`requireRole` PLUGADO numa app Fastify
 *       real (preHandler) — prova que bloqueia/permite por papel conforme o
 *       doc 01, sem depender de banco.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { ForbiddenError, UnauthorizedError } from '@/http/routes/_errors';
import { auth } from '@/middlewares/auth';
import { requirePermission, requireRole } from '@/middlewares/rbac';
import {
  hasPermission,
  permissionsForRole,
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from '@/lib/rbac/permissions';
import {
  buildVisibilityWhere,
  canModifyArtifact,
  canViewArtifact,
} from '@/lib/visibility';
import type { ActorContext } from '@/lib/rbac/context';
import { env } from '@/lib/env';

// =============================================================================
// (1) Matriz de permissões PURA — papel × permissão (doc 01)
// =============================================================================

describe('RBAC — matriz de permissões (doc 01)', () => {
  // Matriz esperada, transcrita do doc 01 (RBAC aprovado, rodada 6).
  // true = permite, false = nega.
  const expected: Record<Permission, Record<Role, boolean>> = {
    'departments:manage': { ADMIN: true, ANALYST: false, CREATOR: false, VIEWER: false, USER: false },
    'connections:manage': { ADMIN: true, ANALYST: true, CREATOR: false, VIEWER: false, USER: false },
    'connections:use': { ADMIN: true, ANALYST: true, CREATOR: true, VIEWER: false, USER: false },
    'artifacts:manage': { ADMIN: true, ANALYST: true, CREATOR: true, VIEWER: false, USER: false },
    'artifacts:publish': { ADMIN: true, ANALYST: true, CREATOR: true, VIEWER: false, USER: false },
    'artifacts:view': { ADMIN: true, ANALYST: true, CREATOR: true, VIEWER: true, USER: false },
    'artifacts:export': { ADMIN: true, ANALYST: true, CREATOR: true, VIEWER: true, USER: false },
    'share:create': { ADMIN: true, ANALYST: true, CREATOR: true, VIEWER: false, USER: false },
  };

  const roles: Role[] = ['ADMIN', 'ANALYST', 'CREATOR', 'VIEWER', 'USER'];

  for (const permission of Object.keys(expected) as Permission[]) {
    for (const role of roles) {
      const allow = expected[permission][role];
      it(`${role} ${allow ? 'PODE' : 'NÃO pode'} "${permission}"`, () => {
        expect(hasPermission(role, permission)).toBe(allow);
      });
    }
  }

  it('ADMIN possui TODAS as permissões', () => {
    expect(permissionsForRole('ADMIN').sort()).toEqual([...ROLE_PERMISSIONS.ADMIN].sort());
    expect(ROLE_PERMISSIONS.ADMIN.length).toBe(8);
  });

  it('USER não possui nenhuma permissão', () => {
    expect(permissionsForRole('USER')).toEqual([]);
  });

  it('papel desconhecido nunca tem permissão', () => {
    expect(hasPermission('ROOT', 'artifacts:view')).toBe(false);
    expect(permissionsForRole('ROOT')).toEqual([]);
  });
});

// =============================================================================
// (2) Helper de VISIBILIDADE PURO — PRIVATE / DEPARTMENT / ORG
// =============================================================================

describe('Visibilidade — canView / canModify / buildVisibilityWhere', () => {
  const owner: ActorContext = { userId: 'u-owner', role: 'CREATOR', departmentIds: ['d1'] };
  const memberD1: ActorContext = { userId: 'u-mem', role: 'VIEWER', departmentIds: ['d1'] };
  const outsider: ActorContext = { userId: 'u-out', role: 'ANALYST', departmentIds: ['d2'] };
  const admin: ActorContext = { userId: 'u-admin', role: 'ADMIN', departmentIds: [] };

  const privateArt = { ownerId: 'u-owner', visibility: 'PRIVATE', departmentId: 'd1' };
  const deptArt = { ownerId: 'u-owner', visibility: 'DEPARTMENT', departmentId: 'd1' };
  const orgArt = { ownerId: 'u-owner', visibility: 'ORG', departmentId: null };

  it('PRIVATE: só o dono (e ADMIN) vê', () => {
    expect(canViewArtifact(privateArt, owner)).toBe(true);
    expect(canViewArtifact(privateArt, admin)).toBe(true);
    expect(canViewArtifact(privateArt, memberD1)).toBe(false);
    expect(canViewArtifact(privateArt, outsider)).toBe(false);
  });

  it('DEPARTMENT: membros do depto veem; de fora não', () => {
    expect(canViewArtifact(deptArt, owner)).toBe(true);
    expect(canViewArtifact(deptArt, memberD1)).toBe(true);
    expect(canViewArtifact(deptArt, admin)).toBe(true);
    expect(canViewArtifact(deptArt, outsider)).toBe(false);
  });

  it('ORG: qualquer um vê', () => {
    expect(canViewArtifact(orgArt, owner)).toBe(true);
    expect(canViewArtifact(orgArt, memberD1)).toBe(true);
    expect(canViewArtifact(orgArt, outsider)).toBe(true);
    expect(canViewArtifact(orgArt, admin)).toBe(true);
  });

  it('canModify: só dono ou ADMIN, independente da visibilidade', () => {
    expect(canModifyArtifact(orgArt, owner)).toBe(true);
    expect(canModifyArtifact(orgArt, admin)).toBe(true);
    expect(canModifyArtifact(orgArt, memberD1)).toBe(false);
    expect(canModifyArtifact(deptArt, outsider)).toBe(false);
  });

  it('buildVisibilityWhere: ADMIN sem restrição', () => {
    expect(buildVisibilityWhere(admin)).toEqual({});
  });

  it('buildVisibilityWhere: não-admin → OR(dono, ORG, DEPARTMENT∈memberships)', () => {
    const where = buildVisibilityWhere(memberD1) as { OR: unknown[] };
    expect(where.OR).toEqual([
      { ownerId: 'u-mem' },
      { visibility: 'ORG' },
      { visibility: 'DEPARTMENT', departmentId: { in: ['d1'] } },
    ]);
  });

  it('buildVisibilityWhere: sem departamentos → DEPARTMENT não casa nada', () => {
    const noDeps: ActorContext = { userId: 'u', role: 'CREATOR', departmentIds: [] };
    const where = buildVisibilityWhere(noDeps) as { OR: { departmentId?: { in: string[] } }[] };
    expect(where.OR[2].departmentId).toEqual({ in: ['__none__'] });
  });
});

// =============================================================================
// (3) Middleware PLUGADO numa app Fastify (preHandler) — papel × ação
// =============================================================================

function testErrorHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any,
  _req: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reply: any
) {
  if (error instanceof UnauthorizedError) return reply.status(401).send({ message: error.message });
  if (error instanceof ForbiddenError) return reply.status(403).send({ message: error.message });
  return reply.status(500).send({ message: 'Internal server error' });
}

describe('Middleware requirePermission/requireRole (Fastify preHandler)', () => {
  let app: FastifyInstance;

  const tokenFor = (role: string) => app.jwt.sign({ sub: `user-${role}`, role });

  beforeAll(async () => {
    app = Fastify().withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    app.setErrorHandler(testErrorHandler);
    await app.register(fastifyJwt, { secret: env.JWT_SECRET });
    await app.register(auth);

    // rotas-cobaia, uma por permissão representativa + uma por requireRole.
    app.post('/p/departments', { preHandler: requirePermission('departments:manage') }, async () => ({ ok: true }));
    app.post('/p/connections', { preHandler: requirePermission('connections:manage') }, async () => ({ ok: true }));
    app.post('/p/query', { preHandler: requirePermission('connections:use') }, async () => ({ ok: true }));
    app.get('/p/view', { preHandler: requirePermission('artifacts:view') }, async () => ({ ok: true }));
    app.post('/p/admin-only', { preHandler: requireRole('ADMIN') }, async () => ({ ok: true }));

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // matriz esperada por rota × papel
  const cases: { url: string; method: 'POST' | 'GET'; allow: Record<string, boolean> }[] = [
    {
      url: '/p/departments',
      method: 'POST',
      allow: { ADMIN: true, ANALYST: false, CREATOR: false, VIEWER: false, USER: false },
    },
    {
      url: '/p/connections',
      method: 'POST',
      allow: { ADMIN: true, ANALYST: true, CREATOR: false, VIEWER: false, USER: false },
    },
    {
      url: '/p/query',
      method: 'POST',
      allow: { ADMIN: true, ANALYST: true, CREATOR: true, VIEWER: false, USER: false },
    },
    {
      url: '/p/view',
      method: 'GET',
      allow: { ADMIN: true, ANALYST: true, CREATOR: true, VIEWER: true, USER: false },
    },
    {
      url: '/p/admin-only',
      method: 'POST',
      allow: { ADMIN: true, ANALYST: false, CREATOR: false, VIEWER: false, USER: false },
    },
  ];

  for (const c of cases) {
    for (const role of ['ADMIN', 'ANALYST', 'CREATOR', 'VIEWER', 'USER']) {
      const expectAllow = c.allow[role];
      it(`${role} → ${c.method} ${c.url} = ${expectAllow ? 200 : 403}`, async () => {
        const res = await app.inject({
          method: c.method,
          url: c.url,
          headers: { authorization: `Bearer ${tokenFor(role)}` },
        });
        expect(res.statusCode).toBe(expectAllow ? 200 : 403);
      });
    }
  }

  it('sem token → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/p/view' });
    expect(res.statusCode).toBe(401);
  });
});

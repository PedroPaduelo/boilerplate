# RBAC + Visibilidade — COMPARTILHADO (T-B1)

Fonte da verdade da matriz: `docs/plano/01-fundacao-rbac-tenancy.md`.
Este é o RBAC **compartilhado** que os próximos módulos (charts, dashboards,
share, export, data) devem consumir — **não reimplemente** a lógica por módulo
(o `connections` (T-A) tem um `rbac.ts` local só por ter chegado antes; o ideal
do projeto é convergir para cá).

## Onde vive o quê

| Arquivo | Conteúdo |
| --- | --- |
| `src/lib/rbac/permissions.ts` | Matriz PURA: `Permission`, `Role`, `ROLE_PERMISSIONS`, `hasPermission(role, perm)`. Testável sem Fastify. |
| `src/lib/rbac/context.ts` | `ActorContext` (`userId`/`role`/`departmentIds`) + `loadActorContext(request)`. |
| `src/lib/rbac/index.ts` | Barrel (`@/lib/rbac`). |
| `src/lib/visibility.ts` | `canViewArtifact`, `canModifyArtifact`, `buildVisibilityWhere` (PRIVATE/DEPARTMENT/ORG). |
| `src/middlewares/rbac.ts` | `preHandler`s Fastify: `requireAuth`, `requireRole(...)`, `requirePermission(perm)`. |

## Permissões disponíveis (matriz do doc 01)

`departments:manage` · `connections:manage` · `connections:use` ·
`artifacts:manage` · `artifacts:publish` · `artifacts:view` ·
`artifacts:export` · `share:create`

| Permissão | ADMIN | ANALYST | CREATOR | VIEWER | USER |
|---|:-:|:-:|:-:|:-:|:-:|
| `departments:manage` | ✅ | — | — | — | — |
| `connections:manage` | ✅ | ✅ | — | — | — |
| `connections:use` | ✅ | ✅ | ✅ | — | — |
| `artifacts:manage` | ✅ | ✅ | ✅ | — | — |
| `artifacts:publish` | ✅ | ✅ | ✅ | — | — |
| `artifacts:view` | ✅ | ✅ | ✅ | ✅ | — |
| `artifacts:export` | ✅ | ✅ | ✅ | ✅ | — |
| `share:create` | ✅ | ✅ | ✅ | — | — |

## Como consumir (charts/dashboards/share/export)

### 1. Gate por permissão na rota (preHandler)

```ts
import { auth } from '@/middlewares/auth';
import { requirePermission } from '@/middlewares/rbac';

const chartsModule: FastifyPluginAsync = async (app) => {
  await app.register(auth); // 1x por módulo (decora getCurrentUser*)

  app.post('/charts', { preHandler: requirePermission('artifacts:manage') }, createHandler);
  app.post('/charts/:id/publish', { preHandler: requirePermission('artifacts:publish') }, publishHandler);
  app.get('/charts', { preHandler: requirePermission('artifacts:view') }, listHandler);
};
```

`requireRole('ADMIN')` também existe para checagem direta por papel.
Sem token → 401; papel sem a permissão → 403.

### 2. Ownership/visibilidade dentro do handler

```ts
import { loadActorContext } from '@/lib/rbac';
import { canViewArtifact, canModifyArtifact, buildVisibilityWhere } from '@/lib/visibility';
import { NotFoundError, ForbiddenError } from '@/http/routes/_errors';

// detalhe: 404 (não 403) p/ não vazar existência
const ctx = await loadActorContext(request);
const chart = await prisma.chart.findUnique({ where: { id } });
if (!chart || !canViewArtifact(chart, ctx)) throw new NotFoundError('Chart not found');

// editar/excluir: só dono ou ADMIN
if (!canModifyArtifact(chart, ctx)) throw new ForbiddenError('You can only modify charts you own');

// listagem filtrada por visibilidade (combine com seus filtros via AND)
const where = { AND: [buildVisibilityWhere(ctx), myFilters] };
```

`buildVisibilityWhere`/`canViewArtifact` funcionam para qualquer artefato com
`ownerId` + `visibility` + `departmentId` (Chart, Dashboard, Connection, ...).

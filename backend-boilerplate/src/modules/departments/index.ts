import type { FastifyPluginAsync } from 'fastify';
import { auth } from '@/middlewares/auth';
import { addMemberRoute } from './routes/add-member';
import { createDepartmentRoute } from './routes/create-department';
import { deleteDepartmentRoute } from './routes/delete-department';
import { getDepartmentRoute } from './routes/get-department';
import { listDepartmentsRoute } from './routes/list-departments';
import { listMembersRoute } from './routes/list-members';
import { removeMemberRoute } from './routes/remove-member';
import { updateDepartmentRoute } from './routes/update-department';

/**
 * Módulo `departments` — TRILHA T-B (task T-B1).
 *
 * Plugin auto-descoberto por `@fastify/autoload` (ver `src/http/modules-loader.ts`
 * e `src/modules/README.md`). Superfície (doc 31): CRUD de departamento +
 * gestão de membership (user × department).
 *
 *   POST   /departments                       cria (ADMIN)
 *   GET    /departments                       lista (autenticado)
 *   GET    /departments/:id                   detalha + membros (autenticado)
 *   PATCH  /departments/:id                   atualiza (ADMIN)
 *   DELETE /departments/:id                   remove (ADMIN; cascata memberships)
 *   GET    /departments/:id/members           lista membros (autenticado)
 *   POST   /departments/:id/members           adiciona membro (ADMIN)
 *   DELETE /departments/:id/members/:userId   remove membro (ADMIN)
 *
 * `auth` (JWT) é registrado uma vez no escopo do módulo; o gate por papel é
 * aplicado por rota via `requirePermission('departments:manage')`
 * (`@/middlewares/rbac`), implementando a matriz RBAC do doc 01.
 */
const departmentsModule: FastifyPluginAsync = async (app) => {
  await app.register(auth);

  await createDepartmentRoute(app);
  await listDepartmentsRoute(app);
  await getDepartmentRoute(app);
  await updateDepartmentRoute(app);
  await deleteDepartmentRoute(app);
  await listMembersRoute(app);
  await addMemberRoute(app);
  await removeMemberRoute(app);
};

export default departmentsModule;

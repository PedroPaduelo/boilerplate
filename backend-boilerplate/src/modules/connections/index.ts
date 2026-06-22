import type { FastifyPluginAsync } from 'fastify';
import { auth } from '@/middlewares/auth';
import { createConnectionRoute } from './routes/create-connection';
import { deleteConnectionRoute } from './routes/delete-connection';
import { getConnectionRoute } from './routes/get-connection';
import { getConnectionSchemaRoute } from './routes/get-connection-schema';
import { listConnectionsRoute } from './routes/list-connections';
import { runConnectionQueryRoute } from './routes/run-connection-query';
import { testConnectionRoute } from './routes/test-connection';
import { updateConnectionRoute } from './routes/update-connection';

/**
 * Módulo `connections` — TRILHA T-A.
 *
 * Plugin auto-descoberto por `@fastify/autoload` (ver `src/http/modules-loader.ts`
 * e `src/modules/README.md`). Implementa a superfície completa do doc 31:
 *
 *   POST   /connections            cria (senha cifrada AES-256-GCM at-rest)
 *   GET    /connections            lista (filtra por RBAC/visibilidade)
 *   GET    /connections/:id        detalha (sem senha)
 *   PATCH  /connections/:id        atualiza (recifra senha se enviada)
 *   DELETE /connections/:id        remove
 *   POST   /connections/:id/test   testa conectividade (status/lastTestedAt)
 *   GET    /connections/:id/schema introspecção (cache Redis conn:{id}:schema)
 *   POST   /connections/:id/query  SELECT read-only via pg-runner (guardrails)
 *
 * `auth` (JWT) é registrado uma vez no escopo do módulo — como é um
 * `fastify-plugin` (não encapsulado), o preHandler vale para todas as rotas
 * abaixo. Cada handler resolve papel + visibilidade via `rbac.ts`.
 */
const connectionsModule: FastifyPluginAsync = async (app) => {
  await app.register(auth);

  await createConnectionRoute(app);
  await listConnectionsRoute(app);
  await getConnectionRoute(app);
  await updateConnectionRoute(app);
  await deleteConnectionRoute(app);
  await testConnectionRoute(app);
  await getConnectionSchemaRoute(app);
  await runConnectionQueryRoute(app);
};

export default connectionsModule;

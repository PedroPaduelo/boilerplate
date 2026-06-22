import type { FastifyPluginAsync } from 'fastify';
import { auth } from '@/middlewares/auth';
import { createShareRoute } from './routes/create-share';
import { deleteShareRoute } from './routes/delete-share';
import { publicGetRoute } from './routes/public-get';

/**
 * Módulo `share` — TRILHA T-B (task T-B4).
 *
 * Plugin auto-descoberto por `@fastify/autoload` (ver `src/http/modules-loader.ts`
 * e `src/modules/README.md`). Link público com TTL contado a partir da 1ª
 * abertura (docs/plano/09 e 30):
 *
 *   POST   /share          cria link (token)        share:create
 *   DELETE /share/:id       revoga (dono/admin)      requireAuth + ownership
 *   GET    /public/:token   abre o link             SEM AUTH (guard por token)
 *
 * ISOLAMENTO DE AUTENTICAÇÃO (crítico): a superfície autenticada `/share/*` e a
 * rota PÚBLICA `/public/:token` são registradas em escopos Fastify SEPARADOS.
 * O plugin `auth` é registrado SOMENTE no escopo autenticado — a rota pública
 * vive num escopo irmão que nunca o registra, garantindo que `GET /public/:token`
 * funcione sem header `Authorization`. RBAC/ownership reutilizam os helpers
 * COMPARTILHADOS da T-B1 (`@/lib/rbac` + `@/middlewares/rbac`).
 */
const shareModule: FastifyPluginAsync = async (app) => {
  // Superfície AUTENTICADA: /share/* (auth + RBAC).
  await app.register(async (authed) => {
    await authed.register(auth);
    await createShareRoute(authed);
    await deleteShareRoute(authed);
  });

  // Superfície PÚBLICA: /public/:token — escopo SEM auth.
  await app.register(async (publicScope) => {
    await publicGetRoute(publicScope);
  });
};

export default shareModule;

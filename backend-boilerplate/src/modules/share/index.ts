import type { FastifyPluginAsync } from 'fastify';
import { auth } from '@/middlewares/auth';
import { createShareRoute } from './routes/create-share';
import { deleteShareRoute } from './routes/delete-share';
import { publicGetDataRoute } from './routes/public-get-data';
import { publicGetRoute } from './routes/public-get';

/**
 * Módulo `share` — TRILHA T-B (task T-B4).
 *
 * Plugin auto-descoberto por `@fastify/autoload` (ver `src/http/modules-loader.ts`
 * e `src/modules/README.md`). Link público com TTL contado a partir da 1ª
 * abertura (docs/plano/09 e 30):
 *
 *   POST   /share                cria link (token)        share:create
 *   DELETE /share/:id             revoga (dono/admin)      requireAuth + ownership
 *   GET    /public/:token         abre o link             SEM AUTH (guard por token)
 *   GET    /public/:token/data    snapshot de dados (T-G1) SEM AUTH
 *
 * ISOLAMENTO DE AUTENTICAÇÃO (crítico): a superfície autenticada `/share/*` e as
 * rotas PÚBLICAS `/public/:token*` são registradas em escopos Fastify SEPARADOS.
 * O plugin `auth` é registrado SOMENTE no escopo autenticado — as rotas públicas
 * vivem num escopo irmão que nunca o registra, garantindo que `GET /public/*`
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

  // Superfície PÚBLICA: /public/:token* — escopo SEM auth.
  await app.register(async (publicScope) => {
    await publicGetRoute(publicScope);
    await publicGetDataRoute(publicScope);
  });
};

export default shareModule;

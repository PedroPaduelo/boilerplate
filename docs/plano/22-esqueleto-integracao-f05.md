# 22 — Esqueleto de integração (F0.5): pontos de extensão do fan-out

> Status: ENTREGUE (F0.5, última task da Fase 0). Fixa as fronteiras de plug-in
> para o fan-out paralelo (T-A..T-J). Fonte da verdade dos detalhes: docs 21/31/32.
> READMEs vivos: `backend-boilerplate/src/modules/README.md` e
> `frontend-boilerplate/src/app/README.md`.

## Regra de ouro

`server.ts` (BE) e `app/providers.tsx` + `app/routes.tsx` (FE) são **território
FECHADO** da Fase 0. Nenhuma trilha edita esses arquivos. Tudo o mais é plug-in
por **pasta/convenção + auto-descoberta** (sem índice central editado à mão).

## Backend — rotas por AUTO-DISCOVERY (@fastify/autoload)

- `server.ts` só faz `await app.register(registerModules)`
  (`src/http/modules-loader.ts`). Fechado.
- Cada módulo = `src/modules/<modulo>/index.ts` com
  `export default` de um `FastifyPluginAsync`. O autoload registra sozinho.
- Convenção: só `index.*` é plugin (`indexPattern`); `routes/*.ts`, `service.ts`
  etc. são importados pelo `index.ts`. Sem prefixo automático
  (`dirNameRoutePrefix:false`) — cada plugin declara paths absolutos.
- Build: `tsup` emite `dist/modules/*/index.js` (glob no `entry`), então o
  autoload acha os módulos tanto em dev (`src`) quanto no build (`dist`).
- Módulos criados (esqueleto, com rota marcador `/<modulo>/_status` + tag Swagger):

  | Pasta | Trilha | | Pasta | Trilha |
  |---|---|---|---|---|
  | `connections` | T-A | | `share` | T-B |
  | `departments` | T-B | | `export` | T-J |
  | `charts` | T-B | | `catalog` | T-I/T-D |
  | `dashboards` | T-B | | `mcp` | T-D |
  | `data` | T-C | | | |

- Socket.IO: handshake já autentica via JWT (`middlewares/auth-socket.ts`).
  Salas por dashboard em `src/socket/events/dashboard-room.ts`
  (`dashboard:join`/`dashboard:leave` → sala `dashboardRoom(id)` dos contratos).
  T-C emite com `socketManager.sendToRoom(dashboardRoom(id), SOCKET_EVENTS.X, payload)`.

> O que cada trilha BE faz: cria/edita só a sua pasta `src/modules/<modulo>/`.

## Frontend — providers + rotas por feature (glob)

- `app/providers.tsx` (`AppProviders`): ErrorBoundary → Theme → QueryClient →
  Auth → Socket → children (+ Toaster). Fechado. Consuma via hooks.
- `app/routes.tsx`: casca (auth + `DashboardLayout` protegido + fallback) +
  agregação automática via `collectFeatureRoutes()`
  (`import.meta.glob('../../features/*/routes.tsx')`). Fechado.
- Cada feature = `src/features/<feature>/routes.tsx` exportando
  `export const featureRoutes: FeatureRoutes = { protected?, public? }`.
- Data layer: `queryClient` único (`shared/lib/query-client.ts`); socket em
  `shared/socket` (`useSocket()` → `getSocket`/`joinDashboard`/`leaveDashboard`/
  `connected`), tipado por `ServerToClientEvents`/`SOCKET_EVENTS` dos contratos.
- Auth: store persiste só o token; `AuthProvider` re-hidrata o `user` via
  `GET /auth/me`; `ProtectedRoute` espera o user (loading) em vez de redirecionar.
- Rotas-esqueleto navegáveis hoje: `/dashboards`, `/dashboards/:id`,
  `/dashboards/:id/edit`, `/charts`, `/charts/:id`, `/connections`, `/chat`,
  `/users` (real), `/public/:token` (público). Placeholders → trilhas substituem.

> O que cada trilha FE faz: cria/edita só a sua `src/features/<feature>/`
> (incluindo o `routes.tsx`); ajusta `NAV` em `app/app-sidebar.tsx` se quiser menu.

## Validação executada (F0.5)

- BE: `npm run build` (tsup) verde; `jest` 7 suites verdes (inclui
  `tests/modules-loader.test.ts` provando auto-discovery via `inject`);
  servidor sobe, `/health` responde, Swagger lista todos os grupos; probe de
  pasta nova auto-registrada confirmado e removido. Typecheck: só os 3 erros
  PRÉ-EXISTENTES do boilerplate (não pioraram).
- FE: `npm run build` (tsc+vite) verde; `vitest` 7 arquivos / 20 testes verdes
  (providers montam, glob de rotas, router); smoke no browser: login, rota real
  `/users` (lazy) e rotas-esqueleto renderizam; reload direto em rota protegida
  não cai mais em /login.

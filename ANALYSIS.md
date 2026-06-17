# Análise Comparativa BE ↔ FE

Data: jun/2026 · Escopo: `backend-boilerplate/` vs `frontend-boilerplate/` · Read-only

---

## TL;DR

- **Backend está pronto como scaffold**: Fastify 5 + Prisma + Redis + BullMQ + Socket.IO, RBAC com `role` no JWT, graceful shutdown, Helmet, rate-limit, CORS, Pino com redaction, Docker non-root. Estrutura enxuta (auth + users CRUD).
- **Frontend tem contratos quebrados com o backend**: `features/users/` usa **mock data** (não chama a API real), com tipos que **não batem** (`role: 'admin'|'user'|'editor'` vs BE `'ADMIN'|'USER'`; `status` vs `isActive`; `limit` vs `pageSize`). A feature `auth` está corretamente conectada ao BE.
- **ProtectedRoute injeta usuário mock** (`demo@teste.com`, role `ADMIN`) sem validar token. É um fallback que deve ser removido.
- **Husky diverge**: FE usa `scripts/setup-husky.mjs` (caminho absoluto, funciona em monorepo); BE usa `prepare: husky` (caminho relativo `.husky/_`, **quebra em subpasta de monorepo**).
- **Sem pacote shared/**: tipos duplicados entre BE e FE (`User`, `AuthResponse`, `UserRole`) com divergências. Zod v3 (BE) vs v4 (FE) — schemas incompatíveis.
- **Sem Dockerfile no FE** e sem `.dockerignore` no FE. Apenas `static-server.cjs` (HTTP cru sem SPA fallback adequado para produção).

---

## 1. Tooling & DX

| Aspecto | BE (`backend-boilerplate/`) | FE (`frontend-boilerplate/`) | Bate? |
|---|---|---|---|
| **ESLint** | Flat config v9 `.mjs` — `js.recommended` + `tseslint.recommended` + `globals.node` + `prettier` por último | Flat config v9 `.js` — `js.recommended` + `tseslint.recommended` + `globals.browser` + `react-hooks` + `react-refresh` + `prettier` | ✅ Mesmo padrão |
| **Prettier** | `.prettierrc.json` (semi, singleQuote, 90 cols, trailingComma all, LF) | `.prettierrc.json` **idêntico** | ✅ Idêntico |
| **Husky** | `prepare: "husky"` → `.husky/_` (caminho **relativo**) | `prepare: "node scripts/setup-husky.mjs"` → `.husky-run/_` (caminho **absoluto**) | ❌ **Diverge** — BE quebra em monorepo |
| **lint-staged** | `15.2.10` — `*.{ts,tsx,js,cjs,mjs}` → eslint+prettier; `*.{json,md}` → prettier | `15.2.10` — **idêntico** | ✅ Idêntico |
| **commitlint** | `19.6.0` + `config-conventional`, type-enum idêntico (11 tipos) | `19.6.0` + **mesmas regras** | ✅ Idêntico |
| **TypeScript** | `~5.9.3`, `target: es2022`, `module: node16`, `strict: true`, `paths: @/*` | `~5.9.3`, `target: ES2022`, `module: ESNext`, `strict: true`, `paths: @/*` | ✅ Compatível (diferença esperada BE/FE) |
| **Test runner** | Jest 30 + `ts-jest` (CJS mode), `testMatch: **/*.test.ts` | Vitest 4 + jsdom + `@testing-library/react` | ❌ Diferentes (aceitável, mas sem padronização) |
| **Test count** | 1 arquivo: `tests/unit/password-schema.test.ts` (4 testes) | 2 arquivos: `utils.test.ts` (5 testes) + `use-local-storage.test.ts` (4 testes) | — |
| **Build** | `tsup` (CJS, `target: node20`, sourcemap) | `tsc -b && vite build` | ✅ Adequado a cada stack |
| **CI** | `.github/workflows/backend-ci.yml` — install + prisma generate + lint + typecheck + test + build; escopo path; node 20; concurrency cancel | `.github/workflows/frontend-ci.yml` — install + lint + typecheck + test + build; escopo path; node 20; concurrency cancel | ✅ Mesma estrutura |
| **Scripts npm** | `dev, build, start, test, typecheck, lint, lint:fix, format, format:check, db:*, service:up/down` | `dev, build, lint, test, typecheck, format, preview` | ✅ Adequado (BE tem mais por ter DB) |

**Veredito**: Tooling é o ponto mais forte — ESLint/Prettier/commitlint/CI batem 100%. Dois gaps: (1) Husky BE precisa portar a solução do FE; (2) test runner divergente é aceitável mas impede sharing de matchers/config.

---

## 2. Runtime & env

| Aspecto | BE | FE | Bate? |
|---|---|---|---|
| **Porta dev** | `4000` (`env.ts` default, Dockerfile `ENV PORT=4000`, `.env.example`) | `5173` (`vite.config.ts` server.port) | ✅ |
| **`.env.example`** | Completo: `NODE_ENV, PORT, BASE_URL, JWT_SECRET, DATABASE_URL, REDIS_URL, REDIS_PASSWORD, REDIS_PORT, CORS_ORIGINS, SWAGGER_USER, SWAGGER_PASSWORD, UPLOAD_DIR, MAX_FILE_SIZE, UPLOAD_TIMEOUT` | Mínimo: apenas `VITE_API_URL=http://localhost:4000` | ⚠️ FE poderia documentar `VITE_ALLOWED_HOSTS` |
| **`.env` versionado?** | Não (`.gitignore` cobre `.env`, `.env.local`, `.env.*.local`) | Não (`.gitignore` cobre `.env`, `.env.*`, `!.env.example`) | ✅ |
| **Validação env** | Zod em `src/lib/env.ts` — fail-fast com `safeParse`, mensagem legível | Zod em `src/shared/lib/env.ts` — fail-fast com `safeParse`, fallback para `localhost:4000` em dev | ✅ Ambos validam |
| **CORS** | BE: origens de `CORS_ORIGINS` (comma-separated), fallback `localhost:5173,4000` em dev | FE: `VITE_API_URL` aponta para BE | ✅ |
| **LOG_LEVEL** | `env.ts` (fatal/error/warn/info/debug/trace/silent) | N/A (browser) | — |

**Veredito**: Runtime bate. BE porta 4000 ↔ FE porta 5173 ↔ `VITE_API_URL` ↔ `CORS_ORIGINS`. Tudo consistente.

---

## 3. Auth & RBAC

| Aspecto | BE | FE | Bate? |
|---|---|---|---|
| **JWT payload** | `{ sub: user.id, role: user.role }` assinado em `authenticate.ts:58` e `register.ts:55` (`expiresIn: '1h'`) | — | — |
| **Role enum** | `enum UserRole { ADMIN, USER }` (`schema.prisma:34`) — valores `ADMIN`/`USER` (maiusculos) | `features/auth/types.ts`: `role: 'ADMIN' \| 'USER'` ✅; `features/users/types.ts`: `role: 'admin' \| 'user' \| 'editor'` ❌ | ❌ features/users diverge |
| **RBAC** | `request.requireRole('ADMIN')` em create/list/get/update/delete de users (`auth.ts:44`) | Não há checagem de role no FE — qualquer usuário autenticado vê `/users` | ⚠️ Gap |
| **Auth middleware** | Plugin Fastify (`auth.ts`) — adiciona `getCurrentUserId()`, `getCurrentUserRole()`, `requireRole()` ao `FastifyRequest` | — | — |
| **Token store** | — | Zustand `persist` (`store.ts`) — partializa apenas `token`, chave `auth`. `isHydrated` controla gates | ✅ Fonte unica |
| **api-client** | — | `api-client.ts` — interceptor injeta `Bearer token` do store; 401 → `logout()` + redirect `/login` | ✅ |
| **ProtectedRoute** | — | `protected-route.tsx` — injeta **usuário mock** se `user` for null (demo fallback) | ❌ Deve remover |
| **Password policy** | `passwordSchema` (`password.ts`): min 8 + 1 letra + 1 número. Aplicada em register/create-user/update-user. Login lenient (min 6). | FE register form: `z.string().min(6)` — **não segue a policy** | ❌ Diverge |
| **Login response** | `{ token, user: { id, name, email } }` — **sem `role`** | FE espera `AuthResponse = { user: User (com role, isActive, etc), token }` | ❌ Response não inclui role/isActive |
| **getMe** | Retorna `{ id, name, email, role, isActive, createdAt }` | `useCurrentUser()` chama `/auth/me` e faz `setUser(user)` | ✅ Mas `User` FE tem `updatedAt` que getMe não retorna |
| **Socket auth** | `auth-socket.ts` — verifica JWT, extrai `sub` (não extrai `role`) | `socket.io-client` no package.json mas **não usado em código** | ⚠️ |

**Veredito**: Auth está **quase certa** no fluxo login→token→store→api-client. **Gaps críticos**:

1. **Login/register response não inclui `role`**: BE retorna `{ id, name, email }` mas FE `AuthResponse.User` espera `role, isActive, createdAt, updatedAt`. O FE só obteria role via `getMe()` (que também não retorna `updatedAt`).
2. **`features/users/` tem tipos completamente divergentes**: `role: 'admin'|'user'|'editor'` (lowercase + `editor` que não existe no BE), `status: 'active'|'inactive'` (não existe no BE — BE usa `isActive: boolean`).
3. **ProtectedRoute mocka usuário** — segurança fraca para um boilerplate.

---

## 4. Contrato de erro

| Aspecto | BE | FE | Bate? |
|---|---|---|---|
| **Error handler** | `error-handler.ts` — handler Fastify custom. Mapeia: ZodFastifySchema → 400 `{ message, errors: [{message, path}] }`; ZodError → 422 `{ error: { code, message } }`; BadRequest → 400 `{ message }`; Unauthorized → 401 `{ message }`; Forbidden → 403 `{ message }`; NotFound → 404 `{ message }`; fallback → 500 `{ message: 'Internal server error' }` | — | — |
| **Error format** | 3 formatos diferentes: `{ message }` (custom), `{ message, errors: [...] }` (Zod schema), `{ error: { code, message } }` (ZodError) | `ApiError` (`shared/types/common.ts`): `{ message, code?, details? }` | ❌ Não bate |
| **401 handling** | BE lança `UnauthorizedError` → 401 `{ message }` | FE: interceptor 401 → logout + redirect | ✅ Funciona mas não parseia `message` |
| **Error display** | — | FE: hooks fazem `toast.error('msg genérica')` (ex: "Email ou senha invalidos") — não usa `error.response.data.message` do BE | ❌ Mensagem do BE é ignorada |
| **Validation errors** | BE Zod schema → `{ message: 'Validation error', errors: [{message, path}] }` | FE usa `react-hook-form` + `zodResolver` — valida no cliente antes de enviar. Não parseia erros de validação do BE. | ⚠️ Dupla validação (ok) mas erros do BE não são exibidos |

**Veredito**: Contrato de erro **diverge**. O BE tem 3 formatos de erro diferentes; o FE tem tipo `ApiError` que não corresponde a nenhum deles. Hooks do FE mostram mensagens hardcoded ao invés de usar `error.response.data.message`. Recomendado padronizar BE em `{ message: string, errors?: Array<{message, path}> }` e FE consumir `error.response.data.message`.

---

## 5. Tipagem compartilhada

| Aspecto | Estado |
|---|---|
| **Pacote `shared/`** | ❌ **Não existe**. Sem `packages/`, sem `shared/` na raiz |
| **User type** | Duplicado **3 vezes**: BE Zod schemas (auth/register, auth/get-me, user/*), FE `features/auth/types.ts`, FE `features/users/types.ts` — **nenhum bate com os outros** |
| **AuthResponse** | FE define `{ user: User, token: string }` mas BE login retorna `{ token, user: { id, name, email } }` (sem role, isActive, etc.) |
| **Pagination** | BE: `{ users, total, page, pageSize, totalPages }`; FE: `{ users, total, page, limit, totalPages }` — `pageSize` vs `limit` |
| **Role enum** | BE: `ADMIN/USER`; FE auth: `ADMIN/USER`; FE users: `admin/user/editor` |
| **Zod version** | BE: `^3.25.76`; FE: `^4.3.6` — APIs diferentes, schemas incompatíveis |
| **Date serialization** | BE usa `z.date()` (serializa para ISO string via Fastify); FE declara `createdAt: string` — compatível em runtime mas sem shared type |

**Veredito**: **Sem tipagem compartilhada é o gap arquitetural mais significativo.** Tipos duplicados com divergências (role, pagination, status/isActive) garantem bugs. Recomendado criar `packages/shared-types/` com `User`, `AuthResponse`, `PaginatedResponse`, `UserRole` exportados, ou pelo menos alinhar manualmente.

---

## 6. Estrutura / arquitetura

| Aspecto | BE | FE |
|---|---|---|
| **Padrão** | Rotas Fastify como plugins (`app.register(route)`) — 1 arquivo por rota, organizado por domínio (`routes/auth/`, `routes/user/`, `routes/health/`) | FSD: `src/app` + `src/features/<domínio>` + `src/shared` |
| **Camadas** | `http/routes/` (controllers) → `middlewares/` → `lib/` (prisma, redis, env, validators) → `services/jobs/` (BullMQ) → `socket/` | `app/` (main, routes, layout, error-boundary) → `features/auth/` (api, store, hooks, components, types) → `features/users/` (idem) → `shared/components/ui/` (shadcn), `shared/lib/`, `shared/hooks/` |
| **shadcn/ui** | N/A | 31 componentes em `shared/components/ui/` (button, card, dialog, table, select, etc.) |
| **State** | N/A | Zustand (auth) + React Query (server state) |
| **Nomenclatura** | kebab-case para arquivos (`create-user.ts`, `error-handler.ts`) | kebab-case para arquivos (`login-form.tsx`, `api-client.ts`) |
| **Erros custom** | `src/http/routes/_errors/` (BadRequestError, UnauthorizedError, etc.) | N/A (usa try/catch + toast) |

**Veredito**: Estrutura **consistente e bem organizada**. BE segue o padrão Fastify de rotas-plugin; FE segue FSD corretamente. Ambos enxutos (auth + users). Convenções de nomenclatura batem.

---

## 7. Demos / exemplos

| Aspecto | BE | FE |
|---|---|---|
| **Escopo** | ✅ Enxuto — auth (login/register/me) + users CRUD + health | ⚠️ auth integrado com BE; users **mockado** |
| **Resíduos demo** | ✅ Limpo — sem posts, dashboard, settings, showcase | ✅ Limpo — sem resíduos |
| **Mock data** | N/A | ❌ `features/users/api.ts` — 100% mock: `generateMockUsers()`, `delay()`, in-memory array. **Não chama a API real.** |
| **BullMQ/Redis/Socket.IO** | Infra presente (queues, workers, socket manager) mas com "example" queues/workers — apropriado para boilerplate | `socket.io-client` instalado mas **não importado em nenhum arquivo** |

**Veredito**: BE está limpo. FE tem **2 problemas**: (1) `features/users/` é puramente mock — não serve como exemplo de integração BE↔FE; (2) `socket.io-client` instalado sem uso.

---

## 8. Docker / deploy

| Aspecto | BE | FE | Bate? |
|---|---|---|---|
| **Dockerfile** | ✅ Multi-stage: builder (node:20-alpine, npm ci, prisma generate, tsup build) → production (npm ci --omit=dev, prisma generate, `USER node`, HEALTHCHECK na porta 4000) | ❌ **Ausente** | ❌ |
| **.dockerignore** | ✅ Completo: `node_modules, dist, .env*, .git, coverage, uploads, tests, *.md, .github/` | ❌ **Ausente** | ❌ |
| **docker-compose** | ✅ `docker-compose.yml` — postgres:16-alpine + redis:7-alpine, healthchecks, dev-only creds documentadas | ❌ **Ausente** | — |
| **Serve produção** | `node dist/server.js` | `static-server.cjs` (HTTP cru, porta 4002 default, SPA fallback via catch-all) | ⚠️ Funcional mas sem gzip, sem TLS, sem CDN |
| **Non-root** | ✅ `USER node` após `chown -R node:node /app` | ❌ Sem Dockerfile | — |
| **Healthcheck** | ✅ `GET /health` | ❌ | — |

**Veredito**: BE está pronto para container. FE **não tem Dockerfile** nem `.dockerignore` — gap para deploy. O `static-server.cjs` é um fallback básico (sem gzip/compression). Recomendado: Dockerfile multi-stage FE (`node:20-alpine` builder + `nginx:alpine` para servir `dist/`).

---

## 9. Segurança

| Checklist | BE | FE |
|---|---|---|
| **CORS** | ✅ `@fastify/cors` — origins de `CORS_ORIGINS`, credentials, methods restritos | N/A (browser client) |
| **Helmet** | ✅ `@fastify/helmet` — CSP, HSTS (1y + preload), frameguard deny, dnsPrefetchControl off | N/A |
| **Rate limit** | ✅ `@fastify/rate-limit` — 100 req/min por IP | N/A |
| **Pino redaction** | ✅ `authorization`, `cookie` (6 variações de path), `censor: '[REDACTED]'` | N/A |
| **Graceful shutdown** | ✅ SIGTERM/SIGINT → Socket.IO → Fastify → workers → queues → Prisma. Timeout 15s. | N/A |
| **Secrets hardcoded** | ✅ Nenhum — JWT_SECRET validado (min 32 chars), DATABASE_URL required | ✅ Nenhum |
| **Password hashing** | ✅ `bcryptjs` (salt rounds 10) | N/A |
| **JWT expiry** | ✅ `expiresIn: '1h'` | — |
| **Swagger protection** | ✅ `@fastify/basic-auth` opcional via `SWAGGER_USER`/`SWAGGER_PASSWORD` | — |
| **ProtectedRoute** | — | ⚠️ Injeta usuário mock se `user` null — bypass de auth em demo |
| **Token persist** | — | ✅ Zustand persist, apenas `token` (não persiste `user`) |
| **401 auto-logout** | — | ✅ Interceptor faz logout + redirect |
| **Docker non-root** | ✅ `USER node` | ❌ Sem Dockerfile |

**Veredito**: BE tem checklist de segurança **completo**. FE tem 1 gap: o `ProtectedRoute` com usuário mock.

---

## 10. Gaps priorizados

### 1. 🔴 `features/users/` 100% mock — não integra com a API real
- **Onde**: `frontend-boilerplate/src/features/users/api.ts` (todo o arquivo, ~170 linhas de mock)
- **O que é**: Gera 20 usuários fake, simula delay, CRUD em memória. Tipos `UserRole = 'admin'|'user'|'editor'` e `UserStatus = 'active'|'inactive'` não existem no BE.
- **Esforço**: **M** — reescrever `api.ts` para usar `apiClient` (como `auth/api.ts` faz), alinhar tipos com BE, ajustar componentes para `isActive`/`ADMIN`/`pageSize`.
- **Risco**: **M** — boilerplate não cumpre sua função de modelo de integração.

### 2. 🔴 Tipos duplicados e divergentes entre BE e FE
- **Onde**: `features/auth/types.ts`, `features/users/types.ts`, BE Zod schemas em cada rota
- **O que é**: `User` definido 3+ vezes com campos/valores diferentes. `UsersResponse` tem `limit` (FE) vs `pageSize` (BE). `role` é `ADMIN/USER` (BE + auth FE) vs `admin/user/editor` (users FE).
- **Esforço**: **M** — alinhar manualmente ou criar `packages/shared-types/`.
- **Risco**: **M** — garante bugs de runtime quando FE users for integrado.

### 3. 🟡 Login/register response não inclui `role`
- **Onde**: `backend-boilerplate/src/http/routes/auth/authenticate.ts:63-67`, `register.ts:60-63`
- **O que é**: Response schema do login retorna `{ id, name, email }` — sem `role`/`isActive`. FE `AuthResponse.User` espera `role, isActive, createdAt, updatedAt`. FE só obteria `role` via `getMe()`.
- **Esforço**: **S** — adicionar `role` (e opcionalmente `isActive`) ao response schema de login/register.
- **Risco**: **S** — FE funciona parcialmente (via getMe), mas tem window onde `user.role` é undefined.

### 4. 🟡 Husky BE quebra em monorepo
- **Onde**: `backend-boilerplate/package.json` → `prepare: "husky"` (caminho relativo `.husky/_`)
- **O que é**: `core.hooksPath=.husky/_` resolve contra o toplevel do git (monorepo root), não contra a subpasta. Hooks não disparam.
- **Esforço**: **S** — portar `scripts/setup-husky.mjs` do FE para o BE.
- **Risco**: **S** — apenas afeta DX de commits locais.

### 5. 🟡 ProtectedRoute injeta usuário mock
- **Onde**: `frontend-boilerplate/src/features/auth/components/protected-route.tsx:35-44`
- **O que é**: Se `user` é null após hidratação, injeta `{ id: '1', name: 'Usuario Demo', role: 'ADMIN', ... }`. Qualquer um com token (mockado ou não) vira admin.
- **Esforço**: **S** — remover bloco mock; deixar apenas `if (!token) redirect('/login')`.
- **Risco**: **M** — falsa sensação de RBAC no FE.

### 6. 🟡 FE sem Dockerfile
- **Onde**: `frontend-boilerplate/` (ausência total)
- **O que é**: Sem Dockerfile, sem `.dockerignore`. Apenas `static-server.cjs` (porta 4002, sem gzip/TLS).
- **Esforço**: **S** — Dockerfile multi-stage (builder + nginx:alpine servindo `dist/`).
- **Risco**: **S** — bloqueia deploy containerizado.

### 7. 🟢 Contrato de erro inconsistente
- **Onde**: `backend-boilerplate/src/http/error-handler.ts` (3 formatos), `frontend-boilerplate/src/shared/types/common.ts` (`ApiError` não usado)
- **O que é**: BE retorna `{ message }` para custom, `{ message, errors: [...] }` para Zod schema, `{ error: { code, message } }` para ZodError. FE ignora a mensagem do BE.
- **Esforço**: **S** — padronizar BE em `{ message, errors? }` e FE usar `error.response.data.message`.
- **Risco**: **S** — UX ruim (mensagem genérica ao invés da específica do BE).

### 8. 🟢 Zod v3 (BE) vs v4 (FE)
- **Onde**: `backend-boilerplate/package.json` (`zod: ^3.25.76`), `frontend-boilerplate/package.json` (`zod: ^4.3.6`)
- **O que é**: APIs diferentes; schemas não podem ser compartilhados entre BE e FE.
- **Esforço**: **M** — migrar BE para v4 (ou alinhar ambos em v3).
- **Risco**: **S** — sem shared schemas, mas cada lado funciona isoladamente.

### 9. 🟢 Password validation diverge (FE register: min 6 vs BE: min 8 + letra + número)
- **Onde**: `frontend-boilerplate/src/features/auth/components/register-form.tsx:12` (`z.string().min(6)`)
- **O que é**: FE aceita senhas que o BE rejeitará (se a policy fosse aplicada no register — atualmente register BE usa `passwordSchema` com min 8).
- **Esforço**: **S** — importar/compartilhar `passwordSchema` ou replicar as regras.
- **Risco**: **S** — usuário preenche form, envia, recebe erro 422.

---

## 11. Recomendações

Em ordem de prioridade:

1. **Integrar `features/users/` com a API real** — substituir mock por chamadas via `apiClient`. Alinhar tipos: `role: 'ADMIN'|'USER'`, remover `status`/`editor`, usar `isActive: boolean`, `pageSize` no lugar de `limit`. [Esforço M]

2. **Remover usuário mock do `ProtectedRoute`** — deixar apenas `if (!token) → redirect('/login')`. O usuário deve vir de `getMe()` (já implementado em `useCurrentUser`). [Esforço S]

3. **Adicionar `role` ao response de login/register** no BE — pelo menos `role: z.string()` no response schema e `role: user.role` no payload. Permite ao FE saber o role imediatamente após login. [Esforço S]

4. **Portar `scripts/setup-husky.mjs` do FE para o BE** — resolver o bug de Husky em monorepo. Trocar `prepare: "husky"` por `prepare: "node scripts/setup-husky.mjs"`. [Esforço S]

5. **Criar Dockerfile + `.dockerignore` no FE** — multi-stage com `nginx:alpine` servindo `dist/` com gzip e SPA fallback. [Esforço S]

6. **Padronizar contrato de erro** — BE: unificar em `{ message: string, errors?: Array<{ message: string, path: string }> }`. FE: usar `error.response?.data?.message` nos hooks em vez de mensagens hardcoded. [Esforço S]

7. **Criar `packages/shared-types/`** (ou pelo menos alinhar tipos manualmente) — `User`, `UserRole`, `AuthResponse`, `PaginatedResponse` compartilhados entre BE e FE. [Esforço M]

8. **Sincronizar password validation** — FE register form deve usar a mesma policy do BE (min 8 + letra + número). [Esforço S]

9. **Alinhar versão do Zod** — migrar BE para v4 ou ambos para a mesma major. Necessário para shared schemas. [Esforço M]

10. **Avaliar remoção de `socket.io-client`** do FE ou implementar uso mínimo (conexão + evento de exemplo). Atualmente é dependência órfã. [Esforço S]

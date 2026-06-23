# Exploração: Gestão de Usuários (CRUD admin) — front vs back

> Pergunta: Mapear o estado atual do front (tela, data-fetching, auth) e o contrato
> completo das rotas `user/*` e `auth/*` do back, com paths e linhas exatas, para
> implementar gestão completa de usuários no front conectada à API real.
> Data: 2026-06-22 15:30 · Stack: Vite/React 19 + TanStack Query + axios + zustand
> (front) · Fastify + Zod + Prisma + JWT (back)

## Resposta direta

A tela existe, está renderizando com **dados 100% MOCKADOS** (in-memory) — `features/users/api.ts` é uma `let mockUsers` gerada por `Math.random` com emails `@exemplo.com`, e a UI já consome `useUsers`/`useUserStats` (TanStack Query) só que apontando pro mock. O backend já tem **todas as 5 rotas REST prontas**, protegidas por JWT + `requireRole('ADMIN')`, mas o front está com **drift grave de modelo**: o back usa `role: 'ADMIN'|'USER'` + `isActive: boolean`, o front usa `role: 'admin'|'user'|'editor'` + `status: 'active'|'inactive'` + tipo `editor` que **não existe** no DB. Outro gap relevante: `components/ui/` **não tem** `Dialog`, `Select`, `Checkbox`, `Label`, `Textarea`, `Switch`, `AlertDialog` (apesar das deps Radix instaladas no `package.json` — vão precisar ser geradas pra montar os modais de create/edit/delete).

---

## 1. Tela "Gestão de pessoas / Usuários"

### Onde está
- **Componente da página**: `frontend-boilerplate/src/features/users/index.tsx:101` — `UsersPage`
- **Hook de dados (UI)**: `frontend-boilerplate/src/features/users/hooks/use-users.ts` — `useUsers` (linha 20), `useUserStats` (linha 36), `useCreateUser` (linha 41), `useUpdateUser` (linha 56), `useDeleteUser` (linha 70), `useBulkDeleteUsers` (linha 81), `useBulkUpdateStatus` (linha 92)
- **Camada de dados (MOCK)**: `frontend-boilerplate/src/features/users/api.ts` — `usersApi`
- **Tipos do front**: `frontend-boilerplate/src/features/users/types.ts`

### Como está hoje (dados MOCKADOS)
- `features/users/api.ts:64` — `let mockUsers = generateMockUsers();` (mutável em memória, perdido em reload)
- `features/users/api.ts:16-22` — arrays `firstNames`/`lastNames` (gerador com 23+14 nomes)
- `features/users/api.ts:25-26` — `roles: Array<'admin'|'user'|'editor'>` e `statuses: Array<'active'|'inactive'>`
- `features/users/api.ts:30-60` — loop de 20 usuários fake: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@exemplo.com`, `id: \`user-${i}\``, `createdAt` random no último ano, com deduplicação de email via `Set` (linha 39-43)
- `usersApi.getUsers` (`api.ts:80-117`) — filtra/sorta em memória, devolve `{users, total, page, limit, totalPages}`
- `usersApi.getStats` (`api.ts:120-128`) — conta totais a partir do array
- Há `delay(ms)` simulando latência (linha 67) — qualquer chamada leva 200–600ms

### Como a UI consome hoje
- `UsersPage` (`index.tsx:106-107`): `useUsers({search: debounced, limit: 50})` e `useUserStats()`
- `index.tsx:32-39` — `roleConfig` mapeia `'admin'|'editor'|'user'` → label pt-BR + classes Tailwind. **'editor' não existe no back**
- `index.tsx:41-44` — `statusConfig` mapeia `'active'|'inactive'`
- KPIs renderizados em `index.tsx:118-129` com `KpiCard` — labels: "Total de usuários", "Ativos", "Inativos", "Admins"
- Tabela em `index.tsx:151-205` — colunas: **Usuário** (nome+email), **Função** (badge), **Status** (badge), **Criado em** (formatDate pt-BR). Filtro de busca com `useDebounce(300ms)` (linha 108)

### Drift front × back (CRÍTICO — vai precisar resolver)
| Campo | Front (`users/types.ts`) | Back (DB + rotas) |
|---|---|---|
| `role` | `'admin'\|'user'\|'editor'` (minúsculo, com editor) | enum Prisma `UserRole { ADMIN, USER }` (maiúsculo, sem editor) |
| status | `status: 'active'\|'inactive'` | `isActive: boolean` |
| id | `user-${i}` / `user-${Date.now()}` | Prisma `cuid()` |
| `createdAt` | gerado | `@default(now())` |
| senha | não existe no modelo de UI | `password: passwordSchema` (min 8, 1 letra + 1 número) |
| paginação | `page`+`limit` | `page`+`pageSize` (note: nome diferente) |
| filtros | `role`+`status` (strings) | `role` (ADMIN/USER) + `isActive` (boolean) + `search` |

---

## 2. Data-fetching no front

### TanStack Query — configurado
- **QueryClient + Provider**: `frontend-boilerplate/src/app/App.tsx:6-19,26-33`
  - `staleTime: 30s`, `gcTime: 5min`, `retry: 1`, `refetchOnWindowFocus: true`, mutations `retry: 0`
- Hook `useCurrentUser` (`features/auth/hooks/use-auth.ts:39-49`) — usa `['auth', 'me']`, hidrata o store via `setUser`

### API client (axios)
- **Arquivo**: `frontend-boilerplate/src/shared/lib/api-client.ts`
  - `baseURL: env.API_URL` (linha 6-9)
  - Header `Content-Type: application/json`
- **Interceptor de request** (linha 13-20): lê token de `useAuthStore.getState().token` e injeta `Authorization: Bearer <token>` — **fonte única de verdade do token é o store zustand** (não localStorage cru)
- **Interceptor de response** (linha 23-31): em `401` → `logout()` + redirect `window.location.href = '/login'`

### ENV / baseURL
- **Front** `frontend-boilerplate/.env`: `VITE_API_URL=https://boilerplate-be-cmqg5udk.cloud.serendiped.com`
- **Front** `frontend-boilerplate/src/shared/lib/env.ts`: schema zod valida `VITE_API_URL` (URL válida opcional). Fallback `http://localhost:4000` se ausente (warn em dev, erro em prod implícito).

### JWT storage & envio
- **Token fica no store zustand com `persist`** (localStorage chave `'auth'`, só o `token` é persistido via `partialize` — `user` é refeito via `getMe` no boot)
- `api-client.ts:14-18` injeta `Authorization: Bearer <token>` em toda request

---

## 3. Rotas do front + estrutura de pastas

### Estrutura
```
frontend-boilerplate/src/
├── app/            # bootstrap, rotas, layout root
│   ├── App.tsx           # ThemeProvider + QueryClientProvider + RouterProvider
│   ├── main.tsx          # entrypoint; aplica tema antes do render
│   ├── routes.tsx        # createBrowserRouter
│   ├── dashboard-layout.tsx  # layout do app autenticado (sidebar+topbar+<Outlet/>)
│   ├── app-sidebar.tsx   # nav lateral (única rota: /users)
│   ├── error-boundary.tsx
│   └── index.css
├── components/
│   ├── theme/            # ThemeProvider, useTheme, ThemeToggle
│   └── ui/               # "vitrine UI" — barrel em index.ts (ver §4)
├── features/
│   ├── auth/             # store, api, hooks, login/register, components/{login-form,register-form,protected-route}
│   └── users/            # api, hooks, index.tsx (UsersPage), types
└── shared/
    ├── components/       # VAZIO
    ├── hooks/            # useDebounce, useLocalStorage, useProximityHover
    ├── lib/              # api-client.ts, env.ts, utils.ts (cn/formatDate/formatDateTime), constants.ts, springs.ts, font-weight.ts
    └── types/common.ts
```

### Rotas (`app/routes.tsx`)
- `/login` → `LoginPage` (não-lazy, crítico) — linha 22
- `/register` → `RegisterPage` — linha 23
- `/` → `<ProtectedRoute><DashboardLayout/></ProtectedRoute>` — linhas 24-29
  - `/` (index) → `<Navigate to="/users" replace />` — linha 31
  - `/users` → `UsersPage` (lazy) — linhas 32-37
- `*` → `<Navigate to="/users" replace />` — linha 40
- Página importada via `lazy(() => import('@/features/users').then(m => ({default: m.UsersPage})))` — linha 12-14

### Onde a tela está registrada
- Sidebar (única entrada): `frontend-boilerplate/src/app/app-sidebar.tsx:9` — `const NAV = [{id: '/users', label: 'Usuários', icon: UsersIcon}]`
- Topbar título: `frontend-boilerplate/src/app/dashboard-layout.tsx:8-10` — `TITLES['/users'] = 'Usuários'`

---

## 4. Componentes `components/ui/` (Vitrine UI)

**Barrel**: `frontend-boilerplate/src/components/ui/index.ts` (re-exporta tudo).

### O que EXISTE (essenciais pro CRUD)
- `button.tsx` (CVA em `button-variants.ts`)
- `input.tsx`
- `card.tsx` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`)
- `badge.tsx` (CVA em `badge-variants.ts`) — usado nas colunas Função/Status
- `dropdown-menu.tsx` (Radix)
- `tabs.tsx` (Radix)
- `tooltip.tsx` (Radix)
- `separator.tsx` (Radix)
- `avatar.tsx` (Radix)
- `skeleton.tsx` — usado no loading da tabela
- `sonner.tsx` — `<Toaster/>` (toasts já configurados em `App.tsx:31`)
- `kpi-card.tsx`, `stat-tile.tsx`, `section.tsx` (`Section`, `SectionHeader`)
- `table-fluid.tsx` (`TableFluid`, `TableFluidHeader`, `TableFluidBody`, `TableFluidRow`, `TableFluidHead`, `TableFluidCell`) — tabela animada com proximity hover

### O que **NÃO EXISTE** (vai precisar criar pra CRUD)
> Apesar de as deps Radix estarem no `package.json:18-32`, **os wrappers shadcn não foram gerados**.

- ❌ `dialog.tsx` (Radix `@radix-ui/react-dialog` instalado) — sem modal de create/edit
- ❌ `alert-dialog.tsx` (Radix instalado) — sem confirmação de delete
- ❌ `select.tsx` (Radix `@radix-ui/react-select` instalado) — sem select de role/status
- ❌ `checkbox.tsx` (Radix instalado)
- ❌ `switch.tsx` (Radix instalado)
- ❌ `textarea.tsx`
- ❌ `label.tsx` (Radix instalado) — forms do auth estão usando `<label htmlFor>` cru (ver `login-form.tsx:31`)
- ❌ `form.tsx` (wrapper rhf + `<FormField>`) — forms hoje usam `useForm` direto + classes manuais

> Para o CRUD, o implementador terá que **rodar `shadcn add`** (config em `frontend-boilerplate/components.json` já existe) ou escrever os wrappers Radix manualmente.

---

## 5. Fluxo de login/auth no front

### Onde o token é guardado
- **Store zustand com `persist`** → localStorage chave `'auth'`
- `frontend-boilerplate/src/features/auth/store.ts:30-47`:
  - `name: 'auth'` (linha 36)
  - `partialize: (state) => ({ token: state.token })` (linha 37) — **só o token persiste**; `user` é re-hidratado via `/auth/me` no boot
  - `onRehydrateStorage` (linhas 38-40) marca `isHydrated: true`
- `useAuthStore` expõe: `user`, `token`, `isAuthenticated`, `isLoading`, `isHydrated`, `setAuth(user, token)`, `setUser(user)`, `logout()`, `setLoading()`, `setHydrated()`

### Como sabe se está logado / qual role
- **Boot**: `App.tsx` envolve a app em `<ErrorBoundary>` (não protege rotas); rotas protegidas usam `ProtectedRoute`
- **`ProtectedRoute`** (`features/auth/components/protected-route.tsx`):
  - linha 18: se `!isHydrated` → `<Skeleton/>`
  - linha 22: se `!token || !user` → `<Navigate to="/login" state={{from}} replace/>`
  - linha 25-27: se `requiredRole` (prop) e `user.role !== requiredRole` → `<Navigate to="/" replace/>`
- **Auth bootstrap**: `useCurrentUser()` em `features/auth/hooks/use-auth.ts:39-49` — `enabled: !!token`, chama `GET /auth/me` e popula `user` no store
- **Detalhe**: `ProtectedRoute` está em `routes.tsx:26` mas sem `requiredRole` — **a rota `/users` NÃO exige ADMIN no front**; se um USER comum logar, ele cai na tela de listagem e a API vai retornar 403 em `list-users`. Recomendação: passar `requiredRole="ADMIN"` no `routes.tsx:26-28`.

### Login em si
- `LoginForm` (`features/auth/components/login-form.tsx`) — zod schema (email + senha min 6)
- `useLogin` (`features/auth/hooks/use-auth.ts:7-19`):
  - `mutationFn: (input) => authApi.login(input)`
  - `onSuccess`: `setAuth(data.user, data.token)` + toast + `navigate('/users')`

### Auth API do front
`features/auth/api.ts`:
- `POST /auth/login` → `AuthResponse { user, token }`
- `POST /auth/register` → `AuthResponse`
- `GET /auth/me` → `User`

### Tipo `User` (auth)
`features/auth/types.ts:1-8`:
```ts
{ id, email, name: string|null, role: 'ADMIN'|'USER', isActive: boolean, createdAt, updatedAt }
```
**Já está alinhado com o back** (incl. `role: 'ADMIN'|'USER'`) — diferente do tipo de `features/users/types.ts` que tem drift.

---

## 6. Contrato das rotas do BACKEND

> Todas as rotas, exceto `/health`, `/auth/login`, `/auth/register`, exigem JWT.
> Todas as rotas `/users/*` exigem role `'ADMIN'` via `request.requireRole('ADMIN')`.

### Auth — `backend-boilerplate/src/http/routes/auth/`

#### `POST /auth/login` — `authenticate.ts:11-46`
- **JWT**: não exige
- **Body** (zod, linha 17-20): `{ email: string.email(), password: string.min(6) }`
- **Response 200** (linha 21-28): `{ token: string, user: {id, name: string|null, email} }`  ← **não retorna `role`/`isActive`**
- Erros: `BadRequestError('Invalid credentials')` (404-implícito via 400) · `BadRequestError('User account is disabled')` (linha 41)
- Token JWT: `reply.jwtSign({sub: user.id, role: user.role}, {expiresIn: '1h'})` — linha 67

#### `POST /auth/register` — `register.ts:11-49`
- **JWT**: não exige
- **Body** (linha 17-21): `{ name: string.min(1), email: string.email(), password: passwordSchema }` (passwordSchema em `lib/validators/password.ts:14-19` — min 8, 1 letra, 1 número)
- **Response 201** (linha 22-28): `{ token: string, user: {id, name, email} }` ← **não retorna `role`/`isActive`**
- Cria usuário com `role: 'USER'` fixo (linha 42)
- Erro: `BadRequestError('User with same email already exists')`

#### `GET /auth/me` — `get-me.ts:14-52`
- **JWT**: sim (`security: [{bearerAuth:[]}]`, linha 23)
- **Auth middleware**: `app.register(auth)` (linha 18) — popula `request.getCurrentUserId`
- **Response 200** (linha 24-32): `{ id, name, email, role, isActive, createdAt: z.date() }`
- Erro: `NotFoundError('User not found')`

### Users — `backend-boilerplate/src/http/routes/user/`

#### `POST /users` — `create-user.ts:16-58`
- **JWT**: sim · **Role**: `requireRole('ADMIN')` (linha 47)
- **Body** (linha 23-28): `{ name: string.min(1), email: string.email(), password: passwordSchema, role?: 'ADMIN'|'USER' default 'USER' }`
- **Response 201** (linha 29-37): `{ id, name, email, role, isActive, createdAt: z.date() }`
- Hash bcrypt 10 rounds (linha 53). Erro: `BadRequestError('User with same email already exists')`

#### `GET /users` — `list-users.ts:14-89`
- **JWT**: sim · **Role**: `requireRole('ADMIN')` (linha 60)
- **Querystring** (linha 24-30): `{ page?: number (default 1, min 1), pageSize?: number (default 10, max 100), role?: 'ADMIN'|'USER', isActive?: boolean, search?: string }`
- **Response 200** (linha 31-50): `{ users: [{id, name, email, role, isActive, lastLoginAt: Date|null, createdAt: Date}], total: number, page, pageSize, totalPages }`
- Filtros Prisma (linha 62-77): `role` exato, `isActive` exato, `search` em `OR` (name ou email, `mode: 'insensitive'`, `contains` — **não trata `%`/`_` como wildcard, é substring ILIKE nativo do Postgres**)
- Ordena `createdAt: 'desc'` (linha 86)

#### `GET /users/:id` — `get-user.ts:14-58`
- **JWT**: sim · **Role**: `ADMIN` (linha 46)
- **Params** (linha 24-26): `{ id: string }`
- **Response 200** (linha 27-37): `{ id, name, email, role, isActive, lastLoginAt, createdAt, updatedAt }` — **única rota que retorna `updatedAt`**
- Erro: `NotFoundError('User not found')`

#### `PUT /users/:id` — `update-user.ts:17-77`
- **JWT**: sim · **Role**: `ADMIN` (linha 48)
- **Params**: `{ id: string }`
- **Body** (linha 26-32): `{ name?: string.min(1), email?: string.email(), password?: passwordSchema, role?: 'ADMIN'|'USER', isActive?: boolean }` (todos opcionais — partial update)
- **Response 200** (linha 33-41): `{ id, name, email, role, isActive, updatedAt }`
- Erros: `NotFoundError`, `BadRequestError('Email already in use')` se troca email e já existe

#### `DELETE /users/:id` — `delete-user.ts:14-45`
- **JWT**: sim · **Role**: `ADMIN` (linha 36)
- **Params**: `{ id: string }`
- **Response**: `204 No Content` (`z.null()`, linha 27)
- Erro: `NotFoundError('User not found')`

### Modelo Prisma — `backend-boilerplate/prisma/schema.prisma:13-31`
- `User { id cuid, email @unique, name String?, password String, role UserRole @default(USER), isActive Bool @default(true), lastLoginAt DateTime?, createdAt @default(now), updatedAt @updatedAt }`
- `enum UserRole { ADMIN, USER }` (linha 34-37) — **só 2 valores, sem EDITOR**
- Tabela mapeada: `@@map("users")` (linha 30)
- Senha do seed (`prisma/seed.ts`): `demo@example.com` / `demo1234` / role `ADMIN`

### Health — `health-check.ts`
- `GET /health` — `{ status, timestamp, service: 'backend-boilerplate', version: '1.0.0' }` — sem auth

### Erros padronizados — `backend-boilerplate/src/http/error-handler.ts`
- Zod schema validation → `400 { message: 'Validation error', errors: [{message, path}] }` (linha 41-46)
- ZodError solto → `422 { error: { code: 'unprocessable_entity', message } }`
- `BadRequestError` → `400 { message }`
- `UnauthorizedError` → `401 { message }`
- `ForbiddenError` → `403 { message }` ← esperado ao chamar `/users*` sem ser ADMIN
- `NotFoundError` → `404 { message }`
- Genérico → `500 { message: 'Internal server error' }`

---

## 7. Middleware de auth + check de role

**Arquivo**: `backend-boilerplate/src/middlewares/auth.ts`

- `fastifyPlugin(async (app) => { app.addHook('preHandler', ...) })` (linha 25-27)
- **Estende `FastifyRequest`** (linha 12-16) com 3 helpers:
  - `getCurrentUserId()` (linha 32-34) — chama `request.jwtVerify<{sub, role}>()` e retorna `sub`
  - `getCurrentUserRole()` (linha 37-39) — retorna `role ?? 'USER'` (default seguro)
  - `requireRole(...roles: string[])` (linha 41-50) — verifica JWT, compara role; se não bate → `throw new ForbiddenError('You do not have permission to access this resource')`
- Verificação de JWT: `request.jwtVerify()` — token vem do header `Authorization: Bearer ...` (plugin `@fastify/jwt` configurado em `server.ts:208-211` com `secret: env.JWT_SECRET`)
- Erro de JWT → `throw new UnauthorizedError('Invalid or expired token')` (linha 28-31) → vira `401` no error-handler

**Registro no Fastify**: cada rota chama `.register(auth)` na chain do Fastify (ex: `create-user.ts:18`, `get-me.ts:18`, etc.) — isso aplica o `preHandler` globalmente só naquela rota. O JWT já é parseado pelo `@fastify/jwt` automaticamente em qualquer rota que use o helper.

**Re-export**: `middlewares/index.ts:1` — `export { auth } from './auth'` (+ `authenticate` do socket).

---

## Pontos de atenção (gotchas pro implementador)

1. **Drift de modelo front×back é o maior risco**. Antes de plugar a API real, o implementador precisa decidir:
   - **Opção A (recomendada)**: alinhar `features/users/types.ts` ao back (`role: 'ADMIN'|'USER'`, `isActive: boolean`, id `cuid`), matar `editor` da UI. Atualizar `roleConfig` em `features/users/index.tsx:32-39` (remover `editor`, usar maiúsculas). Atualizar `usersKeys`/`useUsers` para usar `pageSize` em vez de `limit`. Atualizar `useUserStats` para bater em endpoint real (não existe hoje — provavelmente precisa de um endpoint `/users/stats` no back OU derivar de `list-users`).
   - **Opção B**: criar adapter no `api.ts` que converte `User → {role, status}` antes de devolver ao hook. Mantém UI intocada mas vira camada de tradução permanente.
2. **Não existe endpoint `/users/stats` no back**. O `useUserStats()` (`features/users/hooks/use-users.ts:36-39`) chama `usersApi.getStats()` mockado. Vai precisar ou: (a) back expor `GET /users/stats`, (b) front calcular a partir de `list-users` (perde precisão em >100), (c) back já retorna `total` no list-users e o front pode usar isso + 1 request sem filtros para os demais. **Recomendo pedir a rota no back.**
3. **`ProtectedRoute` não bloqueia não-ADMIN em `/users`**. `routes.tsx:26-28` não passa `requiredRole`. Se for requisito, adicionar `<ProtectedRoute requiredRole="ADMIN">` no elemento da rota pai ou como wrapper no children.
4. **`/auth/login` e `/auth/register` não retornam `role`/`isActive`** (`authenticate.ts:21-28`, `register.ts:22-28`). O tipo `AuthResponse` em `features/auth/types.ts:15-18` declara `user.role` — vai quebrar em runtime. Após login/register, `useCurrentUser()` (refetch `GET /auth/me`) é quem popula o `role` corretamente.
5. **Token expira em 1h** (`authenticate.ts:67`, `register.ts:46`). Não há refresh token nem retry — em 1h o usuário cai no 401 do interceptor e é deslogado.
6. **`components/ui/` NÃO tem `Dialog`, `Select`, `Checkbox`, `Label`, `Textarea`, `Switch`, `AlertDialog`**. Deps Radix estão no `package.json:18-32`. Usar `npx shadcn@latest add dialog alert-dialog select checkbox switch textarea label` (config já existe em `frontend-boilerplate/components.json`).
7. **`usersApi` mockado tem rotas a mais que o back**: `bulkDeleteUsers` e `bulkUpdateStatus` (`features/users/api.ts:163-181`) — **não existem no back**. Ou remove da UI, ou implementa no back.
8. **Senha**: o back exige `passwordSchema` (min 8 + letra + número — `lib/validators/password.ts:14-19`), mas o front (`login-form.tsx:13`, `register-form.tsx:13`) valida só min 6. Vai precisar alinhar (front valida min 8).
9. **Toast/erros**: hooks já emitem `toast.error('...')` genérico (`use-users.ts:50, 64, 78, ...`). Vale extrair `error.message` da response (`api-client.ts` retorna o `error` cru do axios, e o back envia `{message: ...}` para erros custom — `error-handler.ts:62, 67, 72, 77`).
10. **CORS**: `server.ts:131-135` permite `['http://localhost:5173', 'http://localhost:4000']` em dev. O `.env` do front aponta pra URL externa do be — em prod o domínio precisa entrar em `CORS_ORIGINS`.
11. **Listagem**: o front chama `useUsers({search: debounced, limit: 50})` (`features/users/index.tsx:107`). O back espera `pageSize`. O hook `useUsers` (linha 20-25) repassa o objeto direto — vai chegar `limit: 50` que o back **não reconhece** (zod vai ignorar chave extra, sem efeito). Mas também não vai limitar a 50 — o back usa `pageSize: 10` default. Decidir: (a) renomear `limit`→`pageSize` no hook; (b) aumentar o default do back; (c) passar `pageSize: 50` no front.
12. **Tipagem do response de list**: o back retorna `lastLoginAt: z.date().nullable()` e `createdAt: z.date()`. Fastify serializa datas como ISO string. O front (`users/types.ts:8, 23-28`) já trata como `string` ✓.

## Lacunas

- **Endpoint de stats**: o front consome `useUserStats()` mas o back não expõe `/users/stats`. Confirmar se vai ser adicionado ou se stats vem agregado de outra forma.
- **Bulk operations**: `bulkDeleteUsers`/`bulkUpdateStatus` existem no `api.ts` mockado mas não há rota correspondente no back. Confirmar se entram no escopo.
- **Refresh token**: JWT expira em 1h sem renovação; sem evidência de fluxo de refresh no front ou no back.
- **`register` cria USER fixo** (`register.ts:42`) — sem endpoint público pra criar ADMIN. Único caminho hoje: seed (`demo@example.com`).

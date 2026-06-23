# Exploração: feature de Conexões (frontend + backend)

> Pergunta: mapear a feature de conexões (FSD) para implementar uma TELA DE DETALHE em `/connections/:id` que mostre metadado do banco (tabelas/colunas), reusando a composição dba-workbench da Vitrine UI.
> Data: 2026-06-22 16:40 · Stack: React + Vite + TanStack Query + Zod (FE) · Fastify + Prisma + Zod (BE) · `DbSchemaExplorer` da Vitrine UI (já existe em `src/components/ui/`)

## Resposta direta

A feature está **quase pronta** para virar uma rota de detalhe: **o backend já expõe `GET /connections/:id` (com tudo exceto a senha), `GET /connections/:id/schema` (introspecção cacheada), `POST /connections/:id/test` (healthcheck) e `POST /connections/:id/query` (preview read-only)**, e o frontend já tem **hooks `useConnection(id)`, `useConnectionSchema(id, enabled)`, `useTestConnection()`** + o **componente `DbSchemaExplorer` da Vitrine UI** (com prop `embedded?` e tipo `DatabaseSchema` ricos: schemas/tables/columns/PK/índice/FK) + o **mapper `toDatabaseSchema`** que converte a resposta do backend no shape da Vitrine. A peça que falta é literalmente (a) uma rota `connections/:id` em `feature-routes.tsx` apontando para um novo componente de página, (b) um link/botão "Ver detalhe" na `ConnectionsPage` (hoje há só "Testar", "Schema (modal)", "Editar", "Excluir"), e (c) compor a página de detalhe (header com metadado + `DbSchemaExplorer` embedded + ações de Test/Edit/Delete).

## FRONTEND — `frontend-boilerplate/src/features/connections/`

### Estrutura FSD

```
src/features/connections/
├── api.ts                # cliente HTTP (axios) — endpoints do módulo
├── hooks.ts              # 8 hooks TanStack Query (list/detail/schema/mutations)
├── routes.tsx            # exporta `featureRoutes` → /connections (lista)
├── types.ts              # contratos TS (Connection, Schema, Filters, etc.)
├── components/
│   ├── connections-page.tsx            # tela de LISTAGEM
│   ├── connection-form-dialog.tsx       # form create/edit (react-hook-form + zod)
│   ├── connection-schema-explorer.tsx   # MODAL de schema (reusa DbSchemaExplorer)
│   └── delete-connection-dialog.tsx     # confirmação de exclusão
├── lib/
│   └── schema-mapper.ts   # mapper PURO: ConnectionSchema → DatabaseSchema
└── __tests__/
    ├── connection-form-dialog.test.tsx
    ├── connection-schema-explorer.test.tsx
    └── schema-mapper.test.ts
```

### 1. Onde está cada coisa (paths + linhas)

- `frontend-boilerplate/src/features/connections/routes.tsx:24-36` — exporta `featureRoutes.protected` com a rota `path: 'connections'` envolta em `RequireRole permission="connections:use"` + `lazy(() => import('./components/connections-page'))`. **É aqui que se adiciona a nova rota `connections/:id`**.
- `frontend-boilerplate/src/features/connections/api.ts:1-79` — `connectionsApi` (axios) com `list`, `getById`, `create`, `update`, `remove`, `test`, `getSchema`. `getById` JÁ existe (`apiClient.get<Connection>('/connections/${id}')`, linha 35-37) e retorna o `Connection` completo (sem senha).
- `frontend-boilerplate/src/features/connections/hooks.ts` — 8 hooks:
  - `useConnections(filters)` — lista
  - `useConnection(id)` — detalhe, `enabled: !!id` (linha 38-46) — **PRONTO para a nova página**
  - `useConnectionSchema(id, enabled)` — introspecção, `enabled: !!id && enabled` (linha 48-57) — **PRONTO, com `enabled` para lazy**
  - `useDepartments()`
  - `useCreateConnection` / `useUpdateConnection` / `useDeleteConnection` / `useTestConnection` — todas invalidam `queryKeys.connections.all` no sucesso.
- `frontend-boilerplate/src/features/connections/types.ts:1-145` — `Connection`, `ConnectionFilters`, `ConnectionsResponse`, `CreateConnectionInput`, `UpdateConnectionInput`, `ConnectionTestResult`, `SchemaColumn`, `SchemaTable`, `ConnectionSchema`, `Department`, `DepartmentsResponse`. **Não há `ConnectionDetail` específico** — o detalhe usa o mesmo `Connection`. Senha NUNCA aparece nos tipos.
- `frontend-boilerplate/src/features/connections/components/connections-page.tsx` — tela de listagem. Ações por linha: **Testar** (ícone `PlugZap` → `testConnection.mutate(conn.id)`), **Schema** (ícone `Table2` → abre `ConnectionSchemaDialog`), **Editar** (se `canManage`), **Excluir** (se `canManage`). **NÃO há link de "detalhe"** — o "nome" da conexão é só `<p className="truncate font-medium">`. Linhas 156-218 (corpo da tabela).
- `frontend-boilerplate/src/features/connections/components/connection-schema-explorer.tsx:62-124` — `ConnectionSchemaDialog` (modal) que usa `useConnectionSchema` lazy e renderiza o `SchemaExplorerView` que por sua vez usa o `DbSchemaExplorer` da Vitrine.
- `frontend-boilerplate/src/features/connections/lib/schema-mapper.ts:1-46` — `toDatabaseSchema(schema, connection)` puro/testável, agrupa tabelas por `schema` Postgres, ordena alfabeticamente, e preenche o tipo `DatabaseSchema` da Vitrine. **HOJE seta `isPrimary: false` e `primaryKey: []` / `foreignKeys: []` porque o backend MVP só retorna `name/dataType/nullable`** (vide comentário linha 31-32 do mapper). A `onTableClick` callback da Vitrine também está disponível se quisermos ligar a navegação.

### 2. Camada HTTP / auth

- `frontend-boilerplate/src/shared/lib/api-client.ts:1-66` — `apiClient` é **axios** com `baseURL: env.API_URL`, interceptor de REQUEST injeta `Authorization: Bearer <token>` lendo de `useAuthStore.getState().token` (linha 32-38), interceptor de RESPONSE em 401 faz `logout()` + redirect para `/login` (linha 56-65). Todas as features usam essa instância única — `connections/api.ts` importa `apiClient` de `@/shared/lib/api-client`.

### 3. Registro de rotas

- `frontend-boilerplate/src/app/routes.tsx:18-35` — `createBrowserRouter`. **Não há registro manual**: chama `collectFeatureRoutes()` que varre `src/features/*/routes.tsx` via `import.meta.glob('../../features/*/routes.tsx', { eager: true })` (em `frontend-boilerplate/src/shared/lib/feature-routes.ts:41-60`). Adicionar uma rota é só declarar `protected: [{ path: 'connections/:id', element: ... }]` no `featureRoutes` da feature — o agregador descobre e injeta dentro do `DashboardLayout` (filha de `/`).
- `frontend-boilerplate/src/app/dashboard-layout.tsx:7-13` — `TITLES` é o dicionário `path → label` da topbar. Para `/connections/:id` cair com o título "Conexões", a `path.startsWith('/connections')` na linha 29 já cobre (começa com `/connections`).

### 4. Query-keys

- `frontend-boilerplate/src/shared/lib/query-keys.ts:75-83` — centralizadas:
  - `queryKeys.connections.all` (invalidação ampla)
  - `queryKeys.connections.list(filters)`
  - `queryKeys.connections.detail(id)` — `['connections', 'detail', id]`
  - `queryKeys.connections.schema(id)` — `['connections', 'schema', id]`
- Política: `frontend-boilerplate/src/shared/lib/query-policies.ts:43-49` — `referenceQueryOptions()` = `staleTime: 10 min, gcTime: 30 min, refetchOnWindowFocus: false`. Usado em TODAS as queries de conexões (incluindo detail e schema). É o "dado de referência" (muda raramente).

### 5. RBAC de UI

- `frontend-boilerplate/src/shared/lib/rbac.ts:14-78` — `hasPermission(role, perm)`. `connections:use` = ADMIN/ANALYST/CREATOR. `connections:manage` = ADMIN/ANALYST. A matriz é espelho do backend — defesa em profundidade.
- `frontend-boilerplate/src/app/app-sidebar.tsx:24-30` — item `/connections` exige `permission: 'connections:use'`; mesmo guard do que a rota.

### 6. Componente da Vitrine UI a reutilizar (dba-workbench)

- `frontend-boilerplate/src/components/ui/db-schema-explorer.tsx:1-995` — 2-painel (árvore à esquerda, detalhe à direita) estilo DBeaver/Navicat/pgAdmin. Suporta **busca por nome de tabela/coluna/FK**, toggle "Only FK", 4 tabs no detalhe (Columns / Indexes / Foreign keys / DDL), e navegação clicável FK→tabela referenciada. **Tem a prop `embedded?: boolean`** (linha 80-87 dos types) que **remove o wrapper externo (rounded/border/shadow) e o header interno (nome/engine/host/port/version/size/tables)** — **perfeito para embarcar na página de detalhe dentro de uma composição dba-workbench**, mantendo só a toolbar de busca + layout 2-painel.
- `frontend-boilerplate/src/components/ui/db-schema-explorer-types.ts:1-87` — `DatabaseSchema` aceita: `id, name, engine: DbEngine ('postgresql'|'mysql'|'sqlserver'|'oracle'|'sqlite'), host, port?, version, sizeMB, tables, schemas: { name, tables: { name, schema, columns: ColumnDef[], primaryKey: string[], indexes: IndexDef[], foreignKeys: ForeignKeyDef[], rowCount?, sizeMB? }[], views?, functions? }[]`. Tem `onTableClick?: (tableRef: {schema, table}) => void`.
- Props `ColumnDef`: `name, type, nullable, defaultValue?, isPrimary, isForeign?, references?, comment?`.
- **⚠️ Achado de tooling**: o barrel `frontend-boilerplate/src/components/ui/index.ts` **NÃO re-exporta** `db-schema-explorer`, `db-schema-explorer-types`, `bar-chart`, `donut-chart`, `line-chart`, `scroll-area`, `table`. **Mas o `connection-schema-explorer.tsx` JÁ importa `DbSchemaExplorer` de `@/components/ui/db-schema-explorer` e `useConnectionSchema`** — ou seja, o import direto por path funciona (Vite/Vitest não precisam do barrel). Para usar na página de detalhe, importar direto do arquivo: `import { DbSchemaExplorer } from '@/components/ui/db-schema-explorer'`.

## BACKEND — `backend-boilerplate/src/modules/connections/`

### Estrutura

```
src/modules/connections/
├── index.ts              # plugin Fastify, registra auth + 8 rotas
├── service.ts            # regra de negócio (Prisma + crypto + pg-runner + cache)
├── schema.ts             # Zod schemas + serializeConnection
├── rbac.ts               # matriz local (MANAGE/USE/visibilidade/ownership)
└── routes/
    ├── create-connection.ts        # POST   /connections
    ├── list-connections.ts         # GET    /connections
    ├── get-connection.ts           # GET    /connections/:id
    ├── update-connection.ts        # PATCH  /connections/:id
    ├── delete-connection.ts        # DELETE /connections/:id
    ├── test-connection.ts          # POST   /connections/:id/test
    ├── get-connection-schema.ts    # GET    /connections/:id/schema
    └── run-connection-query.ts     # POST   /connections/:id/query
```

### 7. Rotas REST existentes (TUDO que a página de detalhe precisa JÁ EXISTE)

| Método | Path | Arquivo | Resumo | Auth |
|---|---|---|---|---|
| POST   | `/connections`              | `routes/create-connection.ts:13-58`       | Cria (senha cifrada AES-256-GCM at-rest) | requirePermission manage |
| GET    | `/connections`              | `routes/list-connections.ts:11-53`         | Lista paginada com RBAC + visibilidade   | requirePermission use    |
| **GET**| **`/connections/:id`**      | `routes/get-connection.ts:9-25`            | **Detalha (sem senha)**                   | requirePermission use    |
| PATCH  | `/connections/:id`          | `routes/update-connection.ts:14-57`        | Atualiza (recifra senha se enviada)       | requirePermission manage + ownership |
| DELETE | `/connections/:id`          | `routes/delete-connection.ts:11-26`        | Remove                                    | requirePermission manage + ownership |
| **POST**  | **`/connections/:id/test`** | `routes/test-connection.ts:9-22`        | **Healthcheck (SELECT 1, atualiza status/lastTestedAt)** | requirePermission use    |
| **GET**   | **`/connections/:id/schema`** | `routes/get-connection-schema.ts:10-37` | **Introspecção (cache Redis `conn:{id}:schema`)** | requirePermission use    |
| **POST**  | **`/connections/:id/query`** | `routes/run-connection-query.ts:9-39` | **SELECT read-only (guardrails: só SELECT, timeout, row cap)** | requirePermission use    |

Todas as rotas exigem JWT (`@/middlewares/auth` registrado uma vez no `index.ts:42` via `app.register(auth)` antes das rotas). Detalhe da superfície está documentado no JSDoc do `index.ts:11-30`.

### 8. Endpoint de introspecção de schema — `GET /connections/:id/schema`

- **SIM, existe em REST** (`routes/get-connection-schema.ts:10-37`). Equivalente ao `get_connection_schema` do MCP. Aceita `?refresh=true` para invalidar o cache.
- Lógica em `service.ts:166-213` (`introspectSchema`):
  - Cache key: `conn:{id}:schema` (linha 23-25)
  - TTL: `SCHEMA_CACHE_TTL_SECONDS = 300` (5 min, linha 16)
  - SQL (linhas 79-85): `SELECT table_schema, table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY table_schema, table_name, ordinal_position`
  - `groupTables` (linhas 89-105) agrupa por `schema.table` e devolve `{ schema, name, columns: { name, dataType, nullable }[] }`
  - Resposta (`schemaResponseSchema` em `schema.ts:114-122`): `{ connectionId, cached, tableCount, fetchedAt, tables: SchemaTable[] }`
- **NÃO introspecta PK/FK/indexes/view** — só `name/dataType/nullable`. O mapper do front assume `isPrimary: false` por causa disso. **Para a tela de detalhe, é factível enriquecer a introspecção** (JOIN com `pg_index`/`pg_constraint` para PK/FK) — é trabalho de backend novo, não reutiliza o que existe.

### 9. Preview / run_query — `POST /connections/:id/query`

- **SIM, existe em REST** (`routes/run-connection-query.ts:10-38`).
- Body: `{ sql: string, params?: unknown[], maxRows?: number(1..100000) }` (`schema.ts:76-83`)
- Resposta (`queryResultSchema` em `schema.ts:85-92`): `{ columns: { name, dataTypeID }[], rows: Record<string, unknown>[], rowCount, truncated, durationMs }`
- Guardrails (no `@/lib/pg-runner`, verificado pelos testes `tests/connections.test.ts:355-396`): só SELECT, rejeita DROP/UPDATE/INSERT/DELETE/multi-statement/CTE-data-modifying → 400. Cap absoluto `env.PG_RUNNER_MAX_ROWS` aplica clamp mesmo se o caller pedir mais.
- **Útil para "preview de dados" na tela de detalhe** (botão "rodar SELECT" contra uma tabela).

### 10. Healthcheck — `POST /connections/:id/test`

- **SIM, existe em REST** (`routes/test-connection.ts:10-21`).
- Lógica em `service.ts:120-148` (`testConnection`): decifra senha, abre conexão pg-runner, executa `SELECT 1` com `statementTimeoutMs: 5000`, atualiza `status` (`'ok'|'error'`) e `lastTestedAt` no Prisma, devolve `{ ok, status, lastTestedAt, message }` (`testResultSchema` em `schema.ts:135-140`).
- Front já tem hook `useTestConnection` que chama essa rota e exibe toast + invalida `queryKeys.connections.all`.

### 11. RBAC do backend (`rbac.ts`)

- **Achado IMPORTANTE** (item 3 do backlog): `backend-boilerplate/src/modules/connections/rbac.ts` é **RBAC LOCAL** (`MANAGE_ROLES/USE_ROLES/buildVisibilityWhere/canAccessConnection` próprios). As 8 rotas importam tudo de `../rbac` e ZERO usam `@/lib/rbac` compartilhado. É uma ilha — não bloqueia a feature de detalhe, mas é dívida técnica conhecida.
- Para a tela de detalhe, basta consumir o que já existe. `GET /connections/:id` usa `requireConnectionForUse` (papel + visibilidade) — retorna 404 (não 403) se o user não tem acesso, para não vazar existência.

### 12. Cache de introspecção

- `service.ts:170-181` lê/escreve via `redisService.getValue/setValue` na chave `conn:{id}:schema`. **Best-effort** — se Redis não estiver `isReady()`, segue sem cache sem falhar. O cache é invalidado em `updateConnection` e `deleteConnection` (linhas 109-111, 117-118).

## Pontos de atenção / padrões a seguir

- **Convenções de query-key**: SEMPRE usar `queryKeys.connections.detail(id)` e `queryKeys.connections.schema(id)` — não criar string solta. Em invalidações, usar `queryKeys.connections.all` (faz match de todos).
- **`referenceQueryOptions()`** (10 min stale) deve ser aplicado em qualquer query nova de conexão — é o padrão da feature.
- **Padrão de rota**: declarar no `featureRoutes.protected` em `frontend-boilerplate/src/features/connections/routes.tsx` com `lazy` + `Suspense` + `RequireRole permission="connections:use"`. A nova rota `connections/:id` segue EXATAMENTE o mesmo template.
- **NÃO acoplar `useNavigate` dentro da tabela** se a intenção for separar a tela de detalhe — hoje a `ConnectionsPage` (linha 156) já é o ponto natural para adicionar um botão "Ver detalhe" (`<Database>` ícone + `<Link>` ou `useNavigate`), provavelmente envolvendo o `conn.name` ou criando um botão dedicado na coluna "Ações".
- **Link pelo nome**: a coluna "Conexão" da tabela (linha 159-167 do `connections-page.tsx`) tem `<p className="truncate font-medium text-foreground">{conn.name}</p>` que é um `<p>` puro. Convertê-lo para `<button onClick={() => navigate(`/connections/${conn.id}`)}>` (mantendo estilos) dá o atalho mais natural e segue o padrão de UI de listagem.
- **Composição dba-workbench**: o pai falou em "compor uma dba-workbench" — o `DbSchemaExplorer` com `embedded={true}` + um `Section` header com metadado da conexão (host, port, db, visibility, status, lastTestedAt) é a composição. **NÃO duplicar** a toolbar de busca nem os 2-painel do explorer — a Vitrine já entrega.
- **Senha nunca aparece no front**: `serializeConnection` em `schema.ts:147-167` lista explicitamente os campos — `passwordCipher` e plaintext jamais saem. Não há necessidade de filtrar nada no front; basta confiar no tipo `Connection`.
- **Tipo `Connection` já tem `status: string` e `lastTestedAt: string | null`** — usar `useTestConnection().mutate(id)` na tela de detalhe atualiza o detail automaticamente (a mutation invalida `queryKeys.connections.all`).
- **Barrel desatualizado**: `components/ui/index.ts` não re-exporta `db-schema-explorer`. Importar pelo path direto `@/components/ui/db-schema-explorer` (o `connection-schema-explorer.tsx` já faz assim, vide linha 21-22). **Não tocar no barrel** a menos que seja parte de um trabalho separado de sincronização da Vitrine.

## Lacunas / o que NÃO existe (para enriquecer a tela de detalhe, se desejado)

1. **PK/FK/indexes/views** na introspecção: o backend MVP só retorna `name/dataType/nullable`. O `DatabaseSchema` da Vitrine suporta tudo, mas o mapper atual zera `primaryKey/foreignKeys/indexes` e seta `isPrimary: false`. **Enriquecer a introspecção é trabalho de backend** (estender `INTROSPECT_SQL` em `service.ts:79-85` para join com `pg_index`/`pg_constraint`/`pg_indexes`).
2. **Rota de "preview de dados" exposta ao front** com UI amigável — o endpoint `POST /connections/:id/query` existe e tem hook faltando no `hooks.ts`. Hoje não há `useRunConnectionQuery`. Adicionar seria trivial (a feature já tem `runQueryBodySchema`/`queryResultSchema`).
3. **Métricas do banco** (`sizeMB`, `version`, `rowCount` por tabela) — o `DatabaseSchema` da Vitrine tem esses campos, mas o backend não os entrega. Seria nova rota (ou extensão do `/:id/schema`) com `pg_database_size` + `pg_total_relation_size`.
4. **Histórico de testes**: o backend só guarda o último `lastTestedAt/status`. Não há log de testes anteriores. Não relevante para o MVP da tela de detalhe.
5. **Dono/departamento do user em nome legível**: o `Connection` devolve `ownerId`/`departmentId` (UUIDs). Para mostrar "Owner: Maria / Departamento: Vendas" na tela de detalhe é preciso cruzar com `/users` e `/departments` (ambos já existem no backend, e o `useDepartments` já está no hooks.ts; `useUsers` precisa ser checado — não verificado nesta exploração).

## Resumo para a implementação

- **Onde plugar a rota de detalhe no front**: `frontend-boilerplate/src/features/connections/routes.tsx`, adicionar uma entrada `{ path: 'connections/:id', element: <RequireRole ...><Suspense ...><ConnectionDetailPage /></Suspense></RequireRole> }` em `featureRoutes.protected`. Criar `frontend-boilerplate/src/features/connections/components/connection-detail-page.tsx` (novo) que usa `useParams().id` → `useConnection(id)` + `useConnectionSchema(id)` (lazy via `enabled` controlado por state/section visível) + render do `DbSchemaExplorer` da Vitrine (com `embedded={true}` se for composição num Section com header próprio, ou `embedded={false}` para ver o chrome completo da Vitrine).
- **Endpoints REST de introspecção de schema JÁ EXISTEM**: `GET /connections/:id` (detalhe), `GET /connections/:id/schema` (introspecção de tabelas/colunas, cacheada), `POST /connections/:id/test` (healthcheck), `POST /connections/:id/query` (preview SELECT read-only). O `useConnection` e `useConnectionSchema` hooks JÁ EXISTEM. O `DbSchemaExplorer` da Vitrine + o `toDatabaseSchema` mapper JÁ EXISTEM. **É praticamente uma composição sem necessidade de novo endpoint de backend** (a não ser que se queira PK/FK/métricas, o que é trabalho novo).
- **Link da listagem para o detalhe**: `connections-page.tsx` linha 161 (`<p className="truncate font-medium text-foreground">{conn.name}</p>`) é o candidato natural a virar um `<Link>`/`<button>` que navega para `/connections/${conn.id}`. Linha 188 (coluna "Ações") também pode ganhar um botão "Ver" (ícone `Database` ou `ArrowUpRight` da Vitrine) — opcional.
- **RBAC de tela de detalhe**: usar `RequireRole permission="connections:use"` (mesmo da listagem), pois `GET /connections/:id` exige essa permissão no backend.

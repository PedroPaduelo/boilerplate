# 31 — Fase 2: Backend (arquitetura, rotas, camadas, cache, fila, socket, MCP)

> Status: PROPOSTA v1 (exaustivo). Premissas: agente EXTERNO consome nosso MCP;
> Postgres-only; role global; draft/published sem histórico. Reaproveita o
> boilerplate Fastify+Prisma+Redis+BullMQ+Socket.IO.

## 1. Camadas (padrão do boilerplate)
```
src/
  http/routes/<modulo>/      # rotas (Zod + fastify-type-provider-zod) — 1 plugin por módulo
  services/<modulo>/         # regras de negócio
  services/jobs/             # BullMQ (queue + worker)
  lib/                       # prisma, redis, crypto(AES), pg-runner, env
  middlewares/               # auth, rbac, share-link guard
  socket/                    # rooms e eventos
  mcp/                       # servidor MCP (tools)
  server.ts                  # só dá register() dos plugins (ponto definido na Fase 0)
```

## 2. Módulos de rota (plugins disjuntos — habilita paralelização)
| Plugin | Responsabilidade | Trilha |
|--------|------------------|--------|
| `auth` (existe) | login/register/me | — |
| `users` (existe) | CRUD users | — |
| `departments` | CRUD depto + membership | T-B |
| `connections` | CRUD + test + schema + query(preview) | T-A |
| `charts` | CRUD draft + publish/unpublish | T-B |
| `dashboards` | CRUD draft + publish/unpublish | T-B |
| `data` | execução/hidratação dos blocos (cache+fila) | T-C |
| `share` | criar/revogar link + resolver público | T-B |
| `export` | PDF | T-J |
| `catalog` | expõe manifestos do catálogo (FE + MCP) | T-I/T-D |
| `mcp` | servidor MCP (tools) | T-D |

## 3. Endpoints REST (superfície completa)

### connections (T-A)
- `POST /connections` — cria (cifra senha AES-256-GCM)
- `GET /connections` — lista (filtra por RBAC/visibilidade)
- `GET /connections/:id`
- `PATCH /connections/:id` · `DELETE /connections/:id`
- `POST /connections/:id/test` — testa conectividade (atualiza status/lastTestedAt)
- `GET /connections/:id/schema` — introspecção (tabelas/colunas); cache Redis
- `POST /connections/:id/query` — executa SELECT read-only (preview/dev); guardrails

### charts (T-B)
- `POST /charts` · `GET /charts` · `GET /charts/:id` · `PATCH /charts/:id` · `DELETE /charts/:id`
- `POST /charts/:id/publish` · `POST /charts/:id/unpublish`

### dashboards (T-B)
- CRUD `/dashboards` (+ `GET /dashboards/:id` retorna layout conforme modo)
- `POST /dashboards/:id/publish` · `POST /dashboards/:id/unpublish`

### data (T-C) — coração do render
- `POST /dashboards/:id/data` — body: `{ mode: 'draft'|'published', filters: {...} }`
  → resolve cada bloco com dataBinding; **draft = sempre fresco (sem cache)**,
  **published = cache**; cache hit retorna na hora; miss enfileira e responde
  `{ blockId, status: 'queued' }`; resultado chega via socket.
- (alternativa) `POST /charts/:id/data` — hidratar 1 gráfico (usado no preview/chat).

### share (T-B)
- `POST /share` — `{ targetType, targetId, durationSeconds }` → token
- `GET /public/:token` — resolve; **na 1ª abertura** seta `firstAccessedAt` +
  `expiresAt = now + duration`; valida expiração/revogação (rota SEM auth)
- `DELETE /share/:id` — revoga

### export (T-J)
- `POST /export/dashboards/:id/pdf` — gera PDF (ver módulo 10)

### catalog (T-I/T-D)
- `GET /catalog` — lista manifestos (type, name, propsSchema, dataContract, example)

## 4. pg-runner (execução de query) — núcleo de segurança
- Pool de conexões **por Connection** (cache de pools em memória, TTL idle).
- Enforce read-only: usuário de banco read-only **e** `SET TRANSACTION READ ONLY` /
  `BEGIN; SET default_transaction_read_only = on;`.
- Guardrails de SQL: só `SELECT`/`WITH`; bloquear múltiplos statements (`;`),
  DDL/DML; `statement_timeout` (ex.: 15s); **LIMIT cap** (ex.: 50k linhas); params
  parametrizados (sem string concat).
- Saída: `{ columns[], rows[], rowCount, durationMs }`.
- `transform`: resultado → shape do bloco; validado contra `dataContract` do catálogo.

## 5. Cache (Redis) — 2 níveis (do contrato 20)
- **Layout publicado**: `dash:{id}:published` → invalida no publish/unpublish.
- **Dados**: `data:{sha256(connId|sql|paramsValues)}` com TTL = `block.ttlSeconds`.
  - **dev/draft**: bypass total.
  - **published**: lê/grava cache.
- **Schema introspecção**: `conn:{id}:schema` (TTL configurável).
- **Anti-stampede**: `jobId = cacheKey` no BullMQ → uma execução por chave concorrente.

## 6. Fila (BullMQ) — `query-exec`
- Job: `{ connectionId, sql, params, transform, contractType, cacheKey, ttl, room }`.
- Worker: executa via pg-runner → transforma → grava cache → emite socket.
- Dedupe por `jobId = cacheKey`. Concorrência e retry/backoff configuráveis.
- Bull Board (já no boilerplate) para observabilidade.

## 7. Socket.IO
- Auth do socket via JWT (handshake).
- Rooms: `dashboard:{id}` (clientes com o dashboard aberto).
- Eventos servidor→cliente: `block:queued`, `block:data` (`{blockId, data}`), `block:error`.
- Mudança de filtro → recomputa só os blocos que escutam aquele filtro.

## 8. Segurança / RBAC
- Middleware `requireAuth` + `requireRole`/`requirePermission` por rota.
- Matriz RBAC (admin/analyst/creator/viewer/user × ações) — **a definir** (módulo 01).
- Cifragem de credenciais (lib `crypto` AES-256-GCM, chave `CONNECTION_ENC_KEY`).
- Rate-limit (boilerplate) nas rotas sensíveis e no `query`.
- Rota pública de share sem auth, só via token válido/não-expirado.

## 9. MCP Server (T-D) — superfície de tools (independe da ferramenta externa)
> O protocolo MCP é padrão; estas tools valem para qualquer runtime externo.
- `list_connections()` / `get_connection_schema(connectionId)`
- `run_query(connectionId, sql, params?)` → rows (read-only, guardrails) [preview]
- `list_catalog()` → manifestos (tipos + dataContract + exemplos)
- `create_chart(...)` / `update_chart(chartId, draftProps, draftDataBinding)`
- `publish_chart(chartId)`
- `create_dashboard(...)` / `update_dashboard(dashboardId, draftLayout)`
- `add_chart_to_dashboard(dashboardId, chartId, position)`
- `publish_dashboard(dashboardId)`
- (opcional) `preview_chart_data(chartId|adhoc)` para o agente conferir o shape
- **Transporte/auth**: HTTP streamable + bearer/API-key → detalhes dependem da
  ferramenta externa (#3, pendente).

## 10. Decisões em aberto (F2)
- [ ] Endpoint de dados: **batch por dashboard** (proposto) vs por bloco.
- [ ] Mecanismo de `transform` (mapa declarativo vs query já no shape vs fn registrada).
- [ ] Matriz RBAC por rota (depende do módulo 01).
- [ ] Auth do runtime externo no MCP (depende da ferramenta).
- [ ] Cache de dados é **por usuário** ou compartilhado? (cuidado: filtros/permissão).

## ✅ Decisões travadas (rodada 4)
- **Endpoint de dados**: BATCH por dashboard (`POST /dashboards/:id/data`).
- **Cache de dados COMPARTILHADO** entre usuários (mesma chave p/ mesmos filtros).
  Permissão é checada no **acesso ao dashboard**, não na chave de cache.
- **Sem AuditLog** no MVP.
- (eventual) proxy fino opcional p/ a API externa do agente — ver F3.

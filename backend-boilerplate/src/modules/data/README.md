# Módulo `data` (T-C) — hidratação dos blocos

> Coração do render. Endpoint **batch** por dashboard + cache Redis (2 níveis) +
> fila **BullMQ** (`query-exec`) + **worker** + emissão via **Socket.IO**.
> Fontes: `docs/plano/20` (contrato), `07` (cache), `31` (arquitetura BE).

## Superfície

```
POST /dashboards/:id/data        (autenticado, artifacts:view)
  body: { mode: 'draft' | 'published', filters: { [filterId]: valor } }
  200:  { dashboardId, mode: 'dev'|'published', generatedAt, blocks: { [blockId]: BlockDataResult } }
```

`BlockDataResult` (de `@dashboards/contracts`): `{ blockId, state, shape?, data?, error?, meta? }`
com `state ∈ idle|queued|running|success|error`.

## Fluxo

```
POST /dashboards/:id/data
  └─ loadLayoutForBatch(mode)         ← visibilidade do ator + cache de LAYOUT (nível 2)
  └─ resolveBlocks(layout, mode)      ← vínculo de dados + REVALIDAÇÃO de visibilidade (chart/conn)
  └─ assembleBatch(...)               ← por bloco:
        draft     → executa INLINE agora (bypass de cache) → state success/error (com dados)
        published → TTL>0 e cache HIT → state success (meta.cached=true)
                  → MISS / TTL<=0      → enfileira (jobId=cacheKey) → state queued
                                          worker → block:running → block:data | block:error
```

## Cache (2 níveis, Redis)

| Nível | Chave | TTL | Invalidação |
|-------|-------|-----|-------------|
| **Layout publicado** | `dash:{id}:published` | `DATA_LAYOUT_CACHE_TTL` (3600s) | no publish/unpublish (módulo `dashboards`, T-B3) |
| **Dados (por bloco)** | `data:{sha256(connId\|sql\|paramsValues)}` | `dataBinding.ttlSeconds` (fallback `DATA_CACHE_DEFAULT_TTL`=300s) | expiração natural por TTL |

- **`cacheKey` / `jobId`** — `data:` + `sha256(connectionId | query | JSON(paramsValues))`.
  `paramsValues` é o array **posicional** (ordem dos `dataBinding.params`), então a
  chave é **determinística** e independe da ordem das chaves do objeto `filters`.
- **Compartilhada entre usuários** (decisão travada doc 31): a permissão é checada
  no **acesso ao dashboard** (visibilidade), nunca embutida na chave.
- **`mode=draft`** ⇒ bypass total (dev sempre fresco). **`mode=published`** ⇒ usa cache.
- **`ttlSeconds <= 0`** ⇒ bloco **tempo real**: não lê nem grava cache, sempre recomputa.
- O cache de layout faz uma leitura LEVE dos metadados (owner/visibility/status) para
  a checagem de visibilidade e lê o JSON do layout do cache — evita transferir o JSON
  grande do Postgres a cada batch. Em miss, popula o cache.

## Anti-stampede

`jobId = cacheKey` na fila BullMQ. BullMQ **deduplica** jobs com o mesmo id, então
2 misses concorrentes do mesmo bloco/params (mesma chave) geram **1 job só**.
`removeOnComplete: true` libera o id para recomputo depois que o cache expira.

## Fila `query-exec` + worker

- `jobs/queue.ts` — fila própria do módulo (reusa `connectionRedisConfigQueue` do
  boilerplate). `addQueryExecJob(data)` com `jobId = cacheKey`.
- `jobs/worker.ts` — `Worker('query-exec', ...)`, **no mesmo processo da API**
  (padrão do boilerplate). Iniciado por um hook **`onReady`** no `index.ts` (depois
  que o Redis foi inicializado em `server.ts`) — **sem editar `server.ts`** nem subir
  processo separado. No-op em modo degradado (sem Redis) ou em testes sem Redis.
- `worker-handler.ts` — lógica testável (infra injetada): **load conexão (decifra
  senha) → pg-runner → transform → VALIDA contra `dataContract` → grava cache (TTL) →
  emite socket**. A senha **nunca** vai no payload do job (só o `connectionId`; a
  decifragem acontece no worker).

### Validação contra o `dataContract`

O `type` do bloco aponta para o catálogo vivo; `getCatalogDataShape(type)` devolve o
`dataContract.shape` (`scalar|series|categorical|table`). O resultado transformado é
validado com `validateBlockDataByShape(shape, data)` (`@dashboards/contracts`).
**Resultado fora do contrato ⇒ `block:error`** (code `contract_violation`), nunca
`block:data`. Tipo sem `dataContract` no catálogo ⇒ devolvido como `table` sem validar.

## Socket.IO

Emite para a sala `dashboardRoom(id)` (`dashboard:{id}`) via
`socketManager.sendToRoom(room, SOCKET_EVENTS.X, payload)` — nomes de evento sempre
de `SOCKET_EVENTS` (`block:queued|running|data|error`). O worker emite `block:running`
ao começar e `block:data`/`block:error` ao terminar. O `POST` responde `state:queued`
para os misses; o evento `block:queued` é representado pelo `state` na resposta REST.

## Segurança

1. **Revalidação de visibilidade** (`block-resolver.ts`): para cada `chartId` /
   `connectionId` referenciado, o ator precisa **ter acesso** (`canViewArtifact`) —
   não basta existir. Sem acesso ⇒ o bloco vira `error` (`forbidden_chart` /
   `forbidden_connection`), **não hidrata**.
2. **Nunca expõe o `dataBinding` cru** (SQL/connectionId): a resposta carrega apenas
   o RESULTADO já no shape do bloco. (O fetch público por token é do módulo `share`/T-B4;
   este endpoint é autenticado.)
3. **pg-runner** read-only com guardrails + senha decifrada só em memória, no worker.

## Arquivos

```
index.ts             plugin (auth + rota; onReady → ensureQueryExecWorker)
routes/dashboard-data.ts   POST /dashboards/:id/data
service.ts           loadLayoutForBatch + assembleBatch (puro) + buildDashboardData + realRuntime
block-resolver.ts    resolveBlocks (vínculo + visibilidade)
executor.ts          executeBlockData (query→transform→valida) — puro (runQuery injetado)
worker-handler.ts    processQueryExecJob (cache + socket) — puro (infra injetada)
transform.ts         applyTransform (resultado → shape; identidade + mapa declarativo)
cache.ts             computeCacheKey / resolveParamsValues / effectiveTtl / chaves
connection-loader.ts Connection → PgRunnerConnection (decifra) — sem acoplar a `connections`
jobs/queue.ts        fila BullMQ query-exec (jobId=cacheKey)
jobs/worker.ts       worker BullMQ (deps reais) + ensureQueryExecWorker/close
types.ts             tipos internos (QueryExecJobData, ResolvedBlock, DataMode)
```

## Notas / desvios

- **Bull Board**: a fila `query-exec` NÃO é adicionada ao painel `/queues` porque o
  Bull Board é configurado em `server.ts` (arquivo FECHADO na Fase 0 — ver
  `src/modules/README.md`). A fila é totalmente funcional; só não aparece na UI.
  Para incluí-la, basta um adapter na lista de `server.ts` (1 linha) — deixado de
  fora de propósito para não tocar o boot compartilhado.
- **`transform`**: no MVP é identidade por convenção de nomes de coluna OU um objeto
  de mapeamento declarativo (`{ x, y, series, label, value, ... }`). Refs nomeadas
  (string) são tratadas como identidade — evolução futura.
- **Filtros complexos** (ex.: `date_range` = `{from,to}`) são passados como valor
  posicional cru à query (responsabilidade do autor da query/transform no MVP).

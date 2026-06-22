# Referência técnica do MCP — Plataforma de Dashboards

> "Cola" técnica do agente: transporte/auth, as **12 tools** (nomes e argumentos
> EXATOS, verificados contra o servidor real), o **catálogo de 7 blocos** com
> shapes e `propsSchema`, as **convenções de query por shape** e **exemplos
> end-to-end**. Use junto com `SKILL.md` e `rules.md`.

---

## 1. Transporte & autenticação

- **Endpoint único:** `POST /mcp` — mensagens **JSON-RPC 2.0** (MCP), resposta
  `application/json`. _Stateless_: cada request é autenticado e atendido isolado.
- `GET /mcp` → `405` (não há canal SSE iniciado pelo servidor neste MVP).
- **Auth:** header `Authorization: Bearer <MCP_API_KEY>`. Sem a chave configurada o
  endpoint responde `503` (desabilitado, _fail-closed_).
- **Ator de serviço:** o agente atua **em nome de um usuário real** do sistema
  (conta de serviço). O papel/departamentos dele determinam visibilidade e
  permissões (RBAC) — o MCP **não** burla RBAC.
- **Versão de protocolo padrão:** `2025-06-18`. **serverInfo:** `{ name:
  "dashboards-mcp", version: "1.0.0" }`.

### Métodos JSON-RPC suportados
`initialize`, `ping`, `tools/list`, `tools/call`, `notifications/*` (notificação,
sem `id`, não gera resposta).

### Exemplos curl
```bash
# 1) descobrir as tools
curl -sX POST "$BASE/mcp" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# 2) chamar uma tool
curl -sX POST "$BASE/mcp" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call",
       "params":{"name":"run_query",
                 "arguments":{"connectionId":"<id>","sql":"SELECT 1 AS n"}}}'
```

### Formato do resultado de uma tool
Sucesso:
```jsonc
{
  "jsonrpc": "2.0", "id": 2,
  "result": {
    "content": [{ "type": "text", "text": "<JSON compacto do valor>" }],
    "structuredContent": { /* o valor cru, já parseado */ },
    "isError": false
  }
}
```
Erro de execução de tool (regra/validação/RBAC) — **não** é erro de protocolo:
```jsonc
{
  "jsonrpc": "2.0", "id": 2,
  "result": {
    "content": [{ "type": "text", "text": "{\"error\":{\"code\":\"...\",\"message\":\"...\"}}" }],
    "isError": true
  }
}
```
Erro de **protocolo** (método inexistente, params inválidos) vem como `error` JSON-RPC
com `code` negativo (`-32601` método não encontrado, `-32602` params inválidos, etc.).

---

## 2. As 12 tools (nomes e argumentos exatos)

> Verificado via `tools/list` no servidor real. A ordem abaixo é a ordem de
> descoberta. `additionalProperties: false` em todas — **não** envie campos extras.

### 2.1 `list_connections`
Lista conexões visíveis ao ator (respeita RBAC/visibilidade). Nunca retorna senha.
- **args:** `{ search?: string, page?: integer=1, pageSize?: integer=50 (1..100) }`
- **retorna:** `{ connections: [{ id, name, type, host, database, visibility, status, ... }], total, page, pageSize, totalPages }`

### 2.2 `get_connection_schema` (PROGRESSIVO — dois passos)
Introspecção do schema. Desenhada para **não estourar o contexto** em bancos grandes.
- **args:**
  ```jsonc
  {
    "connectionId": "<id>",          // obrigatório
    "tables": ["schema.tabela", ...],// PASSO 2: colunas só dessas (aceita "tabela")
    "search": "substring",           // filtra a lista de tabelas (case-insensitive)
    "schema": "public",              // filtra por schema
    "page": 1, "pageSize": 200,      // paginação da lista (pageSize máx 500)
    "refresh": false                 // ignora o cache e reintrospecta
  }
  ```
- **PASSO 1** (sem `tables`): `{ mode: "tables", tables: [{ schema, name, columnCount }], total, page, pageSize, totalPages, cached, fetchedAt, tableCount, truncated?, hint? }` — **sem colunas**.
- **PASSO 2** (com `tables`): `{ mode: "columns", tables: [{ schema, name, columns: [{ name, dataType, nullable }] }], returnedTables, totalColumns, notFound?, truncated?, hint? }`.
- **caps defensivos (passo 2):** no máx **50 tabelas** detalhadas e **1500 colunas**
  totais por chamada; excedeu → `truncated: true` + `hint`. Peça menos tabelas por vez.

### 2.3 `run_query`
`SELECT`/`WITH` read-only, **preview** (não persiste). Guardrails: só leitura,
`statement_timeout`, teto de linhas.
- **args:** `{ connectionId: string, sql: string, params?: any[], maxRows?: integer=50 (1..1000) }`
- **retorna:** `{ columns: [{ name, dataTypeID }], rows: [...], rowCount, truncated, durationMs }`
- `truncated: true` = bateu no teto de linhas. Prefira agregar no SQL.

### 2.4 `list_catalog`
Manifestos do catálogo VIVO de blocos (com `dataContract`).
- **args:** `{ type?: string }` (se informado, retorna só esse tipo)
- **retorna:** `{ blocks: BlockManifest[], total }`
- Cada `BlockManifest`: `{ type, kind, name, description, source, propsSchema, defaultProps, dataContract? { shape, spec, example }, version, ... }`.

### 2.5 `create_chart` _(requer `artifacts:manage`)_
Cria um gráfico em **draft**, propriedade do ator.
- **args:**
  ```jsonc
  {
    "title": "string (1..200)",            // obrigatório
    "catalogType": "kpi|bar_chart|...",    // obrigatório — type do list_catalog
    "draftProps": { /* valida contra propsSchema do tipo */ }, // obrigatório
    "draftDataBinding": {                   // obrigatório
      "connectionId": "<id>",               // obrigatório — deve existir
      "query": "SELECT ...",                // obrigatório — read-only
      "params": [ ... ],                    // opcional — valores de $1,$2...
      "transform": { /* ver §4 */ },        // opcional
      "ttlSeconds": 3600                     // opcional — 0..86400 (0 = tempo real)
    },
    "departmentId": "<id>",                  // obrigatório se visibility=DEPARTMENT
    "visibility": "PRIVATE|DEPARTMENT|ORG"   // default PRIVATE
  }
  ```
- **retorna:** o chart criado (inclui `id`).

### 2.6 `update_chart` _(requer `artifacts:manage`; só dono/ADMIN)_
Edita campos **draft**. Não altera a versão publicada.
- **args:** `{ chartId: string, title?, catalogType?, draftProps?, draftDataBinding?, departmentId?, visibility? }`
- **retorna:** o chart atualizado.

### 2.7 `publish_chart` _(requer `artifacts:publish`; só dono/ADMIN)_
Promove draft → published (`status=PUBLISHED`, `publishedAt`).
- **args:** `{ chartId: string }` · **retorna:** o chart publicado.

### 2.8 `preview_chart_data` _(requer `artifacts:view`)_
Executa o `dataBinding` do chart e devolve o resultado **já no shape** do
`dataContract`. Use para CONFERIR antes de publicar.
- **args:** `{ chartId: string, mode?: "draft"|"published"=draft }`
- **retorna:** `BlockDataResult` `{ blockId, state: "success"|"error", shape?, data?, meta?, error?: { code, message } }`.

### 2.9 `create_dashboard` _(requer `artifacts:manage`)_
Cria dashboard em **draft** com `draftLayout = { filters, rows }`.
- **args:**
  ```jsonc
  {
    "title": "string (1..200)",              // obrigatório
    "draftLayout": { "filters": [], "rows": [] }, // obrigatório (pode ser vazio)
    "departmentId": "<id>",                  // se visibility=DEPARTMENT
    "visibility": "PRIVATE|DEPARTMENT|ORG"   // default PRIVATE
  }
  ```
- **retorna:** o dashboard criado (inclui `id`). Layout inválido → erro do validador.

### 2.10 `update_dashboard` _(requer `artifacts:manage`; só dono/ADMIN)_
Edita campos draft. Não altera o publicado.
- **args:** `{ dashboardId: string, title?, draftLayout?, departmentId?, visibility? }`
- **retorna:** o dashboard atualizado.

### 2.11 `add_chart_to_dashboard` _(requer `artifacts:manage`)_
Insere um bloco que referencia um chart no `draftLayout`. O bloco recebe
`type = catalogType` do chart e `props.chartId = chartId`.
- **args:**
  ```jsonc
  {
    "dashboardId": "<id>",  // obrigatório
    "chartId": "<id>",      // obrigatório — chart visível ao ator
    "rowId": "<id>",        // opcional — se omitido, cria nova linha ao final
    "span": 6,              // opcional — 1..12 (default 6)
    "position": 0,          // opcional — posição na linha (default: fim)
    "blockId": "<id>",      // opcional — gerado se omitido
    "props": { ... }        // opcional — props extras (chartId é adicionado)
  }
  ```
- **retorna:** o dashboard atualizado.

### 2.12 `publish_dashboard` _(requer `artifacts:publish`; só dono/ADMIN)_
Copia `draftLayout` → `publishedLayout`, marca `PUBLISHED`/`publishedAt` e invalida
o cache de layout.
- **args:** `{ dashboardId: string }` · **retorna:** o dashboard publicado.

---

## 3. Catálogo de blocos (7 tipos vivos)

> Fonte: `list_catalog`. O catálogo é VIVO e pode crescer — sempre consulte-o. Há
> também um tipo interno `__example` (placeholder de teste): **não use**.

| type | kind | shape | propsSchema (props visuais) | defaultProps |
|------|------|-------|-----------------------------|--------------|
| `kpi` | chart | `scalar` | `accent?: string`, `icon?: string`, `showDelta?: boolean` | `{ showDelta: true }` |
| `bar_chart` | chart | `series` | `stacked?: boolean`, `orientation?: "vertical"\|"horizontal"`, `accent?: string` | `{ orientation: "vertical", stacked: false }` |
| `line_chart` | chart | `series` (x temporal) | `smooth?: boolean`, `area?: boolean` | `{ smooth: true, area: true }` |
| `donut` | chart | `categorical` | `showLegend?: boolean`, `centerLabel?: string` | `{ showLegend: true }` |
| `table` | chart | `table` | `pageSize?: integer≥1`, `dense?: boolean` | `{ pageSize: 10 }` |
| `title` | title | — (sem dados) | `text: string` (obrigatório), `level?: 1..6`, `align?: "left"\|"center"\|"right"` | `{ level: 2, align: "left" }` |
| `rich_text` | text | — (sem dados) | `markdown: string` (obrigatório) | `{ markdown: "" }` |

> Todos os `propsSchema` têm `additionalProperties: false` — só envie as props listadas.
> `title` e `rich_text` **não têm `dataBinding`** (são narrativos).

### Shapes de dados (o `data` que cada bloco espera, já transformado)
- **`scalar`** (kpi): objeto `{ value: number|null, label?: string, unit?: string, delta?: number, format?: string }`.
- **`series`** (bar/line): array de `{ x: string|number, y: number|null, series?: string }`.
- **`categorical`** (donut): array de `{ label: string, value: number|null }`.
- **`table`**: `{ columns: [{ key, label, type? }], rows: [ { ...} ] }`.

---

## 4. Convenções de query por shape (a parte que mais erra)

O `transform` do `dataBinding` aplica, por padrão, a **identidade por convenção de
coluna**: nomeie as colunas do `SELECT` exatamente como o shape espera e **não
precisa** de `transform`. Alternativamente, passe um `transform` declarativo
mapeando nomes: `{ value, label, unit, delta, format, x, y, series }` → nomes de
coluna do resultado.

> **GOTCHA universal:** o Postgres devolve `bigint`/`int8` (de `COUNT`, `SUM`) como
> **string**. Os shapes `scalar`/`series`/`categorical` exigem **number**. Logo,
> **sempre** faça `CAST ::int` (contagens) ou `::float`/`::numeric` (somas/médias).
> Sem cast → `preview_chart_data` retorna `contract_violation`.

### scalar (kpi) — coluna `value`
```sql
SELECT COUNT(*)::int AS value FROM contribuintes;
-- com rótulo e variação opcionais:
SELECT SUM(valor)::float AS value, 'Total arrecadado' AS label, 0.12 AS delta;
```

### series (bar_chart) — colunas `x`, `y` (+ `series`)
```sql
SELECT papel AS x, COUNT(*)::int AS y
FROM usuarios
GROUP BY papel
ORDER BY y DESC;
-- com séries múltiplas (terceira dimensão):
SELECT mes AS x, SUM(valor)::float AS y, tributo AS series
FROM arrecadacao GROUP BY mes, tributo ORDER BY mes;
```

### series (line_chart) — `x` temporal, `y` numérico
```sql
SELECT to_char(data, 'YYYY-MM') AS x, SUM(valor)::float AS y
FROM arrecadacao
GROUP BY 1
ORDER BY 1;
```

### categorical (donut) — colunas `label`, `value`
```sql
SELECT situacao AS label, COUNT(*)::int AS value
FROM divida_ativa
GROUP BY situacao
ORDER BY value DESC;
```

### table — colunas livres
```sql
SELECT municipio, SUM(valor)::float AS total
FROM repasses
GROUP BY municipio
ORDER BY total DESC
LIMIT 50;
```

### Com filtros → parâmetros posicionais
Use `$1, $2, ...` no SQL e passe os valores em `params` (ordem posicional):
```jsonc
{
  "query": "SELECT papel AS x, COUNT(*)::int AS y FROM usuarios WHERE papel = $1 GROUP BY papel",
  "params": ["ADMIN"]
}
```

---

## 5. Layout de dashboard (`{ filters, rows }`)

```jsonc
{
  "filters": [
    {
      "id": "f_periodo",
      "type": "date_range",   // date_range | select | multiselect | search | number_range
      "label": "Período",
      "default": { "from": "2026-01-01", "to": "2026-12-31" }
    }
  ],
  "rows": [
    {
      "id": "row_1",
      "title": "Visão geral",        // opcional
      "blocks": [
        { "id": "blk_kpi", "type": "kpi", "span": 4, "props": { "chartId": "<chartId>" } },
        { "id": "blk_bar", "type": "bar_chart", "span": 8, "props": { "chartId": "<chartId>" } }
      ]
    }
  ]
}
```
- Um bloco de gráfico referencia um chart via **`props.chartId`**.
- `span` é a largura no grid de 12 colunas (1..12).
- Blocos `title`/`rich_text` ficam direto no layout (sem `chartId`): `{ id, type: "title", span: 12, props: { text: "..." } }`.
- Forma mais simples: crie o dashboard vazio (`{ filters: [], rows: [] }`) e use
  `add_chart_to_dashboard` para cada chart.

---

## 6. Códigos de erro (resultado com `isError: true`)

| code | causa | ação |
|------|-------|------|
| `invalid_arguments` | args fora do `inputSchema` da tool | corrija tipos/obrigatórios |
| `read_only_violation` | query não-`SELECT`/`WITH` ou multi-statement | reescreva como leitura única |
| `query_failed` | erro SQL/execução (coluna inexistente, timeout) | confira via `get_connection_schema`; agregue/simplifique |
| `contract_violation` | resultado fora do shape do bloco | ajuste nomes de coluna + `CAST ::int/::float`; reconfira |
| `introspection_failed` | falha ao introspectar o schema | tente `refresh:true`; verifique a conexão |
| `bad_request` | regra de domínio (catalogType inexistente, props inválidas, connectionId inexistente) | corrija conforme a mensagem / `list_catalog` |
| `forbidden` | conta de serviço sem permissão | explique ao usuário; não insista |
| `not_found` | id inexistente ou sem visibilidade | confira o id / acesso |
| `no_binding` | `preview_chart_data` em chart sem dataBinding naquele modo | crie/edite o dataBinding |
| `unauthorized` | falha de autenticação | verifique a API key |
| `internal_error` | erro inesperado | tente de novo; reporte se persistir |

---

## 7. Exemplos end-to-end

### Exemplo A — "Total de usuários" → KPI
```jsonc
// 1) tools/call list_connections  → escolhe connectionId
// 2) get_connection_schema { connectionId, search: "user" }   → public.users
// 3) get_connection_schema { connectionId, tables: ["public.users"] }  → colunas
// 4) run_query
{ "name": "run_query", "arguments": {
    "connectionId": "<id>",
    "sql": "SELECT COUNT(*)::int AS value FROM users" } }
//    → { rows: [{ value: 6 }], rowCount: 1, ... }
// 5) create_chart
{ "name": "create_chart", "arguments": {
    "title": "Total de usuários",
    "catalogType": "kpi",
    "draftProps": { "showDelta": false },
    "draftDataBinding": {
      "connectionId": "<id>",
      "query": "SELECT COUNT(*)::int AS value FROM users",
      "ttlSeconds": 3600
    } } }
//    → { id: "<chartId>", status: "DRAFT", ... }
// 6) preview_chart_data { chartId, mode: "draft" }
//    → { state: "success", shape: "scalar", data: { value: 6 } }
// 7) publish_chart { chartId }
```

### Exemplo B — "Usuários por papel" → bar_chart, num dashboard
```jsonc
// 4) run_query
{ "name": "run_query", "arguments": {
    "connectionId": "<id>",
    "sql": "SELECT role AS x, COUNT(*)::int AS y FROM users GROUP BY role ORDER BY y DESC" } }
//    → rows: [{ x: "ADMIN", y: 1 }, { x: "VIEWER", y: 2 }, ...]
// 5) create_chart (bar_chart / shape series)
{ "name": "create_chart", "arguments": {
    "title": "Usuários por papel",
    "catalogType": "bar_chart",
    "draftProps": { "orientation": "vertical" },
    "draftDataBinding": {
      "connectionId": "<id>",
      "query": "SELECT role AS x, COUNT(*)::int AS y FROM users GROUP BY role ORDER BY y DESC",
      "ttlSeconds": 86400
    } } }
// 6) preview_chart_data { chartId } → state: "success", shape: "series"
// 7) publish_chart { chartId }
// 8) create_dashboard { title: "Visão de usuários", draftLayout: { filters: [], rows: [] } }
// 9) add_chart_to_dashboard { dashboardId, chartId, span: 12 }
// 10) publish_dashboard { dashboardId }
```

---

## 8. Checklist rápido do fluxo

1. `tools/list` + `list_catalog` (descoberta).
2. `list_connections` → `connectionId`.
3. `get_connection_schema` passo 1 (lista) → passo 2 (colunas). **Nunca tudo de uma vez.**
4. `run_query` (preview, agregue no SQL).
5. Escolha o `catalogType` pelo **shape**.
6. `create_chart` (colunas nomeadas pelo shape + `CAST ::int/::float`, `ttlSeconds`).
7. `preview_chart_data` → confirme `state: "success"`.
8. `publish_chart` (após confirmar com o usuário).
9. (Opcional) `create_dashboard` → `add_chart_to_dashboard` → `publish_dashboard`.
10. Devolva `chartId` / `dashboardId`.

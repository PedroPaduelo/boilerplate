# Exploração: MCP / Skill / Contratos — fechamento de documentação para IA

> Pergunta: mapear estado atual de (1) MCP tools, (2) skill construtor-dashboards, (3) contratos shared/contracts, (4) catálogo de blocos, (5) resolução de dados no BE — como base para fechar a documentação que a IA/MCP consome.
> Data: 2026-06-23 · Stack: Fastify + JSON-RPC 2.0 (MCP Streamable) + Zod v3 (BE) + AJV + `json-schema-to-ts` (contratos) + Vitrine/React (FE).

---

## Resposta direta

A infraestrutura MCP existe, é robusta e bem documentada em CÓDIGO (descrições de tool, manifests com `oneOf`/`description`, tabela de erros em `protocol.ts`/`SKILL.md`), mas há **três inconsistências de documentação** que vão confundir a IA no uso real:

1. A `mcp-reference.md` e a própria `SKILL.md` falam em **"12 tools e 7 blocos"**, mas o catálogo real gerado por `build:catalog` tem **49 blocos** (`catalog.manifests.json`, `count: 49`) e as tools são de fato 12 + 1 (`__example` interno). A SKILL precisa de `list_catalog` dinâmico — mas o marketing/tabela está congelado.
2. O `Block` no contrato (`shared/contracts/src/types/index.ts`) **NÃO tem `rowSpan`** — o bento_grid (e a decisão arquitetural de containers) lê `rowSpan` via cast `(child as {rowSpan?:number}).rowSpan ?? 1` em runtime (`block-renderer.tsx`). A IA que tentar usar `rowSpan` vai passar pela validação do contrato (não proíbe) mas o tipo TS do `Block` no `@dashboards/contracts` é a fonte canônica e NÃO conhece o campo.
3. O `catalog.manifests.json` (gerado) lista `connection_list` mas a pasta `catalog/connection_list/` **NÃO EXISTE** no FE — resíduo do commit b7eca66 que removeu Vitrine showcase. O `build:catalog` precisa rodar de novo pra limpar (ou a IA pode receber um manifesto fantasma).

Em resumo: **descrições de tool estão excelentes**, **mensagens de erro são claras**, **schema validation tem boa cobertura**, mas **a doc em markdown (SKILL/mcp-reference) está desatualizada** e o **contrato formal `Block` está atrás do FE** (Falta `rowSpan` e `childBlocks`/`renderChild` na cadeia tipada).

---

## 1. MCP SERVER — tools de dados

### Onde está

- **Plugin/entrypoint:** `backend-boilerplate/src/modules/mcp/index.ts` (3485 bytes). Expõe `POST /mcp` (JSON-RPC 2.0), `GET /mcp` → 405. Fail-closed sem `MCP_API_KEY` (503). Auth por bearer.
- **Registro de tools:** `backend-boilerplate/src/modules/mcp/tools/index.ts` — agrega `connectionTools + catalogTools + chartTools + dashboardTools` em `TOOLS[]`. `listToolDescriptors()` devolve `name/description/inputSchema` para `tools/list`.
- **Camada de protocolo:** `backend-boilerplate/src/modules/mcp/protocol.ts` (7425 bytes). Implementa `initialize/ping/tools/list/tools/call`. **Erros de execução de tool voltam como `result.isError=true`** (não como erro JSON-RPC).
- **Config:** `backend-boilerplate/src/modules/mcp/config.ts` (env `MCP_API_KEY`, `MCP_SERVICE_USER_ID/EMAIL`). **Ator de serviço:** `actor.ts` resolve o usuário real + memberships (RBAC não burlável).
- **Gate de RBAC para tools de escrita:** `backend-boilerplate/src/modules/mcp/tools/guard.ts` — espelha `requirePermission('artifacts:manage'|'artifacts:publish')` das rotas REST.

### Mapa completo das 12 tools

| Tool | Arquivo:linha (definição) | Input (JSON Schema resumido) | Output (shape) | Perm. | Erros específicos |
|---|---|---|---|---|---|
| `list_connections` | `tools/connections.ts:42-77` | `{search?, page=1, pageSize=50 (1..100)}` | `{connections:[{id,name,type,host,database,visibility,status,...}], total, page, pageSize, totalPages}` (sem senha) | `connections:use` | `forbidden` se ator sem permissão |
| `get_connection_schema` | `tools/connections.ts:113-225` | `{connectionId, tables?, search?, schema?, page=1, pageSize=200, refresh?}` | Passo 1: `{mode:"tables", tables:[{schema,name,columnCount}], total, page, pageSize, totalPages}` · Passo 2: `{mode:"columns", tables:[{schema,name,columns:[{name,dataType,nullable}]}], notFound?, truncated?, hint?}` | `connections:use` | `introspection_failed` (SqlGuardError/PgRunnerError → `McpToolError`) |
| `run_query` | `tools/connections.ts:264-305` | `{connectionId, sql, params?, maxRows=50 (1..1000)}` | `{columns:[{name,dataTypeID}], rows, rowCount, truncated, durationMs}` | `connections:use` | `read_only_violation` (SqlGuardError) · `query_failed` (PgRunnerError) |
| `list_catalog` | `tools/catalog.ts:20-46` | `{type?}` | `{blocks:BlockManifest[], total}` | nenhuma | nenhum específico |
| `create_chart` | `tools/charts.ts:54-77` | `{title(1..200), catalogType, draftProps, draftDataBinding{connectionId, query, params?, transform?, ttlSeconds? (0..86400)}, departmentId?, visibility?=PRIVATE}` | chart criado (inclui `id`) | `artifacts:manage` | `invalid_arguments` (Zod) · `bad_request` (`Unknown catalogType`, `Invalid props`, `connectionId ... does not reference`, `departmentId is required`, `department not found`, `not a member of this department`) · `forbidden` |
| `update_chart` | `tools/charts.ts:82-100` | `{chartId, title?, catalogType?, draftProps?, draftDataBinding?, departmentId?, visibility?}` | chart atualizado | `artifacts:manage` | `not_found` / `forbidden` (dono) + mesmos do create |
| `publish_chart` | `tools/charts.ts:104-119` | `{chartId}` | chart publicado (`status=PUBLISHED`, `publishedAt`) | `artifacts:publish` | `not_found` / `forbidden` |
| `preview_chart_data` | `tools/charts.ts:154-188` | `{chartId, mode?=draft}` | `BlockDataResult {blockId, state:"success"\|"error", shape?, data?, meta?, error?:{code,message}}` | `artifacts:view` | `no_binding` (sem draft/publishedBinding) · `query_failed` · `contract_violation` · `transform_failed` |
| `delete_chart` | `tools/charts.ts:193-211` | `{chartId}` | `{id, deleted: true}` | `artifacts:manage` | `not_found` / `forbidden` |
| `unpublish_chart` | `tools/charts.ts:215-232` | `{chartId}` | chart despublicado | `artifacts:publish` | `not_found` / `forbidden` |
| `create_dashboard` | `tools/dashboards.ts:60-83` | `{title(1..200), draftLayout:{filters:[], rows:[]}, departmentId?, visibility?=PRIVATE}` | dashboard criado (inclui `id`) | `artifacts:manage` | `bad_request` (`Invalid dashboard layout: ${formatErrors(...)}`) |
| `update_dashboard` | `tools/dashboards.ts:86-106` | `{dashboardId, title?, draftLayout?, departmentId?, visibility?}` | dashboard atualizado | `artifacts:manage` | mesmo do create |
| `add_chart_to_dashboard` | `tools/dashboards.ts:113-133` | `{dashboardId, chartId, rowId?, span?=6 (1..12), position?, blockId?, props?}` | dashboard atualizado | `artifacts:manage` | `not_found` (chart invisível) |
| `publish_dashboard` | `tools/dashboards.ts:138-153` | `{dashboardId}` | dashboard publicado | `artifacts:publish` | `not_found` / `forbidden` |
| `delete_dashboard` | `tools/dashboards.ts:158-176` | `{dashboardId}` | `{id, deleted: true}` | `artifacts:manage` | `not_found` / `forbidden` |
| `unpublish_dashboard` | `tools/dashboards.ts:181-198` | `{dashboardId}` | dashboard despublicado | `artifacts:publish` | `not_found` / `forbidden` |

> 15 tools totais (não 12). A SKILL e a `mcp-reference.md` falam em **12** porque não contam `delete_chart`, `unpublish_chart`, `delete_dashboard`, `unpublish_dashboard`. ⚠️ Documentação desatualizada.

### Convenção de erros (do `protocol.ts`)

- **Erro de protocolo** (método inexistente, params inválidos) → `error` JSON-RPC com `code` negativo (`-32601`, `-32602`, `-32603`, `-32700`).
- **Erro de execução de tool** → `result.isError=true` com `{error:{code,message}}` em `content`/`structuredContent`. Códices possíveis (de `describeToolError` + cases específicos):
  - `invalid_arguments` (ZodError → formata path+message)
  - `read_only_violation` (SqlGuardError)
  - `query_failed` (PgRunnerError)
  - `contract_violation` (data shape não bate — `transform.ts`/`executor.ts` chamam `validateBlockDataByShape` e formatam `formatErrors(ajvErrors)`)
  - `transform_failed`
  - `introspection_failed`
  - `no_binding` (chart sem draft/publishedDataBinding no modo pedido)
  - `bad_request` (regra de domínio: `Unknown catalogType`, `Invalid props for catalogType`, `connectionId ... does not reference`, `departmentId is required`, `department not found`, `Invalid dashboard layout`)
  - `forbidden`
  - `not_found` (404 — por design, não vaza existência)
  - `unauthorized` (falha de auth)
  - `internal_error`

### Veredito por tool (descrição / clareza de erro)

| Tool | Descrição | Erros | Notas |
|---|---|---|---|
| `list_connections` | ✅ Boa (filtros/paginação/never-returns-password) | ✅ | — |
| `get_connection_schema` | ✅✅ Excelente (fluxo de 2 passos documentado, caps defensivos + hint) | ✅ | Mensagens de erro do pg-runner propagadas via `introspection_failed`. |
| `run_query` | ✅ Excelente (guardrails explícitos: 50 default, 1000 max, SELECT-only) | ✅ | — |
| `list_catalog` | ✅ Boa | ✅ | Sem erros específicos. |
| `create_chart` | ✅ Boa | ⚠️ `bad_request` é genérico (sem sub-códigos) — a IA tem que parsear a `message`. | "Passe `type` para obter um único manifesto" é claro. |
| `update_chart` | ✅ | ⚠️ idem | — |
| `publish_chart` | ✅ curta e clara | ✅ | — |
| `preview_chart_data` | ✅✅ Excelente (cita `state: success/error`, `error.code` exemplos) | ✅✅ | Esta tool é a "rede de segurança" da IA; tudo bem documentado. |
| `delete_chart` / `unpublish_chart` | ✅ | ⚠️ Sem menção explícita de "deleta do banco" / "zera publishedAt" no texto da doc, mas está. | ⚠️ **Não listados na SKILL/mcp-reference.md** — gap de cobertura. |
| `create_dashboard` / `update_dashboard` | ✅ Boa (`draftLayout: {filters, rows}` mostrado) | ✅ Layout inválido retorna `formatErrors` legível. | — |
| `add_chart_to_dashboard` | ✅ Boa (explica `rowId`, `position`, `span`, `props.chartId`) | ⚠️ Falta mensagem explícita pra "chart invisível" — vira `not_found` (404). | OK, é por design. |
| `publish_dashboard` / `delete_dashboard` / `unpublish_dashboard` | ✅ | ⚠️ **Não listados na SKILL/mcp-reference.md** | Gap. |

### Onde a IA pode tropeçar
- **Tool renomeada / esquecida**: `delete_*` e `unpublish_*` existem e são úteis, mas a doc só menciona `publish_*`.
- **Erros de `bad_request` agregados**: quando o catálogo está desatualizado, `Unknown catalogType "x" — not present in the catalog (run build:catalog)` aparece com **a mesma code `bad_request`** que erro de props inválidas ou connection inexistente. A IA tem que parsear a `message` — não há sub-códigos discriminantes.
- **MCP desabilitado** (sem `MCP_API_KEY`): `503` HTTP-level com `error: "mcp_disabled"` — não chega pro JSON-RPC. A IA vê "conexão falhou" em vez de "MCP não configurado".

---

## 2. SKILL atual — "construtor-dashboards"

### Onde está

A skill **NÃO está em `frontend-boilerplate/src/shared/skills/`** nem em `.claude/skills/`. Vive como **documentação portável** em `docs/agente/`:

- `docs/agente/SKILL.md` (13656 bytes) — corpo da skill com frontmatter `name: construtor-dashboards`.
- `docs/agente/rules.md` (6062 bytes) — guardrails (somente leitura, schema antes de SQL, LGPD).
- `docs/agente/mcp-reference.md` (17762 bytes) — cola técnica: transporte/auth, 12 tools, 7 blocos, convenções de query, exemplos end-to-end.
- `docs/agente/README.md` (6308 bytes) — como instalar no Claude Code (pasta `.claude/skills/construtor-dashboards/`) ou em qualquer ferramenta de agente.

**Não há registro via API (`skill_create`/`skill_link_to_agent`)** — é só markdown. O `skill_list` não foi encontrado mapeado no `app-core` (não usei aqui).

### Estrutura interna da SKILL
- §1 Identidade e propósito (atuar em nome de usuário de serviço, só leitura, conferir antes de publicar).
- §2 Modelo mental do domínio (Conexão → Chart → Dashboard; draft vs published; TTL; visibilidade; RBAC).
- §3 Catálogo de blocos → escolha pelo **shape** dos dados (tabela `kpi/bar_chart/line_chart/donut/table/title/rich_text`).
- §4 Fluxo de trabalho em 10 passos (initialize → list → schema → run_query → create → preview → publish → dashboard → IDs).
- §5 Gotcha crítico: `COUNT(*)` retorna string no Postgres → sempre `CAST ::int/::float`.
- §6 Tabela de erros do MCP (`invalid_arguments`, `read_only_violation`, `query_failed`, `contract_violation`, `bad_request`, `forbidden`, `not_found`, `no_binding`).
- §7 Exemplo end-to-end.

### Veredito
- **Cobertura excelente do ponto de vista da IA.** Tem tudo: identidade, regras, mapeamento pedido→shape, fluxo, exemplos, tabela de erros, instalação.
- **⚠️ Desatualizada quanto à escala do catálogo**: a §3 diz "existem 7 tipos" e a `mcp-reference.md` §3 lista exatamente 7 tipos. **Na verdade existem 49** (incluindo Vitrine showcase: `card_hover`, `bento_grid`, `sheet`, `collapsible_block`, `favorites_list`, `flip_words`, `background_beams`, `background_boxes`, `glowing_effect`, `hover_card`, `pin_3d`, `mobius_loop`, `tooltip_card`, `tooltip_fluid`, `resizable_panels`, `expandable_cards`, `dashboard_panel`, `features_section`, `team_section`, `user_list`, `work_experience`, `query_history`, `connection_list`). Isso é um ruído: a IA pode tentar `create_chart` com `catalogType: "bento_grid"` (existe) e funcionar, ou tentar `catalogType: "card_hover"` (também existe) e não entender por que não foi documentada.
- **Falta**: documentação das 4 tools `delete_*`/`unpublish_*`.
- **Falta**: aviso explícito de **CASE-SENSITIVE** em nomes de schema/tabela/coluna do Postgres (só mencionado no playbook do pai). A SKILL diz pra usar `get_connection_schema` mas não alerta pra aspas duplas em `"SCH"."RECEITAS_PORTAL"`.
- **Falta**: `bento_grid` como CONTAINER e a sintaxe `block.blocks` + `span`/`rowSpan` para composição. A SKILL só documenta `add_chart_to_dashboard` (que adiciona 1 chart por vez, sem filhos).
- **Bônus**: a `mcp-reference.md` §5 já mostra layout `{filters, rows}` com `props.chartId` — bom, mas não menciona containers nem `block.blocks`.

---

## 3. CONTRATOS (`shared/contracts`)

### Arquivos
- `shared/contracts/src/schemas/block-manifest.schema.ts` (1975 bytes) — `BlockManifestSchema`.
- `shared/contracts/src/schemas/block-data.schema.ts` (2511 bytes) — `ScalarDataSchema`, `SeriesDataSchema`, `CategoricalDataSchema`, `TableDataSchema`.
- `shared/contracts/src/schemas/dashboard-layout.schema.ts` (5359 bytes) — `DashboardLayoutSchema` + `DashboardConfigSchema`.
- `shared/contracts/src/schemas/data-payload.schema.ts` (2579 bytes) — `BlockDataResultSchema` + `DashboardDataPayloadSchema`.
- `shared/contracts/src/schemas/api-dto.schema.ts` (4078 bytes) — `ApiError`, `DashboardSummary`, `DashboardDetail`, `Create/UpdateDashboardRequest`, `BlockDataRequest`.
- `shared/contracts/src/validation/validator.ts` (5654 bytes) — AJV pré-compilado + `validateBlockDataByShape` + `formatErrors` + `ContractValidationError`.
- `shared/contracts/src/types/index.ts` (5046 bytes) — tipos TS derivados via `json-schema-to-ts`.

### Shapes (campos obrigatórios)

#### `BlockManifest` (`block-manifest.schema.ts:18-37`)
- `type: string (minLen 1)` — catalogType.
- `kind: enum [chart | text | title | layout]`.
- `name: string`.
- `description: string`.
- `source: string` (slug Vitrine `vitrine:...` ou `custom`).
- `propsSchema: object` (opcional).
- `dataContract: {shape: enum [scalar|series|categorical|table], spec: object, example: any}` (opcional — narrativos não têm).
- `defaultProps`, `minColumns`, `maxRows`, `version` (opcionais).

#### `BlockDataResult` (`data-payload.schema.ts:39-65`)
- `blockId, state` (enum `idle|queued|running|success|error`) — OBRIGATÓRIOS.
- `shape, data` — presentes em `state=success`.
- `error: {message, code?}` — presente em `state=error`.
- `meta: {cached?, ttlSeconds?, executedAt?, rowCount?, truncated?, durationMs?}`.

#### `DashboardLayout` (`dashboard-layout.schema.ts:17-44`)
- `filters: Filter[]` e `rows: Row[]` — OBRIGATÓRIOS.
- `Filter`: `{id, type: enum [date_range|select|multiselect|search|number_range], label, default?}`.
- `Row`: `{id, title?, blocks: Block[]}`.
- **`Block` (recursivo, `dashboard-layout.schema.ts:96-127`):**
  - **Obrigatórios:** `id`, `type`, `span` (1..12).
  - **Opcionais:** `title`, `subtitle`, `props`, `dataBinding`, `blocks` (recursivo).
- ⚠️ **Confirmado: `Block` NÃO tem `rowSpan`** no contrato. O FE o lê via cast `(child as {rowSpan?:number}).rowSpan ?? 1` em `block-renderer.tsx`. A IA pode mandar `rowSpan` no JSON — `additionalProperties:false` PROÍBE campos extras → a validação AJV falharia. Mas se a IA omitir, o bento usa `rowSpan=1` por default.

#### `DataBinding` (`dashboard-layout.schema.ts:73-95`)
- **Obrigatórios:** `connectionId`, `query`.
- **Opcionais:** `params: DataBindingParam[]`, `transform: unknown`, `ttlSeconds: integer ≥ 0`.
- ⚠️ O JSON Schema diz `ttlSeconds: {minimum: 0}` mas a Zod no BE (`dataBindingSchema` em `modules/charts/schema.ts:23`) **limita `max(86400)`**. **Contrato e BE divergem**: o contrato aceita `ttlSeconds > 86400`, o BE corta em 86.400. A IA que mandar `999999` vê o contrato validando, e só vê o erro na hora do `create_chart`.

#### `transform` (`backend-boilerplate/src/modules/data/transform.ts`)
- **IDENTIDADE POR CONVENÇÃO** quando `transform` é omitido/empty:
  - `scalar`: coluna `value` (+ opcionais `label`, `unit`, `delta`, `format` se existirem).
  - `series`: colunas `x`, `y` (+ `series`).
  - `categorical`: colunas `label`, `value`.
  - `table`: cada coluna do resultado vira `{key, label, type}` (tipo inferido por OID do Postgres via `pgTypeToColumnType`).
- **DECLARATIVO**: objeto `{value, label, unit, delta, format, x, y, series}` apontando para nomes de coluna do resultado. Sobrescreve convenção.
- Strings/refs nomeadas → identidade (documentado).
- ⚠️ Coerção branda: `toNumberOrNull` tenta `string.trim() !== '' && !isNaN(Number(v))` antes de devolver `null`. Detalhe bom: `bigint` do Postgres é coercido para `Number`. Mas se a coluna não for reconhecida (ex.: `timestamptz`), deixa passar e a validação do shape (`scalar` exige `value: number|null`) reprova.

### Validador (`validation/validator.ts`)

```ts
// Compila todos os schemas via AJV (allErrors:true, strict:false, addFormats).
// Helpers públicos:
validateDashboardLayout(input)
validateDashboardConfig(input)
validateBlockManifest(input)
validateScalarData / validateSeriesData / validateCategoricalData / validateTableData
validateBlockDataResult(input)
validateDashboardDataPayload(input)
validateApiError(input)
validateDashboardSummary / validateDashboardDetail
validateCreate/UpdateDashboardRequest
validateBlockDataRequest

// Descoberta por shape:
validateBlockDataByShape(shape, data) → {valid, errors}

// Formatador:
formatErrors(errors[]) → string // "/path must be X; /props.foo must match Y"

// Exceção:
class ContractValidationError extends Error {
  constructor(label, errors) {
    super(`Contrato inválido (${label}): ${formatErrors(errors)}`);
    this.errors = errors;
  }
}
```

**Exemplo real de mensagem** (de `mcp-reference.md` §6 + `protocol.ts`/`executor.ts`):
- ZodError em `create_chart`: `invalid_arguments: invalid arguments: title: String must contain at least 1 character(s); draftProps: Expected object, received null`
- contract_violation do `preview_chart_data`: `result does not match dataContract (scalar): /value must be number`
- BadRequestError do dashboard layout: `Invalid dashboard layout: /rows/0/blocks/0/span must be <= 12`

A mensagem é **técnica mas parseável**: o AJV usa `instancePath` (JSON pointer) + `message`. A IA consegue extrair `path` e `expected type` mas tem que saber JSON Pointer.

### Veredito
- **Schema é JSON Schema draft-07 puro, sem Zod**: AJV valida. Tipos TS via `json-schema-to-ts` (recursão manual p/ `Block.blocks`).
- **Cobertura boa**: AJV pré-compila `validateDashboardLayout`, `validateBlockDataByShape`, etc. Defensivo (não bloqueia se o `propsSchema` é vazio/quebrado — `lib/catalog.ts:88-102`).
- **⚠️ Divergências contrato↔Zod**:
  - `ttlSeconds`: contrato sem max, Zod `max(86400)`. IA vê `create_chart` aceitar `999999` ou rejeitar com `invalid_arguments`.
  - `Block.rowSpan`: contrato não conhece; FE lê via cast; bento_grid/BlockRenderer aceita.
  - `visibility`: contrato `private|department|org` (lowercase), Zod/charts `PRIVATE|DEPARTMENT|ORG` (UPPERCASE). A `create_chart` Zod schema usa `visibilityEnum = z.enum(['PRIVATE', ...])` — **a IA tem que mandar UPPERCASE** mesmo que o JSON Schema pareça pedir lowercase (o Zod do MCP charts está valendo, não o AJV do contrato).

---

## 4. CATÁLOGO — estado da documentação dos blocos

### Onde fica o JSON coletado

- **Origem:** `frontend-boilerplate/src/shared/render-engine/catalog/<tipo>/manifest.ts` (cada pasta = 1 bloco; auto-registro via `import.meta.glob`).
- **Coletor:** `backend-boilerplate/scripts/build-catalog.ts` (5218 bytes) — varre `CATALOG_DIR` (default `../frontend-boilerplate/src/shared/render-engine/catalog`), importa `manifest.ts`, valida contra `BlockManifestSchema` (AJV), gera `backend-boilerplate/src/catalog/catalog.manifests.json`.
- **Leitor runtime:** `backend-boilerplate/src/lib/catalog.ts` (4686 bytes) — `import catalogFile from '@/catalog/catalog.manifests.json'`. Exporta `listCatalogManifests()`, `getCatalogManifest(type)`, `getCatalogDataShape(type)`, `validatePropsAgainstCatalog(type, props)`.
- **Saída do MCP:** `list_catalog` tool retorna esse array (49 blocos hoje, contando `__example`).

### Lista dos 49 blocos (do `catalog.manifests.json`, `count:49`)

| Type | Kind | Shape | Props ricas (MCP-ready) | Source |
|---|---|---|---|---|
| `__example` | title | — (sem dataContract) | ❌ Fraco (só `label`) | custom |
| `alert` | text | — | ✅ `variant` (6 valores) com `oneOf` descritivo, `title` (required), `description`, `showIcon`, `dismissible` | vitrine:alert |
| `area_chart` | chart | series | ✅ `type`, `fill`, `showLegend`, `showGridLines`, `palette`, `accent` (todos com description) | vitrine:area-chart-tremor |
| `background_beams` | layout | — | ⚠️ Fraco (`title`, `subtitle` sem description, sem nada além) | vitrine:background-beams |
| `background_boxes` | layout | — | ⚠️ Fraco | vitrine:background-boxes |
| `bar_chart` | chart | series | ✅✅ Rico (`stacked`, `orientation`, `accent`, `palette`, `seriesColors`, `valueFormat` enum com oneOf descritivo) | vitrine:bar-chart |
| `bar_list` | chart | categorical | ✅ (`sortOrder`, `palette`, `accent`, `textColor`) | vitrine:bar-list-tremor |
| `bento_grid` | layout | — | ✅ description fala da composição recursiva; `columns`, `gap`, `autoRows` | custom |
| `callout` | text | — | ✅ `variant`, `boxColor`/`textColor` (separados, doc rica), `showIcon` | vitrine:callout-tremor |
| `card_hover` | layout | — | ❌ Fraco (`items[]` sem description, sem `accent`) | vitrine:card-hover-effect |
| `collapsible_block` | layout | — | ⚠️ Mediano (`title` required, `body`, `defaultOpen` sem description) | vitrine:collapsible-section |
| **`connection_list`** | layout | — | **(FANTASMA: NÃO EXISTE A PASTA `catalog/connection_list/`. Resíduo do commit b7eca66.)** |
| `dashboard_panel` | layout | — | ⚠️ Fraco (`title` required sem description, `description`, `body`, `variant`) | vitrine:dashboard-panel |
| `data_table` | chart | table | ❌ Fraco (`pageSize` minimo, `filterPlaceholder`) | vitrine:data-table |
| `divider` | layout | — | ❌ Fraco (`label`, `orientation`) | vitrine:divider-tremor |
| `donut` | chart | categorical | ✅✅ (`showLegend`, `centerLabel`, `palette`, `accent`, `valueFormat` enum com oneOf) | vitrine:donut-chart |
| `expandable_cards` | layout | — | ❌ Fraco (`cards[]` sem description) | vitrine:expandable-cards |
| `favorites_list` | layout | — | ❌ Fraco | vitrine:favorites-list |
| `features_section` | layout | — | ❌ Fraco | vitrine:features-section-with-skeletons |
| `flip_words` | title | — | ⚠️ Mediano (`prefix`, `words`, `duration`) | vitrine:flip-words |
| `glowing_effect` | layout | — | ❌ Fraco | vitrine:glowing-effect |
| `h_bar_chart` | chart | series | ✅✅ (`palette`, `accent`, `valueFormat` enum com oneOf) | vitrine:h-bar-chart |
| `hover_card` | layout | — | ❌ Fraco | vitrine:hover-card |
| `invoice_table` | chart | table | ❌ Fraco (`currency` sem description; tabela de fatura sem doc de colunas esperadas) | vitrine:invoice-table |
| `kpi` | chart | scalar | ✅✅ (`label`, `valueFormat` enum com `auto` + 5 canônicos + oneOf descritivo, `accent`, `icon` enum lucide curado, `showDelta`, `deltaPolarity`) | vitrine:kpi-card |
| `leaderboard` | chart | categorical | ❌ Fraco (`unit` sem description) | vitrine:leaderboard-list |
| `line_chart` | chart | series | ✅ (`smooth`, `area`, `palette`, `accent`) | vitrine:line-chart |
| `metric_glow` | chart | scalar | ✅✅ (`label`, `valueFormat`, `accent`, `showDelta`, `deltaPolarity`) | vitrine:metric-glow-card |
| `mobius_loop` | layout | — | ❌ Fraco (`size`, `speed`) | vitrine:mobius-loop-icon |
| `pin_3d` | layout | — | ❌ Fraco | vitrine:3d-pin |
| `progress_bar` | chart | scalar | ✅ (`max`, `variant`, `accent`, `showValue`) | vitrine:progress-bar-tremor |
| `progress_circle` | chart | scalar | ✅ (`max`, `variant`, `accent`) | vitrine:progress-circle-tremor |
| `query_history` | layout | — | ❌ Fraco | vitrine:query-history-list |
| `radial_gauge` | chart | scalar | ✅ (`max`, `min`, `unit`, `accent`) | vitrine:radial-gauge |
| `resizable_panels` | layout | — | ❌ Fraco (`direction`, `leftLabel`, `rightLabel`) | vitrine:resizable |
| `rich_text` | text | — | ⚠️ Mediano (`markdown` required, sem description) | custom |
| `scatter_chart` | chart | series | ✅ (`showLegend`, `showGridLines`, `palette`, `accent`) | vitrine:scatter-chart-tremor |
| `section` | layout | — | ✅ description fala de composição recursiva; `title` (required), `subtitle`, `variant` (com description) | custom |
| `sheet` | layout | — | ❌ Fraco | vitrine:sheet |
| `signal_card` | chart | series | ✅✅ (`label`, `valueFormat` enum, `accent`, `trendPolarity`, `trendBasis`, `showSparkline`) | vitrine:signal-card |
| `spark_chart` | chart | series | ✅ (`type`, `curveType`, `palette`, `accent`) | vitrine:spark-chart-tremor |
| `stat_tile` | chart | scalar | ✅✅ (`label`, `valueFormat` enum, `accent`, `showDelta`, `deltaPolarity`, `hint`) | vitrine:stat-tile |
| `table` | chart | table | ⚠️ Mediano (`pageSize`, `dense`) | vitrine:data-table |
| `team_section` | layout | — | ❌ Fraco | vitrine:team-section-with-scales |
| `title` | title | — | ⚠️ Mediano (`text` required sem description, `level`, `align`) | custom |
| `tooltip_card` | layout | — | ❌ Fraco | vitrine:tooltip-card |
| `tooltip_fluid` | layout | — | ❌ Fraco | vitrine:tooltip-fluid |
| `user_list` | layout | — | ❌ Fraco | vitrine:user-list-item |
| `work_experience` | layout | — | ❌ Fraco | vitrine:work-experience-component |

### Padrão dos "ricos" (referência: `bar_chart/manifest.ts`, `kpi/manifest.ts`)
- `propsSchema` com `additionalProperties: false`.
- Cada prop tem `description` legível.
- Enums têm **dois formatos coexistindo**: `enum: [...]` (retrocompat com validadores simples) + `oneOf: [{const: 'X', description: '...'}]` (doc por valor p/ MCP/IA).
- AJV aceita `enum` + `oneOf` simultaneamente (validado em runtime).
- `defaultProps` com defaults seguros.
- `dataContract` com `shape`, `spec` (campos esperados), `example` (valor real).

### Veredito
- **8 gráficos + 6 indicadores** têm documentação RICA/MCP-ready (`kpi`, `bar_chart`, `line_chart`, `area_chart`, `donut`, `bar_list`, `h_bar_chart`, `scatter_chart`, `spark_chart`, `progress_bar`, `progress_circle`, `radial_gauge`, `metric_glow`, `stat_tile`, `signal_card`, `alert`, `callout`).
- **Container `section` e `bento_grid`**: descrição boa mas o sistema de composição recursiva (`block.blocks`) **NÃO está documentado na SKILL** — a IA não sabe que pode aninhar.
- **`title`/`rich_text`**: documentação fraca mas são simples (não há muito o que errar).
- **Blocos Vitrine showcase** (`card_hover`, `favorites_list`, `user_list`, `background_beams`, `background_boxes`, `glowing_effect`, `pin_3d`, `mobius_loop`, `features_section`, `team_section`, `work_experience`, `query_history`, `expandable_cards`, `sheet`, `resizable_panels`, `collapsible_block`, `dashboard_panel`, `hover_card`, `tooltip_card`, `tooltip_fluid`): fracos/ausentes em `description`. São decorativos — a IA não deveria usá-los em dashboards analíticos. ⚠️ **Recomendação**: a SKILL deveria dizer "existem estes tipos decorativos no `list_catalog`, mas não use para dashboards de dados — use os 8 gráficos + 6 indicadores".
- **`connection_list` é FANTASMA**: está no JSON gerado mas a pasta não existe. Provavelmente o `build:catalog` precisa rodar de novo para limpar (após delete do commit b7eca66).

---

## 5. RESOLUÇÃO de dados (BE)

### `block-resolver.ts` (`backend-boilerplate/src/modules/data/block-resolver.ts`, 6071 bytes)

- Função principal: `resolveBlocks(layout, mode, ctx, deps) → ResolvedBlock[]`.
- **Percorre layout RECURSIVAMENTE**:
  1. Para cada `row.blocks` do nível raiz, chama `processBlock(block, ...)` (`block-resolver.ts:131-176`).
  2. `processBlock` faz 3 coisas em ordem:
     1. Se `block.id` é string: extrai `chartId` de `props.chartId`.
     2. Tenta normalizar `block.dataBinding` direto. Se vazio e tem `chartId`: carrega chart (`deps.loadChart`), valida visibilidade (`canViewArtifact`), copia `chart.publishedDataBinding` ou `chart.draftDataBinding` conforme `mode`.
     3. Se há binding: carrega connection (`deps.loadConnection`) e revalida visibilidade. **Falha → `errorBlock('forbidden_connection', 'referenced connection not accessible')`.**
     4. **Recursão em `block.blocks` (filhos de containers como `section`/`bento_grid`)** — chama `processBlock(child, ...)` para cada.
  5. Retorna `ResolvedBlock {blockId, type, shape, binding, connectionRecord?, error?}`.

- **Contrato de visibilidade (anti-vazamento de id)**:
  - `forbidden_chart` (chart invisível) e `forbidden_connection` (connection invisível) viram `errorBlock` no resultado — não lançam exceção. O orquestrador trata o erro.
  - `no_binding` quando chart existe mas não tem `publishedDataBinding` no modo pedido.

- **Erros finais** (vistos pelo `preview_chart_data` e pelo batch):
  - `no_binding`, `forbidden_chart`, `forbidden_connection` — códigos no `BlockDataResult.error.code`.

### `executor.ts` (`backend-boilerplate/src/modules/data/executor.ts`, 3438 bytes)

- Função `executeBlockData(input, deps) → BlockDataResult`.
- **Fluxo**: pg-runner (read-only) → `applyTransform(shape, result, transform)` → `validateBlockDataByShape(shape, data)` → BlockDataResult.
- **NUNCA lança**: query falhada → `error.code='query_failed'`. Transform exception → `error.code='transform_failed'`. Resultado fora do contrato → `error.code='contract_violation'` com `formatErrors(ajvErrors)` na mensagem.
- Se `shape === null` (bloco sem dataContract, ex.: narrativos), usa `'table'` como effective shape (não valida).
- `meta`: `{cached, ttlSeconds?, executedAt, rowCount, truncated, durationMs}`.

### `service.ts` (`backend-boilerplate/src/modules/data/service.ts`, 11971 bytes)

- **`buildDashboardData(dashboardId, mode, filters, ctx)`** — orquestra:
  1. `loadLayoutForBatch` → do cache Redis (`dash:{id}:published`) ou do banco.
  2. **Defensivo**: revalida layout com `validateDashboardLayout(layout)`. Falha → `BadRequestError('Invalid dashboard layout: ${formatErrors(...)}')`.
  3. `resolveBlocks(layout, mode, ctx, deps)` — `deps.loadChart` é `prisma.chart.findUnique`, `deps.loadConnection` é `prisma.connection.findUnique`, `deps.resolveShape = getCatalogDataShape`.
  4. `assembleBatch(dashboardId, resolved, mode, filters, realRuntime)` — política de cache/fila:
     - erro de resolução → `state: 'error'` direto.
     - modo `draft` → executa inline (sem cache).
     - modo `published`: TTL>0 + cache HIT → `state: 'success'` (meta.cached=true). MISS → enfileira BullMQ + `state: 'queued'`.

- **`buildChartData(chartId, mode, ctx)`** — versão REST do `preview_chart_data` (consumida pela tela `/charts/:id`). Sempre inline, sem cache/fila. Mesma revalidação de visibilidade.

### `transform.ts` (já descrito em §3)

### `preview_chart_data` (caminho MCP)
- `tools/charts.ts:154-188` — chama `executeBlockData(...)` direto (sem fila), depois devolve o `BlockDataResult` cru.
- Erro de visibilidade → `NotFoundError` → protocolo converte em `error.code='not_found'`.
- Chart sem binding → `{state:'error', error:{code:'no_binding', message:'chart has no ${mode} dataBinding'}}`.

### Rota REST equivalente: `POST /charts/:id/data`
- `backend-boilerplate/src/modules/data/routes/chart-data.ts` (1734 bytes) — body `dashboardDataBodySchema` reusa `{mode, filters}`. Chama `buildChartData(chartId, mode, ctx)`.

### Onde a IA pode errar no fluxo JSON
1. **`draftLayout` com `additionalProperties: false`** no schema do `Block` → qualquer campo desconhecido (incluindo `rowSpan`) reprova a validação AJV. A IA que mandar `{id, type, span, rowSpan:2, ...}` recebe `bad_request: Invalid dashboard layout: /rows/0/blocks/0 must NOT have additional properties`.
2. **`visibility` UPPERCASE**: contrato tem `private|department|org`, Zod valida `PRIVATE|DEPARTMENT|ORG`. Mandar `private` → `invalid_arguments: invalid arguments: visibility: Invalid enum value. Expected 'PRIVATE' | 'DEPARTMENT' | 'ORG'`.
3. **`catalogType` desatualizado** (catálogo gerado tem `connection_list` fantasma) → `Unknown catalogType "x" — not present in the catalog (run build:catalog)`. Sem sub-código de erro.
4. **Resultado do `run_query` com bigint string**: o transform coage automaticamente em `toNumberOrNull` (`transform.ts:30-37`), então mesmo sem `::int` o gráfico valida. Mas a doc da SKILL diz pra fazer CAST — gera dúvida.
5. **`transform` como string**: `transform: "identity"` é aceito pelo `asColumnMap` (`transform.ts:18-21`) mas o comentário diz "transform que não seja objeto → tratado como identidade". A IA pode esperar tratamento especial.
6. **CASE-SENSITIVE em nomes**: `"SCH"."RECEITAS_PORTAL"` precisa de aspas duplas no Postgres. A SKILL não alerta.

---

## 6. Pontos de atenção (resumo executivo)

| # | Risco | Onde | Impacto |
|---|---|---|---|
| 1 | **SKILL/mcp-reference dizem "12 tools e 7 blocos"** mas a realidade é 15 tools e 49 blocos (incluindo Vitrine showcase) | `docs/agente/SKILL.md:54-55` · `docs/agente/mcp-reference.md:122` | IA espera catálogo curto, pode falhar ao descobrir tipos "decorativos" (e.g. `bento_grid`) e ficar confusa |
| 2 | **`create_chart`/`update_chart`/`create_dashboard`/`update_dashboard` retornam `bad_request` GENÉRICO** sem sub-código (catalogType inválido vs props inválidas vs connection inválida vs department inválida) | `modules/charts/service.ts:27-94` · `protocol.ts:96-100` | IA tem que parsear `message` (regex/string-match) — pode falhar |
| 3 | **`Block` no contrato NÃO tem `rowSpan`** mas o FE aceita via cast (`block-renderer.tsx`) | `shared/contracts/src/types/index.ts:60-71` · `shared/contracts/src/schemas/dashboard-layout.schema.ts:96-127` (sem `rowSpan` no schema) | IA manda `rowSpan:2` no JSON → `BadRequestError: Invalid dashboard layout: ... must NOT have additional properties`. IA OMITE → bento usa `rowSpan=1`. Há inconsistência FE↔contrato. |
| 4 | **`Block` no contrato NÃO tem `blocks`/`renderChild` no TIPO** mas o JSON Schema do `dashboard-layout` SIM permite `blocks` recursivo; o FE passa via props ad-hoc `childBlocks`+`renderChild` | `shared/contracts/src/types/index.ts:60-71` (sem `childBlocks`/`renderChild`); `shared/render-engine/types.ts` (extensão do tipo no FE) | Contrato formal não conhece composição recursiva de containers — IA lê `Block` e acha que não dá pra aninhar |
| 5 | **`visibility` case mismatch** (contrato lowercase, Zod UPPERCASE) | `shared/contracts/src/schemas/dashboard-layout.schema.ts:84` vs `modules/charts/schema.ts:23` | IA que seguir o contrato (`private`) falha no `create_chart` |
| 6 | **`ttlSeconds` sem max no contrato** mas `max(86400)` no Zod | `shared/contracts/src/schemas/dashboard-layout.schema.ts:93` vs `modules/charts/schema.ts:25` | IA manda `999999` → contrato aceita mas Zod corta |
| 7 | **Catálogo gerado tem `connection_list` FANTASMA** (pasta deletada mas JSON não foi regenerado) | `backend-boilerplate/src/catalog/catalog.manifests.json` (entrada `connection_list`) | IA pode tentar `create_chart` com esse tipo e receber erro genérico de catalogType |
| 8 | **CASE-SENSITIVE em nomes de schema/tabela/coluna Postgres** não documentado na SKILL | `docs/agente/SKILL.md` (sem menção) | IA gera `SELECT * FROM sch.receitas` em vez de `SELECT * FROM "SCH"."RECEITAS_PORTAL"` → `query_failed` |
| 9 | **`preview_chart_data` retorna `no_binding`** com `message: "chart has no ${mode} dataBinding"` — não diz qual modo estava sendo pedido | `tools/charts.ts:174-181` | Mensagem clara o suficiente, mas não diz se o chart tem OUTRO modo com binding |
| 10 | **Blocos Vitrine showcase** (30+ tipos) com `propsSchema` FRACO sem `description` | `frontend-boilerplate/src/shared/render-engine/catalog/{card_hover,favorites_list,...}` | IA descobre via `list_catalog` e não sabe o que cada prop faz |
| 11 | **`add_chart_to_dashboard` requer `artifacts:manage`** mas o BE retorna `not_found` (não `forbidden`) se o chart não é visível ao ator — não explica | `tools/dashboards.ts:135` · `modules/dashboards/service.ts` | Mensagem `not_found: Chart not found` é confusa quando o chart existe mas é de outro departamento |
| 12 | **`get_connection_schema` no passo 1 SEM `tables`** devolve lista leve; **passo 2** com `tables` detalha colunas; IA pode chamar passo 2 sem ter chamado passo 1, e o BE aceita | `tools/connections.ts:113-225` | Mensagem OK, mas a IA pode receber 1500 colunas de uma vez se pedir tudo sem `search`/`schema` |
| 13 | **`formatErrors` é AJV puro** (`/path must be number`), não humaniza | `shared/contracts/src/validation/validator.ts:104-110` | Aceitável para IA (parseável), mas pouco amigável para humanos |
| 14 | **`rowSpan` não documentado em lugar nenhum** mas o bento_grid já funciona com ele | `bento_grid/manifest.ts:26-32` (exemplo no comment), `shared/render-engine/block-renderer.tsx` (cast) | IA que segue a SKILL literalmente não descobre a sintaxe de containers |

---

## 7. Lacunas (o que não consegui confirmar / não foi encontrado)

- **Registro da skill via API**: o `skill_list`/`skill_get` pode mapear a skill `construtor-dashboards` mas **não foi mapeado aqui**. A SKILL só vive como markdown portável em `docs/agente/`. Se a plataforma app-core tem `skill_create`/`skill_link_to_agent`, o conteúdo dessa pasta é o candidato a virar SKILL formal.
- **Tela `/charts/:id`** — mencionada na skill/conhecimento como "playground", tem `chart-detail-page.tsx` no FE (`features/charts/`) — não explorado nesta rodada (fora do escopo).
- **Fluxo de `share`/`public`** — não explorado. Pode afetar `preview_chart_data` se a IA criar `SHARE` em vez de `PUBLISH`.
- **Build do `shared/contracts/dist`**: o `playbook do pai` diz que o `dist/` é versionado e tem que ser rebuildado quando o schema mudar. **Não verifiquei se o `dist/` commitado bate com o `src/`**. Pode causar drift se alguém mudar schema sem rebuild.
- **Endpoint `tools/list` em produção**: o `sandbox_start_process` não foi usado (read-only). Não rodei `tools/list` ao vivo para confirmar que as 15 tools aparecem corretamente e sem `__example` no catálogo público (hoje `__example` está no JSON gerado e pode aparecer em `list_catalog`).

---

## 8. Mapa do fluxo IA → JSON validado → render

```
[IA via MCP]
  ↓
1. tools/list → descobre 15 tools
  ↓
2. list_catalog → descobre 49 tipos de bloco (com dataContract + propsSchema)
  ↓
3. list_connections → descobre connections (RBAC + visibilidade)
  ↓
4. get_connection_schema (passo 1: lista; passo 2: colunas) — ANTI-ESTOURO DE CONTEXTO
  ↓
5. run_query (preview ≤ 50 linhas, maxRows 1000) — read-only
  ↓
6. create_chart {title, catalogType, draftProps, draftDataBinding{connectionId, query, transform?, ttlSeconds?}, visibility}
  ├─ Zod parse: inputSchema Zod do MCP (tools/charts.ts:59-77)
  ├─ assertPermission('artifacts:manage') → gate RBAC
  ├─ assertValidCatalogType → hasCatalogType(type)?  ← LE catalog.manifests.json
  ├─ assertValidProps → validatePropsAgainstCatalog(type, props)  ← AJV do propsSchema
  ├─ assertValidDataBinding → prisma.connection.findUnique  ← EXISTE no banco?
  ├─ assertDepartmentAccess → checa visibilidade × dept × membership
  └─ prisma.chart.create
  ↓
7. preview_chart_data {chartId, mode:'draft'}
  ├─ requireChartForView (visibilidade)
  ├─ get binding (draft|published)
  ├─ requireConnectionForUse (visibilidade)
  ├─ getCatalogDataShape(type) ← LE catalog.manifests.json
  └─ executeBlockData:
       ├─ pg-runner.runQuery → SELECT ... retorna {columns, rows, rowCount, truncated, durationMs}
       ├─ applyTransform(shape, result, transform) → identity by convention OU declarativo
       │     - scalar: {value, label?, unit?, delta?, format?}
       │     - series: [{x, y, series?}]
       │     - categorical: [{label, value}]
       │     - table: {columns:[{key,label,type}], rows}
       └─ validateBlockDataByShape(shape, data) ← AJV
            ├─ ok → state:'success', data
            └─ !ok → state:'error', error.code='contract_violation', message=`result does not match dataContract (${shape}): ${formatErrors(errors)}`
  ↓
8. publish_chart {chartId} — copy draft → published
  ↓
9. (OPCIONAL) create_dashboard {title, draftLayout:{filters, rows:[{id, blocks:[...]}], ...}, visibility}
  ├─ Zod parse
  ├─ validateDashboardLayout(draftLayout) ← AJV do BlockManifest
  └─ prisma.dashboard.create
  ↓
10. (OPCIONAL) add_chart_to_dashboard {dashboardId, chartId, span?, rowId?, position?}
   └─ cria bloco com type=catalogType do chart, props.chartId=chartId
  ↓
11. publish_dashboard — copy draft → published
  ↓
12. UI renderiza dashboard → batch POST /dashboards/:id/data
   ├─ loadLayoutForBatch (cache Redis ou banco)
   ├─ resolveBlocks (RECURSIVO em block.blocks de containers!)
   │     └─ revalida visibilidade de chart/connection referenciados
   ├─ assembleBatch (cache HIT/MISS/fila)
   └─ resultado: DashboardDataPayload {dashboardId, blocks: Record<blockId, BlockDataResult>}
  ↓
13. FE renderiza via BlockRenderer (kind=chart + !SELF_CONTAINED → moldura ChartWidget; kind=layout/SELF_CONTAINED → sem moldura)
```

### Onde a IA mais erra (ranking)
1. **Visibility em UPPERCASE** (Zod vs JSON Schema) — pega toda chamada de create_chart/update_dashboard.
2. **Catálogo desatualizado** (`connection_list` fantasma) — pega quem consulta `list_catalog` e tenta usar.
3. **Blocos Vitrine showcase sem description** — IA pode tentar usar sem saber o que cada prop faz.
4. **`bad_request` genérico** — quando a IA erra props/catalogType/connection, recebe mensagem longa sem sub-código.
5. **`rowSpan` em Block** — se a IA descobrir o bento_grid e tentar usar `rowSpan`, contrato rejeita.
6. **CASE-SENSITIVE em SQL** — não documentado.
7. **Tools `delete_*`/`unpublish_*` não estão na SKILL** — IA pode existir mas não saber.
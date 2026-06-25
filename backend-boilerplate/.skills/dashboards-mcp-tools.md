---
name: dashboards-mcp-tools
description: Sub-skill de referência das 15 tools do servidor MCP do Construtor de Dashboards: conexões (list_connections, get_connection_schema, run_query), catálogo (list_catalog), charts (create/update/publish/preview/delete/unpublish), dashboards (create/update/add_chart/publish/delete/unpublish). Para cada tool: objetivo, input, output, ordem no fluxo, pré-requisitos e permissão RBAC.
---

# Tools do MCP - referência completa (15 tools)

> Sub-skill da **construtor-dashboards**. O servidor MCP expõe **15 tools** em 4
> grupos. Auth: `Authorization: Bearer <MCP_API_KEY>`. Erros de execução voltam
> como `result.isError=true` com `{ error: { code, message, detail? } }` (NÃO como
> erro de protocolo) - ver sub-skill **dashboards-erros**. Permissões RBAC do ator
> de serviço: `connections:use`, `artifacts:view`, `artifacts:manage` (CRUD),
> `artifacts:publish` (publish/unpublish).

## Grupo A - Conexões (read-only)

### 1. `list_connections`  - perm: `connections:use`
- OBJETIVO: lista as conexões de banco visíveis ao ator (respeita RBAC/visibilidade).
- INPUT: `{ search?, page=1, pageSize=50 (1..100) }`.
- OUTPUT: `{ connections:[{ id, name, type, host, database, visibility, status }], total, page, pageSize, totalPages }`. Nunca retorna senha.
- ORDEM: passo 1 da descoberta - pegue o `connectionId`.

### 2. `get_connection_schema`  - perm: `connections:use`
- OBJETIVO: introspecta tabelas/colunas para você montar o SQL - em 2 PASSOS (anti-estouro de contexto).
- INPUT: `{ connectionId, tables?, search?, schema?, page=1, pageSize=200 (máx 500), refresh? }`.
- PASSO 1 (sem `tables`): `{ mode:"tables", tables:[{schema,name,columnCount}], total, page, pageSize, totalPages, truncated?, hint? }` - só a LISTA, sem colunas.
- PASSO 2 (com `tables:["schema.tabela",...]`): `{ mode:"columns", tables:[{schema,name,columns:[{name,dataType,nullable}]}], notFound?, truncated?, hint? }` - colunas só das tabelas pedidas (cap 50 tabelas/1500 colunas por chamada).
- ORDEM: passo 2 da descoberta, ANTES de qualquer SQL. NUNCA peça colunas de todas as tabelas de uma vez.
- ERROS: `introspection_failed`.

### 3. `run_query`  - perm: `connections:use`
- OBJETIVO: executa SELECT/WITH read-only de PREVIEW (não persiste) p/ inspecionar dados antes de criar o chart.
- INPUT: `{ connectionId, sql, params?, maxRows=50 (máx 1000) }`.
- OUTPUT: `{ columns:[{name,dataTypeID}], rows, rowCount, truncated, durationMs }`.
- GUARDRAILS: só SELECT/WITH; INSERT/UPDATE/DELETE/DDL e múltiplos statements rejeitados; statement_timeout; teto de linhas.
- ERROS: `read_only_violation` (não-SELECT), `query_failed` (erro de SQL).

## Grupo B - Catálogo

### 4. `list_catalog`  - perm: nenhuma específica
- OBJETIVO: lista os manifestos dos tipos de bloco (com `propsSchema` + `dataContract` + `defaultProps`).
- INPUT: `{ type? }` (com `type`, retorna só esse manifesto).
- OUTPUT: `{ blocks: BlockManifest[], total }`.
- ORDEM: SEMPRE antes de `create_chart`/montar layout. É a fonte da verdade dos tipos e shapes.

## Grupo C - Charts (CRUD + preview)

### 5. `create_chart`  - perm: `artifacts:manage`
- OBJETIVO: cria um gráfico em DRAFT.
- INPUT (obrigatórios): `{ title, catalogType, draftProps, draftDataBinding:{ connectionId, query, params?, transform?, ttlSeconds? (0..86400) } }` + `departmentId?`, `visibility?=PRIVATE` (UPPERCASE).
- OUTPUT: o chart criado (inclui `id`, status=DRAFT).
- ORDEM: depois de `list_catalog` + `list_connections` + `run_query`.
- ERROS (bad_request + detail): `unknown_catalog_type`, `invalid_props`, `unknown_connection`, `missing_department`; `invalid_arguments`; `forbidden`.

### 6. `update_chart`  - perm: `artifacts:manage`
- OBJETIVO: edita campos DRAFT (título/props/dataBinding/visibilidade). Não altera o publicado.
- INPUT: `{ chartId, ...campos a alterar }`. Só o dono/ADMIN.
- ERROS: `not_found`, `forbidden`, + mesmos detail do create.

### 7. `preview_chart_data`  - perm: `artifacts:view`
- OBJETIVO: executa o dataBinding e devolve o resultado JÁ no shape do dataContract - REDE DE SEGURANÇA antes de publicar.
- INPUT: `{ chartId, mode?=draft }` (`draft` usa o rascunho; `published` usa o publicado).
- OUTPUT: `BlockDataResult { blockId, state:"success"|"error", shape?, data?, meta?, error?:{code,message} }`.
- ORDEM: SEMPRE entre create/update e publish.
- ERROS no `error.code`: `no_binding`, `query_failed`, `contract_violation`, `transform_failed`; visibilidade vira `not_found`.

### 8. `publish_chart`  - perm: `artifacts:publish`
- OBJETIVO: copia DRAFT->PUBLISHED, marca `publishedAt`/status=PUBLISHED.
- INPUT: `{ chartId }`. Só depois do preview confirmar `state:"success"`. Confirme com o usuário.
- ERROS: `not_found`, `forbidden`.

### 9. `delete_chart`  - perm: `artifacts:manage`
- OBJETIVO: remove o chart permanentemente. INPUT: `{ chartId }`.
- CUIDADO: dashboards que referenciam o chartId ficam com bloco órfão até você ajustar via `update_dashboard`.
- OUTPUT: `{ id, deleted:true }`. ERROS: `not_found`, `forbidden`.

### 10. `unpublish_chart`  - perm: `artifacts:publish`
- OBJETIVO: zera o publicado e volta status p/ DRAFT (continua existindo como rascunho). INPUT: `{ chartId }`.
- ERROS: `not_found`, `forbidden`.

## Grupo D - Dashboards (CRUD + publish)

### 11. `create_dashboard`  - perm: `artifacts:manage`
- OBJETIVO: cria um dashboard em DRAFT com layout `{ filters, rows }`.
- INPUT (obrigatórios): `{ title, draftLayout:{ filters:[], rows:[{ id, blocks:[{ id, type, span?, props? }] }] } }` + `departmentId?`, `visibility?=PRIVATE`.
- DICA: crie vazio (`{ filters:[], rows:[] }`) e use `add_chart_to_dashboard` depois.
- OUTPUT: dashboard criado (`id`, status=DRAFT).
- ERROS (bad_request + detail): `invalid_layout`, `unknown_chart_ref`, `missing_department`; `forbidden`.

### 12. `update_dashboard`  - perm: `artifacts:manage`
- OBJETIVO: edita campos DRAFT (título/layout/visibilidade). Não altera o publicado.
- INPUT: `{ dashboardId, ...campos }`. `draftLayout` segue o contrato. Use p/ rows vazias, blocos narrativos e containers com `block.blocks`.
- ERROS: `not_found`, `forbidden`, + detail do create.

### 13. `add_chart_to_dashboard`  - perm: `artifacts:manage`
- OBJETIVO: insere um bloco que referencia um chart no layout DRAFT (jeito mais simples).
- INPUT: `{ dashboardId, chartId, rowId?, span?=6, position?, blockId?, props? }`. `rowId` omitido -> nova row ao final. O bloco nasce com type=catalogType do chart e props.chartId.
- ERROS: `not_found` (dashboard OU chart inexistente/invisível - chart de outro depto aparece como not_found, não forbidden), `forbidden`, `bad_request` detail=`row_not_found`.

### 14. `publish_dashboard`  - perm: `artifacts:publish`
- OBJETIVO: copia draftLayout->publishedLayout, MATERIALIZA snapshot dos dados (executa os dataBindings), marca publishedAt e invalida cache.
- INPUT: `{ dashboardId }`. Confirme com o usuário antes.
- ERROS: `not_found`, `forbidden`, `bad_request` detail=`invalid_layout`.

### 15. `delete_dashboard` / `unpublish_dashboard`  - perm: `artifacts:manage` / `artifacts:publish`
- `delete_dashboard { dashboardId }` -> `{ id, deleted:true }` (charts referenciados NÃO são deletados).
- `unpublish_dashboard { dashboardId }` -> zera o publicado/snapshot, volta a DRAFT, invalida cache (inclusive link público).
- ERROS (ambos): `not_found`, `forbidden`.

## Ordem canônica do fluxo
`list_catalog` -> `list_connections` -> `get_connection_schema` (2 passos) ->
`run_query` -> `create_chart` -> `preview_chart_data` -> `publish_chart` ->
`create_dashboard` -> (`update_dashboard` rows/narrativos) -> `add_chart_to_dashboard` ->
`publish_dashboard`. Limpeza opcional: `unpublish_*` -> `delete_*`.

## TTL (cache do modo published)
`draftDataBinding.ttlSeconds`: `0` = tempo real; `300` = 5 min; `3600` = 1 h
(default conservador); `86400` = diário (máximo). Pergunte a frequência ao usuário.

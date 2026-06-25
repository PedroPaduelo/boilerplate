---
name: dashboards-erros
description: Sub-skill de validação e tratamento de erros do Construtor de Dashboards: preview_chart_data antes de publish; tabela completa de códigos de erro (invalid_arguments, read_only_violation, query_failed, contract_violation, bad_request + sub-códigos detail, forbidden, not_found, no_binding, transform_failed) e como corrigir cada um; armadilhas reais (case-sensitivity, bigint->string, aninhamento de props, visibility UPPERCASE).
---

# Validação & Erros - diagnosticar e corrigir

> Sub-skill da **construtor-dashboards**. O MCP devolve erros de execução como
> `result.isError=true` com `{ error: { code, message, detail? } }` - NÃO ignore.
> O `code` é genérico; o `detail` (quando presente) é o SUB-CÓDIGO que discrimina
> a causa sem você ter que parsear a mensagem. A `message` traz os caminhos JSON
> do validador (AJV) quando for o caso.

## 0. ERROS QUE NÃO PODEM ACONTECER (todos preveníveis - LEIA PRIMEIRO)

Estes erros JÁ aconteceram em produção e são **100% evitáveis ANTES de criar o
chart**. Se você está prestes a criar/publicar um chart sem ter feito as 4
validações abaixo, PARE. Um dashboard NÃO pode ir ao ar com bloco quebrado por
algo que dava para checar com uma query.

**Regra mãe: TODA query vai PRIMEIRO no `run_query` - a query COMPLETA, exata, que
você vai colocar no chart. Não a "ideia" dela; a query literal.** O `run_query`
executa de verdade e pega coluna inexistente, shape errado, encoding e timeout
ANTES de você criar o chart. Pular isso é a causa de TODOS os erros abaixo.

| Erro real visto | Causa | Como prevenir (obrigatório) |
|---|---|---|
| `column "X" does not exist` | assumiu uma coluna que não existe (ou viu numa consulta de `information_schema` que MISTURAVA várias tabelas com `IN (...)`) | valide a coluna NA TABELA específica: `SELECT "X" FROM "SCH"."TABELA" LIMIT 1`. NUNCA confie em `information_schema ... WHERE table_name IN (...)` (mistura colunas de tabelas diferentes). Confirme coluna por tabela. |
| `result does not match dataContract (series): /0 must have required property 'x'` | usou colunas `label,value` num bloco de shape **series** (que exige `x,y`) | conheça o shape do bloco (ver §6 e a skill catálogo). `bar_chart`, `h_bar_chart`, `line_chart`, `area_chart`, `scatter_chart`, `spark_chart`, `signal_card` = **series** (`x,y`). Só `donut`, `bar_list`, `leaderboard` = **categorical** (`label,value`). h_bar PARECE categórico mas é series. |
| `character with byte sequence 0xe2 0x80 0x94 in encoding "UTF8" has no equivalent in encoding "LATIN1"` | literal de string na query tinha caractere tipográfico Unicode (travessão `-`, seta `>`, reticências `...`, aspas curvas `" " ' '`, bullet `*`) e o banco é **LATIN1** | NUNCA use esses caracteres em literais SQL. Use ASCII: `-` em vez de travessão, `->` em vez de seta, `...` em vez de reticências. Acentos latinos normais (á é í ó ú ã õ ç à â ê ô) SÃO válidos em LATIN1. Cheque o encoding: `SELECT pg_encoding_to_char(encoding) FROM pg_database WHERE datname=current_database();` |
| `canceling statement due to statement timeout` | query pesada (COUNT(DISTINCT)/GROUP BY sobre milhões) demorou demais | meça com `run_query` (o resultado traz `durationMs`). Se > ~10s, OTIMIZE (ver skill query §perf): troque COUNT(DISTINCT) por COUNT(*) quando houver chave única; use `FILTER` p/ uma passada em vez de N scans; agregue uma vez e transponha com `unnest`. |

**Quando NÃO dá para fazer (é legítimo dizer "não consigo"):** se o dado NÃO
existe na base (tabela/coluna ausente, ou tabela vazia de verdade - confirmada
com `COUNT(*)`, não com `pg_stat`), aí sim você reporta ao usuário "não há fonte
para X nesta conexão". Isso é aceitável. O que é INADMISSÍVEL é o bloco quebrar
por coluna/shape/encoding que dava para validar.

## 1. Regra de ouro: `preview_chart_data` ANTES de `publish_chart`

SEMPRE rode `preview_chart_data { chartId, mode:"draft" }` e confirme
`state:"success"` com o `shape` esperado antes de publicar. Se `state:"error"`,
corrija pelo `error.code` e reconfirme. Nunca publique no escuro. O mesmo vale
para o dashboard: confira TODOS os charts (preview success) antes de
`publish_dashboard`. Um chart publicado quebrado = bloco com erro na tela do
usuário.

## 2. Tabela de erros (code -> causa -> correção)

| code | detail | significado | como corrigir |
|---|---|---|---|
| `invalid_arguments` | - | argumentos fora do schema Zod da tool (tipo/forma errados) | leia a mensagem (cita o campo); ex.: `visibility` precisa ser UPPERCASE; `span` 1..12; números como number, não string; `showDelta`/`pageSize` boolean/integer LIMPOS (não string) |
| `read_only_violation` | - | query não é SELECT/WITH (ou múltiplos statements) | reescreva como um único SELECT/WITH |
| `query_failed` | - | erro de SQL: coluna/relação inexistente, permission denied, **timeout** ou **encoding LATIN1** | confira nomes via `run_query` na tabela específica; aspas duplas p/ maiúsculas; sem caracteres tipográficos Unicode em literais; otimize se for timeout (ver §0) |
| `contract_violation` | - | o resultado não bate com o `dataContract` do bloco | renomeie as colunas do SELECT conforme o shape (`value`/`x,y`/`label,value`) ou ajuste o `transform`; CAST p/ number. A mensagem traz o caminho (ex.: `/0 must have required property 'x'` = era series e você mandou label/value) |
| `transform_failed` | - | o `transform` declarativo quebrou ao mapear | revise os nomes de coluna do transform; prefira renomear no SQL |
| `no_binding` | - | o chart não tem dataBinding no `mode` pedido | crie/edite o draft (`create_chart`/`update_chart`); ou tente o outro `mode` |
| `bad_request` | `unknown_catalog_type` | catalogType não existe no catálogo | use `list_catalog` e copie o campo `type` exato |
| `bad_request` | `invalid_props` | `draftProps` fora do `propsSchema` | corrija os caminhos citados; respeite enums fechados e `additionalProperties:false` (sem props extras); valores number/boolean LIMPOS (não string) |
| `bad_request` | `unknown_connection` | `connectionId` inexistente | pegue um id válido com `list_connections` |
| `bad_request` | `missing_department` | `visibility=DEPARTMENT` sem `departmentId` | informe `departmentId` ou troque p/ PRIVATE/ORG |
| `bad_request` | `department_not_found` | departmentId não existe / não é membro | confirme o departmentId |
| `bad_request` | `invalid_layout` | layout fora do contrato DashboardLayout | corrija os caminhos JSON (ex.: `/rows/0/blocks must be array`, `/rows/0/blocks/0/span must be <= 12`); `row.blocks` é ARRAY; `type`=catalogType, `span` 1..12 |
| `bad_request` | `unknown_chart_ref` | `props.chartId` aponta p/ chart inexistente | crie o chart antes (`create_chart`) e use um id visível |
| `bad_request` | `row_not_found` | `rowId` informado não existe no layout | omita `rowId` (cria nova row) ou use um rowId existente |
| `forbidden` | - | RBAC: ator sem a permissão necessária | NÃO insista; explique ao usuário (falta artifacts:manage/publish/connections:use) |
| `not_found` | - | id inexistente OU sem visibilidade (não vaza existência) | confira o id; lembre que artefato de outro depto aparece como not_found, não forbidden |
| `introspection_failed` | - | falha ao introspectar o schema da conexão | a conexão pode estar fora/sem permissão; tente `refresh:true` ou outra conexão |

## 3. Armadilhas reais (já vividas - não repita)

### 3.1 Case-sensitivity do Postgres
Identificadores maiúsculos/custom são case-sensitive. `SELECT * FROM SCH.RECEITAS`
vira `sch.receitas` e dá `query_failed`. Use aspas duplas em schema, tabela E
colunas: `"SCH"."RECEITAS_PORTAL"`, `"VALOR_PREVISTO"`. Vale também no
`get_connection_schema.tables`.

### 3.2 bigint/numeric como string
`COUNT(*)`/`SUM(...)` e colunas `numeric` chegam como **string** no node-pg. A
plataforma coage p/ number, mas SEMPRE faça CAST (`::int`/`::numeric`) - evita
`contract_violation` por tipo e garante precisão.

### 3.3 Encoding do banco (LATIN1 e afins)
Muitos bancos legados de prefeitura são **LATIN1**, não UTF-8. Caracteres
tipográficos Unicode em LITERAIS de string da query (travessão `-`, seta `>`,
reticências `...`, aspas curvas `" " ' '`, bullet `*`) quebram com
`query_failed: ... has no equivalent in encoding "LATIN1"`. Use ASCII puro nos
literais (`-`, `->`, `...`, `"`). Acentos do português (á é í ó ú ã õ ç) são OK em
LATIN1. Na dúvida, cheque:
`SELECT pg_encoding_to_char(encoding) FROM pg_database WHERE datname=current_database();`

### 3.4 Lógica de NULL em flags booleanas
`coluna = false` NÃO pega linhas onde a coluna é `NULL` (`NULL = false` é UNKNOWN).
Em flags que podem ser nulas (ex.: `CANCELADO`), use `coluna IS NOT TRUE` (pega
false E null) ou `COALESCE(coluna,false) = false`. Sintoma do erro: KPI retorna
`0` inesperado. SEMPRE valide a contagem com `run_query` antes de confiar.

### 3.5 `pg_stat_user_tables.n_live_tup` é ESTIMATIVA (pode mentir)
`n_live_tup` vem do autovacuum e pode estar desatualizado (mostrar `0` numa
tabela com centenas de milhares de linhas). NUNCA decida "tabela vazia" por
`pg_stat`. Confirme com `SELECT COUNT(*) FROM "SCH"."TABELA"`. Use `pg_stat` só
como dica grosseira de quais tabelas têm volume.

### 3.6 Aninhamento de `props` (MCP client serializa errado)
Passar arrays aninhados (`words: [["a","b","c"]]`) quebra o componente no render
(ex.: `flip_words`: `split is not a function`). Mantenha `props` em UM nível:
`words: ["a","b","c"]`.

### 3.7 visibility UPPERCASE / números limpos
`visibility` é UPPERCASE (`PRIVATE|DEPARTMENT|ORG`). `draftProps` numéricos/
booleanos devem ir como number/boolean limpos (`{ max: 100 }`, `{ showLegend: true }`),
nunca string. String em campo number/boolean -> `invalid_props`/`invalid_arguments`.

### 3.8 contract_violation por coluna mal nomeada (a nº 1)
A causa nº 1 de `contract_violation` é a coluna do SELECT não seguir a convenção
do shape. scalar precisa de `value`; **series de `x` e `y`**; categorical de
`label` e `value`. Renomeie com `AS` ou use `transform` declarativo. ATENÇÃO ao
`h_bar_chart`: é series (`x,y`), não categorical.

### 3.9 permission denied por schema
Nem todo schema é acessível (RBAC do banco). `query_failed: permission denied for
schema X` -> tente outro schema; não insista.

## 4. Loop de correção recomendado (à prova de erro)
1. **`run_query` com a query COMPLETA e exata** - valida coluna, shape (nomes das
   colunas), encoding e tempo (`durationMs`) ANTES de criar o chart. Se falhar
   aqui, corrija aqui - nunca crie um chart com query não testada.
2. `create_chart` -> se `bad_request`, leia o `detail` e a `message`, corrija, `update_chart`.
3. `preview_chart_data` -> se `error`, trate o `error.code` (geralmente `contract_violation`
   = colunas/CAST/shape), `update_chart`, reconfirme até `state:"success"`.
4. Só então `publish_chart`. Para dashboard: TODOS os charts em `success` antes de `publish_dashboard`.

## 5. Confirmação do usuário (ações com efeito)
Confirme com o usuário antes de `publish_chart`, `publish_dashboard`, `delete_*` e
`unpublish_*` - têm efeito visível/compartilhável. Ao terminar, devolva os IDs
(`chartId`, `dashboardId`) e um resumo curto.

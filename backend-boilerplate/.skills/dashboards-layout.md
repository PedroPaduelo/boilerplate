---
name: dashboards-layout
description: Sub-skill de composição de LAYOUT para o Construtor de Dashboards: hierarquia dashboard->row->bloco->container; grade de 12 colunas (span) e altura (rowSpan); sintaxe unificada de containers via block.blocks (TODOS os containers - section, bento_grid, dashboard_panel, collapsible_block, resizable_panels, expandable_cards, sheet - aninham filhos; divider é separador); add_chart_to_dashboard vs JSON manual; blocos narrativos no layout; visibility UPPERCASE.
---

# Composição de Layout - montando a página do dashboard

> Sub-skill da **construtor-dashboards**. Aqui você aprende a montar o
> `draftLayout` de um dashboard: a hierarquia, a grade, os containers e o jeito
> robusto de inserir charts. O layout é validado contra o contrato
> `DashboardLayout` (`@dashboards/contracts`) - fora dele -> `bad_request`
> detail=`invalid_layout`.

## 1. Hierarquia

```
Dashboard  ->  layout { filters: [], rows: [...] }
   Row      ->  { id, title?, blocks: [...] }          (1 faixa horizontal)
     Block  ->  { id, type, span, rowSpan?, props?, dataBinding? }
        └─ Container (section, bento_grid, etc.) -> block.blocks: [ ...Blocks filhos... ]
```

- **Dashboard**: o topo. `layout = { filters, rows }` (ambos obrigatórios, podem
  ser `[]`).
- **Row**: uma faixa. `{ id, blocks: [] }`. A row distribui os blocos numa **grade
  de 12 colunas**.
- **Block**: a unidade. Campos: `id` (obrigatório), `type` (= catalogType do
  `list_catalog`), `span` (1-12, largura na grade), `rowSpan` (altura no mosaico,
  default 1), `props` (visuais), `dataBinding` (inline) OU `props.chartId`
  (referência a um chart - caminho recomendado).
- **Container**: um block de `type` container (ver §4) que tem `block.blocks`
  (filhos). Os filhos seguem a MESMA sintaxe (span/rowSpan).

## 2. A grade de 12 colunas (`span`) e a altura (`rowSpan`)

- `span` = quantas das 12 colunas o bloco ocupa. Numa row, os spans somam até 12
  por linha visual (passou de 12 -> quebra). Ex.: 4 KPIs lado a lado -> `span: 3`
  cada; gráfico principal + lateral -> `span: 8` + `span: 4`.
- `rowSpan` = altura (nº de linhas do mosaico). Default 1. Faz efeito visual
  dentro de containers de mosaico (bento_grid) e no grid recursivo.
- O contrato já conhece `rowSpan` (formalizado no `Block`) - pode mandar
  `rowSpan: 2` sem medo de `invalid_layout`.

## 3. Sintaxe UNIFICADA de containers (`block.blocks`)

Containers reais dispõem os filhos que você declara em `block.blocks`. A sintaxe
dos filhos é SEMPRE a mesma (span/rowSpan) - você não aprende um formato novo por
container. Exemplo de um bento com 1 destaque + 2 menores:
```json
{
  "id": "bento-1", "type": "bento_grid", "span": 12,
  "props": { "columns": 12, "gap": "md" },
  "blocks": [
    { "id": "b-area",  "type": "area_chart", "span": 8, "rowSpan": 2, "props": { "chartId": "<id1>" } },
    { "id": "b-kpi",   "type": "kpi",        "span": 4, "props": { "chartId": "<id2>" } },
    { "id": "b-donut", "type": "donut",      "span": 4, "props": { "chartId": "<id3>" } }
  ]
}
```
Trocar `bento_grid` por `section` (ou qualquer outro container da §4) muda o
VISUAL, NÃO a sintaxe dos filhos. O resolver do backend percorre o layout
RECURSIVAMENTE e resolve o dataBinding de cada filho (inclusive os charts dentro
do container), independentemente do tipo do container.

## 4. AVISO: Containers que aninham filhos (todos via `block.blocks`)

**TODOS os containers de layout abaixo já aninham filhos com dados** (você pode
colocar gráficos dentro de qualquer um via `block.blocks`, e o resolver resolve o
dataBinding dos filhos recursivamente):

- `section` - card com header (título/subtítulo); dispõe os filhos num grid de
  12 colunas (use `span`/`rowSpan`).
- `bento_grid` - mosaico; cada filho usa `span` (largura) + `rowSpan` (altura).
- `dashboard_panel` - painel com título/descrição; grid de 12 colunas dos filhos.
- `collapsible_block` - seção colapsável; os filhos vão no corpo que abre/fecha.
- `resizable_panels` - painéis com divisória arrastável.
- `expandable_cards` - cada filho vira um card que expande.
- `sheet` - painel lateral que abre; os filhos vão dentro.

`divider` é o ÚNICO bloco "de layout" sem filhos (separador puro com rótulo).

Mecânica: o BlockRenderer, para QUALQUER bloco com `block.blocks`, passa os
filhos já renderizados ao container (grid padrão de 12 colunas para
section/dashboard_panel/collapsible_block) **e** a lista crua + `renderChild`
para os que fazem layout próprio (bento_grid/resizable_panels/expandable_cards/
sheet). Em todos os casos os filhos com `dataBinding`/`chartId` são resolvidos.

> Recomendação prática: para agrupar gráficos de forma previsível, `section` e
> `bento_grid` continuam sendo as escolhas mais seguras; os demais existem para
> efeitos específicos (colapsar, painel lateral, cards expansíveis).

## 5. Inserindo charts: `add_chart_to_dashboard` (recomendado) vs JSON manual

**Caminho recomendado** (robusto, incremental):
1. `create_dashboard` com layout vazio: `{ "filters": [], "rows": [] }`.
2. (Opcional) `update_dashboard` para pré-criar rows vazias com `id` estável:
   `{ "filters": [], "rows": [ { "id": "kpis", "blocks": [] }, { "id": "main", "blocks": [] } ] }`.
   Necessário se você quer referenciar `rowId` no passo seguinte (sem a row, o
   `add_chart_to_dashboard` retorna `row_not_found`).
3. Para CADA chart publicado: `add_chart_to_dashboard { dashboardId, chartId,
   rowId?, span?, position?, blockId? }`. O bloco nasce com `type` = catalogType
   do chart e `props.chartId` = chartId. `rowId` omitido -> cria nova row ao final.

**JSON manual** (`create_dashboard`/`update_dashboard` com o layout inteiro): use
quando precisar de **containers** (qualquer container da §4 com filhos) ou de
**blocos narrativos**, já que o `add_chart_to_dashboard` só insere 1 chart por
bloco no nível da row. Para layouts grandes só de charts, prefira
`add_chart_to_dashboard` (menos JSON, menos erro).

## 6. Blocos narrativos no layout (sem dados)

Title, rich_text, alert, callout, flip_words e os containers/decorativos vão no
layout via `create_dashboard`/`update_dashboard` - bloco com `id`/`type`/`span`/
`props` e **sem** `chartId`/`dataBinding`:
```json
{ "id": "r-hero", "blocks": [
  { "id": "h1", "type": "background_beams", "span": 12, "props": { "title": "Receitas 2025", "subtitle": "Panorama" } },
  { "id": "h2", "type": "flip_words", "span": 12, "props": { "prefix": "Dados", "words": ["claros","rápidos","acionáveis"] } }
]}
```
AVISO: `props` em UM nível só - NÃO aninhe arrays (`[["a","b"]]` quebra o componente).

## 7. Charts: referência por `props.chartId` (não inline)

Blocos de gráfico devem referenciar um chart EXISTENTE e visível via
`props.chartId` (o `add_chart_to_dashboard` faz isso por você). Evite `dataBinding`
inline no layout para dashboards grandes (>5 blocos) - fica verboso e mais frágil.
O caminho canônico é: `create_chart` -> `preview_chart_data` -> `publish_chart` ->
`add_chart_to_dashboard`. Reuse o mesmo `chartId` em vários blocos quando fizer
sentido (não duplique charts).

AVISO: Props visuais do chart NÃO são propagadas pelo `chartId` no layout - o
BlockRenderer mescla só `manifest.defaultProps` + `block.props`. Se um bloco
precisa de props visuais específicas (ex.: `label` de KPI, `stageLabel`/`accent`
de funnel_stage), repita-as no `block.props` junto com o `chartId`.

## 8. Filtros do dashboard

`layout.filters` é um array (pode ser `[]`). Cada filtro: `{ id, type, label,
default? }`, com `type` em `date_range | select | multiselect | search |
number_range`. Use só se o usuário pedir interatividade de filtro.

## 9. Visibilidade (UPPERCASE)

`visibility` é UPPERCASE em charts E dashboards: `PRIVATE` (default, só o dono),
`DEPARTMENT` (exige `departmentId`), `ORG` (toda a organização). Mandar lowercase
(`private`) -> `invalid_arguments`.

## 10. Publicar

`publish_dashboard { dashboardId }` copia `draftLayout`->`publishedLayout` e
MATERIALIZA um snapshot dos dados (executa os dataBindings). Confirme com o usuário
antes de publicar. Edite o draft e republique para atualizar.

## 11. Fluxo de montagem (resumo)
1. `create_dashboard { draftLayout: { filters: [], rows: [] } }` -> `dashboardId`.
2. (Opcional) `update_dashboard` com rows vazias (rowIds estáveis).
3. `add_chart_to_dashboard` por chart publicado (ou JSON manual p/ containers/narrativos).
4. `update_dashboard` para blocos narrativos e containers (qualquer container da §4 com `blocks`).
5. `publish_dashboard` (confirmar com o usuário).
6. Devolver `dashboardId` + `chartIds`.

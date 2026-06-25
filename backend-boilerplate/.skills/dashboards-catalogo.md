---
name: dashboards-catalogo
description: Sub-skill de referência do CATÁLOGO de blocos (43 tipos) para o Construtor de Dashboards. Para cada bloco: o que é, quando usar, shape do dataContract e as props principais (accent, palette, valueFormat, deltaPolarity, etc.). Inclui o mapa "pedido do usuário -> bloco certo". Consulte sempre `list_catalog` como fonte da verdade viva; esta skill é o guia curado para escolher e configurar.
---

# Catálogo de Blocos - Guia de escolha e configuração

> Sub-skill da **construtor-dashboards**. Fonte da verdade VIVA é a tool
> `list_catalog` (sempre chame antes de criar; ela traz `propsSchema` +
> `dataContract` + `defaultProps` de cada tipo). Esta skill é o **guia curado**:
> explica o que cada bloco é, QUANDO usar, o `shape` que a query precisa produzir
> e as props que importam. Hoje o catálogo tem **43 blocos** (incluindo o
> `__example`, que NÃO deve ser usado).

## 0. Como ler o catálogo

Cada manifesto tem:
- `type` -> vai em `catalogType` no `create_chart` e em `block.type` no layout.
- `kind` -> `chart` (tem dados, recebe a moldura ChartWidget), `text`/`title`
  (narrativo, sem dados) ou `layout` (container/decorativo, sem dados próprios).
- `dataContract.shape` -> o formato que o RESULTADO da query precisa ter após o
  transform: `scalar` | `series` | `categorical` | `table`. Blocos `text`/`title`
  e `layout` **não têm** `dataContract` (não levam `dataBinding`).
- `propsSchema` -> JSON Schema das props visuais (validado no `create_chart`).
- `defaultProps` -> defaults seguros (omita props para herdá-los).

### Mapa rápido de shape -> colunas (decore isto)
- `scalar` -> `value` (+ `label`/`unit`/`delta`)
- `series` -> `x`, `y` (+ `series`) - **bar_chart, h_bar_chart, line_chart,
  area_chart, scatter_chart, spark_chart, signal_card**
- `categorical` -> `label`, `value` - **donut, bar_list, leaderboard**
- `table` -> colunas livres
AVISO: Barras (vertical E horizontal) são **series** (`x,y`), não categorical. Só
donut/bar_list/leaderboard usam `label,value`.

## 1. Props CANÔNICAS (compartilhadas entre os gráficos) - entenda uma vez

Estas props aparecem repetidas nos gráficos. Domine-as e você configura quase tudo:

- **`accent`** - cor base do gráfico. Aceita 3 formatos: (a) enum do Design System
  `chart-1`..`chart-5` ou `primary`; (b) classe Tailwind (`bg-purple-500`,
  `stroke-emerald-500`); (c) cor CSS crua (`#40E0D0`, `rgb(64,224,208)`,
  `linear-gradient(...)`, `var(--chart-1)`). Resolvida por `resolveAccent()`.
  AVISO: Em `palette: "multi"` o `accent` é **ignorado** (a paleta cíclica do DS vence).
- **`palette`** - modo de cor automática: `single` = tudo na cor `accent`;
  `multi` = cicla `chart-1..5` por série/item; `none` = sem distinção. O default
  varia por bloco (barras/donut/bar_list/spark = `single`; line/area/scatter = `multi`).
- **`valueFormat`** - formato PT-BR do número exibido. ENUM FECHADO:
  `BRL` (R$ 2.609.946.157,73), `compactBRL` (R$ 2,61 bi), `number` (1.234.567,8),
  `compactNumber` (2,61 bi), `percent` (FRAÇÃO -> 0.125 vira "12,5%"). O `kpi` ainda
  aceita `auto` (escolhe pelo dado). AVISO: `percent` espera **fração** (0-1), não 0-100.
- **`deltaPolarity` / `trendPolarity`** - semântica de cor da variação:
  `up-good` (subir é bom -> positivo verde; default) ou `up-bad` (subir é ruim ->
  positivo vermelho; use em inadimplência, custo, latência, atraso).

Toda moldura de gráfico (ChartWidget) ainda exibe no rodapé: **takeaways**
(insights automáticos), o **SQL** e a **duração** da query.

## 2. GRÁFICOS de comparação / série (kind=chart)

AVISO: **TODO bloco desta seção é shape `series` -> colunas `x` e `y`** (NÃO
`label,value`). Inclui `bar_chart` e `h_bar_chart`, que parecem categóricos mas
usam `x` (rótulo/categoria) e `y` (valor). Mandar `label,value` aqui ->
`contract_violation: /0 must have required property 'x'`. Categorical (`label,value`)
é só donut/bar_list/leaderboard.

### bar_chart - Gráfico de Barras - shape `series`
Compara valores entre categorias (colunas verticais ou barras horizontais).
Suporta **empilhamento** (`stacked: true`) quando os dados têm o campo `series`.
- Colunas do SELECT: `x` (categoria), `y` (número), `series` (opcional, p/ stacked).
- Props: `orientation` (`vertical`|`horizontal`), `stacked` (só na vertical),
  `accent`, `palette` (default `single`), `seriesColors` (array de cor por série,
  na ordem - sobrescreve a palette; ideal p/ stacked), `valueFormat` (default `compactBRL`).
- Quando usar: "por categoria", "por secretaria", "receita x despesa por mês".

### h_bar_chart - Barras Horizontais - shape `series`
Igual ao bar_chart mas deitado - ótimo p/ **rótulos longos**. NÃO empilha.
- Colunas: `x` (categoria/rótulo), `y` (número). Props: `palette`, `accent`, `valueFormat`.

### line_chart - Gráfico de Linhas - shape `series`
Evolução temporal de um valor (suporta múltiplas séries via `series`).
- Colunas: `x` (temporal), `y` (número), `series` (opcional). Props: `smooth`
  (curva suave), `area` (preenche abaixo, default true), `palette` (default `multi`), `accent`.
- Quando usar: "evolução", "por mês", "tendência ao longo do tempo".

### area_chart - Gráfico de Área - shape `series`
Como o line mas com volume preenchido; bom p/ totais acumulados / composição.
- Colunas: `x` (temporal), `y`, `series` (opcional). Props: `type`
  (`default`|`stacked`|`percent`), `fill` (`gradient`|`solid`|`none`),
  `showLegend`, `showGridLines`, `palette` (default `multi`), `accent`.

### scatter_chart - Dispersão - shape `series`
Correlação entre duas variáveis numéricas; `series` colore por categoria.
- Colunas: `x` (número), `y` (número), `series` (opcional). Props: `showLegend`,
  `showGridLines`, `palette` (default `multi`), `accent`.

### donut - Donut - shape `categorical`
Distribuição de um total entre categorias (fatias). Centro mostra o total.
- Colunas: `label`, `value`. Props: `showLegend`, `centerLabel`, `palette`
  (default `single` - varia opacidade por fatia), `accent`, `valueFormat`.
- Quando usar: "composição", "% do total", "distribuição por tipo".

### bar_list - Lista de Barras (ranking) - shape `categorical`
Ranking Top-N: barra proporcional ao valor, ordenada.
- Colunas: `label`, `value`. Props: `sortOrder` (`descending` default),
  `palette`, `accent`, `textColor` (auto por contraste WCAG; só force se precisar).
- Quando usar: "top 10 ...", "maiores ... ", "ranking de categorias".

### spark_chart - Sparkline - shape `series`
Minigráfico de tendência (sem eixos), ótimo ao lado de um KPI.
- Colunas: `y` (número), `x` (opcional). Props: `type` (`area`|`bar`|`line`),
  `curveType` (`linear`|`monotone`|`step`), `palette`, `accent`.

## 3. INDICADORES escalares (cards) (kind=chart)

### kpi - KPI - shape `scalar`
Métrica única com rótulo, ícone e variação.
- Colunas: `value` (obrigatório) + opcionais `label`, `unit`, `delta`.
- Props: `label`, `valueFormat` (aceita `auto`, default), `accent`, `icon`
  (ENUM CURADO lucide - ex.: `DollarSign`, `TrendingUp`, `Users`, `Landmark`,
  `Target`, `Gauge`...), `showDelta`, `deltaPolarity`.
- AVISO: **`delta` é a VARIAÇÃO vs período anterior e espera FRAÇÃO** (`0.12` = +12%),
  exibida com seta verde/vermelha. NÃO passe percentual cru (`12` vira "+1200%")
  nem use `delta` para "participação no total". Se você não tem uma variação
  temporal de verdade, **omita a coluna `delta`** (o KPI mostra só o valor).
- Props number/boolean vão LIMPOS (`showDelta: false`, não `"false"`).
- Quando usar: "total arrecadado", "quantidade de X", "valor único de destaque".

### metric_glow - Métrica (glow) - shape `scalar`
Card de métrica em destaque com efeito de brilho e variação.
- Colunas: `value` (+ `label`, `unit`, `delta`). Props: `label`, `valueFormat`
  (default `compactBRL`), `accent`, `showDelta`, `deltaPolarity`.

### stat_tile - Stat Tile - shape `scalar`
Ladrilho compacto (valor + variação) para grades de KPIs.
- Colunas: `value` (+ `label`, `delta`). Props: `label`, `valueFormat`
  (default `compactNumber`), `accent`, `showDelta`, `deltaPolarity`, `hint`
  (texto auxiliar tipo "vs. ontem").

### signal_card - Signal Card - shape `series` (ATENÇÃO: recebe SÉRIE, não escalar)
KPI com mini-sparkline + tendência; destaca o ÚLTIMO ponto da série.
- Colunas: `y` (obrigatório), `x` (opcional). Props: `label`, `valueFormat`
  (default `compactNumber`), `accent`, `trendPolarity`, `trendBasis`
  (`prev-vs-last` default | `first-vs-last`), `showSparkline`.
- Quando usar: "evolução recente em destaque" (KPI + tendência num card só).

## 4. MEDIDORES (gauges) (kind=chart, shape `scalar`)

São `kind=chart` (recebem a moldura ChartWidget). Todos shape `scalar`.

### progress_bar - Barra de Progresso
Progresso de `value` sobre uma escala (`max`). Ótimo p/ metas.
- Colunas: `value` (+ `label`). Props: `max` (default 100), `variant`
  (`default|neutral|warning|error|success`), `accent` (sobrescreve `variant`), `showValue`.

### progress_circle - Anel de Progresso
Progresso circular, percentual no centro.
- Colunas: `value` (+ `label`). Props: `max` (default 100; com max=100 o `value`
  já é %), `variant`, `accent` (sobrescreve `variant`).

### radial_gauge - Medidor Radial
Medidor (gauge) de `value` entre `min` e `max`.
- Colunas: `value` (+ `label`, `unit`). Props: `max` (default 100), `min`
  (default 0), `unit` (ex.: "%"), `accent`.

## 5. TABELAS / listas (kind=chart)

### data_table - Tabela Rica - shape `table`
Tabela com busca, ordenação e paginação. Para datasets tabulares.
- Dados: `{ columns:[{key,label,type}], rows:[...] }` (a convenção `table` monta
  isso a partir das colunas do SELECT). Props: `pageSize` (integer LIMPO, não
  string), `filterPlaceholder`.

### table - Tabela - shape `table`
Tabela simples de dados crus com colunas tipadas. Props: `pageSize`, `dense`.

### invoice_table - Tabela de Fatura - shape `table`
Itens com `qty` x `unit` e total no rodapé. Colunas esperadas: `label`, `qty`,
`unit`. Props: `currency`.

### leaderboard - Leaderboard - shape `categorical`
Ranking (Top-N) com posição, avatar e barra proporcional.
- Colunas: `label`, `value`. Props: `unit`.

### funnel_stage - Etapa de Funil - shape `table` (SELF-CONTAINED, sem moldura)
Painel COLAPSÁVEL de UMA etapa de um funil temporal (N1/N2/N3...). Header com
resumo (quantidade + % do universo + valor) e barra de participação segmentada
pelos desfechos; ao abrir, mostra a tabela de desfechos com ícone, valor
original e valor atualizado. É `kind=chart` shape `table`, mas SELF-CONTAINED
(desenha o próprio card colapsável - NÃO recebe a moldura ChartWidget).
- Dados (shape `table`): linhas com coluna `tipo` que define o papel de cada
  linha - `resumo` (quantidade, `pct` em FRAÇÃO 0..1, valor -> header+barra),
  `desfecho` (icone, desfecho, descricao, quantidade, valor_original,
  valor_atualizado -> linha+segmento), `total`, `nota`. Componha com `UNION ALL`
  de SELECTs pequenos sobre 1 CTE de filtro; todas as branches precisam das
  MESMAS colunas/tipos (preencha `NULL::text`/`NULL::numeric` onde não aplica) +
  uma coluna `ord` para `ORDER BY`.
- Props (repita no `block.props` do layout junto com `chartId` - não são
  propagadas pelo chart): `stageLabel` (obrigatório), `accent`
  (`blue|red|green|amber|violet|slate`), `defaultOpen` (bool), `barLabel`,
  `valueFormat` (`BRL|compactBRL`).
- Quando usar: funil de cobrança/dívida ativa, jornada por etapas temporais.

## 6. NARRATIVOS (sem dados - kind=text/title)

Vão no layout via `update_dashboard` (bloco com `type`/`props`, SEM `chartId`/`dataBinding`).
NÃO são criados com `create_chart` (não têm dataBinding).

- **title** - título/seção. Props: `text` (obrigatório), `level` (1-6), `align`.
- **rich_text** - bloco markdown (análise/comentário). Props: `markdown` (obrigatório).
- **alert** - aviso em destaque. Props: `variant`
  (`default|info|success|warning|error|destructive`), `title` (obrigatório),
  `description`, `showIcon`, `dismissible`.
- **callout** - banner semântico. Props: `variant`
  (`default|info|success|warning|error`), `title` (obrigatório), `description`,
  `boxColor` e `textColor` (independentes - caixa e texto), `showIcon`.
- **flip_words** - título animado (palavra que troca). Props: `prefix`, `words`
  (array de strings SIMPLES - AVISO: um nível só, NÃO `[[...]]`), `duration` (>=500ms).

## 7. CONTAINERS de LAYOUT (kind=layout)

Todos os containers abaixo (exceto `divider`) **aninham filhos via `block.blocks`
+ `span`/`rowSpan`** - você pode colocar gráficos de dados dentro de qualquer um,
e o resolver do backend resolve o dataBinding dos filhos recursivamente. Veja a
sub-skill **dashboards-layout** §3-§4 para a mecânica. Recomendação: para agrupar
gráficos de forma previsível, prefira `section` e `bento_grid`; os demais são para
efeitos específicos (colapsar, painel lateral, cards expansíveis).

- **section** - Container hierárquico: agrupa sub-blocos num card com header
  (título/subtítulo) e grid de 12 colunas. Props: `title` (obrigatório),
  `subtitle`, `variant` (`card`|`framed`). Use `block.blocks` p/ os filhos.
- **bento_grid** (v2.0.0) - Mosaico "bento": dispõe os filhos num grid; cada
  filho usa `span` (1-12) e `rowSpan` (altura). Props: `columns` (1-12, default 12),
  `gap` (`sm|md|lg`), `autoRows` (`sm|md|lg`). Use `block.blocks` p/ os filhos.
- **dashboard_panel** - painel com título/descrição e grid de 12 colunas dos
  filhos. Props: `title` (obrigatório), `description`, `variant` (`card`|`framed`).
  Use `block.blocks` p/ os filhos.
- **collapsible_block** - seção colapsável; os filhos vão no corpo que abre/fecha.
  Props: `title` (obrigatório), `defaultOpen`. Use `block.blocks` p/ os filhos.
- **resizable_panels** - painéis com divisória arrastável. Props: `direction`,
  `leftLabel`, `rightLabel`. Use `block.blocks` p/ os filhos.
- **expandable_cards** - cada filho vira um card que expande p/ detalhe. Use
  `block.blocks` p/ os filhos.
- **sheet** - painel lateral que abre; os filhos vão dentro. Use `block.blocks`.
- **divider** - separador com rótulo central. ÚNICO container SEM filhos. Props:
  `label`, `orientation`.

## 8. DECORATIVOS (capa/efeitos - kind=layout, sem dados)

Use só para estética (hero, capa). NÃO servem p/ exibir dados:
- **background_beams** / **background_boxes** - capas animadas com `title`/`subtitle`.
- **glowing_effect** - card com borda que brilha no hover (`title`, `description`, `variant`).
- **pin_3d** - card com inclinação 3D (`pinLabel`, `href`, `title`, `description`).
- **mobius_loop** - ícone animado de loading (`size`, `speed`).
- **hover_card** / **tooltip_card** / **tooltip_fluid** - conteúdo flutuante no hover/foco.
- **card_hover** - grade de cards com destaque no hover (`items[]`).

## 9. Mapa "pedido do usuário -> bloco"

| O usuário pede... | Use |
|---|---|
| total / quantidade / valor único | `kpi`, `metric_glow`, `stat_tile` (scalar) |
| valor único + tendência recente | `signal_card` (série) |
| % de meta / progresso / cobertura | `progress_bar`, `progress_circle`, `radial_gauge` |
| por categoria / por órgão / comparação | `bar_chart`, `h_bar_chart` (rótulos longos) |
| composição / % do total / distribuição | `donut`, `area_chart` (type=percent) |
| ranking / top N | `bar_list`, `leaderboard` |
| evolução / por mês / série temporal | `line_chart`, `area_chart` |
| correlação entre 2 números | `scatter_chart` |
| minigráfico ao lado de um KPI | `spark_chart` |
| tabela / detalhamento / lista | `data_table`, `table` |
| etapa de funil / jornada por etapas | `funnel_stage` |
| capa / hero / animação | `background_beams`, `flip_words`, `callout` |
| alerta / observação / análise | `alert`, `callout`, `rich_text`, `title` |
| agrupar blocos num cartão | `section` (container) |
| mosaico (1 grande + vários menores) | `bento_grid` (container) |

## 10. Regras de ouro do catálogo
1. SEMPRE chame `list_catalog` antes de criar - pegue `propsSchema` e
   `dataContract.shape` do tipo exato.
2. Nomeie as colunas do SELECT conforme o `shape` (ver sub-skill **dashboards-query**).
   Barras = series (`x,y`); donut/bar_list/leaderboard = categorical (`label,value`).
3. `props` devem conformar ao `propsSchema` (enums fechados, sem campos extras -
   `additionalProperties:false`; number/boolean LIMPOS, não string). Erro ->
   `bad_request` detail=`invalid_props`.
4. Não use `__example` nem os blocos puramente decorativos para mostrar dados.
5. Não invente tipos: se não está no `list_catalog`, não existe.

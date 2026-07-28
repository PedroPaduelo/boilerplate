# CHANGELOG — Repaginação do Catálogo de Gráficos

Migração da camada visual de **todos** os gráficos do catálogo para o novo design
system de gráficos do AuditorIA (`uploads/graficos-ref/graficos/`), com fidelidade
pixel-perfect e **sem nenhuma quebra de contrato**.

---

## Adicionado

### Tema de gráfico (fonte única)

- **`shared/ui/charts/chart-theme.ts`** — a especificação inteira num arquivo:
  - 9 cores de série **na ordem da referência**, guardadas como **token do DS**
    (`--ds-color-*`), não como hexadecimal;
  - chrome (grade, eixo, rótulo, ênfase, superfície, faixa do tooltip, trilhas);
  - geometria (linha 2,5px, raio de coluna 4px só no topo, larguras 48/40/36%,
    tracejado `3`, furo da rosca 72%, gradiente de área 0.4→0, `dashArray` 4 do
    medidor tracejado, métricas do sparkline e da dispersão);
  - tipografia em pixels reais (eixo 12/400, legenda 13/500, valor central
    17,5/700, "Total" 12,25/600, legenda própria 11,375 + 14,875);
  - motion (360ms, 120ms de atraso por série) e `darkenColor`/`fadeColor` — a
    referência **escurece** no hover, ao contrário do default das bibliotecas.
- **`shared/ui/charts/chart-theme.css`** — o que só o CSS resolve: tooltip
  translúcido com `blur(6px)`, onda do esqueleto, legenda própria dos circulares,
  padding assimétrico do corpo (8px à esquerda, 20px nos demais lados).

### Contrato comum a todos os blocos

- **`chart-template.ts`** — interpolação `{{variavel}}` com vocabulário único
  derivado dos dados (`total`, `maximo`, `minimo`, `media`, `contagem`,
  `rotuloMaximo`…), caminhos (`{{linhas.0.municipio}}`) e pipe de formato
  (`{{total|compactBRL}}`).
- **`chart-text.tsx` / `chart-text-html.ts`** — Markdown inline + interpolação,
  em versão DOM (`ChartText`) e texto puro (`chartPlainText`, para `aria-label` e
  `<text>` do SVG). Variável inexistente fica **visível e marcada**.
- **`shared/lib/markdown.ts`** — Markdown → HTML sanitizado, agora fonte única do
  app (o bloco `rich_text` passou a consumir daqui).
- **`ChartFrame` v2** — cabeçalho (título/subtítulo/descrição/ícone/ações) e os
  **cinco estados**: sucesso, carregando, vazio, erro e sem permissão.
- **`BlockFrame` v2** — mesma anatomia no card do dashboard, com os estados
  desenhados **dentro** da moldura (o cabeçalho continua legível enquanto o dado
  não chega) e todos os textos passando pela interpolação.
- **Painel de propriedades unificado** — cabeçalho com descrição e mensagem de
  vazio, aba "Dados" para **todos** os blocos (JSON livre nos que não têm
  `dataContract`, só para alimentar variáveis), lista de variáveis disponíveis
  com inserção por clique, e seletor de pré-visualização de estado.

### Primitivos

- `ChartLegends` (legenda própria dos circulares), `ChartSkeleton` (onda; circular
  nos anéis), `ChartTooltip` repaginado, `RankingBar` promovida ao barril.

## Alterado

- **Paleta**: as cores de série passaram a ser as 9 da referência, na ordem dela.
  Nomes internos: `emerald, amber, cyan, red, green, bronze, forest, steel, navy`.
- **Resolução de token em profundidade** (`useChartPalette`): segue cadeias de
  `var()` até um literal. Corrige um defeito silencioso anterior — atributo de
  apresentação de SVG não aceita `var()`, e o texto dos eixos saía preto.
- **`block-sizing`**: `CHART_BODY_HEIGHT.series` 312 → **388** e `categorical`
  216 → **328**, para acomodar os 320px da referência + padding + legenda (sem
  isso o card crescia ~35px na chegada do dado).
- **Espessura de barra com TETO em pixel** (`geometry.barMaxWidth` 32px,
  `hBarMaxWidth` 24px, via `maxBarSize`). A fração da referência (48/40/36/30%)
  não tem teto: a mesma coluna que dá 21px num card de 331px dava **118px** num
  painel de 1.546px e virava um bloco de cor. A fração continua mandando
  enquanto a faixa é estreita; o teto assume quando ela é larga. Com isso saiu
  o **§11** (engrossar a coluna por largura de JANELA, que num catálogo de cards
  media a grandeza errada) e, com ele, `barWidthMd`, `barWidthSm`, `barRadiusSm`
  e o `useMediaQuery` do `bar-chart`. Detalhes e limitação conhecida em
  `NOTAS.md` → `[AJUSTE] Espessura de barra`.
- **Todos os 20 blocos de `kind=chart`** repaginados: linha, área, colunas
  (simples/múltipla/empilhada/negativa), barra horizontal, rosca/pizza, medidores
  radiais (semicircular, radial, tracejado), anel de progresso, dispersão,
  sparkline, rankings, KPIs/ladrilhos/métricas, barra de progresso, funil e as
  três tabelas.

## Preservado (não-negociável)

- **Nenhuma prop pública removida ou renomeada.** Os `manifest.propsSchema` dos
  blocos seguem intocados; o vocabulário antigo de `accent` (`chart-1`…`chart-5`,
  `primary`, classes utilitárias, cores cruas) continua sendo traduzido.
- Biblioteca de gráficos inalterada (recharts).

## Testes

`599 → 812` testes (114 arquivos), todos verdes. Novos: interpolação/markdown,
os cinco estados do `ChartFrame`, e um `component.test.tsx` por bloco repaginado
(vários com conformidade visual medida **dentro do SVG**).

## Pendente de decisão (ver `NOTAS.md` e `PEDIDOS-BASE.md`)

1. **5 layouts da referência sem bloco no catálogo**: misto (§3), radar (§14),
   mapa de calor (§16), mapa de árvore (§17), diagrama de caixa (§18).
2. **Zoom `xy` da dispersão** (§15) — sem equivalente nativo no recharts.
3. **Forma decorativa SVG** do card de resumo (§04-2.1) — falta o asset.
4. **Persistir descrição/mensagem de vazio** em `/charts/:id` — precisa de campo
   próprio no contrato de Chart.

---

## Removido — 7 blocos decorativos (decisão de produto)

Saíram do catálogo por não terem uso previsto:

| Bloco            | `catalogType`      |
| ---------------- | ------------------ |
| 3D Pin           | `pin_3d`           |
| Background Beams | `background_beams` |
| Background Boxes | `background_boxes` |
| Efeito de Brilho | `glowing_effect`   |
| Cards com Hover  | `card_hover`       |
| Tooltip Card     | `tooltip_card`     |
| Tooltip Fluido   | `tooltip_fluid`    |

**43 → 36 blocos.** O que foi limpo junto:

- as 7 pastas de `render-engine/catalog/` (componente, manifesto, fixture,
  primitivos próprios e testes) — o auto-registro por glob faz o resto;
- o mapa `CATEGORY_BY_TYPE` da galeria (a aba **Efeitos** continua, com
  `mobius_loop` e `hover_card`);
- as **skills do agente** (`backend-boilerplate/.skills/dashboards-catalogo.md`
  e `dashboards-layout.md`): a seção de decorativos foi reduzida aos dois que
  sobraram, o exemplo de hero que usava `background_beams` passou a usar
  `title`, e ficou um aviso explícito para o agente não referenciar os tipos
  removidos;
- `catalog.manifests.json` regenerado (`npm run build:catalog`) — é o que o
  `/catalog` e o MCP `list_catalog` servem.

⚠️ **Dashboards salvos** que referenciem um desses tipos passam a exibir o aviso
"Bloco não implementado" (comportamento normal do `BlockRenderer` para tipo
desconhecido) — a página não quebra.

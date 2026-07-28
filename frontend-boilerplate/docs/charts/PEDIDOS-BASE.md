# PEDIDOS À BASE

> Subagente: se precisar de algo que `chart-theme` / `ChartFrame` / `ChartLegend` /
> `ChartTooltip` / `chart-axes` não oferecem, **não edite a base** — descreva aqui e
> siga com a melhor alternativa dentro dos seus arquivos. O orquestrador resolve na
> consolidação.

Formato:

```
## [SUB-XX] O que falta
Por que preciso:
Alternativa que usei enquanto isso:
```

---

## [SUB-02] `CHART_GEOMETRY` não publica o preenchimento em gradiente

**Por que preciso:** `02-configuracao-base.md` §5 define o preenchimento como parte
da configuração BASE (portanto herdada por todo gráfico que peça gradiente — área e
medidores): direção **vertical**, opacidade **0.4 no topo → 0 na base**, paradas
**0 e 100**, intensidade de tom 0. São quatro números de especificação e hoje não
existe slot para eles no `chart-theme` — o que obriga cada gráfico com gradiente a
redigitá-los (o medidor radial, lote SUB-06, vai precisar dos mesmos).

**Sugestão:** um bloco em `CHART_GEOMETRY` (ou constante irmã), por exemplo:

```ts
/** Preenchimento em gradiente — §5. */
areaGradient: {
  opacityFrom: 0.4,
  opacityTo: 0,
  offsetFrom: '0%',
  offsetTo: '100%',
} as const,
```

**Alternativa que usei enquanto isso:** constante `AREA_GRADIENT` no topo de
`src/shared/ui/charts/area-chart.tsx`, com a seção da referência anotada e um único
ponto de verdade no arquivo (o modo `solid` deriva a opacidade dela). Trocar pela
versão do tema é substituir o objeto local pelo do `palette.geometry` — nenhum outro
ajuste.

## [SUB-07] Zoom `xy` na dispersão (§15) — não existe no recharts

Por que preciso: a dispersão é o ÚNICO tipo do catálogo com zoom ligado
(`chart.zoom = { enabled: true, type: 'xy' }`). O recharts 2.15 não tem zoom
interativo nativo; `<Brush>` cobre um eixo só e traz cromo (alças/minimapa) que
nenhum layout da referência mostra. Instalar biblioteca ou trocar a lib está
vedado pelo briefing (§3.4).

Alternativa que usei enquanto isso: entreguei o §15 inteiro **menos** o zoom, sem
substituto improvisado. Se o produto quiser a interação, ela precisa de decisão
do orquestrador — as saídas viáveis são (a) `<Brush>` de um eixo assumindo o
cromo extra, (b) zoom por seleção implementado à mão sobre `domain` do eixo (é
comportamento novo, não layout) ou (c) aceitar a lacuna.

## [SUB-07] Métricas do §15 que `chart-theme` não expõe

Por que preciso: `CHART_GEOMETRY` tem `yTickCount` (5, da base) mas não o
equivalente do eixo X da dispersão (**8 divisões**, §15), nem as **casas decimais**
do rótulo desse eixo (**1**, §15). Também falta uma largura FINA de contorno de
marcador: `markerStrokeWidth` é 3 (do §1, linha) e o motor original desenha o
ponto da dispersão com o default de 2.

Alternativa que usei enquanto isso: `X_TICK_COUNT` e `X_AXIS_DECIMALS` como
constantes documentadas em `scatter-chart.tsx` (com a seção da referência ao
lado), e `palette.geometry.markerStrokeWidth` para o contorno. Se a base quiser
centralizar, sugiro `xTickCountScatter: 8`, `scatterAxisDecimals: 1` e
`markerStrokeWidthThin: 2` — troco as três por consumo do tema.

## [SUB-01] Opacidade do preenchimento de CONTEXTO sob a linha

Por que preciso: o bloco `line_chart` expõe a prop `area` (default `true` no
`manifest.propsSchema` — contrato, não posso mexer), mas a §1 (Linha) não prevê
preenchimento nenhum, e a única opacidade de preenchimento da referência é o
gradiente de ÁREA (`02-configuracao-base.md` §5: 0.4 → 0), que aqui deixaria o
gráfico de linha idêntico ao de área. Ou seja: não há número na referência nem
slot em `CHART_GEOMETRY` para "área discreta de contexto".

Alternativa que usei enquanto isso: constante local `AREA_FILL_OPACITY = 0.12` em
`line-chart.tsx`, documentada com o motivo. Se a base ganhar algo como
`CHART_GEOMETRY.contextFillOpacity`, troco a constante pelo token — é uma linha.

## [SUB-01] `ChartSeriesTooltip` não aceita a cor efetiva da série

Por que preciso: a §1 pinta a 1ª série com `rgba(0,120,103,.8)`
(`palette.primary80`), que NÃO é a 1ª cor do ciclo. O `ChartSeriesTooltip` monta a
marca de cor por conta própria (`palette.varAt(index, item.color)`), então a
bolinha do tooltip da 1ª série sai no verde opaco `#00A76F` enquanto a linha, a
legenda e o marcador estão no verde a 80%. Diferença pequena (só a opacidade),
mas é uma inconsistência dentro do mesmo gráfico.

Sugestão: uma prop opcional `colors?: string[]` (ou `colorAt?: (i) => string`) no
`ChartSeriesTooltip`, usada quando presente.

Alternativa que usei enquanto isso: nenhuma — aceitei a diferença de opacidade na
marca do tooltip para não duplicar o tooltip dentro do meu lote.

## [SUB-05] `ChartCenterLabel` não usa `CHART_TYPOGRAPHY.centerValue` / `centerTotal`

Por que preciso: a referência é exata nos rótulos centrais da rosca
(`01-fundamentos.md` §4 e `02-configuracao-base.md` §10): valor **17,5px / 700 /
`#1C252E`** e "Total" **12,25px / 600 / `#637381`**. Os números JÁ estão no
`chart-theme` (`CHART_TYPOGRAPHY.centerValue` e `.centerTotal`), mas o
`ChartCenterLabel` lê outra coisa:

```ts
fontSize={palette.token('--font-size-xl')}          // 17,5px por coincidência do tema
fontWeight={palette.token('--font-weight-semibold')} // 600 — a referência pede 700
...
fontSize={palette.axisFontSize}                      // 12px — a referência pede 12,25
// e o "Total" não declara peso — a referência pede 600
```

Medido no DOM hoje: valor `17.5px`/`600`, "Total" `12px`/sem peso. Ou seja, dois
dos quatro atributos não batem, e o 17,5px que bate é acidente deste tema (o
`--font-size-xl` do `auditoria.css` vale 17,5px) — em outro tema o valor muda.

Sugestão: trocar as quatro leituras por `palette.typography.centerValue.size/.weight`
e `palette.typography.centerTotal.size/.weight`. É o mesmo arquivo que já recebe
`palette`, então não muda assinatura nem quebra `RadialGauge`/`ProgressCircle`.

Alternativa que usei enquanto isso: consumi o `ChartCenterLabel` da base como
está (o briefing proíbe editá-la, e reimplementar o `<text>` dentro do meu lote
duplicaria o rótulo central em quatro gráficos). O item está marcado como
PARCIAL na checklist de conformidade de `catalog/donut/component.tsx`.

## [SUB-05] `ChartLegends` não aceita um segundo texto (sublabel) por item

Por que preciso: a §10 pede a legenda própria "com valores **e sublabels**", e o
`manifest` do bloco `donut` promete "valor absoluto **e participação no total**"
— três informações por item (rótulo, valor, participação) para os dois campos que
`ChartLegendItem` tem (`label`, `value`).

Sugestão: um `caption?: string` opcional no `ChartLegendItem`, desenhado abaixo do
valor na tipografia do rótulo (11,375px/500).

Alternativa que usei enquanto isso: juntei valor e participação no mesmo campo —
`value: "62 (62%)"` —, montado por `donutLegendValue()` em
`catalog/donut/donut-legend.tsx`. Nenhuma informação se perdeu; se o `caption`
existir, é só separar a string em dois campos.

## [SUB-03] `CHART_GEOMETRY` não tem as larguras de coluna de §4 e §6

Por que preciso: `CHART_GEOMETRY` guarda a largura da BASE (`barWidth` 0.48) e as
duas do responsivo (`barWidthMd` 0.6, `barWidthSm` 0.8), mas `03-tipos-de-grafico.md`
sobrepõe mais duas: **40%** na coluna simples (§4) e **36%** na empilhada (§6). São
medidas de especificação, do mesmo naipe das que já estão no tema.

Sugestão: `barWidthSingle: 0.4` e `barWidthStacked: 0.36` em `CHART_GEOMETRY`.

Alternativa que usei enquanto isso: constantes `SINGLE_BAR_WIDTH` e
`STACKED_BAR_WIDTH` no topo de `src/shared/ui/charts/bar-chart.tsx`, com a seção da
referência ao lado. Trocar pelo tema é substituir duas leituras.

## [SUB-03] Não há slot para o "respiro" entre colunas vizinhas (§5)

Por que preciso: a coluna múltipla separa as colunas do grupo com um **traço de 2px
transparente**. Em SVG um contorno transparente não abre buraco no preenchimento, então
no recharts isso vira `barGap={2}` — um número de especificação que hoje não tem casa
no `chart-theme`.

Sugestão: `barGroupGap: 2` em `CHART_GEOMETRY`.

Alternativa que usei enquanto isso: constante `GROUP_GAP` em `bar-chart.tsx`,
documentada com a tradução Apex → recharts.

## [SUB-03] `block-sizing` reserva 312px, mas §4–§7 pedem 320 + legenda

Por que preciso: a referência fixa **320px** de altura para os quatro layouts de
coluna (e o mesmo vale para linha e área, cujos lotes já subiram). Com a legenda, o
corpo pede ~348px — mas `render-engine/lib/block-sizing.ts` reserva **312px**
(`CHART_BODY_HEIGHT.series`). É `minHeight`, então nada é cortado; o efeito é o card
crescer ~35px quando o dado chega, que é justamente o pulo de layout que aquele
arquivo existe para evitar. O arquivo é compartilhado por todos os lotes de série,
portanto fora do alcance de um subagente.

Sugestão: `CHART_BODY_HEIGHT.series: 348` (320 do desenho + ~28 da legenda).

Alternativa que usei enquanto isso: nenhuma — subi o default do `BarChart` para
`CHART_HEIGHT.default` (320), alinhado com os lotes de linha e área, e registrei o
desvio aqui.

## [SUB-03] `ChartStateProps` não distingue VAZIO de ERRO

Por que preciso: o briefing (§5.4) pede que o bloco mapeie `state === 'error'` para
`state="error"` do `ChartFrame` — que tem o estado e desenha um `Banner`. Só que a API
pública dos gráficos (`ChartStateProps`) expõe apenas `isLoading` e `emptyMessage`:
não há por onde passar "erro" sem inventar uma prop que os gráficos irmãos não teriam.

Sugestão: `state?: ChartFrameState` e `errorMessage?: string` em `ChartStateProps`,
repassados ao `ChartFrame` por cada gráfico.

Alternativa que usei enquanto isso: mantive o mapeamento que o bloco já fazia (a
mensagem do erro vai em `emptyMessage`). Na aplicação real quem desenha o erro é o
`BlockFrame` — o componente do bloco só é montado no estado `success` —, então a perda
fica restrita ao uso direto do componente (playground e testes).

## [SUB-04] `chart-axes` não tem o raio da BARRA HORIZONTAL nem a folga dela

Por que preciso: `chartBarRadius(palette)` devolve `[r, r, 0, 0]` — o topo de uma
COLUNA. A §8 arredonda a ponta DIREITA com o raio plano: `[0, 2, 2, 0]` a partir de
`geometry.barRadiusFlat`. E a altura da barra (`geometry.hBarWidth`, 30%) precisa
virar `barCategoryGap` do recharts, que é a folga de CADA LADO (`tamanho = faixa −
2 × folga`) — ou seja, **metade** do complemento. Os dois cálculos vão se repetir em
todo lote que desenhe barra deitada (`bar_chart` horizontal, `bar_list`,
`leaderboard`, `progress_bar`, `funnel_stage`).

Sugestão: `chartHBarRadius(palette)` e `chartCategoryGap(palette, width)` em
`chart-axes.ts`, ao lado de `chartBarRadius`.

Alternativa que usei enquanto isso: `hBarRadius()` e `categoryGap()` no topo de
`src/shared/ui/charts/h-bar-chart.tsx`, com a seção da referência e a fórmula do
recharts documentadas. Trocar pelo helper da base é apagar as duas funções.

## [SUB-04] Não há slot para "traço 0" (a especificação de §4, §6 e §8)

Por que preciso: três layouts de barra dizem explicitamente **traço 0**, e a §5 diz
**2px transparente**. Hoje o zero é digitado no componente (`strokeWidth={0}`), o que
parece hardcode de estilo, embora seja a ausência de contorno pedida pela referência.

Sugestão: `barStrokeWidth: 0` (e `barGroupStrokeWidth: 2`) em `CHART_GEOMETRY`.

Alternativa que usei enquanto isso: constante `BAR_STROKE_WIDTH = 0` documentada em
`h-bar-chart.tsx`, usada na barra e na barra ativa (hover).

## [SUB-04] `CHART_BODY_HEIGHT.series` (312) não acomoda os 320px da referência

Por que preciso: mesmo problema que o SUB-03 levantou, visto do lado de quem subiu a
altura. A §8 fixa 320px e eu adotei `CHART_HEIGHT.default`; como `bodyMinHeight` é
altura MÍNIMA, o card cresce 8px quando o dado chega (esqueleto 312 → gráfico 320).

Sugestão: `series: 332` (320 + respiro) em `lib/block-sizing.ts` — resolve para
`h_bar_chart`, `line_chart`, `area_chart` e destrava o `bar_chart` (que precisa de
mais um tanto por causa da legenda no rodapé).

Alternativa que usei enquanto isso: aceitei os 8px, porque o briefing manda o LAYOUT
seguir a referência e o pulo é de um oitavo do que o `block-sizing` já evita.

## [SUB-08] `CHART_GEOMETRY` não tem as medidas do modo `sparkline`

**Por que preciso:** `04-widgets-prontos.md` §2.3/§2.4 sobrepõe a base com
números próprios do mini-gráfico, e nenhum deles existe em `chart-theme.ts`:

| Medida                     | Valor  | Seção |
| -------------------------- | ------ | ----- |
| `markers.strokeWidth`      | `0`    | §2.3  |
| barra — `stroke.width`     | `0`    | §2.4  |
| barra — `bar.borderRadius` | `1.5`  | §2.4  |
| barra — `columnWidth`      | `64%`  | §2.4  |
| dimensão linha             | 84×56  | §2.4  |
| dimensão barra             | 60×40  | §2.4  |
| dimensão área              | 100×66 | §2.4  |

`CHART_HEIGHT.spark` (56) cobre só a altura da variante LINHA; barra e área
ficam de fora, e as quatro medidas de traço/coluna não têm slot nenhum.

**Alternativa que usei enquanto isso:** um `SPARK_SPEC` e um `SPARK_SIZE`
locais no topo de `shared/ui/charts/spark-chart.tsx`, cada campo com a seção da
referência anotada ao lado — mesmo padrão de "constante de especificação
concentrada" que o `chart-theme` usa. Sugestão para a consolidação: promover
para `CHART_GEOMETRY.spark*` e `CHART_HEIGHT.spark{Line,Bar,Area}`, e apagar as
duas constantes locais.

## [SUB-08] `ChartTooltip` não tem modo "só o valor"

**Por que preciso:** §2.3 pede o tooltip do mini-gráfico com o VALOR formatado e
**sem título** — e também sem o nome da série (num spark não há segunda série
para distinguir). `ChartTooltip` sempre desenha a linha como
`[cor] rótulo ......... valor`, então um rótulo vazio deixa um `<span>` vazio
ocupando a metade esquerda da caixa.

**Alternativa que usei enquanto isso:** `<ChartTooltip rows={[{ label: '', value }]} />`
sem `title` e sem `color`. Fica correto (só o valor aparece), mas o alinhamento
é à direita em vez de centralizado. Sugestão: uma prop `isValueOnly` (ou aceitar
`rows` com `label` opcional e então centralizar) em `chart-tooltip.tsx`.

## [SUB-08] `ChartFrame` não expõe `position: relative` / sobreposição

**Por que preciso:** o card de resumo (§2.2) ancora o bloco de tendência de
forma ABSOLUTA no topo-direito do cartão. Nenhum componente de layout do
Astryx expõe posicionamento, e o `Card` só aceita `style`.

**Alternativa que usei enquanto isso:** `style={{ position: 'relative' }}` no
`Card` e `style={{ position: 'absolute', top/insetInlineEnd: 'var(--spacing-4)' }}`
no bloco de tendência — valores em TOKEN de espaçamento do DS, nenhum px
cravado. Se outros lotes precisarem do mesmo (KPI/ladrilho do SUB-10 têm a
mesma anatomia), vale uma classe `.chart-card__badge` em `chart-theme.css`.

## [SUB-09] `RankingBar` precisa de casa no barril de `@/shared/ui`

Por que preciso: `bar_list` e `leaderboard` desenham a MESMA barra de ranking (§8: raio
2px, traço 0, altura de 30% da faixa, trilho `trackLight`, hover que escurece). Ela
nasceu em `charts/bar-list.tsx` (meu lote), mas `charts/index.ts` é da base e está
fechado para esta trilha — então o `leaderboard` não consegue importá-la de
`@/shared/ui`.

Alternativa que usei enquanto isso: import direto do módulo
(`@/shared/ui/charts/bar-list`), com o porquê comentado no arquivo. Na consolidação
basta re-exportar `RankingBar`, `RANKING_TEXT` e `RANKING_ROW_BAND` no barril — ou
fundi-la com o `ChartBarTrack` (lote SUB-11), que é a mesma marca de dado com outra
geometria (pílula, trilho `--color-track`).

## [SUB-09] `ChartFrame` sem papel gráfico, para blocos que são TEXTO

Por que preciso: um ranking é uma `<ol>` legível, não uma imagem de dados. `role="img"`
na região de plotagem poda os descendentes da árvore de acessibilidade e o leitor de
tela perde as linhas. Hoje `ChartFrameRole` só aceita `img | meter | progressbar`, então
um bloco de texto não consegue usar a casca no estado de SUCESSO (nos demais estados
consegue, porque aí o `ChartFrame` não aplica papel nenhum).

Alternativa que usei enquanto isso: `ChartFrame` só nos estados não-sucesso; no sucesso
a `<ol>` é renderizada direto, com `ChartSkeleton`/`EmptyState` cobrindo o resto.
Sugestão: aceitar `role="none"` (ou `presentation`), mantendo cabeçalho, estados e
geometria sem mexer na semântica do conteúdo.

## [SUB-06] `CHART_TYPOGRAPHY.gaugeTotal` — o "Total" de 10,5px/400 do §12

Por que preciso: `03-tipos-de-grafico.md` §12 especifica o rótulo "Total" do
medidor semicircular em **10,5px / peso 400 / cor de eixo**. O `chart-theme` só
publica `centerTotal` (12,25/600) e `axis` (12/400) — nenhum dos dois é o degrau
pedido.
Alternativa que usei enquanto isso: ler os degraus do tema pela escotilha
oficial, `palette.token('--font-size-4xs')` (= 10,5px) e
`palette.token('--font-weight-normal')` (= 400), com a cor de
`palette.chrome('axis')`. Continua token, mas fica fora da tabela de tipografia
do gráfico.

## [SUB-06] `CHART_GEOMETRY.gaugeDash` — o `dashArray: 4` do §13

Por que preciso: §13 é o ÚNICO gráfico com traço pontilhado (`dashArray: 4` na
barra de valor). É métrica de especificação, irmã de `gridDash: '3 3'`, e o
`chart-theme` não a publica.
Alternativa que usei enquanto isso: constante local `DASH_ARRAY = 4` em
`charts/radial-gauge.tsx`, comentada e usada num lugar só.

## [SUB-06] `CHART_MARGIN_NONE` — margem zero do modo `sparkline`

Por que preciso: os circulares rodam em modo `sparkline` (sem padding) e o
recharts SOMA o deslocamento da margem ao `cx`/`cy` que recebe — com a margem
padrão de 5px, o `<path>` tracejado do §13 (SVG cru, que não passa por essa
conta) sai 5px fora do setor. O tema publica `CHART_MARGIN` e
`CHART_SPARK_MARGIN`, mas não a margem zero.
Alternativa que usei enquanto isso: constante local `NO_MARGIN` nos dois
componentes do lote.

## [SUB-06] `ChartCenterLabel` com tipografia por papel

Por que preciso: a leitura central da referência varia por tipo — valor
17,5px/**700** (o componente da base usa `--font-weight-semibold`, 600) e o
"Total" muda de tamanho, peso, cor e deslocamento entre §12, §13 e a rosca.
Alternativa que usei enquanto isso: cada componente do lote desenha o próprio
`<g data-slot="chart-center-label">` dentro do `<Label position="center">`, com
`palette.typography` / `palette.chrome`. Se a base aceitar `value`/`total` com
estilos e deslocamentos, os dois voltam a consumir `ChartCenterLabel`.

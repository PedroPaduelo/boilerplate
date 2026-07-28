# NOTAS — decisões, ambiguidades e riscos da repaginação

> Append-only. Cada entrada: `[LOTE] título` + o que foi decidido e por quê.

---

## [BASE] A referência é do modo CLARO; o produto tem modo escuro

Os valores da referência (`#1C252E` de texto, `#F4F6F8` de faixa do tooltip,
`rgba(145,158,171,.2)` de grade) são do tema claro. O produto tem light/dark.

**Decisão:** guardar o NOME DO TOKEN do DS em vez do hexadecimal. No modo claro o
valor resolvido é **idêntico** ao da referência (conferido token a token — as nove
cores e todo o chrome batem 1:1, porque o tema foi gerado da mesma auditoria de
design); no modo escuro adapta sozinho. Fidelidade onde a referência existe,
coerência onde ela não fala.

## [BASE] Rótulo de eixo: 12px da referência × escala do tema

A referência fixa 12px/400 no rótulo de eixo e 13px/500 na legenda nativa. A
escala tipográfica do tema não tem esses dois degraus exatos (tem 11,375 / 12,25 /
13,125). **Decisão:** usar os pixels da referência, declarados **uma vez** em
`chart-theme.ts` (`CHART_TYPOGRAPHY`) e em `chart-theme.css`. São medidas do
DESENHO, não tipografia de interface — e o briefing pede pixel perfect.

## [BASE] Título do card: 15,75px da referência → `Heading level={3}` (16px)

A referência pede 15,75px/600. O degrau equivalente do tema é 16px/600. **Decisão:**
usar o componente `Heading` do DS: 0,25px de diferença é invisível, e um título de
card precisa ser um heading de verdade para quem navega por leitor de tela.

## [BASE] Hover ESCURECE

A referência é explícita: o hover escurece a série (a maioria das libs clareia).
Como o recharts não tem filtro de estado, a base expõe `palette.hoverAt(i)` —
escurecimento de 20% calculado sobre a cor resolvida. Use em `activeBar`/`activeDot`.

## [BASE] Resolução de token em PROFUNDIDADE

Atributo de apresentação de SVG (`fill`, `stroke`) **não aceita `var()`**. Os slots
semânticos do Astryx apontam para os tokens do DS por referência, então a resolução
de um nível devolvia a string `var(--ds-…)` e o texto do eixo saía preto. O
`useChartPalette` agora segue a cadeia de `var()` até um literal. Isso corrige um
defeito silencioso que já existia antes da repaginação.

## [BASE] Interpolação não formata número pequeno

`{{ano}}` de 2026 formatado viraria "2.026". **Decisão:** sem pipe, inteiro com
módulo < 10.000 sai cru; acima disso ganha separador de milhar. Quem quiser outro
formato pede no pipe: `{{total|compactBRL}}`.

## [BASE] Nomes das cores de série mudaram (sem quebrar contrato)

A paleta passou a ser a da referência, na ordem dela. Os nomes internos viraram
`emerald, amber, cyan, red, green, bronze, forest, steel, navy`. Os nomes antigos
(`blue`, `orange`, `purple`, `pink`, `teal`, `brown`, `indigo`, `gray`) continuam
vÁLIDOS como alias, e `accent` (`chart-1`…`chart-5`, `primary`) continua com o mesmo
significado posicional. **Nenhuma prop pública mudou.**

---

## [SUB-02] Área — defaults que mudaram porque a referência exige

`03-tipos-de-grafico.md` §2 + `02-configuracao-base.md` §5–§7. Nenhuma prop foi
removida ou renomeada; três DEFAULTS do `AreaChart` mudaram (briefing §3.1 permite
quando a referência exige):

| Prop               | Antes       | Agora                          | Motivo                                        |
| ------------------ | ----------- | ------------------------------ | --------------------------------------------- |
| `height`           | `280`       | `320` (`CHART_HEIGHT.default`) | altura do tipo Área na referência (§2)        |
| `isSmooth`         | `false`     | `true`                         | curva **suave** é a da configuração base (§6) |
| `fill` (gradiente) | 0.35 → 0.02 | **0.4 → 0**, paradas 0 e 100   | §5, o gradiente da base                       |

Quem já passava a prop continua mandando (`isSmooth={false}` volta aos segmentos
retos, `height={280}` volta à altura antiga).

## [SUB-02] Área — modo `solid` herdou a opacidade do topo do gradiente

O modo `solid` usava `0.25`, um número solto sem origem na referência. **Decisão:**
passou a usar a MESMA opacidade do topo do gradiente (`0.4`, §5). Assim existe um
único número de opacidade de preenchimento no arquivo, e trocar `gradient` ↔ `solid`
muda a distribuição do preenchimento, não a leitura da cor. O manifesto descreve
`solid` como "cor da série com opacidade baixa" — continua verdadeiro.

## [SUB-02] Área — eixo X continua CATEGÓRICO (a referência pede data/hora)

§2 sobrepõe `xaxis.type = 'datetime'` e formata o tooltip como `dd/MM/yy HH:mm`.
**Decisão: não portar.** O `dataContract` do bloco entrega `x` já agregado pela
consulta (`"2026-01"`, `"Jan"`, `"Semana 3"`), e o rótulo do eixo é justamente o
recorte escolhido por quem escreveu a query. Converter para eixo temporal exigiria
adivinhar o formato da string, mudaria o COMPORTAMENTO (o conflito que o briefing
resolve a favor do código) e transformaria "2026-01" em "01/01/26 00:00". O visual
do eixo (12px, sem linha, sem marcações) é o da referência.

## [SUB-02] Área — ponto ativo do hover não existe na referência

A base define marcador tamanho 0 (§6) e §2 não sobrepõe nada — ou seja, a área da
referência não tem ponto nenhum. O ponto que aparece sob o cursor é affordance do
recharts, não da referência. **Decisão:** desenhá-lo com a métrica do marcador
visível da §1 (`markerVisibleSize` / `markerStrokeWidth`, contorno na cor da
superfície) e preenchimento **escurecido** (`palette.hoverAt`), que é a regra de
hover da §4. Nenhum ponto é desenhado fora do hover (`dot={false}`).

## [SUB-02] Área — legenda no rodapé (a referência põe no topo à direita)

`02-configuracao-base.md` §9 posiciona a legenda no topo, alinhada à direita. Neste
app quem reserva espaço para ela é o `ChartFrame` (slot `footer`), e o alinhamento é
decisão do `ChartLegend` — ambos são BASE. **Decisão:** consumir o primitivo como
está, sem alinhamento próprio, para que todos os cartesianos fiquem iguais entre si.
Se a base mudar a posição, o gráfico de área acompanha de graça.

## [SUB-02] Área — props OPCIONAIS novas no `AreaChart` (`state`, `errorMessage`, `scope`)

O contrato comum (briefing §5.4) manda mapear `state === 'error'` para o estado de
erro do `ChartFrame`, e o §5.3 manda todo texto passar por `chartPlainText(texto,
scope)`. O `AreaChart` não tinha por onde receber nenhum dos dois — o bloco fingia
erro reaproveitando `emptyMessage`. **Decisão:** três props OPCIONAIS novas, todas
com default que preserva o comportamento anterior. `state="success"` é ignorado de
propósito: quem sabe se há dados para desenhar é o gráfico, não quem o chama.

## [SUB-02] Testar layout dentro do SVG exige MEDIR o container (dica para os outros lotes)

O `ResponsiveContainer` do recharts só desenha depois de medir, e o polyfill de
`ResizeObserver` do `src/test/setup.ts` nunca chama o callback — no jsdom o gráfico
sai VAZIO e qualquer asserção sobre o desenho passa por vacuidade. Em
`catalog/area_chart/component.test.tsx` há um `ResizeObserver` de teste que devolve
uma medida fixa (640×320) no `observe`; com ele dá para afirmar gradiente, espessura
de traço, tracejado da grade e cor dos ticks. Vale copiar nos outros lotes — e
talvez promover ao setup global na consolidação.

## [SUB-07] Dispersão: o zoom `xy` da referência não tem equivalente no recharts

`03-tipos-de-grafico.md` §15 liga **zoom `xy`** na dispersão — a única exceção do
catálogo (§"Padrões que se repetem", item 7). O recharts 2.15 não tem zoom
interativo: só `<Brush>`, que é de UM eixo, tem cromo próprio (alças + minimapa) e
não pertence a nenhum layout da referência. Trocar/instalar biblioteca está fora
de escopo (briefing §3.4).

**Decisão:** entregar todo o resto do §15 pixel perfect e NÃO simular o zoom com
`<Brush>` nem com pan/scroll caseiro — meia-implementação seria um cromo que a
referência não tem. Lacuna registrada em `PEDIDOS-BASE.md`.

## [SUB-07] Dispersão: altura 350px, grade sem verticais e ponto sólido

Três correções de layout no bloco, todas vindas da referência:

- **altura** era 320px (default do componente) → agora `CHART_HEIGHT.scatter`
  (350px, §15 e `01-fundamentos.md` §7);
- **grade** desenhava verticais (`<CartesianGrid vertical />`) → agora só
  horizontais tracejadas, como `02-configuracao-base.md` §7 manda e §15 não
  sobrepõe;
- **preenchimento** dos pontos era `fillOpacity 0.75` → agora sólido
  (`02-configuracao-base.md` §5: "opacidade sólida 1"). O que separa pontos
  sobrepostos passou a ser o contorno do marcador, como no original.

## [SUB-07] Contorno do marcador da dispersão: 3px (o do tema)

§15 sobrepõe só o TAMANHO do marcador (6px). O contorno branco vem da base
(`02-configuracao-base.md` §6, "contorno do marcador `#FFFFFF` quando visível"),
mas a largura não está escrita em lugar nenhum da referência para este tipo — no
motor original ela cai no default da biblioteca (2px).

**Decisão:** usar `palette.geometry.markerStrokeWidth` (3px, o mesmo do marcador
de linha do §1) em vez de cravar um 2 no componente. Fica 1px mais grosso que o
original e mantém "zero hardcode". Pedido de um token fino registrado em
`PEDIDOS-BASE.md`.

## [SUB-07] Eixo X da dispersão: 8 divisões e 1 casa decimal

§15 pede 8 divisões no X (a base define 5 no Y) e valores com 1 casa decimal
(`toFixed(1)` no original → `1,0` em PT-BR). Como `chart-theme` só expõe
`yTickCount`, as duas métricas ficaram como constantes documentadas dentro de
`scatter-chart.tsx` (`X_TICK_COUNT`, `X_AXIS_DECIMALS`) e viraram pedido à base.

Para o eixo X não herdar o formatador compacto que o bloco usa no Y, o
`ScatterChart` ganhou duas props OPCIONAIS — `xAxisFormatter` e `yAxisFormatter`.
`axisFormatter` continua valendo para os dois eixos quando passado. **Nenhuma
prop existente mudou de nome, tipo ou default** (fora da altura, acima).

## [SUB-01] Linha (§1): defaults que mudaram — marcadores, curva e altura

A §1 SOBRESCREVE a base em três pontos, e os defaults do `LineChart` estavam no
valor da base, não no do tipo:

| Prop       | Antes | Agora                            | Por quê                                                         |
| ---------- | ----- | -------------------------------- | --------------------------------------------------------------- |
| `showDots` | false | **true**                         | §1: marcadores tamanho 6, contorno 3 (a base os esconde)        |
| `isSmooth` | false | **true**                         | base §6: curva **suave**; checklist §4.4 pede `type="monotone"` |
| `height`   | 280   | **320** (`CHART_HEIGHT.default`) | §1 / `01-fundamentos.md` §7 (padrão de 13 dos 18 tipos)         |

**Nenhuma prop foi removida ou renomeada** — `showDots={false}` continua
desligando o marcador, `isSmooth={false}` continua voltando para segmentos retos.
No bloco, `smooth` passou a valer `props.smooth !== false`, que é o que o
`manifest.defaultProps` (`smooth: true`) já dizia.

## [SUB-01] Linha (§1): a 1ª cor é o verde a 80%, que não está no ciclo

A §1 fixa `['rgba(0,120,103,0.8)', '#FFAB00']`. A 2ª é o âmbar do ciclo; a 1ª é o
verde escuro a 80%, que é token + opacidade (`palette.primary80`) e **não** a 1ª
cor do ciclo (`#00A76F`).

**Decisão:** a série 0 usa `palette.primary80` e as demais seguem o ciclo (a 2ª
cai no âmbar sozinha). Cor explícita na série (modo `single` do bloco, via
`accent`) vence sempre — senão o parâmetro público perderia efeito.

Dois efeitos colaterais registrados:

- **Legenda:** para a série 0 a cor vai no valor RESOLVIDO (`rgba(0,120,103,.8)`),
  não em `var(--token)`, porque token + alpha não tem forma `var()`. As demais
  continuam em `var(--ds-color-*)`.
- **Hover:** `palette.hoverAt(i)` escurece a cor do CICLO; para a série 0 usamos
  `darkenColor(palette.primary80)` — o mesmo utilitário e o mesmo fator (20%),
  aplicado à cor que está de fato desenhada.

## [SUB-01] Linha: a §1 não prevê área sob a linha, mas a prop `area` existe

O `manifest.propsSchema` do bloco declara `area` com **default `true`**, e o
manifesto é contrato com o backend/agente — não pode mudar. A §1, porém, desenha
linha pura.

**Decisão:** manter a prop e o default (comportamento segue o código), com o
preenchimento bem discreto (opacidade 0.12), para que a linha continue sendo o que
se lê. A opacidade não existe em `CHART_GEOMETRY` porque nenhum tipo da referência
a define — pedido registrado em `PEDIDOS-BASE.md`. Quem quiser o §1 puro passa
`area: false`.

## [SUB-01] Linha: legenda LIGADA, exceto série única sem nome

§1 liga a legenda. Quando a consulta não traz o campo `series`, o bloco nomeia a
série de "Série" — uma legenda de um item só com esse rótulo repete o título do
card e não informa nada.

**Decisão:** legenda ligada por padrão no componente (`showLegend = true`); no
bloco, ligada quando há mais de uma série **ou** quando a série tem nome próprio.

## [SUB-01] Linha: erro deixou de se disfarçar de "sem dados"

O bloco mandava a mensagem de erro no `emptyMessage`, então uma consulta que
falhou aparecia como estado vazio. Agora `state === 'error'` vai para o estado
`error` do `ChartFrame` (aviso, com o detalhe do erro), como manda o briefing §5.4.
Para isso o `LineChart` ganhou três props OPCIONAIS: `state`, `errorMessage` e
`scope` (o escopo de `{{variaveis}}` do contrato comum). O bloco ganhou
`emptyMessage`, override programático FORA do `propsSchema` — mesmo padrão do
`valueFormatter` que já existia.

## [SUB-01] Linha: interpolação em rótulo vindo do DADO é condicional

`chartPlainText` remove marcação de markdown (`*`, `_`, `` ` ``, `~`). Aplicá-la
sem critério em rótulo vindo da consulta transformaria `pix_enviado` em
`pixenviado`.

**Decisão:** texto CONFIGURADO do bloco (mensagem de vazio, rótulo acessível,
legenda da tabela equivalente) passa sempre por `chartPlainText(texto, scope)`;
texto vindo do DADO (nome de série, categoria do eixo, título do tooltip) só é
interpolado quando contém `{{variavel}}` (`hasVariables`).

## [SUB-01] Linha: RISCO — densidade de marcadores em série longa

Com `showDots` agora ligado por padrão e `maxRows: 5000` no manifesto, uma série
muito longa vira uma faixa sólida de marcadores de 6px. A §1 desenha ~6–12
categorias, e a referência não fala de limite.

**Não mudei nada por conta própria** (a instrução do lote é marcador visível por
padrão). Mitigação disponível hoje: `showDots={false}`. Se o orquestrador quiser
um corte automático por quantidade de pontos, é decisão de base — vale para linha
e dispersão juntas.

## [SUB-01] Linha: fixture do bloco passou a ter duas séries

`fixture.ts` tinha uma série; a §1 mostra duas cores + legenda. Como a fixture é o
que a galeria/preview desenha, ela passou a ter duas séries nomeadas
("Arrecadado"/"Previsto") nos MESMOS seis períodos (`2026-01`…`2026-06`) — o
`dataContract` (shape `series`, campo `series` opcional) continua válido.

## [SUB-05] Rosca/pizza: a sequência de cores NÃO é o ciclo de 9

`03-tipos-de-grafico.md` §9 e §10 dão às circulares uma paleta própria —
`[VERDE80, #FFAB00, #006C9C, #FF5630]` (verde escuro a 80%, âmbar, azul petróleo,
vermelho) —, que não é o ciclo de 9 cores dos cartesianos nem um prefixo dele: a
1ª cor não é `--ds-color-primary-main`, é a derivação a 80% (`palette.primary80`),
e a 3ª pula da posição 3 (ciano) para a 8 (azul petróleo).

**Decisão:** a sequência vive em `donut-chart.tsx` (só a rosca/pizza a usa),
montada a partir da paleta — `palette.primary80` + `palette.colorAt(i, nome)` — e
NÃO como lista de cores. Com mais de 4 fatias ela CICLA (a referência não fala de
um 5º caso; ciclar mantém fatias vizinhas distinguíveis). Um ponto que declare
`color` continua vencendo a sequência, que é como `accent`/`palette: "single"` do
bloco funciona.

## [SUB-05] Rosca: a cor da legenda sai do MESMO resolvedor da fatia

Como a sequência acima é específica do anel, uma legenda montada por fora (com
`palette.varAt(index)`, o ciclo padrão) mostraria cores diferentes das fatias.

**Decisão:** quem desenha a legenda própria é o `DonutChart` — ele é o dono das
cores. O bloco perdeu o `<DonutLegend>` que montava a lista por conta própria; o
que restou de específico dele (o TEXTO "valor (participação)") virou a função pura
`donutLegendValue()` em `catalog/donut/donut-legend.tsx`, passada ao gráfico pela
prop OPCIONAL nova `legendValueFormatter`. Nenhuma prop pública do manifesto mudou
e a legenda continua dizendo categoria + valor + participação.

## [SUB-05] Rosca: default de `thickness` mudou de 0,42 para o furo de 72%

A referência fixa o furo da rosca em **72% do raio** (§10). A prop pública
`thickness` (espessura do anel como fração do raio) tinha default `0.42`, que dá
um furo de 58%.

**Decisão:** `thickness` passa a ser opcional SEM default numérico; ausente, o
furo vem de `palette.geometry.donutHole` (0,72). A prop continua valendo para quem
a passa, com a mesma semântica — inclusive `thickness={1}`, que zera o furo e
transforma o mesmo componente em **pizza** (§9), exatamente como a referência, que
só troca `donut.size` entre os dois tipos. Nenhum chamador passava `thickness`.

## [SUB-05] Rosca: 240×240 fixo em vez de `ResponsiveContainer`

§9/§10 especificam `width: 240, height: 240` e modo `sparkline` (sem eixos, sem
grade, sem padding). Com `ResponsiveContainer width="100%"` o desenho deixa de ser
quadrado e o furo de 72% perde o sentido geométrico.

**Decisão:** `<PieChart width={height} height={height} margin={0…}>` — quadrado de
lado `CHART_HEIGHT.circular`, centralizado pelo `ChartFrame isCircular`. Efeito
colateral bem-vindo: em jsdom o anel passa a existir de verdade (o
`ResponsiveContainer` media 0×0 e não desenhava nada), então o teste vê o SVG.
Risco assumido: num card mais estreito que 240px o anel não encolhe.

## [SUB-05] Rosca: `donut-legend.tsx` ficou sem JSX

Depois de a legenda migrar para o `ChartLegends` da base, o arquivo passou a
exportar só uma função pura. **Mantive o nome e a extensão `.tsx`** (o import é
sem extensão e o arquivo é o mesmo do lote) em vez de renomear para `.ts` — a
renomeação é cosmética e o orquestrador consolida o lote por caminho.

## [SUB-11] `progress_bar` não existe na referência — analogia com §8 (barra horizontal)

O catálogo tem barra de progresso; a referência, não. O layout mais próximo é a
**§8, barra horizontal**, na versão ESCALAR (uma barra só, sem eixo de
categorias). **Decisão:** herdar da §8 o que é do desenho da barra — **raio
2 px** (`geometry.barRadiusFlat`), **traço 0** e cor `VERDE80`
(`palette.primary80` = `rgba(0,120,103,0.8)`, a cor mais recorrente do catálogo)
— e da §10 de `02-configuracao-base.md` a **trilha do medidor**
(`rgba(145,158,171,0.16)` = `chrome('track')`). Rótulo e leitura ficam ACIMA da
barra, como nas linhas do ranking (§8 + legenda própria), com a tipografia da
**legenda própria**: 11,375/500 no rótulo e 14,875/600 no valor.

## [SUB-11] `ChartBarTrack`: cápsula → raio 2 px, e trilha sólida → trilha a 16 %

A marca de dado do DOM (usada por `progress_bar` e pelo ranking do
`leaderboard`) desenhava cápsula (`--radius-full`) sobre `--color-track` do
Astryx — um cinza SÓLIDO (#CCD3DB). A referência não usa cápsula em barra
(arredonda 2 px) e a trilha dela é translúcida a 16 %. **Decisão:** trocar as
duas coisas DENTRO do componente. **Nenhuma prop mudou** (`ratio`, `color`,
`size` seguem idênticas), então os blocos de outros lotes que o consomem só
herdam o visual novo. A largura passou a animar com `motion.duration` (360 ms),
desligada por `prefers-reduced-motion` (via `useReducedMotion` do `motion/react`,
o padrão já usado em `shared/ui/animated-number.tsx`).

## [SUB-11] O bloco saiu do `ProgressBar` do Astryx (e o `source` do manifesto)

A barra do DS é cápsula, pinta só por variante semântica e traz tipografia
própria — não dá para chegar em raio 2 px, trilha a 16 % e 11,375/14,875 por
configuração. **Decisão:** desenhar com `ChartBarTrack` dentro do `ChartFrame`,
como o resto do catálogo. Consequência no manifesto: `source` deixou de ser
`astryx:progress-bar` e virou `custom` (é metadado de ORIGEM, não prop). O
`propsSchema` segue com as MESMAS props, tipos, enums e defaults; só as
`description` de `variant`/`accent` foram corrigidas, porque descreviam o
comportamento do componente do DS que não existe mais aqui.

`accent` volta a pintar com a COR DE SÉRIE do tema (`varAt(0, accentColor)`) em
vez de "a cor de destaque genérica" — que era o que sobrava quando a barra era a
do DS. A precedência não mudou: acento preenchido continua vencendo `variant`.

## [SUB-11] Altura da caixa do desenho: `CHART_HEIGHT.spark`

`ChartFrame` exige uma altura e a referência não tem medida para "barra
escalar". **Decisão:** usar `CHART_HEIGHT.spark` (56 px), a única altura
compacta do tema — o conjunto rótulo + barra ocupa ~38 px e fica centrado nela,
e o corpo do `BlockFrame` (família `compact`, 160 px) centraliza o resto. Nada
de número novo inventado no componente.

## [SUB-11] Cor do rótulo e do valor (a referência só fixa tamanho e peso)

A legenda própria da referência HERDA a cor do item (a cor da fatia), o que não
faz sentido num progresso de série única. **Decisão:** rótulo em
`chrome('label')` (`#637381`) e valor em `chrome('emphasis')` (`#1C252E`) — o
mesmo par que a referência usa nos rótulos centrais de rosca/medidor
(`02-configuracao-base.md` §10), onde também há um valor e uma legenda.

## [SUB-11] Vocabulário extra de interpolação: `{{escala}}` e `{{leitura}}`

`buildChartScope(data)` deriva o escopo dos DADOS, e a escala do progresso é
PROP (`max`), não dado. **Decisão:** publicar `escala` (o `max` efetivo) e
`leitura` (o valor já formatado: "68%" ou "125 de 500") pelo `extra` do
`buildChartScope`, que é o canal previsto para "o que só o bloco sabe".
`{{valor}}`, `{{total}}` e os demais seguem valendo.

## [SUB-03] Coluna: onde cairia a 1ª cor do ciclo, entra o VERDE80

§4, §5 e §6 pintam a primeira série com `rgba(0,120,103,.8)` (`palette.primary80`),
não com o verde puro `#00A76F`. Só que o `manifest.defaultProps` do bloco declara
`accent: 'chart-1'` — ou seja, o caso COMUM chega ao gráfico com uma cor explícita
que é justamente a 1ª cor do ciclo. Aplicar o VERDE80 apenas "quando ninguém pediu
cor" deixaria o layout da referência inalcançável na configuração padrão.

**Decisão:** a regra é sobre a COR, não sobre a origem dela — quando o token
resolvido da série é o da 1ª cor do ciclo (`--ds-color-primary-main`), a coluna sai
em VERDE80. Isso cobre o ciclo (série 0), o `accent: 'chart-1'`/`primary` e o
`seriesColors: ['emerald']` com o mesmo resultado, e mantém `chart-2`…`chart-5`
mandando na cor. A diferença entre os dois verdes é só a opacidade (o matiz é o
mesmo), então nenhuma escolha de quem configurou o painel é contrariada.

> **Divergência conhecida com o SUB-01 (linha):** lá, cor explícita vence sempre, e
> `accent: 'chart-1'` continua no verde puro. Harmonizar é uma linha nos dois lados —
> registro aqui para a consolidação decidir qual regra vale para o catálogo inteiro.

Efeitos colaterais (idênticos aos do SUB-01): na legenda a série vai com o valor
RESOLVIDO (`rgba(0,120,103,.8)`) em vez de `var(--token)`, porque token + alpha não
tem forma `var()`; e o hover usa `darkenColor(palette.primary80)`, o mesmo utilitário
e o mesmo fator de 20% do `palette.hoverAt`.

## [SUB-03] "Traço de 2px transparente" (§5) → `barGap` de 2px

O respiro entre as colunas vizinhas de um grupo é feito no motor original com um
CONTORNO transparente de 2px. Em SVG isso não funciona: `stroke="transparent"` não
apaga o preenchimento, ele só não pinta nada — as colunas continuariam encostadas.

**Decisão:** traduzir a INTENÇÃO (o respiro) para o recurso equivalente do recharts,
`barGap={2}`, com a mesma medida. Conferido no SVG: colunas de 31px com 2px entre
elas, grupo ocupando 48% da faixa, como a §5 pede.

## [SUB-03] Largura da coluna: `barCategoryGap` derivado, não `barSize`

O recharts não tem "largura da coluna em %": ele recorta a faixa pelos DOIS lados
(`barCategoryGap` vale para cada um) e o que sobra é a coluna. A conversão
(`gap = (1 − largura) / 2`) é feita em runtime porque a largura depende do layout
(§4 40%, §5 48%, §6 36%) e da largura da TELA (§11: 60% <900px, 80% <600px). É a
exceção de "geometria que depende de runtime" prevista no briefing §3.2 — e a única
aritmética de estilo do arquivo. Medido: 53px de coluna numa faixa de 134px = 39,5%.

## [SUB-03] Empilhada: o raio de 4px fica só no ÚLTIMO segmento

`chartBarRadius(palette, isStacked)` devolve `undefined` para pilha, porque
arredondar TODOS os segmentos criaria um degrau no meio da coluna. Só que a base do
motor original aplica o raio "na ponta" (`borderRadiusApplication: 'end'`), e a §6
não desliga isso — a pilha tem topo arredondado.

**Decisão:** aplicar `chartBarRadius(palette)` apenas na última série da pilha (a que
forma o topo) e deixar as demais sem raio. Se a série do topo valer 0 numa categoria,
aquela coluna fica reta — mesmo comportamento do motor original.

## [SUB-03] §7 (coluna negativa): faixa RELATIVA e detecção automática

A referência fixa as faixas em valores absolutos (`−100 a −46` âmbar, `−45 a 0`
ciano) porque o exemplo dela é uma escala de porcentagem. O catálogo não conhece a
escala em tempo de projeto (a mesma prop serve para R$, contagem e %).

**Decisão:** a fronteira é relativa à queda mais funda do dado — 45% dela, que é
exatamente onde a referência a coloca quando o mínimo é −100 — e o modo LIGA SOZINHO
quando a série única tem valor negativo. Nenhuma prop do manifesto mudou; o
`BarChart` ganhou a prop OPCIONAL `hasColorByValue` para forçar ou desligar. Valores
positivos na mesma série continuam com a cor da série. Conferido com
`[-100, -60, -30, -10]`: âmbar, âmbar, ciano, ciano — igual à referência.

## [SUB-03] §4 e §7: tooltip SEM título (a categoria sai da faixa cinza)

As duas seções pedem `tooltip.x.show = false`. Numa série única isso significa que o
tooltip mostra só "Valor: 120", sem dizer "Jan" — o que é uma informação a menos que
o bloco dava antes.

**Decisão:** seguir a referência (o briefing resolve conflito de LAYOUT a favor
dela). A mitigação é que o cursor já destaca a coluna e a categoria está logo abaixo,
no eixo; e a leitura completa (categoria + valor) continua publicada na tabela
equivalente para leitor de tela. §5 e §6 mantêm o título, como a referência pede.

## [SUB-03] §6: "legenda à direita" virou `align="end"` ABAIXO da plotagem

A referência põe a legenda no topo à direita; neste app quem reserva espaço para
legenda é o `ChartFrame` (slot `footer`), abaixo do desenho — decisão da BASE, comum
a todos os cartesianos. **Decisão:** honrar o EIXO que a §6 especifica (à direita)
com `align="end"` no rodapé, e manter centralizada nos demais layouts. A marca de
cor também passou de barrinha para CÍRCULO (`shape` default do `ChartLegend`), que é
o que a referência usa em todas as legendas.

## [SUB-03] Altura: default subiu de 280 para 320px (§4–§7)

§4–§7 fixam 320px (`CHART_HEIGHT.default`, a altura de 13 dos 18 tipos), e os lotes
irmãos (SUB-01 linha, SUB-02 área) já subiram os deles — deixar a coluna em 280
quebraria o alinhamento entre gráficos vizinhos no mesmo painel. **Decisão:**
`height = CHART_HEIGHT.default`. Nenhuma prop mudou de nome ou tipo; quem passava
`height` continua mandando.

**Risco registrado:** `render-engine/lib/block-sizing.ts` reserva 312px ao corpo dos
blocos de série (é `minHeight`, então o card cresce, não corta) — o desenho + legenda
passa a pedir ~348px, e o card ganha ~35px quando o dado chega. É o MESMO desvio dos
lotes de linha e área, e a correção é um número num arquivo compartilhado, fora do
alcance dos subagentes: pedido registrado em `PEDIDOS-BASE.md`.

## [SUB-05] Rosca: fixture passou a ter quatro categorias

`fixture.ts` tinha três. A sequência de cores da §9 tem QUATRO, e a fixture é o
que a galeria/preview desenha — com três, a última cor (vermelho) nunca aparecia
em tela de exemplo. Acrescentei "Cancelado" (11); o `dataContract` (shape
`categorical`) e todos os testes seguem válidos.

## [SUB-04] §8: "grade só horizontal" virou a grade do eixo de VALOR (vertical)

A checklist da referência (`01-fundamentos.md` §9) diz "grade só horizontal", mas
essa frase descreve os tipos de COLUNA, em que o eixo de valor é o Y. Na barra
horizontal os papéis se invertem: o valor passa a ser o eixo X. Duas leituras eram
possíveis — manter as linhas horizontais na tela (que aqui cairiam ENTRE as
categorias, sem ajudar a ler nada) ou manter a grade **do eixo de valor**.

**Decisão:** grade do eixo de VALOR, ou seja, linhas verticais tracejadas `3` na
cor da divisória (`chartGridProps` + `vertical horizontal={false}`). Três razões:
(1) é o que o ApexCharts desenha numa barra horizontal com a configuração base
(`grid.xaxis.lines.show: false` continua desligando as linhas perpendiculares ao
eixo de CATEGORIA); (2) é a única grade que serve para comparar comprimentos de
barra; (3) é o que o bloco já fazia antes da repaginação — a mudança seria
regressão de leitura, não fidelidade. Pelo mesmo motivo, as **5 divisões**
(`chartYAxisProps`, 6 marcas) foram aplicadas ao eixo X: elas são do eixo de
valor, não do eixo Y geometricamente.

## [SUB-04] `barCategoryGap` do recharts é a folga de CADA LADO, não a total

A §8 declara a ALTURA DA BARRA (30% da faixa, `geometry.hBarWidth`). O recharts
não tem `barHeight`: ele calcula `tamanho = faixa − 2 × barCategoryGap`. Ou seja,
`barCategoryGap="70%"` (o complemento inteiro) produz altura NEGATIVA e desloca a
barra dentro da faixa — medido no SVG: `height="-54"` numa faixa de 135px.

**Decisão:** `barCategoryGap` = metade do complemento (`(1 − 0.3) / 2` = **35%**).
Conferido no SVG: barra de 40px numa faixa de 135px (29,6% — o recharts trunca
para inteiro) e centralizada na faixa. O cálculo mora em `h-bar-chart.tsx` porque
depende do dado em runtime (quantas categorias cabem), com o porquê comentado.

## [SUB-04] Altura: 320px da referência (8px acima do `block-sizing`)

A §8 fixa **320px** e o default público do `HBarChart` era 280. Subi para
`CHART_HEIGHT.default` (320), como fizeram SUB-01 e SUB-02 nos cartesianos deles.
Efeito colateral conhecido: `lib/block-sizing.ts` reserva 312px ao corpo dos
blocos de série, e o valor é `minHeight` — então o card cresce 8px quando o dado
chega (o SUB-03 preferiu manter 280 por causa disso). Pedido registrado em
`PEDIDOS-BASE.md`; alinhar na consolidação para os quatro lotes terem a mesma
altura. Como o `bar_chart` horizontal também usa o `HBarChart` sem passar
`height`, ele herda os mesmos 320.

## [SUB-04] O widget de 360px (`04-widgets-prontos.md` §3) NÃO foi aplicado

A linha "Barra horizontal com rótulos" (_taxas de conversão_) descreve um WIDGET:
360px de altura, traço de 2px transparente e tooltip compartilhado. O layout do
catálogo para este bloco é a §8 (320px, **traço 0**), e o traço transparente da
referência serve para separar colunas VIZINHAS de um grupo — coisa que a barra
horizontal de série única não tem. **Decisão:** seguir a §8; o widget vira um
preset se algum dia o produto pedir rótulos de dado dentro da barra.

## [SUB-04] VERDE80 é o default; `palette: "multi"` e cor por ponto continuam valendo

A §8 pinta a barra com `rgba(0,120,103,0.8)` (`palette.primary80`) — e é isso que
sai quando o bloco não pede nada. Mas `hasColorByCategory` (prop pública, usada
pelo `palette: "multi"` do manifesto) e a cor por ponto são CONTRATO: nesses dois
casos a cor continua vindo do ciclo da paleta, porque um painel salvo com
"multi" não pode virar monocromático. A referência não cobre esse modo.

## [SUB-04] Props novas (todas OPCIONAIS) no `HBarChart`

`scope` (variáveis extras de `{{interpolação}}`), `state` e `errorMessage`. As
duas últimas implementam o §5.4 do briefing (`state === 'error'` → `Banner` do
`ChartFrame`, em vez da mensagem de erro no lugar do "sem dados"). `state`
ignora `success` de propósito: com a consulta vazia, o estado "sem dados"
continua valendo. Nada foi renomeado ou removido — `manifest.propsSchema` está
intocado.

## [SUB-08] Spark: a cor é o tom `dark` da família, não a `main`

`04-widgets-prontos.md` §2.3 é explícito: o mini-gráfico do card de resumo usa
`<cor>.dark` (primary → `#007867`), enquanto o resto do catálogo usa a `main`.
**Decisão:** sem cor escolhida, `palette.chrome('primaryDark')`; com cor
escolhida, o passo `dark` da rampa daquela família (`palette.ramp(cor)[3]`).
Famílias que já SÃO um tom escuro (`forest`, `navy`, `steel`, `bronze`) não têm
rampa no tema e vão como estão — escurecê-las de novo apagaria a distinção
entre elas.

## [SUB-08] Altura do spark: default por VARIANTE, largura por quem usa

A referência dá três dimensões (§2.4): linha 84×56, barra 60×40, área 100×66 —
e `CHART_HEIGHT.spark` (56) é justamente a da variante linha. **Decisão:** a
ALTURA vira o default do `SparkChart` por variante; a LARGURA fica documentada
em `SPARK_SIZE` mas NÃO é imposta, porque nos nossos cards a caixa é fluida
(`ResponsiveContainer` a 100%) e travar 84px deixaria o desenho boiando num
card de 300px. Quem quer a largura da referência a impõe: o `signal_card` fixa
os 100px da variante área. Consequência: o bloco `spark_chart` deixou de usar
os 80px cravados que tinha e passou a herdar a altura da variante.

## [SUB-08] `signal_card`: variação vira ícone + texto, não `DeltaBadge`

O selo (`DeltaBadge`) desenha fundo, borda e raio; a referência (§2.2) pede um
bloco solto de ícone 20px + texto 12,25px/600 flutuando a 16px do topo e da
direita, sem chrome nenhum. **Decisão:** trocar o selo pelo bloco da
referência, PRESERVANDO a regra que o selo carregava — a cor sai de
`trendPolarity` (leitura de negócio), não do sinal do número. O gancho de teste
mudou de `[data-slot="delta-badge"]` para `[data-slot="signal-card-trend"]`,
com o mesmo `data-variant` (`success`/`error`). Nenhuma prop pública mudou;
`DeltaBadge` continua em `@/shared/ui` para KPI e ladrilho.

## [SUB-08] `signal_card`: sem ícone 48px, o topo precisa de respiro reservado

Na referência o bloco de tendência é absoluto e não colide com nada porque
acima do título existe um ícone de 48px (§2.2). O `signal_card` não tem ícone —
o título nasceria embaixo da variação. **Decisão:** reservar 12px
(`--spacing-3`) acima do conteúdo, SEMPRE (com ou sem variação), para que uma
fileira de sinais tenha cards da mesma altura. 24px de padding + 12px = 36px =
exatamente onde termina o bloco de tendência (16px + ícone de 20px).

## [SUB-08] Fundo em gradiente e forma decorativa do card de resumo: NÃO herdados

§2.1 descreve o card com gradiente 135° `<lighter>/0.48 → <light>/0.48` e um SVG
decorativo de 240×240 atrás do conteúdo. **Decisão:** não replicar. O
`manifest` do `signal_card` documenta `accent` como "cor da tendência
desenhada; NUNCA o fundo do cartão" — pintar o fundo quebraria esse contrato e
a leitura de uma fileira de sinais de cores diferentes. Ficaram as medidas que
o briefing pediu: padding 24px, sem sombra, tipografia e bloco de tendência.

## [SUB-08] `curveType: 'step'` passou a ter efeito

O `spark_chart` mapeava `curveType` para um booleano (`isSmooth`), então
`'linear'` e `'step'` desenhavam a mesma coisa e a prop do manifesto era meia
morta. **Decisão:** o `SparkChart` ganhou a prop OPCIONAL `curve`
(`linear|monotone|step`), que vence `isSmooth` quando informada. `isSmooth`
continua existindo e com o mesmo default. Nenhuma prop pública do manifesto
mudou — só passou a ser obedecida.

## [SUB-09] Ranking em DOM não existe na referência — repaginado por ANALOGIA

A referência tem 18 tipos e nenhum é um "ranking em DOM" (lista de linhas com rótulo,
valor e barra proporcional, em HTML e não em SVG). **Decisão:** combinar os dois
layouts mais próximos, sem inventar um terceiro:

- **Barra** → §8 Barra horizontal: raio 2px (`geometry.barRadiusFlat`), traço 0 e
  altura de 30% da faixa (`geometry.hBarWidth`).
- **Trilho** → `chrome('trackLight')`, a trilha clara (8%) da §3 dos fundamentos.
- **Cor** → `palette.primary80` (o VERDE80 da §2.1) na série única; ciclo da paleta
  em `palette: "multi"`.
- **Rótulo e valor** → §05-3 Legenda própria: rótulo 11,375px/500, valor peso 600.
- **Hover** → §02-4: ESCURECE (`darkenColor`), com a LINHA inteira como área de hover.

`bar_list` e `leaderboard` usam a MESMA barra (`RankingBar`, em `charts/bar-list.tsx`):
um ranking de categorias e um de pessoas têm que ler igual.

## [SUB-09] A "faixa da categoria" de um ranking em DOM

A §8 define a altura da barra como 30% da FAIXA DA CATEGORIA — que num gráfico com eixo
é `altura ÷ nº de categorias`. Num ranking em DOM não existe faixa: a lista rola e cada
linha tem a altura do próprio conteúdo. **Decisão:** declarar a faixa como constante do
desenho (`RANKING_ROW_BAND = 32px`, a linha de texto + a barra) e derivar a barra dela
com o MESMO fator da referência → 10px. A proporção "a barra ocupa 30% da faixa"
continua verdadeira e a altura não é um número escolhido a dedo.

## [SUB-09] Valor da legenda própria: 14,875px → o degrau de 14px do tema

O rótulo (11,375px/500) cai EXATO no degrau `3xs` do tema. O valor (14,875px/600) não
tem degrau equivalente (o tema tem 14 e 15,75). **Decisão:** `Text size="sm"` (14px)
com peso 600, pelo mesmo critério já registrado em [BASE] para o título do card
(15,75 → 16): a diferença é invisível, e trocar o `Text` do DS por um `<span>` com
`font-size` inline custaria tooltip de truncamento, cor e numeração tabular.

## [SUB-09] O texto do ranking NÃO herda a cor da série

Na legenda própria da §3 o rótulo e o valor herdam a cor do item ("uma variável controla
tudo"). Em 3 fatias isso funciona; em 10 linhas de ranking o texto inteiro fica verde a
80% — contraste ~3,9:1 sobre o branco, reprovado em AA para texto pequeno. **Decisão:**
da §3 vem só a TIPOGRAFIA; a cor do texto continua sendo a de leitura do DS (rótulo
`secondary`, valor `primary`) e a cor da série fica onde ela é dado: na barra.

## [SUB-09] `accent: "chart-1"` (o default) quer dizer "a cor principal" → VERDE80

A referência usa `rgba(0,120,103,0.8)` na série única e o ciclo de 9 cores no resto
(§2.1). Só que o `bar_list` tem `accent: "chart-1"` como DEFAULT do manifesto: todo
bloco chega com a 1ª cor do ciclo declarada e o VERDE80 nunca apareceria. **Decisão:**
em série única, a 1ª cor do ciclo (`chart-1` / `primary` / `emerald`) é lida como "a cor
principal" e resolve para `palette.primary80`; qualquer OUTRO acento vence e é usado
como está. Nenhuma prop mudou e `accent` continua tendo efeito.

## [SUB-09] `BarList` continua sendo TEXTO — e por isso não entra na região do `ChartFrame`

O `ChartFrame` sempre aplica um papel gráfico (`img` / `meter` / `progressbar`) na área
de plotagem, e `role="img"` PODA os descendentes da árvore de acessibilidade — a lista
deixaria de ser lida linha a linha. **Decisão:** o estado de sucesso é a `<ol>` crua
(comportamento atual, mantido) e os demais estados usam os primitivos da base:
`ChartSkeleton` (a onda da §8 dos fundamentos, com a altura da lista que vai aparecer),
`EmptyState` e `ChartFrame state="error"` — que nesse estado desenha só o Banner, sem
papel gráfico. Pedido de um `ChartFrame` sem papel registrado em `PEDIDOS-BASE.md`.

## [SUB-09] Mensagem de vazio: markdown achatado

`EmptyState.title` do DS é `string`. **Decisão:** interpolar com `chartPlainText` — a
`{{variavel}}` funciona integralmente e o markdown inline é achatado, em vez de vazar
`**` na tela. É a mesma escolha que a base já fez no `ChartFrame` e no `BlockFrame`.

## [SUB-13] Funil não existe na referência: §8 para a forma, §6 para a cor

`funnel_stage` não tem layout correspondente em `03-tipos-de-grafico.md`. Repaginado
por ANALOGIA, com as duas seções mais próximas:

- **forma da etapa** → **§8 Barra horizontal**: raio **2px** (`geometry.barRadiusFlat`),
  **traço 0**, barra fina, trilha atrás;
- **divisão em desfechos** → **§6 Coluna empilhada**: um mesmo total repartido em
  partes ORDENADAS. Como são partes de um todo (e não categorias independentes), a
  cor sai da **rampa sequencial** (`chartRampToken`), não da paleta categórica.

## [SUB-13] A rampa vai do CLARO ao ESCURO, e o passo 5 é do hover

Os segmentos usam os passos **1→4** da rampa (claro → escuro), nessa ordem. O passo 5
(o tom mais escuro) fica **reservado ao hover**: passar o mouse avança UM passo, o que
garante o "hover ESCURECE" da referência (`01-fundamentos.md` §9) inclusive no último
segmento — se a base já usasse o 5, o hover do último não teria para onde ir.

Efeito colateral aceito: no primeiro segmento (normalmente o maior) a barra começa no
tom mais claro. É o preço de uma progressão sequencial legível; a alternativa (começar
escuro) inverteria a leitura pedida no lote.

Antes da repaginação a ordem era 5→2 (escuro → claro).

## [SUB-13] Trilha: `chromeVar('trackLight')` — a barra é DOM, não SVG

O papel de chrome é o pedido no lote (`trackLight` = "trilha alternativa, mais clara",
`01-fundamentos.md` §3). A FORMA usada é `palette.chromeVar('trackLight')`
(`var(--ds-color-action-hover)`) e não `palette.chrome(...)`: a barra é DOM, e a própria
base documenta que valor resolvido é para SVG e `var(--token)` para DOM. Assim trocar o
tema repinta a barra sem re-render — e o teste que proíbe hex/rgb/rgba no HTML do bloco
continua valendo como rede de segurança.

## [SUB-13] Altura da barra: 16px, derivada dos 30% da §8

A §8 declara a altura da barra como **30% da faixa**, o que só existe num plano
cartesiano. Traduzido: numa área de 320px com ~6 categorias a faixa tem ~53px, logo a
barra tem ~16px — que é `--spacing-4` na escala do DS. Antes eram 32px (`--spacing-8`),
grosso demais para uma barra de dados ao lado de texto de 11–15px.

## [SUB-13] Estados: `ChartFrame` cobre os quatro, o desenho fica fora dele

`funnel_stage` é card próprio (não recebe `BlockFrame`), então cabeçalho e estados são
dele. Carregando / vazio / erro / sem permissão são delegados ao `ChartFrame` (com o
rótulo da etapa no cabeçalho, `isCompact` e altura de 56px = o que a etapa fechada
ocupa). No estado de SUCESSO o `ChartFrame` não é usado: sua região de plotagem tem
`role="img"`, que **poda os descendentes** da árvore de acessibilidade — e o corpo desta
etapa é um `Collapsible` interativo, que precisa continuar navegável.

## [SUB-13] "Sem permissão" derivado da mensagem de erro

`BlockRenderState` só tem `error`, mas o contrato comum pede o estado "sem permissão"
(que pede outra ação de quem lê: pedir acesso, não tentar de novo). O bloco reconhece
403/forbidden/unauthorized/"sem permissão"/"não autorizado" na mensagem e usa
`state="forbidden"` do `ChartFrame`. Se o motor de blocos ganhar um estado próprio,
troque a heurística por ele.

## [SUB-13] Tipografia do cabeçalho: legenda própria (§3) + "Total" central (§4)

Sem layout de funil na referência, o par "rótulo em cima, número embaixo" foi tirado da
LEGENDA PRÓPRIA (`05-tooltip-legenda-css.md` §3): rótulo **11,375/500**, marca de cor a
**6px**, valor **14,875/600** a **8px** abaixo. A **taxa de conversão** usa o degrau do
rótulo "Total" central (**12,25/600**, `01-fundamentos.md` §4) na cor secundária — mesmo
papel: número de apoio ao lado do número principal. Tudo lido de `palette.typography`.

## [SUB-13] Prop nova, opcional: `emptyMessage`

O contrato comum manda a mensagem de vazio aceitar Markdown + `{{variavel}}`, e ela era
uma constante no componente. Virou prop OPCIONAL no `propsSchema` (default inalterado:
"Sem dados para esta etapa"). Nenhuma prop existente foi renomeada, removida ou teve o
default alterado. Não foram criadas props de subtítulo/descrição: o cabeçalho desta
etapa é o `stageLabel`, e o `barLabel` já cobre a linha de apoio.

## [SUB-10] `kpi`, `stat_tile` e `metric_glow` passam a ser o MESMO card

`04-widgets-prontos.md` §2 descreve **um** card de resumo, e §2.4 lista quatro
variações dele que mudam apenas o mini-gráfico ao lado do número — nunca o padding,
a tipografia ou a ordem de leitura. O catálogo tinha três geometrias diferentes para
a mesma informação (KPI com rótulo à esquerda, ladrilho um degrau menor, métrica
centrada com halo), o que fazia três indicadores iguais parecerem de produtos
diferentes na mesma tela.

**Decisão:** uma casca só — `SummaryCard`, em `shared/ui/kpi-card.tsx` — consumida
pelos três. O que continua distinguindo cada bloco é o CONTRATO (props, defaults de
formato, `hint`) e, no `metric_glow`, a forma decorativa. `StatTile` virou uma
delegação fina para `KpiCard`; nenhuma prop pública dos três manifestos mudou.

Consequência assumida: o `stat_tile` deixou de ser "o irmão denso". Se a densidade
voltar a ser requisito, a saída é um `isCompact` na casca — não uma segunda escala
tipográfica.

## [SUB-10] O gradiente da família sai dos slots de cor do tema, não de hex

§2.1 pede fundo em gradiente 135° de `<lighter>/0.48` para `<light>/0.48` e texto em
`<darker>` da mesma família. O tema publica exatamente esse quarteto por família, já
com a inversão do modo escuro embutida (`light-dark()`), e o nome da família é o
MESMO da variante de cor do `Card` — que é o que `chartAccentCardVariant()` devolve:

| Slot                           | Resolve para                                   |
| ------------------------------ | ---------------------------------------------- |
| `--color-background-<familia>` | `light-dark(--ds-color-<X>-lighter, -darker)`  |
| `--color-border-<familia>`     | `light-dark(--ds-color-<X>-light,   -dark)`    |
| `--color-text-<familia>`       | `light-dark(--ds-color-<X>-darker,  -lighter)` |
| `--color-icon-<familia>`       | `light-dark(--ds-color-<X>-dark,    -light)`   |

**Decisão:** montar o gradiente com `color-mix(in srgb, var(<slot>) 48%, transparent)`
em `style`. O gradiente é COMPOSIÇÃO — o `Card` expõe `variant` (uma cor chapada), não
uma rampa de duas paradas a 48% —, e o `style` é a única forma que vence as classes
atômicas do StyleX (que ficam fora de `@layer` e ganham de qualquer utility).

Preferi os slots de família aos `--ds-color-<X>-<tom>` crus por três motivos: (1) são
exatamente esses tokens, só que já pareados para claro/escuro — no modo escuro o card
escurece em vez de virar um bloco claro no meio de uma tela escura; (2) a família
`gray` não tem `lighter`/`darker` no DS (é escala numérica) e só o slot resolve isso;
(3) o nome da família vem direto de `chartAccentCardVariant()`, sem uma segunda tabela
de tradução. Zero hex, zero rgb.

O `Card` fica na variante `default` (superfície de papel) porque a referência diz
`#FFFFFF` **mais** o gradiente. Passar também `variant` pintaria a família duas vezes e
o card sairia um tom mais saturado que a referência.

## [SUB-10] Ícone de 48×48: a medida é da CAIXA, não do glifo

§2.2 pede ícone de 48×48 com 24px de respiro abaixo. Na referência ele é uma
ilustração (`ic-glass-bag.svg`), não um ícone de traço. O `Icon` do DS vai até 24px
(`size="lg"`) e a orientação do próprio DS é não redimensionar ícone com pixel
arbitrário.

**Decisão:** a CAIXA tem as 48×48 da referência (`--spacing-12`) e dentro dela vai o
`Icon` no maior passo, herdando a cor `darker` da família. A medida do layout é
respeitada; ampliar um traço de 1,5px para 48px deixaria o desenho raquítico.

## [SUB-10] A forma decorativa de 240×240 não foi replicada — o slot existe

§2.1 descreve um SVG decorativo (240×240, `top: 0`, `left: -20px`, opacidade 24%,
`z-index: -1`). Não há esse asset no projeto e inventar um seria desenho novo, não
repaginação. **Decisão:** a casca expõe o slot `decoration` com a semântica da
referência (cobre o card, atrás do conteúdo, `aria-hidden`), e quem o preenche hoje é
só o `metric_glow` — com o halo que já era a identidade dele. Se o asset chegar, os
outros dois cards o recebem sem tocar em composição.

Para o `z-index: -1` funcionar sem sumir atrás do próprio fundo do card, a superfície
ganhou `isolation: isolate` (cria o contexto de empilhamento).

## [SUB-10] Bloco de tendência: cor de TEXTO semântica, não o selo

§2.2 desenha a tendência como ícone de 20px + texto 12,25px/600, sem chip e sem
borda, na cor do card. O `DeltaBadge` desenhava um selo com fundo — sobre a superfície
pastel do card ele vira alarme.

**Decisão:** `DeltaBadge` ganhou a prop OPCIONAL `appearance` (`badge` | `trend`), com
default `badge` — quem já o consumia (o `signal_card`, de outro lote) não vê diferença
nenhuma. Os cards de resumo usam `trend`.

A cor continua sendo LEITURA DE NEGÓCIO (`higherIsBetter`), mas em tom de TEXTO
(`--color-success` / `--color-error`, que o tema resolve para o `darker` da família no
claro). A referência desenha a seta sem cor porque o produto dela não tem essa regra;
perdê-la aqui seria regressão de comportamento, que o briefing resolve a favor do
código.

## [SUB-10] Valor 17,5px/700: `size="xl"` + `weight="bold"`, não um `type` semântico

A referência pede `h4` → **17,5px/700**. A escala de título deste tema foi
reancorada (o `display-3` é 16px/600), então nenhum `type` do `Text` cai nesse par —
mas os dois tokens existem: `--font-size-xl` é 17,5px e `--font-weight-bold` é 700.
**Decisão:** `<Text type="body" size="xl" weight="bold">`. É a exceção que a própria
orientação do DS admite ("não sobreponha quando um `type` já casa") — aqui nenhum
casa, e a alternativa seria um `font-size` inline. Título e texto de tendência caem
EXATOS no `type="label"` (12,25px/600), sem sobreposição nenhuma.

## [SUB-10] O número continua rolando quando o valor formatado não tem Markdown

O contrato comum manda o valor aceitar Markdown + `{{variavel}}`, e `ChartText` é
quem sabe renderizar isso — mas ele descarta a rolagem por dígito do
`AnimatedNumber`, que é o que faz "o KPI mudou" ser percebido sem piscar o card.

**Decisão:** três caminhos, em ordem: sem valor formatado → `AnimatedNumber` puro;
valor formatado COM marcação inline (asterisco, sublinhado, crase, til, colchete) →
`ChartText`; valor formatado sem marcação → interpola as `{{variaveis}}` e continua
rolando. Na prática os três blocos caem no terceiro caminho e mantêm a animação.

## [SUB-10] Props novas (todas OPCIONAIS) no `KpiCard`/`StatTile`

`state`, `emptyMessage`, `error`, `scope`, `media`, `decoration` e `slot`; `value`
passou de obrigatória a opcional (widening — nenhum chamador quebra). `state`
implementa o §5.4 do briefing: `loading`/`empty`/`error` deixaram de depender de dois
booleanos e o erro parou de se disfarçar de "sem dados". `media` é o slot do
mini-gráfico de 84×56 da §2.2 — **nenhum dos três blocos o preenche** (o mini-gráfico
é do lote SUB-08); ele existe porque é o que dá sentido ao `flex-grow: 1` /
`min-width: 112px` da coluna de texto, que são medidas da referência.

Nenhuma prop foi renomeada ou removida, e os três `manifest.propsSchema` estão
intocados.

## [SUB-06] Três medidores da referência, um bloco só → prop `variant` (opcional)

A referência tem TRÊS medidores (`03-tipos-de-grafico.md` §11 barra radial, §12
semicircular, §13 tracejado) e o catálogo tem UM bloco (`radial_gauge`).
**Decisão:** o `RadialGauge` implementa os três layouts numa prop `variant`
(`semicircle` | `radial` | `dashed`), default `semicircle` — o alvo do bloco. A
prop foi ACRESCENTADA ao `propsSchema` (opcional, com default), o que o briefing
§3.1 permite; nenhuma prop existente mudou de nome, tipo ou default.

## [SUB-06] `accent` no valor PADRÃO = "sem escolha de cor"

§12 pinta o medidor com o par roxo #8E33FF → #C684FF, e a referência é explícita
(`01-fundamentos.md` §2.1) que o roxo existe **apenas** em medidores radiais. Só
que `defaultProps.accent` do bloco é `chart-1` (o verde do produto), e o renderer
mescla os defaults — passar o acento sempre significaria "nunca roxo".
**Decisão:** o bloco só repassa `color` quando `accent` DIFERE do default do
manifesto; no default, o medidor usa o par de cores do próprio layout (roxo no
semicircular, vermelho no tracejado, como na referência). Escolher `chart-2`…
`chart-5`/`primary` continua pintando o arco, então a prop segue com efeito.

## [SUB-06] Par do gradiente = tom `-light` da MESMA família do DS

Os três medidores usam pares claro/escuro de uma mesma cor (#8E33FF→#C684FF,
#FFAB00→#FFD666, #FF5630→#FFAC82). **Decisão:** em vez de uma tabela de pares,
o segundo tom é derivado do token da cor trocando o sufixo por `-light`
(`--ds-color-secondary-main` → `--ds-color-secondary-light`). Os três pares da
referência caem exatos, e faixas (`thresholds`) e `accent` ganham gradiente de
graça. Cor sem tom claro equivalente (o cinza) vira preenchimento sólido.

## [SUB-06] "Total" de 10,5px (§12) não existe em `CHART_TYPOGRAPHY`

§12 pede o rótulo "Total" em 10,5px/400 e o `chart-theme` só publica 12,25/600
(`centerTotal`) e 12/400 (`axis`). **Decisão:** usar os degraus do TEMA
(`--font-size-4xs` = 10,5px e `--font-weight-normal` = 400) via `palette.token`,
que é a escotilha oficial — continua token, não vira número cravado. Pedido de
publicar isso em `CHART_TYPOGRAPHY` registrado em `PEDIDOS-BASE.md`.

## [SUB-06] `progress_circle` não tem layout na referência

O anel de progresso é a rosca (§10) com UMA fatia. **Decisão:** herdar o
vocabulário dos circulares — furo de 72% da rosca, trilha de medidor radial
(16%, base §10), rótulos centrais da rosca (valor 17,5px/700 + "Total"
12,25px/600), ponta arredondada (base §6) e tamanho 240×240
(`CHART_HEIGHT.circular`). O anel continua pintado por TOM semântico (`tone`),
não pela paleta categórica: ele responde "quanto falta", não "qual categoria".

## [SUB-06] Valor ausente vira "sem dados" (era zero silencioso)

Os dois blocos faziam `toNumber(data.value) ?? 0`: sem dado, desenhavam um
medidor cravado em 0% como se fosse leitura real. **Decisão:** valor ausente/não
numérico vira `NaN` e o `ChartFrame` mostra o estado vazio. Nenhuma prop mudou;
muda só o que aparece quando não há dado.

## [SUB-06] Traço pontilhado do §13 fica FORA do `<Pie>`

O setor do recharts é PREENCHIDO e o pontilhado da referência é do TRAÇO
(`dashArray: 4`, ponta reta, na barra de valor — nunca na trilha). **Decisão:**
a barra do §13 é um `<path>` de arco com `stroke-dasharray`, solto dentro do
`<PieChart>` (SVG cru é suportado pelo recharts, é como os gradientes entram).
Consequência: essa barra não usa a animação de entrada do recharts — trocá-la
por 60 setores com `paddingAngle` para recuperar a animação custaria mais do que
entrega. O medidor continua com `margin` zero, o que alinha o caminho ao setor.

## [SUB-12] Tabela não tem layout na referência — repaginada por VOCABULÁRIO

A referência cobre **18 gráficos e nenhuma tabela**. Não há o que copiar, então
`table`, `data_table` e `invoice_table` foram alinhados ao mesmo VOCABULÁRIO dos
gráficos — `05-tooltip-legenda-css.md` §4 (card + cabeçalho) para a moldura e
`01-fundamentos.md` §3/§4 para cor e tipografia:

| Papel na tabela  | Vocabulário da referência               | De onde sai                                                  |
| ---------------- | --------------------------------------- | ------------------------------------------------------------ |
| Rótulo de coluna | texto secundário `#637381`, 12,25px/600 | `Text type="label" color="secondary"` (= o padrão do DS)     |
| Célula de corpo  | texto principal `#1C252E`, 14px         | `Text color="primary"` (= `--text-body-size` do `TableCell`) |
| Linha de divisão | grade `rgba(145,158,171,.2)`            | `dividers="rows"` → `--color-border` → `--ds-color-divider`  |
| Célula numérica  | números lidos em coluna                 | `hasTabularNumbers` + alinhamento à direita                  |
| Ênfase (TOTAL)   | `#1C252E` em peso 600                   | `Text weight="semibold"` — ênfase por PESO, não por cor nova |

Os sete itens da checklist do briefing §4 estão respondidos um a um, no topo de
cada `component.tsx` (vários são "não se aplica": tabela não tem eixo, série,
curva nem raio de coluna).

## [SUB-12] A divisão do DS JÁ é `palette.chrome('grid')` — não repintei por fora

O lote pedia a linha de divisão na cor da grade. Conferido token a token: o
`TableCell`/`TableHeaderCell` do Astryx desenha a divisória com `--color-border`,
que o tema deste app aponta para `--ds-color-divider` — **exatamente** o token que
`CHART_CHROME_TOKENS.grid` (e portanto `palette.chrome('grid')`) lê.

**Decisão:** declarar `dividers="rows"` nos três blocos e NÃO pintar borda por
cima. Repintar com `style` produziria o mesmo pixel com o dobro de código e
quebraria a supressão da borda da última linha que o DS já faz.

**Exceção:** o `<tfoot>` do `invoice_table`. O DS entrega `TableFooter` sem estilo
E suprime a borda da última linha do corpo — sem regra própria, o TOTAL encostava
nos itens. Ali a regra sai literalmente de `palette.chromeVar('grid')` (forma
`var()`, porque é DOM e não SVG), com espessura `--border-width`. É a única
pintura de borda do lote, e tem teste dedicado provando que é token e não hex.

Uma diferença deliberada com os gráficos: a divisória é **contínua**, não
tracejada `3`. Na tabela a linha separa CONTEÚDO; no gráfico ela marca ESCALA, e é
o tracejado que a faz recuar para o segundo plano. Tracejar 20 linhas de tabela
criaria uma textura que compete com os dados.

## [SUB-12] Alinhamento na CÉLULA, texto EM LINHA (senão some a reticência)

Envolver o conteúdo da célula num `Text display="block"` (que era o caminho
natural para usar `justify="end"`) **quebra o corte com reticências**: o
`textOverflow="truncate"` do DS aplica `text-overflow: ellipsis` no `<td>`/`<th>`,
e essa propriedade só age sobre conteúdo em LINHA — com um bloco dentro, o texto
era clipado sem as reticências e sem o tooltip.

**Decisão:** o alinhamento horizontal mora na CÉLULA (`style={{textAlign:'end'}}`
no modo children; `align: 'end'` na coluna, no modo data-driven — que é literalmente
o que o DS faz por dentro) e o `Text` fica inline, carregando só tipografia
(numerais tabulares, peso, cor). Coberto por teste no bloco `table`.

## [SUB-12] `data_table`: rótulo de coluna vira TEXTO PURO (o cabeçalho é botão)

O cabeçalho do `data_table` é clicável (ordenação) e o DS monta o rótulo acessível
do botão a partir do `header` da coluna — mas só quando ele é `string`: com um
`ReactNode`, `getHeaderLabel` cai na **chave** da coluna e o botão passa a anunciar
"Ordenar por `municipio`" em vez de "Ordenar por Município".

**Decisão:** neste bloco o rótulo é resolvido ANTES, para texto
(`chartPlainText`), e entregue como string. Consequências, ambas registradas:

- `{{variavel}}` funciona no rótulo de coluna dos três blocos;
- **markdown** no rótulo é renderizado em `table` e `invoice_table` (DOM puro) e
  apenas ACHATADO em `data_table` — mesma escolha que a base já fez no
  `EmptyState` do `BlockFrame`.

A interpolação do rótulo é condicional (`hasVariables`), pela mesma razão do
[SUB-01]: `chartPlainText` remove `*`, `_`, `` ` `` e `~` sem critério, e alias de
consulta (`valor_total`) viraria `valortotal`.

## [SUB-12] Célula de TEXTO passa por `ChartText` sem o guarda do [SUB-01]

Nos gráficos, texto vindo do dado só é interpolado quando traz `{{variavel}}`,
porque o caminho de lá é `chartPlainText` (SVG/`aria-label`), que apaga marcadores.
No DOM o caminho é outro: `ChartText` → `renderInlineMarkdown` → CommonMark, onde
`_` no meio de palavra **não** é ênfase. `pix_enviado` atravessa intacto.

**Decisão:** célula de texto passa sempre por `ChartText` (contrato comum §5.3
cumprido de verdade: negrito, código e link funcionam numa célula). Célula
NUMÉRICA não passa — já é número formatado, e markdown só teria como estragá-lo.

## [SUB-12] `chart-data-table.tsx`: não há visual para alinhar (e por que continua cru)

O equivalente textual dos gráficos vive inteiro dentro de `VisuallyHidden` —
nenhum pixel dele chega à tela, em nenhum estado. Os sete itens do §4 são "não se
aplica" ali.

**Decisão:** mantê-lo um `<table>` semântico cru, e NÃO reconstruí-lo com o
`Table` do DS. Montar com o DS custaria um provider de contexto, um wrapper de
rolagem e um pipeline de plugins **por gráfico da página** para produzir zero
pixel; e o que importa nesse componente (`caption`, `<th scope="col">`,
`<th scope="row">`) é contrato do HTML, não do design system. `caption`, `maxRows`
e a assinatura pública ficaram intocados — cinco lotes o consomem em paralelo.

O que dava para alinhar sem pintar, foi: a mesma marca de célula sem valor (o
travessão) e o preenchimento de linha curta até o número de colunas — linha mais
curta que o cabeçalho desalinha a associação célula↔coluna do leitor de tela a
partir do buraco. É no-op para linha bem formada (que é o que os cinco blocos
produzem).

## [SUB-12] Estados: a moldura cobre por fora, o bloco cobre por dentro

`BlockFrame` já desenha carregando/vazio/erro/sem permissão, e o `BlockRenderer`
só monta o componente no estado de sucesso. Mas os blocos também são renderizados
SEM moldura (galeria do catálogo, playground), e ali uma tabela oca apareceria em
silêncio.

**Decisão:** os três blocos passaram a mapear o próprio `state` —
`loading`/`skeleton` → `ChartSkeleton` (altura `CHART_BODY_HEIGHT.table`),
`error` → `Banner` de erro (que antes não existia: erro caía no "sem dados"),
sem colunas / sem linhas → `EmptyState` com a causa certa. É rede de baixo, não
duplicação: no caminho com moldura esses ramos nunca são alcançados.

## [SUB-12] Limitação conhecida do DS: cabeçalho numérico do `data_table`

Com `align: 'end'`, o DS alinha `<th>` e `<td>` à direita — mas no `data_table` o
`<th>` contém o botão de ordenação, que é `display: flex` com `justify-content`
inicial. Resultado: os números ficam à direita e o rótulo da coluna numérica fica
à esquerda, sobre eles. Não há como corrigir de fora (o conteúdo entra dois níveis
dentro do botão, que não expõe alinhamento).

Não mexi: a alternativa seria abrir mão da ordenação (prop existente) ou do
alinhamento dos números (o que a leitura em coluna exige). Em `table` e
`invoice_table`, onde o cabeçalho não é botão, o rótulo numérico fica sobre os
números, como deve.

## [SUB-12] Nenhuma prop pública mudou; `columns.ts` virou `columns.tsx`

Os três `manifest.propsSchema` estão intocados e todas as props continuam com o
mesmo efeito: `pageSize` e `dense` (`table`), `pageSize` e `filterPlaceholder`
(`data_table`), `currency` (`invoice_table`). A única mudança de arquivo é interna
ao lote — `data_table/columns.ts` → `columns.tsx`, porque a tradução do contrato
de dados passou a incluir o DESENHO da célula (JSX). O import é sem extensão;
nada fora da pasta enxerga a diferença.

---

# CONSOLIDAÇÃO (orquestrador)

## [BASE] `CHART_BODY_HEIGHT` subiu para caber os 320px da referência

Três lotes (SUB-03, SUB-04 e, por tabela, SUB-01/02) reportaram o mesmo: a
referência fixa **320px** de desenho, o corpo do card ainda soma 40px de padding
e ~28px de legenda, e `block-sizing` reservava **312px**. Como `bodyMinHeight` é
altura MÍNIMA, nada era cortado — o card é que crescia ~35px quando o dado
chegava, justamente o pulo que aquele arquivo existe para evitar.

**Decisão:** `series: 312 → 388` e `categorical: 216 → 328` (soma real: desenho +
padding + legenda). Os valores continuam saindo de um lugar só.

## [BASE] Métricas da referência que estavam em constante local subiram ao tema

Os subagentes, proibidos de editar a base, deixaram as medidas que faltavam como
constantes documentadas dentro dos componentes e registraram o pedido. Na
consolidação elas foram para `CHART_GEOMETRY`/`CHART_TYPOGRAPHY`, e os
componentes passaram a consumi-las:

| Medida                                     | Referência    | Token                                      |
| ------------------------------------------ | ------------- | ------------------------------------------ |
| Gradiente da área (0.4 → 0, paradas 0/100) | §5            | `areaGradient`                             |
| Área de contexto sob a linha               | decisão local | `areaContextOpacity`                       |
| Coluna simples 40% / empilhada 36%         | §4, §6        | `barWidthSingle`, `barWidthStacked`        |
| Respiro entre colunas do grupo (2px)       | §5            | `barGroupGap`                              |
| Traço 0 das colunas/barras                 | §4, §6, §8    | `barStrokeWidth`                           |
| `dashArray` do medidor tracejado           | §13           | `gaugeDash`                                |
| "Total" do medidor semicircular (10,5/400) | §12           | `CHART_TYPOGRAPHY.gaugeTotal`              |
| Coluna do mini-gráfico (raio 1,5 / 64%)    | §04-2.4       | `sparkBarRadius`, `sparkBarWidth`          |
| Eixo X da dispersão (8 divisões, 1 casa)   | §15           | `scatterXTickCount`, `scatterAxisDecimals` |
| Margem zero do modo `sparkline`            | §9–§13        | `CHART_NO_MARGIN`                          |

## [BASE] `ChartCenterLabel` passou a usar a tipografia da referência

Estava em `--font-size-xl` (21px) com peso 600 e a legenda nos 12px do eixo. A
referência (§10) pede **17,5px/700** no valor e **12,25px/600** no "Total" — os
três anéis do catálogo liam a mesma coisa em dois corpos diferentes. Agora sai de
`CHART_TYPOGRAPHY.centerValue`/`centerTotal`, com overrides opcionais para os
tipos que a referência afina (§11 reduz o valor; §12 e §13 mudam o "Total").

## [BASE] `RankingBar` promovida ao barril

`leaderboard` importava de `@/shared/ui/charts/bar-list` (caminho interno) porque
o barril não a exportava. `RankingBar`, `RANKING_ROW_BAND` e `RANKING_TEXT` agora
são API pública de `@/shared/ui`.

## [BASE] Pedidos NÃO atendidos nesta rodada (backlog)

Ficaram registrados em `PEDIDOS-BASE.md` e não foram feitos por serem mudança de
comportamento ou por dependerem de decisão do produto:

- `state`/`errorMessage` em `ChartStateProps` (cada gráfico já os declara; unificar
  na interface base é refactor de API e merece uma passada própria);
- `ChartFrame` com papel `none` para blocos que são TEXTO (`bar_list`);
- `ChartTooltip` em modo "só o valor" (mini-gráficos);
- `ChartLegends` com sublabel (§10 pede valores e sublabels na rosca);
- zoom `xy` da dispersão (§15) — ver CHANGELOG, item 2 do "pendente de decisão".

## [AJUSTE] Espessura de barra: fração da referência **com teto em pixel**

**Sintoma relatado:** a coluna aparecia "muito grossa e não harmônica com a UI".

**Causa.** A referência mede a coluna em FRAÇÃO da faixa (§10: 48%; §4: 40%;
§6: 36%; §8: 30% na barra horizontal) e fração não tem teto. Medido no
`/catalog`: o mesmo `bar_chart`, com as mesmas cinco categorias, desenha **21px**
num card de 331px e **118px** quando o contêiner vai a 1.546px. A partir de umas
poucas dezenas de pixels a coluna deixa de ser uma marca de medida e vira um
bloco de cor — o gráfico briga com a interface em vez de conversar com ela.
É o motivo pelo qual todo sistema de data-viz limita a espessura em pixel.

**Decisão.** A fração continua sendo a da referência e ganha um TETO ABSOLUTO em
pixel, aplicado pelo recharts (`maxBarSize`):

| token                   | valor | onde                                |
| ----------------------- | ----- | ----------------------------------- |
| `geometry.barMaxWidth`  | 32px  | coluna (simples/agrupada/empilhada) |
| `geometry.hBarMaxWidth` | 24px  | barra horizontal                    |

32px não é medida nova: é a espessura que a PRÓPRIA referência produz no
`demo.html` (a fração aplicada à largura em que os 18 tipos foram desenhados). O
teto não muda o desenho da referência — ele o **preserva** quando o contêiner
cresce além dela. Faixa estreita continua mandando na fração (conferido em teste
com 40 categorias).

**Consequência: §11 foi retirado.** O §11 engrossava a coluna por LARGURA DE
TELA (60% abaixo de 900px, 80% e raio 3 abaixo de 600px). Aquela regra media a
JANELA para adivinhar a FAIXA — e num catálogo de cards a janela não diz nada
sobre o card: um card de 331px numa tela de 1.911px era tratado como desktop, e
o mesmo gráfico ficava com espessuras diferentes só por causa do tamanho da
janela. Com o teto, a espessura passa a depender só da faixa (a grandeza que o
§11 sempre quis medir) e o mesmo gráfico fica com a mesma cara no card, no painel
e no PDF. Saíram `barWidthMd`, `barWidthSm` e `barRadiusSm`; saiu também o
`useMediaQuery` do `bar-chart`.

O `barRadiusSm` não faz falta: o recharts já limita o raio a metade do menor lado
do retângulo, então coluna fina arredonda proporcionalmente em vez de virar
cápsula.

**Limitação conhecida.** Quando o teto corta, o recharts recentra cada coluna na
sua vaga — então num gráfico AGRUPADO muito largo com poucas categorias o
respiro DENTRO do grupo cresce. Continua muito menor que o respiro ENTRE
categorias (o teste `bar-thickness` tranca essa proporção), mas quem quiser o
grupo colado precisa medir o contêiner e passar `barSize` em pixel — não foi
feito para não trocar uma medição de layout por outra.

**Travado por:** `src/shared/ui/charts/__tests__/bar-thickness.test.tsx`.

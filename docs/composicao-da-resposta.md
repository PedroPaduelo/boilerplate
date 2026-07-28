# A composição da resposta do agente

Este documento é a fonte única das regras de composição: o que o agente escreve,
como a tela desenha, e por quê. Prompt, skills e componentes devem concordar com
o que está aqui — se divergirem, aqui é que está certo.

---

## 1. Diagnóstico — o que estava quebrado (28/07)

Colhido das respostas reais gravadas no banco, não de suposição.

| # | Sintoma observado (texto real) | Causa |
|---|---|---|
| 1 | `…seus gráficos e dashboards.Assumi que "listi" = listar` | O raciocínio entre ferramentas era concatenado à resposta final, sem sequer uma quebra de linha |
| 2 | `Agora vou validar as queries.7 gráficos criados. Agora vou conferir que renderizam:Todos os 7 em success.` | O agente narrava progresso em texto — trabalho que a trilha de auditoria já faz |
| 3 | `I'll start by listing your available connections.` | Resposta em inglês, apesar de "REGRA ABSOLUTA DE IDIOMA" na linha 10 do prompt |
| 4 | `## 📊 Dashboards (1)` · `🟢 PUBLISHED` · `👇` | Emoji decorativo como hierarquia visual |
| 5 | `cms4hgsev001hjy0p51o61zvg` solto no corpo | Identificadores técnicos tratados como informação de negócio |
| 6 | `\| Total de Contatos \| kpi \|` seguido de `\|---\|---\|---\|` | Tabela markdown malformada, gerando tabela órfã na tela |
| 7 | `kpi`, `bar_chart`, `donut`, `PUBLISHED`, `PRIVATE`, `ORG` | Vocabulário interno do sistema exposto a quem não é do sistema |
| 8 | "R$ 11,19 mil" para **contagem de eventos** | `h_bar_chart` tinha `valueFormat` default `compactBRL`: tudo virava dinheiro |
| 9 | Resposta começa em "Assumi que…" | Sem conclusão no topo — o usuário lê o processo antes do resultado |

**A conclusão que orientou a solução:** o prompt tinha 611 linhas (32 KB) e já
mandava fazer storytelling, com três templates prontos. Ainda assim o modelo
respondia em inglês e narrava progresso. O problema não era falta de instrução —
era excesso, diluição e desalinhamento: o prompt estava cheio de exemplos de um
domínio fiscal (DUAM, IPTU, ISS, CDA, "838.840 DUAMs") que **não existe** no
banco atual, que é de mensagens de WhatsApp.

> Regra que fica: instrução que não é seguida não se resolve escrevendo mais
> instrução. Ou vira restrição estrutural (código), ou some para dar espaço ao
> que importa.

---

## 2. O arco da resposta

Toda resposta **analítica** segue esta ordem. Não é um formulário a preencher:
é a ordem em que a informação é útil.

1. **Conclusão** — 1 a 2 linhas. O resultado, não o caminho.
2. **Evidência** — o gráfico ou a tabela que sustenta a conclusão.
3. **Leitura** — 3 a 5 bullets: o que salta aos olhos, com comparação e variação.
4. **Recorte** — período, filtros e fonte. Colapsável.
5. **Próximos passos** — 2 a 3 ações ou perguntas de aprofundamento.

### Quando NÃO usar o arco

O arco serve a uma análise. Aplicá-lo a tudo transforma "sim" em relatório.

| Pergunta | Resposta certa |
|---|---|
| "quantos contatos temos?" | **369 contatos.** — e ponto |
| "esse gráfico está publicado?" | Uma frase |
| "cria um gráfico de X" | Confirmação curta + o gráfico |
| "por que as mensagens caíram em julho?" | Arco completo |

Regra prática: **o tamanho da resposta acompanha o tamanho da pergunta.**
Se a resposta cabe em uma frase, ela é uma frase.

---

## 3. Escolha do formato

Não fica a critério do momento. É uma decisão com regra:

| O que se quer mostrar | Formato |
|---|---|
| Um número que importa sozinho | **KPI** (destaque) ou negrito na frase |
| Evolução no tempo | **Linha** (ou área, se for volume acumulado) |
| Comparação entre categorias | **Barra** (horizontal se os rótulos forem longos) |
| Composição de um todo | **Donut** (até 5 fatias) ou **barra empilhada** |
| Correlação entre duas medidas | **Dispersão** |
| Comparação multi-dimensional (3+ colunas por item) | **Tabela** |
| Lista de achados, sem números para comparar | **Bullets** |
| Um raciocínio, uma ressalva, um porquê | **Texto corrido** (2 a 3 linhas) |

Duas proibições que vinham sendo violadas:

- **Tabela de uma coluna não é tabela** — é lista. Vira bullets.
- **Gráfico com 2 pontos não é gráfico** — é uma frase com dois números.

---

## 4. Tipografia da resposta

- **Negrito** só em número-chave e conclusão. Nunca decorativo, nunca em título.
- **Emoji não é hierarquia.** Título é título (`##`), não `## 📊`. Um emoji
  eventual no fim de uma frase é tolerável; como estrutura, não.
- **Bullets** curtos: uma linha cada, começando pelo fato.
- **Identificador técnico** (`cms4h…`, nome de tabela, tipo de bloco) não aparece
  no corpo. Se for necessário para auditar, vai no recorte colapsável.
- **Vocabulário**: "gráfico de barras", não `bar_chart`. "Publicado", não
  `PUBLISHED`. "Cruzei as mensagens com os contatos", não "fiz um JOIN".

---

## 5. Progresso: a trilha narra, o texto não

O agente **não escreve** "agora vou consultar…". Quem conta o que está
acontecendo é a trilha de auditoria, em tempo real.

- Durante o turno: a trilha fica aberta, com o passo corrente narrado
  ("Consultando as mensagens dos últimos 90 dias…").
- Ao terminar: recolhe para uma linha ("4 passos · 12,3 s"), com o detalhe
  técnico (SQL, linhas, duração) a um clique.
- Falha fica anunciada na linha fechada — esconder erro atrás de clique é
  esconder justamente o que se quer auditar.

Reforço estrutural: o backend separa os blocos de texto do modelo, de modo que
raciocínio intermediário nunca mais cole na resposta final.

---

## 6. Gráficos

- Sempre dentro de um **card**, com **título** e **subtítulo de recorte**
  (período, filtro, unidade). Gráfico sem legenda de recorte é um número sem
  contexto.
- **Formato de valor por natureza da medida**: contagem é número
  ("15.254"), dinheiro é moeda ("R$ 2,6 mi"), proporção é percentual. O default
  de `h_bar_chart` era moeda — por isso contagem de eventos aparecia como
  "R$ 11,19 mil".
- **Altura reservada desde o esqueleto**: o card nasce com a altura final, então
  a chegada do dado não empurra o texto que está sendo lido (sem layout shift).
- **Transição**: esqueleto → conteúdo com fade curto. Nada de piscar a cada
  delta do streaming.

---

## 7. Perguntas de qualificação

- No máximo **duas**, e só quando a resposta muda de fato com elas.
- **Sempre com default declarado**: "vou considerar os últimos 90 dias — quer
  outro recorte?" — a conversa continua mesmo sem resposta.
- Ambiguidade que não muda o resultado: assume e **declara a premissa** no
  recorte.

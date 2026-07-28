# Referências de UX para o editor de dashboard

Pesquisa feita para o redesenho de `/dashboards/:id/edit`. Cada referência aqui
está ligada a uma decisão — o que não virou decisão não entrou na lista.

**O critério.** Editor de dashboard é um problema resolvido há quinze anos por
uma dúzia de produtos. A pergunta não era "como inventar um editor", era **quais
padrões todos eles convergiram, e por quê** — e, em especial, como cada um
resolve a decisão que o nosso não tinha: **altura**.

---

## 0. O que estava errado (medido, não achado)

Antes de olhar para fora, a tela foi medida no navegador (viewport 1911×898,
dashboard "Painel de Atendimento WhatsApp", 4 linhas / 9 blocos):

| Medida | Valor | Consequência |
| --- | --- | --- |
| Altura da coluna de edição | **2557px** | 3 telas de rolagem de formulário para 9 blocos |
| Largura do preview | **792px** | o grid do motor colapsa para **2 colunas** onde a tela publicada mostra **3** |
| Preview fixo na rolagem | **não** | ao editar o 7º bloco, o resultado está 1800px acima |
| Campos e botões na tela | **19 inputs, 84 botões** | tudo aberto ao mesmo tempo, sempre |
| Controle de altura | **inexistente** | a queixa que originou o trabalho |
| Campo "Largura (1–12)" | **sem efeito** | o renderer roda em `itemSizing: 'equal'`; só `span ≥ 12` faz algo |

O último item é o mais grave: um controle que não faz o que promete é pior do
que controle nenhum, porque o usuário culpa a si mesmo pelo resultado.

E havia um defeito silencioso, achado ao ler o código: `sanitizeLayoutForSave`
reconstruía o bloco campo a campo e **descartava** `rowSpan`, `title`, `subtitle`
e `blocks` (sub-blocos de container). Ou seja: abrir no editor um dashboard
montado pelo agente e clicar em Salvar **apagava os títulos dos cards e o
conteúdo das seções** — sem erro, sem aviso.

---

## 1. Grafana 12/13 — a referência principal

<https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/create-dashboard/>

É o produto que mais se parece com o nosso problema (painéis de dados,
composição por linhas e abas) e o que documenta melhor as decisões.

| Padrão deles | O que resolve | Nossa decisão |
| --- | --- | --- |
| **Sidebar contextual**: "as opções disponíveis mudam conforme o elemento selecionado (dashboard, agrupamentos, painéis)" | uma tela, um assunto por vez | **inspetor** com três conteúdos (dashboard / linha / bloco) |
| **Auto grid** com `Min column width`, `Max columns`, **`Row height` (Standard, Short, Tall, Custom px)** | altura como decisão de LINHA, com degraus nomeados e escape para px | `row.height` e `block.height` — mesma gramática |
| **Content outline** (árvore de painéis, linhas, abas) | pular para um elemento sem caçá-lo | lista de blocos no inspetor da linha (a escala que este editor pede) |
| Sidebar **docked/undocked** | painel não pode roubar o conteúdo | inspetor sticky de 400px; empilha abaixo de 1180px |
| "Click **Edit** … **Exit edit**" | modo de edição explícito | mantido pelo desenho de rascunho/publicado que já existia |

> A lição que mais pesou: **altura é propriedade da linha, não do painel.** O
> Grafana só oferece altura por painel no layout `Custom` (posicionamento
> livre); no `Auto grid` — o equivalente ao nosso — a altura é da linha. É
> exatamente a regra que o nosso motor já aplicava internamente
> (`rowHeightForTypes`) sem nunca ter exposto.

## 2. Metabase — o modo de edição direto no objeto

<https://www.metabase.com/docs/latest/dashboards/introduction>

| Padrão deles | O que resolve | Nossa decisão |
| --- | --- | --- |
| "click the pencil … **you'll see a grid appear**" | editar é mexer no dashboard, não num formulário paralelo | **canvas**: o editor mostra o dashboard de verdade |
| Ações **no hover do card** (duplicar, mover, remover, substituir) | o controle mora no objeto | barra de ações sobre o bloco |
| "**Resize a card**: drag the handle at the bottom right" | altura por gesto direto | não copiado — ver "O que não copiamos" |
| **Duplicate a card** | 90% dos blocos novos são variações de um existente | `duplicateBlock` (a cópia mantém a consulta) |
| **Sections** (KPI Grid; large chart with KPIs; …) | começar de um arranjo que já funciona | **não implementado** — ver "Recomendações" |
| Tabs com "move card to tab" | abas são organização, não navegação secundária | canvas edita **uma aba por vez**, como a visualização exibe |

## 3. Dribbble — a leitura visual

Busca `dashboard-builder` (28 peças analisadas; as relevantes abaixo).

- **UI8 — "Core 2.0 Dashboard Builder"** e **"Core: Dashboard Builder — ✨ Live
  Preview"** (412k e 455k visualizações): a estrutura repetida em toda a série é
  **canvas grande + painel de propriedades à direita + barra de estado no topo**.
  É a mesma composição que Grafana e Metabase chegaram por caminho funcional —
  quando referência estética e referência funcional convergem, a dúvida é sobre
  a execução, não sobre o desenho.
- **"Sidebar Navigation for Core 2.0 — Dashboard Builder"**: navegação da
  estrutura separada das propriedades. Adotado em escala menor (a lista de
  blocos vive no inspetor da linha, não numa terceira coluna: com 400px de
  inspetor + 3 faixas de 280px, uma terceira coluna comeria o canvas).
- **Tran Mau Tri Tam — "Foundation® Dashboard Builder 2.0"**: hierarquia de
  peso — o canvas tem contraste alto, o cromo de edição é quase invisível até o
  hover. É a regra que seguimos na barra de ações do bloco (`opacity: 0` até
  hover/foco) e no cabeçalho de linha (texto de apoio, não card).

## 4. O que NÃO copiamos, e por quê

**Drag-and-drop e alça de redimensionar.** É o padrão de Metabase, Grafana
(layout custom) e de toda a série do Dribbble — e continua fora, porque a
decisão do MVP de operar por botões não é preguiça: é o que mantém a montagem
inteira **operável por teclado** e testável sem simular ponteiro. O ganho de DnD
é conforto; o custo é uma superfície de acessibilidade que teria de ser
reconstruída. Trocamos o gesto por controles nomeados (mover ←/→/↑/↓) e pela
altura declarada, que é o que o arrasto produziria de qualquer forma.

**Altura só em pixels (alça).** Arrastar produz um número, e número gravado no
JSON congela — inclusive o erro. Os degraus nomeados (`compact`/`default`/`tall`)
são referências à calibragem medida do motor: recalibrar as medidas move todos
os dashboards que usam o degrau. Os pixels continuam disponíveis como escape,
com piso e teto (120–1600), porque altura sem limite não é liberdade, é um bloco
que ninguém vê inteiro.

---

## 5. Recomendações (não implementadas)

1. **Sections / receitas de layout** (Metabase). O motor já tem
   `LAYOUT_RECIPES` (1, 2 e 3 colunas, KPIs + gráficos) usado pelo agente —
   falta expô-las como "começar por um arranjo" no canvas vazio.
2. **Desfazer (⌘Z)** no rascunho. Hoje a rede de segurança é "não salvar";
   remover uma linha com blocos é a ação que mais pede desfazer.
3. **Confirmação em remoções destrutivas** de linha com blocos. Enquanto não
   houver desfazer, um `AlertDialog` é o substituto honesto.

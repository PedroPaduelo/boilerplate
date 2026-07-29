# 41 — Apresentação do dashboard (contrato de enriquecimento visual)

> Continuação do doc 40 (abas). Lá o problema era **navegação**; aqui é
> **densidade de leitura**: o dashboard chegava à tela como uma pilha de
> retângulos com desenhos dentro, sem hierarquia, sem unidade, sem âncora
> visual — porque o contrato não tinha como dizer nada disso.

## 1. O problema, em uma frase

O dashboard é montado por um **agente**, e ele só consegue expressar o que o
contrato permite. Enquanto o layout só sabia dizer `{ id, type, span, title }`,
todo dashboard gerado nascia igual: cards do mesmo peso, sem ícone, sem
unidade, abas em lista plana. Não era um problema de front — era **falta de
vocabulário**.

Este documento é o vocabulário novo. Cada campo abaixo existe porque a sua
ausência produzia um defeito concreto na tela.

## 2. O que entrou no contrato

Tudo é **opcional**. Um layout salvo antes disto continua válido e renderiza
exatamente como renderizava (§6).

### 2.1 Bloco (card de gráfico)

| Campo | Tipo | O que resolve |
|---|---|---|
| `description` | string (≤280) | "O que este gráfico responde", abaixo do subtítulo. **Já era lido pelo render-engine e rejeitado pelo schema** — o campo era impossível de salvar. |
| `unit` | string (≤24) | Unidade da métrica (`R$`, `%`, `processos`). Fica **ao lado** do título, não dentro: `"Arrecadação (R$)"` mistura assunto com escala e some junto quando o título trunca. |
| `icon` | enum semântico | Âncora visual do card. **Tem fallback por tipo** (`bar_chart` → gráfico, `donut` → composição): só se declara para contrariar o padrão. |
| `emphasis` | `default` \| `featured` \| `muted` | Hierarquia entre cards. `featured` = o número que a página existe para mostrar (borda de acento + elevação). Destacar por *tamanho* não serve: tamanho é decisão da linha, e mexer nele desalinha os vizinhos. |

### 2.2 Linha (composição do conteúdo)

| Campo | Tipo | O que resolve |
|---|---|---|
| `description` | string (≤280) | Contexto da **seção**, para os cards não repetirem a mesma explicação. |
| `columns` | inteiro 1..6 | Faixas declaradas. Sem ele o motor encaixa quantas couberem (responsivo); declarar é para a intenção editorial que a heurística não adivinha ("estes 4 KPIs são uma faixa de 4"). |
| `itemSizing` | `equal` \| `span` | `equal` (padrão) = larguras iguais, ninguém maior que o vizinho **por acidente**. `span` = a leitura literal do `span`, para quando o desequilíbrio é a intenção. |

### 2.3 Aba (navegação)

| Campo | Tipo | O que resolve |
|---|---|---|
| `order` | inteiro | Posição na navegação. **A ordem do grupo também sai daqui** (o menor `order` entre suas abas) — não existe um segundo registro de ordenação para discordar deste. |
| `level` | `1` \| `2` | `2` vira **sub-item aninhado** de verdade (não indentação com padding), com a semântica de grupo que um leitor de tela anuncia. |
| `divider` | boolean | Separador antes da aba: quebra um bloco de itens dentro do mesmo grupo sem inventar um título de seção. |

(`icon`, `description` e `group` já existiam desde o doc 40.)

### 2.4 Dashboard (tema)

| Campo | Tipo | O que resolve |
|---|---|---|
| `theme.colorMode` | `light` \| `dark` \| `system` | Aparência com que o dashboard **abre**. É ponto de partida: **a escolha do usuário sempre vence** (§5). |
| `theme.accent` | string | Cor padrão das séries dos blocos que não declararem a sua — identidade cromática do painel inteiro com um campo, em vez de `accent` repetido em 15 blocos. |
| `theme.palette` | `single` \| `multi` | Padrão de pintura dos blocos categóricos. Reusa o vocabulário que os blocos já expõem em `props.palette`. |

## 3. Exemplo de payload completo

Layout válido exercitando **todas** as capacidades. É o
`dashboardRichLayoutFixture` do pacote de contratos — ou seja, este JSON é
testado, não ilustrativo.

```json
{
  "theme": { "colorMode": "dark", "accent": "teal", "palette": "multi" },

  "filters": [
    { "id": "f_periodo", "type": "date_range", "label": "Período",
      "default": { "from": "2026-01-01", "to": "2026-12-31" } },
    { "id": "f_situacao", "type": "select", "label": "Situação", "default": "todas" }
  ],

  "rows": [
    {
      "id": "row_indicadores",
      "title": "Indicadores do período",
      "description": "Consolidado de arrecadação e recuperação da dívida ativa.",
      "columns": 3,
      "blocks": [
        {
          "id": "blk_kpi_arrecadado",
          "type": "kpi",
          "span": 4,
          "title": "Arrecadado no período",
          "unit": "R$",
          "emphasis": "featured",
          "props": { "showDelta": true },
          "dataBinding": {
            "connectionId": "conn_fazenda",
            "query": "SELECT SUM(valor) AS value FROM divida_ativa"
          }
        },
        {
          "id": "blk_kpi_recuperacao",
          "type": "kpi",
          "span": 4,
          "title": "Taxa de recuperação",
          "unit": "%",
          "dataBinding": {
            "connectionId": "conn_fazenda",
            "query": "SELECT recuperado / total * 100 AS value FROM divida_resumo"
          }
        },
        {
          "id": "blk_kpi_protestos",
          "type": "kpi",
          "span": 4,
          "title": "Protestos abertos",
          "unit": "processos",
          "emphasis": "muted",
          "dataBinding": {
            "connectionId": "conn_fazenda",
            "query": "SELECT COUNT(*) AS value FROM protestos WHERE status = 1"
          }
        }
      ]
    },
    {
      "id": "row_analise",
      "title": "Análise mensal",
      "itemSizing": "span",
      "blocks": [
        {
          "id": "blk_bar_mes",
          "type": "bar_chart",
          "span": 8,
          "title": "Arrecadação por mês",
          "subtitle": "Competência de janeiro a dezembro",
          "description": "Valores efetivamente baixados, sem parcelamentos em aberto.",
          "unit": "R$",
          "icon": "money",
          "dataBinding": {
            "connectionId": "conn_fazenda",
            "query": "SELECT mes AS x, SUM(valor) AS y FROM divida_ativa GROUP BY mes"
          }
        },
        {
          "id": "blk_donut_situacao",
          "type": "donut",
          "span": 4,
          "title": "Situação",
          "unit": "%",
          "dataBinding": {
            "connectionId": "conn_fazenda",
            "query": "SELECT situacao AS label, COUNT(*) AS value FROM divida_ativa GROUP BY situacao"
          }
        }
      ]
    },
    {
      "id": "row_bairro",
      "title": "Distribuição por bairro",
      "blocks": [
        {
          "id": "blk_bar_bairro",
          "type": "h_bar_chart",
          "span": 12,
          "title": "Dívida por bairro",
          "unit": "R$",
          "dataBinding": {
            "connectionId": "conn_fazenda",
            "query": "SELECT bairro AS label, SUM(valor) AS value FROM divida_ativa GROUP BY bairro"
          }
        }
      ]
    }
  ],

  "tabs": [
    { "id": "tab_cobranca",   "title": "Cobrança",   "rowIds": ["row_analise"],
      "icon": "tax",   "description": "Arrecadação mensal e composição por situação.",
      "group": "Arrecadação", "order": 20 },

    { "id": "tab_recuperacao", "title": "Recuperação", "rowIds": ["row_indicadores"],
      "icon": "money", "description": "Indicadores consolidados do período.",
      "group": "Arrecadação", "order": 10 },

    { "id": "tab_bairro",      "title": "Por bairro",  "rowIds": ["row_bairro"],
      "icon": "map",   "group": "Território", "level": 2, "divider": true, "order": 30 }
  ]
}
```

O que este JSON produz na tela, campo a campo:

- `theme` → abre no escuro, séries em `teal`, categóricos multicoloridos;
- `order` → **Recuperação aparece antes de Cobrança**, apesar de vir depois no
  array (e o grupo "Arrecadação" vem antes de "Território", porque tem o menor
  `order`);
- `group` → duas seções tituladas na navegação, em vez de três itens soltos;
- `level: 2` + `divider` → "Por bairro" entra aninhada e separada;
- `columns: 3` → a faixa de indicadores é declaradamente de três;
- `itemSizing: "span"` → a linha de análise fica 8/4 (gráfico grande + anel);
- `emphasis` → um KPI em destaque e um recuado **na mesma faixa**;
- `unit` → `R$`, `%` e `processos` ao lado dos títulos, sem invadi-los;
- `icon: "money"` num `bar_chart` → contraria o ícone padrão do tipo.

## 4. Vocabulário de ícones

Enum fechado, compartilhado por **aba e bloco** (um só, porque "isto é sobre
arrecadação" é a mesma frase nos dois lugares):

```
overview  chart   trend    table    money    tax      users     building
calendar  alert   map      document search   target   clock     tag
percent   activity layers  check    database pie      list      settings
```

Nome fora da lista é **descartado na leitura** (cai no padrão do tipo) e
**rejeitado na validação** — o agente escolhe dentro do que a tela sabe
desenhar, em vez de inventar um nome que viraria um buraco no alinhamento.

Padrão por tipo de bloco (o que dispensa declarar `icon` na maioria dos casos):
séries → `trend`, comparações → `chart`, composição → `pie`/`percent`,
rankings → `list`, tabulares → `table`, indicadores → `target`.

## 5. Precedências — as três regras que evitam surpresa

1. **Bloco > dashboard.** `theme.accent` e `theme.palette` só valem para blocos
   que **não** escolheram a sua. É a mesma ordem de especificidade que já vale
   para altura (bloco > linha > derivação por tipo).
2. **Usuário > dashboard.** `theme.colorMode` só é aplicado a quem **nunca**
   escolheu um tema. Um app que troca o tema por cima de quem acabou de clicar
   no botão de tema é um app discutindo com o usuário.
3. **Declarado > inferido.** Numa aba, `order` explícito vence a posição
   herdada do array em caso de empate — senão o caso que justifica o campo
   (acrescentar uma aba pedindo `order: 1` num dashboard pronto) seria aceito e
   ignorado, a pior combinação possível.

## 6. Retrocompatibilidade

Mesma estrutura de garantias do doc 40, e pelos mesmos motivos:

1. **Todos os campos são opcionais** no JSON Schema. Layout antigo continua
   válido.
2. **Nenhum dado sujo é possível**: o schema tem `additionalProperties: false`,
   então até agora um layout com estes campos era *rejeitado*. Não há o que
   limpar atrás.
3. **Leitura defensiva e única** (`layout/presentation.ts`, compartilhado
   BE/FE/MCP): valor fora do vocabulário é **ignorado, nunca corrigido nem
   propagado**. `emphasis: "gigante"` degrada para o card comum; `columns: 40`
   é grampeado no teto.
4. **Nenhum default vaza para o dado salvo.** Um `emphasis: "default"` gravado
   em disco faria todo dashboard antigo acusar "alterado" ao ser apenas aberto
   no editor (o dirty-state compara a forma canônica). Testado.
5. **Nenhuma migração Prisma** — as colunas são `Json`.

## 7. Os quatro pontos que apagavam os campos (e foram corrigidos)

Este é o risco real desta classe de mudança: o campo é aceito, salvo, e **some
depois**, em silêncio. São quatro travessias que reconstroem o layout campo a
campo:

| Onde | O que apagava | Estado |
|---|---|---|
| `layoutInputSchema` (Zod) | `theme` — o Zod faz *strip* de chave desconhecida **antes** da validação, então o save "daria certo" perdendo o campo | corrigido |
| `addChartToDashboard` (service) | `theme` — o método reconstrói `{filters, rows, tabs}` a cada gráfico que o agente insere | corrigido |
| `normalizeLayout` / `sanitizeLayoutForSave` (editor) | apresentação do bloco, composição da linha, `theme` — e **já apagava `icon`/`group`/`description` das abas** (bug vivo desde o doc 40: o `EditorTab` só carregava `id`/`title`/`rowIds`) | corrigido |
| `DashboardConfigSchema` | `theme` na representação completa da API/MCP | corrigido |

Cada um tem teste de regressão nomeado "abrir e salvar NÃO apaga…".

## 8. O que o agente precisa saber (resumo para a tool description)

- **`unit` sempre que houver unidade.** É o campo de maior retorno por
  caractere escrito: sem ele, "12.480" pode ser reais, autos ou dias.
- **`icon` só para contrariar o padrão.** O tipo já dá um bom ícone.
- **`emphasis: "featured"` com parcimônia** — mais de um destaque por tela é
  nenhum destaque.
- **`group` a partir de 4 abas**, para virarem 2–3 blocos em vez de uma lista.
- **`itemSizing: "span"` só quando o desequilíbrio for intencional.** O padrão
  (`equal`) existe para impedir o desequilíbrio *acidental*, que era o defeito
  original.
- **`tabs` para ASSUNTOS diferentes**, não para quebrar um assunto em pedaços.

## 9. Escopo entregue × adiado

| Item | Status |
|---|---|
| Contrato + normalizador + testes (54 casos) | entregue |
| Backend: Zod, `add_chart`, testes de regressão | entregue |
| MCP: schema e descrição das tools atualizados | entregue |
| Editor: preservar tudo no ciclo abrir → salvar | entregue |
| Viewer: cabeçalho, navegação, card, vazios | entregue |
| Editor: **editar** os campos novos pela UI (hoje só preserva) | adiado |
| `theme.accent` afetar a paleta completa (hoje é o acento padrão dos blocos) | adiado |
| `/dashboards/:id` (detalhe antigo) usar a apresentação | adiado |

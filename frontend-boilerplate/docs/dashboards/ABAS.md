# Abas do dashboard e modo de Visualização

Como usar, o que existe no código, e como pedir para a IA.

---

## O que é

Um dashboard pode dividir suas linhas em **abas**. No modo de **Visualização**
(`/dashboards/:id/view`) as abas viram uma **barra lateral**, empilhadas uma
abaixo da outra, e o resto da tela é só leitura.

A visualização é uma tela **autônoma**: abre em **guia nova**, sem a barra
lateral do app, sem topbar e sem menu de usuário. É a tela para projetar numa
reunião, jogar num telão ou deixar aberta numa segunda guia enquanto se continua
trabalhando na primeira. "Autônoma" não quer dizer pública — sessão e permissão
(`artifacts:view`) continuam valendo; o que sai é só o cromo do app.

O modelo é uma **projeção**: a aba guarda os **IDs das linhas** (`rowIds`), não
as linhas. `layout.rows` continua sendo a lista canônica e completa. É isso que
garante que exportação de PDF, MCP, agente e resolução de dados — que percorrem
`rows` — continuem enxergando 100% dos blocos sem saber que abas existem.

**Invariante garantida pelo contrato:** a união das linhas de todas as abas é
igual a `layout.rows`. Nenhum bloco fica invisível, aconteça o que acontecer com
o JSON.

---

## Como usar na interface

1. Abra o dashboard e vá em **Editar** (`/dashboards/:id/edit`).
2. No painel de abas, crie **duas ou mais** abas e dê um título a cada uma.
3. Em cada linha do layout, escolha a qual aba ela pertence.
4. Salve. Se o dashboard for publicado, **publique de novo** — o modo de
   visualização lê o layout publicado.
5. Volte ao dashboard e clique em **"Visualização"** (ícone de expandir, no topo
   à direita).

A aba ativa vive na URL (`?tab=<id>`), e não em estado local. Consequências
práticas: voltar/avançar do navegador funciona, recarregar mantém a aba, e um
link colado para um colega abre na aba certa.

### Por que a barra lateral pode não aparecer

`shouldShowTabNav` só desenha a barra quando há **2 ou mais** abas. Um dashboard
sem abas declaradas (todos os legados) resolve para **uma aba implícita** com
todas as linhas — e uma "navegação" de um item só é ruído, além de fazer o leitor
de tela anunciar uma região de navegação inútil.

**Se você clicou em "Visualização" e achou que nada aconteceu:** provavelmente é
isso. A rota muda (`/view`), mas sem 2+ abas a tela fica visualmente idêntica à
anterior. Confira a URL.

---

## Como pedir para a IA

O agente monta o layout via MCP. Peça em linguagem natural, deixando claro **o
recorte de cada aba**:

> "Divide esse dashboard em duas abas: uma 'Visão geral' com os KPIs e o volume
> por dia, e outra 'Detalhamento' com a composição por tipo e o ranking de
> contatos."

> "Cria um dashboard de atendimento com 3 abas: Resumo, Mensagens e Chamadas."

O agente escreve `layout.tabs` como projeção sobre as linhas que ele já criou.
Como `rows` continua completa, um agente que **não** conheça abas segue
funcionando — o layout dele só cai na aba implícita.

### Via API (o que fiz para criar o exemplo)

```bash
PATCH /dashboards/:id
{
  "draftLayout": {
    ...layoutAtual,
    "tabs": [
      { "id": "tab_visao",   "title": "Visão geral",  "rowIds": ["row-kpis", "row-volume"] },
      { "id": "tab_detalhe", "title": "Detalhamento", "rowIds": ["row-donuts", "row-ranking"] }
    ]
  }
}

POST /dashboards/:id/publish
```

`id` da aba usa prefixo `tab_`; `__default__` é reservado para a aba implícita.

---

## Onde mora no código

| arquivo                                                              | papel                                                                                                                |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `shared/contracts/src/layout/tabs.ts`                                | resolução das abas — função **pura, compartilhada BE/FE/MCP**. Fonte única da verdade sobre "qual linha em qual aba" |
| `features/dashboards/lib/dashboard-tabs.ts`                          | ponte de tipos do contrato para o FE (`resolveTabs`, `pickTab`, `layoutOfTab`, `shouldShowTabNav`)                   |
| `features/dashboards/components/viewer/dashboard-viewer-content.tsx` | a tela de visualização: aba na URL, grid, filtros                                                                    |
| `features/dashboards/components/viewer/dashboard-tabs-sidebar.tsx`   | a barra lateral: busca, recolhimento e a ligação com o `NavSidebar`                                                  |
| `features/dashboards/components/viewer/dashboard-tabs-nav-items.tsx` | tradução ABA → item de navegação (ícone, contagem, seção, ramo das sub-abas)                                         |
| `shared/ui/nav-section/`                                             | a navegação em si — réplica da sidebar do AuditorIA (`docs/design-system/sidebar/CONTRATO.md`)                       |
| `features/dashboards/components/editor/tabs-editor.tsx`              | criar/renomear/reordenar abas no editor                                                                              |
| `features/dashboards/routes.tsx`                                     | rota `dashboards/:id/view`, exige `artifacts:view`                                                                   |
| `modules/dashboards/schema.ts` (backend)                             | aceita `tabs` no `draftLayout`                                                                                       |

**Acessibilidade:** `<nav aria-label="Abas do dashboard">` (rótulo explícito, para
distinguir esta região de um menu de app), `aria-current="page"` na aba atual, e
todas as abas alcançáveis por Tab, como qualquer menu de links. Sub-aba
(`level: 2`) vira um bloco `role="group"` rotulado pela aba-pai — é essa relação,
e não o recuo, que o leitor de tela anuncia como "dentro de Cobrança".

**Por que a navegação PRÓPRIA (`@/shared/ui/nav-section`) e não o `SideNav` do
design system:** o DOM do Astryx não tem legenda de 2ª linha, cotovelo/linha de
aninhamento nem o bloco de 56px com rótulo de 8,75px da forma recolhida — e o
CSS do app não alcança as classes atômicas do StyleX para corrigir isso (a
medição está em `docs/design-system/sidebar/CONTRATO.md` §1). Com a troca, a
barra de abas deixou de ser _parecida_ com o menu do app e passou a ser o MESMO
componente, com os mesmos tokens.

Três consequências práticas da troca:

- **largura fixa** de 300px (`--ds-layout-nav-vertical-width`), 88px recolhida —
  saiu a alça de arrastar (`resizable`, 248px ajustáveis entre 200 e 380). O
  ajuste fino se perdeu; a escolha que importa (barra inteira ou faixa de
  ícones) ficou, e agora **persiste** em `localStorage`
  (`dashboards:viewer:tabs-collapsed`), como a do menu do app;
- a **descrição** da aba virou a dica do próprio item (`title` nativo), inclusive
  no estado recolhido, onde o rótulo de 8,75px é o que mais precisa de
  complemento;
- **aba-pai com sub-abas** vira um ramo que abre/fecha (item com filhos não
  navega, por contrato da nav). Para o conteúdo dela não ficar inalcançável, a
  aba-pai aparece também como o primeiro link de dentro do ramo — só quando tem
  blocos próprios; agrupadora vazia não vira link para uma tela vazia.

**Por que não `TabList` (reversão de uma decisão anterior):** a
primeira versão usava `TabList` com `orientation="vertical"`, citando o
anti-pattern do DS ("não use SideNav para filtrar conteúdo"). Só que `orientation`
**não empilha nada** — a doc do componente diz que ela controla apenas quais
setas movem o foco e o `aria-orientation` reportado. Medido na tela, as abas
saíam LADO A LADO. E não havia como corrigir o eixo por fora: `xstyle` é inerte
neste app (sem compilador StyleX), CSS em `@layer` perde das classes atômicas do
StyleX, e `TabList` não expõe `style`.

O anti-pattern valia para o contexto antigo, em que a tela vivia dentro do shell
e uma segunda nav lateral competiria com a principal. Com a visualização
autônoma não há outra navegação na página — esta deixa de ser "uma segunda nav"
e passa a ser A nav, que é o propósito de uma navegação lateral.

**Custo assumido:** perdemos o roving tabindex e a navegação por setas do tab
strip. Em troca, cada aba virou um LINK de verdade: ⌘/Ctrl+clique abre em nova
guia, o botão do meio funciona e "copiar endereço do link" funciona — nada disso
um `<button>` dava. Como a aba já vivia na URL, o link é a representação honesta
dela.

---

## Exemplo pronto para conferir

O dashboard **"Painel de Atendimento WhatsApp"** foi configurado com duas abas:

- **Visão geral** — KPIs + volume de mensagens
- **Detalhamento** — composição por tipo + Top 10 contatos

Abra `/dashboards/<id>/view` e a barra lateral aparece.

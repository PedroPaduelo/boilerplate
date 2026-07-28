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
| `features/dashboards/components/viewer/dashboard-tabs-sidebar.tsx`   | a barra lateral (`TabList` vertical dentro de `LayoutPanel`, 220px)                                                  |
| `features/dashboards/components/editor/tabs-editor.tsx`              | criar/renomear/reordenar abas no editor                                                                              |
| `features/dashboards/routes.tsx`                                     | rota `dashboards/:id/view`, exige `artifacts:view`                                                                   |
| `modules/dashboards/schema.ts` (backend)                             | aceita `tabs` no `draftLayout`                                                                                       |

**Acessibilidade:** `<nav aria-label="Abas do dashboard">` (rótulo explícito — o
padrão do `SideNav` é o genérico "Navegação lateral"), `aria-current="page"` na
aba atual, e todas as abas alcançáveis por Tab, como qualquer menu de links.

**Por que `SideNav` e não `TabList` (reversão de uma decisão anterior):** a
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
e passa a ser A nav, que é o propósito do `SideNav`.

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

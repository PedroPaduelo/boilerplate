# Abas do dashboard e modo de Visualização

Como usar, o que existe no código, e como pedir para a IA.

---

## O que é

Um dashboard pode dividir suas linhas em **abas**. No modo de **Visualização**
(`/dashboards/:id/view`) as abas viram uma **barra lateral** de 220px à esquerda
do grid, e o resto da tela é só leitura — sem nada de edição.

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

**Acessibilidade** (vem do `TabList` com `orientation="vertical"`): ponto único
de tabulação (roving tabindex), ↑/↓ e ←/→ entre abas, Home/End para
primeira/última, `aria-current="page"` na aba atual, e `<nav aria-label="Abas do
dashboard">` para distinguir a região do menu principal na lista de landmarks.

**Por que `TabList` e não `SideNav`:** o próprio design system marca "usar
SideNav para filtrar conteúdo" como anti-pattern. `SideNav` é a navegação
primária do app — já existe no shell, com as rotas. Aninhar uma segunda dentro do
conteúdo colocaria duas navegações principais competindo pela mesma função. Aqui
a troca é de VISTA dentro de uma mesma página, que é o caso de uso de abas.

---

## Exemplo pronto para conferir

O dashboard **"Painel de Atendimento WhatsApp"** foi configurado com duas abas:

- **Visão geral** — KPIs + volume de mensagens
- **Detalhamento** — composição por tipo + Top 10 contatos

Abra `/dashboards/<id>/view` e a barra lateral aparece.

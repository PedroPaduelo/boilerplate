# Hierarquia tipográfica da aplicação

> Contrato de **uso** — qual componente aplicar em cada papel de texto.
> Para a escala de tokens (px, peso, line-height) veja `02-tipografia.md`.

Este arquivo existe porque a mesma coisa estava sendo escrita de jeitos
diferentes em telas diferentes: o nome de uma conexão em peso normal, o de um
usuário em `semibold`, o título da página repetido em dois tamanhos. Sem um
papel declarado, cada tela reinventa o próprio peso.

## Papéis

| Papel                                  | Componente                            | Onde                                    |
| -------------------------------------- | ------------------------------------- | --------------------------------------- |
| **Título da página**                   | `Heading level={1}` — **só no shell** | `app/dashboard-layout.tsx` (TopNav)     |
| **Descrição da página**                | `Text type="supporting"`              | topo do corpo de cada tela              |
| **Título de seção**                    | `Heading level={2}`                   | `Section` dentro da página              |
| **Nome da entidade (tela de detalhe)** | `Heading level={2}`                   | workbench, detalhe de gráfico/dashboard |
| **Título de card / item de lista**     | `Heading level={3}`                   | `ConnectionCard`, `ChartCard`           |
| **Identificador da linha (tabela)**    | `Link isStandalone weight="medium"`   | 1ª coluna das tabelas                   |
| ↳ quando não há tela de detalhe        | `Text weight="medium"`                | `UsersTable`                            |
| **Eyebrow / kicker**                   | `Text type="supporting"`              | acima de um título                      |
| **Metadados, timestamps, helper text** | `Text type="supporting"`              | em todo lugar                           |
| **Valores técnicos (host, SQL, tipo)** | `Text type="code"`                    | workbench, tabelas de schema            |

## Regras

1. **O título da página nunca é repetido no corpo.** O `AppShell` já renderiza
   `Heading level={1}` com o rótulo do item de navegação ativo. Escrever
   "Dashboards" de novo como `Heading level={2}` dá o mesmo nome em dois
   tamanhos e pesos na mesma tela. O corpo começa na descrição.

2. **Descrição de página é `supporting`, não `body`.** Ela explica a tela, não
   é conteúdo — e `supporting` já traz `color: secondary` embutido
   (`Text.js`: `supporting: 'secondary'`). `<Text type="supporting" color="secondary">`
   é redundante.

3. **O identificador da linha usa `medium` — nunca `semibold`.** O que separa a
   coluna-chave das outras é o peso `medium` mais a cor de link. `semibold`
   numa tabela e peso normal em outra faz o mesmo tipo de objeto parecer ter
   importâncias diferentes.

4. **Não sobrescrever `weight` fora desta tabela.** Se um texto precisa de mais
   destaque, provavelmente o `type` está errado, não o peso.

## Pendência conhecida

Nas telas de lista sem seção intermediária (`/dashboards`, `/charts`,
`/connections`), a hierarquia pula de `h1` (shell) para `h3` (título de card).
Não é erro de WCAG, mas é uma quebra da recomendação de não pular níveis. A
correção limpa é dar à região da lista um `Heading level={2}` visualmente
discreto ou usar `accessibilityLevel={2}` nos cards — decisão em aberto, porque
transformar cada card num `h2` semântico muda a navegação por cabeçalhos do
leitor de tela.

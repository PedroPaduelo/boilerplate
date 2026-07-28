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

## Escala

Os títulos NÃO usam a escala herdada do tema MUI legado (h1 35px/800,
h2 28px/800 em Barlow ExtraBold). Aquilo vinha de um produto editorial; aqui o
texto dominante da UI tem **12,25px** (`supporting`), e um h2 de 28px/800 ao
lado disso é 2,3x o tamanho e 2x o peso.

A escala vigente está em `auditoria-theme.ts` (bloco "ESCALA DE TÍTULO
PRÓPRIA"), reancorada no corpo real:

| Slot        | Tamanho | Peso |
| ----------- | ------- | ---- |
| `heading-1` | 24px    | 700  |
| `heading-2` | 19px    | 600  |
| `heading-3` | 16px    | 600  |
| `heading-4` | 14px    | 600  |
| `heading-5` | 13px    | 600  |
| `heading-6` | 12,25px | 600  |

`tokens.generated.ts` continua sendo o registro fiel do sistema legado e **não
é editado** — a divergência é declarada no tema, com o motivo.

## Campos de código

`TextArea` é um campo de prosa: o override de tema o faz herdar o `TextInput`
(família proporcional, `--font-size-sm` fixo em 14px). Num editor de SQL isso
desalinha colunas e ainda o torna o maior texto da tela.

Editor de SQL/JSON usa `className="app-code-field"` (definido em
`app/index.css`, camada `components`): monoespaçada + `--font-size-2xs`.

## Cabeçalho semântico em cards

Nas listas sem seção intermediária (`/dashboards`, `/charts`, `/connections`) o
`h1` é da topbar e o card seria `h3` — pulando o `h2`. Os cards resolvem isso
com `accessibilityLevel={2}`: continuam `h3` no visual e viram `h2` na árvore
de acessibilidade, sem salto e sem inflar o tamanho na tela.

# 03 — Espaçamento

---

## 1. Unidade base

| Token          | Valor bruto | Referência MUI  | Origem                                                          |
| -------------- | ----------- | --------------- | --------------------------------------------------------------- |
| `spacing.base` | **8 px**    | `theme.spacing` | **default MUI 7.0.1** — o projeto **não** sobrescreve `spacing` |

Verificação: varredura por `spacing:` em `frontend/src/theme/**` → nenhuma definição.
O tema computado devolve `theme.spacing(1) === "var(--spacing, 8px)"`, e a variável CSS
`--spacing` foi **medida em runtime** com valor **`8px`**.

> Como o tema publica variáveis CSS, `spacing(n)` é emitido como
> `calc(n * var(--spacing, 8px))` em vez de um px literal. O valor final é sempre `n × 8 px`.

---

## 2. Tabela de multiplicadores

### 2.1 Inteiros (1 a 12)

| Multiplicador | Valor bruto | Emitido como                    | Uso observado no projeto                                                                                          |
| ------------- | ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `0`           | **0 px**    | `0px`                           | zerar espaçamento                                                                                                 |
| `1`           | **8 px**    | `calc(1 * var(--spacing, 8px))` | padding de checkbox/radio, gap curto, padding topo do conteúdo, margem do texto de ajuda                          |
| `2`           | **16 px**   | `calc(2 * …)`                   | **o mais usado**: margem de ícone de lista, padding de barra do DataGrid, margem do diálogo, gutter de breadcrumb |
| `3`           | **24 px**   | `calc(3 * …)`                   | padding de card, de diálogo e de conteúdo de diálogo                                                              |
| `4`           | **32 px**   | `calc(4 * …)`                   | espaçamentos de seção                                                                                             |
| `5`           | **40 px**   | `calc(5 * …)`                   | padding lateral do conteúdo do dashboard e do header                                                              |
| `6`           | **48 px**   | `calc(6 * …)`                   | blocos maiores                                                                                                    |
| `7`           | **56 px**   | `calc(7 * …)`                   | —                                                                                                                 |
| `8`           | **64 px**   | `calc(8 * …)`                   | padding inferior do conteúdo do dashboard                                                                         |
| `9`           | **72 px**   | `calc(9 * …)`                   | —                                                                                                                 |
| `10`          | **80 px**   | `calc(10 * …)`                  | blocos de páginas institucionais                                                                                  |
| `11`          | **88 px**   | `calc(11 * …)`                  | —                                                                                                                 |
| `12`          | **96 px**   | `calc(12 * …)`                  | —                                                                                                                 |

### 2.2 Frações usadas no código

| Multiplicador | Valor bruto | Uso observado                                                                      |
| ------------- | ----------- | ---------------------------------------------------------------------------------- |
| `0.25`        | **2 px**    | padding de botão de ícone no DataGrid                                              |
| `0.5`         | **4 px**    | margem de título de alerta, padding de dropdown, gap de painel de colunas          |
| `0.75`        | **6 px**    | padding vertical de item de menu, padding e gap do componente `Label`              |
| `1.25`        | **10 px**   | —                                                                                  |
| `1.5`         | **12 px**   | gap entre ações de diálogo, padding de formulário de filtro do DataGrid            |
| `1.75`        | **14 px**   | —                                                                                  |
| `2.5`         | **20 px**   | margem lateral do divisor vertical do header; padding de topo do painel de colunas |
| `3.5`         | **28 px**   | padding esquerdo do bloco do logo na sidebar                                       |
| `4.75`        | **38 px**   | —                                                                                  |

Frequência de uso dentro de `frontend/src/theme/**`:
`spacing(2)` 13× · `spacing(1)` 7× · `spacing(0.5)` 7× · `spacing(3)` 4× · `spacing(1.5)` 3× · `spacing(0.25)` 3×.

---

## 3. Espaçamento por contexto

### 3.1 Página / conteúdo do dashboard

| Propriedade                                  | Valor bruto                                 | Referência                                     | Condição                   | Origem (arquivo:linha)                                                            |
| -------------------------------------------- | ------------------------------------------- | ---------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| `padding-top`                                | **8 px**                                    | `--layout-dashboard-content-pt` = `spacing(1)` | sempre                     | `frontend/src/layouts/dashboard/css-vars.ts:16`                                   |
| `padding-top` (nav horizontal)               | **40 px**                                   | sobrescreve `--layout-dashboard-content-pt`    | `≥1200px` + nav horizontal | `frontend/src/layouts/dashboard/content.tsx:46`                                   |
| `padding-bottom`                             | **64 px**                                   | `--layout-dashboard-content-pb` = `spacing(8)` | sempre                     | `frontend/src/layouts/dashboard/css-vars.ts:17`                                   |
| `padding-left` / `padding-right`             | **40 px**                                   | `--layout-dashboard-content-px` = `spacing(5)` | **só a partir de 1200 px** | `frontend/src/layouts/dashboard/css-vars.ts:18` + `content.tsx:44-45`             |
| `padding-left` / `padding-right` (< 1200 px) | **16 px** (< 600 px) / **24 px** (≥ 600 px) | gutter padrão de container                     | abaixo de 1200 px          | default MUI 7.0.1 (`node_modules/@mui/system/Container/createContainer.js:67-72`) |
| `padding` (modo `disablePadding`)            | **0** em todas as faixas                    | —                                              | quando a tela pede         | `frontend/src/layouts/dashboard/content.tsx:49-57`                                |

⚠️ Abaixo de 1200 px o padding lateral **cai de 40 px para 24/16 px** — é o gutter padrão do container,
não um valor do projeto.

### 3.2 Container (biblioteca base)

| Propriedade                      | Valor bruto              | Faixa     | Origem                                                               |
| -------------------------------- | ------------------------ | --------- | -------------------------------------------------------------------- |
| `padding-left` / `padding-right` | **16 px** (`spacing(2)`) | `< 600px` | default MUI 7.0.1 (`@mui/system/Container/createContainer.js:67-68`) |
| `padding-left` / `padding-right` | **24 px** (`spacing(3)`) | `≥ 600px` | default MUI 7.0.1 (`createContainer.js:70-72`)                       |

### 3.3 Card

| Parte                  | Propriedade  | Valor bruto                | Referência         | Origem (arquivo:linha)                           |
| ---------------------- | ------------ | -------------------------- | ------------------ | ------------------------------------------------ |
| Cabeçalho              | `padding`    | **24 px 24 px 0**          | `spacing(3, 3, 0)` | `frontend/src/theme/core/components/card.tsx:33` |
| Subtítulo do cabeçalho | `margin-top` | **4 px**                   | literal `'4px'`    | `frontend/src/theme/core/components/card.tsx:27` |
| Conteúdo               | `padding`    | **24 px** (todos os lados) | `spacing(3)`       | `frontend/src/theme/core/components/card.tsx:42` |

### 3.4 Diálogo

| Parte                    | Propriedade                         | Valor bruto      | Referência      | Origem (arquivo:linha)                             |
| ------------------------ | ----------------------------------- | ---------------- | --------------- | -------------------------------------------------- |
| Superfície               | `margin`                            | **16 px**        | `spacing(2)`    | `frontend/src/theme/core/components/dialog.tsx:23` |
| Superfície em tela cheia | `margin`                            | **0** (e raio 0) | —               | `frontend/src/theme/core/components/dialog.tsx:25` |
| Título                   | `padding`                           | **24 px**        | `spacing(3)`    | `frontend/src/theme/core/components/dialog.tsx:33` |
| Conteúdo                 | `padding`                           | **0 24 px**      | `spacing(0, 3)` | `frontend/src/theme/core/components/dialog.tsx:41` |
| Conteúdo com divisores   | `padding-bottom`                    | **24 px**        | `spacing(3)`    | `frontend/src/theme/core/components/dialog.tsx:45` |
| Ações                    | `padding`                           | **24 px**        | `spacing(3)`    | `frontend/src/theme/core/components/dialog.tsx:61` |
| Espaço entre ações       | `margin-left` do 2º filho em diante | **12 px**        | `spacing(1.5)`  | `frontend/src/theme/core/components/dialog.tsx:62` |

⚠️ O espaçamento entre botões de ação **não** usa `gap`: usa `margin-left` no seletor
`& > :not(:first-of-type)`, porque `disableSpacing: true` está ligado (`dialog.tsx:55`).

### 3.5 Formulário e campos

| Elemento                            | Propriedade   | Valor bruto                         | Origem (arquivo:linha)                                   |
| ----------------------------------- | ------------- | ----------------------------------- | -------------------------------------------------------- |
| Texto de ajuda                      | `margin-top`  | **8 px** (`spacing(1)`)             | `frontend/src/theme/core/components/form.tsx:39`         |
| Texto de ajuda                      | `margin-left` | **14 px**                           | default MUI 7.0.1 — medido em runtime                    |
| Campo com contorno — texto          | `padding`     | **16,5 px 14 px**                   | default MUI 7.0.1 — medido em runtime                    |
| Campo preenchido — texto            | `padding`     | **8 px 4 px 9 px**                  | default MUI 7.0.1 — medido em runtime                    |
| Rótulo recolhido                    | `transform`   | `translate(14px, -9px) scale(0.75)` | default MUI 7.0.1 — medido em runtime                    |
| Rótulo recolhido (campo preenchido) | `transform`   | `translate(12px, 6px) scale(0.75)`  | `frontend/src/theme/core/components/form.tsx:21`         |
| Etiqueta de autocomplete            | `padding`     | **0 6 px** (`spacing(0, 0.75)`)     | `frontend/src/theme/core/components/autocomplete.tsx:41` |

### 3.6 Item de lista / menu

| Elemento                        | Propriedade                                | Valor bruto                     | Referência                                          | Origem (arquivo:linha)                                             |
| ------------------------------- | ------------------------------------------ | ------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| Item de menu                    | `padding`                                  | **6 px 8 px**                   | `spacing(0.75, 1)`                                  | `frontend/src/theme/core/mixins/global-styles-components.ts:22`    |
| Item de menu                    | `margin-bottom` (exceto o último)          | **4 px**                        | literal `4`                                         | `frontend/src/theme/core/mixins/global-styles-components.ts:25`    |
| Checkbox dentro de item de menu | `padding` / `margin-left` / `margin-right` | **4 px** / **−4 px** / **4 px** | `spacing(0.5)` / `spacing(-0.5)` / `spacing(0.5)`   | `frontend/src/theme/core/mixins/global-styles-components.ts:34-37` |
| Divisor após item de menu       | `margin`                                   | **4 px 0**                      | `spacing(0.5, 0)`                                   | `frontend/src/theme/core/mixins/global-styles-components.ts:43`    |
| Ícone de item de lista          | `margin-right`                             | **16 px**                       | `spacing(2)`                                        | `frontend/src/theme/core/components/list.tsx:10`                   |
| Avatar de item de lista         | `margin-right`                             | **16 px**                       | `spacing(2)`                                        | `frontend/src/theme/core/components/list.tsx:19`                   |
| Texto de item de lista          | `margin`                                   | **0**                           | literal                                             | `frontend/src/theme/core/components/list.tsx:41`                   |
| Contêiner de dropdown           | `padding`                                  | **4 px**                        | `spacing(0.5)` (via `paperStyles({dropdown:true})`) | `frontend/src/theme/core/mixins/global-styles-components.ts:93`    |
| Lista dentro de popover         | `padding-top` / `padding-bottom`           | **0**                           | literal                                             | `frontend/src/theme/core/components/popover.tsx:14`                |
| Lista do autocomplete           | `padding`                                  | **0**                           | literal                                             | `frontend/src/theme/core/components/autocomplete.tsx:46`           |

### 3.7 Tabela

| Elemento                            | Propriedade    | Valor bruto                                            | Origem                                                                     |
| ----------------------------------- | -------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| Célula (`normal`)                   | `padding`      | **16 px**                                              | default MUI 7.0.1 (`node_modules/@mui/material/TableCell/TableCell.js:57`) |
| Célula (`size="small"`)             | `padding`      | **6 px 16 px**                                         | default MUI 7.0.1 (`TableCell.js:88`)                                      |
| Célula de checkbox                  | `padding-left` | **8 px** (`spacing(1)`) — **sobrescrito pelo projeto** | `frontend/src/theme/core/components/table.tsx:69`                          |
| Célula de checkbox (`size="small"`) | `padding`      | **0 12 px 0 16 px**                                    | default MUI 7.0.1 (`TableCell.js:92`)                                      |
| Célula `padding="none"`             | `padding`      | **0**                                                  | default MUI 7.0.1 (`TableCell.js:112`)                                     |
| Barra de paginação                  | `height`       | **64 px**                                              | `frontend/src/theme/core/components/table.tsx:90`                          |
| Ações da paginação                  | `margin-right` | **8 px**                                               | `frontend/src/theme/core/components/table.tsx:93`                          |
| Seletor de linhas por página        | `padding-left` | **8 px**                                               | `frontend/src/theme/core/components/table.tsx:93`                          |

### 3.8 Barra e painéis do DataGrid

| Elemento                       | Propriedade                               | Valor bruto                | Referência                         | Origem (arquivo:linha)                                           |
| ------------------------------ | ----------------------------------------- | -------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| Barra de ferramentas           | `gap` / `padding`                         | **16 px** / **16 px**      | `spacing(2)`                       | `frontend/src/theme/core/components/mui-x-data-grid.tsx:165-166` |
| Campo dentro da barra          | `padding-top` / `padding-bottom` do input | **16 px**                  | `spacing(2)`                       | `frontend/src/theme/core/components/mui-x-data-grid.tsx:171-172` |
| Cabeçalho do painel de colunas | `padding`                                 | **20 px 16 px 0 16 px**    | `spacing(2.5, 2, 0, 2)`            | `frontend/src/theme/core/components/mui-x-data-grid.tsx:211`     |
| Painel de colunas              | `gap` / `padding`                         | **4 px** / **16 px 12 px** | `spacing(0.5)` / `spacing(2, 1.5)` | `frontend/src/theme/core/components/mui-x-data-grid.tsx:218-219` |
| Rodapé do painel de colunas    | `padding`                                 | **12 px**                  | `spacing(1.5)`                     | `frontend/src/theme/core/components/mui-x-data-grid.tsx:224`     |
| Formulário de filtro           | `gap` / `padding`                         | **12 px** / **16 px**      | `spacing(1.5)` / `spacing(2)`      | `frontend/src/theme/core/components/mui-x-data-grid.tsx:232-233` |
| Botão de menu de coluna        | `margin` / `padding`                      | **0 8 px** / **2 px**      | `spacing(0, 1)` / `spacing(0.25)`  | `frontend/src/theme/core/components/mui-x-data-grid.tsx:190-191` |
| Rótulo de controle nos painéis | `gap`                                     | **4 px**                   | literal `4`                        | `frontend/src/theme/core/components/mui-x-data-grid.tsx:224`     |

### 3.9 Botão

| Tamanho | `padding-left` / `padding-right` | Variantes                       | Origem (arquivo:linha)                                  |
| ------- | -------------------------------- | ------------------------------- | ------------------------------------------------------- |
| small   | **8 px**                         | `contained`, `outlined`, `soft` | `frontend/src/theme/core/components/button.tsx:157-159` |
| small   | **4 px**                         | `text`                          | `frontend/src/theme/core/components/button.tsx:158`     |
| medium  | **12 px**                        | `contained`, `outlined`, `soft` | `frontend/src/theme/core/components/button.tsx:162-165` |
| medium  | **8 px**                         | `text`                          | `frontend/src/theme/core/components/button.tsx:164`     |
| large   | **16 px**                        | `contained`, `outlined`, `soft` | `frontend/src/theme/core/components/button.tsx:169-172` |
| large   | **10 px**                        | `text`                          | `frontend/src/theme/core/components/button.tsx:171`     |

Padding vertical **não é declarado** — vem da biblioteca base e foi medido em runtime:
small `4 px`, medium `6 px`, large `8 px` (nas variantes com borda, `−1 px` para compensar a borda:
small `3 px`, medium `5 px`, large `7 px`).

FAB estendido: `padding` **0 16 px** (`spacing(0, 2)`), gap **8 px** (`spacing(1)`);
tamanho small: `padding` **0 8 px** (`spacing(0, 1)`), gap **4 px** (`spacing(0.5)`)
— `frontend/src/theme/core/components/button-fab.tsx:146-158`.

### 3.10 Aba, breadcrumb e demais

| Elemento                      | Propriedade                      | Valor bruto                                 | Referência                           | Origem (arquivo:linha)                                                |
| ----------------------------- | -------------------------------- | ------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Lista de abas                 | `gap`                            | **24 px** (< 600 px) → **40 px** (≥ 600 px) | literais `'24px'` / `'40px'`         | `frontend/src/theme/core/components/tabs.tsx:19-20`                   |
| Aba                           | `padding`                        | **8 px 0**                                  | `spacing(1, 0)`                      | `frontend/src/theme/core/components/tabs.tsx:43`                      |
| Breadcrumb                    | `row-gap` / `column-gap`         | **4 px** / **16 px**                        | `spacing(0.5)` / `spacing(2)`        | `frontend/src/theme/core/components/breadcrumbs.tsx:11`               |
| Separador de breadcrumb       | `margin`                         | **0**                                       | literal                              | `frontend/src/theme/core/components/breadcrumbs.tsx:13`               |
| Resumo de accordion           | `padding-left` / `padding-right` | **16 px** / **8 px**                        | `spacing(2)` / `spacing(1)`          | `frontend/src/theme/core/components/accordion.tsx:32-33`              |
| Título de alerta              | `margin-bottom`                  | **4 px**                                    | `spacing(0.5)`                       | `frontend/src/theme/core/components/alert.tsx:163`                    |
| Checkbox / Radio              | `padding`                        | **8 px**                                    | `spacing(1)`                         | `frontend/src/theme/core/components/checkbox.tsx:53` e `radio.tsx:50` |
| Grupo de toggle               | `gap` / `padding`                | **4 px** / **4 px**                         | literais                             | `frontend/src/theme/core/components/button-toggle.tsx:80-81`          |
| Componente `Label`            | `padding` / `gap`                | **0 6 px** / **6 px**                       | `spacing(0, 0.75)` / `spacing(0.75)` | `frontend/src/components/label/styles.tsx:96-97`                      |
| Tooltip (afastamento do alvo) | `margin`                         | **12 px** no eixo da posição                | literais `12`                        | `frontend/src/theme/core/components/tooltip.tsx:24-35`                |
| Tela de carregamento          | `padding-left` / `padding-right` | **40 px**                                   | `spacing(5)`                         | `frontend/src/components/loading-screen/loading-screen.tsx:37-38`     |

### 3.11 Navegação lateral

| Elemento                                 | Propriedade                                         | Valor bruto                                      | Origem (arquivo:linha)                                            |
| ---------------------------------------- | --------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| Bloco do logo (vertical)                 | `padding-left` / `padding-top` / `padding-bottom`   | **28 px** / **20 px** / **8 px**                 | `frontend/src/layouts/dashboard/nav-vertical.tsx:48`              |
| Bloco do logo (mini)                     | `padding-top` / `padding-bottom`                    | **20 px**                                        | `frontend/src/layouts/dashboard/nav-vertical.tsx:66`              |
| Lista de navegação (vertical)            | `padding-left` / `padding-right`                    | **16 px**                                        | `frontend/src/layouts/dashboard/nav-vertical.tsx:76`              |
| Lista de navegação (mini)                | `padding-bottom` / `padding-left` / `padding-right` | **16 px** / **4 px**                             | `frontend/src/layouts/dashboard/nav-vertical.tsx:90-91`           |
| Item (vertical)                          | `padding`                                           | **4 px 8 px 4 px 12 px**                         | `frontend/src/components/nav-section/styles/css-vars.ts:44-47`    |
| Item (mini)                              | `padding`                                           | **8 px 4 px 6 px 4 px**                          | `frontend/src/components/nav-section/styles/css-vars.ts:73`       |
| Item (horizontal)                        | `padding`                                           | **0 6 px**                                       | `frontend/src/components/nav-section/styles/css-vars.ts:94`       |
| Item filho (mini/horizontal)             | `padding`                                           | **0 8 px**                                       | `frontend/src/components/nav-section/styles/css-vars.ts:76,96`    |
| Espaço entre itens                       | `gap`                                               | **4 px** (vertical/mini) · **6 px** (horizontal) | `frontend/src/components/nav-section/styles/css-vars.ts:42,71,91` |
| Margem do ícone (vertical)               | `margin`                                            | **0 12 px 0 0**                                  | `frontend/src/components/nav-section/styles/css-vars.ts:56`       |
| Margem do ícone (mini, raiz)             | `margin`                                            | **0 0 6 px 0**                                   | `frontend/src/components/nav-section/styles/css-vars.ts:80`       |
| Margem do ícone (mini/horizontal, filho) | `margin`                                            | **0 8 px 0 0**                                   | `frontend/src/components/nav-section/styles/css-vars.ts:81,97`    |

### 3.12 Header

| Elemento                 | Propriedade                      | Valor bruto                            | Condição                | Origem (arquivo:linha)                             |
| ------------------------ | -------------------------------- | -------------------------------------- | ----------------------- | -------------------------------------------------- |
| Container do header      | `padding-left` / `padding-right` | **40 px** (`px: 5`)                    | nav vertical, `≥1200px` | `frontend/src/layouts/dashboard/layout.tsx:154`    |
| Grupo de ações à direita | `gap`                            | **0** (< 600 px) → **6 px** (≥ 600 px) | —                       | `frontend/src/layouts/dashboard/layout.tsx:200`    |
| Botão de menu (mobile)   | `margin-right` / `margin-left`   | **8 px** / **−8 px**                   | < 1200 px               | `frontend/src/layouts/dashboard/layout.tsx:177`    |
| Divisor vertical         | `margin-left` / `margin-right`   | **20 px**                              | nav horizontal          | `frontend/src/layouts/dashboard/content.tsx:74-75` |

---

## 4. Como o espaçamento é aplicado

1. **`gap` é a forma preferida.** `MuiStack` tem `useFlexGap: true` por padrão
   (`frontend/src/theme/core/components/stack.tsx:11`), então empilhamentos usam `gap` real,
   não margens negativas.
2. **Espaçamentos verticais entre blocos** vêm de `sx` local nas telas — não há um token global de
   "ritmo vertical". Não existe seletor tipo `& > * + *` no tema.
3. **Frações** só descem até `0.25` (2 px). Não há uso de valores menores que 2 px.
4. Valores em px literais (`'4px'`, `'24px'`, `12`) convivem com `spacing()` no tema —
   ver `99-inconsistencias.md`.

---

## 5. Referência rápida

```
2px   = spacing(0.25)
4px   = spacing(0.5)
6px   = spacing(0.75)
8px   = spacing(1)      ← padding de controle pequeno, gap curto
10px  = spacing(1.25)
12px  = spacing(1.5)    ← gap entre ações de diálogo
14px  = spacing(1.75)
16px  = spacing(2)      ← unidade mais usada
20px  = spacing(2.5)
24px  = spacing(3)      ← padding de card e diálogo
32px  = spacing(4)
40px  = spacing(5)      ← padding lateral do conteúdo (≥1200px)
48px  = spacing(6)
56px  = spacing(7)
64px  = spacing(8)      ← padding inferior do conteúdo
72px  = spacing(9)
80px  = spacing(10)
88px  = spacing(11)
96px  = spacing(12)
```

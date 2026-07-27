# 05 — Grid e layout

> Documento descritivo do sistema de design **como ele é hoje**, apurado por leitura de código,
> computação do tema real e medição em runtime (Chrome, viewport 1911×898, tema light).
> Fonte primária: `frontend/.ds-extract/FATOS.md`.
>
> **Nenhum valor deste documento é sugestão.** Todo valor existe no código do projeto ou é
> default efetivo da biblioteca de componentes (MUI 7.0.1), e nesse caso está marcado como
> `default MUI 7.0.1`.

---

## 1. Breakpoints

O projeto **não sobrescreve** os breakpoints. O objeto de tema computado é idêntico ao default
da biblioteca (verificado executando o tema real e comparando com o default puro).

| Token                          | Valor bruto            | Referência MUI          | Onde é usado                                 | Origem                                                                          |
| ------------------------------ | ---------------------- | ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| `xs`                           | `0` (px)               | `breakpoints.values.xs` | Faixa base (mobile-first)                    | default MUI 7.0.1 — `@mui/system/esm/createBreakpoints/createBreakpoints.js:25` |
| `sm`                           | `600` (px)             | `breakpoints.values.sm` | Tablet retrato                               | default MUI 7.0.1 — `@mui/system/esm/createBreakpoints/createBreakpoints.js:27` |
| `md`                           | `900` (px)             | `breakpoints.values.md` | Tablet paisagem / laptop pequeno             | default MUI 7.0.1 — `@mui/system/esm/createBreakpoints/createBreakpoints.js:29` |
| `lg`                           | `1200` (px)            | `breakpoints.values.lg` | Desktop — **é o `layoutQuery` do dashboard** | default MUI 7.0.1 — `@mui/system/esm/createBreakpoints/createBreakpoints.js:31` |
| `xl`                           | `1536` (px)            | `breakpoints.values.xl` | Telas grandes                                | default MUI 7.0.1 — `@mui/system/esm/createBreakpoints/createBreakpoints.js:33` |
| unidade                        | `px`                   | `breakpoints.unit`      | —                                            | default MUI 7.0.1 — `@mui/system/esm/createBreakpoints/createBreakpoints.js:35` |
| passo de subtração do `down()` | `5` → `5/100 = 0.05px` | `breakpoints.step`      | Evita sobreposição de faixas                 | default MUI 7.0.1 — `@mui/system/esm/createBreakpoints/createBreakpoints.js:36` |

Verificação: no tema computado do projeto,
`breakpoints.values === { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 }` e `unit === "px"`
(`frontend/.ds-extract/theme.json` → `computed.breakpoints`).

### 1.1 Media queries literais

Estas são as strings exatas geradas, sem nenhuma normalização:

**`up(chave)` — "a partir de":**

| Chave | Media query literal         |
| ----- | --------------------------- |
| `xs`  | `@media (min-width:0px)`    |
| `sm`  | `@media (min-width:600px)`  |
| `md`  | `@media (min-width:900px)`  |
| `lg`  | `@media (min-width:1200px)` |
| `xl`  | `@media (min-width:1536px)` |

**`down(chave)` — "até (exclusive)":**

| Chave | Media query literal            |
| ----- | ------------------------------ |
| `xs`  | `@media (max-width:-0.05px)`   |
| `sm`  | `@media (max-width:599.95px)`  |
| `md`  | `@media (max-width:899.95px)`  |
| `lg`  | `@media (max-width:1199.95px)` |
| `xl`  | `@media (max-width:1535.95px)` |

> ⚠️ **`down('xs')` gera `@media (max-width:-0.05px)`**, uma condição **impossível de satisfazer**
> (nenhuma viewport tem largura negativa). Isso não é um bug de extração: é o resultado direto da
> fórmula `valor - step/100` com `valor = 0`
> (`@mui/system/esm/createBreakpoints/createBreakpoints.js:47`). Na prática, qualquer regra escrita
> com `down('xs')` **nunca é aplicada**. Está documentado aqui porque é uma armadilha real.

**Fórmulas de origem:**

```
up(k)   → `@media (min-width:${values[k]}px)`
down(k) → `@media (max-width:${values[k] - 0.05}px)`
```

(`@mui/system/esm/createBreakpoints/createBreakpoints.js:41-48`)

### 1.2 Comportamento em cada faixa

| Faixa | Largura da viewport    | O que muda                                                                                                                                                      |
| ----- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `xs`  | `0` a `599.95px`       | Sidebar oculta; menu via gaveta temporária de `288px`; conteúdo sem padding lateral; `font-size` do `<input>` sobe para `1rem`/`14px` (anti-zoom do Safari iOS) |
| `sm`  | `600px` a `899.95px`   | `Container` passa a usar `24px` de padding lateral; tipografia responsiva ativa a primeira escala (`h1`…`h6`); espaço entre abas vai de `24px` para `40px`      |
| `md`  | `900px` a `1199.95px`  | Segunda escala da tipografia responsiva (`h1`…`h4`); sidebar **ainda oculta**                                                                                   |
| `lg`  | `1200px` a `1535.95px` | **Ponto de virada do layout**: sidebar fixa aparece, `MenuButton` some, conteúdo ganha `40px` de padding lateral, `padding-left` é aplicado no contêiner        |
| `xl`  | `1536px` em diante     | **Nenhuma regra de tipografia** existe em `xl` (nenhuma variante define `xl`); só afeta `Container maxWidth="xl"`                                               |

Fontes: `frontend/src/theme/core/typography.ts:22-37` (escalas responsivas),
`frontend/src/theme/core/components/textfield.tsx:22-25` (anti-zoom),
`frontend/src/theme/core/components/tabs.tsx:19-20` (abas),
`frontend/src/layouts/dashboard/layout.tsx:60` (`layoutQuery = 'lg'`).

---

## 2. Contêiner e larguras máximas

O projeto **não sobrescreve** `MuiContainer` (verificado: não há chave `MuiContainer` em nenhum dos
44 arquivos de `frontend/src/theme/core/components/`). Todos os valores abaixo são default da
biblioteca, confirmados lendo o código-fonte instalado.

| Token                              | Valor bruto                                                       | Referência MUI   | Onde é usado                                | Origem                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------- | ---------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `maxWidth` default                 | `lg`                                                              | `Container`      | Qualquer `Container` sem prop               | default MUI 7.0.1 — `@mui/material/Container/Container.js:65` e `@mui/system/esm/Container/createContainer.js:110`    |
| `max-width` com `maxWidth="xs"`    | `444px` (`Math.max(0, 444)`) a partir de `@media (min-width:0px)` | `Container`      | —                                           | default MUI 7.0.1 — `@mui/system/esm/Container/createContainer.js:86-92`                                              |
| `max-width` com `maxWidth="sm"`    | `600px` a partir de `@media (min-width:600px)`                    | `Container`      | —                                           | default MUI 7.0.1 — `@mui/system/esm/Container/createContainer.js:93-99`                                              |
| `max-width` com `maxWidth="md"`    | `900px` a partir de `@media (min-width:900px)`                    | `Container`      | —                                           | idem                                                                                                                  |
| `max-width` com `maxWidth="lg"`    | `1200px` a partir de `@media (min-width:1200px)`                  | `Container`      | —                                           | idem                                                                                                                  |
| `max-width` com `maxWidth="xl"`    | `1536px` a partir de `@media (min-width:1536px)`                  | `Container`      | —                                           | idem                                                                                                                  |
| `max-width` com `maxWidth={false}` | **nenhuma** (largura total)                                       | `Container`      | Conteúdo do dashboard no default do projeto | default MUI 7.0.1 — `@mui/system/esm/Container/createContainer.js:93` (a regra só é emitida se `maxWidth` for truthy) |
| `width`                            | `100%`                                                            | `Container` root | —                                           | default MUI 7.0.1 — `@mui/system/esm/Container/createContainer.js:55`                                                 |
| `margin-left` / `margin-right`     | `auto` / `auto`                                                   | `Container` root | Centralização                               | default MUI 7.0.1 — `@mui/system/esm/Container/createContainer.js:56,58`                                              |
| `box-sizing`                       | `border-box`                                                      | `Container` root | —                                           | default MUI 7.0.1 — `@mui/system/esm/Container/createContainer.js:57`                                                 |

> ⚠️ **Detalhe importante sobre `maxWidth="xs"`**: o valor **não é `0`**. A biblioteca aplica
> `Math.max(breakpoints.values.xs, 444)` = **`444px`**
> (`@mui/system/esm/Container/createContainer.js:90`). É o único breakpoint cujo `max-width` não é
> igual ao valor do breakpoint.

### 2.1 Gutters (padding lateral do contêiner)

| Token                            | Valor bruto                        | Referência MUI                        | Onde é usado                      | Origem                                                                               |
| -------------------------------- | ---------------------------------- | ------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| padding lateral base             | `16px` de cada lado (`spacing(2)`) | `Container` (`disableGutters: false`) | Faixas `xs`                       | default MUI 7.0.1 — `@mui/system/esm/Container/createContainer.js:60-61`             |
| padding lateral a partir de `sm` | `24px` de cada lado (`spacing(3)`) | `Container`                           | `@media (min-width:600px)`        | default MUI 7.0.1 — `@mui/system/esm/Container/createContainer.js:63-66`             |
| `spacing` base do tema           | `8px`                              | `theme.spacing`                       | Base de todo cálculo `spacing(n)` | **sem override no projeto** → default MUI 7.0.1; medido em runtime: `--spacing: 8px` |

> Com `cssVariables` ativado (`frontend/src/theme/theme-config.ts` → `cssVariables`),
> `spacing(n)` é emitido como `calc(n * var(--spacing, 8px))`, e `--spacing` vale `8px`
> (medido em runtime, Chrome 1911×898).

### 2.2 Grid

O projeto **não sobrescreve** `MuiGrid` (não existe chave `MuiGrid` no tema — a lista completa
de 81 chaves está em `FATOS.md` §11).

| Token                          | Valor bruto            | Referência MUI   | Onde é usado                 | Origem                                                         |
| ------------------------------ | ---------------------- | ---------------- | ---------------------------- | -------------------------------------------------------------- |
| número de colunas              | `12`                   | `Grid` `columns` | Todo grid                    | default MUI 7.0.1 — `@mui/system/esm/Grid/createGrid.js:87`    |
| espaçamento (`spacing`)        | `0`                    | `Grid` `spacing` | Todo grid sem prop explícita | default MUI 7.0.1 — `@mui/system/esm/Grid/createGrid.js:94`    |
| `rowSpacing` / `columnSpacing` | herdam `spacing` (`0`) | `Grid`           | —                            | default MUI 7.0.1 — `@mui/system/esm/Grid/createGrid.js:95-96` |
| `direction`                    | `row`                  | `Grid`           | —                            | default MUI 7.0.1 — `@mui/system/esm/Grid/createGrid.js:90`    |
| `wrap`                         | `wrap`                 | `Grid`           | —                            | default MUI 7.0.1 — `@mui/system/esm/Grid/createGrid.js:91`    |

> **Não existe "gutter padrão de grid" neste design system.** Como `spacing` default é `0`,
> todo espaçamento entre colunas é definido caso a caso pelo consumidor (`<Grid container spacing={n}>`),
> onde `n` é multiplicado por `8px`.

O único override relacionado a layout de fluxo é o `Stack`:

| Token        | Valor bruto | Referência MUI          | Origem (arquivo:linha)                           |
| ------------ | ----------- | ----------------------- | ------------------------------------------------ |
| `useFlexGap` | `true`      | `MuiStack.defaultProps` | `frontend/src/theme/core/components/stack.tsx:9` |

Isso faz o `Stack` usar `gap` de CSS em vez de margens negativas — relevante porque muda o
comportamento de quebra de linha e de elementos com `margin` próprio.

---

## 3. Estrutura macro do aplicativo

### 3.1 Árvore de elementos (layout de dashboard)

```
<html>                              → font-size: 14px            (update-components.ts:54-57)
 └ <body>                           → recebe TODAS as CSS custom properties de layout
                                       (layout-section.tsx:32-34, via <GlobalStyles>)
    └ <div id="root">               → flex, flex:1 1 auto, min-height:100%, column   (global.css:41-48)
       └ <div id="root__layout" class="minimal__layout__root">        (layout-section.tsx:40-42)
          ├ <div class="minimal__layout__nav__root minimal__layout__nav__vertical">
          │                          → sidebar fixa                   (nav-vertical.tsx:90-96)
          └ <div class="minimal__layout__sidebar__container">         (layout-section.tsx:49)
             ├ <header class="minimal__layout__header">               (header-section.tsx:46-52)
             │   └ Container do header (altura 64px → 72px)           (header-section.tsx:135-143)
             ├ <main class="minimal__layout__main">                   (main-section.tsx:13, :21-25)
             │   └ <div class="minimal__layout__main__content">       (content.tsx:34-36)
             └ footer (atualmente `null`)                             (layout.tsx:256)
```

Quando **não** há sidebar (nav horizontal, layouts de auth, layout simples), o
`minimal__layout__sidebar__container` **não é renderizado** e header/conteúdo/rodapé ficam
diretamente sob `minimal__layout__root` (`frontend/src/layouts/core/layout-section.tsx:46-61`).

### 3.2 Propriedades de flexbox de cada nível

| Elemento                              | Propriedades                                                                    | Origem (arquivo:linha)                                 |
| ------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `body`, `#root`, `#root__layout`      | `display: flex`, `flex: 1 1 auto`, `min-height: 100%`, `flex-direction: column` | `frontend/src/global.css:41-48`                        |
| `minimal__layout__root`               | elemento `div` sem estilo próprio (`styled('div')` vazio)                       | `frontend/src/layouts/core/layout-section.tsx:69`      |
| `minimal__layout__sidebar__container` | `display: flex`, `flex: 1 1 auto`, `flex-direction: column`                     | `frontend/src/layouts/core/layout-section.tsx:71-75`   |
| `minimal__layout__main` (`<main>`)    | `display: flex`, `flex: 1 1 auto`, `flex-direction: column`                     | `frontend/src/layouts/core/main-section.tsx:21-25`     |
| `minimal__layout__main__content`      | `display: flex`, `flex: 1 1 auto`, `flex-direction: column`                     | `frontend/src/layouts/dashboard/content.tsx:39-41`     |
| Container do header                   | `display: flex`, `align-items: center`, `color: var(--color)`                   | `frontend/src/layouts/core/header-section.tsx:138-140` |
| Área central do header                | `display: flex`, `flex: 1 1 auto`, `justify-content: center`                    | `frontend/src/layouts/core/header-section.tsx:145-149` |

---

## 4. CSS custom properties de layout

Todas são aplicadas **no `body`**, por `<GlobalStyles>`, em
`frontend/src/layouts/core/layout-section.tsx:32-34`. A composição é:

```
body {
  ...layoutSectionVars(theme)   ← sempre  (core/css-vars.ts:5-14)
  ...cssVars                    ← por layout
}
```

Para o dashboard, `cssVars` é o merge de três fontes
(`frontend/src/layouts/dashboard/layout.tsx:277`):
`dashboardLayoutVars(theme)` + `dashboardNavColorVars(...).layout` + `cssVars` recebidos por prop.

### 4.1 Definidas por `layoutSectionVars` — valem em **todos** os layouts

| Token                            | Valor bruto                               | Referência MUI                             | Onde é usado                                                                                     | Origem (arquivo:linha)                     |
| -------------------------------- | ----------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| `--layout-nav-zIndex`            | `1201` (`zIndex.drawer + 1` = `1200 + 1`) | `zIndex.drawer = 1200` (default MUI 7.0.1) | z-index da sidebar fixa (`nav-vertical.tsx:124`)                                                 | `frontend/src/layouts/core/css-vars.ts:7`  |
| `--layout-nav-mobile-width`      | `288px`                                   | —                                          | Largura da gaveta de nav mobile (`nav-mobile.tsx:58`)                                            | `frontend/src/layouts/core/css-vars.ts:8`  |
| `--layout-header-blur`           | `8px`                                     | —                                          | `backdrop-filter` da faixa de nav horizontal (`nav-horizontal.tsx:57-58`) — **único consumidor** | `frontend/src/layouts/core/css-vars.ts:9`  |
| `--layout-header-zIndex`         | `1101` (`zIndex.appBar + 1` = `1100 + 1`) | `zIndex.appBar = 1100` (default MUI 7.0.1) | z-index do header (`header-section.tsx:129`)                                                     | `frontend/src/layouts/core/css-vars.ts:10` |
| `--layout-header-mobile-height`  | `64px`                                    | —                                          | Altura do header abaixo de `layoutQuery` (`header-section.tsx:141`)                              | `frontend/src/layouts/core/css-vars.ts:11` |
| `--layout-header-desktop-height` | `72px`                                    | —                                          | Altura do header a partir de `layoutQuery` (`header-section.tsx:142`)                            | `frontend/src/layouts/core/css-vars.ts:12` |

### 4.2 Definidas por `dashboardLayoutVars` — só no layout de dashboard

| Token                            | Valor bruto           | Referência MUI  | Onde é usado                                                                  | Origem (arquivo:linha)                          |
| -------------------------------- | --------------------- | --------------- | ----------------------------------------------------------------------------- | ----------------------------------------------- |
| `--layout-transition-easing`     | `linear`              | —               | Easing das transições de nav (`nav-vertical.tsx:129`, `layout.tsx:284`)       | `frontend/src/layouts/dashboard/css-vars.ts:12` |
| `--layout-transition-duration`   | `120ms`               | —               | Duração das transições de nav (`nav-vertical.tsx:130`, `layout.tsx:285`)      | `frontend/src/layouts/dashboard/css-vars.ts:13` |
| `--layout-nav-mini-width`        | `88px`                | —               | Largura da sidebar mini e `padding-left` correspondente                       | `frontend/src/layouts/dashboard/css-vars.ts:14` |
| `--layout-nav-vertical-width`    | `300px`               | —               | Largura da sidebar vertical e `padding-left` correspondente                   | `frontend/src/layouts/dashboard/css-vars.ts:15` |
| `--layout-nav-horizontal-height` | `64px`                | —               | Altura da faixa de nav horizontal (`nav-horizontal.tsx:55`, `layout.tsx:159`) | `frontend/src/layouts/dashboard/css-vars.ts:16` |
| `--layout-dashboard-content-pt`  | `8px` (`spacing(1)`)  | `theme.spacing` | `padding-top` do conteúdo (`content.tsx:42`)                                  | `frontend/src/layouts/dashboard/css-vars.ts:17` |
| `--layout-dashboard-content-pb`  | `64px` (`spacing(8)`) | `theme.spacing` | `padding-bottom` do conteúdo (`content.tsx:43`)                               | `frontend/src/layouts/dashboard/css-vars.ts:18` |
| `--layout-dashboard-content-px`  | `40px` (`spacing(5)`) | `theme.spacing` | `padding` lateral do conteúdo, **só a partir de `lg`** (`content.tsx:45`)     | `frontend/src/layouts/dashboard/css-vars.ts:19` |

### 4.3 Definidas por `dashboardNavColorVars` — modo `integrate` (default)

`defaultSettings.navColor === 'integrate'`
(`frontend/src/components/settings/settings-config.ts:16`).

| Token                               | Valor bruto (light)            | Valor bruto (dark)             | Referência MUI                           | Origem (arquivo:linha)                                                 |
| ----------------------------------- | ------------------------------ | ------------------------------ | ---------------------------------------- | ---------------------------------------------------------------------- |
| `--layout-nav-bg`                   | `#FFFFFF` / `rgb(255 255 255)` | `#141A21` / `rgb(20 26 33)`    | `palette.background.default`             | `frontend/src/layouts/dashboard/css-vars.ts:38`                        |
| `--layout-nav-horizontal-bg`        | `rgba(255 255 255 / 0.8)`      | `rgba(20 26 33 / 0.96)`        | `varAlpha(background.defaultChannel, …)` | `frontend/src/layouts/dashboard/css-vars.ts:39` (light) e `:46` (dark) |
| `--layout-nav-border-color`         | `rgba(145 158 171 / 0.12)`     | `rgba(145 158 171 / 0.08)`     | `varAlpha(grey.500Channel, …)`           | `frontend/src/layouts/dashboard/css-vars.ts:40` (light) e `:45` (dark) |
| `--layout-nav-text-primary-color`   | `#1C252E` / `rgb(28 37 46)`    | `#FFFFFF` / `rgb(255 255 255)` | `palette.text.primary`                   | `frontend/src/layouts/dashboard/css-vars.ts:40`                        |
| `--layout-nav-text-secondary-color` | `#637381` / `rgb(99 115 129)`  | `#919EAB` / `rgb(145 158 171)` | `palette.text.secondary`                 | `frontend/src/layouts/dashboard/css-vars.ts:42`                        |
| `--layout-nav-text-disabled-color`  | `#919EAB` / `rgb(145 158 171)` | `#637381` / `rgb(99 115 129)`  | `palette.text.disabled`                  | `frontend/src/layouts/dashboard/css-vars.ts:43`                        |

> Existe um segundo modo, `apparent` (`frontend/src/layouts/dashboard/css-vars.ts:52-84`), com
> fundo escuro sólido (`grey.900` no light, `grey.800` no dark) e borda `transparent`.
> **Ele não é o default** e não está ativo.

### 4.4 Definidas por outros layouts

| Token                                   | Valor bruto | Onde é usado                                               | Origem (arquivo:linha)                                                                                                                                                             |
| --------------------------------------- | ----------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--layout-auth-content-width`           | `420px`     | `max-width` do conteúdo nas telas de autenticação          | `frontend/src/layouts/auth-centered/layout.tsx:133` e `frontend/src/layouts/auth-split/layout.tsx:145` (consumido em `auth-centered/content.tsx:31` e `auth-split/content.tsx:45`) |
| `--layout-simple-content-compact-width` | `448px`     | `max-width` do conteúdo do layout simples em modo compacto | `frontend/src/layouts/simple/layout.tsx:115` (consumido em `frontend/src/layouts/simple/content.tsx:33`)                                                                           |

---

## 5. Comportamento responsivo do layout de dashboard

O ponto de virada é **um só**: `layoutQuery = 'lg'` → `@media (min-width:1200px)`
(`frontend/src/layouts/dashboard/layout.tsx:60`).

### 5.1 Sidebar

| Faixa      | Comportamento                                                                                                      | Origem (arquivo:linha)                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `< 1200px` | Sidebar fixa com `display: none`; navegação vai para uma **gaveta temporária** de `288px` aberta pelo `MenuButton` | `frontend/src/layouts/dashboard/nav-vertical.tsx:121` (`display: 'none'`) · `frontend/src/layouts/dashboard/nav-mobile.tsx:48-63` |
| `≥ 1200px` | Sidebar fixa com `display: flex`                                                                                   | `frontend/src/layouts/dashboard/nav-vertical.tsx:132`                                                                             |

Propriedades da sidebar fixa (independentes de faixa):

| Propriedade        | Valor bruto                                                                                 | Origem (arquivo:linha)                                    |
| ------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `position`         | `fixed`                                                                                     | `frontend/src/layouts/dashboard/nav-vertical.tsx:122`     |
| `top` / `left`     | `0` / `0`                                                                                   | `frontend/src/layouts/dashboard/nav-vertical.tsx:118-119` |
| `height`           | `100%`                                                                                      | `frontend/src/layouts/dashboard/nav-vertical.tsx:120`     |
| `flex-direction`   | `column`                                                                                    | `frontend/src/layouts/dashboard/nav-vertical.tsx:123`     |
| `z-index`          | `var(--layout-nav-zIndex)` = `1201`                                                         | `frontend/src/layouts/dashboard/nav-vertical.tsx:124`     |
| `background-color` | `var(--layout-nav-bg)` = `#FFFFFF` (light)                                                  | `frontend/src/layouts/dashboard/nav-vertical.tsx:125`     |
| `width`            | `var(--layout-nav-mini-width)` (`88px`) **ou** `var(--layout-nav-vertical-width)` (`300px`) | `frontend/src/layouts/dashboard/nav-vertical.tsx:126`     |
| `border-right`     | `1px solid var(--layout-nav-border-color, rgba(145 158 171 / 0.12))`                        | `frontend/src/layouts/dashboard/nav-vertical.tsx:127`     |
| `transition`       | `width 120ms linear`                                                                        | `frontend/src/layouts/dashboard/nav-vertical.tsx:128-131` |

### 5.2 Compensação de espaço do conteúdo

Como a sidebar é `position: fixed`, ela **não ocupa espaço no fluxo**. A compensação é feita com
`padding-left` no contêiner irmão, **apenas a partir de `lg`**:

| Token                         | Valor bruto                                  | Referência MUI                                                                   | Onde é usado                                                                 | Origem (arquivo:linha)                                                                                   |
| ----------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `padding-left` (nav vertical) | `var(--layout-nav-vertical-width)` = `300px` | —                                                                                | `.minimal__layout__sidebar__container` dentro de `@media (min-width:1200px)` | `frontend/src/layouts/dashboard/layout.tsx:280-282`                                                      |
| `padding-left` (nav mini)     | `var(--layout-nav-mini-width)` = `88px`      | —                                                                                | idem                                                                         | `frontend/src/layouts/dashboard/layout.tsx:282`                                                          |
| `transition`                  | `padding-left 120ms linear`                  | `transitions.create(['padding-left'])` com easing/duração vindos de variável CSS | idem                                                                         | `frontend/src/layouts/dashboard/layout.tsx:283-286` + `frontend/src/layouts/dashboard/css-vars.ts:12-13` |

Abaixo de `1200px` **não há `padding-left`** — a sidebar está oculta, então não há o que compensar.

### 5.3 Botão de menu (hambúrguer)

| Faixa      | Comportamento   | Origem (arquivo:linha)                          |
| ---------- | --------------- | ----------------------------------------------- |
| `< 1200px` | Visível         | (ausência da regra abaixo)                      |
| `≥ 1200px` | `display: none` | `frontend/src/layouts/dashboard/layout.tsx:185` |

Margens do botão: `margin-right: 8px` (`mr: 1`), `margin-left: -8px` (`ml: -1`)
(`frontend/src/layouts/dashboard/layout.tsx:185`).
Ícone do botão: `24px` (`frontend/src/layouts/components/menu-button.tsx:12`).

### 5.4 Padding do conteúdo

| Token                                  | Valor bruto                                     | Faixa em que se aplica                                 | Origem (arquivo:linha)                                                                            |
| -------------------------------------- | ----------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `padding-top`                          | `8px` (`var(--layout-dashboard-content-pt)`)    | Todas                                                  | `frontend/src/layouts/dashboard/content.tsx:42` + `frontend/src/layouts/dashboard/css-vars.ts:17` |
| `padding-bottom`                       | `64px` (`var(--layout-dashboard-content-pb)`)   | Todas                                                  | `frontend/src/layouts/dashboard/content.tsx:43` + `frontend/src/layouts/dashboard/css-vars.ts:18` |
| `padding-left` / `padding-right`       | `40px` (`var(--layout-dashboard-content-px)`)   | **Só `≥ 1200px`**                                      | `frontend/src/layouts/dashboard/content.tsx:44-45`                                                |
| `padding-top` com nav horizontal       | **`40px`** (a variável é redefinida localmente) | Só `≥ 1200px` e só quando `navLayout === 'horizontal'` | `frontend/src/layouts/dashboard/content.tsx:46`                                                   |
| todos os paddings com `disablePadding` | `0` em `xs`, `sm`, `md`, `lg`, `xl`             | Quando o consumidor passa `disablePadding`             | `frontend/src/layouts/dashboard/content.tsx:48-56`                                                |

> Abaixo de `1200px` o conteúdo **não recebe** `padding-left`/`padding-right` do layout. O
> espaçamento lateral que sobra é o **gutter do próprio `Container`**: `16px` até `599.95px`
> e `24px` a partir de `600px` (§2.1).

### 5.5 Largura máxima do conteúdo

| Configuração                                    | Valor de `maxWidth` | Efeito                                                                     | Origem (arquivo:linha)                                                                                     |
| ----------------------------------------------- | ------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `compactLayout: false` (**default do projeto**) | `false`             | **Container sem `max-width`** — o conteúdo ocupa toda a largura disponível | `frontend/src/components/settings/settings-config.ts:17` + `frontend/src/layouts/dashboard/content.tsx:36` |
| `compactLayout: true`                           | `lg`                | `max-width: 1200px` a partir de `@media (min-width:1200px)`                | `frontend/src/layouts/dashboard/content.tsx:25,36`                                                         |

O header usa `maxWidth: false` **sempre**, independente da configuração
(`frontend/src/layouts/dashboard/layout.tsx:154`), e ganha `padding` lateral de `40px`
(`px: { lg: 5 }`) quando a navegação é vertical/mini
(`frontend/src/layouts/dashboard/layout.tsx:156`).

### 5.6 Navegação horizontal

Quando `navLayout === 'horizontal'`:

| Aspecto                       | Comportamento                                                   | Origem (arquivo:linha)                                    |
| ----------------------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| Sidebar                       | **Não é renderizada** (`sidebarSection = null`)                 | `frontend/src/layouts/dashboard/layout.tsx:269`           |
| Faixa de nav                  | Renderizada na área inferior do header                          | `frontend/src/layouts/dashboard/layout.tsx:172-179`       |
| Visibilidade da faixa         | `display: none` em `xs`; `flex` a partir de `lg`                | `frontend/src/layouts/dashboard/nav-horizontal.tsx:35`    |
| Altura do container do header | `var(--layout-nav-horizontal-height)` = `64px` a partir de `lg` | `frontend/src/layouts/dashboard/layout.tsx:159`           |
| Fundo da faixa                | `var(--layout-nav-horizontal-bg)` = `rgba(255 255 255 / 0.8)`   | `frontend/src/layouts/dashboard/nav-horizontal.tsx:56`    |
| Desfoque da faixa             | `blur(var(--layout-header-blur))` = `blur(8px)`                 | `frontend/src/layouts/dashboard/nav-horizontal.tsx:57-58` |
| Borda inferior                | `solid 1px rgba(145 158 171 / 0.08)`                            | `frontend/src/layouts/dashboard/nav-horizontal.tsx:36`    |
| Separador superior tracejado  | `border-style: dashed`, `z-index: 9`, `position: absolute`      | `frontend/src/layouts/dashboard/nav-horizontal.tsx:41-50` |
| Padding lateral da faixa      | `12px` (`px: 1.5`)                                              | `frontend/src/layouts/dashboard/nav-horizontal.tsx:54`    |
| Logo no header                | `display: none`; `inline-flex` a partir de `lg`                 | `frontend/src/layouts/dashboard/layout.tsx:196-203`       |

---

## 6. Header sticky: camadas de fundo e sombra

O header é uma barra `position: sticky` **transparente**, que revela fundo e sombra apenas quando
a página é rolada (estado `isOffset`, vindo do hook `useScrollOffsetTop` —
`frontend/src/layouts/core/header-section.tsx:43`).

| Camada        | Propriedade                                   | Valor bruto                                                                                 | Origem (arquivo:linha)                                                                                                                                                     |
| ------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| raiz          | `position`                                    | `sticky`                                                                                    | `frontend/src/layouts/core/header-section.tsx:47`                                                                                                                          |
| raiz          | `color`                                       | `transparent`                                                                               | `frontend/src/layouts/core/header-section.tsx:48`                                                                                                                          |
| raiz          | `z-index`                                     | `var(--layout-header-zIndex)` = `1101`                                                      | `frontend/src/layouts/core/header-section.tsx:129`                                                                                                                         |
| raiz          | `box-shadow`                                  | `none`                                                                                      | `frontend/src/theme/core/components/appbar.tsx:14`                                                                                                                         |
| raiz (rolado) | `--color`                                     | `var(--offset-color, #1C252E)` — `rgb(28 37 46)` no light                                   | `frontend/src/layouts/core/header-section.tsx:56`                                                                                                                          |
| `::before`    | `backdrop-filter` / `-webkit-backdrop-filter` | `blur(6px)`                                                                                 | mixin `bgBlur`, default `blur = 6` — `frontend/src/theme/core/mixins/background.ts:65,88-89`; chamado sem `blur` em `frontend/src/layouts/core/header-section.tsx:102-104` |
| `::before`    | `background-color`                            | `rgba(255 255 255 / 0.8)` (light) · `rgba(20 26 33 / 0.8)` (dark)                           | `frontend/src/layouts/core/header-section.tsx:103`                                                                                                                         |
| `::before`    | `top` / `left` / `width` / `height`           | `0` / `0` / `100%` / `100%`                                                                 | `frontend/src/layouts/core/header-section.tsx:106-109`                                                                                                                     |
| `::before`    | `z-index`                                     | `-1`                                                                                        | `frontend/src/layouts/core/header-section.tsx:88,110`                                                                                                                      |
| `::before`    | estado padrão                                 | `opacity: 0`, `visibility: hidden`, `position: absolute`                                    | `frontend/src/layouts/core/header-section.tsx:90-94`                                                                                                                       |
| `::before`    | estado rolado                                 | `opacity: 1`, `visibility: visible`                                                         | `frontend/src/layouts/core/header-section.tsx:111`                                                                                                                         |
| `::after`     | `height`                                      | `24px`                                                                                      | `frontend/src/layouts/core/header-section.tsx:119`                                                                                                                         |
| `::after`     | `width`                                       | `calc(100% - 48px)`                                                                         | `frontend/src/layouts/core/header-section.tsx:122`                                                                                                                         |
| `::after`     | `border-radius`                               | `50%`                                                                                       | `frontend/src/layouts/core/header-section.tsx:121`                                                                                                                         |
| `::after`     | `left` / `right` / `bottom` / `margin`        | `0` / `0` / `0` / `auto`                                                                    | `frontend/src/layouts/core/header-section.tsx:116-120`                                                                                                                     |
| `::after`     | `z-index`                                     | `-2`                                                                                        | `frontend/src/layouts/core/header-section.tsx:88,123`                                                                                                                      |
| `::after`     | `box-shadow`                                  | `0 8px 16px 0 rgba(145 158 171 / 0.16)` (token `customShadows.z8`)                          | `frontend/src/layouts/core/header-section.tsx:124`                                                                                                                         |
| `::after`     | estado rolado                                 | `opacity: 0.48`, `visibility: visible`                                                      | `frontend/src/layouts/core/header-section.tsx:125`                                                                                                                         |
| ambas         | `transition`                                  | `opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), visibility 200ms cubic-bezier(0.4, 0, 0.2, 1)` | `frontend/src/layouts/core/header-section.tsx:95-98`                                                                                                                       |

### 6.1 Quando cada camada é suprimida

| Prop               | Efeito                                                                                                 | Origem (arquivo:linha)                             |
| ------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `disableOffset`    | Remove o `::before` (fundo com blur)                                                                   | `frontend/src/layouts/core/header-section.tsx:130` |
| `disableElevation` | Remove o `::after` (sombra)                                                                            | `frontend/src/layouts/core/header-section.tsx:131` |
| no dashboard       | `disableElevation = isNavVertical` → com navegação vertical ou mini, **a sombra do header não existe** | `frontend/src/layouts/dashboard/layout.tsx:231`    |

> ⚠️ **Correção sobre o dossiê**: `FATOS.md` §7.2 registra `blur(8px)` para o `::before` do header.
> O valor real é **`blur(6px)`**, o default do mixin `bgBlur`
> (`frontend/src/theme/core/mixins/background.ts:65`). A variável `--layout-header-blur: 8px`
> é consumida **exclusivamente** por `frontend/src/layouts/dashboard/nav-horizontal.tsx:57-58`
> (verificado por busca global em `frontend/src/`, excluindo os arquivos `*-default-mui`).

---

## 7. Classes CSS do layout

Todas as classes de layout usam o prefixo **`minimal`**, definido em
`frontend/src/theme/theme-config.ts:36` (`classesPrefix: 'minimal'`) e aplicado por
`createClasses` (`frontend/src/theme/create-classes.ts:5-7`), que gera
`` `${classesPrefix}__${className}` ``.

| Classe gerada                         | Chave                            | Aplicada em                                                                | Origem (arquivo:linha)                                                                                          |
| ------------------------------------- | -------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `minimal__layout__root`               | `layoutClasses.root`             | `<div id="root__layout">`                                                  | `frontend/src/layouts/core/classes.ts:6` (aplicada em `layout-section.tsx:42`)                                  |
| `minimal__layout__main`               | `layoutClasses.main`             | `<main>`                                                                   | `frontend/src/layouts/core/classes.ts:7` (aplicada em `main-section.tsx:13`)                                    |
| `minimal__layout__header`             | `layoutClasses.header`           | Raiz do header                                                             | `frontend/src/layouts/core/classes.ts:8` (aplicada em `header-section.tsx:52`)                                  |
| `minimal__layout__nav__root`          | `layoutClasses.nav.root`         | Sidebar fixa, gaveta mobile e faixa horizontal                             | `frontend/src/layouts/core/classes.ts:10`                                                                       |
| `minimal__layout__nav__mobile`        | `layoutClasses.nav.mobile`       | (chave declarada)                                                          | `frontend/src/layouts/core/classes.ts:11`                                                                       |
| `minimal__layout__nav__vertical`      | `layoutClasses.nav.vertical`     | Sidebar fixa (`nav-vertical.tsx:93`) e gaveta mobile (`nav-mobile.tsx:53`) | `frontend/src/layouts/core/classes.ts:12`                                                                       |
| `minimal__layout__nav__horizontal`    | `layoutClasses.nav.horizontal`   | Faixa de nav horizontal (`nav-horizontal.tsx:29`)                          | `frontend/src/layouts/core/classes.ts:13`                                                                       |
| `minimal__layout__main__content`      | `layoutClasses.content`          | Container de conteúdo do dashboard                                         | `frontend/src/layouts/core/classes.ts:15` (aplicada em `content.tsx:35`)                                        |
| `minimal__layout__sidebar__container` | `layoutClasses.sidebarContainer` | Contêiner que recebe o `padding-left` de compensação                       | `frontend/src/layouts/core/classes.ts:16` (aplicada em `layout-section.tsx:49`, estilizada em `layout.tsx:280`) |

> ⚠️ `minimal__layout__nav__mobile` está **declarada** em `classes.ts:11` mas **não é aplicada**
> em nenhum componente ativo: a gaveta mobile usa `nav.root` + `nav.vertical`
> (`frontend/src/layouts/dashboard/nav-mobile.tsx:53`). Verificado por busca em `frontend/src/`.

Além das classes de layout, existe o id fixo `root__layout` no elemento raiz do layout
(`frontend/src/layouts/core/layout-section.tsx:41`), usado pelo CSS global (§8).

---

## 8. CSS global (`frontend/src/global.css`)

O arquivo tem três blocos: importação de fontes, importação de CSS de plugins e a baseline.

### 8.1 Fontes importadas

| Import                                    | Pesos                             | Uso no tema                                                        | Origem (arquivo:linha)         |
| ----------------------------------------- | --------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| `@fontsource-variable/public-sans`        | eixo variável completo            | **Fonte primária** (`themeConfig.fontFamily.primary`)              | `frontend/src/global.css:4`    |
| `@fontsource/barlow/400.css` … `/800.css` | `400`, `500`, `600`, `700`, `800` | **Fonte secundária**, usada em `h1`–`h3`                           | `frontend/src/global.css:6-10` |
| `@fontsource-variable/dm-sans`            | eixo variável                     | **Não usada** pelo tema default (opção do painel de configurações) | `frontend/src/global.css:15`   |
| `@fontsource-variable/inter`              | eixo variável                     | **Não usada** pelo tema default                                    | `frontend/src/global.css:16`   |
| `@fontsource-variable/nunito-sans`        | eixo variável                     | **Não usada** pelo tema default                                    | `frontend/src/global.css:17`   |

### 8.2 CSS de plugins importado

| Import                              | Origem (arquivo:linha)       |
| ----------------------------------- | ---------------------------- |
| `./components/scrollbar/styles.css` | `frontend/src/global.css:23` |
| `./components/map/styles.css`       | `frontend/src/global.css:26` |
| `./components/lightbox/styles.css`  | `frontend/src/global.css:29` |
| `./components/chart/styles.css`     | `frontend/src/global.css:32` |

### 8.3 Baseline

| Seletor                                           | Declarações (valores brutos)                                                    | Origem (arquivo:linha)          |
| ------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------- |
| `html`                                            | `height: 100%`; `-webkit-overflow-scrolling: touch`                             | `frontend/src/global.css:37-40` |
| `body`, `#root`, `#root__layout`                  | `display: flex`; `flex: 1 1 auto`; `min-height: 100%`; `flex-direction: column` | `frontend/src/global.css:41-48` |
| `img`                                             | `max-width: 100%`; `vertical-align: middle`                                     | `frontend/src/global.css:49-52` |
| `ul`                                              | `margin: 0`; `padding: 0`; `list-style-type: none`                              | `frontend/src/global.css:53-57` |
| `input[type='number']`                            | `-moz-appearance: textfield`; `appearance: none`                                | `frontend/src/global.css:58-61` |
| `input[type='number']::-webkit-outer-spin-button` | `margin: 0`; `-webkit-appearance: none`                                         | `frontend/src/global.css:62-65` |
| `input[type='number']::-webkit-inner-spin-button` | `margin: 0`; `-webkit-appearance: none`                                         | `frontend/src/global.css:66-69` |

> `#root` vem do HTML (`frontend/index.html:12`) e `#root__layout` é o id fixo do elemento raiz de
> layout (`frontend/src/layouts/core/layout-section.tsx:41`). A cadeia
> `html(100%) → body(flex/min-height 100%) → #root → #root__layout → main` é o que garante que o
> conteúdo empurre o rodapé para o fim da viewport mesmo em páginas curtas.

### 8.4 CSS global aplicado fora do `global.css`

| Regra                         | Valor bruto                                                                                                                    | Origem (arquivo:linha)                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `html { font-size: … }`       | `14px`                                                                                                                         | `frontend/src/theme/with-settings/update-components.ts:54-57` (via `MuiCssBaseline.styleOverrides`) |
| variáveis de layout no `body` | ver §4                                                                                                                         | `frontend/src/layouts/core/layout-section.tsx:32-34` (via `<GlobalStyles>`)                         |
| barra de rolagem customizada  | `.simplebar-scrollbar::before { background-color: var(--palette-text-disabled) }` (`#919EAB`), opacidade `0.48` quando visível | `frontend/src/components/scrollbar/styles.css`                                                      |
| barra de progresso de rota    | `#nprogress` com `z-index: 9999`, `height: 2.5px`                                                                              | `frontend/src/components/progress-bar/styles.css`                                                   |

---

## 9. Camadas (z-index) relevantes ao layout

Nenhum valor de `zIndex` é sobrescrito pelo projeto — todos são defaults da biblioteca
(confirmado no tema computado).

| Token           | Valor bruto | Referência MUI         | Origem            |
| --------------- | ----------- | ---------------------- | ----------------- |
| `mobileStepper` | `1000`      | `zIndex.mobileStepper` | default MUI 7.0.1 |
| `fab`           | `1050`      | `zIndex.fab`           | default MUI 7.0.1 |
| `speedDial`     | `1050`      | `zIndex.speedDial`     | default MUI 7.0.1 |
| `appBar`        | `1100`      | `zIndex.appBar`        | default MUI 7.0.1 |
| `drawer`        | `1200`      | `zIndex.drawer`        | default MUI 7.0.1 |
| `modal`         | `1300`      | `zIndex.modal`         | default MUI 7.0.1 |
| `snackbar`      | `1400`      | `zIndex.snackbar`      | default MUI 7.0.1 |
| `tooltip`       | `1500`      | `zIndex.tooltip`       | default MUI 7.0.1 |

Derivados e valores ad hoc do layout:

| Uso                                   | Valor bruto                                             | Origem (arquivo:linha)                                 |
| ------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| `--layout-nav-zIndex`                 | `1201` (`drawer + 1`)                                   | `frontend/src/layouts/core/css-vars.ts:7`              |
| `--layout-header-zIndex`              | `1101` (`appBar + 1`)                                   | `frontend/src/layouts/core/css-vars.ts:10`             |
| `::before` do header                  | `-1`                                                    | `frontend/src/layouts/core/header-section.tsx:88,110`  |
| `::after` do header                   | `-2`                                                    | `frontend/src/layouts/core/header-section.tsx:88,123`  |
| separador tracejado da nav horizontal | `9`                                                     | `frontend/src/layouts/dashboard/nav-horizontal.tsx:46` |
| cartão (`MuiCard`)                    | `0` (correção de `overflow: hidden` com raio no Safari) | `frontend/src/theme/core/components/card.tsx:14`       |
| barra de progresso de rota            | `9999`                                                  | `frontend/src/components/progress-bar/styles.css`      |

> ⚠️ A sidebar (`1201`) fica **acima** do header (`1101`). Isso é intencional: a sidebar é
> full-height e precisa cobrir a faixa do header no eixo horizontal que ela ocupa.

---

## 10. Resumo operacional

Para reproduzir o layout do dashboard em qualquer stack, bastam estas regras:

1. Base do `rem`: `html { font-size: 14px }`.
2. Um único breakpoint governa o layout: **`1200px`**.
3. Abaixo de `1200px`: sem sidebar, sem `padding-left`, sem padding lateral do conteúdo,
   botão de menu visível, gaveta temporária de `288px`.
4. A partir de `1200px`: sidebar `fixed` de `300px` (ou `88px` no modo mini), contêiner de conteúdo
   com `padding-left` igual à largura da sidebar, transição de `120ms linear`, conteúdo com
   `40px` de padding lateral.
5. Header: `sticky`, altura `64px` até `1199.95px` e `72px` a partir de `1200px`, fundo e sombra
   só quando rolado.
6. Espaçamento vertical do conteúdo: `8px` no topo (ou `40px` com nav horizontal em `≥1200px`),
   `64px` embaixo.
7. Sem `max-width` no conteúdo (configuração `compactLayout: false`).

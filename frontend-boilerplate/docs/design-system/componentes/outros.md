# Componentes — Demais overrides (Accordion, Timeline, Stepper, TreeItem, List, Stack, Link, AppBar, SvgIcon)

Overrides curtos, mas com efeito estrutural em várias telas. Todos são "ajustes cirúrgicos" sobre o MUI:
poucas linhas cada, sem variantes novas.

> `rem` renderiza a **14px**. `theme.spacing(n)` = `calc(n * var(--spacing))`, `--spacing: 8px`.

---

## Accordion

### Anatomia

```
.MuiAccordion-root   ← Paper · position relative · background-color transparent
  ::before  → linha divisória de 1px acima do item (some no primeiro e nos expandidos)
  ├── .MuiAccordionSummary-root   min-height 48px (expandido: 64px)
  │     padding-left 16px · padding-right 8px
  │     ├── .MuiAccordionSummary-content        margin 12px 0 (expandido: 20px 0)
  │     └── .MuiAccordionSummary-expandIconWrapper  color inherit · rotate 0 → 180deg
  └── .MuiAccordionDetails-root   padding 8px 16px 16px (default MUI)
```

### Variantes e tamanhos

Sem variantes próprias. Props do MUI relevantes: `square`, `disableGutters`, `defaultExpanded`, `disabled`.

### Tabela de estados

| Estado              | Fundo                                                                             | Texto                                                                                             | Borda                                                          | Sombra                                                                                                              | Transição                                                |
| ------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| default (colapsado) | **`transparent`** (override; o MUI usaria `background.paper`)                     | herdado                                                                                           | `::before` = linha de 1px em `rgba(145 158 171 / 0.2)` no topo | **`none`** (`Paper elevation: 0`)                                                                                   | `margin 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`          |
| hover               | transparente (sem estilo próprio no root; o `AccordionSummary` é um `ButtonBase`) | herdado                                                                                           | idem                                                           | nenhuma                                                                                                             | —                                                        |
| **expanded**        | **`#FFFFFF`** (light) / **`#1C252E`** (dark) — `background.paper`                 | herdado                                                                                           | `::before` com `opacity: 0`                                    | **`0 8px 16px 0 rgba(145 158 171 / 0.16)`** (light) / `0 8px 16px 0 rgba(0 0 0 / 0.16)` (dark) — `customShadows.z8` | idem; `margin: 16px 0` (quando `disableGutters` é falso) |
| **disabled**        | **`transparent`** (override; o MUI usaria `action.disabledBackground`)            | `#637381` no `AccordionSummary` (`action.disabled` = `rgba(145 158 171 / 0.8)`), com `opacity: 1` | idem                                                           | nenhuma                                                                                                             | —                                                        |

**`AccordionSummary`**

| Estado       | Fundo        | Texto                                                                                                         | Ícone                                                     | Transição                                                             |
| ------------ | ------------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| default      | transparente | herdado                                                                                                       | `color: inherit` (override; o MUI usaria `action.active`) | `min-height, background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` |
| expandido    | transparente | herdado                                                                                                       | `transform: rotate(180deg)`                               | `transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`                    |
| **disabled** | transparente | **`rgba(145 158 171 / 0.8)`** (`action.disabled`), `opacity: 1`; qualquer `Typography` interno herda essa cor | idem                                                      | —                                                                     |

### Medidas

| Propriedade                     | Valor bruto                                                                                                          | Referência simbólica |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------- |
| root: `background-color`        | `transparent` (expandido: `#FFFFFF` / `#1C252E`)                                                                     | override             |
| root expandido: `border-radius` | **8px**                                                                                                              | `shape.borderRadius` |
| root expandido: `box-shadow`    | `0 8px 16px 0 rgba(145 158 171 / 0.16)`                                                                              | `customShadows.z8`   |
| root expandido: `margin`        | `16px 0` (default MUI, se `disableGutters` for falso)                                                                | default MUI          |
| `::before` (linha)              | `position: absolute`, `left: 0`, `top: -1px`, `right: 0`, `height: 1px`, `background-color: rgba(145 158 171 / 0.2)` | `palette.divider`    |
| summary: `padding-left`         | **16px**                                                                                                             | `theme.spacing(2)`   |
| summary: `padding-right`        | **8px**                                                                                                              | `theme.spacing(1)`   |
| summary: `min-height`           | **48px** (expandido, sem `disableGutters`: **64px**)                                                                 | default MUI          |
| summary content: `margin`       | `12px 0` (expandido: `20px 0`)                                                                                       | default MUI          |
| transições                      | **150ms** (`duration.shortest`) · `cubic-bezier(0.4, 0, 0.2, 1)`                                                     | default MUI          |

### Regras de uso observadas

- O accordion **fechado é invisível** (fundo transparente, sem sombra) — só uma linha fina o separa do
  anterior. Ao abrir, ele "sobe": ganha fundo sólido, raio de 8px e a sombra `z8`.
- `expandIconWrapper: { color: 'inherit' }` faz a seta acompanhar a cor do texto, inclusive no disabled.
- O disabled **não** ganha fundo cinza (o padrão do MUI): mantém transparente e só apaga a cor do texto,
  com `opacity: 1` para não borrar duas vezes.

### Origem

| Fato                                                                                          | Arquivo:linha                                                                                |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| root `background-color: transparent`                                                          | `frontend/src/theme/core/components/accordion.tsx:15`                                        |
| expandido (z8 + radius 8 + `background.paper`)                                                | `frontend/src/theme/core/components/accordion.tsx:16-20`                                     |
| disabled `background-color: transparent`                                                      | `frontend/src/theme/core/components/accordion.tsx:21`                                        |
| summary `padding-left/right`                                                                  | `frontend/src/theme/core/components/accordion.tsx:34-35`                                     |
| summary disabled (`opacity: 1`, `action.disabled`, Typography herda)                          | `frontend/src/theme/core/components/accordion.tsx:36-40`                                     |
| `expandIconWrapper: { color: 'inherit' }`                                                     | `frontend/src/theme/core/components/accordion.tsx:42`                                        |
| base (`::before`, `expanded` margin 16px 0, radius, disabled bg, transições `shortest`)       | default MUI 7.0.1 (`node_modules/@mui/material/Accordion/Accordion.js:55-127`)               |
| base summary (`min-height 48/64`, `padding spacing(0,2)`, content `margin 12/20`, rotate 180) | default MUI 7.0.1 (`node_modules/@mui/material/AccordionSummary/AccordionSummary.js:44-109`) |
| `customShadows.z8`                                                                            | `frontend/src/theme/core/custom-shadows.ts:43`                                               |

---

## TimelineDot e TimelineConnector

Componentes de `@mui/lab` **7.0.0-beta.10**.

### Anatomia

```
.MuiTimelineDot-root        display flex · align-self baseline · padding 4px
                            border-width 2px · border-radius 50% · margin 11.5px 0
                            box-shadow: none        ← override
.MuiTimelineConnector-root  width 2px · flex-grow 1
                            background-color: rgba(145 158 171 / 0.2)   ← override
```

### Variantes e tamanhos

| Componente          | Variantes                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `TimelineDot`       | `variant="filled"` (default) / `"outlined"`; `color`: `grey` (default), `primary`, `secondary`, `error`, `info`, `success`, `warning`, `inherit` |
| `TimelineConnector` | sem variantes                                                                                                                                    |

### Tabela de estados

| Componente / estado                      | Fundo                                                         | Texto | Borda                   | Sombra                                           | Transição |
| ---------------------------------------- | ------------------------------------------------------------- | ----- | ----------------------- | ------------------------------------------------ | --------- |
| `TimelineDot` `filled` · `color="grey"`  | **#C4CDD5** (`grey.400`)                                      | —     | `2px solid transparent` | **`none`** (override; o MUI usaria `shadows[1]`) | nenhuma   |
| `TimelineDot` `filled` · `color="<cor>"` | `<cor>.main`                                                  | —     | `2px solid transparent` | `none`                                           | nenhuma   |
| `TimelineDot` `outlined`                 | **`transparent`**                                             | —     | `2px solid <cor>`       | `none`                                           | nenhuma   |
| `TimelineConnector`                      | **`rgba(145 158 171 / 0.2)`** (o MUI usaria `#C4CDD5` sólido) | —     | nenhuma                 | nenhuma                                          | nenhuma   |

### Medidas

| Propriedade                   | Valor bruto               | Referência simbólica |
| ----------------------------- | ------------------------- | -------------------- |
| dot: `padding`                | **4px**                   | default MUI          |
| dot: `border-width`           | **2px**                   | default MUI          |
| dot: `border-radius`          | **50%**                   | default MUI          |
| dot: `margin`                 | **`11.5px 0`**            | default MUI          |
| dot: `box-shadow`             | **`none`**                | override             |
| dot: `align-self`             | `baseline`                | default MUI          |
| connector: `width`            | **2px**                   | default MUI          |
| connector: `background-color` | `rgba(145 158 171 / 0.2)` | `palette.divider`    |
| connector: `flex-grow`        | `1`                       | default MUI          |

### Regras de uso observadas

- Remover a sombra do dot (`box-shadow: none`) deixa a linha do tempo **plana**, coerente com o resto do
  sistema (nenhum elemento pequeno tem sombra).
- Trocar a cor do conector para `divider` alinha a linha do tempo às demais divisórias do app.

### Origem

| Fato                                                                    | Arquivo:linha                                                                                        |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `MuiTimelineDot.root = { boxShadow: 'none' }`                           | `frontend/src/theme/core/components/timeline.tsx:9`                                                  |
| `MuiTimelineConnector.root = { backgroundColor: divider }`              | `frontend/src/theme/core/components/timeline.tsx:16`                                                 |
| base dot (padding 4, border 2, radius 50%, margin 11.5px, `shadows[1]`) | default MUI lab 7.0.0-beta.10 (`node_modules/@mui/lab/TimelineDot/TimelineDot.js:42-49`)             |
| base connector (width 2, `grey[400]`, flex-grow 1)                      | default MUI lab 7.0.0-beta.10 (`node_modules/@mui/lab/TimelineConnector/TimelineConnector.js:34-36`) |
| `divider = rgba(145 158 171 / 0.2)`                                     | `frontend/src/theme/core/palette.ts:131`                                                             |

---

## StepConnector

### Anatomia

```
.MuiStepConnector-root   flex 1 1 auto  (horizontal) · margin-left 12px (vertical)
└── .MuiStepConnector-line   display block
      border-color: rgba(145 158 171 / 0.2)      ← override
      border-top-width 1px · border-top-style solid   (horizontal)
```

### Variantes e tamanhos

Sem variantes próprias. O MUI diferencia `horizontal` (borda superior) e `vertical` (borda esquerda),
além de `alternativeLabel`.

### Tabela de estados

| Estado                                  | Fundo        | Texto | Borda                                                           | Sombra  | Transição |
| --------------------------------------- | ------------ | ----- | --------------------------------------------------------------- | ------- | --------- |
| default / active / completed / disabled | transparente | —     | **`1px solid rgba(145 158 171 / 0.2)`** em **todos** os estados | nenhuma | nenhuma   |

> O override define `borderColor` no slot `line` **sem** condicionar a estado, então `active` e `completed`
> deixam de ficar coloridos (o MUI usaria `primary.main` nesses casos). ⚠️ **NÃO CONFIRMADO**: o resultado
> visual em `active`/`completed` não foi medido em runtime — a leitura vem apenas da ordem dos estilos
> (override do tema aplicado depois das variantes do MUI).

### Medidas

| Propriedade                                          | Valor bruto               | Referência simbólica |
| ---------------------------------------------------- | ------------------------- | -------------------- |
| `border-color` da linha                              | `rgba(145 158 171 / 0.2)` | `palette.divider`    |
| `border-top-width` / `border-top-style` (horizontal) | `1px` / `solid`           | default MUI          |
| root: `flex`                                         | `1 1 auto`                | default MUI          |
| root (vertical): `margin-left`                       | `12px` (metade do ícone)  | default MUI          |

### Origem

| Fato                                                                             | Arquivo:linha                                                                         |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `line: { borderColor: divider }`                                                 | `frontend/src/theme/core/components/stepper.tsx:9`                                    |
| base (flex 1 1 auto, marginLeft 12, borderTop 1px solid, `StepConnector.border`) | default MUI 7.0.1 (`node_modules/@mui/material/StepConnector/StepConnector.js:47-89`) |

---

## TreeItem

Componente de `@mui/x-tree-view` **7.28.1**.

### Anatomia

```
.MuiTreeItem-root  <li>   list-style none · margin 0 · padding 0 · outline 0
└── .MuiTreeItem-content   padding 4px 8px · border-radius 8px · width 100%
      display flex · align-items center · gap 8px · cursor pointer
      ├── .MuiTreeItem-iconContainer   width auto   ← override (MUI: 16px)
      │      svg → font-size 18px
      ├── .MuiTreeItem-label           body2        ← override (MUI: body1)
      └── [.MuiTreeItem-checkbox]      padding 0
└── .MuiTreeItem-groupTransition  padding-left var(--TreeView-itemChildrenIndentation)
```

### Variantes e tamanhos

Sem variantes próprias.

### Tabela de estados

| Estado                         | Fundo                                                                  | Texto                                                               | Borda   | Sombra  | Transição |
| ------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------- | ------- | ------- | --------- |
| default                        | transparente                                                           | herdado, `body2` → **12,25px**, weight 400, line-height **19,25px** | nenhuma | nenhuma | nenhuma   |
| hover                          | **`rgba(145 158 171 / 0.08)`**                                         | idem                                                                | nenhuma | nenhuma | —         |
| hover (`@media (hover: none)`) | `transparent`                                                          | idem                                                                | —       | —       | —         |
| focused                        | **`rgba(145 158 171 / 0.24)`**                                         | idem                                                                | nenhuma | nenhuma | —         |
| selected                       | **`rgba(0 167 111 / 0.08)`** (light) / `rgba(0 167 111 / 0.16)` (dark) | idem                                                                | nenhuma | nenhuma | —         |
| selected + hover               | `rgba(0 167 111 / calc(0.08 + 0.08))` (light)                          | idem                                                                | nenhuma | nenhuma | —         |
| selected + focused             | `rgba(0 167 111 / calc(0.08 + 0.12))` (light)                          | idem                                                                | nenhuma | nenhuma | —         |
| disabled                       | `transparent`                                                          | `opacity: 0.48`                                                     | nenhuma | nenhuma | —         |

### Medidas

| Propriedade              | Valor bruto                                                                          | Referência simbólica                                       |
| ------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| label: tipografia        | `0.875rem` = **12,25px**, weight 400, line-height `1.5714285714285714` → **19,25px** | `typography.body2` (override; o MUI usaria `body1` = 14px) |
| `iconContainer`: `width` | **`auto`** (o MUI usaria `16px`)                                                     | override                                                   |
| `iconContainer` svg      | `font-size: 18px`                                                                    | default MUI X                                              |
| content: `padding`       | **`4px 8px`**                                                                        | `theme.spacing(0.5, 1)`                                    |
| content: `border-radius` | **8px**                                                                              | `shape.borderRadius`                                       |
| content: `gap`           | **8px**                                                                              | `theme.spacing(1)`                                         |
| checkbox interno         | `padding: 0`                                                                         | default MUI X                                              |

### Regras de uso observadas

- As duas únicas mudanças (label em `body2` e `iconContainer` com largura automática) tornam a árvore mais
  compacta e permitem ícones de largura variável.
- A seleção continua **verde** (base `primary.main`), diferente do `MenuItem` e da `TableRow`, que foram
  neutralizados.

### Origem

| Fato                                                                                              | Arquivo:linha                                                                                   |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `label: { ...typography.body2 }`                                                                  | `frontend/src/theme/core/components/mui-x-tree-view.tsx:10`                                     |
| `iconContainer: { width: 'auto' }`                                                                | `frontend/src/theme/core/components/mui-x-tree-view.tsx:11`                                     |
| base (padding, radius, gap, hover/focused/selected/disabled, `iconContainer` 16px, label `body1`) | default MUI X 7.28.1 (`node_modules/@mui/x-tree-view/TreeItem/TreeItem.js:80-137`)              |
| `action.selectedOpacity` 0.08 (light) / 0.16 (dark)                                               | tema computado (`frontend/.ds-extract/theme.json` → `computed.paletteLight/paletteDark.action`) |

---

## ListItemIcon, ListItemAvatar e ListItemText

### Anatomia

```
.MuiListItem-root / .MuiMenuItem-root
├── .MuiListItemIcon-root    min-width auto · margin-right 16px · color inherit
├── .MuiListItemAvatar-root  min-width auto · margin-right 16px
└── .MuiListItemText-root    margin 0
    ├── .MuiListItemText-primary    → Typography variant="subtitle2"
    └── .MuiListItemText-secondary  → <span>
```

### Variantes e tamanhos

Sem variantes. `ListItemText` recebe `slotProps` fixos:

| Slot        | Valor                     |
| ----------- | ------------------------- |
| `primary`   | `typography: 'subtitle2'` |
| `secondary` | `component: 'span'`       |

### Tabela de estados

Nenhum dos três tem estados próprios — herdam do item de lista/menu que os contém.

| Estado                             | Fundo        | Texto                                                                                   | Borda   | Sombra  | Transição |
| ---------------------------------- | ------------ | --------------------------------------------------------------------------------------- | ------- | ------- | --------- |
| default (`ListItemIcon`)           | transparente | **`inherit`** (o MUI usaria `action.active` = `#637381`)                                | nenhuma | nenhuma | nenhuma   |
| default (`ListItemText` primary)   | transparente | `subtitle2` → **12,25px**, weight **600**, line-height `1.5714285714285714`             | nenhuma | nenhuma | nenhuma   |
| default (`ListItemText` secondary) | transparente | `body2` (default do MUI para o slot) → **12,25px**, weight 400, `color: text.secondary` | nenhuma | nenhuma | nenhuma   |

### Medidas

| Componente                 | Propriedade               | Valor bruto                           | Referência simbólica |
| -------------------------- | ------------------------- | ------------------------------------- | -------------------- |
| `ListItemIcon`             | `min-width`               | **`auto`** (MUI: 56px)                | override             |
| `ListItemIcon`             | `margin-right`            | **16px**                              | `theme.spacing(2)`   |
| `ListItemIcon`             | `color`                   | **`inherit`**                         | override             |
| `ListItemIcon`             | `display` / `flex-shrink` | `inline-flex` / `0`                   | default MUI          |
| `ListItemAvatar`           | `min-width`               | **`auto`** (MUI: 56px)                | override             |
| `ListItemAvatar`           | `margin-right`            | **16px**                              | `theme.spacing(2)`   |
| `ListItemText`             | `margin`                  | **0** (MUI: `margin-top/bottom: 4px`) | override             |
| `ListItemText` (multiline) | `margin`                  | **0** (MUI: `6px`)                    | override             |
| `ListItemText`             | `flex` / `min-width`      | `1 1 auto` / `0`                      | default MUI          |

> Dentro de um `MenuItem`, o `ListItemIcon` recebe `min-width: 36px` pela regra do próprio MenuItem
> (default MUI), que tem especificidade maior que o `min-width: auto` deste override.
> ⚠️ **NÃO CONFIRMADO** em runtime (leitura de código apenas).

### Regras de uso observadas

- Zerar `min-width` e usar `margin-right: 16px` troca o alinhamento em grade fixa (56px do Material) por um
  alinhamento por **espaçamento real** — listas ficam mais densas.
- `primary` em `subtitle2` (weight 600) e `secondary` como `<span>` produzem o padrão "título forte +
  legenda" usado em notificações, contas e listas do app.

### Origem

| Fato                                                               | Arquivo:linha                                                                           |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `MuiListItemIcon` (color inherit, min-width auto, margin-right 16) | `frontend/src/theme/core/components/list.tsx:9-11`                                      |
| `MuiListItemAvatar` (min-width auto, margin-right 16)              | `frontend/src/theme/core/components/list.tsx:20`                                        |
| `MuiListItemText` slotProps (`subtitle2` / `span`)                 | `frontend/src/theme/core/components/list.tsx:29-34`                                     |
| `MuiListItemText` (`margin: 0`, `multiline: margin 0`)             | `frontend/src/theme/core/components/list.tsx:39`                                        |
| base `ListItemIcon` (min-width 56, `action.active`)                | default MUI 7.0.1 (`node_modules/@mui/material/ListItemIcon/ListItemIcon.js:42-45`)     |
| base `ListItemAvatar` (min-width 56)                               | default MUI 7.0.1 (`node_modules/@mui/material/ListItemAvatar/ListItemAvatar.js:39-40`) |
| base `ListItemText` (`margin-top/bottom 4`, multiline `6`)         | default MUI 7.0.1 (`node_modules/@mui/material/ListItemText/ListItemText.js:50-66`)     |
| `ListItemIcon` dentro de MenuItem (36px)                           | default MUI 7.0.1 (`node_modules/@mui/material/MenuItem/MenuItem.js:113-115`)           |

---

## Stack

### Anatomia

Componente de layout puro — sem elementos internos.

### Variantes e tamanhos

Sem variantes. O override altera **apenas** um default prop.

| Prop         | Valor do projeto | Valor do MUI |
| ------------ | ---------------- | ------------ |
| `useFlexGap` | **`true`**       | `false`      |

`styleOverrides` está **vazio** (`{}`).

### Tabela de estados

| Estado  | Fundo        | Texto   | Borda   | Sombra  | Transição |
| ------- | ------------ | ------- | ------- | ------- | --------- |
| default | transparente | herdado | nenhuma | nenhuma | nenhuma   |

### Medidas

| Propriedade            | Valor bruto                                                                       |
| ---------------------- | --------------------------------------------------------------------------------- |
| espaçamento            | quando `spacing={n}` → **`gap: calc(n × 8px)`** (por causa de `useFlexGap: true`) |
| sem `useFlexGap` (MUI) | seria `margin-top`/`margin-left` no seletor `& > :not(style) ~ :not(style)`       |

### Regras de uso observadas

- `useFlexGap: true` é a diferença mais impactante deste arquivo: o espaçamento passa a ser `gap` real do
  Flexbox, o que **funciona com `flex-wrap`** (margens negativas do MUI clássico quebram ao quebrar linha).
- Como consequência, `Stack` com `spacing` e `flexWrap="wrap"` espaça corretamente nas duas direções.

### Origem

| Fato                                 | Arquivo:linha                                     |
| ------------------------------------ | ------------------------------------------------- |
| `defaultProps: { useFlexGap: true }` | `frontend/src/theme/core/components/stack.tsx:9`  |
| `styleOverrides: {}`                 | `frontend/src/theme/core/components/stack.tsx:14` |
| `spacing` = 8px (sem override)       | default MUI (`.ds-extract/FATOS.md` §5.1)         |

---

## Link

### Anatomia

```
.MuiLink-root   ← Typography
  text-decoration: none  →  underline no hover
```

### Variantes e tamanhos

| Prop        | Valor do projeto | Valor do MUI |
| ----------- | ---------------- | ------------ |
| `underline` | **`hover`**      | `always`     |

`styleOverrides` está **vazio** (`{}`).

| Valor de `underline`             | Comportamento                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `none`                           | `text-decoration: none` sempre                                                    |
| **`hover`** (default do projeto) | `text-decoration: none`; **`underline` no `:hover`**                              |
| `always`                         | `text-decoration: underline`; `text-decoration-color: var(--Link-underlineColor)` |

### Tabela de estados

| Estado                                 | Fundo        | Texto                                          | Sublinhado                                                  | Sombra  | Transição                                  |
| -------------------------------------- | ------------ | ---------------------------------------------- | ----------------------------------------------------------- | ------- | ------------------------------------------ |
| default                                | transparente | `color` da prop (`primary` é o default do MUI) | **nenhum**                                                  | nenhuma | nenhuma                                    |
| hover                                  | transparente | idem                                           | **`underline`**                                             | nenhuma | nenhuma                                    |
| focus-visible (`component="button"`)   | transparente | idem                                           | conforme `underline`                                        | nenhuma | `-webkit-tap-highlight-color: transparent` |
| `underline="always"` + `color="<cor>"` | transparente | `<cor>.main`                                   | `underline` com `text-decoration-color: rgba(<main> / 0.4)` | nenhuma | nenhuma                                    |

### Medidas

| Propriedade                                           | Valor bruto                                                                                                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| tipografia                                            | herdada do `Typography` (`variant` da prop; sem variante → `body1` = **14px**)                                                                        |
| `--Link-underlineColor` (quando `underline="always"`) | `rgba(<cor.main> / 0.4)`; para `color="textPrimary"` → `rgba(28 37 46 / 0.4)`; `textSecondary` → `rgba(99 115 129 / 0.4)`; `textDisabled` → `#919EAB` |

### Regras de uso observadas

- Links do sistema são **discretos**: sem sublinhado em repouso, sublinhando só no hover. Vale para
  breadcrumbs, links de tabela e links de texto corrido.
- O `BackLink` do `CustomBreadcrumbs` sobrescreve isso com `underline="none"` (nunca sublinha).

### Origem

| Fato                                                          | Arquivo:linha                                                        |
| ------------------------------------------------------------- | -------------------------------------------------------------------- |
| `defaultProps: { underline: 'hover' }`                        | `frontend/src/theme/core/components/link.tsx:9`                      |
| `styleOverrides: {}`                                          | `frontend/src/theme/core/components/link.tsx:14`                     |
| base (`underline` none/hover/always, `--Link-underlineColor`) | default MUI 7.0.1 (`node_modules/@mui/material/Link/Link.js:62-127`) |
| `BackLink` com `underline="none"`                             | `frontend/src/components/custom-breadcrumbs/back-link.tsx:20`        |

---

## AppBar

### Anatomia

```
.MuiAppBar-root   ← Paper
  display flex · flex-direction column · width 100% · box-sizing border-box · flex-shrink 0
  color: transparent · box-shadow: none
  position: fixed (default MUI)
```

### Variantes e tamanhos

| Prop       | Valor do projeto       | Valor do MUI |
| ---------- | ---------------------- | ------------ |
| `color`    | **`transparent`**      | `primary`    |
| `position` | `fixed` (não alterado) | `fixed`      |

### Tabela de estados

| Estado                              | Fundo                 | Texto     | Borda   | Sombra                                             | Transição                                                                |
| ----------------------------------- | --------------------- | --------- | ------- | -------------------------------------------------- | ------------------------------------------------------------------------ |
| default                             | **`transparent`**     | `inherit` | nenhuma | **`none`**                                         | `box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` (herdada de `Paper`) |
| com rolagem (`isOffset`, no layout) | ver observação abaixo | idem      | nenhuma | `none` no elemento; a "sombra" vem de um `::after` | `opacity, visibility 200ms cubic-bezier(0.4, 0, 0.2, 1)`                 |

**Medido em runtime**: `height: 72px`, `box-shadow: none`, `background: transparent`,
`transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)`.

### Medidas

| Propriedade                                          | Valor bruto                            | Referência simbólica                                               |
| ---------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| `color` (prop)                                       | `transparent`                          | override                                                           |
| `box-shadow`                                         | `none`                                 | override                                                           |
| `display` / `flex-direction` / `width`               | `flex` / `column` / `100%`             | default MUI                                                        |
| `flex-shrink` / `box-sizing`                         | `0` / `border-box`                     | default MUI                                                        |
| `z-index` (`position="fixed"`/`sticky"`/`absolute"`) | **1100**                               | `zIndex.appBar`                                                    |
| altura efetiva no layout                             | **64px** (mobile) → **72px** (desktop) | `--layout-header-mobile-height` / `--layout-header-desktop-height` |

### Regras de uso observadas

- O `AppBar` é **apenas estrutura**: cor e sombra são desenhadas pelo `HeaderSection` do layout, em
  pseudoelementos:
  - `::before` — fundo com `backdrop-filter: blur(8px)` + `rgba(255 255 255 / 0.8)`, com `opacity 0 → 1`
    quando a página rola;
  - `::after` — "sombra" de `height: 24px`, `width: calc(100% - 48px)`, `border-radius: 50%`,
    `box-shadow: var(--customShadows-z8)`, `opacity: 0.48` quando rolado.
- Isso permite um header translúcido que só ganha peso visual ao rolar.

### Origem

| Fato                                                                                                         | Arquivo:linha                                                           |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `defaultProps: { color: 'transparent' }`                                                                     | `frontend/src/theme/core/components/appbar.tsx:9`                       |
| `root: { boxShadow: 'none' }`                                                                                | `frontend/src/theme/core/components/appbar.tsx:14`                      |
| base (flex, width, box-sizing, `zIndex.appBar`)                                                              | default MUI 7.0.1 (`node_modules/@mui/material/AppBar/AppBar.js:49-87`) |
| `HeaderSection` (`::before` blur, `::after` sombra, alturas)                                                 | `frontend/src/layouts/core/header-section.tsx:76-149`                   |
| `--layout-header-mobile-height: 64px` / `--layout-header-desktop-height: 72px` / `--layout-header-blur: 8px` | `frontend/src/layouts/core/css-vars.ts:5-14`                            |
| medição em runtime (72px, sem sombra)                                                                        | `frontend/.ds-extract/FATOS.md` §7.2 e §10.4                            |

---

## SvgIcon

### Anatomia

```
.MuiSvgIcon-root  <svg>
  user-select none · width 1em · height 1em · display inline-block · flex-shrink 0
  fill currentColor · font-size conforme o tamanho
```

### Variantes e tamanhos

| `fontSize`         | Valor bruto                            | Referência simbólica | Origem                                                        |
| ------------------ | -------------------------------------- | -------------------- | ------------------------------------------------------------- |
| `inherit`          | herda o contexto                       | —                    | default MUI                                                   |
| `small`            | `1.25rem` = **17,5px**                 | `pxToRem(20)`        | default MUI                                                   |
| `medium` (default) | `1.5rem` = **21px** (medido: 21×21px)  | `pxToRem(24)`        | default MUI                                                   |
| **`large`**        | **32 × 32px** com `font-size: inherit` | —                    | **override do projeto** (o MUI usaria `2.1875rem` = 30,625px) |

| `color`                                           | Resultado                       |
| ------------------------------------------------- | ------------------------------- |
| `inherit` (default)                               | `color: inherit`                |
| `primary`/`secondary`/`action`/`error`/`disabled` | cores do MUI (não sobrescritas) |

### Tabela de estados

| Estado  | Fundo        | Cor                   | Borda   | Sombra  | Transição                                                              |
| ------- | ------------ | --------------------- | ------- | ------- | ---------------------------------------------------------------------- |
| default | transparente | `currentColor` (fill) | nenhuma | nenhuma | **`fill 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`** (duration `shorter`) |

### Medidas

| Propriedade                               | Valor bruto                                             | Referência simbólica   |
| ----------------------------------------- | ------------------------------------------------------- | ---------------------- |
| `width` / `height`                        | `1em` / `1em` (exceto `fontSizeLarge`: **32px / 32px**) | default MUI / override |
| `fontSizeLarge`: `font-size`              | `inherit`                                               | override               |
| `display` / `flex-shrink` / `user-select` | `inline-block` / `0` / `none`                           | default MUI            |
| `fill`                                    | `currentColor`                                          | default MUI            |
| `transition`                              | `fill` · **200ms** · `cubic-bezier(0.4, 0, 0.2, 1)`     | `duration.shorter`     |

### Regras de uso observadas

- O único ajuste é o `fontSizeLarge`, que passa a ser **32×32px fixos** (medida absoluta) em vez de escalar
  com a fonte. Como `font-size: inherit`, o `1em` deixa de definir o tamanho.
- A maior parte dos ícones do app **não** usa `SvgIcon` diretamente: usa o wrapper `Iconify`, cujo tamanho
  padrão é **20px** (`width = 20`, `height = height ?? width`, `flex-shrink: 0`, `display: inline-flex`).

### Origem

| Fato                                                                             | Arquivo:linha                                                             |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `fontSizeLarge: { width: 32, height: 32, fontSize: 'inherit' }`                  | `frontend/src/theme/core/components/svg-icon.tsx:9`                       |
| base (`1em`, `fill currentColor`, transição `fill`, tamanhos small/medium/large) | default MUI 7.0.1 (`node_modules/@mui/material/SvgIcon/SvgIcon.js:43-84`) |
| `Iconify` width default 20px                                                     | `frontend/src/components/iconify/iconify.tsx:21`, `:44-46`                |
| medição `fontSizeMedium` = 21×21px                                               | `frontend/.ds-extract/FATOS.md` §9                                        |

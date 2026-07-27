# Componentes — Navegação secundária: Tabs, Breadcrumbs e Pagination

> `rem` renderiza a **14px**. `theme.spacing(n)` = `calc(n * var(--spacing))`, `--spacing: 8px`.

---

## Tabs

### Anatomia

```
.MuiTabs-root            overflow hidden · min-height 48px · display flex
└── .MuiTabs-scroller    position relative · flex 1 1 auto · white-space nowrap
    ├── .MuiTabs-list    display flex · gap 24px (→ 40px em ≥600px)
    │   ├── .MuiTab-root  min-width 48px · min-height 48px · padding 8px 0
    │   └── …
    └── .MuiTabs-indicator  position absolute · bottom 0 · height 2px · width 100%
                            background-color: currentColor
```

### Variantes e tamanhos

**Defaults do projeto** (diferentes do MUI):

| Prop                       | Valor do projeto                                      | Valor do MUI |
| -------------------------- | ----------------------------------------------------- | ------------ |
| `textColor`                | **`inherit`**                                         | `primary`    |
| `variant`                  | **`scrollable`**                                      | `standard`   |
| `allowScrollButtonsMobile` | **`true`**                                            | `false`      |
| `indicatorColor`           | `primary` (não alterado — mas sem efeito, ver abaixo) | `primary`    |
| `scrollButtons`            | `auto` (não alterado)                                 | `auto`       |

| Variante                           | `gap` entre tabs                                                 |
| ---------------------------------- | ---------------------------------------------------------------- |
| `scrollable` (default), `standard` | **24px**; **40px** a partir de `@media (min-width:600px)`        |
| `fullWidth`                        | **sem gap** (a regra é condicionada a `variant !== 'fullWidth'`) |

`Tab` tem os modificadores `disabled`, `wrapped`, `icon` + `label`, `iconPosition`
(`start` é o default do projeto).

### Tabela de estados — `Tab`

| Estado            | Fundo                                                                                                    | Texto                                                     | Borda   | Sombra  | Transição                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------- | ------- | -------------------------------------------- |
| default           | transparente                                                                                             | `#637381` (rgb(99,115,129)), weight **500**, `opacity: 1` | nenhuma | nenhuma | nenhuma no root                              |
| hover             | transparente (**sem ripple** e sem hover declarado)                                                      | idem                                                      | nenhuma | nenhuma | —                                            |
| focus-visible     | transparente (herda o `.Mui-focusVisible` do ButtonBase, sem cor declarada)                              | idem                                                      | nenhuma | nenhuma | —                                            |
| selected          | transparente                                                                                             | `#1C252E` (rgb(28,37,46)), weight **600**, `opacity: 1`   | nenhuma | nenhuma | —                                            |
| disabled          | transparente                                                                                             | `#637381` com **`opacity: 0.48`**                         | nenhuma | nenhuma | —                                            |
| indicador (barra) | `currentColor` — ou seja, **assume a cor do texto do Tab selecionado**: `#1C252E` light / `#FFFFFF` dark | —                                                         | —       | —       | `all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` |

Cores no dark: default `#919EAB` (`text.secondary`), selected `#FFFFFF` (`text.primary`).

> **`opacity: 1` no root anula a opacidade 0.6** que o MUI aplicaria por causa de `textColor="inherit"`.
> Já o `disabled` continua vindo do MUI (`opacity: action.disabledOpacity = 0.48`), porque tem
> especificidade maior (`&.Mui-disabled`).

### Medidas

**`MuiTabs`**

| Propriedade                       | Valor bruto                                     | Referência simbólica                         |
| --------------------------------- | ----------------------------------------------- | -------------------------------------------- |
| `gap` da lista                    | **24px**; `@media (min-width:600px)` → **40px** | literais                                     |
| `min-height` do root              | **48px**                                        | default MUI                                  |
| `overflow`                        | `hidden`                                        | default MUI                                  |
| indicador: `height`               | **2px**                                         | default MUI                                  |
| indicador: `width`                | `100%`                                          | default MUI                                  |
| indicador: `bottom`               | `0`                                             | default MUI                                  |
| indicador: `background-color`     | **`currentColor`**                              | override do projeto                          |
| indicador: `transition`           | `all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`    | `transitions.create()` (duration `standard`) |
| indicador (orientação `vertical`) | `height: 100%`, `width: 2px`, `right: 0`        | default MUI                                  |

**`MuiTab`**

| Propriedade                                      | Valor bruto                                                                 | Referência simbólica                       |
| ------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------ |
| `min-width`                                      | **48px** (MUI: 90px)                                                        | override                                   |
| `min-height`                                     | **48px** (MUI: 48px; 72px quando tem ícone + label — sobrescrito para 48px) | override                                   |
| `padding`                                        | **`8px 0`** (MUI: `12px 16px`)                                              | `theme.spacing(1, 0)`                      |
| `font-size`                                      | `0.875rem` = **12,25px**                                                    | `typography.button` (herdado)              |
| `font-weight`                                    | **500** (selected: **600**)                                                 | `fontWeightMedium` / `fontWeightSemiBold`  |
| `line-height`                                    | `1.5714285714285714` → **19,25px**                                          | `typography.body2.lineHeight`              |
| `text-transform`                                 | `none`                                                                      | `typography.button.textTransform: 'unset'` |
| `max-width`                                      | **360px**                                                                   | default MUI                                |
| `flex-shrink`                                    | `0`                                                                         | default MUI                                |
| `white-space` / `text-align`                     | `normal` / `center`                                                         | default MUI                                |
| `overflow`                                       | `hidden`                                                                    | default MUI                                |
| `disableRipple`                                  | **`true`**                                                                  | default prop do projeto                    |
| `iconPosition`                                   | **`start`**                                                                 | default prop do projeto                    |
| ícone com `iconPosition="start"`: `margin-right` | **8px**                                                                     | `theme.spacing(1)`                         |
| `wrapped`: `font-size`                           | `0.75rem` = **10,5px**                                                      | `pxToRem(12)`                              |

### Regras de uso observadas

- Tabs do projeto **não têm caixa nem fundo**: são só texto + barra inferior. O `padding: 8px 0` elimina o
  padding horizontal, então **o espaçamento entre tabs é inteiramente o `gap`** (24/40px) — não padding.
- `indicator: currentColor` é a razão de a barra ser **cinza-escuro/branco**, e não verde. O `indicatorColor`
  do MUI fica sem efeito.
- `disableRipple: true` + ausência de estilo de hover tornam a tab **inteiramente estática** até ser
  selecionada; a única transição é a da barra deslizando.
- `variant: 'scrollable'` como default significa que tabs nunca quebram linha: elas rolam horizontalmente.

### Origem

| Fato                                                                               | Arquivo:linha                                                         |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| defaults `textColor/variant/allowScrollButtonsMobile`                              | `frontend/src/theme/core/components/tabs.tsx:11`                      |
| `gap: 24px` / `40px` em `sm` (condicionado a `!== 'fullWidth'`)                    | `frontend/src/theme/core/components/tabs.tsx:17-22`                   |
| `indicator: backgroundColor currentColor`                                          | `frontend/src/theme/core/components/tabs.tsx:23`                      |
| `disableRipple: true`, `iconPosition: 'start'`                                     | `frontend/src/theme/core/components/tabs.tsx:33`                      |
| `opacity/minWidth/minHeight/padding/color/fontWeight/lineHeight`                   | `frontend/src/theme/core/components/tabs.tsx:39-46`                   |
| `selected` (color + weight 600)                                                    | `frontend/src/theme/core/components/tabs.tsx:47-50`                   |
| base Tabs (`minHeight 48`, `overflow hidden`)                                      | default MUI 7.0.1 (`node_modules/@mui/material/Tabs/Tabs.js:110-114`) |
| base indicator (`height 2`, `bottom 0`, `width 100%`, `transition`)                | default MUI 7.0.1 (`node_modules/@mui/material/Tabs/Tabs.js:221-225`) |
| base Tab (`typography.button`, `maxWidth 360`, `minWidth 90`, `padding 12px 16px`) | default MUI 7.0.1 (`node_modules/@mui/material/Tab/Tab.js:55-65`)     |
| base Tab: `textColor: 'inherit'` (opacity 0.6 / selected 1 / disabled 0.48)        | default MUI 7.0.1 (`node_modules/@mui/material/Tab/Tab.js:129-143`)   |
| base Tab: `iconPosition="start"` → ícone `margin-right: spacing(1)`                | default MUI 7.0.1 (`node_modules/@mui/material/Tab/Tab.js:109-118`)   |
| `typography.button` / `body2`                                                      | `frontend/src/theme/core/typography.ts:121-126` / `:106-109`          |

---

## Breadcrumbs (componente MUI)

### Anatomia

```
.MuiBreadcrumbs-root      ← Typography, color="textSecondary"
└── .MuiBreadcrumbs-ol    display flex · flex-wrap wrap · align-items center
                          row-gap 4px · column-gap 16px · padding 0 · margin 0
    ├── .MuiBreadcrumbs-li         display inline-flex · & > * → body2
    ├── .MuiBreadcrumbs-separator  display flex · user-select none · margin 0
    └── …
```

### Variantes e tamanhos

Sem variantes. Props relevantes: `separator` (nó React), `maxItems` (default MUI 8),
`itemsBeforeCollapse` (1), `itemsAfterCollapse` (1).

### Tabela de estados

| Estado    | Fundo        | Texto                                                                | Borda   | Sombra  | Transição |
| --------- | ------------ | -------------------------------------------------------------------- | ------- | ------- | --------- |
| default   | transparente | `#637381` (rgb(99,115,129)) no root; cada item herda ou define a sua | nenhuma | nenhuma | nenhuma   |
| separador | transparente | herdado                                                              | nenhuma | nenhuma | nenhuma   |

Estados de link (hover/disabled) pertencem ao componente próprio `CustomBreadcrumbs` — ver adiante.

### Medidas

| Propriedade                  | Valor bruto                                                                          | Referência simbólica                  |
| ---------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------- |
| `row-gap` da `<ol>`          | **4px**                                                                              | `theme.spacing(0.5)`                  |
| `column-gap` da `<ol>`       | **16px**                                                                             | `theme.spacing(2)`                    |
| `<li>`: `display`            | `inline-flex`                                                                        | override                              |
| `<li> > *`: tipografia       | `0.875rem` = **12,25px**, weight 400, line-height `1.5714285714285714` → **19,25px** | `typography.body2`                    |
| separador: `margin`          | **0** (MUI: `margin-left: 8px; margin-right: 8px`)                                   | override                              |
| `<ol>`: `padding` / `margin` | `0` / `0`                                                                            | default MUI                           |
| cor base do root             | `#637381`                                                                            | `color="textSecondary"` (default MUI) |

### Regras de uso observadas

- O espaçamento entre itens deixa de ser margem do separador (8px+8px do MUI) e passa a ser **`column-gap`
  de 16px** na `<ol>` — mesmo espaçamento total, mas distribuído pelo container. Isso permite que o
  separador seja um ponto de 4px sem margens parasitas.
- `row-gap: 4px` só aparece quando a trilha quebra em várias linhas (`flex-wrap: wrap` do MUI).

### Origem

| Fato                                                            | Arquivo:linha                                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `ol` `rowGap`/`columnGap`                                       | `frontend/src/theme/core/components/breadcrumbs.tsx:10`                           |
| `li` `display: inline-flex` + `& > *` body2                     | `frontend/src/theme/core/components/breadcrumbs.tsx:11`                           |
| `separator: { margin: 0 }`                                      | `frontend/src/theme/core/components/breadcrumbs.tsx:12`                           |
| base `ol` (flex/wrap/padding/margin) e separador (`margin 8px`) | default MUI 7.0.1 (`node_modules/@mui/material/Breadcrumbs/Breadcrumbs.js:48-64`) |
| `color: "textSecondary"` no root                                | default MUI 7.0.1 (`node_modules/@mui/material/Breadcrumbs/Breadcrumbs.js:164`)   |

---

## CustomBreadcrumbs (componente próprio)

Cabeçalho de página completo: título + trilha + ação + links extras. É o bloco que abre praticamente
todas as telas do app.

### Anatomia

```
BreadcrumbsRoot  <div>            display flex · flex-direction column · gap 16px
├── BreadcrumbsContainer <div>    display flex · flex-wrap wrap · gap 16px
│   │                             align-items flex-start · justify-content flex-end
│   ├── BreadcrumbsContent <div>  display flex · flex 1 1 auto · gap 16px · column
│   │   ├── BreadcrumbsHeading <h6>   typography h4 · margin 0 · padding 0 · inline-flex
│   │   │   └── [BackLink]            (quando há backHref)
│   │   └── <Breadcrumbs separator={BreadcrumbsSeparator}>
│   │       └── BreadcrumbsLink …     (ItemRoot + ItemIcon)
│   └── {action}                   (nó livre — botão, etc.)
└── [MoreLinks] <ul>              display flex · column · & > li { display: flex }
```

### Variantes e tamanhos

Sem variantes visuais. Comportamentos controlados por props:

| Prop                                                               | Default | Efeito                                                                                           |
| ------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------ |
| `activeLast`                                                       | `false` | quando `false`, o **último** link fica `disabled` (cor `text.disabled` + `pointer-events: none`) |
| `backHref`                                                         | —       | troca o texto do heading por um `BackLink` com seta                                              |
| `heading` / `links` / `moreLinks` / `action` / `slots.breadcrumbs` | —       | slots de conteúdo                                                                                |

### Tabela de estados — `BreadcrumbsLink`

| Estado                                     | Fundo        | Texto                                                                                       | Borda   | Sombra  | Transição |
| ------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------- | ------- | ------- | --------- |
| default (com `href`)                       | transparente | `#1C252E` (rgb(28,37,46)); sublinhado **no hover** (herdado de `MuiLink underline="hover"`) | nenhuma | nenhuma | nenhuma   |
| hover (com `href`)                         | transparente | `#1C252E` + `text-decoration: underline`                                                    | nenhuma | nenhuma | nenhuma   |
| disabled (último item, `activeLast=false`) | transparente | **`#919EAB`** (rgb(145,158,171)); `cursor: default`; `pointer-events: none`                 | nenhuma | nenhuma | nenhuma   |

### Tabela de estados — `BackLink`

| Estado  | Fundo        | Texto                                                                | Borda   | Sombra  | Transição                                               |
| ------- | ------------ | -------------------------------------------------------------------- | ------- | ------- | ------------------------------------------------------- |
| default | transparente | herdado (`color="inherit"`), **sem** sublinhado (`underline="none"`) | nenhuma | nenhuma | ícone: `opacity 200ms cubic-bezier(0.4, 0, 0.6, 1) 0ms` |
| hover   | transparente | idem                                                                 | nenhuma | nenhuma | ícone vai a **`opacity: 0.48`**                         |

### Medidas

| Elemento                     | Propriedade                       | Valor bruto                                                                                                 | Referência simbólica               |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `BreadcrumbsRoot`            | `gap`                             | **16px**                                                                                                    | `theme.spacing(2)`                 |
| `BreadcrumbsContainer`       | `gap`                             | **16px**                                                                                                    | `theme.spacing(2)`                 |
| `BreadcrumbsContainer`       | `align-items` / `justify-content` | `flex-start` / `flex-end`                                                                                   | —                                  |
| `BreadcrumbsContent`         | `gap`                             | **16px**                                                                                                    | `theme.spacing(2)`                 |
| `BreadcrumbsHeading`         | tipografia                        | `1.25rem` = **17,5px**; `@media (min-width:900px)` → `1.5rem` = **21px**; weight **700**; line-height `1.5` | `typography.h4`                    |
| `BreadcrumbsHeading`         | `margin` / `padding`              | `0` / `0`                                                                                                   | —                                  |
| `BreadcrumbsSeparator`       | tamanho                           | **4px × 4px**, `border-radius: 50%`                                                                         | —                                  |
| `BreadcrumbsSeparator`       | `background-color`                | **`#919EAB`** (rgb(145,158,171))                                                                            | `text.disabled`                    |
| `BreadcrumbsLink` (ItemRoot) | tipografia                        | `0.875rem` = **12,25px**, weight 400, line-height **19,25px**                                               | `typography.body2`                 |
| `BreadcrumbsLink`            | `gap` (ícone↔texto)               | **8px**                                                                                                     | `theme.spacing(1)`                 |
| `BreadcrumbsLink`            | `color`                           | `#1C252E` (disabled: `#919EAB`)                                                                             | `text.primary` / `text.disabled`   |
| `ItemIcon` (primeiro filho)  | tamanho                           | **20px × 20px**                                                                                             | —                                  |
| `BackLink`                   | ícone                             | `eva:arrow-ios-back-fill`, **18px × 18px**                                                                  | `Iconify width={18}`               |
| `BackLink`                   | ícone `transform`                 | `translateY(-2px)`                                                                                          | —                                  |
| `BackLink`                   | ícone `margin-left`               | **−14px** (`xs`); **−18px** a partir de `@media (min-width:900px)`                                          | —                                  |
| `BackLink`                   | ícone `transition`                | `opacity 200ms cubic-bezier(0.4, 0, 0.6, 1) 0ms`                                                            | duration `shorter`, easing `sharp` |
| `MoreLinks`                  | itens                             | `<Link variant="body2" target="_blank" rel="noopener">` → **12,25px**                                       | —                                  |

### Regras de uso observadas

- O separador **não é um caractere** (`/` ou `›`): é um ponto de 4px em `text.disabled`. Combinado com
  `separator: { margin: 0 }` e `column-gap: 16px`, produz `item · 16px · ponto · 16px · item`.
- Todo o bloco funciona em **grade de 16px**: gap do root, do container e do content são todos 16px.
- `justify-content: flex-end` no container empurra o `action` para a direita; o `BreadcrumbsContent`
  (`flex: 1 1 auto`) ocupa o resto.
- O heading é semanticamente um `<h6>` mas visualmente um `h4` — escolha de hierarquia de documento
  independente do tamanho visual.

### Origem

| Fato                                                            | Arquivo:linha                                                                                             |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `BreadcrumbsRoot` (flex column, gap 16px)                       | `frontend/src/components/custom-breadcrumbs/styles.ts:5-9`                                                |
| `BreadcrumbsHeading` (h4, margin/padding 0)                     | `frontend/src/components/custom-breadcrumbs/styles.ts:11-16`                                              |
| `BreadcrumbsContainer`                                          | `frontend/src/components/custom-breadcrumbs/styles.ts:18-24`                                              |
| `BreadcrumbsContent`                                            | `frontend/src/components/custom-breadcrumbs/styles.ts:26-31`                                              |
| `BreadcrumbsSeparator` (4×4px, 50%, text.disabled)              | `frontend/src/components/custom-breadcrumbs/styles.ts:33-38`                                              |
| composição / `activeLast` / separador                           | `frontend/src/components/custom-breadcrumbs/custom-breadcrumbs.tsx:66-79` (`activeLast` em `:55` e `:75`) |
| `BreadcrumbsLink` ItemRoot (body2, gap 8px, cores)              | `frontend/src/components/custom-breadcrumbs/breadcrumb-link.tsx:47-60`                                    |
| `ItemIcon` 20×20                                                | `frontend/src/components/custom-breadcrumbs/breadcrumb-link.tsx:62-69`                                    |
| `BackLink` (ícone 18px, translateY, ml, transition, hover 0.48) | `frontend/src/components/custom-breadcrumbs/back-link.tsx:21-46`                                          |
| `MoreLinks`                                                     | `frontend/src/components/custom-breadcrumbs/more-links.tsx:10-30`                                         |
| `typography.h4`                                                 | `frontend/src/theme/core/typography.ts:75-80`                                                             |

---

## Pagination

### Anatomia

```
.MuiPagination-root  <nav>          display flex
└── <ul>                            display flex · flex-wrap wrap · align-items center · padding 0
    └── <li> .MuiPaginationItem-root   ← ButtonBase
          min-width 32px · height 32px · padding 0 6px · margin 0 3px · border-radius 16px
          └── [.MuiPaginationItem-icon]  font-size 17,5px · margin 0 -8px
```

### Variantes e tamanhos

| Variante   | Origem        | Descrição                                      |
| ---------- | ------------- | ---------------------------------------------- |
| `text`     | MUI (default) | item sem borda; selecionado ganha fundo sólido |
| `outlined` | MUI           | item com borda de 1px                          |
| **`soft`** | **projeto**   | item selecionado com fundo tonal de 8% da cor  |

| Cor                                          | Disponível em                                                       |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `standard` (default), `primary`, `secondary` | MUI                                                                 |
| **`info`, `success`, `warning`, `error`**    | **estendidas pelo projeto** (declaradas em `PaginationExtendColor`) |

| Tamanho            | `min-width` | `height` | `border-radius` | `padding` | `margin` | `font-size`                |
| ------------------ | ----------- | -------- | --------------- | --------- | -------- | -------------------------- |
| `small`            | **26px**    | **26px** | **13px**        | `0 4px`   | `0 1px`  | `0.875rem` = **12,25px**   |
| `medium` (default) | **32px**    | **32px** | **16px**        | `0 6px`   | `0 3px`  | `0.875rem` = **12,25px**   |
| `large`            | **40px**    | **40px** | **20px**        | `0 10px`  | `0 3px`  | `0.9375rem` = **13,125px** |

| `shape`              | `border-radius`                   |
| -------------------- | --------------------------------- |
| `circular` (default) | metade da altura (13 / 16 / 20px) |
| `rounded`            | **8px** (`shape.borderRadius`)    |

### Tabela de estados

**Comum a todas as variantes** (base MUI, não sobrescrita):

| Estado                         | Fundo                      | Texto                     | Borda             | Sombra  | Transição                                                                                               |
| ------------------------------ | -------------------------- | ------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| default                        | transparente               | `#1C252E` (rgb(28,37,46)) | conforme variante | nenhuma | `color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` |
| hover                          | `rgba(145 158 171 / 0.08)` | idem                      | idem              | nenhuma | idem                                                                                                    |
| hover (`@media (hover: none)`) | `transparent`              | idem                      | idem              | —       | —                                                                                                       |
| focus-visible                  | `rgba(145 158 171 / 0.24)` | idem                      | idem              | nenhuma | idem                                                                                                    |
| disabled                       | transparente               | `opacity: 0.48`           | idem              | nenhuma | idem                                                                                                    |

**`variant="text"`**

| Estado                                | Fundo                           | Texto                                  | Borda   |
| ------------------------------------- | ------------------------------- | -------------------------------------- | ------- |
| selected · `color="standard"` (light) | **`#1C252E`**                   | **`#FFFFFF`**, weight **600**          | nenhuma |
| selected + hover · `standard` (light) | **`#454F5B`** (`grey.700`)      | `#FFFFFF`                              | nenhuma |
| selected · `standard` (dark)          | `#FFFFFF` (`text.primary` dark) | **`#1C252E`** (`grey.800`), weight 600 | nenhuma |
| selected + hover · `standard` (dark)  | **`#F9FAFB`** (`grey.100`)      | `#1C252E`                              | nenhuma |
| selected · `color="<cor>"`            | `<cor>.main`                    | `<cor>.contrastText`, weight **600**   | nenhuma |
| selected + hover · `<cor>`            | `<cor>.dark`                    | `<cor>.contrastText`                   | nenhuma |
| selected + disabled                   | mantém o fundo                  | `rgba(145 158 171 / 0.8)`              | —       |

**`variant="outlined"`**

| Estado                     | Fundo                                                            | Texto                        | Borda                                                                                       |
| -------------------------- | ---------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| default (qualquer cor)     | transparente                                                     | `#1C252E`                    | **`1px solid rgba(145 158 171 / 0.24)`**                                                    |
| selected · `standard`      | **`rgba(145 158 171 / 0.08)`**                                   | `#1C252E`, weight **600**    | `1px solid currentColor`                                                                    |
| selected · `color="<cor>"` | `rgba(<cor.main> / 0.12)` light · `rgba(<cor.main> / 0.24)` dark | `<cor>.main`, weight **600** | `1px solid currentColor` (o `rgba(main/0.5)` do MUI é sobrescrito por especificidade maior) |
| selected + disabled        | —                                                                | `rgba(145 158 171 / 0.8)`    | `rgba(145 158 171 / 0.24)`                                                                  |

**`variant="soft"` (do projeto)** — só o item **selecionado** é estilizado; os demais usam a base:

| Cor         | selected · texto (light) | selected · texto (dark)  | selected · fundo           | selected + hover · fundo   |
| ----------- | ------------------------ | ------------------------ | -------------------------- | -------------------------- |
| `standard`  | `#1C252E` (não alterado) | `#FFFFFF` (não alterado) | `rgba(145 158 171 / 0.08)` | `rgba(145 158 171 / 0.16)` |
| `primary`   | **`#007867`**            | **`#5BE49B`**            | `rgba(0 167 111 / 0.08)`   | `rgba(0 167 111 / 0.16)`   |
| `secondary` | **`#5119B7`**            | **`#C684FF`**            | `rgba(142 51 255 / 0.08)`  | `rgba(142 51 255 / 0.16)`  |
| `info`      | **`#006C9C`**            | **`#61F3F3`**            | `rgba(0 184 217 / 0.08)`   | `rgba(0 184 217 / 0.16)`   |
| `success`   | **`#118D57`**            | **`#77ED8B`**            | `rgba(34 197 94 / 0.08)`   | `rgba(34 197 94 / 0.16)`   |
| `warning`   | **`#B76E00`**            | **`#FFD666`**            | `rgba(255 171 0 / 0.08)`   | `rgba(255 171 0 / 0.16)`   |
| `error`     | **`#B71D18`**            | **`#FFAC82`**            | `rgba(255 86 48 / 0.08)`   | `rgba(255 86 48 / 0.16)`   |

Em todas as variantes, `selected` recebe `font-weight: 600`.
A variante `soft` **não** é aplicada quando o item está `disabled` (a condição inclui `!ownerState.disabled`).

### Medidas

| Propriedade                        | Valor bruto                                                                                | Referência simbólica              |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------- |
| tipografia do item                 | `0.875rem` = **12,25px**, weight 400 (selected: **600**), line-height `1.5714285714285714` | `typography.body2`                |
| `min-width` / `height` (medium)    | **32px** / **32px**                                                                        | default MUI                       |
| `padding` (medium)                 | `0 6px`                                                                                    | default MUI                       |
| `margin` (medium)                  | `0 3px`                                                                                    | default MUI                       |
| `border-radius` (medium, circular) | **16px**                                                                                   | default MUI (`32 / 2`)            |
| `transition`                       | `color, background-color` · **250ms** · `cubic-bezier(0.4, 0, 0.2, 1)`                     | `duration.short`                  |
| borda (outlined, projeto)          | `1px solid rgba(145 158 171 / 0.24)`                                                       | `varAlpha(grey.500Channel, 0.24)` |
| ícone de navegação (`‹`/`›`)       | `font-size: 1.25rem` = **17,5px**, `margin: 0 -8px`                                        | `pxToRem(20)`                     |
| `<nav>` root                       | `display: flex`                                                                            | default MUI                       |
| `<ul>`                             | `display: flex`, `flex-wrap: wrap`, `align-items: center`, `padding: 0`, `margin: 0`       | default MUI                       |

### Regras de uso observadas

- A `soft` da Pagination segue a mesma receita das outras `soft` do sistema (Button, Chip, Label): **texto na
  cor `dark`, fundo na `main` com alfa baixo**. A diferença é o alfa: 0.08/0.16 aqui, contra 0.16/0.32 no Chip.
- A borda `outlined` do projeto (`rgba(145 158 171 / 0.24)`) substitui o `rgba(0 0 0 / 0.23)` do MUI — a borda
  passa a ser neutra-azulada e funciona nos dois esquemas de cor.
- `borderColor: 'currentColor'` no item selecionado faz a borda acompanhar a cor do texto, produzindo o
  "contorno colorido" característico.

### Origem

| Fato                                                                                                          | Arquivo:linha                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| tipos das variantes/cores estendidas                                                                          | `frontend/src/theme/core/components/pagination.tsx:14-23`                                       |
| variante `soft` por cor (weight 600, `dark`/`light`, bg 0.08 / hover 0.16)                                    | `frontend/src/theme/core/components/pagination.tsx:29-46`                                       |
| variante `soft` cor `standard`                                                                                | `frontend/src/theme/core/components/pagination.tsx:47-60`                                       |
| registro das variantes no `root`                                                                              | `frontend/src/theme/core/components/pagination.tsx:69-78`                                       |
| variante `text` (selected weight 600; standard branco sobre `text.primary`; hover `grey.700`/dark `grey.100`) | `frontend/src/theme/core/components/pagination.tsx:82-97`                                       |
| variante `outlined` (borda 0.24, selected `currentColor` + weight 600, standard bg 0.08)                      | `frontend/src/theme/core/components/pagination.tsx:101-112`                                     |
| base do item (body2, 32px, radius 16, margin/padding, hover/selected/disabled, transition `short`)            | default MUI 7.0.1 (`node_modules/@mui/material/PaginationItem/PaginationItem.js:108-150`)       |
| tamanhos `small`/`large`                                                                                      | default MUI 7.0.1 (`node_modules/@mui/material/PaginationItem/PaginationItem.js:151-172`)       |
| `shape="rounded"` → `shape.borderRadius`                                                                      | default MUI 7.0.1 (`node_modules/@mui/material/PaginationItem/PaginationItem.js:174-179`)       |
| outlined + cor (border `rgba(main/0.5)`, bg `activatedOpacity`)                                               | default MUI 7.0.1 (`node_modules/@mui/material/PaginationItem/PaginationItem.js:228-250`)       |
| ícone `pxToRem(20)` / `margin 0 -8px`                                                                         | default MUI 7.0.1 (`node_modules/@mui/material/PaginationItem/PaginationItem.js:259-260`)       |
| defaults `variant='text'`, `shape='circular'`, `size='medium'`, `color='standard'`                            | default MUI 7.0.1 (`node_modules/@mui/material/Pagination/Pagination.js:68-85`)                 |
| `action.activatedOpacity` = 0.12 (light) / 0.24 (dark)                                                        | tema computado (`frontend/.ds-extract/theme.json` → `computed.paletteLight/paletteDark.action`) |

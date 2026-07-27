# Componentes — NavSection (navegação principal)

`NavSection` é o componente próprio que desenha o menu do app em **três variantes independentes**:
`vertical` (sidebar 300px), `mini` (sidebar 88px, só ícones) e `horizontal` (barra de 56px).
Cada variante publica um **conjunto próprio de CSS custom properties** no elemento `<nav>`; os itens leem
apenas essas variáveis. Trocar de variante = trocar o mapa de variáveis.

> `rem` renderiza a **14px**. `theme.spacing(n)` = `calc(n * var(--spacing))`, `--spacing: 8px`.
> As classes usam o prefixo `minimal__` (ex.: `minimal__nav__item__root`).

---

## Tabela completa das CSS custom properties

### Variáveis de cor (comuns às três variantes)

| Variável                               | Valor bruto — LIGHT                                                                                       | Valor bruto — DARK           | Referência simbólica                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------- |
| `--nav-item-color`                     | **#637381** rgb(99,115,129)                                                                               | **#919EAB** rgb(145,158,171) | `text.secondary`                              |
| `--nav-item-hover-bg`                  | **`rgba(145 158 171 / 0.08)`**                                                                            | idem                         | `action.hover`                                |
| `--nav-item-caption-color`             | **#919EAB** rgb(145,158,171)                                                                              | **#637381** rgb(99,115,129)  | `text.disabled`                               |
| `--nav-item-root-active-color`         | **#00A76F** rgb(0,167,111)                                                                                | idem                         | `primary.main`                                |
| `--nav-item-root-active-color-on-dark` | **#5BE49B** rgb(91,228,155)                                                                               | idem                         | `primary.light`                               |
| `--nav-item-root-active-bg`            | **`rgba(0 167 111 / 0.08)`**                                                                              | idem                         | `varAlpha(primary.mainChannel, 0.08)`         |
| `--nav-item-root-active-hover-bg`      | **`rgba(0 167 111 / 0.16)`**                                                                              | idem                         | `varAlpha(primary.mainChannel, 0.16)`         |
| `--nav-item-root-open-color`           | **#1C252E** rgb(28,37,46)                                                                                 | **#FFFFFF**                  | `text.primary`                                |
| `--nav-item-root-open-bg`              | **`rgba(145 158 171 / 0.08)`**                                                                            | idem                         | `action.hover`                                |
| `--nav-item-sub-active-color`          | **#1C252E**                                                                                               | **#FFFFFF**                  | `text.primary`                                |
| `--nav-item-sub-active-bg`             | **`rgba(145 158 171 / 0.16)`** — **exceto na variante `vertical`**, onde é **`rgba(145 158 171 / 0.08)`** | idem                         | `action.selected` / `action.hover` (vertical) |
| `--nav-item-sub-open-color`            | **#1C252E**                                                                                               | **#FFFFFF**                  | `text.primary`                                |
| `--nav-item-sub-open-bg`               | **`rgba(145 158 171 / 0.08)`**                                                                            | idem                         | `action.hover`                                |
| `--nav-subheader-color`                | **#919EAB** — **só na variante `vertical`**                                                               | **#637381**                  | `text.disabled`                               |
| `--nav-subheader-hover-color`          | **#1C252E** — **só na variante `vertical`**                                                               | **#FFFFFF**                  | `text.primary`                                |

### Variante `vertical`

| Variável                   | Valor bruto                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| `--nav-item-gap`           | **4px**                                                                |
| `--nav-item-radius`        | **8px** (`shape.borderRadius`)                                         |
| `--nav-item-pt`            | **4px**                                                                |
| `--nav-item-pr`            | **8px**                                                                |
| `--nav-item-pb`            | **4px**                                                                |
| `--nav-item-pl`            | **12px**                                                               |
| `--nav-item-root-height`   | **44px**                                                               |
| `--nav-item-sub-height`    | **36px**                                                               |
| `--nav-icon-size`          | **24px**                                                               |
| `--nav-icon-margin`        | **`0 12px 0 0`**                                                       |
| `--nav-bullet-size`        | **12px**                                                               |
| `--nav-bullet-light-color` | **#EDEFF2** rgb(237,239,242) — hex literal, **fora da paleta do tema** |
| `--nav-bullet-dark-color`  | **#282F37** rgb(40,47,55) — hex literal, **fora da paleta do tema**    |

### Variante `mini`

| Variável                  | Valor bruto                    |
| ------------------------- | ------------------------------ |
| `--nav-item-gap`          | **4px**                        |
| `--nav-item-radius`       | **8px** (`shape.borderRadius`) |
| `--nav-item-root-height`  | **56px**                       |
| `--nav-item-root-padding` | **`8px 4px 6px 4px`**          |
| `--nav-item-sub-height`   | **34px**                       |
| `--nav-item-sub-padding`  | **`0 8px`**                    |
| `--nav-icon-size`         | **22px**                       |
| `--nav-icon-root-margin`  | **`0 0 6px 0`**                |
| `--nav-icon-sub-margin`   | **`0 8px 0 0`**                |

### Variante `horizontal`

| Variável                  | Valor bruto                           |
| ------------------------- | ------------------------------------- |
| `--nav-item-gap`          | **6px**                               |
| `--nav-height`            | **56px**                              |
| `--nav-item-radius`       | **6px** (`shape.borderRadius × 0.75`) |
| `--nav-item-root-height`  | **32px**                              |
| `--nav-item-root-padding` | **`0 6px`**                           |
| `--nav-item-sub-height`   | **34px**                              |
| `--nav-item-sub-padding`  | **`0 8px`**                           |
| `--nav-icon-size`         | **22px**                              |
| `--nav-icon-root-margin`  | **`0 8px 0 0`**                       |
| `--nav-icon-sub-margin`   | **`0 8px 0 0`**                       |

> **Nota**: a variante `mini` **não** define `--nav-bullet-*`, `--nav-item-p*` nem `--nav-subheader-*`;
> a `horizontal` também não. Só a `vertical` tem bullets, paddings individuais e subheaders.

### Sobreposição pelo layout (`navColor: 'apparent'`)

O layout do dashboard pode injetar um segundo conjunto de variáveis quando `settings.navColor === 'apparent'`
(**não é o default**, que é `'integrate'`):

| Variável                                                                    | Valor bruto (modo `apparent`)            |
| --------------------------------------------------------------------------- | ---------------------------------------- |
| `--nav-item-caption-color`                                                  | **#637381** (`grey.600`)                 |
| `--nav-subheader-color`                                                     | **#637381** (`grey.600`)                 |
| `--nav-subheader-hover-color`                                               | **#FFFFFF** (`common.white`)             |
| `--nav-item-color`                                                          | **#919EAB** (`grey.500`)                 |
| `--nav-item-root-active-color`                                              | **#5BE49B** (`primary.light`)            |
| `--nav-item-root-open-color`                                                | **#FFFFFF**                              |
| `--nav-bullet-light-color`                                                  | **#282F37** (usa a cor "dark" do bullet) |
| `--nav-item-sub-active-color` / `--nav-item-sub-open-color` (só `vertical`) | **#FFFFFF**                              |

---

## NavSection — variante `vertical`

### Anatomia

```
<nav class="minimal__nav__section__vertical">      (recebe as CSS vars)
└── <ul class="minimal__nav__ul">  flex column · gap 4px
    └── <li class="minimal__nav__li">   (Group)
        ├── [NavSubheader]  (ListSubheader) · clicável · colapsa o grupo
        └── <Collapse>
            └── <ul class="minimal__nav__ul">  gap 4px
                └── <li>
                    ├── ItemRoot (ButtonBase) .minimal__nav__item__root
                    │   ├── ItemIcon    24×24px · margin 0 12px 0 0
                    │   ├── ItemTexts   flex 1 1 auto · column
                    │   │   ├── ItemTitle        body2 · weight 500 (ativo: 600)
                    │   │   └── [ItemCaptionText] caption · cor --nav-item-caption-color
                    │   ├── [ItemInfo]  12px · weight 600 · margin-left 6px
                    │   └── [ItemArrow] 16×16px · margin-left 6px
                    └── NavCollapse  (subitens)
                        padding-left calc(12px + 24px/2) = 24px
                        └── <ul> position relative · padding-left 12px
                              ::before  linha vertical de 2px
                              └── <li> ItemRoot (subItem) ::before = bullet 12×12px
```

### Variantes e tamanhos

| Nível                   | Altura mínima | Padding                          | Ícone                         |
| ----------------------- | ------------- | -------------------------------- | ----------------------------- |
| item raiz (`depth = 1`) | **44px**      | `4px 8px 4px 12px`               | 24×24px, `margin: 0 12px 0 0` |
| subitem (`depth ≥ 2`)   | **36px**      | `4px 8px 4px 12px` (mesmas vars) | 24×24px (herda as vars)       |

### Tabela de estados — item raiz

| Estado                                | Fundo                                      | Texto                                                                 | Borda   | Sombra  | Transição                 |
| ------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------- | ------- | ------- | ------------------------- |
| default                               | transparente                               | **#637381** (`--nav-item-color`), `body2` **12,25px**, weight **500** | nenhuma | nenhuma | nenhuma declarada no item |
| hover                                 | **`rgba(145 158 171 / 0.08)`**             | idem                                                                  | nenhuma | nenhuma | —                         |
| **open** (grupo expandido, não ativo) | **`rgba(145 158 171 / 0.08)`**             | **#1C252E** (`--nav-item-root-open-color`)                            | nenhuma | nenhuma | —                         |
| **active** (light)                    | **`rgba(0 167 111 / 0.08)`**               | **#00A76F**, weight **600**                                           | nenhuma | nenhuma | —                         |
| **active** (dark)                     | `rgba(0 167 111 / 0.08)`                   | **#5BE49B**, weight 600                                               | nenhuma | nenhuma | —                         |
| **active + hover**                    | **`rgba(0 167 111 / 0.16)`**               | idem active                                                           | nenhuma | nenhuma | —                         |
| **disabled**                          | transparente                               | **`opacity: 0.48`** + `pointer-events: none`                          | nenhuma | nenhuma | —                         |
| focus-visible                         | ripple/focus do `ButtonBase` (default MUI) | idem                                                                  | nenhuma | nenhuma | —                         |

### Tabela de estados — subitem

| Estado       | Fundo                                                                                                 | Texto                                   | Borda   | Sombra  | Marca (bullet)                                             |
| ------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------- | ------- | ------- | ---------------------------------------------------------- |
| default      | transparente                                                                                          | #637381, `body2`, weight 500            | nenhuma | nenhuma | bullet 12×12px em **#EDEFF2** (light) / **#282F37** (dark) |
| hover        | `rgba(145 158 171 / 0.08)`                                                                            | idem                                    | nenhuma | nenhuma | idem                                                       |
| **open**     | `rgba(145 158 171 / 0.08)`                                                                            | **#1C252E**                             | nenhuma | nenhuma | idem                                                       |
| **active**   | **`rgba(145 158 171 / 0.08)`** (⚠️ `--nav-item-sub-active-bg` = `action.hover` **só nesta variante**) | **#1C252E**, weight **600**             | nenhuma | nenhuma | idem                                                       |
| **disabled** | transparente                                                                                          | `opacity: 0.48`, `pointer-events: none` | nenhuma | nenhuma | idem                                                       |

### Tabela de estados — subheader

| Estado  | Fundo        | Texto                                                                                           | Ícone                                                         | Transição                                                            |
| ------- | ------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| default | transparente | **#919EAB** (`--nav-subheader-color`), **9,625px**, weight **700**, `text-transform: uppercase` | seta 16px em `opacity: 0`, `position: absolute`, `left: -4px` | `color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, padding-left 300ms …` |
| hover   | transparente | **#1C252E** (`--nav-subheader-hover-color`); **`padding-left: 16px`** (de 12px)                 | `opacity: 1`                                                  | `opacity 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` no ícone            |

### Medidas

**Item (root e sub)**

| Propriedade               | Valor bruto                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `width`                   | `100%`                                                                                                                                                      |
| `padding`                 | `4px 8px 4px 12px` (via `--nav-item-pt/pr/pb/pl`)                                                                                                           |
| `border-radius`           | **8px**                                                                                                                                                     |
| `min-height` (raiz / sub) | **44px** / **36px**                                                                                                                                         |
| ícone                     | **24 × 24px**, `margin: 0 12px 0 0`, `flex-shrink: 0`, `display: inline-flex`                                                                               |
| título                    | `0.875rem` = **12,25px**, weight **500** (ativo **600**), line-height `1.5714285714285714` → **19,25px**, 1 linha com reticências (`-webkit-line-clamp: 1`) |
| legenda (caption)         | `0.75rem` = **10,5px**, weight 400, line-height `1.5` → **15,75px**, 1 linha com reticências                                                                |
| `info` (badge textual)    | **12px** (px puro), weight **600**, `line-height: 1.5`, `margin-left: 6px`                                                                                  |
| seta                      | **16 × 16px**, `margin-left: 6px`; ícones `eva:arrow-ios-downward-fill` (aberto) / `eva:arrow-ios-forward-fill` (fechado)                                   |
| `disabled`                | `opacity: 0.48`, `pointer-events: none`                                                                                                                     |

**Bullet do subitem (`::before`)**

| Propriedade             | Valor bruto                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| tamanho                 | **12 × 12px** (`--nav-bullet-size`)                                                                                          |
| `left` / `position`     | `0` / `absolute`                                                                                                             |
| `background-color`      | **#EDEFF2** (light) / **#282F37** (dark)                                                                                     |
| `mask` / `-webkit-mask` | `url("data:image/svg+xml,…") no-repeat 50% 50%/100% auto`                                                                    |
| SVG da máscara          | 14×14, `<path d="M1 1v4a8 8 0 0 0 8 8h4" stroke="#efefef" stroke-width="2" stroke-linecap="round"/>` (curva "L" arredondada) |
| `transform` (LTR)       | `translate(calc(12px × -1), calc(12px × -0.4))` = **`translate(-12px, -4.8px)`**                                             |
| `transform` (RTL)       | `translate(12px, -4.8px) scaleX(-1)`                                                                                         |

**Linha vertical de conexão (`NavCollapse`)**

| Propriedade                | Valor bruto                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `padding-left` do Collapse | `calc(12px + 24px / 2)` = **24px**                                                                                  |
| `<ul>` interno             | `position: relative`, `padding-left: 12px`                                                                          |
| `::before` (a linha)       | `top: 0`, `left: 0`, `width: **2px**`, `position: absolute`, `background-color: #EDEFF2` (light) / `#282F37` (dark) |
| `bottom` da linha          | `calc(36px − 2px − 12px / 2)` = **28px**                                                                            |

**Subheader**

| Propriedade                | Valor bruto                                                                                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tipografia                 | `typography.overline` com `font-size` sobrescrito: `0.6875rem` = **9,625px**, weight **700**, `text-transform: uppercase`, `line-height: 1.5`                                                  |
| `padding`                  | **`16px 8px 8px 12px`** (`theme.spacing(2, 1, 1, 1.5)`); no hover, `padding-left` → **16px**                                                                                                   |
| `gap` (ícone ↔ texto)      | **8px**                                                                                                                                                                                        |
| `display` / `align-self`   | `inline-flex` / `flex-start`                                                                                                                                                                   |
| ícone                      | **16px**, `position: absolute`, `left: -4px`, `opacity: 0` → `1` no hover                                                                                                                      |
| `transition`               | `color, padding-left` · **300ms** · `cubic-bezier(0.4, 0, 0.2, 1)`                                                                                                                             |
| base `ListSubheader` (MUI) | `box-sizing: border-box`, `line-height: 48px`, `list-style: none`, `color: text.secondary`, `font-weight: 500`, `font-size: 0.875rem`; `disableSticky` está ativo → **sem** `position: sticky` |

**Estrutura**

| Propriedade                            | Valor bruto                                                      |
| -------------------------------------- | ---------------------------------------------------------------- |
| `<ul>` (`minimal__nav__ul`)            | `display: flex`, `flex-direction: column`, `gap: 4px`            |
| `<li>` (`minimal__nav__li`)            | `display: inline-block`; `cursor: not-allowed` quando `disabled` |
| primeiro `<li>` de um grupo com filhos | `margin-top: 4px` (`var(--nav-item-gap)`)                        |

### Regras de uso observadas

- **O item ativo raiz é verde; o subitem ativo é cinza.** A variante `vertical` rebaixa
  `--nav-item-sub-active-bg` de `action.selected` (0.16) para `action.hover` (0.08) — os subitens ativos
  ficam bem discretos.
- **`open` ≠ `active`**: um grupo expandido mas não navegado fica cinza (`action.hover` + `text.primary`);
  só o item cuja rota está ativa fica verde.
- O bullet não é um ponto: é uma **curva em "L"** aplicada via `mask`, que conecta visualmente o subitem à
  linha vertical de 2px do grupo.
- Os hex `#EDEFF2` e `#282F37` **não existem na paleta do tema** — são literais no arquivo de CSS vars.
- O subheader inteiro é clicável e colapsa o grupo (`Collapse`); a seta só aparece no hover.

### Origem

| Fato                                                                           | Arquivo:linha                                                                                                                                      |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bulletColor = { dark: '#282F37', light: '#EDEFF2' }`                          | `frontend/src/components/nav-section/styles/css-vars.ts:7`                                                                                         |
| variáveis de cor (comuns)                                                      | `frontend/src/components/nav-section/styles/css-vars.ts:14-35`                                                                                     |
| `--nav-item-sub-active-bg` = `action.hover` só no vertical + subheader vars    | `frontend/src/components/nav-section/styles/css-vars.ts:30-34`                                                                                     |
| variáveis da variante `vertical`                                               | `frontend/src/components/nav-section/styles/css-vars.ts:40-63`                                                                                     |
| `navItemStyles` (icon/texts/title/info/arrow/captionIcon/captionText/disabled) | `frontend/src/components/nav-section/styles/nav-item-styles.ts:16-58`                                                                              |
| bullet (SVG + estilos)                                                         | `frontend/src/components/nav-section/vertical/nav-item.tsx:165-183`                                                                                |
| `rootItemStyles` (open/active/hover)                                           | `frontend/src/components/nav-section/vertical/nav-item.tsx:185-199`                                                                                |
| `subItemStyles` (bullet + open/active)                                         | `frontend/src/components/nav-section/vertical/nav-item.tsx:201-212`                                                                                |
| ItemRoot (width/paddings/radius/color/hover/variants)                          | `frontend/src/components/nav-section/vertical/nav-item.tsx:214-228`                                                                                |
| ItemIcon (vars de tamanho e margem)                                            | `frontend/src/components/nav-section/vertical/nav-item.tsx:234-239`                                                                                |
| ItemTitle (body2 + weight 500 / 600 ativo)                                     | `frontend/src/components/nav-section/vertical/nav-item.tsx:251-258`                                                                                |
| ItemCaptionText (cor da caption)                                               | `frontend/src/components/nav-section/vertical/nav-item.tsx:263-266`                                                                                |
| ícones da seta (`eva:arrow-ios-*`)                                             | `frontend/src/components/nav-section/vertical/nav-item.tsx:136-143`                                                                                |
| `NavCollapse` (padding-left, ul, linha vertical 2px)                           | `frontend/src/components/nav-section/components/nav-collapse.tsx:10-37`                                                                            |
| `NavSubheader` (overline, 11px, padding, transições, hover)                    | `frontend/src/components/nav-section/components/nav-subheader.tsx:15-55`                                                                           |
| `NavUl` / `NavLi`                                                              | `frontend/src/components/nav-section/components/nav-elements.tsx:17-33`                                                                            |
| gaps das listas (`var(--nav-item-gap)`)                                        | `frontend/src/components/nav-section/vertical/nav-section-vertical.tsx:36`, `:66`; `frontend/src/components/nav-section/vertical/nav-list.tsx:119` |
| `mt: var(--nav-item-gap)` no primeiro `<li>` filho                             | `frontend/src/components/nav-section/vertical/nav-list.tsx:96-100`                                                                                 |
| base `ListSubheader` (line-height 48, weight 500, fontSize 14)                 | default MUI 7.0.1 (`node_modules/@mui/material/ListSubheader/ListSubheader.js:45-51`)                                                              |
| sobreposição `navColor: 'apparent'`                                            | `frontend/src/layouts/dashboard/css-vars.ts:65-82`                                                                                                 |

---

## NavSection — variante `mini`

### Anatomia

```
<nav class="minimal__nav__section__mini">
└── <ul class="minimal__nav__ul">  flex column · gap 4px
    └── <li>
        ├── ItemRoot (ButtonBase)  column · text-align center
        │     min-height 56px · padding 8px 4px 6px 4px · radius 8px
        │     ├── ItemIcon    22×22px · margin 0 0 6px 0
        │     ├── ItemTitle   8,75px · weight 600 (ativo 700) · line-height 16px
        │     ├── [ItemCaptionIcon] 16×16px · absolute top 11px left 6px
        │     └── [ItemArrow]       16×16px · absolute top 11px right 6px
        └── [NavDropdown (Popover, abre no hover)]
              paper: transparente, sem sombra, padding 0 6px
              └── NavDropdownPaper   min-width 180px + paperStyles(dropdown)
                    └── <ul> gap 4px
                        └── ItemRoot (subItem)  min-height 34px · padding 0 8px
```

### Variantes e tamanhos

| Nível              | `min-height` | `padding`             | Ícone                        | Fonte do título                                                                 |
| ------------------ | ------------ | --------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| raiz               | **56px**     | **`8px 4px 6px 4px`** | 22×22px, `margin: 0 0 6px 0` | **8,75px** (`pxToRem(10)`), weight **600** (ativo **700**), `line-height: 16px` |
| subitem (dropdown) | **34px**     | **`0 8px`**           | 22×22px, `margin: 0 8px 0 0` | `body2` **12,25px**, weight **500** (ativo **600**)                             |

### Tabela de estados

| Estado                             | Fundo                                                                          | Texto                                     | Borda   | Sombra  | Transição                         |
| ---------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------- | ------- | ------- | --------------------------------- |
| raiz default                       | transparente                                                                   | **#637381**, 8,75px, weight 600           | nenhuma | nenhuma | nenhuma                           |
| raiz hover                         | `rgba(145 158 171 / 0.08)`                                                     | idem                                      | nenhuma | nenhuma | —                                 |
| raiz **open** (dropdown aberto)    | `rgba(145 158 171 / 0.08)`                                                     | **#1C252E**                               | nenhuma | nenhuma | —                                 |
| raiz **active** (light / dark)     | `rgba(0 167 111 / 0.08)`                                                       | **#00A76F** / **#5BE49B**, weight **700** | nenhuma | nenhuma | —                                 |
| raiz **active + hover**            | `rgba(0 167 111 / 0.16)`                                                       | idem                                      | nenhuma | nenhuma | —                                 |
| raiz **disabled**                  | transparente                                                                   | `opacity: 0.48`, `pointer-events: none`   | nenhuma | nenhuma | —                                 |
| sub default                        | transparente                                                                   | **#637381** (`text.secondary` explícito)  | nenhuma | nenhuma | —                                 |
| sub hover                          | `rgba(145 158 171 / 0.08)`                                                     | idem                                      | nenhuma | nenhuma | —                                 |
| sub **open**                       | `rgba(145 158 171 / 0.08)`                                                     | **#1C252E**                               | nenhuma | nenhuma | —                                 |
| sub **active**                     | **`rgba(145 158 171 / 0.16)`** (`action.selected` — **diferente** do vertical) | **#1C252E**, weight **600**               | nenhuma | nenhuma | —                                 |
| sub **disabled**                   | transparente                                                                   | `opacity: 0.48`                           | nenhuma | nenhuma | —                                 |
| caption (ícone `eva:info-outline`) | —                                                                              | **#919EAB** (`--nav-item-caption-color`)  | —       | —       | tooltip `arrow placement="right"` |

### Medidas

| Propriedade                   | Valor bruto                                                                                                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ItemRoot raiz                 | `width: 100%`, `text-align: center`, `flex-direction: column`, `min-height: 56px`, `padding: 8px 4px 6px 4px`, `border-radius: 8px`                                                                   |
| ItemRoot sub                  | `min-height: 34px`, `padding: 0 8px`, `border-radius: 8px`                                                                                                                                            |
| ícone raiz / sub              | **22 × 22px**; `margin: 0 0 6px 0` / `0 8px 0 0`                                                                                                                                                      |
| título raiz                   | `0.625rem` = **8,75px**, `line-height: 16px`, weight **600** (ativo **700**), 1 linha com reticências                                                                                                 |
| título sub                    | `0.875rem` = **12,25px**, weight **500** (ativo **600**)                                                                                                                                              |
| caption (ícone) raiz          | **16 × 16px**, `position: absolute`, `top: 11px`, `left: 6px`                                                                                                                                         |
| seta raiz                     | **16 × 16px**, `margin: 0`, `position: absolute`, `top: 11px`, `right: 6px`; ícone `eva:arrow-ios-forward-fill`                                                                                       |
| seta sub                      | **16 × 16px**, `margin-right: **−4px**` (`theme.spacing(-0.5)`)                                                                                                                                       |
| `info`                        | **12px**, weight 600, `margin-left: 6px` (só em subitens)                                                                                                                                             |
| dropdown (`NavDropdown`)      | `pointer-events: none` (o paper vira `auto` quando aberto); paper: `box-shadow: none`, `overflow: unset`, `backdrop-filter: none`, `background: transparent`, `padding: **0 6px**`                    |
| `NavDropdownPaper`            | **`min-width: 180px`** + `paperStyles(dropdown: true)`: `padding: 4px`, `border-radius: 10px`, `box-shadow: customShadows.dropdown`, `blur(20px)`, fundo `rgba(255 255 255 / 0.9)` + 2 gradientes SVG |
| lista do dropdown             | `gap: 4px` (`sx={{ gap: 0.5 }}`)                                                                                                                                                                      |
| posicionamento do dropdown    | `anchorOrigin: { vertical: 'center', horizontal: 'right' }` · `transformOrigin: { vertical: 'center', horizontal: 'left' }` (invertidos em RTL)                                                       |
| largura do container (layout) | **88px** (`--layout-nav-mini-width`)                                                                                                                                                                  |

### Regras de uso observadas

- O dropdown **abre no hover** (`usePopoverHover`), não no clique, e o `Popover` é montado só enquanto aberto
  (`{open && renderDropdown()}`) para evitar a transição de fechamento do MUI.
- O `padding: 0 6px` no paper do Popover cria a "zona morta" entre o item e o painel, evitando que o mouse
  perca o hover ao atravessar.
- O título de 8,75px é o **menor texto do sistema depois do tooltip** (9,625px).

### Origem

| Fato                                                              | Arquivo:linha                                                                                   |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| variáveis da variante `mini`                                      | `frontend/src/components/nav-section/styles/css-vars.ts:67-85`                                  |
| `rootItemStyles` (column, center, open/active)                    | `frontend/src/components/nav-section/mini/nav-item.tsx:126-143`                                 |
| `subItemStyles` (min-height/padding/text.secondary/open/active)   | `frontend/src/components/nav-section/mini/nav-item.tsx:145-157`                                 |
| ItemRoot (width/color/radius/hover/variants)                      | `frontend/src/components/nav-section/mini/nav-item.tsx:159-169`                                 |
| ItemIcon (margens root/sub)                                       | `frontend/src/components/nav-section/mini/nav-item.tsx:175-181`                                 |
| ItemTitle (10px, weight 600/700; sub body2 500/600)               | `frontend/src/components/nav-section/mini/nav-item.tsx:186-205`                                 |
| ItemCaptionIcon (absolute top 11 left 6)                          | `frontend/src/components/nav-section/mini/nav-item.tsx:210-214`                                 |
| ItemArrow (absolute top 11 right 6; sub `-4px`)                   | `frontend/src/components/nav-section/mini/nav-item.tsx:226-240`                                 |
| tooltip do caption (`arrow placement="right"`)                    | `frontend/src/components/nav-section/mini/nav-item.tsx:80-89`                                   |
| dropdown no hover + `anchorOrigin`/`transformOrigin`              | `frontend/src/components/nav-section/mini/nav-list.tsx:85-118` (montagem condicional em `:133`) |
| `NavDropdownPaper` (min-width 180 + paperStyles)                  | `frontend/src/components/nav-section/components/nav-dropdown.tsx:8-11`                          |
| `NavDropdown` (pointer-events, paper transparente, padding 0 6px) | `frontend/src/components/nav-section/components/nav-dropdown.tsx:15-25`                         |
| lista do dropdown `gap: 0.5`                                      | `frontend/src/components/nav-section/mini/nav-list.tsx:150`                                     |
| `--layout-nav-mini-width: 88px`                                   | `frontend/src/layouts/dashboard/css-vars.ts:14`                                                 |

---

## NavSection — variante `horizontal`

### Anatomia

```
<Scrollbar height 100%>
└── <nav class="minimal__nav__section__horizontal">
      height 100% · margin-inline auto · display flex · align-items center
      min-height var(--nav-height) = 56px
      └── <ul class="minimal__nav__ul">  flex-direction row · gap 6px
          └── <li>
              ├── ItemRoot   min-height 32px · padding 0 6px · radius 6px
              │     ├── ItemIcon   22×22px · margin 0 8px 0 0
              │     ├── ItemTitle  body2 · weight 500 (ativo 600)
              │     ├── [ItemCaptionIcon] 16×16px · margin-left 6px
              │     └── [ItemArrow]       16×16px (eva:arrow-ios-downward-fill)
              └── [NavDropdown …]  (subitens: min-height 34px · padding 0 8px)
```

### Variantes e tamanhos

| Nível   | `min-height` | `padding`   | `border-radius` | Ícone                        |
| ------- | ------------ | ----------- | --------------- | ---------------------------- |
| raiz    | **32px**     | **`0 6px`** | **6px**         | 22×22px, `margin: 0 8px 0 0` |
| subitem | **34px**     | **`0 8px`** | **6px**         | 22×22px, `margin: 0 8px 0 0` |

### Tabela de estados

| Estado                         | Fundo                                              | Texto                                            | Borda   | Sombra  | Transição |
| ------------------------------ | -------------------------------------------------- | ------------------------------------------------ | ------- | ------- | --------- |
| raiz default                   | transparente                                       | **#637381**, `body2` **12,25px**, weight **500** | nenhuma | nenhuma | nenhuma   |
| raiz hover                     | `rgba(145 158 171 / 0.08)`                         | idem                                             | nenhuma | nenhuma | —         |
| raiz **open**                  | `rgba(145 158 171 / 0.08)`                         | **#1C252E**                                      | nenhuma | nenhuma | —         |
| raiz **active** (light / dark) | `rgba(0 167 111 / 0.08)`                           | **#00A76F** / **#5BE49B**, weight **600**        | nenhuma | nenhuma | —         |
| raiz **active + hover**        | `rgba(0 167 111 / 0.16)`                           | idem                                             | nenhuma | nenhuma | —         |
| raiz **disabled**              | transparente                                       | `opacity: 0.48`, `pointer-events: none`          | nenhuma | nenhuma | —         |
| sub default                    | transparente                                       | **#637381**                                      | nenhuma | nenhuma | —         |
| sub **open**                   | `rgba(145 158 171 / 0.08)`                         | **#1C252E**                                      | nenhuma | nenhuma | —         |
| sub **active**                 | **`rgba(145 158 171 / 0.16)`** (`action.selected`) | **#1C252E**, weight 600                          | nenhuma | nenhuma | —         |
| sub **disabled**               | transparente                                       | `opacity: 0.48`                                  | nenhuma | nenhuma | —         |

### Medidas

| Propriedade                     | Valor bruto                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| altura da barra (`<nav>`)       | **56px** (`--nav-height`)                                                                                              |
| altura do container do layout   | **64px** (`--layout-nav-horizontal-height`)                                                                            |
| fundo do container              | `rgba(255 255 255 / 0.8)` (light) / `rgba(20 26 33 / 0.96)` (dark) — `--layout-nav-horizontal-bg`                      |
| `backdrop-filter` do container  | `blur(8px)` (`--layout-header-blur`)                                                                                   |
| padding horizontal do container | **12px** (`px: 1.5`)                                                                                                   |
| borda inferior do container     | `solid 1px rgba(145 158 171 / 0.08)`                                                                                   |
| divisor superior                | `Divider` com `border-style: dashed`, `position: absolute`, `top: 0`, `z-index: 9`                                     |
| `gap` entre itens               | **6px**                                                                                                                |
| item raiz                       | `min-height: 32px`, `padding: 0 6px`, `border-radius: 6px`, `flex-shrink: 0`, `width: 100%`                            |
| subitem                         | `min-height: 34px`, `padding: 0 8px`                                                                                   |
| ícone                           | **22 × 22px**, `margin: 0 8px 0 0` (raiz e sub)                                                                        |
| título                          | `0.875rem` = **12,25px**, weight **500** (ativo **600**)                                                               |
| caption (ícone) raiz            | **16 × 16px**, `margin-left: 6px` (`theme.spacing(0.75)`)                                                              |
| seta raiz / sub                 | **16 × 16px**; `eva:arrow-ios-downward-fill` (raiz) / `eva:arrow-ios-forward-fill` (sub); sub com `margin-right: −4px` |

### Regras de uso observadas

- É a única variante com **raio de 6px** (`shape.borderRadius × 0.75`) — o mesmo do `MenuItem` e do `Label`.
- A barra fica dentro de um `Scrollbar` (simplebar) com `align-items: center`, permitindo rolagem horizontal
  quando há muitos itens.
- Assim como na `mini`, os subitens abrem em dropdown no hover, com o mesmo `NavDropdownPaper`.

### Origem

| Fato                                                             | Arquivo:linha                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| variáveis da variante `horizontal`                               | `frontend/src/components/nav-section/styles/css-vars.ts:89-107`                       |
| `rootItemStyles` (padding/min-height/open/active)                | `frontend/src/components/nav-section/horizontal/nav-item.tsx:126-141`                 |
| `subItemStyles`                                                  | `frontend/src/components/nav-section/horizontal/nav-item.tsx:143-155`                 |
| ItemRoot (width/flex-shrink/color/radius/hover)                  | `frontend/src/components/nav-section/horizontal/nav-item.tsx:157-169`                 |
| ItemIcon                                                         | `frontend/src/components/nav-section/horizontal/nav-item.tsx:174-180`                 |
| ItemTitle (body2 500/600)                                        | `frontend/src/components/nav-section/horizontal/nav-item.tsx:185-192`                 |
| ItemCaptionIcon (`margin-left: spacing(0.75)`)                   | `frontend/src/components/nav-section/horizontal/nav-item.tsx:197-201`                 |
| ItemArrow (sub `-4px`)                                           | `frontend/src/components/nav-section/horizontal/nav-item.tsx:213-216`                 |
| `<nav>` (height, mx auto, min-height `--nav-height`) + Scrollbar | `frontend/src/components/nav-section/horizontal/nav-section-horizontal.tsx:30-48`     |
| `<ul>` row + gap                                                 | `frontend/src/components/nav-section/horizontal/nav-section-horizontal.tsx:49`, `:79` |
| container do layout (altura 64px, bg, blur, px 1.5, borda)       | `frontend/src/layouts/dashboard/nav-horizontal.tsx:28-62`                             |
| `--layout-nav-horizontal-height: 64px`                           | `frontend/src/layouts/dashboard/css-vars.ts:16`                                       |
| `--layout-nav-horizontal-bg` (0.8 light / 0.96 dark)             | `frontend/src/layouts/dashboard/css-vars.ts:39`, `:46`                                |

---

## Classes CSS geradas

Todas com prefixo `minimal__` (`themeConfig.classesPrefix`):

| Elemento                             | Classe                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `<nav>` vertical / mini / horizontal | `minimal__nav__section__vertical` · `minimal__nav__section__mini` · `minimal__nav__section__horizontal`      |
| `<ul>` / `<li>`                      | `minimal__nav__ul` · `minimal__nav__li`                                                                      |
| subheader                            | `minimal__nav__subheader`                                                                                    |
| dropdown                             | `minimal__nav__dropdown__root` · `minimal__nav__dropdown__paper`                                             |
| item                                 | `minimal__nav__item__root` · `__sub` · `__icon` · `__info` · `__texts` · `__title` · `__arrow` · `__caption` |
| estados (sufixos)                    | `--open` · `--active` · `--disabled`                                                                         |

**Origem**: `frontend/src/components/nav-section/styles/classes.ts:5-31`;
prefixo em `frontend/src/theme/theme-config.ts:36`; helper em `frontend/src/theme/create-classes.ts:5-7`.

---

## Dimensões do contêiner (layout)

| Variável                                                      | Valor bruto                                                            | Onde                                                   |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| `--layout-nav-vertical-width`                                 | **300px**                                                              | `frontend/src/layouts/dashboard/css-vars.ts:15`        |
| `--layout-nav-mini-width`                                     | **88px**                                                               | `frontend/src/layouts/dashboard/css-vars.ts:14`        |
| `--layout-nav-horizontal-height`                              | **64px**                                                               | `frontend/src/layouts/dashboard/css-vars.ts:16`        |
| `--layout-nav-mobile-width`                                   | **288px**                                                              | `frontend/src/layouts/core/css-vars.ts:5-14`           |
| `--layout-nav-zIndex`                                         | **1201** (`zIndex.drawer + 1`)                                         | `frontend/src/layouts/core/css-vars.ts:7`              |
| `--layout-nav-bg` (navColor `integrate`)                      | **#FFFFFF** (light) / **#141A21** (dark)                               | `frontend/src/layouts/dashboard/css-vars.ts:38`        |
| `--layout-nav-border-color`                                   | `rgba(145 158 171 / 0.12)` (light) / `rgba(145 158 171 / 0.08)` (dark) | `frontend/src/layouts/dashboard/css-vars.ts:40`, `:45` |
| `--layout-transition-easing` / `--layout-transition-duration` | `linear` / **120ms**                                                   | `frontend/src/layouts/dashboard/css-vars.ts:12-13`     |

O contêiner da sidebar (`NavRoot`) é `position: fixed`, `top/left: 0`, `height: 100%`,
`display: none` até `@media (min-width:1200px)` e `flex` a partir daí, com
`border-right: 1px solid var(--layout-nav-border-color, rgba(145 158 171 / 0.12))` e
`transition: width 120ms linear`
(`frontend/src/layouts/dashboard/nav-vertical.tsx:114-133`).

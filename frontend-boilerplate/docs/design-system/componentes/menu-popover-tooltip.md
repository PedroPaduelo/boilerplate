# Componentes — Camadas flutuantes: MenuItem, Popover/Menu e Tooltip

O sistema tem **um único visual de dropdown**, definido pelo mixin `paperStyles(theme, { dropdown: true })`,
e **um único visual de item de menu**, definido pelo mixin `menuItemStyles(theme)`. Popover, Menu,
Autocomplete, Select, o paper do DataGrid e os dropdowns do nav mini/horizontal usam esses mesmos dois mixins.

> `rem` renderiza a **14px**. `theme.spacing(n)` = `calc(n * var(--spacing))`, `--spacing: 8px`.

---

## MenuItem

### Anatomia

```
.MuiMenuItem-root                        ← ButtonBase
  display flex · align-items center · justify-content flex-start · position relative
  padding 6px 8px · border-radius 6px
  ┌ [.MuiListItemIcon-root]  min-width 36px (dentro de MenuItem)
  ├ [.MuiCheckbox-root]      padding 4px · margin-left -4px · margin-right 4px
  ├ texto (body2)
  └ [.MuiListItemText-root]  margin-top/bottom 0
  + .MuiDivider-root adjacente → margin 4px 0
  + :not(:last-of-type) → margin-bottom 4px
```

### Variantes e tamanhos

| Variante / prop  | Efeito                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| default          | `padding 6px 8px`, `min-height 48px` (mas `auto` a partir de 600px — ver Medidas)                                                                         |
| `dense`          | `min-height 32px`; `padding-top/bottom 4px` do MUI **é sobrescrito** pelo shorthand `padding: 6px 8px` do projeto; tipografia já é `body2` nos dois casos |
| `divider`        | acrescenta `border-bottom: 1px solid rgba(145 158 171 / 0.2)` + `background-clip: padding-box`                                                            |
| `disableGutters` | remove os `padding-left/right: 16px` do MUI — **irrelevante aqui**, pois o projeto já os sobrescreve com `padding: 6px 8px`                               |

Não há tamanhos além de `dense`.

### Tabela de estados

| Estado                                                  | Fundo                                                                     | Texto                                                               | Borda   | Sombra  | Transição                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------- | ------- | ------------------------------------------------------------ |
| default                                                 | transparente                                                              | herdado do paper (`#1C252E` light / `#FFFFFF` dark), weight **400** | nenhuma | nenhuma | nenhuma declarada no root (o ripple do ButtonBase tem a sua) |
| hover                                                   | `rgba(145 158 171 / 0.08)`                                                | idem                                                                | nenhuma | nenhuma | nenhuma                                                      |
| hover em dispositivo sem hover (`@media (hover: none)`) | `transparent`                                                             | idem                                                                | —       | —       | —                                                            |
| focus-visible                                           | `rgba(145 158 171 / 0.24)`                                                | idem                                                                | nenhuma | nenhuma | —                                                            |
| selected                                                | **`rgba(145 158 171 / 0.16)`**                                            | weight **600**                                                      | nenhuma | nenhuma | —                                                            |
| selected + hover                                        | **`rgba(145 158 171 / 0.08)`** (fica **mais claro** que o selected)       | weight 600                                                          | nenhuma | nenhuma | —                                                            |
| selected + focus-visible                                | `rgba(0 167 111 / calc(0.08 + 0.12))` — regra do MUI, **não** sobrescrita | weight 600                                                          | —       | —       | —                                                            |
| disabled                                                | transparente                                                              | `opacity: 0.48` no elemento inteiro                                 | nenhuma | nenhuma | —                                                            |
| option de Autocomplete com `aria-selected="true"`       | `rgba(145 158 171 / 0.16)`; hover → `rgba(145 158 171 / 0.08)`            | —                                                                   | —       | —       | —                                                            |

> ⚠️ **Inconsistência real do sistema**: `selected + hover` usa `action.hover` (0.08), que é **mais fraco** que
> `selected` (0.16). O item selecionado clareia ao passar o mouse, em vez de escurecer. É o que está no código.
> ⚠️ **NÃO CONFIRMADO**: o estado `selected + focusVisible` (`rgba(0 167 111 / calc(0.08 + 0.12))`, base
> `primary.main`) não é sobrescrito pelo mixin e não foi medido em runtime.

### Medidas

| Propriedade                                            | Valor bruto                                                                                                                    | Referência simbólica                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| tipografia                                             | `0.875rem` = **12,25px**, weight **400**, line-height `1.5714285714285714` (22/14) → **19,25px**, família Public Sans Variable | `typography.body2`                             |
| `padding`                                              | **`6px 8px`**                                                                                                                  | `theme.spacing(0.75, 1)`                       |
| `border-radius`                                        | **6px**                                                                                                                        | `shape.borderRadius × 0.75`                    |
| `margin-bottom` (`:not(:last-of-type)`)                | **4px**                                                                                                                        | valor literal                                  |
| `min-height`                                           | **48px**; a partir de `@media (min-width:600px)` → **`auto`** (quando não é `dense`)                                           | default MUI                                    |
| `min-height` (`dense`)                                 | **32px**                                                                                                                       | default MUI                                    |
| `white-space`                                          | `nowrap`                                                                                                                       | default MUI                                    |
| `box-sizing`                                           | `border-box`                                                                                                                   | default MUI                                    |
| Checkbox interno: `padding`                            | **4px**                                                                                                                        | `theme.spacing(0.5)`                           |
| Checkbox interno: `margin-left`                        | **−4px**                                                                                                                       | `theme.spacing(-0.5)`                          |
| Checkbox interno: `margin-right`                       | **4px**                                                                                                                        | `theme.spacing(0.5)`                           |
| `Divider` adjacente: `margin`                          | **`4px 0`**                                                                                                                    | `theme.spacing(0.5, 0)` (o MUI usaria `8px 0`) |
| `ListItemIcon` dentro do MenuItem: `min-width`         | **36px**                                                                                                                       | default MUI                                    |
| `ListItemText` dentro do MenuItem: `margin-top/bottom` | **0**                                                                                                                          | default MUI                                    |

### Regras de uso observadas

- O MenuItem do projeto é **compacto**: 6px/8px de padding e raio 6px, contra 6px/16px e raio 0 do MUI. É a
  mesma linguagem de "pílula pequena" do `Label` (raio 6px) e do item de nav horizontal (raio 6px).
- Os 4px de `margin-bottom` entre itens existem porque o paper do dropdown tem `padding: 4px` — o conjunto
  produz um respiro uniforme de 4px em volta e entre os itens.
- O mixin é aplicado **integralmente** ao `MuiMenuItem` (`...theme.mixins.menuItemStyles(theme)`), e o mesmo
  mixin governa as opções do `Autocomplete` (seletor `.MuiAutocomplete-option[aria-selected="true"]`).
- A seleção é **neutra** (cinza), não colorida: o projeto troca a base `primary` do MUI por `grey.500`.

### Origem

| Fato                                                                                                    | Arquivo:linha                                                                |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `MuiMenuItem.root = menuItemStyles(theme)`                                                              | `frontend/src/theme/core/components/menu.tsx:9`                              |
| mixin: `...typography.body2`                                                                            | `frontend/src/theme/core/mixins/global-styles-components.ts:23`              |
| mixin: `padding: spacing(0.75, 1)`                                                                      | `frontend/src/theme/core/mixins/global-styles-components.ts:24`              |
| mixin: `borderRadius: 8 × 0.75 = 6px`                                                                   | `frontend/src/theme/core/mixins/global-styles-components.ts:25`              |
| mixin: `:not(:last-of-type) marginBottom 4`                                                             | `frontend/src/theme/core/mixins/global-styles-components.ts:26-28`           |
| mixin: selected (weight 600 + `action.selected`, hover `action.hover`)                                  | `frontend/src/theme/core/mixins/global-styles-components.ts:29-33`           |
| mixin: checkbox interno                                                                                 | `frontend/src/theme/core/mixins/global-styles-components.ts:34-38`           |
| mixin: opção de Autocomplete selecionada                                                                | `frontend/src/theme/core/mixins/global-styles-components.ts:39-42`           |
| mixin: divider adjacente `margin 4px 0`                                                                 | `frontend/src/theme/core/mixins/global-styles-components.ts:43-45`           |
| base: `typography.body1`, `minHeight 48`, `padding 6/16`, hover/selected/focus/disabled, divider, dense | default MUI 7.0.1 (`node_modules/@mui/material/MenuItem/MenuItem.js:61-155`) |
| `action.selected/hover/focus/disabledOpacity`                                                           | `frontend/src/theme/core/palette.ts:103-111`                                 |
| `fontWeightSemiBold = "600"`                                                                            | `frontend/src/theme/core/typography.ts:49-53`                                |

---

## Popover (e Menu, que herda dele)

### Anatomia

```
.MuiPopover-root (Modal, z-index 1300)
└── .MuiPopover-paper   ← Paper (elevation 8, mas o box-shadow é sobrescrito)
      position absolute · overflow-y auto · overflow-x hidden · outline 0
      min-width 16px · min-height 16px
      max-width calc(100% - 32px) · max-height calc(100% - 32px)
      ── paperStyles(dropdown: true) ──
      padding 4px · border-radius 10px · box-shadow customShadows.dropdown
      backdrop-filter blur(20px) · background rgba(255 255 255 / 0.9) + 2 gradientes SVG
      └── .MuiList-root   padding-top 0 · padding-bottom 0
            └── .MuiMenuItem-root …
```

### Variantes e tamanhos

Sem variantes. O `Menu` reaproveita **o mesmo paper**: `MenuPaper` é `styled(PopoverPaper, { name: 'MuiMenu',
slot: 'Paper' })`, então a classe gerada para `MuiPopover.paper` — com os overrides do tema — é aplicada
também ao Menu, acrescida de `max-height: calc(100% - 96px)` e `-webkit-overflow-scrolling: touch`.

⚠️ **NÃO CONFIRMADO em runtime**: a herança do estilo `MuiPopover.paper` pelo `Menu` foi verificada apenas
lendo o fonte (`Menu/Menu.js:51`, `MenuPaper = styled(PopoverPaper, …)`); não houve medição via
`getComputedStyle` em um `<Menu>` aberto.

### Tabela de estados

| Estado         | Fundo                                                                                                                          | Texto     | Borda   | Sombra                                                                              | Transição                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------- | ------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| aberto (light) | `rgba(255 255 255 / 0.9)` + gradiente cyan (topo-direita) + gradiente vermelho (baixo-esquerda), `backdrop-filter: blur(20px)` | `#1C252E` | nenhuma | `0 0 2px 0 rgba(145 158 171 / 0.24), -20px 20px 40px -4px rgba(145 158 171 / 0.24)` | `Grow` do MUI (entrada `225ms` / saída `195ms`, `cubic-bezier(0.4, 0, 0.2, 1)`) |
| aberto (dark)  | `rgba(28 37 46 / 0.9)` + mesmos gradientes + blur                                                                              | `#FFFFFF` | nenhuma | `0 0 2px 0 rgba(0 0 0 / 0.24), -20px 20px 40px -4px rgba(0 0 0 / 0.24)`             | idem                                                                            |
| fechado        | —                                                                                                                              | —         | —       | —                                                                                   | `opacity`/`transform: scale()` do `Grow`                                        |

O Popover não tem hover/focus/disabled próprios; quem tem são os itens.

### Medidas

**Paper do dropdown (`paperStyles` com `dropdown: true`)**

| Propriedade                                   | Valor bruto                                                                         | Referência simbólica                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------- |
| `padding`                                     | **4px**                                                                             | `theme.spacing(0.5)`                     |
| `border-radius`                               | **10px**                                                                            | `shape.borderRadius × 1.25`              |
| `box-shadow` (light)                          | `0 0 2px 0 rgba(145 158 171 / 0.24), -20px 20px 40px -4px rgba(145 158 171 / 0.24)` | `customShadows.dropdown`                 |
| `box-shadow` (dark)                           | `0 0 2px 0 rgba(0 0 0 / 0.24), -20px 20px 40px -4px rgba(0 0 0 / 0.24)`             | `customShadows.dropdown` (dark)          |
| `backdrop-filter` / `-webkit-backdrop-filter` | **`blur(20px)`**                                                                    | `paperStyles` default `blur = 20`        |
| `background-color` (light)                    | `rgba(255 255 255 / 0.9)`                                                           | `varAlpha(background.paperChannel, 0.9)` |
| `background-color` (dark)                     | `rgba(28 37 46 / 0.9)`                                                              | idem (dark)                              |
| `background-size`                             | `50%, 50%`                                                                          | `bgGradient`                             |
| `background-repeat`                           | `no-repeat, no-repeat`                                                              | `bgGradient`                             |
| `background-position` (LTR)                   | `top right, left bottom`                                                            | `paperStyles`                            |
| `background-position` (RTL)                   | `top left, right bottom`                                                            | `paperStyles`                            |
| `.MuiList-root` interno                       | `padding-top: 0`, `padding-bottom: 0`                                               | override do projeto (o MUI usaria 8px)   |

**Os dois gradientes SVG (embutidos em base64)**

| #   | Cor                            | Geometria                                                                                                                                                                                                          |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **`#00B8D9`** (rgb(0,184,217)) | SVG 120×120, `<rect>` 120×120 com `fill-opacity="0.1"`, `radialGradient` `gradientTransform="translate(120 1.81812e-05) rotate(-45) scale(123.25)"`, stop 0 = `#00B8D9`, stop 1 = `#00B8D9` com `stop-opacity="0"` |
| 2   | **`#FF5630`** (rgb(255,86,48)) | SVG 120×120, `<rect>` 120×120 com `fill-opacity="0.1"`, `radialGradient` `gradientTransform="translate(0 120) rotate(135) scale(123.25)"`, stop 0 = `#FF5630`, stop 1 = `#FF5630` com `stop-opacity="0"`           |

Resultado visual: um brilho ciano no canto superior direito e um brilho coral no canto inferior esquerdo,
cada um cobrindo 50% × 50% da área do paper, a 10% de opacidade.

**Base herdada do MUI**

| Propriedade                 | Valor bruto                                                |
| --------------------------- | ---------------------------------------------------------- |
| `position`                  | `absolute`                                                 |
| `overflow-y` / `overflow-x` | `auto` / `hidden`                                          |
| `min-width` / `min-height`  | `16px` / `16px`                                            |
| `max-width` / `max-height`  | `calc(100% - 32px)` / `calc(100% - 32px)`                  |
| `outline`                   | `0`                                                        |
| `elevation` (prop)          | `8` — sem efeito visual, pois o `box-shadow` é sobrescrito |
| `max-height` **do Menu**    | `calc(100% - 96px)`                                        |
| `.MuiMenu-list`             | `outline: 0`                                               |

### Regras de uso observadas

- O `padding: 4px` do paper + `margin-bottom: 4px` entre itens + `border-radius: 6px` do item dentro de um
  paper de `border-radius: 10px` formam o encaixe visual: sobram exatamente 4px de "moldura" em volta.
- O blur de 20px é o **dobro** do blur do header (`--layout-header-blur: 8px`) e mais que o triplo do default
  do mixin `bgBlur` (6px). Dropdowns são a superfície mais translúcida do sistema.
- Larguras mínimas de dropdown **não** vêm do DS; cada uso declara a sua. Exemplos no código:
  `NavDropdownPaper` = `min-width: 180px`; menu do DataGrid = `min-width: 140px`;
  popover de conta = `width: 200px`; popover de workspaces = `width: 240px`.

### Origem

| Fato                                                               | Arquivo:linha                                                                             |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `MuiPopover.paper = paperStyles(dropdown: true)`                   | `frontend/src/theme/core/components/popover.tsx:12-15`                                    |
| `MuiList` interno com padding 0                                    | `frontend/src/theme/core/components/popover.tsx:14`                                       |
| mixin `paperStyles` + opções `dropdown`                            | `frontend/src/theme/core/mixins/global-styles-components.ts:79-97` (dropdown em `:91-95`) |
| SVG cyan / red em base64                                           | `frontend/src/theme/core/mixins/global-styles-components.ts:73-74` / `:76-77`             |
| `customShadows.dropdown`                                           | `frontend/src/theme/core/custom-shadows.ts:51`                                            |
| `PopoverPaper` base + `elevation = 8`                              | default MUI 7.0.1 (`node_modules/@mui/material/Popover/Popover.js:77-92`, `:111`)         |
| `MenuPaper = styled(PopoverPaper)` + `maxHeight calc(100% - 96px)` | default MUI 7.0.1 (`node_modules/@mui/material/Menu/Menu.js:51-61`)                       |
| `NavDropdownPaper` `min-width: 180`                                | `frontend/src/components/nav-section/components/nav-dropdown.tsx:8-11`                    |
| menu do DataGrid `min-width: 140`                                  | `frontend/src/theme/core/components/mui-x-data-grid.tsx:177-181`                          |

---

## Tooltip

### Anatomia

```
.MuiTooltip-popper  (z-index 1500)
└── .MuiTooltip-tooltip
      background-color #1C252E · color #FFFFFF · border-radius 8px
      padding 4px 8px · font-size 9,625px · font-weight 500 · max-width 300px
      [.MuiTooltip-arrow]  width 1em · height 0.71em · ::before rotate(45deg)
```

### Variantes e tamanhos

| Variante / prop                | Efeito                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| default                        | `margin: 2px` no tooltip; offsets de 12px por posição (override do projeto)                                                   |
| `arrow`                        | `position: relative`, `margin: 0`; seta com a mesma cor de fundo                                                              |
| `touch` (dispositivo de toque) | `padding: 8px 16px`, `font-size: 0.875rem` = **12,25px**, `line-height: 1.143em`, `font-weight: 400`; offsets sobem para 24px |

### Tabela de estados

| Estado              | Fundo                                                                                   | Texto                        | Borda   | Sombra  | Transição                                                                      |
| ------------------- | --------------------------------------------------------------------------------------- | ---------------------------- | ------- | ------- | ------------------------------------------------------------------------------ |
| visível (light)     | **`#1C252E`** (rgb(28,37,46)) — opaco                                                   | `#FFFFFF` (rgb(255,255,255)) | nenhuma | nenhuma | `Grow` do MUI: entrada `225ms` / saída `195ms`, `cubic-bezier(0.4, 0, 0.2, 1)` |
| visível (dark)      | **`#454F5B`** (rgb(69,79,91)) — opaco                                                   | `#FFFFFF`                    | nenhuma | nenhuma | idem                                                                           |
| seta (light / dark) | `color: #1C252E` / `color: #454F5B` (o `::before` usa `background-color: currentColor`) | —                            | —       | —       | —                                                                              |
| oculto              | —                                                                                       | —                            | —       | —       | `opacity 0` + `transform: scale(0.x)`                                          |

> O MUI usaria `rgba(69, 79, 91, 0.92)` (grey.700 a 92%). O projeto troca por **cores opacas**:
> `grey.800` no light e `grey.700` no dark.

### Medidas

**Do projeto (overrides)**

| Propriedade                         | Valor bruto               | Referência simbólica    |
| ----------------------------------- | ------------------------- | ----------------------- |
| `background-color` (light)          | `#1C252E` → rgb(28,37,46) | `grey.800`              |
| `background-color` (dark)           | `#454F5B` → rgb(69,79,91) | `grey.700`              |
| cor da seta (light / dark)          | `#1C252E` / `#454F5B`     | `grey.800` / `grey.700` |
| offset quando `placement*="bottom"` | `margin-top: **12px**`    | valor literal           |
| offset quando `placement*="top"`    | `margin-bottom: **12px**` | valor literal           |
| offset quando `placement*="right"`  | `margin-left: **12px**`   | valor literal           |
| offset quando `placement*="left"`   | `margin-right: **12px**`  | valor literal           |

Os offsets do projeto são declarados no slot `popper` com o seletor
`&.MuiTooltip-popper[data-popper-placement*="…"] .MuiTooltip-tooltip` → especificidade **(0,4,0)**.
Os do MUI (14px) estão no slot `tooltip` com `.MuiTooltip-popper[data-popper-placement*="…"] &` →
especificidade **(0,3,0)**. Logo os **12px do projeto vencem** os 14px do MUI.

**Defaults do MUI 7.0.1 que permanecem**

| Propriedade              | Valor bruto                                                                                                                                                                    | Referência simbólica    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| `border-radius`          | **8px**                                                                                                                                                                        | `shape.borderRadius`    |
| `color`                  | `#FFFFFF`                                                                                                                                                                      | `palette.common.white`  |
| `padding`                | **`4px 8px`**                                                                                                                                                                  | literal                 |
| `font-size`              | `0.6875rem` = **9,625px**                                                                                                                                                      | `pxToRem(11)`           |
| `font-weight`            | **500**                                                                                                                                                                        | `fontWeightMedium`      |
| `font-family`            | `"Public Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"` | `typography.fontFamily` |
| `max-width`              | **300px**                                                                                                                                                                      | literal                 |
| `margin`                 | **2px** (0 quando `arrow`)                                                                                                                                                     | literal                 |
| `word-wrap`              | `break-word`                                                                                                                                                                   | literal                 |
| `transform-origin`       | `right center` (left) · `left center` (right) · `center bottom` (top) · `center top` (bottom)                                                                                  | literal                 |
| seta: `width` / `height` | `1em` / `0.71em` (≈ 9,625px / 6,83px com `font-size` 9,625px)                                                                                                                  | literal                 |
| seta: `::before`         | `content:""`, `width/height 100%`, `background-color: currentColor`, `transform: rotate(45deg)`                                                                                | literal                 |
| `touch`: `padding`       | `8px 16px`                                                                                                                                                                     | literal                 |
| `touch`: `font-size`     | `0.875rem` = **12,25px**                                                                                                                                                       | `pxToRem(14)`           |
| `touch`: `line-height`   | `1.143em` (`round(16/14)`)                                                                                                                                                     | literal                 |
| `touch`: `font-weight`   | **400**                                                                                                                                                                        | `fontWeightRegular`     |
| `z-index`                | **1500**                                                                                                                                                                       | `zIndex.tooltip`        |

### Regras de uso observadas

- O tooltip é o **menor texto do sistema** (9,625px) — menor que `caption` (10,5px). É deliberadamente
  discreto e nunca deve carregar informação essencial.
- Fundo **opaco** (não translúcido) é uma escolha do projeto: garante legibilidade sobre qualquer superfície,
  inclusive sobre os dropdowns com blur.
- O offset uniforme de 12px em todas as direções substitui os 14px assimétricos do MUI, alinhando o tooltip à
  escala de espaçamento do sistema (múltiplos de 4).
- Tooltips com `arrow` perdem o `margin: 2px` (viram `margin: 0`), mas mantêm os 12px de offset direcional.

### Origem

| Fato                                                                                                              | Arquivo:linha                                                                           |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `tooltip` bg `grey[800]` light / `grey[700]` dark                                                                 | `frontend/src/theme/core/components/tooltip.tsx:12-17`                                  |
| `arrow` color `grey[800]` / `grey[700]`                                                                           | `frontend/src/theme/core/components/tooltip.tsx:18-23`                                  |
| offsets de 12px (bottom/top/right/left)                                                                           | `frontend/src/theme/core/components/tooltip.tsx:24-37` (`:26`, `:29`, `:32`, `:35`)     |
| base: bg `Tooltip.bg`, radius, color, padding `4px 8px`, `pxToRem(11)`, `maxWidth 300`, `margin 2`, weight medium | default MUI 7.0.1 (`node_modules/@mui/material/Tooltip/Tooltip.js:168-177`)             |
| base: offsets 14px por placement                                                                                  | default MUI 7.0.1 (`node_modules/@mui/material/Tooltip/Tooltip.js:186-190`, `:215-220`) |
| base: variante `arrow` (`margin: 0`)                                                                              | default MUI 7.0.1 (`node_modules/@mui/material/Tooltip/Tooltip.js:192-199`)             |
| base: variante `touch`                                                                                            | default MUI 7.0.1 (`node_modules/@mui/material/Tooltip/Tooltip.js:200-209`)             |
| base: slot `arrow` (1em / 0.71em / rotate 45deg)                                                                  | default MUI 7.0.1 (`node_modules/@mui/material/Tooltip/Tooltip.js:278-300`)             |
| `grey.700 = #454F5B`, `grey.800 = #1C252E`                                                                        | `frontend/src/theme/theme-config.ts:96-107`                                             |
| `z-index tooltip 1500`                                                                                            | default MUI, sem override (`.ds-extract/FATOS.md` §5.4)                                 |

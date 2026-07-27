# Botão

`MuiButton` + `MuiButtonBase`.

> **Base de conversão**: `html { font-size: 14px }` → `px_real = rem × 14`.
> Valores em `px` puro escritos no tema **não** escalam.
> Fonte: `FATOS.md` §1; `src/components/settings/settings-config.ts:18`; `src/theme/with-settings/update-components.ts:54-59`.

---

## Anatomia

| Parte                | Classe                                    | O que é                                                                                                                                                                                                                                                                |
| -------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| root                 | `.MuiButton-root` / `.MuiButtonBase-root` | `<button>` (`component = 'button'`), `display: inline-flex`, `align-items: center`, `justify-content: center`, `position: relative`, `box-sizing: border-box`, `cursor: pointer`, `user-select: none`, `vertical-align: middle`, `outline: 0`, `text-decoration: none` |
| rótulo               | (children direto)                         | não há elemento próprio; o texto é filho direto do root                                                                                                                                                                                                                |
| ícone inicial        | `.MuiButton-startIcon`                    | `<span>`, `display: inherit`, `margin-right: 8px`, `margin-left: -4px` (size `small`: `-2px`)                                                                                                                                                                          |
| ícone final          | `.MuiButton-endIcon`                      | `<span>`, `display: inherit`, `margin-left: 8px`, `margin-right: -4px` (size `small`: `-2px`)                                                                                                                                                                          |
| indicador de loading | `.MuiButton-loadingIndicator`             | `<span>`, `position: absolute`, `display: none` → `flex` quando `loading`                                                                                                                                                                                              |
| wrapper de loading   | `.MuiButton-loadingWrapper`               | `<span style="display: contents">`                                                                                                                                                                                                                                     |
| placeholder de ícone | `.MuiButton-loadingIconPlaceholder`       | `<span>`, `display: inline-block`, `width: 1em`, `height: 1em`                                                                                                                                                                                                         |
| ripple               | `.MuiTouchRipple-root`                    | do `ButtonBase` (não desabilitado no projeto)                                                                                                                                                                                                                          |

O tamanho do ícone dentro de `startIcon`/`endIcon` é aplicado no **primeiro filho**
(`& > *:nth-of-type(1)`): `18px` (small), `20px` (medium), `22px` (large) — valores em px puro,
`default MUI 7.0.1 (node_modules/@mui/material/Button/Button.js:54-81)`.
⚠️ O wrapper `Iconify` do projeto força `width: 20px` (`src/components/iconify/iconify.tsx:21,44-46`),
então ícones Iconify ignoram essa escala e ficam **20×20px** em qualquer size.

---

## Variantes e tamanhos

### Variantes

| Variante    | Origem                                                                        | Existe no MUI puro?      |
| ----------- | ----------------------------------------------------------------------------- | ------------------------ |
| `contained` | MUI + override do projeto                                                     | sim                      |
| `outlined`  | MUI + override do projeto                                                     | sim                      |
| `text`      | MUI + override do projeto                                                     | sim (é o default do MUI) |
| **`soft`**  | **criada pelo projeto** (`src/theme/core/components/button.tsx:19-21, 46-71`) | **não**                  |

⚠️ **`variant` não tem default no tema**: permanece o default do MUI = `text`
(`default MUI 7.0.1 (node_modules/@mui/material/Button/Button.js:508)`).

### Cores

`inherit` (**default do projeto**) + `primary` + `secondary` + `info` + `success` + `warning` + `error`.

- `defaultProps: { color: 'inherit', disableElevation: true }` — `src/theme/core/components/button.tsx:84`.
  ⚠️ Isso **muda o default do MUI**, que é `color: 'primary'`
  (`default MUI 7.0.1 (node_modules/@mui/material/Button/Button.js:492)`).
- A lista de cores tratada pelos overrides é fechada:
  `['primary','secondary','info','success','warning','error']` (`button.tsx:25`).

### Tamanhos

`small` | `medium` (**default**, `default MUI 7.0.1 (Button.js:505)`) | `large`.

---

## Medidas

### Tabela medida em runtime (Chrome, viewport 1911×898, light) — `FATOS.md` §10.1

| size   | variant        | height   | padding X | font-size            | line-height |
| ------ | -------------- | -------- | --------- | -------------------- | ----------- |
| small  | contained/soft | 30px     | 8px       | 11,375px (0.8125rem) | 19,5px      |
| small  | outlined       | 30px     | 8px       | 11,375px             | 19,5px      |
| small  | text           | 30px     | 4px       | 11,375px             | 19,5px      |
| medium | contained/soft | **33px** | 12px      | 12,25px (0.875rem)   | 21px        |
| medium | outlined       | **33px** | 12px      | 12,25px              | 21px        |
| medium | text           | **33px** | 8px       | 12,25px              | 21px        |
| large  | contained/soft | 48px     | 16px      | 13,125px (0.9375rem) | 22,5px      |
| large  | text           | 48px     | 10px      | 13,125px             | 22,5px      |

⚠️ **`large` + `outlined` não consta na medição de runtime** — `NÃO CONFIRMADO` empiricamente.
Por leitura do fonte: `height: 48px` + `padding-left/right: 16px` (`button.tsx:163-168`),
`font-size: 0.9375rem = 13,125px`, `padding vertical: 7px` e `border: 1px`
(`default MUI 7.0.1 (Button.js:224-232)`).

### Composição aritmética das alturas

Só `small` (30px) e `large` (48px) têm `height` declarada (`src/theme/core/components/button.tsx:153,164`).
**`medium` não tem altura declarada** — os 33px são resultado de soma:

| Cálculo                                             | Valor    |
| --------------------------------------------------- | -------- |
| padding-top (MUI root `padding: '6px 16px'`)        | 6px      |
| line-height (`typography.button` = 24/14 × 12,25px) | 21px     |
| padding-bottom                                      | 6px      |
| **total medium `contained`/`text`/`soft`**          | **33px** |
| medium `outlined`: 5px + 21px + 5px + borda 1px×2   | **33px** |

Origem do padding vertical (não sobrescrito pelo projeto), `default MUI 7.0.1`:

| Combinação            | padding declarado                  | Arquivo:linha                                     |
| --------------------- | ---------------------------------- | ------------------------------------------------- |
| root (qualquer)       | `6px 16px`                         | `node_modules/@mui/material/Button/Button.js:100` |
| `outlined`            | `5px 15px` + `border: 1px solid`   | `Button.js:144-145`                               |
| `text`                | `6px 8px`                          | `Button.js:158`                                   |
| `small` + `text`      | `4px 5px`, `font-size: 0.8125rem`  | `Button.js:197-205`                               |
| `large` + `text`      | `8px 11px`, `font-size: 0.9375rem` | `Button.js:206-214`                               |
| `small` + `outlined`  | `3px 9px`, `font-size: 0.8125rem`  | `Button.js:215-223`                               |
| `large` + `outlined`  | `7px 21px`, `font-size: 0.9375rem` | `Button.js:224-232`                               |
| `small` + `contained` | `4px 10px`, `font-size: 0.8125rem` | `Button.js:233-241`                               |
| `large` + `contained` | `8px 22px`, `font-size: 0.9375rem` | `Button.js:242-250`                               |

O projeto **só** sobrescreve `paddingLeft`/`paddingRight` e `height`
(`src/theme/core/components/button.tsx:152-168`) — o padding vertical do MUI permanece.

⚠️ **Divergência não resolvida sobre a variante `soft`**: `soft` não casa com nenhuma regra
`{ size, variant }` do MUI (que só reconhece `text`/`outlined`/`contained`), logo, por leitura do
fonte, o `font-size` de `soft` deveria ser `0.875rem = 12,25px` **em todos os tamanhos**, e o padding
vertical deveria ser sempre `6px` (root). A medição da §10.1 agrupa a linha como
"contained/soft" com `11,375px` em `small` e `13,125px` em `large`.
**`⚠️ NÃO CONFIRMADO`** qual dos dois vale para `soft` small/large — a medição pode ser um
agrupamento de linha, não uma medição individual do `soft`.

### Outras medidas

| Propriedade                         | Valor bruto                                                                                                                                                                    | Referência simbólica                       | Origem                                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `border-radius`                     | `8px`                                                                                                                                                                          | `shape.borderRadius`                       | `src/theme/create-theme.ts:35` / `default MUI 7.0.1 (Button.js:102)`                                                                               |
| `min-width`                         | `64px`                                                                                                                                                                         | —                                          | `default MUI 7.0.1 (Button.js:99)`                                                                                                                 |
| `min-width` dentro de `ButtonGroup` | `40px`                                                                                                                                                                         | —                                          | `default MUI 7.0.1 (node_modules/@mui/material/ButtonGroup/ButtonGroup.js:230-231)`                                                                |
| `border` (root)                     | `0`                                                                                                                                                                            | —                                          | `default MUI 7.0.1 (Button.js:101)`                                                                                                                |
| `border` (`outlined`)               | `1px solid`                                                                                                                                                                    | —                                          | `default MUI 7.0.1 (Button.js:145)`                                                                                                                |
| `box-shadow` (repouso)              | `none`                                                                                                                                                                         | `disableElevation: true`                   | `src/theme/core/components/button.tsx:84` + `default MUI 7.0.1 (Button.js:251-269)`                                                                |
| `text-transform`                    | `none`                                                                                                                                                                         | `typography.button.textTransform: 'unset'` | `src/theme/core/typography.ts:121-126`                                                                                                             |
| `font-weight`                       | `700`                                                                                                                                                                          | `typography.button.fontWeight`             | `src/theme/core/typography.ts:121-126`                                                                                                             |
| `font-family`                       | `"Public Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"` | `typography.fontFamily`                    | `src/theme/core/components/button.tsx:44` (`MuiButtonBase.root`)                                                                                   |
| `transition`                        | `background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`              | `duration.short`, `easing.easeInOut`       | `default MUI 7.0.1 (Button.js:277-288)` — a variante `loadingPosition: 'center'` (default, `Button.js:504`) **re-declara** a transição sem `color` |

⚠️ Na página de demonstração `/components/mui/buttons` o texto aparece em `capitalize`;
isso vem **só da demo** (`src/sections/_examples/mui/button-view/view.tsx:21-22`), não do design system.

---

## Tabela de estados

Legenda de cores usadas abaixo (`FATOS.md` §3):
`grey.500 = #919EAB = rgb(145,158,171)` · `grey.700 = #454F5B` · `grey.800 = #1C252E` ·
`text.primary = #1C252E` · `action.hover = rgba(145 158 171 / 0.08)` ·
`action.disabled = rgba(145 158 171 / 0.8)` · `action.disabledBackground = rgba(145 158 171 / 0.24)`.

### `contained` — cor `inherit` (default do projeto)

| Estado         | Fundo                      | Texto                      | Borda           | Sombra                                                       | Transição                          |
| -------------- | -------------------------- | -------------------------- | --------------- | ------------------------------------------------------------ | ---------------------------------- |
| default        | `#1C252E` rgb(28,37,46)    | `#FFFFFF` rgb(255,255,255) | `0` (sem borda) | `none`                                                       | 250ms cubic-bezier(0.4, 0, 0.2, 1) |
| hover          | `#454F5B` rgb(69,79,91)    | `#FFFFFF`                  | `0`             | `0 8px 16px 0 rgba(145 158 171 / 0.16)` (`customShadows.z8`) | idem                               |
| focus-visible  | igual ao default           | igual                      | `0`             | `none` (anulado por `disableElevation`)                      | idem                               |
| active/pressed | igual ao default           | igual                      | `0`             | `none` (anulado por `disableElevation`)                      | idem                               |
| disabled       | `rgba(145 158 171 / 0.24)` | `rgba(145 158 171 / 0.8)`  | `0`             | `none`                                                       | idem                               |

Origem: `src/theme/core/components/button.tsx:95-110`; disabled em `default MUI 7.0.1 (Button.js:133-137)`.
Modo dark: texto `#1C252E`, fundo `#FFFFFF`, hover fundo `#C4CDD5` (`button.tsx:104-108`).

### `contained` — cores de paleta

| Estado                 | Fundo                                                                     | Texto                     | Borda | Sombra                 | Transição                          |
| ---------------------- | ------------------------------------------------------------------------- | ------------------------- | ----- | ---------------------- | ---------------------------------- |
| default                | `<cor>.main`                                                              | `<cor>.contrastText`      | `0`   | `none`                 | 250ms cubic-bezier(0.4, 0, 0.2, 1) |
| hover                  | `<cor>.dark` (via `--variant-containedBg`, só em `@media (hover: hover)`) | idem                      | `0`   | `customShadows[<cor>]` | idem                               |
| focus-visible / active | igual ao default                                                          | idem                      | `0`   | `none`                 | idem                               |
| disabled               | `rgba(145 158 171 / 0.24)`                                                | `rgba(145 158 171 / 0.8)` | `0`   | `none`                 | idem                               |

Valores concretos por cor:

| Cor       | Fundo default             | Texto                   | Fundo hover              | Sombra hover                           |
| --------- | ------------------------- | ----------------------- | ------------------------ | -------------------------------------- |
| primary   | `#00A76F` rgb(0,167,111)  | `#FFFFFF`               | `#007867` rgb(0,120,103) | `0 8px 16px 0 rgba(0 167 111 / 0.24)`  |
| secondary | `#8E33FF` rgb(142,51,255) | `#FFFFFF`               | `#5119B7` rgb(81,25,183) | `0 8px 16px 0 rgba(142 51 255 / 0.24)` |
| info      | `#00B8D9` rgb(0,184,217)  | `#FFFFFF`               | `#006C9C` rgb(0,108,156) | `0 8px 16px 0 rgba(0 184 217 / 0.24)`  |
| success   | `#22C55E` rgb(34,197,94)  | `#ffffff`               | `#118D57` rgb(17,141,87) | `0 8px 16px 0 rgba(34 197 94 / 0.24)`  |
| warning   | `#FFAB00` rgb(255,171,0)  | `#1C252E` rgb(28,37,46) | `#B76E00` rgb(183,110,0) | `0 8px 16px 0 rgba(255 171 0 / 0.24)`  |
| error     | `#FF5630` rgb(255,86,48)  | `#FFFFFF`               | `#B71D18` rgb(183,29,24) | `0 8px 16px 0 rgba(255 86 48 / 0.24)`  |

Origem: sombra de hover em `src/theme/core/components/button.tsx:90-94`;
fundo/texto/hover-bg em `default MUI 7.0.1 (Button.js:162-181)`;
`customShadows` em `src/theme/core/custom-shadows.ts:36-58`.

### `outlined`

| Estado                  | Fundo                                                                         | Texto                      | Borda                                               | Sombra                          | Transição                          |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------- | ------------------------------- | ---------------------------------- |
| default (cor de paleta) | `transparent`                                                                 | `<cor>.main`               | `1px solid rgba(<canal main> / 0.48)`               | `none`                          | 250ms cubic-bezier(0.4, 0, 0.2, 1) |
| hover (cor de paleta)   | `rgba(<canal main> / 0.08)` (`--variant-outlinedBg`, `@media (hover: hover)`) | `<cor>.main`               | `1px solid currentColor`                            | **`0 0 0 0.75px currentColor`** | idem                               |
| default (`inherit`)     | `transparent`                                                                 | herdada (`color: inherit`) | `1px solid rgba(145 158 171 / 0.32)`                | `none`                          | idem                               |
| hover (`inherit`)       | `rgba(145 158 171 / 0.08)` (`action.hover`)                                   | herdada                    | `1px solid rgba(145 158 171 / 0.32)` (**não muda**) | **`none`**                      | idem                               |
| focus-visible           | igual ao default                                                              | idem                       | idem                                                | `none`                          | idem                               |
| disabled                | `transparent`                                                                 | `rgba(145 158 171 / 0.8)`  | `1px solid rgba(145 158 171 / 0.24)`                | `none`                          | idem                               |

Bordas por cor (`varAlpha(<canal>, 0.48)`):

| Cor       | Borda default                        |
| --------- | ------------------------------------ |
| primary   | `1px solid rgba(0 167 111 / 0.48)`   |
| secondary | `1px solid rgba(142 51 255 / 0.48)`  |
| info      | `1px solid rgba(0 184 217 / 0.48)`   |
| success   | `1px solid rgba(34 197 94 / 0.48)`   |
| warning   | `1px solid rgba(255 171 0 / 0.48)`   |
| error     | `1px solid rgba(255 86 48 / 0.48)`   |
| inherit   | `1px solid rgba(145 158 171 / 0.32)` |

⚠️ **Assimetria real do código**: o override devolve
`{ ...styled.base, ...styled.inheritColor, ...styled.colors }` (`src/theme/core/components/button.tsx:133`).
Como o spread é raso, quando `color === 'inherit'` o objeto `'&:hover'` de `inheritColor`
(`button.tsx:126`) **substitui inteiro** o `'&:hover'` de `base` (`button.tsx:130`).
Resultado: o anel `box-shadow: 0 0 0 0.75px currentColor` e o `border-color: currentColor`
**só existem nas 6 cores de paleta**, nunca em `inherit`.

Origem: `src/theme/core/components/button.tsx:117-134`; disabled em `default MUI 7.0.1 (Button.js:149-151)`.

### `text`

| Estado                  | Fundo                                                                     | Texto                     | Borda | Sombra | Transição                          |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------- | ----- | ------ | ---------------------------------- |
| default (cor de paleta) | `transparent`                                                             | `<cor>.main`              | `0`   | `none` | 250ms cubic-bezier(0.4, 0, 0.2, 1) |
| hover (cor de paleta)   | `rgba(<canal main> / 0.08)` (`--variant-textBg`, `@media (hover: hover)`) | `<cor>.main`              | `0`   | `none` | idem                               |
| default (`inherit`)     | `transparent`                                                             | herdada                   | `0`   | `none` | idem                               |
| hover (`inherit`)       | `rgba(145 158 171 / 0.08)` (`action.hover`)                               | herdada                   | `0`   | `none` | idem                               |
| disabled                | `transparent`                                                             | `rgba(145 158 171 / 0.8)` | `0`   | `none` | idem                               |

Origem: `src/theme/core/components/button.tsx:138-148`; hover de paleta em `default MUI 7.0.1 (Button.js:172-179)`.

### `soft` (variante do projeto)

| Estado                        | Fundo                                                    | Texto                     | Borda | Sombra | Transição                          |
| ----------------------------- | -------------------------------------------------------- | ------------------------- | ----- | ------ | ---------------------------------- |
| default (cor de paleta)       | `rgba(<canal main> / 0.16)`                              | `<cor>.dark`              | `0`   | `none` | 250ms cubic-bezier(0.4, 0, 0.2, 1) |
| hover (cor de paleta)         | `rgba(<canal main> / 0.32)`                              | `<cor>.dark`              | `0`   | `none` | idem                               |
| default (`inherit`/`default`) | `rgba(145 158 171 / 0.08)`                               | herdada                   | `0`   | `none` | idem                               |
| hover (`inherit`/`default`)   | `rgba(145 158 171 / 0.24)`                               | herdada                   | `0`   | `none` | idem                               |
| disabled                      | `rgba(145 158 171 / 0.24)` (`action.disabledBackground`) | `rgba(145 158 171 / 0.8)` | `0`   | `none` | idem                               |

Valores concretos:

| Cor               | Fundo default              | Texto     | Fundo hover                |
| ----------------- | -------------------------- | --------- | -------------------------- |
| primary           | `rgba(0 167 111 / 0.16)`   | `#007867` | `rgba(0 167 111 / 0.32)`   |
| secondary         | `rgba(142 51 255 / 0.16)`  | `#5119B7` | `rgba(142 51 255 / 0.32)`  |
| info              | `rgba(0 184 217 / 0.16)`   | `#006C9C` | `rgba(0 184 217 / 0.32)`   |
| success           | `rgba(34 197 94 / 0.16)`   | `#118D57` | `rgba(34 197 94 / 0.32)`   |
| warning           | `rgba(255 171 0 / 0.16)`   | `#B76E00` | `rgba(255 171 0 / 0.32)`   |
| error             | `rgba(255 86 48 / 0.16)`   | `#B71D18` | `rgba(255 86 48 / 0.32)`   |
| inherit / default | `rgba(145 158 171 / 0.08)` | herdada   | `rgba(145 158 171 / 0.24)` |

Modo dark: o texto passa de `<cor>.dark` para `<cor>.light` (`src/theme/core/components/button.tsx:57-59`).

Origem: `src/theme/core/components/button.tsx:49-74, 86`.

### Estado `loading`

| Aspecto                                             | Valor                                                                | Origem                                           |
| --------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| indicador default                                   | `CircularProgress` com `size={16}` e `color="inherit"`               | `default MUI 7.0.1 (Button.js:512-516)`          |
| `loadingPosition` default                           | `center`                                                             | `default MUI 7.0.1 (Button.js:504)`              |
| texto quando `loading` + `loadingPosition="center"` | `color: transparent`                                                 | `default MUI 7.0.1 (Button.js:285-287)`          |
| cor do indicador em `center`                        | `rgba(145 158 171 / 0.8)` (`action.disabled`)                        | `default MUI 7.0.1 (Button.js:420-428)`          |
| posição em `center`                                 | `left: 50%`, `transform: translate(-50%)`                            | `default MUI 7.0.1 (Button.js:424-426)`          |
| posição em `start`                                  | `left: 14px` (size small: `10px`; variant `text`: `6px`)             | `default MUI 7.0.1 (Button.js:397-419)`          |
| posição em `end`                                    | `right: 14px` (size small: `10px`; variant `text`: `6px`)            | `default MUI 7.0.1 (Button.js:429-451)`          |
| ícone com `loadingPosition` correspondente          | `opacity: 0`, transição `opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)` | `default MUI 7.0.1 (Button.js:314-324, 358-368)` |

⚠️ O projeto **não customiza** nenhum aspecto do estado `loading` — tudo é default MUI 7.0.1.

### Estados sem customização no projeto

| Estado             | Comportamento                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `focus-visible`    | O MUI zera a sombra de foco por causa de `disableElevation: true` (`Button.js:260-262`). O `ButtonBase` **não** aplica outline próprio (`outline: 0`, `default MUI 7.0.1 (node_modules/@mui/material/ButtonBase/ButtonBase.js:55)`). ⚠️ **Não há indicador visual de foco por teclado além do ripple** — `⚠️ NÃO CONFIRMADO` se existe algum estilo global de `:focus-visible` fora do tema. |
| `active`/pressed   | Sem estilo próprio; `disableElevation: true` zera a sombra de `:active` (`Button.js:263-265`). O feedback visual é o `TouchRipple`.                                                                                                                                                                                                                                                          |
| `selected`         | **Não existe** em `MuiButton` (é conceito de `ToggleButton`).                                                                                                                                                                                                                                                                                                                                |
| `error`            | **Não existe** em `MuiButton` (usa-se `color="error"`).                                                                                                                                                                                                                                                                                                                                      |
| disabled (pointer) | `pointer-events: none`, `cursor: default` — `default MUI 7.0.1 (ButtonBase.js:75-79)`                                                                                                                                                                                                                                                                                                        |

---

## Regras de uso observadas

1. **A cor padrão é `inherit`, não `primary`.** Qualquer botão sem `color` explícito herda a cor do
   contexto; em `contained` isso resulta em fundo `#1C252E` (quase-preto) com texto branco.
   (`src/theme/core/components/button.tsx:84`)
2. **Elevação desligada globalmente** (`disableElevation: true`): botões não têm sombra em repouso,
   foco ou pressionado. A única sombra existente é a de **hover**, e só em `contained` — colorida por
   `customShadows[<cor>]` (cores de paleta) ou `customShadows.z8` (cor `inherit`).
3. **O anel de foco/hover do `outlined` é `box-shadow: 0 0 0 0.75px currentColor`**, um "engrossamento"
   de borda sem alterar o layout (sombra não ocupa espaço). Só nas 6 cores de paleta.
4. **`soft` é o preenchimento fraco do projeto**: fundo em 16% da cor, texto na variação `dark`
   (light) ou `light` (dark). Mesmos alfas usados em `MuiChip` variant `soft`, `MuiFab` variant `soft`
   e `MuiPagination` variant `soft`.
5. **`text-transform: none`**: o rótulo respeita o texto escrito (vem de `typography.button`).
6. **Altura só é fixada em `small` e `large`.** `medium` "flutua" conforme padding e line-height
   (33px hoje). Reproduzir em outra biblioteca exige replicar a soma, não fixar 33px cegamente —
   ou fixar 33px e aceitar a divergência se a tipografia mudar.
7. **`MuiButtonBase` só serve para forçar a família tipográfica** em todos os descendentes de
   `ButtonBase` (Button, IconButton, Fab, ToggleButton, MenuItem, Tab, Checkbox, Radio, Switch…).

---

## Origem

| Item                                                                                    | Arquivo:linha                                                          |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `MuiButtonBase.styleOverrides.root` (font-family)                                       | `src/theme/core/components/button.tsx:44`                              |
| Lista de cores tratadas                                                                 | `src/theme/core/components/button.tsx:25`                              |
| Helper `styleColors`                                                                    | `src/theme/core/components/button.tsx:27-36`                           |
| Variante `soft` — tipo                                                                  | `src/theme/core/components/button.tsx:15-17`                           |
| Variante `soft` — cores                                                                 | `src/theme/core/components/button.tsx:49-61`                           |
| Variante `soft` — base + disabled                                                       | `src/theme/core/components/button.tsx:62-73`                           |
| `defaultProps` (`color: 'inherit'`, `disableElevation: true`)                           | `src/theme/core/components/button.tsx:84`                              |
| Registro das variantes no root                                                          | `src/theme/core/components/button.tsx:86`                              |
| `contained` (hover shadow + cor inherit)                                                | `src/theme/core/components/button.tsx:90-113`                          |
| `outlined` (bordas + anel de hover)                                                     | `src/theme/core/components/button.tsx:117-134`                         |
| `text` (hover de `inherit`)                                                             | `src/theme/core/components/button.tsx:138-148`                         |
| `sizeSmall` (height 30 + padding X)                                                     | `src/theme/core/components/button.tsx:152-157`                         |
| `sizeMedium` (padding X)                                                                | `src/theme/core/components/button.tsx:158-162`                         |
| `sizeLarge` (height 48 + padding X)                                                     | `src/theme/core/components/button.tsx:163-168`                         |
| Export                                                                                  | `src/theme/core/components/button.tsx:174`                             |
| `shape.borderRadius = 8`                                                                | `src/theme/create-theme.ts:35`                                         |
| `typography.button`                                                                     | `src/theme/core/typography.ts:121-126`                                 |
| `customShadows` (z8 + coloridas)                                                        | `src/theme/core/custom-shadows.ts:36-58`                               |
| Paleta (main/dark/contrastText)                                                         | `src/theme/theme-config.ts:47-109`                                     |
| `action.*` (`hover`, `selected`, `focus`, `disabled`, `disabledBackground`, opacidades) | `src/theme/core/palette.ts:103-111`                                    |
| `action.active` (light `grey.600` / dark `grey.500`)                                    | `src/theme/core/palette.ts:114-117`                                    |
| Medições de runtime                                                                     | `frontend/.ds-extract/FATOS.md` §10.1                                  |
| Defaults do MUI (root, variants, sizes, loading)                                        | `node_modules/@mui/material/Button/Button.js:92-291, 292-480, 481-516` |
| Defaults do MUI (`ButtonBase` root)                                                     | `node_modules/@mui/material/ButtonBase/ButtonBase.js:41-83`            |

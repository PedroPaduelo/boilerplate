# Grupo de botões e botão de alternância

`MuiButtonGroup` (incl. variante `soft` do projeto) + `MuiToggleButton` + `MuiToggleButtonGroup`.

> **Base de conversão**: `html { font-size: 14px }` → `px_real = rem × 14` (`FATOS.md` §1).

---

# ButtonGroup

## Anatomia

| Parte               | Classe                         | O que é                                                                       |
| ------------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| root                | `.MuiButtonGroup-root`         | `<div>` (`component = 'div'`), `display: inline-flex`, `border-radius: 8px`   |
| botão agrupado      | `.MuiButtonGroup-grouped`      | classe injetada em cada `Button` filho; `min-width: 40px`, `box-shadow: none` |
| primeiro            | `.MuiButtonGroup-firstButton`  | só existe se houver **mais de um** filho                                      |
| do meio             | `.MuiButtonGroup-middleButton` | idem                                                                          |
| último              | `.MuiButtonGroup-lastButton`   | idem                                                                          |
| orientação vertical | `.MuiButtonGroup-vertical`     | `flex-direction: column`                                                      |
| desabilitado        | `.MuiButtonGroup-disabled`     | aplicado ao filho quando `disabled`                                           |

Origem das classes e do root: `default MUI 7.0.1 (node_modules/@mui/material/ButtonGroup/ButtonGroup.js:57-64, 66-74, 230-241)`.

## Variantes e tamanhos

| Variante    | Origem                                                                              | Default?                                           |
| ----------- | ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| `outlined`  | MUI + override do projeto                                                           | **sim** (`default MUI 7.0.1 (ButtonGroup.js:260)`) |
| `contained` | MUI + override do projeto                                                           | não                                                |
| `text`      | MUI + override do projeto                                                           | não                                                |
| **`soft`**  | **criada pelo projeto** (`src/theme/core/components/button-group.tsx:15-17, 40-83`) | não                                                |

- Orientações: `horizontal` (default) e `vertical` (`default MUI 7.0.1 (ButtonGroup.js:258)`).
- Tamanhos: `small` | `medium` (default) | `large` — repassados a cada `Button` filho via contexto.
- Cores: `inherit` + as 6 de paleta.

⚠️ **A cor default dentro de um `ButtonGroup` é `primary`, não `inherit`.**
O `Button` resolve props na ordem `inProps > contextProps > themeDefaultProps`
(`default MUI 7.0.1 (node_modules/@mui/material/Button/Button.js:482-489)`), e o `ButtonGroup`
injeta `color = 'primary'` no contexto (`default MUI 7.0.1 (ButtonGroup.js:251, 277-287)`).
Ou seja, o `defaultProps: { color: 'inherit' }` de `MuiButton` **é ignorado** dentro do grupo.

## Medidas

| Propriedade                          | Valor bruto                                                                                                                                            | Origem                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `border-radius` do root              | `8px`                                                                                                                                                  | `shape.borderRadius` — `src/theme/create-theme.ts:35` / `default MUI 7.0.1 (ButtonGroup.js:74)`                                                 |
| `min-width` de cada botão            | `40px`                                                                                                                                                 | `default MUI 7.0.1 (ButtonGroup.js:230-231)`                                                                                                    |
| `box-shadow` de cada botão           | `none`                                                                                                                                                 | `default MUI 7.0.1 (ButtonGroup.js:232)`                                                                                                        |
| `box-shadow` do root                 | `none`                                                                                                                                                 | `defaultProps: { disableElevation: true }` — `src/theme/core/components/button-group.tsx:91` (sem isso seria `shadows[2]`, `ButtonGroup.js:80`) |
| sobreposição horizontal (`outlined`) | `margin-left: -1px` no do meio e no último                                                                                                             | `default MUI 7.0.1 (ButtonGroup.js:173-175)`                                                                                                    |
| sobreposição vertical (`outlined`)   | `margin-top: -1px` no do meio e no último                                                                                                              | `default MUI 7.0.1 (ButtonGroup.js:189-191)`                                                                                                    |
| cantos — horizontal                  | primeiro/meio: `border-top-right-radius: 0`, `border-bottom-right-radius: 0`; último/meio: `border-top-left-radius: 0`, `border-bottom-left-radius: 0` | `default MUI 7.0.1 (ButtonGroup.js:111-124)`                                                                                                    |
| cantos — vertical                    | último/meio: `border-top-right-radius: 0`, `border-top-left-radius: 0`; primeiro/meio: `border-bottom-*-radius: 0`                                     | `default MUI 7.0.1 (ButtonGroup.js:96-110)`                                                                                                     |

Altura, padding e tipografia de cada botão são os de `MuiButton` — ver `botao.md`.

## Tabela de estados — separador entre botões

O que o projeto customiza no `ButtonGroup` é **exclusivamente a linha divisória** entre os botões
(aplicada em `.MuiButtonGroup-firstButton` e `.MuiButtonGroup-middleButton`).

### `contained`

| Estado                  | Fundo                          | Texto                     | Borda (divisor)                                                    | Sombra                 | Transição                                                |
| ----------------------- | ------------------------------ | ------------------------- | ------------------------------------------------------------------ | ---------------------- | -------------------------------------------------------- |
| default (cor de paleta) | `<cor>.main`                   | `<cor>.contrastText`      | `1px solid rgba(<canal dark> / 0.48)`                              | `none`                 | herdada do `Button` (250ms cubic-bezier(0.4, 0, 0.2, 1)) |
| default (`inherit`)     | `#1C252E`                      | `#FFFFFF`                 | `1px solid rgba(145 158 171 / 0.32)`                               | `none`                 | idem                                                     |
| hover                   | vide `botao.md` (`<cor>.dark`) | idem                      | inalterada                                                         | `customShadows[<cor>]` | idem                                                     |
| disabled                | `rgba(145 158 171 / 0.24)`     | `rgba(145 158 171 / 0.8)` | `1px solid rgba(145 158 171 / 0.24)` (`action.disabledBackground`) | `none`                 | idem                                                     |

Divisores por cor (`varAlpha(<canal dark>, 0.48)`), `src/theme/core/components/button-group.tsx:111-113`:

| Cor       | `<cor>.dark`             | Divisor                            |
| --------- | ------------------------ | ---------------------------------- |
| primary   | `#007867` rgb(0,120,103) | `1px solid rgba(0 120 103 / 0.48)` |
| secondary | `#5119B7` rgb(81,25,183) | `1px solid rgba(81 25 183 / 0.48)` |
| info      | `#006C9C` rgb(0,108,156) | `1px solid rgba(0 108 156 / 0.48)` |
| success   | `#118D57` rgb(17,141,87) | `1px solid rgba(17 141 87 / 0.48)` |
| warning   | `#B76E00` rgb(183,110,0) | `1px solid rgba(183 110 0 / 0.48)` |
| error     | `#B71D18` rgb(183,29,24) | `1px solid rgba(183 29 24 / 0.48)` |

⚠️ Sem o override, o divisor de `contained` seria `1px solid #C4CDD5` (`grey.400`) —
`default MUI 7.0.1 (ButtonGroup.js:199-205)`.

### `outlined`

| Estado                  | Fundo                       | Texto                     | Borda                                                                                                                | Sombra | Transição |
| ----------------------- | --------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------ | --------- |
| default (cor de paleta) | `transparent`               | `<cor>.main`              | borda do `Button` `outlined` = `1px solid rgba(<canal main> / 0.48)`; lado interno `border-right-color: transparent` | `none` | idem      |
| hover (cor de paleta)   | `rgba(<canal main> / 0.08)` | `<cor>.main`              | `border-right-color: currentColor` + `box-shadow: 0 0 0 0.75px currentColor` (do `MuiButton`)                        | —      | idem      |
| hover (`inherit`)       | `rgba(145 158 171 / 0.08)`  | herdada                   | **`border-color: #1C252E`** (`text.primary`) em `.MuiButtonGroup-grouped:hover`                                      | `none` | idem      |
| disabled                | `transparent`               | `rgba(145 158 171 / 0.8)` | `1px solid rgba(145 158 171 / 0.24)`                                                                                 | `none` | idem      |

Único override do projeto aqui: `src/theme/core/components/button-group.tsx:135-147` (hover de `inherit`).
Resto: `default MUI 7.0.1 (ButtonGroup.js:161-192)`.

### `text`

| Estado                  | Fundo                       | Texto                     | Borda (divisor)                       | Sombra | Transição |
| ----------------------- | --------------------------- | ------------------------- | ------------------------------------- | ------ | --------- |
| default (cor de paleta) | `transparent`               | `<cor>.main`              | `1px solid rgba(<canal main> / 0.48)` | `none` | idem      |
| default (`inherit`)     | `transparent`               | herdada                   | `1px solid rgba(145 158 171 / 0.32)`  | `none` | idem      |
| hover                   | `rgba(<canal main> / 0.08)` | `<cor>.main`              | inalterada                            | `none` | idem      |
| disabled                | `transparent`               | `rgba(145 158 171 / 0.8)` | `1px solid rgba(145 158 171 / 0.24)`  | `none` | idem      |

Divisores por cor (`varAlpha(<canal main>, 0.48)`), `src/theme/core/components/button-group.tsx:151-173`:
primary `rgba(0 167 111 / 0.48)` · secondary `rgba(142 51 255 / 0.48)` · info `rgba(0 184 217 / 0.48)` ·
success `rgba(34 197 94 / 0.48)` · warning `rgba(255 171 0 / 0.48)` · error `rgba(255 86 48 / 0.48)`.

⚠️ Sem o override, o divisor de `text` seria `1px solid rgba(0 0 0 / 0.23)` (light) —
`default MUI 7.0.1 (ButtonGroup.js:125-137)`.

### `soft` (variante do projeto)

| Estado                                     | Fundo                                            | Texto                     | Borda (divisor)                                                             | Sombra | Transição |
| ------------------------------------------ | ------------------------------------------------ | ------------------------- | --------------------------------------------------------------------------- | ------ | --------- |
| default (cor de paleta) — horizontal       | `rgba(<canal main> / 0.16)` (do `Button` `soft`) | `<cor>.dark`              | `border-right: solid 1px rgba(<canal dark> / 0.24)`                         | `none` | idem      |
| default (cor de paleta) — vertical         | idem                                             | idem                      | `border-right: none` + `border-bottom: solid 1px rgba(<canal dark> / 0.24)` | `none` | idem      |
| default (sem cor / `inherit`) — horizontal | `rgba(145 158 171 / 0.08)`                       | herdada                   | `border-right: solid 1px rgba(145 158 171 / 0.32)`                          | `none` | idem      |
| default (sem cor / `inherit`) — vertical   | idem                                             | idem                      | `border-bottom: solid 1px rgba(145 158 171 / 0.32)`                         | `none` | idem      |
| hover                                      | `rgba(<canal main> / 0.32)`                      | `<cor>.dark`              | inalterada                                                                  | `none` | idem      |
| disabled                                   | `rgba(145 158 171 / 0.24)`                       | `rgba(145 158 171 / 0.8)` | `border-color: rgba(145 158 171 / 0.24)`                                    | `none` | idem      |

Divisores por cor (`varAlpha(<canal dark>, 0.24)`), `src/theme/core/components/button-group.tsx:44-59`:
primary `rgba(0 120 103 / 0.24)` · secondary `rgba(81 25 183 / 0.24)` · info `rgba(0 108 156 / 0.24)` ·
success `rgba(17 141 87 / 0.24)` · warning `rgba(183 110 0 / 0.24)` · error `rgba(183 29 24 / 0.24)`.

Modo dark: o divisor usa `<canal light>` em vez de `<canal dark>` (`button-group.tsx:47-49, 54-56`):
primary `rgba(91 228 155 / 0.24)` · secondary `rgba(198 132 255 / 0.24)` · info `rgba(97 243 243 / 0.24)` ·
success `rgba(119 237 139 / 0.24)` · warning `rgba(255 214 102 / 0.24)` · error `rgba(255 172 130 / 0.24)`.

⚠️ Como `soft` não é uma variante conhecida do MUI, o `ButtonGroup` **não** aplica a ela o
zeramento de cantos internos nem o `margin-left: -1px` — essas regras são condicionadas a
`variant: 'outlined' | 'contained' | 'text'` (`default MUI 7.0.1 (ButtonGroup.js:125-229)`).
O zeramento genérico por orientação (`ButtonGroup.js:96-124`) **é** aplicado, pois só depende de
`orientation`. `⚠️ NÃO CONFIRMADO` em runtime — derivado por leitura de fonte.

---

# ToggleButton

## Anatomia

| Parte        | Classe                                                    | O que é                                       |
| ------------ | --------------------------------------------------------- | --------------------------------------------- |
| root         | `.MuiToggleButton-root`                                   | `ButtonBase` (`<button>`), com `aria-pressed` |
| selecionado  | `.Mui-selected`                                           | estado                                        |
| desabilitado | `.Mui-disabled`                                           | estado                                        |
| tamanho      | `.MuiToggleButton-sizeSmall` / `sizeMedium` / `sizeLarge` | —                                             |

## Variantes e tamanhos

- **Não há variantes** de aparência: `ToggleButton` só tem `size` e `color`.
- Cores: `standard` (**default**, `default MUI 7.0.1 (node_modules/@mui/material/ToggleButton/ToggleButton.js:148)`)
  - as 6 de paleta.
- Tamanhos: `small` | `medium` (default) | `large` (`ToggleButton.js:155`).
- O projeto **não cria** nenhuma variante nova aqui.

## Medidas

| size   | padding | font-size                  | line-height | borda | altura resultante         |
| ------ | ------- | -------------------------- | ----------- | ----- | ------------------------- |
| small  | `7px`   | `0.8125rem` = **11,375px** | 19,5px      | `1px` | **35px** (7+19,5+7+2)     |
| medium | `11px`  | `0.875rem` = **12,25px**   | 21px        | `1px` | **45px** (11+21+11+2)     |
| large  | `15px`  | `0.9375rem` = **13,125px** | 22,5px      | `1px` | **52,5px** (15+22,5+15+2) |

⚠️ A coluna "altura resultante" é **soma aritmética**, não medição —
`⚠️ NÃO CONFIRMADO` em runtime (não consta na §10 do `FATOS.md`).
`line-height` = `typography.button.lineHeight` = `24/14` = `1.7142857142857142`
(`src/theme/core/typography.ts:121-126`).

| Propriedade      | Valor bruto                                                                                                        | Origem                                                                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `padding`        | `11px` (medium) / `7px` (small) / `15px` (large)                                                                   | `default MUI 7.0.1 (ToggleButton.js:56, 112-127)`                                                                                                                                                                                     |
| `border-radius`  | `8px`                                                                                                              | `shape.borderRadius` — `default MUI 7.0.1 (ToggleButton.js:55)`                                                                                                                                                                       |
| `border`         | `1px solid rgba(145 158 171 / 0.2)` (`divider`)                                                                    | `default MUI 7.0.1 (ToggleButton.js:57)` + `src/theme/core/palette.ts:131`                                                                                                                                                            |
| `font-weight`    | **`600`** (`fontWeightSemiBold`)                                                                                   | `src/theme/core/components/button-toggle.tsx:63` — sobrescreve o `700` de `typography.button`                                                                                                                                         |
| `text-transform` | `none`                                                                                                             | `typography.button.textTransform: 'unset'` — `src/theme/core/typography.ts:121-126`                                                                                                                                                   |
| `transition`     | `background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms …, border-color 250ms …, color 250ms …` | herdada do `ButtonBase`/`Button`? **não** — `ToggleButton` não declara `transition`. ⚠️ `NÃO CONFIRMADO`: nenhuma transição é declarada em `ToggleButton.js` nem no override do projeto → o comportamento default é **sem transição** |

## Tabela de estados

`action.active = #637381` · `action.selected = rgba(145 158 171 / 0.16)` ·
`action.disabled = rgba(145 158 171 / 0.8)` · `action.disabledBackground = rgba(145 158 171 / 0.24)` ·
`action.hoverOpacity = 0.08` · `action.selectedOpacity = 0.08`.

### Cor `standard` (default)

| Estado              | Fundo                                                     | Texto                                       | Borda                                | Sombra                          | Transição     |
| ------------------- | --------------------------------------------------------- | ------------------------------------------- | ------------------------------------ | ------------------------------- | ------------- |
| default             | `transparent`                                             | `#637381` rgb(99,115,129) (`action.active`) | `1px solid rgba(145 158 171 / 0.2)`  | `none`                          | não declarada |
| hover               | `rgba(28 37 46 / 0.08)` (`text.primary` @ `hoverOpacity`) | `#637381`                                   | inalterada                           | `none`                          | —             |
| selected            | `rgba(28 37 46 / 0.08)` (`selectedOpacity`)               | `#1C252E` (`text.primary`)                  | **`1px solid currentColor`**         | **`0 0 0 0.75px currentColor`** | —             |
| selected + hover    | `rgba(28 37 46 / calc(0.08 + 0.08))`                      | `#1C252E`                                   | `currentColor`                       | `0 0 0 0.75px currentColor`     | —             |
| disabled            | `transparent`                                             | `rgba(145 158 171 / 0.8)`                   | `1px solid rgba(145 158 171 / 0.24)` | `none`                          | —             |
| disabled + selected | `rgba(145 158 171 / 0.16)` (`action.selected`)            | `rgba(145 158 171 / 0.8)`                   | `1px solid rgba(145 158 171 / 0.24)` | `0 0 0 0.75px currentColor`     | —             |

### Cores de paleta

| Estado              | Fundo                                    | Texto                       | Borda                                     | Sombra                          | Transição     |
| ------------------- | ---------------------------------------- | --------------------------- | ----------------------------------------- | ------------------------------- | ------------- |
| default             | `transparent`                            | `#637381` (`action.active`) | `1px solid rgba(145 158 171 / 0.2)`       | `none`                          | não declarada |
| hover               | `rgba(<canal main> / 0.08)`              | `#637381`                   | **`1px solid rgba(<canal main> / 0.48)`** | `none`                          | —             |
| selected            | `rgba(<canal main> / 0.08)`              | `<cor>.main`                | **`1px solid currentColor`**              | **`0 0 0 0.75px currentColor`** | —             |
| selected + hover    | `rgba(<canal main> / calc(0.08 + 0.08))` | `<cor>.main`                | `1px solid rgba(<canal main> / 0.48)`     | `0 0 0 0.75px currentColor`     | —             |
| disabled            | `transparent`                            | `rgba(145 158 171 / 0.8)`   | `1px solid rgba(145 158 171 / 0.24)`      | `none`                          | —             |
| disabled + selected | `rgba(145 158 171 / 0.16)`               | `rgba(145 158 171 / 0.8)`   | `1px solid rgba(145 158 171 / 0.24)`      | `0 0 0 0.75px currentColor`     | —             |

Bordas de hover por cor (`varAlpha(<canal main>, 0.48)`) — `src/theme/core/components/button-toggle.tsx:36-44`:
primary `rgba(0 167 111 / 0.48)` · secondary `rgba(142 51 255 / 0.48)` · info `rgba(0 184 217 / 0.48)` ·
success `rgba(34 197 94 / 0.48)` · warning `rgba(255 171 0 / 0.48)` · error `rgba(255 86 48 / 0.48)`.

Fundos de hover: `rgba(<canal main> / var(--palette-action-hoverOpacity))`, com
`--palette-action-hoverOpacity = 0.08` (`src/theme/core/palette.ts:109`).

Origem dos estados: projeto em `src/theme/core/components/button-toggle.tsx:34-68`;
defaults em `default MUI 7.0.1 (ToggleButton.js:51-129)`.

---

# ToggleButtonGroup

## Anatomia

| Parte                    | Classe                                                              | O que é                                               |
| ------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------- |
| root                     | `.MuiToggleButtonGroup-root`                                        | `<div>`, `display: inline-flex`, `border-radius: 8px` |
| agrupado                 | `.MuiToggleButtonGroup-grouped`                                     | classe injetada em cada `ToggleButton`                |
| primeiro / meio / último | `.MuiToggleButtonGroup-firstButton` / `middleButton` / `lastButton` | só com >1 filho                                       |
| vertical                 | `.MuiToggleButtonGroup-vertical`                                    | `flex-direction: column`                              |

## Variantes e tamanhos

- Orientações: `horizontal` (default) | `vertical`
  (`default MUI 7.0.1 (node_modules/@mui/material/ToggleButtonGroup/ToggleButtonGroup.js:138)`).
- `exclusive: false`, `fullWidth: false`, `color: 'standard'`, `size: 'medium'` — defaults MUI
  (`ToggleButtonGroup.js:133-139`). O projeto não altera nenhum.

## Medidas

| Propriedade                                       | Valor bruto                                                                             | Referência simbólica              | Origem                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------- |
| `gap`                                             | **`4px`**                                                                               | —                                 | `src/theme/core/components/button-toggle.tsx:80`          |
| `padding`                                         | **`4px`**                                                                               | —                                 | `src/theme/core/components/button-toggle.tsx:81`          |
| `border`                                          | **`solid 1px rgba(145 158 171 / 0.08)`**                                                | `varAlpha(grey.500Channel, 0.08)` | `src/theme/core/components/button-toggle.tsx:82`          |
| `border-radius` do root                           | `8px`                                                                                   | `shape.borderRadius`              | `default MUI 7.0.1 (ToggleButtonGroup.js:64)`             |
| `border` de cada botão dentro do grupo            | **`none`**                                                                              | —                                 | `src/theme/core/components/button-toggle.tsx:85`          |
| `border-radius` de cada botão dentro do grupo     | **`inherit`** → `8px`                                                                   | —                                 | `src/theme/core/components/button-toggle.tsx:85`          |
| `box-shadow` do botão selecionado dentro do grupo | **`none`** (anula o anel `0 0 0 0.75px currentColor`)                                   | —                                 | `src/theme/core/components/button-toggle.tsx:86`          |
| sobreposição residual                             | `margin-left: -1px` (horizontal) / `margin-top: -1px` (vertical) no do meio e no último | —                                 | `default MUI 7.0.1 (ToggleButtonGroup.js:81-86, 113-118)` |

⚠️ O `margin: -1px` do MUI **não** é anulado pelo projeto. Com `gap: 4px`, o espaçamento visual
efetivo entre botões fica em **3px**. `⚠️ NÃO CONFIRMADO` em runtime — derivado por leitura de fonte.

## Tabela de estados

O grupo não muda os estados do `ToggleButton` — só remove borda, força raio 8px em todos os cantos
e zera a sombra do selecionado. Efeito visual: **controle segmentado** (botões separados dentro de
uma moldura), e não a barra "colada" do MUI puro.

| Estado (dentro do grupo) | Fundo                  | Texto                     | Borda                                                        | Sombra     | Transição     |
| ------------------------ | ---------------------- | ------------------------- | ------------------------------------------------------------ | ---------- | ------------- |
| default                  | `transparent`          | `#637381`                 | `none`                                                       | `none`     | não declarada |
| hover                    | `rgba(<canal> / 0.08)` | `#637381`                 | `none` (o `border-color` do hover não tem borda para pintar) | `none`     | —             |
| selected                 | `rgba(<canal> / 0.08)` | `<cor>.main` / `#1C252E`  | `none`                                                       | **`none`** | —             |
| disabled                 | `transparent`          | `rgba(145 158 171 / 0.8)` | `none`                                                       | `none`     | —             |

---

## Regras de uso observadas

1. **`ButtonGroup` só é customizado no divisor.** Toda a aparência do botão (altura, padding,
   tipografia, cores, hover) vem de `MuiButton`. Ao portar para outra biblioteca, trate o grupo como
   "N botões + 1 linha divisória colorida".
2. **A cor do divisor muda por variante**: `contained` usa `<cor>.dark` a 48%; `text` usa
   `<cor>.main` a 48%; `soft` usa `<cor>.dark` a 24% (light) / `<cor>.light` a 24% (dark).
3. **Dentro de um `ButtonGroup`, o default de cor vira `primary`.** Fora dele, é `inherit`.
   Essa inconsistência é do MUI, não do projeto — mas é visível.
4. **`ToggleButton` selecionado usa o mesmo anel do `Button` `outlined`**
   (`box-shadow: 0 0 0 0.75px currentColor`) — é o "grifo" visual recorrente do design system.
   Dentro de `ToggleButtonGroup` esse anel é **removido**.
5. **`ToggleButtonGroup` é uma moldura**: `padding: 4px` + `border: 1px` translúcida + `gap: 4px`,
   com botões sem borda e raio 8px. É o padrão de "segmented control" do projeto.
6. **`ToggleButton` tem peso 600**, contra 700 dos `Button` — é a única diferença tipográfica
   entre eles.
7. **Nenhuma transição é declarada em `ToggleButton`**: mudanças de estado são instantâneas.

---

## Origem

| Item                                                                               | Arquivo:linha                                                                       |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `ButtonGroup` — tipo da variante `soft`                                            | `src/theme/core/components/button-group.tsx:15-17`                                  |
| `ButtonGroup` — lista de cores                                                     | `src/theme/core/components/button-group.tsx:21`                                     |
| `ButtonGroup` — seletor do divisor (`firstButton, middleButton`)                   | `src/theme/core/components/button-group.tsx:38`                                     |
| `ButtonGroup` — `soft` cores (borda `dark`/`light` @24%)                           | `src/theme/core/components/button-group.tsx:40-60`                                  |
| `ButtonGroup` — `soft` base (borda `rgba(145 158 171 / 0.32)`, vertical, disabled) | `src/theme/core/components/button-group.tsx:61-83`                                  |
| `ButtonGroup` — `defaultProps: { disableElevation: true }`                         | `src/theme/core/components/button-group.tsx:91`                                     |
| `ButtonGroup` — registro das variantes                                             | `src/theme/core/components/button-group.tsx:96-105`                                 |
| `ButtonGroup` — `contained` (divisor `dark`@48%, inherit, disabled)                | `src/theme/core/components/button-group.tsx:109-131`                                |
| `ButtonGroup` — `outlined` (hover `inherit` → `text.primary`)                      | `src/theme/core/components/button-group.tsx:135-147`                                |
| `ButtonGroup` — `text` (divisor `main`@48%, inherit, disabled)                     | `src/theme/core/components/button-group.tsx:151-173`                                |
| `ToggleButton` — lista de cores                                                    | `src/theme/core/components/button-toggle.tsx:10`                                    |
| `ToggleButton` — hover por cor (borda 48% + fundo `hoverOpacity`)                  | `src/theme/core/components/button-toggle.tsx:36-44`                                 |
| `ToggleButton` — selected (anel `0 0 0 0.75px currentColor`)                       | `src/theme/core/components/button-toggle.tsx:45-50`                                 |
| `ToggleButton` — disabled + selected                                               | `src/theme/core/components/button-toggle.tsx:51-59`                                 |
| `ToggleButton` — `font-weight: 600`                                                | `src/theme/core/components/button-toggle.tsx:63`                                    |
| `ToggleButtonGroup` — root (`gap 4`, `padding 4`, borda 8%)                        | `src/theme/core/components/button-toggle.tsx:79-83`                                 |
| `ToggleButtonGroup` — `grouped` (sem borda, raio herdado, sem sombra)              | `src/theme/core/components/button-toggle.tsx:84-87`                                 |
| Export                                                                             | `src/theme/core/components/button-toggle.tsx:93` / `button-group.tsx:179`           |
| `divider = rgba(145 158 171 / 0.2)`                                                | `src/theme/core/palette.ts:131`                                                     |
| `action.hoverOpacity = 0.08`                                                       | `src/theme/core/palette.ts:109` (bloco `baseAction`, `:103-111`)                    |
| `typography.button`                                                                | `src/theme/core/typography.ts:121-126`                                              |
| Defaults MUI — `ButtonGroup`                                                       | `node_modules/@mui/material/ButtonGroup/ButtonGroup.js:57-242, 243-262`             |
| Defaults MUI — `ToggleButton`                                                      | `node_modules/@mui/material/ToggleButton/ToggleButton.js:42-129, 130-158`           |
| Defaults MUI — `ToggleButtonGroup`                                                 | `node_modules/@mui/material/ToggleButtonGroup/ToggleButtonGroup.js:41-124, 125-142` |

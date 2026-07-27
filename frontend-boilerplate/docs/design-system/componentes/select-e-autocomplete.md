# Select e Autocomplete

`MuiSelect` + `MuiNativeSelect` + `MuiAutocomplete`.

> **Base de conversão**: `html { font-size: 14px }` → `px_real = rem × 14` (`FATOS.md` §1).
> A caixa do campo (altura, padding, borda, label, helper text) é a mesma do campo de texto —
> ver `campo-texto.md`. Aqui documenta-se **só** o que é específico de select/autocomplete.

---

# Select

## Anatomia

```
FormControl                     .MuiFormControl-root
├── InputLabel                  .MuiInputLabel-root
├── OutlinedInput               .MuiOutlinedInput-root .MuiInputBase-root
│   ├── div[role=combobox]      .MuiSelect-select .MuiSelect-outlined .MuiInputBase-input
│   ├── input (hidden)          .MuiSelect-nativeInput
│   ├── svg                     .MuiSelect-icon .MuiSelect-iconOutlined
│   └── fieldset                .MuiOutlinedInput-notchedOutline
└── (ao abrir) Menu → Popover
    └── Paper                   .MuiMenu-paper .MuiPopover-paper .MuiPaper-root
        └── ul                  .MuiMenu-list .MuiList-root
            └── li              .MuiMenuItem-root
```

| Parte                  | Classe                   | Detalhe                                                                                                                                                                                     |
| ---------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| valor exibido          | `.MuiSelect-select`      | `height: auto`, `min-height: 1.4375em`, `text-overflow: ellipsis`, `white-space: nowrap`, `overflow: hidden` — `default MUI 7.0.1 (node_modules/@mui/material/Select/SelectInput.js:49-60)` |
| input nativo escondido | `.MuiSelect-nativeInput` | `position: absolute`, `opacity: 0`, `pointer-events: none`, `width: 100%`, `bottom: 0`, `left: 0` — `default MUI 7.0.1 (SelectInput.js:71-84)`                                              |
| ícone                  | `.MuiSelect-icon`        | **customizado pelo projeto** (ver abaixo)                                                                                                                                                   |
| dropdown               | `.MuiMenu-paper`         | herda os estilos de `MuiPopover.paper` do projeto                                                                                                                                           |
| item                   | `.MuiMenuItem-root`      | `theme.mixins.menuItemStyles`                                                                                                                                                               |

## Variantes e tamanhos

- Variantes: `outlined` (**default**, `default MUI 7.0.1 (node_modules/@mui/material/Select/Select.js:78)`),
  `filled`, `standard`. Dentro de um `FormControl`/`TextField`, a variante do `FormControl` vence
  (`Select.js:83-88`).
- Tamanhos: `small` | `medium` — herdados do input.
- `native`: `false` (default) → `SelectInput`; `true` → `NativeSelectInput` (`<select>` do browser).
- O projeto **não cria** variantes novas.

## Medidas — o ícone (única customização do projeto)

| Propriedade | Valor bruto           | Default MUI que foi substituído                                                                                                              | Origem                                    |
| ----------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `width`     | **`18px`**            | `1em` (do `SvgIcon`, `fontSizeMedium` = `1.5rem` = 21px)                                                                                     | `src/theme/core/components/select.tsx:35` |
| `height`    | **`18px`**            | idem                                                                                                                                         | `src/theme/core/components/select.tsx:36` |
| `right`     | **`10px`**            | `0` (standard) / `7px` (filled e outlined) — `default MUI 7.0.1 (node_modules/@mui/material/NativeSelect/NativeSelectInput.js:115, 131-145)` | `src/theme/core/components/select.tsx:34` |
| `top`       | **`calc(50% - 9px)`** | `calc(50% - .5em)` — `default MUI 7.0.1 (NativeSelectInput.js:117)`                                                                          | `src/theme/core/components/select.tsx:37` |

Idêntico em `MuiNativeSelect` (`src/theme/core/components/select.tsx:54-59`).

Propriedades do ícone **não** customizadas (`default MUI 7.0.1 (NativeSelectInput.js:109-146)`):

| Estado           | Valor                                         |
| ---------------- | --------------------------------------------- |
| `position`       | `absolute`                                    |
| `pointer-events` | `none`                                        |
| cor (repouso)    | `#637381` rgb(99,115,129) (`action.active`)   |
| cor (disabled)   | `rgba(145 158 171 / 0.8)` (`action.disabled`) |
| aberto           | `transform: rotate(180deg)`                   |

⚠️ **Não há transição declarada** para a rotação do ícone — nem no MUI nem no projeto.
A rotação é instantânea.

### O ícone em si

`ArrowDownIcon`: `<SvgIcon>` com `viewBox` 24×24 (default do `SvgIcon`) e um único `<path fill="currentColor">`
correspondente a **`eva:arrow-ios-downward-fill`** (`src/theme/core/components/select.tsx:11-19`).
Definido inline no tema — não passa pelo Iconify.

Path exato:

```
M12 16a1 1 0 0 1-.64-.23l-6-5a1 1 0 1 1 1.28-1.54L12 13.71l5.36-4.32a1 1 0 0 1 1.41.15a1 1 0 0 1-.14 1.46l-6 4.83A1 1 0 0 1 12 16
```

⚠️ Substitui o `ArrowDropDown` do Material (`default MUI 7.0.1 (Select.js:64)`).

## Espaço reservado para o ícone

| Variante   | `padding-right` do `.MuiSelect-select`                         | Origem                                           |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------ |
| `standard` | `24px` (via `&&&`) + `min-width: 16px`                         | `default MUI 7.0.1 (NativeSelectInput.js:61-71)` |
| `filled`   | `32px` (via `&&&`)                                             | `default MUI 7.0.1 (NativeSelectInput.js:72-80)` |
| `outlined` | `32px` (via `&&&`) + `border-radius: 8px` (também em `:focus`) | `default MUI 7.0.1 (NativeSelectInput.js:81-93)` |

⚠️ O ícone tem 18px e fica a 10px da direita → ocupa até `28px`. A reserva é de `32px`
(`outlined`/`filled`), sobrando `4px`. Em `standard` a reserva é de `24px`, **menor** que os 28px
ocupados. `⚠️ NÃO CONFIRMADO` se isso gera sobreposição visível — não medido em runtime.

## Tabela de estados

A caixa do select usa exatamente os estados do `OutlinedInput`/`FilledInput`/`Input`
(ver `campo-texto.md`). O que muda aqui:

| Estado                              | Fundo                          | Texto                                                                | Borda                                                  | Sombra | Transição                                             |
| ----------------------------------- | ------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------ | ------ | ----------------------------------------------------- |
| default                             | conforme a variante do input   | `#1C252E` (`text.primary`)                                           | conforme a variante do input                           | `none` | herdada do input                                      |
| aberto                              | idem                           | idem                                                                 | **`2px solid #1C252E`** (o select fica `.Mui-focused`) | `none` | `border-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` |
| ícone (repouso / aberto / disabled) | —                              | `#637381` / `#637381` + `rotate(180deg)` / `rgba(145 158 171 / 0.8)` | —                                                      | —      | **nenhuma**                                           |
| disabled                            | conforme a variante            | `#919EAB`                                                            | `1px solid rgba(145 158 171 / 0.24)`                   | `none` | idem                                                  |
| error                               | conforme a variante            | `#1C252E`                                                            | `1px solid #FF5630`                                    | `none` | idem                                                  |
| `option`/`optgroup` nativos         | `#FFFFFF` (`background.paper`) | —                                                                    | —                                                      | —      | — (`default MUI 7.0.1 (NativeSelectInput.js:58-60)`)  |

---

# Dropdown (Menu / Popover)

O painel do `Select` é um `Menu`, que estende `Popover`
(`default MUI 7.0.1 (node_modules/@mui/material/Menu/Menu.js:45-62)`).
Logo, ele recebe o override `MuiPopover.paper` do projeto.

## Medidas do painel — `theme.mixins.paperStyles(theme, { dropdown: true })`

| Propriedade                                   | Valor bruto                                                                                                        | Origem                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `padding`                                     | **`4px`** (`theme.spacing(0.5)`)                                                                                   | `src/theme/core/mixins/global-styles-components.ts:92`                                         |
| `box-shadow`                                  | **`0 0 2px 0 rgba(145 158 171 / 0.24), -20px 20px 40px -4px rgba(145 158 171 / 0.24)`** (`customShadows.dropdown`) | `src/theme/core/mixins/global-styles-components.ts:93` + `src/theme/core/custom-shadows.ts:51` |
| `border-radius`                               | **`10px`** (`8 × 1.25`)                                                                                            | `src/theme/core/mixins/global-styles-components.ts:94`                                         |
| `background-color`                            | **`rgba(255 255 255 / 0.9)`** (`background.paperChannel` @ 0.9)                                                    | `src/theme/core/mixins/global-styles-components.ts:90`                                         |
| `backdrop-filter` / `-webkit-backdrop-filter` | **`blur(20px)`**                                                                                                   | `src/theme/core/mixins/global-styles-components.ts:88-89`                                      |
| `background-image`                            | 2 SVGs base64 radiais: ciano `#00B8D9` @10% em `top right`, vermelho `#FF5630` @10% em `left bottom`               | `src/theme/core/mixins/global-styles-components.ts:73-77, 82-87`                               |
| `background-size`                             | `50% 50%` (cada imagem)                                                                                            | `src/theme/core/mixins/global-styles-components.ts:84`                                         |
| `background-repeat`                           | `no-repeat`                                                                                                        | `src/theme/core/mixins/mixins.ts` (`bgGradient` default) / `FATOS.md` §8                       |
| `background-image: none` (do `MuiPaper`)      | anulado pelas imagens acima                                                                                        | `src/theme/core/components/paper.tsx:17`                                                       |
| `elevation`                                   | `0` (`defaultProps`) → sem sombra do MUI                                                                           | `src/theme/core/components/paper.tsx:11`                                                       |
| `padding` da `<ul>` interna                   | **`0`** (top e bottom)                                                                                             | `src/theme/core/components/popover.tsx:14` — anula o `8px 0` do `MuiList`                      |
| `max-height`                                  | `calc(100% - 96px)`                                                                                                | `default MUI 7.0.1 (Menu.js:55-62)`                                                            |
| `z-index`                                     | `1300` (`zIndex.modal`)                                                                                            | `FATOS.md` §5.4                                                                                |

⚠️ Em RTL as posições das duas imagens invertem para `top left` / `right bottom`
(`src/theme/core/mixins/global-styles-components.ts:85-86`). O projeto roda em `ltr` por default.

## Item do menu — `theme.mixins.menuItemStyles(theme)`

Aplicado em `MuiMenuItem.root` (`src/theme/core/components/menu.tsx:9`) **e** em
`MuiAutocomplete.listbox .MuiAutocomplete-option` (`src/theme/core/components/autocomplete.tsx:52`).

| Propriedade                       | Valor bruto                                                        | Referência simbólica             | Origem                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `font-size`                       | `0.875rem` = **12,25px**                                           | `typography.body2`               | `src/theme/core/mixins/global-styles-components.ts:23`                                                         |
| `font-weight`                     | `400`                                                              | `typography.body2`               | idem                                                                                                           |
| `line-height`                     | `1.5714285714285714` (= 22/14) → **19,25px**                       | `typography.body2`               | idem                                                                                                           |
| `padding`                         | **`6px 8px`**                                                      | `theme.spacing(0.75, 1)`         | `src/theme/core/mixins/global-styles-components.ts:24`                                                         |
| `border-radius`                   | **`6px`**                                                          | `shape.borderRadius × 0.75`      | `src/theme/core/mixins/global-styles-components.ts:25`                                                         |
| `margin-bottom` (exceto o último) | **`4px`**                                                          | —                                | `src/theme/core/mixins/global-styles-components.ts:26-28`                                                      |
| `min-height`                      | `48px` até `sm`; **`auto`** a partir de `@media (min-width:600px)` | —                                | `default MUI 7.0.1 (node_modules/@mui/material/MenuItem/MenuItem.js:67, 132-140)`                              |
| checkbox interno                  | `padding: 4px`, `margin-left: -4px`, `margin-right: 4px`           | `spacing(0.5)` / `spacing(-0.5)` | `src/theme/core/mixins/global-styles-components.ts:34-38`                                                      |
| `Divider` logo após um item       | `margin: 4px 0`                                                    | `spacing(0.5, 0)`                | `src/theme/core/mixins/global-styles-components.ts:43-45` — sobrescreve os `8px` do MUI (`MenuItem.js:99-102`) |

### Estados do item

| Estado           | Fundo                                                                       | Texto               | Borda   | Sombra | Transição     |
| ---------------- | --------------------------------------------------------------------------- | ------------------- | ------- | ------ | ------------- |
| default          | `transparent`                                                               | `#1C252E` (herdado) | nenhuma | `none` | não declarada |
| hover            | **`rgba(145 158 171 / 0.08)`** (`action.hover`)                             | `#1C252E`           | nenhuma | `none` | —             |
| hover em touch   | `transparent`                                                               | `#1C252E`           | nenhuma | `none` | —             |
| selected         | **`rgba(145 158 171 / 0.16)`** (`action.selected`) + **`font-weight: 600`** | `#1C252E`           | nenhuma | `none` | —             |
| selected + hover | **`rgba(145 158 171 / 0.08)`** (`action.hover`)                             | `#1C252E`           | nenhuma | `none` | —             |
| focus-visible    | `rgba(145 158 171 / 0.24)` (`action.focus`)                                 | `#1C252E`           | nenhuma | `none` | —             |
| disabled         | `transparent` + `opacity: 0.48`                                             | `#1C252E` a 48%     | nenhuma | `none` | —             |

Origem: `src/theme/core/mixins/global-styles-components.ts:29-33`; focus-visible e disabled em
`default MUI 7.0.1 (MenuItem.js:93-98)`.

⚠️ Sem o override, `selected` seria `rgba(0 167 111 / 0.08)` (primary a 8%) —
`default MUI 7.0.1 (MenuItem.js:80-85)`. O projeto troca por **cinza a 16% + peso 600**,
removendo a cor de marca do item selecionado.
⚠️ **`selected + hover` fica mais claro que `selected`** (8% contra 16%) — o hover "apaga" parte do
destaque, invertendo a lógica usual.

---

# Autocomplete

## Anatomia

```
div                             .MuiAutocomplete-root
└── TextField / OutlinedInput   .MuiAutocomplete-inputRoot .MuiOutlinedInput-root
    ├── (chips ou "+N")         .MuiAutocomplete-tag
    ├── input                   .MuiAutocomplete-input .MuiInputBase-input
    └── div                     .MuiAutocomplete-endAdornment
        ├── IconButton          .MuiAutocomplete-clearIndicator
        └── IconButton          .MuiAutocomplete-popupIndicator
(portal)
└── Popper                      .MuiAutocomplete-popper
    └── Paper                   .MuiAutocomplete-paper
        ├── ul                  .MuiAutocomplete-listbox
        │   └── li              .MuiAutocomplete-option
        ├── div                 .MuiAutocomplete-loading      ("Loading…")
        └── div                 .MuiAutocomplete-noOptions    ("No options")
```

## Variantes e tamanhos

- Não há variantes próprias. A aparência vem do `TextField` usado em `renderInput`.
- Tamanhos: `small` | `medium` (default) — afetam padding do input e margem das tags.
- Defaults MUI relevantes (nenhum alterado pelo projeto):
  `multiple: false`, `disablePortal: false`, `limitTags: -1`, `loadingText: 'Loading…'`,
  `noOptionsText: 'No options'`, `forcePopupIcon: 'auto'`, `clearText: 'Clear'`, `closeText: 'Close'`
  — `default MUI 7.0.1 (node_modules/@mui/material/Autocomplete/Autocomplete.js:426-468)`.
- `defaultProps: { popupIcon: <ArrowDownIcon /> }` — `src/theme/core/components/autocomplete.tsx:30`
  (mesmo SVG do `Select`, `autocomplete.tsx:15-22`).

## Medidas

### Painel (`.MuiAutocomplete-paper`)

`...theme.mixins.paperStyles(theme, { dropdown: true })` — `src/theme/core/components/autocomplete.tsx:49`.
**Idêntico ao dropdown do Select** (tabela acima): `padding 4px`, `border-radius 10px`,
`box-shadow 0 0 2px 0 rgba(145 158 171 / 0.24), -20px 20px 40px -4px rgba(145 158 171 / 0.24)`,
`background-color rgba(255 255 255 / 0.9)`, `backdrop-filter blur(20px)`, 2 imagens radiais.

Adicionais do MUI não sobrescritos: `...typography.body1` (`font-size 1rem` = 14px) e
`overflow: auto` — `default MUI 7.0.1 (Autocomplete.js:309-318)`.

### Listbox (`.MuiAutocomplete-listbox`)

| Propriedade  | Valor bruto         | Origem                                                                                           |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------ |
| `padding`    | **`0`**             | `src/theme/core/components/autocomplete.tsx:51` — anula o `8px 0` do MUI (`Autocomplete.js:348`) |
| `max-height` | `40vh`              | `default MUI 7.0.1 (Autocomplete.js:349)`                                                        |
| `overflow`   | `auto`              | `default MUI 7.0.1 (Autocomplete.js:350)`                                                        |
| `list-style` | `none`, `margin: 0` | `default MUI 7.0.1 (Autocomplete.js:346-347)`                                                    |

### Opção (`.MuiAutocomplete-option`)

Recebe `theme.mixins.menuItemStyles(theme)` (`src/theme/core/components/autocomplete.tsx:52`) —
mesmos `6px 8px` de padding, `border-radius 6px`, `font-size 12,25px`, `margin-bottom 4px`.

Propriedades do MUI que **permanecem** (`default MUI 7.0.1 (Autocomplete.js:352-396)`):
`min-height: 48px` (→ `auto` a partir de `@media (min-width:600px)`), `display: flex`,
`align-items: center`, `justify-content: flex-start`, `cursor: pointer`, `overflow: hidden`,
`box-sizing: border-box`, `outline: 0`.

Estados da opção:

| Estado                                  | Fundo                                              | Texto     | Borda   | Sombra | Transição     |
| --------------------------------------- | -------------------------------------------------- | --------- | ------- | ------ | ------------- |
| default                                 | `transparent`                                      | `#1C252E` | nenhuma | `none` | não declarada |
| navegada (`.Mui-focused`)               | `rgba(145 158 171 / 0.08)` (`action.hover`)        | `#1C252E` | nenhuma | `none` | —             |
| focus-visible                           | `rgba(145 158 171 / 0.24)` (`action.focus`)        | `#1C252E` | nenhuma | `none` | —             |
| selecionada (`[aria-selected="true"]`)  | **`rgba(145 158 171 / 0.16)`** (`action.selected`) | `#1C252E` | nenhuma | `none` | —             |
| selecionada + hover                     | **`rgba(145 158 171 / 0.08)`** (`action.hover`)    | `#1C252E` | nenhuma | `none` | —             |
| desabilitada (`[aria-disabled="true"]`) | `transparent` + `opacity: 0.48`                    | —         | nenhuma | `none` | —             |

Origem do estado selecionado: `src/theme/core/mixins/global-styles-components.ts:39-42`
(seletor `&.MuiAutocomplete-option[aria-selected="true"]`).
⚠️ Sem esse override, o MUI usaria `rgba(0 167 111 / 0.08)` (primary a 8%) —
`default MUI 7.0.1 (Autocomplete.js:383-395)`.

### Tag (`span.MuiAutocomplete-tag`)

⚠️ O seletor do projeto é **`& span.MuiAutocomplete-tag`** (`src/theme/core/components/autocomplete.tsx:37`).
No MUI, essa classe é aplicada em **dois** lugares:

- nos `Chip` de cada valor selecionado (`<div>`) — `default MUI 7.0.1 (Autocomplete.js:591, 605-610)`;
- no **indicador "+N"** de `limitTags`, que é um **`<span>`** — `default MUI 7.0.1 (Autocomplete.js:614-623)`.

Como o seletor exige `span`, **os estilos abaixo valem só para o "+N"**; os chips seguem o
`MuiChip` do tema.

| Propriedade        | Valor bruto                                              | Referência simbólica              | Origem                                                 |
| ------------------ | -------------------------------------------------------- | --------------------------------- | ------------------------------------------------------ |
| `font-size`        | `0.875rem` = **12,25px**                                 | `typography.subtitle2`            | `src/theme/core/components/autocomplete.tsx:38`        |
| `font-weight`      | **`600`**                                                | `typography.subtitle2`            | idem                                                   |
| `height`           | **`24px`**                                               | —                                 | `src/theme/core/components/autocomplete.tsx:39`        |
| `min-width`        | **`24px`**                                               | —                                 | `src/theme/core/components/autocomplete.tsx:40`        |
| `line-height`      | **`24px`** (valor absoluto, não fator)                   | —                                 | `src/theme/core/components/autocomplete.tsx:41`        |
| `text-align`       | `center`                                                 | —                                 | `src/theme/core/components/autocomplete.tsx:42`        |
| `padding`          | **`0px 6px`**                                            | `theme.spacing(0, 0.75)`          | `src/theme/core/components/autocomplete.tsx:43`        |
| `color`            | **`#637381`** rgb(99,115,129)                            | `text.secondary`                  | `src/theme/core/components/autocomplete.tsx:44`        |
| `border-radius`    | **`8px`**                                                | `shape.borderRadius`              | `src/theme/core/components/autocomplete.tsx:45`        |
| `background-color` | **`rgba(145 158 171 / 0.16)`**                           | `varAlpha(grey.500Channel, 0.16)` | `src/theme/core/components/autocomplete.tsx:46`        |
| `margin`           | `3px` (size medium) / `2px` (size small)                 | —                                 | `default MUI 7.0.1 (Autocomplete.js:111-114, 214-223)` |
| `max-width`        | `calc(100% - 6px)` (medium) / `calc(100% - 4px)` (small) | —                                 | idem                                                   |

### endAdornment e ícones

| Propriedade                                                    | Valor bruto                                                                          | Origem                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| tamanho dos ícones (`.MuiSvgIcon-root` dentro do endAdornment) | **`18px × 18px`**                                                                    | `src/theme/core/components/autocomplete.tsx:54`        |
| posição do endAdornment                                        | `position: absolute`, `right: 0`, `top: 50%`, `transform: translate(0, -50%)`        | `default MUI 7.0.1 (Autocomplete.js:244-254)`          |
| `right` dentro de `outlined`/`filled`                          | `9px`                                                                                | `default MUI 7.0.1 (Autocomplete.js:149-151, 175-177)` |
| botão de limpar                                                | `padding: 4px`, `margin-right: -2px`, `visibility: hidden` → `visible` em hover/foco | `default MUI 7.0.1 (Autocomplete.js:255-263, 102-110)` |
| botão de abrir                                                 | `padding: 2px`, `margin-right: -2px`; aberto → `transform: rotate(180deg)`           | `default MUI 7.0.1 (Autocomplete.js:264-284)`          |
| ícone de limpar (default)                                      | `Close` do Material com `fontSize="small"` — redimensionado para 18×18 pelo override | `default MUI 7.0.1 (Autocomplete.js:432-434)`          |
| ícone de abrir                                                 | `ArrowDownIcon` do projeto (`eva:arrow-ios-downward-fill`)                           | `src/theme/core/components/autocomplete.tsx:15-22, 30` |

### Padding do input hospedeiro (defaults MUI, não sobrescritos)

| Situação                        | Valor                                                         | Origem                                                 |
| ------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| `OutlinedInput` root            | `padding: 9px`                                                | `default MUI 7.0.1 (Autocomplete.js:138-139)`          |
| `OutlinedInput` + `size small`  | `padding-top/bottom/left: 6px`                                | `default MUI 7.0.1 (Autocomplete.js:153-162)`          |
| input dentro de `OutlinedInput` | `padding: 7.5px 4px 7.5px 5px` (small: `2.5px 4px 2.5px 8px`) | idem                                                   |
| reserva com 1 ícone             | `padding-right: 39px` (`26 + 4 + 9`)                          | `default MUI 7.0.1 (Autocomplete.js:140-142)`          |
| reserva com 2 ícones            | `padding-right: 65px` (`52 + 4 + 9`)                          | `default MUI 7.0.1 (Autocomplete.js:143-145)`          |
| `input` sem foco                | `opacity: 0` → `1` quando `inputFocused`                      | `default MUI 7.0.1 (Autocomplete.js:202-206, 224-232)` |
| `min-width` do input            | `30px`, `width: 0`, `flex-grow: 1`                            | `default MUI 7.0.1 (Autocomplete.js:122-125, 202-206)` |

### Mensagens auxiliares

| Elemento                      | Valor                                                              | Origem                                                 |
| ----------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| `.MuiAutocomplete-loading`    | `color: #637381` (`text.secondary`), `padding: 14px 16px`          | `default MUI 7.0.1 (Autocomplete.js:319-328)`          |
| `.MuiAutocomplete-noOptions`  | `color: #637381`, `padding: 14px 16px`                             | `default MUI 7.0.1 (Autocomplete.js:329-338)`          |
| `.MuiAutocomplete-groupLabel` | `background-color: #FFFFFF` (`background.paper`), `top: -8px`      | `default MUI 7.0.1 (Autocomplete.js:398-407)`          |
| `.MuiAutocomplete-groupUl`    | `padding: 0`; opções internas com `padding-left: 24px`             | `default MUI 7.0.1 (Autocomplete.js:408-417)`          |
| `.MuiAutocomplete-popper`     | `z-index: 1300` (`zIndex.modal`); largura = `anchorEl.clientWidth` | `default MUI 7.0.1 (Autocomplete.js:285-308, 578-586)` |

⚠️ `padding: 14px 16px` das mensagens e `padding-left: 24px` do grupo **não** foram alinhados aos
`6px 8px` das opções — há inconsistência visual entre opção e mensagem de estado vazio.

---

## Regras de uso observadas

1. **Um único ícone de seta para todo o sistema**: `eva:arrow-ios-downward-fill`, inline no tema,
   18×18px, usado por `Select`, `NativeSelect` e `Autocomplete`.
2. **O painel flutuante é sempre o mesmo objeto visual** (`paperStyles({ dropdown: true })`):
   raio 10px, padding 4px, `backdrop-filter: blur(20px)`, fundo branco a 90% e duas manchas radiais
   (ciano no topo-direito, vermelho embaixo-esquerdo, ambas a 10%). Vale para `Popover`, `Menu`,
   dropdown do `Select` e painel do `Autocomplete`.
3. **Itens são "pílulas" de 6px de raio dentro do painel**, separadas por 4px — não linhas coladas.
   O padding lateral cai de 16px (MUI) para 8px.
4. **Seleção é cinza, não colorida.** `action.selected` (16% de `#919EAB`) + peso 600, no lugar do
   verde primário do MUI.
5. **`selected + hover` é mais claro que `selected`** — comportamento herdado do mixin
   (`action.hover` = 8% sobrepondo `action.selected` = 16%).
6. **O "+N" do `limitTags` é estilizado, os chips não.** O seletor `span.MuiAutocomplete-tag`
   exclui os `Chip` (que são `<div>`), então eles seguem o `MuiChip` (24px em `size="small"`,
   32px em `medium` — ver `FATOS.md` §10.2).
7. **A `<ul>` do dropdown tem padding zero** (tanto em `Popover`/`Menu` quanto no `Autocomplete`):
   o respiro vem do `padding: 4px` do painel.

---

## Origem

| Item                                                                       | Arquivo:linha                                                                      |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `ArrowDownIcon` do Select (SVG inline)                                     | `src/theme/core/components/select.tsx:11-19`                                       |
| `MuiSelect.defaultProps.IconComponent`                                     | `src/theme/core/components/select.tsx:27`                                          |
| `MuiSelect.styleOverrides.icon` (18×18, right 10, top calc(50% - 9px))     | `src/theme/core/components/select.tsx:33-38`                                       |
| `MuiNativeSelect.defaultProps.IconComponent`                               | `src/theme/core/components/select.tsx:48`                                          |
| `MuiNativeSelect.styleOverrides.icon`                                      | `src/theme/core/components/select.tsx:54-59`                                       |
| Export do bloco select                                                     | `src/theme/core/components/select.tsx:65`                                          |
| `ArrowDownIcon` do Autocomplete (SVG inline)                               | `src/theme/core/components/autocomplete.tsx:15-22`                                 |
| `MuiAutocomplete.defaultProps.popupIcon`                                   | `src/theme/core/components/autocomplete.tsx:30`                                    |
| `MuiAutocomplete` — `span.MuiAutocomplete-tag`                             | `src/theme/core/components/autocomplete.tsx:37-47`                                 |
| `MuiAutocomplete.paper` → `paperStyles({ dropdown: true })`                | `src/theme/core/components/autocomplete.tsx:49`                                    |
| `MuiAutocomplete.listbox` (`padding: 0`) + `option` → `menuItemStyles`     | `src/theme/core/components/autocomplete.tsx:50-53`                                 |
| `MuiAutocomplete.endAdornment` (ícones 18×18)                              | `src/theme/core/components/autocomplete.tsx:54`                                    |
| Export do bloco autocomplete                                               | `src/theme/core/components/autocomplete.tsx:60`                                    |
| `MuiMenuItem.root` → `menuItemStyles`                                      | `src/theme/core/components/menu.tsx:9`                                             |
| `MuiPopover.paper` → `paperStyles({ dropdown: true })` + lista sem padding | `src/theme/core/components/popover.tsx:12-15`                                      |
| `MuiPaper.defaultProps.elevation = 0` / `backgroundImage: none`            | `src/theme/core/components/paper.tsx:11, 17`                                       |
| `menuItemStyles` (mixin)                                                   | `src/theme/core/mixins/global-styles-components.ts:21-47`                          |
| `paperStyles` (mixin)                                                      | `src/theme/core/mixins/global-styles-components.ts:73-97`                          |
| `customShadows.dropdown`                                                   | `src/theme/core/custom-shadows.ts:51`                                              |
| `action.hover` / `selected` / `focus` / `disabledOpacity`                  | `src/theme/core/palette.ts:103-111`                                                |
| Defaults MUI — `Select`                                                    | `node_modules/@mui/material/Select/Select.js:52-110`                               |
| Defaults MUI — `SelectInput`                                               | `node_modules/@mui/material/Select/SelectInput.js:30-111`                          |
| Defaults MUI — `NativeSelectInput`                                         | `node_modules/@mui/material/NativeSelect/NativeSelectInput.js:35-156`              |
| Defaults MUI — `Menu`                                                      | `node_modules/@mui/material/Menu/Menu.js:45-70`                                    |
| Defaults MUI — `MenuItem`                                                  | `node_modules/@mui/material/MenuItem/MenuItem.js:53-141`                           |
| Defaults MUI — `Autocomplete`                                              | `node_modules/@mui/material/Autocomplete/Autocomplete.js:75-417, 418-468, 588-623` |

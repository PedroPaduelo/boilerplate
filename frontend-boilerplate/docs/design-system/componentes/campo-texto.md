# Campo de texto

`MuiTextField` + `MuiInputBase` + `MuiOutlinedInput` + `MuiFilledInput` + `MuiInput` (standard).

> **Base de conversão**: `html { font-size: 14px }` → `px_real = rem × 14` (`FATOS.md` §1).
> Todos os `rem` abaixo trazem o px real.

---

## Anatomia

`TextField` é um agregador. A árvore real renderizada é:

```
FormControl                 .MuiFormControl-root / .MuiTextField-root
├── InputLabel              .MuiInputLabel-root .MuiFormLabel-root
├── OutlinedInput           .MuiOutlinedInput-root .MuiInputBase-root
│   ├── (startAdornment)    .MuiInputAdornment-root
│   ├── input               .MuiOutlinedInput-input .MuiInputBase-input
│   ├── (endAdornment)      .MuiInputAdornment-root
│   └── fieldset            .MuiOutlinedInput-notchedOutline      ← a borda
│       └── legend                                                ← o "recorte" do label
└── FormHelperText          .MuiFormHelperText-root
```

| Parte                      | Classe                                         | Papel                                                                                                                                                                                                                                     |
| -------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| container                  | `.MuiFormControl-root`                         | `display: inline-flex`, `flex-direction: column`, `position: relative`, `min-width: 0`, `padding: 0`, `margin: 0`, `border: 0`, `vertical-align: top` — `default MUI 7.0.1 (node_modules/@mui/material/FormControl/FormControl.js:42-52)` |
| label                      | `.MuiInputLabel-root`                          | flutuante; `position: absolute` quando dentro de `FormControl`                                                                                                                                                                            |
| wrapper do input           | `.MuiInputBase-root`                           | `display: inline-flex`, `align-items: center`, `position: relative`, `cursor: text`, `box-sizing: border-box` — `default MUI 7.0.1 (node_modules/@mui/material/InputBase/InputBase.js:76-89)`                                             |
| campo                      | `.MuiInputBase-input`                          | o `<input>`/`<textarea>`; `font: inherit`, `border: 0`, `background: none`, `box-sizing: content-box`, `width: 100%`, `min-width: 0` — `default MUI 7.0.1 (InputBase.js:141-157)`                                                         |
| borda (só `outlined`)      | `.MuiOutlinedInput-notchedOutline`             | `<fieldset>` **posicionado absolutamente** → **não entra no cálculo de altura**                                                                                                                                                           |
| sublinhado (só `standard`) | `.MuiInput-underline` + `::before` / `::after` | `::before` = linha em repouso; `::after` = linha animada de foco                                                                                                                                                                          |
| texto auxiliar             | `.MuiFormHelperText-root`                      | renderizado como **`<div>`** (não `<p>`) no projeto                                                                                                                                                                                       |
| adornos                    | `.MuiInputAdornment-root`                      | prefixo/sufixo                                                                                                                                                                                                                            |

⚠️ **`margin: 0` no `FormControl`**: `margin="normal"` (`16px`/`8px`) e `margin="dense"` (`8px`/`4px`)
existem no MUI (`FormControl.js:53-68`) mas **não** são default. Espaçamento entre campos é
responsabilidade do layout (`Stack`/`gap`), não do campo.

---

## Variantes e tamanhos

| Variante   | Componente de input | Default?                                                                                                                                                                                      |
| ---------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `outlined` | `MuiOutlinedInput`  | **sim** — `defaultProps: { variant: 'outlined' }` (`src/theme/core/components/textfield.tsx:114`); coincide com o `default MUI 7.0.1 (node_modules/@mui/material/TextField/TextField.js:119)` |
| `filled`   | `MuiFilledInput`    | não                                                                                                                                                                                           |
| `standard` | `MuiInput`          | não                                                                                                                                                                                           |

Tamanhos: `small` | `medium` (**default** — `default MUI 7.0.1`, `size` não é declarado no tema).
O projeto **não cria** variantes novas de campo de texto.

Outros defaults relevantes do projeto:

| Prop                              | Valor        | Origem                                                                                 |
| --------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `MuiFilledInput.disableUnderline` | **`true`**   | `src/theme/core/components/textfield.tsx:84` — remove `::before`/`::after` do `filled` |
| `MuiTextField.variant`            | `'outlined'` | `src/theme/core/components/textfield.tsx:114`                                          |
| `MuiTextField.styleOverrides`     | `{}` (vazio) | `src/theme/core/components/textfield.tsx:119`                                          |

---

## Medidas

### Tabela medida em runtime (Chrome, viewport 1911×898, light) — `FATOS.md` §10.3

| Elemento                   | Medida                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| OutlinedInput root medium  | `height 51,86px`, `border-radius 8px`                                                                              |
| OutlinedInput root small   | `height 35,86px`                                                                                                   |
| OutlinedInput input medium | `padding 16,5px 14px`, `font-size 13,125px` (pxToRem(15)), `line-height 20,125px`                                  |
| notchedOutline             | `border 1px rgba(145,158,171,0.2)`, `border-radius 8px`, `transition border-color 150ms cubic-bezier(0.4,0,0.2,1)` |
| notchedOutline (error)     | `border-color rgb(255,86,48)`, `1px`                                                                               |
| FilledInput root medium    | `height 51,86px`, `bg rgba(145,158,171,0.08)`, `border-radius 8px`                                                 |
| FilledInput root small     | `height 34,61px`                                                                                                   |
| FilledInput input          | `padding 8px 4px 9px`, `font-size 12,25px`                                                                         |
| Standard root medium/small | `height 27,86px` / `24,86px`                                                                                       |
| Label (repouso)            | `font-size 12,25px`, `weight 400`, `color #919EAB`, `translate(14px,16px)`                                         |
| Label (shrink)             | `font-size 14px`, `weight 600`, `color #637381`, `translate(14px,-9px) scale(0.75)`                                |
| Label transition           | `color/transform/max-width 200ms cubic-bezier(0,0,0.2,1)`                                                          |
| HelperText                 | `font-size 10,5px`, `line-height 15,75px`, `margin-top 8px`, `margin-left 14px`, `color #637381`                   |

### Composição aritmética das alturas

**Nenhuma altura de campo é declarada no tema.** Toda altura é soma de três parcelas:

```
altura do root = padding-top do input + altura do input + padding-bottom do input
altura do input = 1.4375em, onde 1em = font-size do input
```

Peças (todas verificáveis no fonte):

| Peça                  | Valor                                                 | Origem                                                                                  |
| --------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `font-size` do input  | `0.9375rem` = `15/16rem` = **13,125px**               | `src/theme/core/components/textfield.tsx:21` (`pxToRem(15)`)                            |
| `height` do input     | `1.4375em` → `1.4375 × 13,125` = **18,867px**         | `default MUI 7.0.1 (InputBase.js:149)`                                                  |
| `line-height` do root | `1.4375em` → `1.4375 × 14` = **20,125px**             | `default MUI 7.0.1 (InputBase.js:78)`                                                   |
| `font-size` do root   | `1rem` = **14px** (`typography.body1`)                | `default MUI 7.0.1 (InputBase.js:76)` + `src/theme/core/typography.ts:103-106`          |
| `color` do root       | `#1C252E` rgb(28,37,46) (`text.primary`)              | `default MUI 7.0.1 (InputBase.js:77)`                                                   |
| borda do `outlined`   | **não conta** — o `<fieldset>` é `position: absolute` | `default MUI 7.0.1 (node_modules/@mui/material/OutlinedInput/OutlinedInput.js:117-128)` |

Contas:

| Variante / size   | padding vertical do input                                                        | Conta                | Altura       | Medido        |
| ----------------- | -------------------------------------------------------------------------------- | -------------------- | ------------ | ------------- |
| `outlined` medium | `16,5px` + `16,5px` (`OutlinedInput.js:136`)                                     | 16,5 + 18,867 + 16,5 | **51,867px** | **51,86px** ✔ |
| `outlined` small  | `8,5px` + `8,5px` (`OutlinedInput.js:157-163`)                                   | 8,5 + 18,867 + 8,5   | **35,867px** | **35,86px** ✔ |
| `filled` medium   | `25px` + `8px` (`node_modules/@mui/material/FilledInput/FilledInput.js:200-203`) | 25 + 18,867 + 8      | **51,867px** | **51,86px** ✔ |
| `filled` small    | `21px` + `4px` (`FilledInput.js:226-233`)                                        | 21 + 18,867 + 4      | **43,867px** | ⚠️ ver abaixo |
| `standard` medium | `4px` + `5px` (`InputBase.js:145`)                                               | 4 + 18,867 + 5       | **27,867px** | **27,86px** ✔ |
| `standard` small  | `1px` + `5px` (`InputBase.js:203-209`)                                           | 1 + 18,867 + 5       | **24,867px** | **24,86px** ✔ |

⚠️ **`NÃO CONFIRMADO` — FilledInput small.** A medição da §10.3 (`34,61px`, com input
`padding 8px 4px 9px` e `font-size 12,25px`) **não corresponde** a um `<TextField variant="filled"
size="small">` puro (que daria `43,867px`). O padrão `padding-top: 8px` / `padding-bottom: 9px` só
existe na combinação `hiddenLabel` + `size="small"` (`FilledInput.js:256-263`), e o `padding` lateral
de `4px` só aparece dentro de `MuiAutocomplete` (`default MUI 7.0.1 (node_modules/@mui/material/Autocomplete/Autocomplete.js:179-184, 196-201)`).
A altura medida é aritmeticamente coerente com `font-size 12,25px`
(`8 + 1.4375 × 12,25 + 9 = 34,609px`), mas **não** com o `font-size 13,125px` do design system.
Conclusão: a medição provavelmente veio de uma instância específica (Autocomplete filled/small com
`hiddenLabel`), não do campo filled/small canônico. **Use `43,867px` como valor derivado do fonte e
trate `34,61px` como não reproduzível.**

### Padding, raio e outras medidas por variante

| Variante                 | padding do input                                             | padding extra com adorno                                                                                                                                      | border-radius               |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `outlined` medium        | `16,5px 14px`                                                | `padding-left: 14px` no root com `startAdornment`; `padding-right: 14px` com `endAdornment`; e o input perde o padding daquele lado (`padding-left/right: 0`) | `8px`                       |
| `outlined` small         | `8,5px 14px`                                                 | idem                                                                                                                                                          | `8px`                       |
| `outlined` multiline     | root `16,5px 14px` (small: `8,5px 14px`); input `padding: 0` | idem                                                                                                                                                          | `8px`                       |
| `filled` medium          | `25px 12px 8px 12px`                                         | `padding-left: 12px` / `padding-right: 12px` no root; input perde o padding do lado                                                                           | `8px` (**todos os cantos**) |
| `filled` small           | `21px 12px 4px 12px`                                         | idem                                                                                                                                                          | `8px`                       |
| `filled` + `hiddenLabel` | `16px` top / `17px` bottom (small: `8px` / `9px`)            | idem                                                                                                                                                          | `8px`                       |
| `standard`               | `4px 0 5px` (small: `1px 0 5px`)                             | —                                                                                                                                                             | `0`                         |

Origem: `default MUI 7.0.1` — `OutlinedInput.js:85-114, 129-190`; `FilledInput.js:144-190, 193-275`;
`InputBase.js:141-227`. Raio do `filled`: `src/theme/core/components/textfield.tsx:91`
(`borderRadius: theme.shape.borderRadius` = **8px**) — sobrescreve o
`border-top-left/right-radius` isolado do MUI (`FilledInput.js:67-68`).

| Propriedade                            | Valor bruto                      | Origem                                                                                            |
| -------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `border-radius` do `outlined`          | `8px`                            | `shape.borderRadius` — `src/theme/create-theme.ts:35` / `default MUI 7.0.1 (OutlinedInput.js:52)` |
| `border-radius` do input em `:focus`   | `inherit` (herda o raio do root) | `src/theme/core/components/textfield.tsx:18`                                                      |
| `min-width` do root em `multiline`     | padding do root `4px 0 5px`      | `default MUI 7.0.1 (InputBase.js:90-96)`                                                          |
| espessura da borda focada (`outlined`) | **`2px`**                        | `default MUI 7.0.1 (OutlinedInput.js:62-64)` — **não** sobrescrito pelo projeto                   |

---

## Comportamento do label (repouso × shrink)

O label é um `<label>` absoluto que transita por `transform`.

| Aspecto          | Repouso (`shrink = false`)                                                                                            | Encolhido (`shrink = true`)                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| tipografia       | `typography.body2`: `font-size 0.875rem` = **12,25px**, `font-weight 400`, `line-height 1.5714285714285714` (= 22/14) | `typography.body1`: `font-size 1rem` = **14px**, `line-height 1.5`, `font-weight` **600** |
| cor              | **`#919EAB`** rgb(145,158,171) (`text.disabled`)                                                                      | **`#637381`** rgb(99,115,129) (`text.secondary`)                                          |
| `max-width`      | `calc(100% - 24px)` (`outlined`/`filled`)                                                                             | `calc(133% - 32px)` (`outlined`) / `calc(133% - 24px)` (`filled`)                         |
| `pointer-events` | `none`                                                                                                                | `auto`                                                                                    |
| `user-select`    | herdado                                                                                                               | `none`                                                                                    |

Transformações por variante e tamanho:

| Variante   | size   | Repouso                          | Shrink                                 |
| ---------- | ------ | -------------------------------- | -------------------------------------- |
| `outlined` | medium | `translate(14px, 16px) scale(1)` | `translate(14px, -9px) scale(0.75)`    |
| `outlined` | small  | `translate(14px, 9px) scale(1)`  | `translate(14px, -9px) scale(0.75)`    |
| `filled`   | medium | `translate(12px, 16px) scale(1)` | **`translate(12px, 6px) scale(0.75)`** |
| `filled`   | small  | `translate(12px, 13px) scale(1)` | **`translate(12px, 6px) scale(0.75)`** |
| `standard` | medium | `translate(0, 20px) scale(1)`    | `translate(0, -1.5px) scale(0.75)`     |
| `standard` | small  | `translate(0, 17px) scale(1)`    | `translate(0, -1.5px) scale(0.75)`     |

- Os valores de `outlined` e `standard` são `default MUI 7.0.1 (node_modules/@mui/material/InputLabel/InputLabel.js:66-178)`.
- O `shrink` do `filled` é **override do projeto**: `translate(12px, 6px) scale(0.75)`
  (`src/theme/core/components/form.tsx:22`), no lugar dos `translate(12px, 7px)` (medium) e
  `translate(12px, 4px)` (small) do MUI (`InputLabel.js:126-145`). Como o seletor do projeto tem
  especificidade maior (`.MuiInputLabel-shrink.MuiInputLabel-filled`), vale para **os dois tamanhos**.
- `transform-origin: top left`; `zIndex: 1` em `filled`/`outlined`; `white-space: nowrap`;
  `overflow: hidden`; `text-overflow: ellipsis` — `default MUI 7.0.1 (InputLabel.js:59-65, 113, 152)`.
- `transition: color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms, transform 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms, max-width 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms`
  (`duration.shorter` = 200ms, `easing.easeOut`) — `default MUI 7.0.1 (InputLabel.js:94-103)`.
- O `shrink` é ligado automaticamente quando `filled || focused || adornedStart`
  (`default MUI 7.0.1 (InputLabel.js:194-197)`).

Cores do label por estado — só valem **no estado `shrink`** (o projeto aninhou tudo dentro de
`&.MuiInputLabel-shrink`, `src/theme/core/components/form.tsx:15-23`):

| Estado (shrink) | Cor                                     | Origem                                  |
| --------------- | --------------------------------------- | --------------------------------------- |
| normal          | `#637381` (`text.secondary`)            | `src/theme/core/components/form.tsx:18` |
| focused         | `#1C252E` (`text.primary`)              | `src/theme/core/components/form.tsx:19` |
| error           | `#FF5630` rgb(255,86,48) (`error.main`) | `src/theme/core/components/form.tsx:20` |
| disabled        | `#919EAB` (`text.disabled`)             | `src/theme/core/components/form.tsx:21` |

⚠️ No estado **em repouso** (`shrink = false`) não há regra do projeto para focused/error/disabled;
valem os defaults do `MuiFormLabel`: focused → `palette.primary.main` = **`#00A76F`**
(`default MUI 7.0.1 (node_modules/@mui/material/FormLabel/FormLabel.js:56-64)`, com `color`
resolvido para `'primary'` em `FormLabel.js:113`), error → `#FF5630`, disabled → `#919EAB`
(`FormLabel.js:65-75`). Na prática esse caminho só é alcançável forçando `shrink={false}`, já que
foco implica shrink.

---

## Placeholder

| Propriedade                    | Valor                                                                                                                               | Origem                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `opacity`                      | **`1`**                                                                                                                             | `src/theme/core/components/textfield.tsx:21` |
| `color`                        | **`#919EAB`** rgb(145,158,171) (`text.disabled`)                                                                                    | `src/theme/core/components/textfield.tsx:21` |
| transição de `opacity`         | `opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`                                                                                    | `default MUI 7.0.1 (InputBase.js:129-131)`   |
| ocultação com label em repouso | `label[data-shrink=false] + .MuiInputBase-formControl &::placeholder { opacity: 0 !important }`; volta ao valor visível em `:focus` | `default MUI 7.0.1 (InputBase.js:175-185)`   |

⚠️ Sem o override, o placeholder seria `color: currentColor` com `opacity: 0.42` (light) —
`default MUI 7.0.1 (InputBase.js:122-140)`. O projeto troca por **cor sólida + opacidade 1**,
o que muda o resultado em telas com fundo colorido.
Seletores atingidos pelo default MUI: `::-webkit-input-placeholder`, `::-moz-placeholder`,
`::-ms-input-placeholder`; o override do projeto usa o seletor padrão `::placeholder`.

---

## Regra de `font-size` abaixo de `sm` (anti-zoom do Safari)

```
@media (max-width: 599.95px) {
  .MuiInputBase-input { font-size: 1rem; }
}
```

Origem: `src/theme/core/components/textfield.tsx:22-25` — o código é
`[theme.breakpoints.down('sm')]: { fontSize: theme.typography.pxToRem(16) }`, com o comentário
_"This will prevent zoom in Safari min font size ~ 16px"_.

⚠️ **A intenção não é atingida neste projeto.** `pxToRem(16)` = `16/16` = `1rem`, e com
`html { font-size: 14px }` isso computa **14px**, não 16px. O iOS Safari dá zoom em campos com
`font-size < 16px`, então o comportamento anti-zoom **continua ocorrendo**.
Para reproduzir a _intenção_ em outra biblioteca, use `font-size: 16px` literal;
para reproduzir o _resultado atual_, use `14px`.

Breakpoint exato: `down('sm')` → `@media (max-width:599.95px)` (`FATOS.md` §5.2).

---

## Tabela de estados

Cores de referência: `grey.500 = #919EAB = rgb(145,158,171)` · `text.primary = #1C252E` ·
`text.secondary = #637381` · `text.disabled = #919EAB` · `error.main = #FF5630 = rgb(255,86,48)` ·
`action.disabledBackground = rgba(145 158 171 / 0.24)`.

### `outlined`

| Estado                                  | Fundo         | Texto                                 | Borda (`notchedOutline`)                             | Sombra | Transição                                             |
| --------------------------------------- | ------------- | ------------------------------------- | ---------------------------------------------------- | ------ | ----------------------------------------------------- |
| default                                 | `transparent` | `#1C252E`                             | **`1px solid rgba(145 158 171 / 0.2)`**              | `none` | `border-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` |
| hover                                   | `transparent` | `#1C252E`                             | `1px solid #1C252E` (`text.primary`)                 | `none` | idem                                                  |
| focus / focus-visible                   | `transparent` | `#1C252E`                             | **`2px solid #1C252E`** (cor: projeto; largura: MUI) | `none` | idem                                                  |
| error                                   | `transparent` | `#1C252E`                             | **`1px solid #FF5630`**                              | `none` | idem                                                  |
| error + focus                           | `transparent` | `#1C252E`                             | **`2px solid #FF5630`**                              | `none` | idem                                                  |
| disabled                                | `transparent` | `#919EAB` (`-webkit-text-fill-color`) | **`1px solid rgba(145 158 171 / 0.24)`**             | `none` | idem                                                  |
| hover em touch (`@media (hover: none)`) | `transparent` | `#1C252E`                             | `1px solid rgba(0 0 0 / 0.23)`                       | `none` | idem                                                  |

Origem: `src/theme/core/components/textfield.tsx:52-74` (focus/error/disabled + cor e transição da
borda de repouso); hover e largura 2px do foco em `default MUI 7.0.1 (OutlinedInput.js:53-64)`.

⚠️ **Ordem importa**: no override, o bloco `.Mui-error` vem **depois** do `.Mui-focused`
(`textfield.tsx:60-62`), com a mesma especificidade → em `error + focused` a cor vermelha prevalece.
⚠️ O `@media (hover: none)` do MUI reintroduz `rgba(0 0 0 / 0.23)`, um valor **fora da paleta**
(`default MUI 7.0.1 (OutlinedInput.js:56-61, 124-127)`).

### `filled`

| Estado         | Fundo                                                        | Texto     | Borda                              | Sombra | Transição                                                 |
| -------------- | ------------------------------------------------------------ | --------- | ---------------------------------- | ------ | --------------------------------------------------------- |
| default        | **`rgba(145 158 171 / 0.08)`**                               | `#1C252E` | nenhuma (`disableUnderline: true`) | `none` | `background-color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms` |
| hover          | **`rgba(145 158 171 / 0.16)`**                               | `#1C252E` | nenhuma                            | `none` | idem                                                      |
| focus          | **`rgba(145 158 171 / 0.16)`**                               | `#1C252E` | nenhuma                            | `none` | idem                                                      |
| error          | **`rgba(255 86 48 / 0.08)`**                                 | `#1C252E` | nenhuma                            | `none` | idem                                                      |
| error + focus  | **`rgba(255 86 48 / 0.16)`**                                 | `#1C252E` | nenhuma                            | `none` | idem                                                      |
| disabled       | **`rgba(145 158 171 / 0.24)`** (`action.disabledBackground`) | `#919EAB` | nenhuma                            | `none` | idem                                                      |
| hover em touch | volta ao fundo de repouso                                    | —         | —                                  | —      | idem                                                      |

Origem: `src/theme/core/components/textfield.tsx:84, 90-106`;
transição em `default MUI 7.0.1 (FilledInput.js:69-72)`.

⚠️ Sem os overrides, o `filled` usaria `rgba(0, 0, 0, 0.06)` / `0.09` / `0.12`
(`default MUI 7.0.1 (FilledInput.js:59-63, 66-85)`) e teria sublinhado.

### `standard` (`MuiInput`)

| Estado                          | Fundo         | Texto     | Borda (linha inferior)                                                                              | Sombra | Transição                                                                  |
| ------------------------------- | ------------- | --------- | --------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------- |
| default                         | `transparent` | `#1C252E` | `::before` = **`1px solid rgba(145 158 171 / 0.32)`**                                               | `none` | `border-bottom-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` no `::before` |
| hover (não disabled, não error) | `transparent` | `#1C252E` | `::before` = `2px solid #1C252E`                                                                    | `none` | idem                                                                       |
| hover em touch                  | `transparent` | `#1C252E` | `::before` = `1px solid rgba(0 0 0 / <opacity.inputUnderline>)`                                     | `none` | idem                                                                       |
| focus                           | `transparent` | `#1C252E` | `::after` = **`2px solid #1C252E`** revelado por `transform: scaleX(0)` → `scaleX(1) translateX(0)` | `none` | `transform 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms`                         |
| error                           | `transparent` | `#1C252E` | `::before` e `::after` = `border-bottom-color: #FF5630`                                             | `none` | idem                                                                       |
| disabled                        | `transparent` | `#919EAB` | `::before` = `border-bottom-style: dotted`                                                          | `none` | idem                                                                       |

Origem: `src/theme/core/components/textfield.tsx:38-41` (cores do `::before` e `::after`);
o resto é `default MUI 7.0.1 (node_modules/@mui/material/Input/Input.js:58-132)`.

- Quando dentro de `FormControl` (caso do `TextField`): `label + & { margin-top: 16px }`
  (`default MUI 7.0.1 (Input.js:60-68)`).
- ⚠️ Sem o override, o `::after` seria `2px solid palette.primary.main` (`#00A76F`) —
  o projeto troca para `#1C252E` (`text.primary`), matando a cor de marca na linha de foco.

### Estados comuns a todas as variantes (`MuiInputBase`)

| Estado                     | Efeito                                                                                                                                                                                                | Origem                                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| disabled — root            | `color: #919EAB` (`text.disabled`), `cursor: default`                                                                                                                                                 | `default MUI 7.0.1 (InputBase.js:86-89)`                                                                                                                       |
| disabled — input           | `opacity: 1`, `-webkit-text-fill-color: #919EAB`                                                                                                                                                      | `default MUI 7.0.1 (InputBase.js:186-190)`                                                                                                                     |
| disabled — ícones internos | **`& svg { color: #919EAB }`**                                                                                                                                                                        | `src/theme/core/components/textfield.tsx:17`                                                                                                                   |
| `:focus` do input          | `outline: 0`; `border-radius: inherit` (override do projeto)                                                                                                                                          | `default MUI 7.0.1 (InputBase.js:163-165)` + `src/theme/core/components/textfield.tsx:18`                                                                      |
| `:invalid`                 | `box-shadow: none` (reset do Firefox)                                                                                                                                                                 | `default MUI 7.0.1 (InputBase.js:167-169)`                                                                                                                     |
| autofill                   | `animation-name: mui-auto-fill`, `animation-duration: 5000s`; `border-radius: inherit`; em dark `-webkit-box-shadow: 0 0 0 100px #266798 inset`, `-webkit-text-fill-color: #fff`, `caret-color: #fff` | `default MUI 7.0.1 (InputBase.js:191-202)`, `OutlinedInput.js:145-156`, `FilledInput.js:213-225` — ⚠️ `#266798` é um hex do MUI, **fora da paleta** do projeto |
| `loading`                  | **não existe** em campos de texto                                                                                                                                                                     | —                                                                                                                                                              |
| `selected`                 | **não existe** em campos de texto                                                                                                                                                                     | —                                                                                                                                                              |

---

## Texto auxiliar (`FormHelperText`)

| Propriedade                    | Valor bruto                                     | Origem                                                                                                                                                                                   |
| ------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| elemento                       | **`<div>`**                                     | `src/theme/core/components/form.tsx:34` (`defaultProps: { component: 'div' }`) — MUI usaria `<p>` (`default MUI 7.0.1 (node_modules/@mui/material/FormHelperText/FormHelperText.js:89)`) |
| `margin-top`                   | **`8px`**                                       | `src/theme/core/components/form.tsx:39` (`theme.spacing(1)`) — MUI usaria `3px` (`FormHelperText.js:54`)                                                                                 |
| `margin-left` / `margin-right` | `14px` (só nas variantes `filled` e `outlined`) | `default MUI 7.0.1 (FormHelperText.js:71-78, 108)`                                                                                                                                       |
| `font-size`                    | `0.75rem` = **10,5px** (`typography.caption`)   | `default MUI 7.0.1 (FormHelperText.js:52)` + `src/theme/core/typography.ts:111-114`                                                                                                      |
| `line-height`                  | `1.5` → **15,75px**                             | idem                                                                                                                                                                                     |
| `color`                        | `#637381` (`text.secondary`)                    | `default MUI 7.0.1 (FormHelperText.js:51)`                                                                                                                                               |
| `color` (error)                | `#FF5630`                                       | `default MUI 7.0.1 (FormHelperText.js:61-63)`                                                                                                                                            |
| `color` (disabled)             | `#919EAB`                                       | `default MUI 7.0.1 (FormHelperText.js:58-60)`                                                                                                                                            |
| `text-align`                   | `left`                                          | `default MUI 7.0.1 (FormHelperText.js:53)`                                                                                                                                               |

Detalhes completos em `form-labels.md`.

---

## Regras de uso observadas

1. **Nenhuma altura é fixada.** Campos crescem/encolhem com o `font-size` do input (13,125px) e o
   padding da variante. Para portar: replique a fórmula
   `padding-top + 1.4375 × font-size + padding-bottom`, não os números finais.
2. **A borda do `outlined` não ocupa espaço** (é um `<fieldset>` absoluto). Ao reimplementar com
   `border` normal, some 2px na altura ou use `box-sizing`/`outline` para compensar.
3. **`filled` sem sublinhado, com raio completo de 8px** — o `filled` do projeto é um "campo
   preenchido arredondado", não o campo Material clássico.
4. **A cor de foco não é a cor de marca.** Tanto o `outlined` (borda) quanto o `standard`
   (`::after`) usam `#1C252E` (`text.primary`). Verde `#00A76F` só aparece no label em repouso
   focado — caminho praticamente inalcançável.
5. **A borda de foco engrossa para 2px** (default MUI não sobrescrito). O layout não muda porque o
   fieldset é absoluto, mas a espessura é perceptível.
6. **Escala de alfas do cinza é o padrão de toda a família de inputs**:
   `0.08` (fundo filled) → `0.16` (hover/focus filled) → `0.2` (borda outlined) →
   `0.24` (disabled) → `0.32` (linha do standard).
7. **O label encolhido é maior que o label em repouso** (14px × 0,75 = 10,5px efetivos contra
   12,25px em repouso) **e fica mais escuro e mais pesado** (600). É uma inversão deliberada da
   hierarquia Material.
8. **Placeholder é cor sólida, não opacidade** — replicar com `opacity` daria resultado diferente.
9. **A regra anti-zoom do Safari está quebrada** por causa da base de 14px (ver seção acima).

---

## Origem

| Item                                                              | Arquivo:linha                                                               |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `MuiInputBase.root` — ícones em disabled + raio do input em foco  | `src/theme/core/components/textfield.tsx:16-19`                             |
| `MuiInputBase.input` — `font-size: pxToRem(15)`                   | `src/theme/core/components/textfield.tsx:21`                                |
| `MuiInputBase.input` — regra `down('sm')` = `pxToRem(16)`         | `src/theme/core/components/textfield.tsx:22-25`                             |
| `MuiInputBase.input` — placeholder (`opacity 1`, `text.disabled`) | `src/theme/core/components/textfield.tsx:21`                                |
| `MuiInput.underline` — `::before` e `::after`                     | `src/theme/core/components/textfield.tsx:38-41`                             |
| `MuiOutlinedInput.root` — focused / error / disabled              | `src/theme/core/components/textfield.tsx:52-68`                             |
| `MuiOutlinedInput.notchedOutline` — cor e transição               | `src/theme/core/components/textfield.tsx:69-74`                             |
| `MuiFilledInput.defaultProps` — `disableUnderline: true`          | `src/theme/core/components/textfield.tsx:84`                                |
| `MuiFilledInput.root` — raio, fundos, error, disabled             | `src/theme/core/components/textfield.tsx:90-106`                            |
| `MuiTextField.defaultProps` — `variant: 'outlined'`               | `src/theme/core/components/textfield.tsx:114`                               |
| `MuiTextField.styleOverrides` — vazio                             | `src/theme/core/components/textfield.tsx:119`                               |
| Export do bloco                                                   | `src/theme/core/components/textfield.tsx:124-130`                           |
| `MuiFormLabel.root` — label em repouso e shrink                   | `src/theme/core/components/form.tsx:12-24`                                  |
| `MuiFormHelperText` — `component: 'div'`, `margin-top: 8px`       | `src/theme/core/components/form.tsx:34, 39`                                 |
| `shape.borderRadius = 8`                                          | `src/theme/create-theme.ts:35`                                              |
| `typography.body1` / `body2` / `caption`                          | `src/theme/core/typography.ts:103-106, 107-110, 111-114`                    |
| `text.*` e `action.disabledBackground`                            | `src/theme/core/palette.ts:91-94, 103-111`                                  |
| `error.main = #FF5630`                                            | `src/theme/theme-config.ts:47-109`                                          |
| Medições de runtime                                               | `frontend/.ds-extract/FATOS.md` §10.3                                       |
| Defaults MUI — `TextField`                                        | `node_modules/@mui/material/TextField/TextField.js:42-46, 95-119`           |
| Defaults MUI — `FormControl`                                      | `node_modules/@mui/material/FormControl/FormControl.js:42-77`               |
| Defaults MUI — `InputBase`                                        | `node_modules/@mui/material/InputBase/InputBase.js:69-229`                  |
| Defaults MUI — `OutlinedInput`                                    | `node_modules/@mui/material/OutlinedInput/OutlinedInput.js:41-190`          |
| Defaults MUI — `FilledInput`                                      | `node_modules/@mui/material/FilledInput/FilledInput.js:46-275`              |
| Defaults MUI — `Input`                                            | `node_modules/@mui/material/Input/Input.js:40-137`                          |
| Defaults MUI — `InputLabel`                                       | `node_modules/@mui/material/InputLabel/InputLabel.js:45-179, 180-197`       |
| Defaults MUI — `FormLabel`                                        | `node_modules/@mui/material/FormLabel/FormLabel.js:39-87, 105-120`          |
| Defaults MUI — `FormHelperText`                                   | `node_modules/@mui/material/FormHelperText/FormHelperText.js:39-80, 81-110` |

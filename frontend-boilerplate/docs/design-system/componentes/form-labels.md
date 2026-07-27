# Rótulos de formulário

`MuiFormLabel` / `MuiInputLabel` + `MuiFormHelperText` + `MuiFormControlLabel`.

> **Base de conversão**: `html { font-size: 14px }` → `px_real = rem × 14` (`FATOS.md` §1).
> Os três componentes ficam no mesmo arquivo de override: `src/theme/core/components/form.tsx`
> (53 linhas, 3 chaves `Mui*`).

---

# FormLabel / InputLabel

`MuiFormLabel` é o rótulo genérico (usado por `FormControl`, `RadioGroup`, `FormGroup`).
`InputLabel` **estende** `FormLabel` (`InputLabelRoot = styled(FormLabel, { name: 'MuiInputLabel' })`,
`default MUI 7.0.1 (node_modules/@mui/material/InputLabel/InputLabel.js:45-48)`), portanto **herda
todos os overrides de `MuiFormLabel`** do projeto.

⚠️ O projeto **não** declara `MuiInputLabel` — só `MuiFormLabel` (`FATOS.md` §11).
Todo o comportamento de label flutuante documentado aqui chega ao `TextField` por herança.

## Anatomia

| Parte                       | Classe                                                                                     | O que é                                       |
| --------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------- |
| root                        | `.MuiFormLabel-root` (+ `.MuiInputLabel-root` quando aplicável)                            | `<label>`; `padding: 0`, `position: relative` |
| asterisco de obrigatório    | `.MuiFormLabel-asterisk`                                                                   | `<span>` renderizado quando `required`        |
| estados                     | `.Mui-focused` · `.Mui-error` · `.Mui-disabled` · `.Mui-required` · `.MuiFormLabel-filled` | classes de estado                             |
| variantes (só `InputLabel`) | `.MuiInputLabel-outlined` · `.MuiInputLabel-filled` · `.MuiInputLabel-standard`            | —                                             |
| encolhido (só `InputLabel`) | `.MuiInputLabel-shrink`                                                                    | estado flutuante                              |
| dentro de `FormControl`     | `.MuiInputLabel-formControl`                                                               | ativa o posicionamento absoluto               |

Propriedades estruturais do `InputLabel` (`default MUI 7.0.1 (InputLabel.js:59-65)`):
`display: block`, `transform-origin: top left`, `white-space: nowrap`, `overflow: hidden`,
`text-overflow: ellipsis`, `max-width: 100%`.
Dentro de `FormControl`: `position: absolute`, `left: 0`, `top: 0` (`InputLabel.js:66-76`).

## Variantes e tamanhos

- Variantes (herdadas do input): `outlined` | `filled` | `standard`.
- Tamanhos: `medium` (default) | `small` — mudam apenas o `transform` de repouso.
- Cores: o `FormLabel` resolve `color` para `'primary'` quando nada é informado
  (`default MUI 7.0.1 (node_modules/@mui/material/FormLabel/FormLabel.js:113)`).

## Medidas e tipografia

### Estado de repouso (`shrink = false`)

| Propriedade   | Valor bruto                                                                                                                                                                    | Referência simbólica    | Origem                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ------------------------------------------------------------- |
| `font-size`   | **`0.875rem`** = **12,25px**                                                                                                                                                   | `typography.body2`      | `src/theme/core/components/form.tsx:13`                       |
| `font-weight` | **`400`**                                                                                                                                                                      | `typography.body2`      | idem                                                          |
| `line-height` | **`1.5714285714285714`** (= 22/14) → **19,25px**                                                                                                                               | `typography.body2`      | idem                                                          |
| `font-family` | `"Public Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"` | `typography.fontFamily` | idem                                                          |
| `color`       | **`#919EAB`** rgb(145,158,171)                                                                                                                                                 | `text.disabled`         | `src/theme/core/components/form.tsx:14`                       |
| `padding`     | `0`                                                                                                                                                                            | —                       | `default MUI 7.0.1 (FormLabel.js:54)`                         |
| `position`    | `relative` (ou `absolute` dentro de `FormControl`)                                                                                                                             | —                       | `default MUI 7.0.1 (FormLabel.js:55)` / `InputLabel.js:70-76` |

⚠️ Sem os overrides, o `FormLabel` seria `typography.body1` (`1rem` = 14px, `line-height: 1.4375em`)
com `color: text.secondary` (`#637381`) — `default MUI 7.0.1 (FormLabel.js:51-55)`.
O projeto **reduz e clareia** o rótulo em repouso.

### Estado encolhido (`shrink = true`)

| Propriedade                      | Valor bruto                                                       | Referência simbólica                           | Origem                                               |
| -------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `font-size`                      | **`1rem`** = **14px**                                             | `typography.body1`                             | `src/theme/core/components/form.tsx:16`              |
| `font-weight`                    | **`600`**                                                         | literal no override (não `fontWeightSemiBold`) | `src/theme/core/components/form.tsx:17`              |
| `line-height`                    | **`1.5`** → **21px**                                              | `typography.body1`                             | `src/theme/core/components/form.tsx:16`              |
| `color`                          | **`#637381`** rgb(99,115,129)                                     | `text.secondary`                               | `src/theme/core/components/form.tsx:18`              |
| `max-width`                      | `calc(133% - 32px)` (`outlined`) / `calc(133% - 24px)` (`filled`) | —                                              | `default MUI 7.0.1 (InputLabel.js:165-177, 126-136)` |
| `user-select` / `pointer-events` | `none` / `auto`                                                   | —                                              | idem                                                 |

⚠️ **Tamanho aparente**: 14px × `scale(0.75)` = **10,5px** visualmente, contra 12,25px em repouso.
O rótulo **encolhe, escurece e engrossa** ao mesmo tempo.

### Transformações

| Variante   | size   | Repouso                          | Shrink                                 | Origem                                                                                            |
| ---------- | ------ | -------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `outlined` | medium | `translate(14px, 16px) scale(1)` | `translate(14px, -9px) scale(0.75)`    | `default MUI 7.0.1 (InputLabel.js:146-177)`                                                       |
| `outlined` | small  | `translate(14px, 9px) scale(1)`  | `translate(14px, -9px) scale(0.75)`    | idem                                                                                              |
| `filled`   | medium | `translate(12px, 16px) scale(1)` | **`translate(12px, 6px) scale(0.75)`** | `default MUI 7.0.1 (InputLabel.js:104-125)` + **projeto** `src/theme/core/components/form.tsx:22` |
| `filled`   | small  | `translate(12px, 13px) scale(1)` | **`translate(12px, 6px) scale(0.75)`** | idem                                                                                              |
| `standard` | medium | `translate(0, 20px) scale(1)`    | `translate(0, -1.5px) scale(0.75)`     | `default MUI 7.0.1 (InputLabel.js:66-93)`                                                         |
| `standard` | small  | `translate(0, 17px) scale(1)`    | `translate(0, -1.5px) scale(0.75)`     | idem                                                                                              |

⚠️ O override de `filled` shrink (`src/theme/core/components/form.tsx:22`) tem especificidade
`.MuiInputLabel-shrink.MuiInputLabel-filled` e por isso vale **nos dois tamanhos**, substituindo
tanto o `translate(12px, 7px)` (medium) quanto o `translate(12px, 4px)` (small) do MUI.

### Transição

`transition: color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms, transform 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms, max-width 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms`

- `duration.shorter` = **200ms**; `easing.easeOut` = `cubic-bezier(0.0, 0, 0.2, 1)`.
- Origem: `default MUI 7.0.1 (InputLabel.js:94-103)`; medido em runtime (`FATOS.md` §10.3).
- Desligável com `disableAnimation` (default `false`, `InputLabel.js:186`).

### Quando o label encolhe

`shrink = filled || focused || adornedStart` — `default MUI 7.0.1 (InputLabel.js:194-197)`.
Ou seja: campo com valor, campo focado, ou campo com adorno inicial.

## Tabela de estados

| Estado                          | Fundo         | Texto                                                 | Borda   | Sombra | Transição                          |
| ------------------------------- | ------------- | ----------------------------------------------------- | ------- | ------ | ---------------------------------- |
| repouso (normal)                | `transparent` | **`#919EAB`** (`text.disabled`)                       | nenhuma | `none` | 200ms cubic-bezier(0.0, 0, 0.2, 1) |
| repouso + focused               | `transparent` | **`#00A76F`** (`primary.main`) ⚠️                     | nenhuma | `none` | idem                               |
| repouso + error                 | `transparent` | `#FF5630` (`error.main`)                              | nenhuma | `none` | idem                               |
| repouso + disabled              | `transparent` | `#919EAB` (`text.disabled`)                           | nenhuma | `none` | idem                               |
| shrink (normal)                 | `transparent` | **`#637381`** (`text.secondary`), peso 600            | nenhuma | `none` | idem                               |
| shrink + focused                | `transparent` | **`#1C252E`** (`text.primary`), peso 600              | nenhuma | `none` | idem                               |
| shrink + error                  | `transparent` | **`#FF5630`** rgb(255,86,48) (`error.main`), peso 600 | nenhuma | `none` | idem                               |
| shrink + disabled               | `transparent` | **`#919EAB`** (`text.disabled`), peso 600             | nenhuma | `none` | idem                               |
| asterisco (`required`) em error | `transparent` | `#FF5630`                                             | nenhuma | `none` | —                                  |

Origem: shrink → `src/theme/core/components/form.tsx:15-23`;
repouso focused/error/disabled → `default MUI 7.0.1 (FormLabel.js:56-75)`;
asterisco → `default MUI 7.0.1 (FormLabel.js:77-87)`.

⚠️ **O verde `#00A76F` no label em repouso focado é a única aparição da cor de marca em todo o
sistema de campos** — e é praticamente inalcançável, porque foco implica `shrink` (o caminho só
existe forçando `shrink={false}`). `⚠️ NÃO CONFIRMADO` em runtime.

⚠️ O projeto **não** cria regra de estado para o repouso; todas as regras estão aninhadas dentro de
`&.MuiInputLabel-shrink`. Consequência: em `FormLabel` "puro" (fora de um input flutuante — por
exemplo o rótulo de um `RadioGroup`), o label é **sempre** `#919EAB`, exceto focado/erro/desabilitado,
que caem nos defaults do MUI.

---

# FormHelperText

## Anatomia

| Parte     | Classe                                                                                                                 | O que é                 |
| --------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| root      | `.MuiFormHelperText-root`                                                                                              | **`<div>`** (não `<p>`) |
| estados   | `.Mui-error` · `.Mui-disabled` · `.Mui-required` · `.Mui-focused`                                                      | —                       |
| variantes | `.MuiFormHelperText-contained` (em `filled`/`outlined`) · `.MuiFormHelperText-filled` · `.MuiFormHelperText-sizeSmall` | —                       |

⚠️ **`defaultProps: { component: 'div' }`** — `src/theme/core/components/form.tsx:34`.
O MUI usaria `<p>` (`default MUI 7.0.1 (node_modules/@mui/material/FormHelperText/FormHelperText.js:89)`).
Isso permite colocar elementos de bloco (listas, ícones, links) dentro do texto de ajuda sem HTML inválido.

## Variantes e tamanhos

- Não há variantes próprias. `contained` é ativado automaticamente quando a variante do
  `FormControl` é `filled` ou `outlined` (`default MUI 7.0.1 (FormHelperText.js:108)`).
- Tamanhos: herda `size` do `FormControl` (`small` altera só a margem — e é anulado pelo projeto).

## Medidas

| Propriedade                                           | Valor bruto               | Referência simbólica | Origem                                                                              |
| ----------------------------------------------------- | ------------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| `margin-top`                                          | **`8px`**                 | `theme.spacing(1)`   | `src/theme/core/components/form.tsx:39`                                             |
| `margin-right` / `margin-bottom` / `margin-left`      | `0` (base)                | —                    | `default MUI 7.0.1 (FormHelperText.js:55-57)`                                       |
| `margin-left` / `margin-right` em `filled`/`outlined` | **`14px`**                | —                    | `default MUI 7.0.1 (FormHelperText.js:71-78)`                                       |
| `font-size`                                           | `0.75rem` = **10,5px**    | `typography.caption` | `default MUI 7.0.1 (FormHelperText.js:52)` + `src/theme/core/typography.ts:111-114` |
| `line-height`                                         | `1.5` → **15,75px**       | `typography.caption` | idem                                                                                |
| `font-weight`                                         | `400`                     | `typography.caption` | idem                                                                                |
| `text-align`                                          | `left`                    | —                    | `default MUI 7.0.1 (FormHelperText.js:53)`                                          |
| `color`                                               | `#637381` rgb(99,115,129) | `text.secondary`     | `default MUI 7.0.1 (FormHelperText.js:51)`                                          |

⚠️ `margin-top` do MUI seria `3px` (`FormHelperText.js:54`) e `4px` em `size="small"`
(`FormHelperText.js:64-70`). O override do projeto (`styleOverrides.root`) é aplicado **depois** dos
estilos base e com a mesma especificidade → **`8px` vale em todos os tamanhos**.

Medido em runtime (`FATOS.md` §10.3): `font-size 10,5px`, `line-height 15,75px`,
`margin-top 8px`, `margin-left 14px`, `color #637381` ✔

## Tabela de estados

| Estado                 | Fundo         | Texto                                            | Borda   | Sombra | Transição             |
| ---------------------- | ------------- | ------------------------------------------------ | ------- | ------ | --------------------- |
| default                | `transparent` | `#637381` rgb(99,115,129) (`text.secondary`)     | nenhuma | `none` | **nenhuma declarada** |
| error                  | `transparent` | **`#FF5630`** rgb(255,86,48) (`error.main`)      | nenhuma | `none` | —                     |
| disabled               | `transparent` | **`#919EAB`** rgb(145,158,171) (`text.disabled`) | nenhuma | `none` | —                     |
| focused                | `transparent` | `#637381` (sem regra própria)                    | nenhuma | `none` | —                     |
| `selected` / `loading` | não existem   | —                                                | —       | —      | —                     |

Origem: `default MUI 7.0.1 (FormHelperText.js:58-63)`. O projeto **não** altera nenhuma cor de estado.

---

# FormControlLabel

Wrapper que junta um controle (`Checkbox`, `Radio`, `Switch`) ao seu rótulo.

## Anatomia

```
label                    .MuiFormControlLabel-root
├── (control)             .MuiCheckbox-root | .MuiRadio-root | .MuiSwitch-root
└── span                  .MuiFormControlLabel-label     (um <Typography component="span">)
    (+ span               .MuiFormControlLabel-asterisk  quando required)
```

| Parte     | Classe                          | O que é                                                                                                                                           |
| --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| root      | `.MuiFormControlLabel-root`     | `<label>`, `display: inline-flex`, `align-items: center`, `cursor: pointer`, `vertical-align: middle`, `-webkit-tap-highlight-color: transparent` |
| rótulo    | `.MuiFormControlLabel-label`    | `<Typography component="span">` — `default MUI 7.0.1 (node_modules/@mui/material/FormControlLabel/FormControlLabel.js:173-186)`                   |
| asterisco | `.MuiFormControlLabel-asterisk` | `<span aria-hidden>` com `\u2009*`; envolvidos por uma `<div>` quando `required` (`FormControlLabel.js:192-199`)                                  |

## Variantes e tamanhos

- `labelPlacement`: `'end'` (**default**, `default MUI 7.0.1 (FormControlLabel.js:132)`) |
  `'start'` | `'top'` | `'bottom'`.
- Não há `size` próprio — o tamanho vem do controle.

## Medidas

| Propriedade               | Valor bruto                                                               | Referência simbólica | Origem                                          |
| ------------------------- | ------------------------------------------------------------------------- | -------------------- | ----------------------------------------------- |
| `font-size` do rótulo     | **`0.875rem`** = **12,25px**                                              | `typography.body2`   | `src/theme/core/components/form.tsx:48`         |
| `font-weight` do rótulo   | **`400`**                                                                 | `typography.body2`   | idem                                            |
| `line-height` do rótulo   | **`1.5714285714285714`** (= 22/14) → **19,25px**                          | `typography.body2`   | idem                                            |
| `margin-left` (root)      | `-11px`                                                                   | —                    | `default MUI 7.0.1 (FormControlLabel.js:60)`    |
| `margin-right` (root)     | `16px`                                                                    | —                    | `default MUI 7.0.1 (FormControlLabel.js:61)`    |
| `labelPlacement="start"`  | `flex-direction: row-reverse`, `margin-right: -11px`, `margin-left: 16px` | —                    | `default MUI 7.0.1 (FormControlLabel.js:71-99)` |
| `labelPlacement="top"`    | `flex-direction: column-reverse`, `margin-left: 16px`                     | —                    | idem                                            |
| `labelPlacement="bottom"` | `flex-direction: column`, `margin-left: 16px`                             | —                    | idem                                            |

⚠️ Sem o override, o rótulo seria `typography.body1` (`1rem` = 14px) — o default do
`Typography` (`default MUI 7.0.1 (FormControlLabel.js:173-177)`).

⚠️ O `margin-left: -11px` do root existe para compensar o `padding: 9px` do `SwitchBase` do MUI.
Como o projeto reduziu esse padding para **8px** (`src/theme/core/components/checkbox.tsx:48`,
`radio.tsx:45`), a compensação fica **1px maior que o necessário**: o controle sobra 1px à esquerda
da caixa de conteúdo. `⚠️ NÃO CONFIRMADO` em runtime.

## Tabela de estados

| Estado               | Fundo                                        | Texto (rótulo)                                   | Borda   | Sombra | Transição             |
| -------------------- | -------------------------------------------- | ------------------------------------------------ | ------- | ------ | --------------------- |
| default              | `transparent`                                | herdada (`#1C252E`, `text.primary`)              | nenhuma | `none` | **nenhuma declarada** |
| hover                | `transparent` (o hover visual é do controle) | inalterada                                       | nenhuma | `none` | —                     |
| disabled             | `transparent`, `cursor: default`             | **`#919EAB`** rgb(145,158,171) (`text.disabled`) | nenhuma | `none` | —                     |
| error (asterisco)    | `transparent`                                | asterisco em `#FF5630` (`error.main`)            | nenhuma | `none` | —                     |
| `selected` / `focus` | não têm estilo próprio — vivem no controle   | —                                                | —       | —      | —                     |

Origem: `default MUI 7.0.1 (FormControlLabel.js:63-70, 102-112)`.

---

## Regras de uso observadas

1. **O rótulo de campo em repouso é `text.disabled` (`#919EAB`)** — visualmente "apagado", como se
   fosse placeholder. Só ao encolher ele vira `text.secondary`/`text.primary` e ganha peso 600.
2. **A hierarquia é invertida em relação ao Material padrão**: repouso = 12,25px/400/claro;
   encolhido = 14px×0,75/600/escuro. O rótulo **ganha** importância quando o campo é preenchido.
3. **Cor de foco do rótulo é neutra (`text.primary`)**, não a cor de marca — mesma decisão da borda
   do campo (`campo-texto.md`).
4. **Só `error` tem cor semântica** no rótulo encolhido (`#FF5630`).
5. **Texto auxiliar é `<div>` com `margin-top: 8px`** — o dobro-e-meio do MUI (3px), alinhado à
   grade de 8px do sistema. Em `filled`/`outlined` também recua 14px à esquerda, acompanhando o
   `padding` do input.
6. **Rótulo de checkbox/radio/switch é `body2` (12,25px)** — o mesmo tamanho do rótulo de campo em
   repouso. É o "tamanho de formulário" do sistema.
7. **Nenhum destes três componentes declara transição**, exceto o `InputLabel` (200ms
   `cubic-bezier(0.0, 0, 0.2, 1)` em `color`, `transform` e `max-width`).
8. **`600` é escrito literalmente** em `form.tsx:17`, e não via `typography.fontWeightSemiBold`
   (que também vale `'600'`, mas como **string**). Resultado idêntico, notação inconsistente.

---

## Origem

| Item                                                                   | Arquivo:linha                                                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `MuiFormLabel.root` — `body2` + `text.disabled` (repouso)              | `src/theme/core/components/form.tsx:12-14`                                        |
| `MuiFormLabel.root` — bloco `&.MuiInputLabel-shrink`                   | `src/theme/core/components/form.tsx:15-23`                                        |
| shrink — `body1` + `font-weight: 600`                                  | `src/theme/core/components/form.tsx:16-17`                                        |
| shrink — `color: text.secondary`                                       | `src/theme/core/components/form.tsx:18`                                           |
| shrink — `&.Mui-focused` → `text.primary`                              | `src/theme/core/components/form.tsx:19`                                           |
| shrink — `&.Mui-error` → `error.main`                                  | `src/theme/core/components/form.tsx:20`                                           |
| shrink — `&.Mui-disabled` → `text.disabled`                            | `src/theme/core/components/form.tsx:21`                                           |
| shrink — `&.MuiInputLabel-filled` → `translate(12px, 6px) scale(0.75)` | `src/theme/core/components/form.tsx:22`                                           |
| `MuiFormHelperText.defaultProps` — `component: 'div'`                  | `src/theme/core/components/form.tsx:34`                                           |
| `MuiFormHelperText.root` — `margin-top: 8px`                           | `src/theme/core/components/form.tsx:39`                                           |
| `MuiFormControlLabel.label` — `body2`                                  | `src/theme/core/components/form.tsx:48`                                           |
| Export do bloco                                                        | `src/theme/core/components/form.tsx:53`                                           |
| `typography.body1` / `body2` / `caption`                               | `src/theme/core/typography.ts:103-106, 107-110, 111-114`                          |
| `fontWeightSemiBold = '600'`                                           | `src/theme/core/typography.ts:52`                                                 |
| `text.primary` / `secondary` / `disabled`                              | `src/theme/core/palette.ts:91-94`                                                 |
| `error.main = #FF5630`                                                 | `src/theme/theme-config.ts:47-109`                                                |
| Medições de runtime (label e helper text)                              | `frontend/.ds-extract/FATOS.md` §10.3                                             |
| Defaults MUI — `FormLabel`                                             | `node_modules/@mui/material/FormLabel/FormLabel.js:39-87, 88-120`                 |
| Defaults MUI — `InputLabel`                                            | `node_modules/@mui/material/InputLabel/InputLabel.js:45-179, 180-197`             |
| Defaults MUI — `FormHelperText`                                        | `node_modules/@mui/material/FormHelperText/FormHelperText.js:39-80, 81-110`       |
| Defaults MUI — `FormControlLabel`                                      | `node_modules/@mui/material/FormControlLabel/FormControlLabel.js:51-112, 118-200` |

# Checkbox, Radio e Switch

`MuiCheckbox` + `MuiRadio` + `MuiSwitch`.

> **Base de conversão**: `html { font-size: 14px }` → `px_real = rem × 14` (`FATOS.md` §1).
> O rótulo desses três controles vem de `MuiFormControlLabel` → ver `form-labels.md`.

---

# Checkbox

## Anatomia

```
span                    .MuiCheckbox-root .MuiButtonBase-root .PrivateSwitchBase-root
├── input[type=checkbox] .PrivateSwitchBase-input   (invisível, cobre 100%)
├── svg                  ícone (não marcado / marcado / indeterminado)
└── span                 .MuiTouchRipple-root
```

| Parte        | Classe                          | Detalhe                                                                                                                                                              |
| ------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| root         | `.MuiCheckbox-root`             | `ButtonBase` com `border-radius: 50%` e `padding`                                                                                                                    |
| input nativo | `.PrivateSwitchBase-input`      | `cursor: inherit`, `position: absolute`, `opacity: 0`, `width: 100%`, `height: 100%` — `default MUI 7.0.1 (node_modules/@mui/material/internal/SwitchBase.js:73-80)` |
| ícone        | `<svg class="MuiSvgIcon-root">` | 3 SVGs proprietários do projeto (ver abaixo)                                                                                                                         |
| ripple       | `.MuiTouchRipple-root`          | circular                                                                                                                                                             |

## Variantes e tamanhos

- **Não há variantes** de aparência.
- Tamanhos: `small` (**default do projeto**) | `medium` | `large`.
  ⚠️ `defaultProps: { size: 'small' }` — `src/theme/core/components/checkbox.tsx:37`.
  O default do MUI é `medium` (`default MUI 7.0.1 (node_modules/@mui/material/Checkbox/Checkbox.js:122)`).
- Cores: `default` + as 6 de paleta. Default do MUI: `primary`
  (`default MUI 7.0.1 (Checkbox.js:117)`) — **não** alterado pelo projeto.

## Medidas

| Propriedade                          | Valor bruto                                              | Referência simbólica                      | Origem                                                                                                             |
| ------------------------------------ | -------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `padding`                            | **`8px`**                                                | `theme.spacing(1)`                        | `src/theme/core/components/checkbox.tsx:48` — sobrescreve os `9px` do MUI (`default MUI 7.0.1 (SwitchBase.js:37)`) |
| `border-radius`                      | `50%`                                                    | —                                         | `default MUI 7.0.1 (SwitchBase.js:38)`                                                                             |
| tamanho do ícone — `small` (default) | **`17,5px × 17,5px`** (`1.25rem`)                        | `SvgIcon.fontSizeSmall`                   | `default MUI 7.0.1` — `FATOS.md` §9 (`src/theme/core/components/svg-icon.tsx:9` só altera `fontSizeLarge`)         |
| tamanho do ícone — `medium`          | `21px × 21px` (`1.5rem`)                                 | `SvgIcon.fontSizeMedium`                  | idem                                                                                                               |
| tamanho do ícone — `large`           | `32px × 32px`                                            | `SvgIcon.fontSizeLarge` (**customizado**) | `src/theme/core/components/svg-icon.tsx:9`                                                                         |
| **caixa total** — `small`            | **`33,5px × 33,5px`** (`17,5 + 8 + 8`)                   | —                                         | soma; **CONFIRMADO em runtime** (Chrome 1911×898): `33.50 × 33.50px`                                               |
| **caixa total** — `medium`           | `37px × 37px` (`21 + 8 + 8`)                             | —                                         | soma; **CONFIRMADO em runtime**: `37.00 × 37.00px`, `padding: 8px`, ícone `21 × 21px`                              |
| dentro de um `MenuItem`              | `padding: 4px`, `margin-left: -4px`, `margin-right: 4px` | `spacing(0.5)` / `spacing(-0.5)`          | `src/theme/core/mixins/global-styles-components.ts:34-38`                                                          |
| `edge="start"`                       | `margin-left: -3px` (size small) / `-12px` (demais)      | —                                         | `default MUI 7.0.1 (SwitchBase.js:39-55)`                                                                          |
| `edge="end"`                         | `margin-right: -3px` (size small) / `-12px` (demais)     | —                                         | `default MUI 7.0.1 (SwitchBase.js:55-71)`                                                                          |

O `size` é repassado ao ícone via `fontSize: icon.props.fontSize ?? size`
(`default MUI 7.0.1 (Checkbox.js:153-158)`).

## Ícones (proprietários, definidos dentro do tema)

Todos são `<SvgIcon>` com `viewBox` 24×24 e `fill` herdado (`currentColor`).

| Ícone         | Descrição                                                                                             | Origem                                         |
| ------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| não marcado   | quadrado arredondado **vazado**, canto `r = 5`, traço interno de 1,5 unidades                         | `src/theme/core/components/checkbox.tsx:12-16` |
| marcado       | quadrado arredondado **preenchido** com um "check" vazado                                             | `src/theme/core/components/checkbox.tsx:18-22` |
| indeterminado | quadrado arredondado **preenchido** com um traço horizontal vazado (`x` de 8 a 16, `y` 11–13, raio 1) | `src/theme/core/components/checkbox.tsx:24-28` |

⚠️ Substituem `CheckBoxOutlineBlank`, `CheckBox` e `IndeterminateCheckBox` do Material
(`default MUI 7.0.1 (Checkbox.js:107-109)`). A forma é um **quadrado com cantos bem arredondados**,
não o quadrado Material clássico.

## Tabela de estados

`text.secondary = #637381 rgb(99,115,129)` · `text.primary = #1C252E rgb(28,37,46)` ·
`action.active = #637381` · `action.disabled = rgba(145 158 171 / 0.8)` · `hoverOpacity = 0.08`.

### Cor `default`

| Estado         | Fundo                                                        | Texto (cor do ícone)                              | Borda   | Sombra | Transição     |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------- | ------- | ------ | ------------- |
| default        | `transparent`                                                | `#637381` (`text.secondary`)                      | nenhuma | `none` | não declarada |
| hover          | `rgba(99 115 129 / 0.08)` (`action.active` @ `hoverOpacity`) | `#637381`                                         | nenhuma | `none` | —             |
| hover em touch | `transparent`                                                | `#637381`                                         | nenhuma | `none` | —             |
| checked        | `transparent`                                                | **`#1C252E`** (`text.primary`)                    | nenhuma | `none` | —             |
| indeterminate  | `transparent`                                                | `#1C252E`                                         | nenhuma | `none` | —             |
| focus-visible  | `transparent` (só ripple)                                    | `#637381`                                         | nenhuma | `none` | —             |
| disabled       | `transparent`                                                | **`rgba(145 158 171 / 0.8)`** (`action.disabled`) | nenhuma | `none` | —             |

Origem: `checked` → `src/theme/core/components/checkbox.tsx:49-51`;
`disabled` → `src/theme/core/components/checkbox.tsx:52`;
demais → `default MUI 7.0.1 (Checkbox.js:56-106)`.

⚠️ Sem o override, `checked` com cor `default` seria `#637381` (`text.secondary`) — o projeto
escurece para `text.primary`.

### Cores de paleta

| Estado                  | Fundo                       | Cor do ícone                 | Borda   | Sombra | Transição     |
| ----------------------- | --------------------------- | ---------------------------- | ------- | ------ | ------------- |
| default                 | `transparent`               | `#637381` (`text.secondary`) | nenhuma | `none` | não declarada |
| hover                   | `rgba(<canal main> / 0.08)` | `#637381`                    | nenhuma | `none` | —             |
| checked / indeterminate | `transparent`               | **`<cor>.main`**             | nenhuma | `none` | —             |
| checked + hover         | `rgba(<canal main> / 0.08)` | `<cor>.main`                 | nenhuma | `none` | —             |
| disabled                | `transparent`               | `rgba(145 158 171 / 0.8)`    | nenhuma | `none` | —             |

Valores de `<cor>.main`: primary `#00A76F` · secondary `#8E33FF` · info `#00B8D9` ·
success `#22C55E` · warning `#FFAB00` · error `#FF5630`.
Fundos de hover: `rgba(0 167 111 / 0.08)` · `rgba(142 51 255 / 0.08)` · `rgba(0 184 217 / 0.08)` ·
`rgba(34 197 94 / 0.08)` · `rgba(255 171 0 / 0.08)` · `rgba(255 86 48 / 0.08)`.

Origem: `default MUI 7.0.1 (Checkbox.js:70-92)`; disabled reforçado por
`src/theme/core/components/checkbox.tsx:52`.

⚠️ **Não há estado `error` próprio** — usa-se `color="error"`.
⚠️ **Não há transição declarada**: a troca de ícone e cor é instantânea.

---

# Radio

## Anatomia

Idêntica à do Checkbox (`SwitchBase`), trocando `input[type=radio]` e os SVGs.

## Variantes e tamanhos

- Tamanhos: `small` (**default do projeto**, `src/theme/core/components/radio.tsx:38`) | `medium` | `large`.
  Default do MUI é `medium` (`default MUI 7.0.1 (node_modules/@mui/material/Radio/Radio.js:132)`).
- Cores: `default` + as 6 de paleta; default do MUI = `primary` (`Radio.js:128`), não alterado.

## Medidas

Iguais às do Checkbox:

| Propriedade             | Valor bruto                   | Origem                                                                           |
| ----------------------- | ----------------------------- | -------------------------------------------------------------------------------- |
| `padding`               | **`8px`**                     | `src/theme/core/components/radio.tsx:45` (`theme.spacing(1)`)                    |
| `border-radius`         | `50%`                         | `default MUI 7.0.1 (SwitchBase.js:38)`                                           |
| ícone `small` (default) | `17,5px × 17,5px` (`1.25rem`) | `SvgIcon.fontSizeSmall` — `FATOS.md` §9                                          |
| ícone `medium`          | `21px × 21px` (`1.5rem`)      | idem                                                                             |
| ícone `large`           | `32px × 32px`                 | `src/theme/core/components/svg-icon.tsx:9`                                       |
| **caixa total** `small` | **`33,5px × 33,5px`**         | soma; **CONFIRMADO em runtime** (mesma estrutura do checkbox: `33.50 × 33.50px`) |

## Ícones (proprietários)

| Ícone       | Descrição                                                                               | Origem                                      |
| ----------- | --------------------------------------------------------------------------------------- | ------------------------------------------- |
| não marcado | anel: círculo `r = 10` com traço de 1,5 unidades, `fill="currentColor"`                 | `src/theme/core/components/radio.tsx:12-19` |
| marcado     | anel + ponto central `r = 4`, desenhado com `fill-rule="evenodd"` (o miolo é recortado) | `src/theme/core/components/radio.tsx:21-30` |

⚠️ Substituem o `RadioButtonIcon` do Material (`default MUI 7.0.1 (Radio.js:116-119)`).
O ícone marcado do projeto é um **anel cheio com furo e ponto**, sem a animação de escala do MUI.

## Tabela de estados

| Estado                  | Fundo                       | Cor do ícone                                      | Borda   | Sombra | Transição     |
| ----------------------- | --------------------------- | ------------------------------------------------- | ------- | ------ | ------------- |
| default                 | `transparent`               | `#637381` (`text.secondary`)                      | nenhuma | `none` | não declarada |
| hover (cor `default`)   | `rgba(99 115 129 / 0.08)`   | `#637381`                                         | nenhuma | `none` | —             |
| hover (cor de paleta)   | `rgba(<canal main> / 0.08)` | `#637381`                                         | nenhuma | `none` | —             |
| hover em touch          | `transparent`               | `#637381`                                         | nenhuma | `none` | —             |
| checked (cor `default`) | `transparent`               | **`#1C252E`** (`text.primary`)                    | nenhuma | `none` | —             |
| checked (cor de paleta) | `transparent`               | `<cor>.main`                                      | nenhuma | `none` | —             |
| focus-visible           | `transparent` (só ripple)   | inalterada                                        | nenhuma | `none` | —             |
| disabled                | `transparent`               | **`rgba(145 158 171 / 0.8)`** (`action.disabled`) | nenhuma | `none` | —             |

Origem: projeto em `src/theme/core/components/radio.tsx:44-50`;
defaults em `default MUI 7.0.1 (Radio.js:54-107)`.

⚠️ No MUI, as regras de hover e de `checked` das cores de paleta são condicionadas a
`disabled: false` (`Radio.js:62-92`) — no `Checkbox` não são. Diferença herdada da lib.

---

# Switch

## Anatomia

```
span                    .MuiSwitch-root
├── span                 .MuiSwitch-switchBase  (ButtonBase, position: absolute)
│   ├── input            .MuiSwitch-input
│   ├── span             .MuiSwitch-thumb       (o círculo)
│   └── span             .MuiTouchRipple-root
└── span                 .MuiSwitch-track       (a trilha)
```

| Parte   | Classe                  | Papel                                                                                                                                                                                     |
| ------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| root    | `.MuiSwitch-root`       | `display: inline-flex`, `overflow: hidden`, `position: relative`, `flex-shrink: 0`, `z-index: 0`, `vertical-align: middle`, `box-sizing: border-box`; **`align-items: center`** (projeto) |
| base    | `.MuiSwitch-switchBase` | `position: absolute`, `left: 0`, `z-index: 1`; **`top: unset`** (projeto)                                                                                                                 |
| polegar | `.MuiSwitch-thumb`      | círculo; `background-color: currentColor`, `border-radius: 50%`                                                                                                                           |
| trilha  | `.MuiSwitch-track`      | `width: 100%`, `z-index: -1`                                                                                                                                                              |
| input   | `.MuiSwitch-input`      | `left: -100%`, `width: 300%` (área de clique ampliada)                                                                                                                                    |

⚠️ O projeto muda o **sistema de posicionamento vertical**: com `align-items: center` no root e
`top: unset` no `switchBase` (`src/theme/core/components/switch.tsx:14, 16`), o polegar e a trilha
passam a ser centralizados pelo flexbox em vez de ancorados no topo. Sem isso, uma trilha de 20px
dentro de uma caixa de conteúdo de 14px ficaria desalinhada.

## Variantes e tamanhos

- **Não há variantes** de aparência.
- Tamanhos: `small` | `medium` (**default**, `default MUI 7.0.1 (node_modules/@mui/material/Switch/Switch.js:221)`).
  Não existe `large`.
- Cores: `default` + as 6 de paleta; default do MUI = `primary` (`Switch.js:219`), não alterado.
- `edge`: `false` (default) | `'start'` | `'end'`.

## Medidas

### Caixa externa (não sobrescrita — `default MUI 7.0.1`)

| size               | width                      | height                     | padding | Origem                                               |
| ------------------ | -------------------------- | -------------------------- | ------- | ---------------------------------------------------- |
| `medium` (default) | **`58px`** (`34 + 12 × 2`) | **`38px`** (`14 + 12 × 2`) | `12px`  | `node_modules/@mui/material/Switch/Switch.js:59-64`  |
| `small`            | **`40px`**                 | **`24px`**                 | `7px`   | `node_modules/@mui/material/Switch/Switch.js:88-107` |

### Trilha e polegar

| size     | track height | track width | track border-radius | thumb             | Origem                                           |
| -------- | ------------ | ----------- | ------------------- | ----------------- | ------------------------------------------------ |
| `medium` | **`20px`**   | `100%`      | **`10px`**          | **`14px × 14px`** | `src/theme/core/components/switch.tsx:45, 49-52` |
| `small`  | **`16px`**   | `100%`      | **`10px`**          | **`10px × 10px`** | `src/theme/core/components/switch.tsx:45, 53-56` |

Valores substituídos (`default MUI 7.0.1`): trilha `height: 100%` + `border-radius: 7px`
(`Switch.js:189-191`); polegar `20px × 20px` (`Switch.js:208-209`) e `16px × 16px` no size small
(`Switch.js:96-99`).

### Deslocamento do polegar

| Situação                        | `transform`           | Origem                                                                              |
| ------------------------------- | --------------------- | ----------------------------------------------------------------------------------- |
| não marcado (todos os tamanhos) | **`translateX(6px)`** | `src/theme/core/components/switch.tsx:17`                                           |
| marcado — `medium`              | `translateX(20px)`    | `default MUI 7.0.1 (Switch.js:132-134)` — vence por especificidade (`.Mui-checked`) |
| marcado — `small`               | `translateX(16px)`    | `default MUI 7.0.1 (Switch.js:100-105)`                                             |

`padding` do `switchBase`: `9px` (medium, de `SwitchBase.js:37`) e `4px` (small, de `Switch.js:101`).

| Propriedade                  | Valor bruto                                                                                                                                 | Origem                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `box-shadow` do polegar      | `0px 2px 1px -1px rgba(145 158 171 / 0.2),0px 1px 1px 0px rgba(145 158 171 / 0.14),0px 1px 3px 0px rgba(145 158 171 / 0.12)` (`shadows[1]`) | `default MUI 7.0.1 (Switch.js:206)` + `src/theme/core/shadows.ts:18` |
| `border-radius` do polegar   | `50%`                                                                                                                                       | `default MUI 7.0.1 (Switch.js:210)`                                  |
| `transition` do `switchBase` | `left 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` (`duration.shortest`)                       | `default MUI 7.0.1 (Switch.js:129-131)`                              |
| `transition` da trilha       | `opacity 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`                                   | `default MUI 7.0.1 (Switch.js:193-195)`                              |
| `edge="start"`               | `margin-left: -8px`                                                                                                                         | `default MUI 7.0.1 (Switch.js:74-80)`                                |
| `edge="end"`                 | `margin-right: -8px`                                                                                                                        | `default MUI 7.0.1 (Switch.js:81-87)`                                |

### ✔ Confirmação em runtime

Medido no Chrome (viewport 1911×898, tema claro, `/components/mui/switch`). **Todos os valores
derivados acima foram confirmados** — nenhuma divergência.

| Elemento                | `medium` medido                                  | `small` medido                                 |
| ----------------------- | ------------------------------------------------ | ---------------------------------------------- |
| raiz (caixa externa)    | `58,00 × 38,00px`, `padding: 12px`               | `40,00 × 24,00px`, `padding: 7px`              |
| trilha                  | `34,00 × 20,00px`, `border-radius: 10px`         | `26,00 × 16,00px`, `border-radius: 10px`       |
| polegar                 | `14,00 × 14,00px`, `border-radius: 50%`          | `10,00 × 10,00px`, `border-radius: 50%`        |
| `switchBase`            | `padding: 9px`, `top: 3px`, `left: 0px`          | `padding: 4px`, `top: 3px`, `left: 0px`        |
| `transform` não marcado | `matrix(1, 0, 0, 1, 6, 0)` = `translateX(6px)`   | `matrix(1, 0, 0, 1, 6, 0)` = `translateX(6px)` |
| `transform` marcado     | `matrix(1, 0, 0, 1, 20, 0)` = `translateX(20px)` | —                                              |

Cores medidas (tema claro, cor `primary`):

| Estado                     | Trilha                                                      | Polegar   |
| -------------------------- | ----------------------------------------------------------- | --------- |
| não marcado                | `rgba(145, 158, 171, 0.48)` = `#919EAB @ 48%`, `opacity: 1` | `#FFFFFF` |
| marcado                    | `rgb(0, 167, 111)` = `#00A76F`, `opacity: 1`                | `#FFFFFF` |
| não marcado + desabilitado | `rgba(145, 158, 171, 0.48)`, **`opacity: 0.48`**            | `#FFFFFF` |
| marcado + desabilitado     | `rgb(0, 167, 111)`, **`opacity: 0.48`**                     | `#FFFFFF` |

Sombra do polegar medida (idêntica em todos os estados):
`rgba(145, 158, 171, 0.2) 0px 2px 1px -1px, rgba(145, 158, 171, 0.14) 0px 1px 1px 0px, rgba(145, 158, 171, 0.12) 0px 1px 3px 0px`
— confirma `shadows[1]` com a base `#919EAB` do projeto.

⚠️ Observação medida: no estado **marcado + desabilitado**, a cor do `switchBase` computa
`rgb(158, 221, 200)` — é o `primary.main` clareado pelo `opacity` herdado, não um token da paleta.

## Tabela de estados

| Estado                  | Fundo (trilha)                                     | "Texto" (polegar)          | Borda   | Sombra (polegar) | Transição                                                         |
| ----------------------- | -------------------------------------------------- | -------------------------- | ------- | ---------------- | ----------------------------------------------------------------- |
| default (não marcado)   | **`rgba(145 158 171 / 0.48)`**, `opacity: 1`       | **`#FFFFFF`**              | nenhuma | `shadows[1]`     | `opacity` + `background-color` 150ms cubic-bezier(0.4, 0, 0.2, 1) |
| hover                   | inalterado                                         | `#FFFFFF`                  | nenhuma | `shadows[1]`     | ripple: `rgba(99 115 129 / 0.08)` no `switchBase`                 |
| checked — cor `default` | **`#1C252E`** (`text.primary`), `opacity: 1`       | `#FFFFFF`                  | nenhuma | `shadows[1]`     | `transform` 150ms cubic-bezier(0.4, 0, 0.2, 1)                    |
| checked — cor de paleta | `<cor>.main`, `opacity: 1`                         | `#FFFFFF`                  | nenhuma | `shadows[1]`     | idem                                                              |
| checked + hover         | idem                                               | `#FFFFFF`                  | nenhuma | `shadows[1]`     | ripple `rgba(<canal main> / 0.08)`                                |
| focus-visible           | inalterado                                         | `#FFFFFF`                  | nenhuma | `shadows[1]`     | só ripple                                                         |
| disabled (não marcado)  | `rgba(145 158 171 / 0.48)` com **`opacity: 0.48`** | `#FFFFFF` com `opacity: 1` | nenhuma | `shadows[1]`     | —                                                                 |
| disabled + checked      | cor de checked com **`opacity: 0.48`**             | `#FFFFFF`                  | nenhuma | `shadows[1]`     | —                                                                 |

Cores de `checked` por cor de paleta (trilha): primary `#00A76F` · secondary `#8E33FF` ·
info `#00B8D9` · success `#22C55E` · warning `#FFAB00` · error `#FF5630`
(`default MUI 7.0.1 (Switch.js:158-180)`).

Origem dos overrides:

| Regra                                                                                     | Arquivo:linha                                |
| ----------------------------------------------------------------------------------------- | -------------------------------------------- |
| trilha: `opacity: 1`, `border-radius: 10px`, `background-color: rgba(145 158 171 / 0.48)` | `src/theme/core/components/switch.tsx:43-47` |
| polegar sempre branco (`color: common.white`)                                             | `src/theme/core/components/switch.tsx:48`    |
| `checked` → trilha `opacity: 1`                                                           | `src/theme/core/components/switch.tsx:26-27` |
| `checked` + cor `default` → trilha `#1C252E`                                              | `src/theme/core/components/switch.tsx:28-30` |
| `disabled` → polegar `opacity: 1` (dark: `0.48`)                                          | `src/theme/core/components/switch.tsx:34-38` |
| `disabled` → trilha `opacity: 0.48`                                                       | `src/theme/core/components/switch.tsx:40`    |
| dark: polegar marcado com cor `default` → `#1C252E` (`grey.800`)                          | `src/theme/core/components/switch.tsx:19-25` |

Valores substituídos (`default MUI 7.0.1`):
trilha `background-color: #000000` (`common.onBackground`) com `opacity: 0.38`
(`Switch.js:196-197`); trilha marcada `opacity: 0.5` (`Switch.js:138-140`);
trilha desabilitada `opacity: 0.12` (`Switch.js:141-143`);
polegar desabilitado `color: #F9FAFB` (`grey.100`) (`Switch.js:135-137`).

⚠️ **O polegar é branco em todos os estados**, inclusive desabilitado — o projeto ignora as cores
`Switch.defaultDisabledColor` / `Switch.<cor>DisabledColor` do MUI, sinalizando "desligado" apenas
pela opacidade da trilha (`0.48`).

---

## Regras de uso observadas

1. **Checkbox e Radio nascem `small`** (17,5px de ícone, caixa de 33,5px). O `medium` do MUI só
   aparece se pedido explicitamente.
2. **Padding 8px, não 9px** — alinha o alvo de clique à grade de 8px do sistema.
3. **A cor `default` marcada é `text.primary` (`#1C252E`)**, não `text.secondary`: um checkbox/radio
   sem `color` fica quase-preto quando marcado, e não verde.
4. **Ícones proprietários com cantos muito arredondados** (checkbox) e **anel com furo** (radio) —
   não são os ícones Material. Todos com `viewBox` 24×24 e `fill: currentColor`.
5. **Nenhum dos três declara transição de cor.** Só o `Switch` anima (`transform`, `opacity`,
   `background-color`) — e sempre em **150ms `cubic-bezier(0.4, 0, 0.2, 1)`**.
6. **Switch: trilha grossa e polegar pequeno.** `medium` = trilha 20px com polegar 14px;
   `small` = trilha 16px com polegar 10px. O polegar "nada" dentro da trilha, em vez de
   preenchê-la como no Material clássico.
7. **`border-radius: 10px` na trilha nos dois tamanhos** — no `small` (16px de altura) isso já é
   mais que metade, então o efeito é de cápsula; no `medium` (20px) sobra 0px de reta.
8. **Polegar sempre branco + sombra `shadows[1]`.** A cor de estado vive na trilha.
9. **Escala de alfas recorrente**: `0.08` (hover), `0.48` (trilha e disabled), `0.8`
   (`action.disabled`, cor de ícone desabilitado).

---

## Origem

| Item                                                                 | Arquivo:linha                                                     |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Checkbox — ícone não marcado                                         | `src/theme/core/components/checkbox.tsx:12-16`                    |
| Checkbox — ícone marcado                                             | `src/theme/core/components/checkbox.tsx:18-22`                    |
| Checkbox — ícone indeterminado                                       | `src/theme/core/components/checkbox.tsx:24-28`                    |
| Checkbox — `defaultProps` (`size: 'small'` + 3 ícones)               | `src/theme/core/components/checkbox.tsx:36-41`                    |
| Checkbox — `padding: 8px`, checked `default`, disabled               | `src/theme/core/components/checkbox.tsx:47-53`                    |
| Checkbox — export                                                    | `src/theme/core/components/checkbox.tsx:59`                       |
| Radio — ícone não marcado                                            | `src/theme/core/components/radio.tsx:12-19`                       |
| Radio — ícone marcado                                                | `src/theme/core/components/radio.tsx:21-30`                       |
| Radio — `defaultProps` (`size: 'small'` + 2 ícones)                  | `src/theme/core/components/radio.tsx:38`                          |
| Radio — `padding: 8px`, checked `default`, disabled                  | `src/theme/core/components/radio.tsx:44-50`                       |
| Radio — export                                                       | `src/theme/core/components/radio.tsx:56`                          |
| Switch — root `align-items: center`                                  | `src/theme/core/components/switch.tsx:14`                         |
| Switch — `switchBase` (`top: unset`, `translateX(6px)`)              | `src/theme/core/components/switch.tsx:15-17`                      |
| Switch — `checked` (polegar dark, trilha `opacity 1`, cor `default`) | `src/theme/core/components/switch.tsx:18-32`                      |
| Switch — `disabled` (polegar `opacity 1`, trilha `opacity 0.48`)     | `src/theme/core/components/switch.tsx:33-41`                      |
| Switch — trilha (`opacity 1`, raio 10px, `rgba(145 158 171 / 0.48)`) | `src/theme/core/components/switch.tsx:43-47`                      |
| Switch — polegar branco                                              | `src/theme/core/components/switch.tsx:48`                         |
| Switch — `sizeMedium` (trilha 20px, polegar 14px)                    | `src/theme/core/components/switch.tsx:49-52`                      |
| Switch — `sizeSmall` (trilha 16px, polegar 10px)                     | `src/theme/core/components/switch.tsx:53-56`                      |
| Switch — export                                                      | `src/theme/core/components/switch.tsx:62`                         |
| `MuiSvgIcon` — só `fontSizeLarge` (32px) é customizado               | `src/theme/core/components/svg-icon.tsx:9`                        |
| Checkbox dentro de `MenuItem` (4px / -4px / 4px)                     | `src/theme/core/mixins/global-styles-components.ts:34-38`         |
| `shadows[1]`                                                         | `src/theme/core/shadows.ts:18`                                    |
| `action.*`                                                           | `src/theme/core/palette.ts:103-111`                               |
| Tamanhos de `SvgIcon` (17,5 / 21 / 32px)                             | `FATOS.md` §9                                                     |
| Defaults MUI — `Checkbox`                                            | `node_modules/@mui/material/Checkbox/Checkbox.js:46-109, 110-172` |
| Defaults MUI — `Radio`                                               | `node_modules/@mui/material/Radio/Radio.js:44-119, 120-140`       |
| Defaults MUI — `SwitchBase` (interno)                                | `node_modules/@mui/material/internal/SwitchBase.js:36-80`         |
| Defaults MUI — `Switch`                                              | `node_modules/@mui/material/Switch/Switch.js:49-211, 212-232`     |

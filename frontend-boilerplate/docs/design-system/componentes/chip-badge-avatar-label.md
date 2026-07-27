# Componentes — Marcadores: Chip, Badge, Avatar/AvatarGroup e Label

Quatro componentes pequenos que carregam status, contagem e identidade. Três são do MUI (com variantes
estendidas pelo projeto) e um — o `Label` — é 100% próprio.

> `rem` renderiza a **14px**. `theme.spacing(n)` = `calc(n * var(--spacing))`, `--spacing: 8px`.
> As medidas do `Chip` marcadas como **medidas** foram lidas com `getComputedStyle` em Chrome
> (viewport 1911×898, light) — ver `.ds-extract/FATOS.md` §10.2.

---

## Chip

### Anatomia

```
.MuiChip-root       display inline-flex · align-items center · justify-content center
  height 32px · border-radius 10px · font-size 11,375px · white-space nowrap
  ├── [.MuiChip-avatar]     24×24px · font-size 10,5px · margin-left 5px · margin-right -6px
  ├── [.MuiChip-icon]       font-size 22px · margin-left 5px · margin-right -6px · color currentColor
  ├── .MuiChip-label        padding 0 12px · font-weight 500
  └── [.MuiChip-deleteIcon] 22×22px · margin 0 5px 0 -6px · opacity 0.48 · color currentColor
```

### Variantes e tamanhos

| Variante           | Origem                                            |
| ------------------ | ------------------------------------------------- |
| `filled` (default) | MUI + overrides do projeto para `color="default"` |
| `outlined`         | MUI + override do projeto para `color="default"`  |
| **`soft`**         | **projeto** (declarada em `ChipExtendVariant`)    |

| Cor | `default`, `primary`, `secondary`, `info`, `success`, `warning`, `error` |
| --- | ------------------------------------------------------------------------ |

| Tamanho            | `height`          | `border-radius`   | avatar          | ícone | ícone de excluir |
| ------------------ | ----------------- | ----------------- | --------------- | ----- | ---------------- |
| `medium` (default) | **32px** (medido) | **10px** (medido) | 24×24px, 10,5px | 22px  | 22×22px (medido) |
| `small`            | **24px** (medido) | **8px** (medido)  | 18×18px, 8,75px | 18px  | 16px             |

### Tabela de estados

**`variant="filled"`**

| Estado                              | Fundo                                   | Texto                                  | Borda   | Sombra  | Transição                                                                     |
| ----------------------------------- | --------------------------------------- | -------------------------------------- | ------- | ------- | ----------------------------------------------------------------------------- |
| default · `color="default"` (light) | **#1C252E** rgb(28,37,46) (medido)      | **#FFFFFF** (medido)                   | nenhuma | nenhuma | `background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 300ms …` |
| hover · `color="default"` (light)   | **#454F5B** (`grey.700`)                | `#FFFFFF`                              | nenhuma | nenhuma | idem                                                                          |
| default · `color="default"` (dark)  | `#FFFFFF` (`text.primary` dark)         | **#1C252E** (`grey.800`)               | nenhuma | nenhuma | idem                                                                          |
| hover · `color="default"` (dark)    | **#F9FAFB** (`grey.100`)                | `#1C252E`                              | nenhuma | nenhuma | idem                                                                          |
| default · `color="<cor>"`           | `<cor>.main` (medido: bg = main)        | `<cor>.contrastText`                   | nenhuma | nenhuma | idem                                                                          |
| **disabled**                        | **`rgba(145 158 171 / 0.24)`** (medido) | **`rgba(145 158 171 / 0.8)`** (medido) | nenhuma | nenhuma | **`opacity: 1`** (o projeto anula o `opacity: 0.48` do MUI)                   |

**`variant="outlined"`**

| Estado                      | Fundo        | Texto                     | Borda                                                | Sombra  |
| --------------------------- | ------------ | ------------------------- | ---------------------------------------------------- | ------- |
| default · `color="default"` | transparente | `#1C252E`                 | **`1px solid rgba(145 158 171 / 0.32)`** (medido)    | nenhuma |
| default · `color="<cor>"`   | transparente | `<cor>.main`              | `1px solid rgba(<main> / 0.7)` (default MUI, medido) | nenhuma |
| **disabled**                | transparente | `rgba(145 158 171 / 0.8)` | `rgba(145 158 171 / 0.24)`                           | nenhuma |

**`variant="soft"` (do projeto)**

| Estado                    | Fundo                      | Texto (light)             | Texto (dark)        | Borda   |
| ------------------------- | -------------------------- | ------------------------- | ------------------- | ------- |
| `color="default"`         | `rgba(145 158 171 / 0.16)` | herdado (`#1C252E`)       | herdado (`#FFFFFF`) | nenhuma |
| `color="default"` + hover | `rgba(145 158 171 / 0.32)` | idem                      | idem                | nenhuma |
| `color="primary"`         | `rgba(0 167 111 / 0.16)`   | **#007867**               | **#5BE49B**         | nenhuma |
| `color="secondary"`       | `rgba(142 51 255 / 0.16)`  | **#5119B7**               | **#C684FF**         | nenhuma |
| `color="info"`            | `rgba(0 184 217 / 0.16)`   | **#006C9C**               | **#61F3F3**         | nenhuma |
| `color="success"`         | `rgba(34 197 94 / 0.16)`   | **#118D57**               | **#77ED8B**         | nenhuma |
| `color="warning"`         | `rgba(255 171 0 / 0.16)`   | **#B76E00**               | **#FFD666**         | nenhuma |
| `color="error"`           | `rgba(255 86 48 / 0.16)`   | **#B71D18**               | **#FFAC82**         | nenhuma |
| qualquer cor + hover      | mesma cor a **0.32**       | idem                      | idem                | nenhuma |
| **disabled**              | `rgba(145 158 171 / 0.24)` | `rgba(145 158 171 / 0.8)` | idem                | nenhuma |

**Avatar dentro do Chip**

| Situação                                          | Fundo                      | Texto                          |
| ------------------------------------------------- | -------------------------- | ------------------------------ |
| `color="<cor>"` (qualquer variante, não disabled) | **`<cor>.dark`**           | **`<cor>.lighter`**            |
| `filled` + `color="default"`                      | (bg do Avatar)             | **`#1C252E`** (`text.primary`) |
| disabled                                          | `rgba(145 158 171 / 0.24)` | `rgba(145 158 171 / 0.8)`      |

**Ícone de excluir**

| Estado  | Cor            | Opacidade |
| ------- | -------------- | --------- |
| default | `currentColor` | **0.48**  |
| hover   | `currentColor` | **1**     |

### Medidas

| Propriedade                  | Valor bruto                                                                                 | Referência simbólica          |
| ---------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------- |
| `height` medium / small      | **32px** / **24px**                                                                         | default MUI                   |
| `border-radius` medium       | **10px**                                                                                    | `shape.borderRadius × 1.25`   |
| `border-radius` small        | **8px**                                                                                     | `shape.borderRadius`          |
| `font-size`                  | `0.8125rem` = **11,375px**                                                                  | `pxToRem(13)` (default MUI)   |
| `label`: `padding`           | **`0 12px`**                                                                                | default MUI                   |
| `label`: `font-weight`       | **500**                                                                                     | `fontWeightMedium` (override) |
| avatar medium                | **24 × 24px**, `font-size: 0.75rem` = **10,5px**, `margin-left: 5px`, `margin-right: -6px`  | default MUI                   |
| avatar small                 | **18 × 18px**, `font-size: 0.625rem` = **8,75px**, `margin-left: 4px`, `margin-right: -4px` | default MUI                   |
| ícone medium / small         | `font-size: 22px` / `18px`; `margin-left: 5px` / `4px`; `margin-right: -6px` / `-4px`       | default MUI                   |
| ícone de excluir medium      | **22 × 22px**, `margin: 0 5px 0 -6px`                                                       | default MUI                   |
| ícone de excluir small       | `font-size: 16px`, `margin-right: 4px`, `margin-left: -4px`                                 | default MUI                   |
| `transition`                 | `background-color, box-shadow` · **300ms** · `cubic-bezier(0.4, 0, 0.2, 1)`                 | `transitions.create()`        |
| `border` / `padding` do root | `0` / `0`                                                                                   | default MUI                   |
| ícone de excluir (SVG)       | `solar:close-circle-bold`, `viewBox` 24×24, inline no tema                                  | —                             |

### Regras de uso observadas

- **O Chip é um retângulo arredondado, não uma pílula.** O MUI usaria `border-radius: 16px` (metade da
  altura); o projeto usa 10px (medium) e 8px (small), alinhando o Chip aos demais controles.
- **Disabled tem contraste real**: o projeto anula o `opacity: 0.48` global do MUI e aplica cores explícitas
  (`action.disabledBackground` / `action.disabled`), o que mantém a legibilidade do texto desabilitado.
- A `soft` do Chip usa alfas **0.16 / 0.32** — o dobro dos da `soft` da Pagination (0.08 / 0.16).
- O avatar dentro de um chip colorido inverte a hierarquia: fundo `dark` e texto `lighter`, criando um
  "selo" mais escuro dentro do chip.

### Origem

| Fato                                                                                     | Arquivo:linha                                                        |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| tipo `soft`                                                                              | `frontend/src/theme/core/components/chip.tsx:17-19`                  |
| ícone de excluir (`solar:close-circle-bold`)                                             | `frontend/src/theme/core/components/chip.tsx:26-36`                  |
| variante `soft` por cor (dark/0.16/0.32; dark→light)                                     | `frontend/src/theme/core/components/chip.tsx:55-67`                  |
| variante `soft` `color="default"` (0.16/0.32)                                            | `frontend/src/theme/core/components/chip.tsx:68-76`                  |
| `deleteIcon` default no `defaultProps`                                                   | `frontend/src/theme/core/components/chip.tsx:85`                     |
| avatar colorido (`lighter` sobre `dark`)                                                 | `frontend/src/theme/core/components/chip.tsx:93-98`                  |
| disabled (`opacity: 1` + cores explícitas por variante)                                  | `frontend/src/theme/core/components/chip.tsx:99-115`                 |
| `label: { fontWeight: fontWeightMedium }`                                                | `frontend/src/theme/core/components/chip.tsx:130`                    |
| `icon: { color: currentColor }`                                                          | `frontend/src/theme/core/components/chip.tsx:131`                    |
| `deleteIcon` (opacity 0.48 → 1 no hover)                                                 | `frontend/src/theme/core/components/chip.tsx:132-136`                |
| `sizeMedium` radius 10px / `sizeSmall` radius 8px                                        | `frontend/src/theme/core/components/chip.tsx:140-141`                |
| `filled` + `color="default"` (branco sobre text.primary; hover grey.700 / dark grey.100) | `frontend/src/theme/core/components/chip.tsx:145-162`                |
| `outlined` + `color="default"` (borda 0.32)                                              | `frontend/src/theme/core/components/chip.tsx:166-176`                |
| base (fontSize 13, height 32, radius 16, transition, avatar/icon/deleteIcon, size small) | default MUI 7.0.1 (`node_modules/@mui/material/Chip/Chip.js:88-168`) |
| medições em runtime                                                                      | `frontend/.ds-extract/FATOS.md` §10.2                                |

---

## Badge

### Anatomia

```
.MuiBadge-root   position relative · display inline-flex · vertical-align middle · flex-shrink 0
└── .MuiBadge-badge   position absolute · display flex · align-items center · justify-content center
      [padrão]   min-width 20px · height 20px · padding 0 6px · border-radius 10px · font-size 10,5px
      [dot]      8×8px · border-radius 50% (variantes do projeto sobrescrevem para 10×10)
      [variantes do projeto] 10×10px · z-index 9 · right 14% · bottom 14%
            └── ::before / ::after   (desenham o "sinal" interno em branco)
```

### Variantes e tamanhos

| Variante             | Origem      | Descrição                                            |
| -------------------- | ----------- | ---------------------------------------------------- |
| `standard` (default) | MUI         | contador numérico                                    |
| `dot`                | MUI         | ponto de 8×8px                                       |
| **`online`**         | **projeto** | ponto verde 10×10px                                  |
| **`always`**         | **projeto** | ponto âmbar 10×10px com "ponteiro de relógio" branco |
| **`busy`**           | **projeto** | ponto vermelho 10×10px com traço branco horizontal   |
| **`offline`**        | **projeto** | ponto cinza 10×10px com miolo branco circular        |
| **`invisible`**      | **projeto** | `display: none`                                      |

### Tabela de estados

| Variante                       | Fundo                                                                   | Marca interna (`::before`/`::after`)                                                                                                        | Borda   | Sombra  | Transição                                                                      |
| ------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- | ------------------------------------------------------------------------------ |
| `standard` · `color="default"` | `#F9FAFB`…(slot MUI)                                                    | —                                                                                                                                           | nenhuma | nenhuma | `transform 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` (entrada) / `195ms` (saída) |
| `standard` · `color="<cor>"`   | `<cor>.main`                                                            | —                                                                                                                                           | nenhuma | nenhuma | idem                                                                           |
| **`online`**                   | **#22C55E** rgb(34,197,94) (`success.main`)                             | `::before`/`::after` presentes mas **sem dimensões** → invisíveis                                                                           | nenhuma | nenhuma | idem                                                                           |
| **`always`**                   | **#FFAB00** rgb(255,171,0) (`warning.main`)                             | `::before` **2×4px** `translate(1px, -1px)`; `::after` **2×4px** `translate(0, 1px) rotate(125deg)` — ambos `#FFFFFF`, `border-radius: 1px` | nenhuma | nenhuma | idem                                                                           |
| **`busy`**                     | **#FF5630** rgb(255,86,48) (`error.main`)                               | `::before` **6×2px** `#FFFFFF`, `border-radius: 1px`                                                                                        | nenhuma | nenhuma | idem                                                                           |
| **`offline`**                  | **#919EAB** rgb(145,158,171) light / **#637381** dark (`text.disabled`) | `::before` **6×6px**, `border-radius: 50%`, `#FFFFFF`                                                                                       | nenhuma | nenhuma | idem                                                                           |
| **`invisible`**                | —                                                                       | —                                                                                                                                           | —       | —       | `display: none`                                                                |

### Medidas

**Variantes do projeto (`dotBaseStyles`)**

| Propriedade            | Valor bruto                                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| `width` / `height`     | **10px / 10px**                                                          |
| `min-width`            | `auto`                                                                   |
| `padding`              | `0`                                                                      |
| `z-index`              | **9**                                                                    |
| `top`                  | `auto`                                                                   |
| `right`                | **14%**                                                                  |
| `bottom`               | **14%**                                                                  |
| `transform`            | **`scale(1) translate(50%, 50%)`**                                       |
| `::before` / `::after` | `content: ""`, `border-radius: **1px**`, `background-color: **#FFFFFF**` |

**Defaults do MUI que permanecem**

| Propriedade                                            | Valor bruto                                                                                   |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `dot`: `border-radius`                                 | **50%** (override do projeto; o MUI usaria `4px`)                                             |
| `standard`: `min-width` / `height` / `border-radius`   | `20px` / `20px` / `10px`                                                                      |
| `standard`: `padding`                                  | `0 6px`                                                                                       |
| `standard`: `font-size`                                | `0.75rem` = **10,5px**                                                                        |
| `standard`: `font-weight`                              | **500** (`fontWeightMedium`)                                                                  |
| `z-index` base                                         | `1` (sobrescrito para 9 nas variantes do projeto)                                             |
| `transition`                                           | `transform` · **225ms** (entrada) / **195ms** (saída) · `cubic-bezier(0.4, 0, 0.2, 1)`        |
| posição default (`top-right`, `overlap="rectangular"`) | `top: 0`, `right: 0`, `transform: scale(1) translate(50%, -50%)`, `transform-origin: 100% 0%` |
| `dot` (MUI): `height` / `min-width`                    | `8px` / `8px`                                                                                 |

### Regras de uso observadas

- As quatro variantes de presença (`online`/`always`/`busy`/`offline`) desenham o símbolo com
  **pseudoelementos brancos**, sem ícone nem fonte — 10px de diâmetro com marcas de 2 a 6px.
- `right: 14%` + `bottom: 14%` + `translate(50%, 50%)` posicionam o ponto **no canto inferior direito de um
  avatar circular**, sobre a borda — é a posição canônica de "status de usuário".
- `online` herda `::before`/`::after` do mixin base **sem dimensões declaradas**, logo não desenha nada:
  é um ponto verde puro. É o comportamento do código.
- `invisible` é uma variante de _layout_ (`display: none`), não a prop `invisible` do MUI (que usa
  `transform: scale(0)`).

### Origem

| Fato                                                                                      | Arquivo:linha                                                           |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| tipos das variantes                                                                       | `frontend/src/theme/core/components/badge.tsx:10-16`                    |
| `dotBaseStyles` (10×10, z-index 9, right/bottom 14%, transform, ::before/::after brancos) | `frontend/src/theme/core/components/badge.tsx:20-35`                    |
| `dot: { borderRadius: '50%' }`                                                            | `frontend/src/theme/core/components/badge.tsx:42`                       |
| variante `online` (success.main)                                                          | `frontend/src/theme/core/components/badge.tsx:47-50`                    |
| variante `always` (warning.main + 2×4px)                                                  | `frontend/src/theme/core/components/badge.tsx:54-59`                    |
| variante `busy` (error.main + 6×2px)                                                      | `frontend/src/theme/core/components/badge.tsx:63-67`                    |
| variante `offline` (text.disabled + 6×6px circular)                                       | `frontend/src/theme/core/components/badge.tsx:71-75`                    |
| variante `invisible` (`display: none`)                                                    | `frontend/src/theme/core/components/badge.tsx:79-81`                    |
| base (RADIUS_STANDARD 10, RADIUS_DOT 4, padding, fontSize, transition, z-index 1)         | default MUI 7.0.1 (`node_modules/@mui/material/Badge/Badge.js:24-102`)  |
| posicionamento `top-right`                                                                | default MUI 7.0.1 (`node_modules/@mui/material/Badge/Badge.js:104-116`) |

---

## Avatar

### Anatomia

```
.MuiAvatar-root   width 40px · height 40px · font-size 17,5px · line-height 1
                  display flex · align-items center · justify-content center
                  overflow hidden · user-select none · flex-shrink 0
  ├── [.MuiAvatar-img]      width/height 100% · object-fit cover
  └── [.MuiAvatar-fallback] width 75% · height 75%
```

### Variantes e tamanhos

| Variante (`variant`) | `border-radius`                                             |
| -------------------- | ----------------------------------------------------------- |
| `circular` (default) | `50%`                                                       |
| **`rounded`**        | **12px** (`shape.borderRadius × 1.5`) — override do projeto |
| `square`             | `0`                                                         |

| Cor (`color`)                                            | Fundo                          | Texto                                                       |
| -------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------- |
| `default`                                                | **`rgba(145 158 171 / 0.24)`** | **#637381** (light) / **#919EAB** (dark) — `text.secondary` |
| `primary`/`secondary`/`info`/`success`/`warning`/`error` | `<cor>.main`                   | `<cor>.contrastText`                                        |

**Cor automática por inicial (`colorByName`)** — aplicada em `colorDefault` quando existe `alt`:

| Primeira letra de `alt` (minúscula)                                        | Cor aplicada | Fundo                      | Texto       |
| -------------------------------------------------------------------------- | ------------ | -------------------------- | ----------- |
| `a`, `c`, `f`                                                              | `primary`    | **#00A76F**                | #FFFFFF     |
| `e`, `d`, `h`                                                              | `secondary`  | **#8E33FF**                | #FFFFFF     |
| `i`, `k`, `l`                                                              | `info`       | **#00B8D9**                | #FFFFFF     |
| `m`, `n`, `p`                                                              | `success`    | **#22C55E**                | #ffffff     |
| `q`, `s`, `t`                                                              | `warning`    | **#FFAB00**                | **#1C252E** |
| `v`, `x`, `y`                                                              | `error`      | **#FF5630**                | #FFFFFF     |
| **`b`, `g`, `j`, `o`, `r`, `u`, `w`, `z`**, dígitos, símbolos, `alt` vazio | `default`    | `rgba(145 158 171 / 0.24)` | #637381     |

### Tabela de estados

`Avatar` não tem estados de interação.

| Estado                                 | Fundo                      | Texto                | Borda                                                                                   | Sombra  | Transição |
| -------------------------------------- | -------------------------- | -------------------- | --------------------------------------------------------------------------------------- | ------- | --------- |
| default (`color="default"`, sem `alt`) | `rgba(145 158 171 / 0.24)` | `#637381`            | nenhuma                                                                                 | nenhuma | nenhuma   |
| com `alt` mapeado                      | `<cor>.main`               | `<cor>.contrastText` | nenhuma                                                                                 | nenhuma | nenhuma   |
| com imagem                             | (imagem)                   | —                    | nenhuma                                                                                 | nenhuma | nenhuma   |
| dentro de `AvatarGroup`                | idem                       | idem                 | **`2px solid #FFFFFF`** (light) / **`2px solid #141A21`** (dark) — `background.default` | nenhuma | nenhuma   |

### Medidas

| Propriedade                                 | Valor bruto                                                                           | Referência simbólica        |
| ------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------- |
| `width` / `height`                          | **40px / 40px**                                                                       | default MUI                 |
| `font-size`                                 | `1.25rem` = **17,5px**                                                                | `pxToRem(20)` (default MUI) |
| `line-height`                               | `1`                                                                                   | default MUI                 |
| `border-radius` circular / rounded / square | `50%` / **12px** / `0`                                                                | override em `rounded`       |
| fallback (ícone de pessoa)                  | `75% × 75%`                                                                           | default MUI                 |
| imagem                                      | `width/height: 100%`, `object-fit: cover`, `text-align: center`, `color: transparent` | default MUI                 |

### Regras de uso observadas

- A cor automática por inicial cobre **18 letras**; as outras 8 (`b`, `g`, `j`, `o`, `r`, `u`, `w`, `z`) e
  qualquer nome que comece com número/símbolo caem no cinza `default`. É uma distribuição incompleta do
  alfabeto — fato do código, não bug de leitura.
- `rounded` = 12px é o único uso de `shape.borderRadius × 1.5` no sistema.

### Origem

| Fato                                                                             | Arquivo:linha                                                            |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `colorByName` (mapa de letras)                                                   | `frontend/src/theme/core/components/avatar.tsx:24-35`                    |
| variantes de cor (`main`/`contrastText`)                                         | `frontend/src/theme/core/components/avatar.tsx:39-46`                    |
| cor `default` (`text.secondary` sobre `rgba(145 158 171 / 0.24)`)                | `frontend/src/theme/core/components/avatar.tsx:47-55`                    |
| `rounded: borderRadius × 1.5 = 12px`                                             | `frontend/src/theme/core/components/avatar.tsx:64`                       |
| `colorDefault` (aplica `colorByName(alt)`)                                       | `frontend/src/theme/core/components/avatar.tsx:65-81`                    |
| base (40×40, `pxToRem(20)`, `line-height 1`, `border-radius 50%`, img, fallback) | default MUI 7.0.1 (`node_modules/@mui/material/Avatar/Avatar.js:51-111`) |

---

## AvatarGroup

### Anatomia

```
.MuiAvatarGroup-root   display flex · flex-direction row-reverse · justify-content flex-end
└── .MuiAvatarGroup-avatar (+ .MuiAvatar-root)
      border 2px solid background.default · box-sizing content-box
      margin-left var(--AvatarGroup-spacing, -8px) · :last-child margin-left 0
      font-size 16px · font-weight 600
      :first-of-type → font-size 12px · color primary.dark · background primary.lighter
```

### Variantes e tamanhos

| Variante                | Container                           | Avatares                                                                                                                                 |
| ----------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| default                 | tamanho natural (flex)              | 40×40px cada (herdado do `Avatar`), sobrepostos por `margin-left: -8px`                                                                  |
| **`compact`** (projeto) | **40 × 40px**, `position: relative` | **28 × 28px**, `position: absolute`, `margin: 0`; o **primeiro** em `left: 0; bottom: 0; z-index: 9`; o **último** em `top: 0; right: 0` |

| Prop      | Default do projeto                    | Default do MUI |
| --------- | ------------------------------------- | -------------- |
| `max`     | **4**                                 | 5              |
| `spacing` | `medium` → `-8px` (`small` → `-16px`) | idem           |

### Tabela de estados

| Estado                                                                               | Fundo                                            | Texto                                                                       | Borda                                                    | Sombra  | Transição |
| ------------------------------------------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------- | ------- | --------- |
| avatar comum                                                                         | conforme `Avatar`                                | conforme `Avatar`, **font-size 16px**, weight **600**                       | `2px solid #FFFFFF` (light) / `2px solid #141A21` (dark) | nenhuma | nenhuma   |
| **primeiro avatar** (`:first-of-type` — o contador "+N", por causa do `row-reverse`) | **#C8FAD6** rgb(200,250,214) (`primary.lighter`) | **#007867** rgb(0,120,103) (`primary.dark`), **font-size 12px**, weight 600 | idem                                                     | nenhuma | nenhuma   |

### Medidas

| Propriedade                  | Valor bruto                                              | Referência simbólica |
| ---------------------------- | -------------------------------------------------------- | -------------------- |
| `justify-content`            | `flex-end`                                               | override             |
| `flex-direction`             | `row-reverse`                                            | default MUI          |
| avatar: `font-size`          | **16px** (px puro)                                       | override             |
| avatar: `font-weight`        | **600**                                                  | `fontWeightSemiBold` |
| primeiro avatar: `font-size` | **12px** (px puro)                                       | override             |
| avatar: `border`             | `2px solid` `background.default`                         | default MUI          |
| avatar: `box-sizing`         | `content-box`                                            | default MUI          |
| avatar: `margin-left`        | `var(--AvatarGroup-spacing, -8px)`; `0` no `:last-child` | default MUI          |
| `compact`: container         | **40 × 40px**, `position: relative`                      | override             |
| `compact`: avatares          | **28 × 28px**, `margin: 0`, `position: absolute`         | override             |
| `compact`: primeiro          | `left: 0`, `bottom: 0`, `z-index: 9`                     | override             |
| `compact`: último            | `top: 0`, `right: 0`                                     | override             |

### Regras de uso observadas

- `flex-direction: row-reverse` (MUI) faz o **primeiro elemento do DOM ficar à direita**. Como o MUI insere
  o contador "+N" primeiro, o `:first-of-type` estilizado em verde-claro é justamente esse contador.
- A variante `compact` monta **dois avatares de 28px em diagonal dentro de uma caixa de 40px** — usada para
  representar par/dupla em espaço reduzido.
- `font-size` de 16px e 12px estão em **px puro** (não escalam com a base rem de 14px).

### Origem

| Fato                                                                                               | Arquivo:linha                                                                                      |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| tipo `compact`                                                                                     | `frontend/src/theme/core/components/avatar.tsx:14-16`                                              |
| `max: 4`                                                                                           | `frontend/src/theme/core/components/avatar.tsx:91`                                                 |
| `justifyContent: flex-end` + variante `compact` (40/28, posições, z-index 9)                       | `frontend/src/theme/core/components/avatar.tsx:97-112`                                             |
| slot `avatar` (fontSize 16, weight 600; `:first-of-type` 12 + primary.dark/lighter)                | `frontend/src/theme/core/components/avatar.tsx:113-121`                                            |
| base (`row-reverse`, borda 2px, `content-box`, `--AvatarGroup-spacing: -8px`, `max = 5`, SPACINGS) | default MUI 7.0.1 (`node_modules/@mui/material/AvatarGroup/AvatarGroup.js:23-26`, `:48-57`, `:69`) |

---

## Label (componente próprio)

Etiqueta compacta de status. É o componente próprio mais usado do sistema.

### Anatomia

```
LabelRoot <span>   display inline-flex · align-items center · justify-content center
  height 24px · min-width 24px · line-height 0 · padding 0 6px · gap 6px
  border-radius 6px · font-size 10,5px · font-weight 700 · white-space nowrap
  ├── [LabelIcon <span>]  16×16px  (startIcon)
  ├── children            (string → primeira letra maiúscula via upperFirst)
  └── [LabelIcon <span>]  16×16px  (endIcon)
```

### Variantes e tamanhos

| Variante   | Default                          | Descrição                                                 |
| ---------- | -------------------------------- | --------------------------------------------------------- |
| `filled`   | —                                | fundo sólido `main`, texto `contrastText`                 |
| `outlined` | —                                | fundo transparente, **borda de 2px**, texto `main`        |
| **`soft`** | **default** (`variant = 'soft'`) | fundo `main` @ 16%, texto `dark` (light) / `light` (dark) |
| `inverted` | —                                | fundo `lighter`, texto `darker`                           |

| Cor     | Default       | Valores                                                                  |
| ------- | ------------- | ------------------------------------------------------------------------ |
| `color` | **`default`** | `default`, `primary`, `secondary`, `info`, `success`, `warning`, `error` |

Tamanho único (24px de altura). Prop `disabled` disponível.

### Tabela de estados

**`color="default"`**

| Variante   | Fundo (light)                  | Texto (light)                  | Fundo (dark)  | Texto (dark)             | Borda                                                        |
| ---------- | ------------------------------ | ------------------------------ | ------------- | ------------------------ | ------------------------------------------------------------ |
| `filled`   | **#1C252E** (`text.primary`)   | **#FFFFFF**                    | `#FFFFFF`     | **#1C252E** (`grey.800`) | nenhuma                                                      |
| `outlined` | `transparent`                  | **#1C252E**                    | `transparent` | `#FFFFFF`                | **`2px solid #1C252E`** (light) / `2px solid #FFFFFF` (dark) |
| `soft`     | **`rgba(145 158 171 / 0.16)`** | **#637381** (`text.secondary`) | idem          | **#919EAB**              | nenhuma                                                      |
| `inverted` | **#DFE3E8** (`grey.300`)       | **#1C252E** (`grey.800`)       | idem          | idem                     | nenhuma                                                      |

**`color="<cor>"`** (exemplo com todas as cores da paleta)

| Variante   | Fundo                 | Texto (light)        | Texto (dark)  | Borda                  |
| ---------- | --------------------- | -------------------- | ------------- | ---------------------- |
| `filled`   | `<cor>.main`          | `<cor>.contrastText` | idem          | nenhuma                |
| `outlined` | `transparent`         | `<cor>.main`         | idem          | `2px solid <cor>.main` |
| `soft`     | `rgba(<main> / 0.16)` | `<cor>.dark`         | `<cor>.light` | nenhuma                |
| `inverted` | `<cor>.lighter`       | `<cor>.darker`       | idem          | nenhuma                |

Valores concretos por cor:

| Cor         | `main`  | `dark` (texto soft light) | `light` (texto soft dark) | `lighter` (fundo inverted) | `darker` (texto inverted) | `contrastText` |
| ----------- | ------- | ------------------------- | ------------------------- | -------------------------- | ------------------------- | -------------- |
| `primary`   | #00A76F | #007867                   | #5BE49B                   | #C8FAD6                    | #004B50                   | #FFFFFF        |
| `secondary` | #8E33FF | #5119B7                   | #C684FF                   | #EFD6FF                    | #27097A                   | #FFFFFF        |
| `info`      | #00B8D9 | #006C9C                   | #61F3F3                   | #CAFDF5                    | #003768                   | #FFFFFF        |
| `success`   | #22C55E | #118D57                   | #77ED8B                   | #D3FCD2                    | #065E49                   | #ffffff        |
| `warning`   | #FFAB00 | #B76E00                   | #FFD666                   | #FFF5CC                    | #7A4100                   | **#1C252E**    |
| `error`     | #FF5630 | #B71D18                   | #FFAC82                   | #FFE9D5                    | #7A0916                   | #FFFFFF        |

**Estado `disabled`** (todas as variantes e cores)

| Estado     | Fundo                | Texto                | Borda  | Sombra  | Transição                                |
| ---------- | -------------------- | -------------------- | ------ | ------- | ---------------------------------------- |
| `disabled` | mantém o da variante | mantém o da variante | mantém | nenhuma | `opacity: 0.48` + `pointer-events: none` |

**Demais estados**

| Estado         | Fundo                                      | Texto             | Borda             | Sombra  | Transição                                        |
| -------------- | ------------------------------------------ | ----------------- | ----------------- | ------- | ------------------------------------------------ |
| default        | conforme variante                          | conforme variante | conforme variante | nenhuma | **`all 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`** |
| hover          | **sem estilo próprio** (`cursor: default`) | idem              | idem              | nenhuma | idem                                             |
| focus / active | **sem estilo próprio** (não é focável)     | idem              | idem              | nenhuma | idem                                             |

### Medidas

| Propriedade           | Valor bruto                                                                      | Referência simbólica        |
| --------------------- | -------------------------------------------------------------------------------- | --------------------------- |
| `height`              | **24px**                                                                         | literal                     |
| `min-width`           | **24px**                                                                         | literal                     |
| `line-height`         | **0**                                                                            | literal                     |
| `padding`             | **`0 6px`**                                                                      | `theme.spacing(0, 0.75)`    |
| `gap` (ícone ↔ texto) | **6px**                                                                          | `theme.spacing(0.75)`       |
| `font-size`           | `0.75rem` = **10,5px**                                                           | `pxToRem(12)`               |
| `font-weight`         | **700**                                                                          | `fontWeightBold`            |
| `border-radius`       | **6px**                                                                          | `shape.borderRadius × 0.75` |
| `border` (`outlined`) | **2px solid**                                                                    | literal                     |
| `transition`          | `all` · **200ms** · `cubic-bezier(0.4, 0, 0.2, 1)`                               | `duration.shorter`          |
| `white-space`         | `nowrap`                                                                         | —                           |
| `cursor`              | `default`                                                                        | —                           |
| `flex-shrink`         | `0`                                                                              | —                           |
| ícone (`LabelIcon`)   | **16 × 16px**, `flex-shrink: 0`; `svg, img` → `100% / 100%`, `object-fit: cover` | —                           |
| `disabled`            | `opacity: 0.48`, `pointer-events: none`                                          | `action.disabledOpacity`    |

### Regras de uso observadas

- **`line-height: 0` + `height: 24px` + `align-items: center`** é o truque que garante altura exata de 24px
  independentemente da fonte — o Label nunca "cresce" com o texto.
- A borda de `outlined` tem **2px** (não 1px como o resto do sistema) — é a única borda de 2px em componentes
  de conteúdo.
- O texto é normalizado com `upperFirst` **apenas quando `children` é string**: `"ativo"` vira `"Ativo"`.
- `soft` é o default. Ou seja, um `<Label>` sem props é cinza-neutro translúcido.
- A escala de alfas do `Label` (16%) coincide com a do `Chip soft`, e não com a da `Pagination soft` (8%).

### Origem

| Fato                                                                                                      | Arquivo:linha                                      |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `variant = 'soft'`, `color = 'default'` (defaults)                                                        | `frontend/src/components/label/label.tsx:18-19`    |
| `upperFirst` em strings                                                                                   | `frontend/src/components/label/label.tsx:33`       |
| `color="default"` × `filled`                                                                              | `frontend/src/components/label/styles.tsx:19-25`   |
| `color="default"` × `outlined` (2px)                                                                      | `frontend/src/components/label/styles.tsx:29-33`   |
| `color="default"` × `soft`                                                                                | `frontend/src/components/label/styles.tsx:37-40`   |
| `color="default"` × `inverted` (grey.800 sobre grey.300)                                                  | `frontend/src/components/label/styles.tsx:44-47`   |
| cores × `filled`                                                                                          | `frontend/src/components/label/styles.tsx:57-60`   |
| cores × `outlined`                                                                                        | `frontend/src/components/label/styles.tsx:64-68`   |
| cores × `soft` (0.16; dark → light)                                                                       | `frontend/src/components/label/styles.tsx:72-78`   |
| cores × `inverted` (darker sobre lighter)                                                                 | `frontend/src/components/label/styles.tsx:82-85`   |
| medidas base (height 24, min-width 24, line-height 0, gap, padding, fontSize, weight, radius, transition) | `frontend/src/components/label/styles.tsx:89-104`  |
| `disabled` (opacity 0.48 + pointer-events none)                                                           | `frontend/src/components/label/styles.tsx:107`     |
| `LabelIcon` 16×16                                                                                         | `frontend/src/components/label/styles.tsx:111-116` |
| paleta completa                                                                                           | `frontend/src/theme/theme-config.ts:47-108`        |

# Componentes — Alert, AlertTitle e Snackbar (sonner)

Duas famílias distintas de feedback:

- **`Alert`** — MUI, embutido na página, 3 variantes × 4 severidades.
- **`Snackbar`** — **não** é o `Snackbar` do MUI: é a biblioteca **`sonner` 2.0.2**, com estilo 100% próprio
  (`unstyled: true` + classes do projeto).

> `rem` renderiza a **14px**. `theme.spacing(n)` = `calc(n * var(--spacing))`, `--spacing: 8px`.

---

## Alert

### Anatomia

```
.MuiAlert-root   ← Paper
  typography body2 · display flex · padding 6px 16px
  ├── .MuiAlert-icon      margin-right 12px · padding 7px 0 · font-size 22px · opacity 1
  ├── .MuiAlert-message   padding 8px 0 · min-width 0 · overflow auto
  │    └── [.MuiAlertTitle-root]  margin-bottom 4px · font-weight 600
  └── [.MuiAlert-action]  display flex · align-items flex-start
                          padding 4px 0 0 16px · margin-left auto · margin-right -8px
```

### Variantes e tamanhos

| Variante                 | Fonte do estilo                       | Descrição                                                  |
| ------------------------ | ------------------------------------- | ---------------------------------------------------------- |
| `standard` (default MUI) | **projeto**                           | fundo `lighter`, texto `darker`, ícone `main`              |
| `filled`                 | MUI (bg) + **projeto** (cor do texto) | fundo `main` (light) / `dark` (dark), texto `contrastText` |
| `outlined`               | **projeto**                           | fundo `main` @ 8%, borda `main` @ 16%, texto `dark`        |

| Severidade | Default                                     | Ícone (inline, `viewBox` 24×24) |
| ---------- | ------------------------------------------- | ------------------------------- |
| `info`     | —                                           | `solar:info-circle-bold`        |
| `success`  | **default do MUI** (`severity = 'success'`) | `solar:check-circle-bold`       |
| `warning`  | —                                           | `solar:danger-triangle-bold`    |
| `error`    | —                                           | `solar:danger-bold`             |

Não há tamanhos.

### Tabela de estados

`Alert` não tem hover/focus/disabled próprios. Os "estados" aqui são as combinações
**variante × severidade × esquema de cor**.

**`variant="standard"` — LIGHT**

| Severidade | Fundo                        | Texto                     | Ícone                      | Borda   | Sombra               | Transição                                                      |
| ---------- | ---------------------------- | ------------------------- | -------------------------- | ------- | -------------------- | -------------------------------------------------------------- |
| `info`     | **#CAFDF5** rgb(202,253,245) | **#003768** rgb(0,55,104) | **#00B8D9** rgb(0,184,217) | nenhuma | `none` (elevation 0) | `box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` (do Paper) |
| `success`  | **#D3FCD2** rgb(211,252,210) | **#065E49** rgb(6,94,73)  | **#22C55E** rgb(34,197,94) | nenhuma | `none`               | idem                                                           |
| `warning`  | **#FFF5CC** rgb(255,245,204) | **#7A4100** rgb(122,65,0) | **#FFAB00** rgb(255,171,0) | nenhuma | `none`               | idem                                                           |
| `error`    | **#FFE9D5** rgb(255,233,213) | **#7A0916** rgb(122,9,22) | **#FF5630** rgb(255,86,48) | nenhuma | `none`               | idem                                                           |

**`variant="standard"` — DARK**

| Severidade | Fundo       | Texto       | Ícone                        |
| ---------- | ----------- | ----------- | ---------------------------- |
| `info`     | **#003768** | **#CAFDF5** | **#61F3F3** rgb(97,243,243)  |
| `success`  | **#065E49** | **#D3FCD2** | **#77ED8B** rgb(119,237,139) |
| `warning`  | **#7A4100** | **#FFF5CC** | **#FFD666** rgb(255,214,102) |
| `error`    | **#7A0916** | **#FFE9D5** | **#FFAC82** rgb(255,172,130) |

**`variant="filled"` — LIGHT** (peso do texto: **500**)

| Severidade | Fundo       | Texto                            | Ícone                          |
| ---------- | ----------- | -------------------------------- | ------------------------------ |
| `info`     | **#00B8D9** | **#FFFFFF**                      | `currentColor` (herda o texto) |
| `success`  | **#22C55E** | **#ffffff** (minúsculo no fonte) | idem                           |
| `warning`  | **#FFAB00** | **#1C252E** rgb(28,37,46)        | idem                           |
| `error`    | **#FF5630** | **#FFFFFF**                      | idem                           |

**`variant="filled"` — DARK** (o MUI usa `<cor>.dark` como fundo)

| Severidade | Fundo                      | Texto       |
| ---------- | -------------------------- | ----------- |
| `info`     | **#006C9C** rgb(0,108,156) | **#FFFFFF** |
| `success`  | **#118D57** rgb(17,141,87) | **#ffffff** |
| `warning`  | **#B76E00** rgb(183,110,0) | **#1C252E** |
| `error`    | **#B71D18** rgb(183,29,24) | **#FFFFFF** |

**`variant="outlined"` — LIGHT**

| Severidade | Fundo                    | Texto       | Borda                              | Ícone       |
| ---------- | ------------------------ | ----------- | ---------------------------------- | ----------- |
| `info`     | `rgba(0 184 217 / 0.08)` | **#006C9C** | `1px solid rgba(0 184 217 / 0.16)` | **#00B8D9** |
| `success`  | `rgba(34 197 94 / 0.08)` | **#118D57** | `1px solid rgba(34 197 94 / 0.16)` | **#22C55E** |
| `warning`  | `rgba(255 171 0 / 0.08)` | **#B76E00** | `1px solid rgba(255 171 0 / 0.16)` | **#FFAB00** |
| `error`    | `rgba(255 86 48 / 0.08)` | **#B71D18** | `1px solid rgba(255 86 48 / 0.16)` | **#FF5630** |

**`variant="outlined"` — DARK** (fundo, borda e ícone iguais ao light; muda só o texto)

| Severidade | Texto       |
| ---------- | ----------- |
| `info`     | **#61F3F3** |
| `success`  | **#77ED8B** |
| `warning`  | **#FFD666** |
| `error`    | **#FFAC82** |

### Medidas

| Propriedade                          | Valor bruto                                                                          | Referência simbólica                |
| ------------------------------------ | ------------------------------------------------------------------------------------ | ----------------------------------- |
| tipografia                           | `0.875rem` = **12,25px**, weight 400, line-height `1.5714285714285714` → **19,25px** | `typography.body2`                  |
| `padding` do root                    | **`6px 16px`**                                                                       | default MUI                         |
| `border-radius`                      | **8px**                                                                              | `shape.borderRadius` (via `Paper`)  |
| `box-shadow`                         | `none`                                                                               | `Paper elevation: 0`                |
| ícone: `font-size`                   | **22px**                                                                             | default MUI                         |
| ícone: `margin-right`                | **12px**                                                                             | default MUI                         |
| ícone: `padding`                     | **`7px 0`**                                                                          | default MUI                         |
| ícone: `opacity`                     | **1** (MUI usaria `0.9`)                                                             | override do projeto                 |
| mensagem: `padding`                  | **`8px 0`**                                                                          | default MUI                         |
| ação: `padding`                      | **`4px 0 0 16px`**                                                                   | default MUI                         |
| ação: `margin-left` / `margin-right` | `auto` / **−8px**                                                                    | default MUI                         |
| `filled`: `font-weight`              | **500**                                                                              | `fontWeightMedium` (default MUI)    |
| `outlined`: `border`                 | `solid 1px rgba(<main> / 0.16)`                                                      | `varAlpha(<cor>.mainChannel, 0.16)` |

**`AlertTitle`**

| Propriedade     | Valor bruto                                                                     | Referência simbólica |
| --------------- | ------------------------------------------------------------------------------- | -------------------- |
| `margin-bottom` | **4px**                                                                         | `theme.spacing(0.5)` |
| `font-weight`   | **600**                                                                         | `fontWeightSemiBold` |
| `margin-top`    | **−2px**                                                                        | default MUI          |
| tipografia base | `Typography` com `gutterBottom: true` (o MUI aplicaria `margin-bottom: 0.35em`) | default MUI          |

> ⚠️ **NÃO CONFIRMADO**: qual `margin-bottom` prevalece no `AlertTitle` (os 4px do override ou o `0.35em`
> do `gutterBottom` do Typography) — as duas regras têm especificidade (0,1,0) e o resultado depende da ordem
> de injeção do Emotion; não foi medido em runtime.

### Regras de uso observadas

- **A `standard` do projeto não tem nada a ver com a do MUI.** O MUI produziria fundos quase brancos
  (`rgb(239,253,253)` para info, por exemplo) e textos escuros dessaturados. O projeto usa a escala
  `lighter`/`darker` da própria paleta — cores muito mais saturadas.
- **`filled` + `warning` usa texto `#1C252E` sobre `#FFAB00` (light) e sobre `#B76E00` (dark).** No dark, essa
  combinação (texto quase preto sobre marrom) tem contraste baixo. É o que está no código.
- No `outlined`, o ícone mantém `<cor>.main` nos **dois** esquemas (o override não declara variação dark para
  o ícone dessa variante), enquanto na `standard` o ícone muda para `<cor>.light` no dark.
- `icon: { opacity: 1 }` remove a atenuação de 10% que o MUI aplica aos ícones de alerta — no projeto o
  ícone tem sempre a cor cheia.
- Os 4 ícones são **SVGs inline dentro do tema** (não Iconify), portanto não dependem do carregamento de
  coleções de ícones.

### Origem

| Fato                                                                                 | Arquivo:linha                                                                                  |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| ícone `info` (`solar:info-circle-bold`)                                              | `frontend/src/theme/core/components/alert.tsx:15-25`                                           |
| ícone `success` (`solar:check-circle-bold`)                                          | `frontend/src/theme/core/components/alert.tsx:27-37`                                           |
| ícone `warning` (`solar:danger-triangle-bold`)                                       | `frontend/src/theme/core/components/alert.tsx:39-49`                                           |
| ícone `error` (`solar:danger-bold`)                                                  | `frontend/src/theme/core/components/alert.tsx:51-61`                                           |
| `iconMapping`                                                                        | `frontend/src/theme/core/components/alert.tsx:86-93`                                           |
| `icon: { opacity: 1 }`                                                               | `frontend/src/theme/core/components/alert.tsx:99`                                              |
| variante `standard` (darker/lighter/main; dark: lighter/darker/light)                | `frontend/src/theme/core/components/alert.tsx:103-122`                                         |
| variante `filled` (`color: contrastText`)                                            | `frontend/src/theme/core/components/alert.tsx:126-134`                                         |
| variante `outlined` (bg 0.08, color dark, border 0.16, icon main; dark: color light) | `frontend/src/theme/core/components/alert.tsx:138-152`                                         |
| `AlertTitle` (mb 4px, weight 600)                                                    | `frontend/src/theme/core/components/alert.tsx:163-166`                                         |
| base do Alert (`body2`, `padding 6px 16px`, filled `fontWeightMedium`)               | default MUI 7.0.1 (`node_modules/@mui/material/Alert/Alert.js:60-63`, `:98`)                   |
| base ícone/mensagem/ação                                                             | default MUI 7.0.1 (`node_modules/@mui/material/Alert/Alert.js:110-139`)                        |
| `severity = 'success'`, `variant = 'standard'` (defaults)                            | default MUI 7.0.1 (`node_modules/@mui/material/Alert/Alert.js:172-175`)                        |
| base do AlertTitle (`fontWeightMedium`, `marginTop: -2`, `gutterBottom`)             | default MUI 7.0.1 (`node_modules/@mui/material/AlertTitle/AlertTitle.js:37-38`, `:53`)         |
| paleta (`lighter`/`light`/`main`/`dark`/`darker`/`contrastText`)                     | `frontend/src/theme/theme-config.ts:47-108`                                                    |
| slots `Alert.*FilledBg` (main no light, dark no dark)                                | tema computado (`frontend/.ds-extract/theme.json` → `computed.paletteLight/paletteDark.Alert`) |

---

## Snackbar (biblioteca `sonner` 2.0.2)

O componente `Snackbar` do projeto **não usa o `Snackbar`/`SnackbarContent` do MUI**. É um `<Toaster>` do
`sonner`, renderizado dentro de um `<Portal>` do MUI, com `unstyled: true` e todas as classes substituídas
pelas do projeto (prefixo `minimal__`).

### Anatomia

```
<Portal>
└── SnackbarRoot (styled(Toaster))            width 300px
      className="minimal__snackbar__root"
      position="top-right" · offset 16 · gap 12 · visibleToasts 4 · expand · closeButton
      └── .minimal__snackbar__toast           gap 12px · min-height 52px · border-radius 12px
          │                                   display flex · align-items center
          ├── .minimal__snackbar__icon        48×48px · border-radius inherit
          │     └── .minimal__snackbar__icon__svg   24×24px
          ├── .minimal__snackbar__content     flex 1 1 auto
          │     ├── .minimal__snackbar__title        12,25px · weight 500
          │     └── .minimal__snackbar__description  10,5px · opacity 0.64
          ├── [.sonner-loader]                overlay de carregamento (display none → flex)
          │     └── .minimal__snackbar__loading_icon  24×24 · conic-gradient girando
          └── .minimal__snackbar__close_button  20×20px · borda 1px · translate(-6px, 6px)
                └── svg  14×14px
```

### Variantes e tamanhos

| Variante                 | Classe                                           | Padding                | Fundo                                                         | Texto                                                             |
| ------------------------ | ------------------------------------------------ | ---------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| `default`                | `minimal__snackbar__default`                     | **`8px 8px 8px 12px`** | **`#1C252E`** (light) / **`#FFFFFF`** (dark) — `text.primary` | **`#FFFFFF`** (light) / **`#1C252E`** (dark) — `background.paper` |
| `info`                   | `minimal__snackbar__info`                        | **`4px 8px 4px 4px`**  | `#FFFFFF` / `#1C252E` — `background.paper`                    | `#1C252E` / `#FFFFFF` — `text.primary`                            |
| `success`                | `minimal__snackbar__success`                     | idem                   | idem                                                          | idem                                                              |
| `warning`                | `minimal__snackbar__warning`                     | idem                   | idem                                                          | idem                                                              |
| `error`                  | `minimal__snackbar__error`                       | idem                   | idem                                                          | idem                                                              |
| `default` **com loader** | `minimal__snackbar__default:has(.sonner-loader)` | **`4px 8px 4px 4px`**  | `background.paper`                                            | `text.primary`                                                    |

> Ou seja: o toast **neutro é invertido** (fundo escuro no light), e os toasts **com severidade são claros**,
> com a cor aparecendo apenas no bloco do ícone.

### Tabela de estados

| Estado                 | Fundo                                                                        | Texto                                                         | Borda                                    | Sombra                                  | Transição                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `default` (light)      | **#1C252E**                                                                  | **#FFFFFF**                                                   | nenhuma                                  | `0 8px 16px 0 rgba(145 158 171 / 0.16)` | animações do `sonner`                                                                                          |
| `default` (dark)       | **#FFFFFF**                                                                  | **#1C252E**                                                   | nenhuma                                  | `0 8px 16px 0 rgba(0 0 0 / 0.16)`       | idem                                                                                                           |
| `info` (light)         | **#FFFFFF**                                                                  | **#1C252E**; ícone **#00B8D9** sobre `rgba(0 184 217 / 0.08)` | nenhuma                                  | `0 8px 16px 0 rgba(145 158 171 / 0.16)` | idem                                                                                                           |
| `success`              | `#FFFFFF` / `#1C252E`                                                        | ícone **#22C55E** sobre `rgba(34 197 94 / 0.08)`              | nenhuma                                  | idem                                    | idem                                                                                                           |
| `warning`              | idem                                                                         | ícone **#FFAB00** sobre `rgba(255 171 0 / 0.08)`              | nenhuma                                  | idem                                    | idem                                                                                                           |
| `error`                | idem                                                                         | ícone **#FF5630** sobre `rgba(255 86 48 / 0.08)`              | nenhuma                                  | idem                                    | idem                                                                                                           |
| loading                | `background.neutral` (**#F4F6F8** light / **#28323D** dark) cobrindo o toast | —                                                             | nenhuma                                  | idem                                    | `rotate 3s infinite linear` no ícone                                                                           |
| botão fechar — default | `transparent`                                                                | `currentColor`                                                | **`1px solid rgba(145 158 171 / 0.16)`** | nenhuma                                 | `background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` |
| botão fechar — hover   | **`rgba(145 158 171 / 0.08)`**                                               | `currentColor`                                                | **`1px solid rgba(145 158 171 / 0.24)`** | nenhuma                                 | idem                                                                                                           |

### Medidas

**Container (`<Toaster>`)**

| Propriedade                 | Valor bruto |
| --------------------------- | ----------- |
| `width`                     | **300px**   |
| `position` (prop do sonner) | `top-right` |
| `offset` (prop)             | **16**      |
| `gap` entre toasts (prop)   | **12**      |
| `visibleToasts` (prop)      | **4**       |
| `expand` (prop)             | ativo       |
| `closeButton` (prop)        | ativo       |

**Toast**

| Propriedade                                       | Valor bruto                                                                                                 |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `gap` interno                                     | **12px**                                                                                                    |
| `min-height`                                      | **52px**                                                                                                    |
| `border-radius`                                   | **12px**                                                                                                    |
| `width`                                           | `100%`                                                                                                      |
| `display` / `align-items`                         | `flex` / `center`                                                                                           |
| `box-shadow`                                      | `0 8px 16px 0 rgba(145 158 171 / 0.16)` light · `0 8px 16px 0 rgba(0 0 0 / 0.16)` dark (`customShadows.z8`) |
| `padding` (default)                               | **`8px 8px 8px 12px`** (`theme.spacing(1, 1, 1, 1.5)`)                                                      |
| `padding` (com cor / com loader)                  | **`4px 8px 4px 4px`** (`theme.spacing(0.5, 1, 0.5, 0.5)`)                                                   |
| `content`: `padding-right` quando há botão fechar | **32px**                                                                                                    |

**Textos**

| Elemento      | Valor bruto                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `title`       | `font-size: 0.875rem` = **12,25px**, `font-weight: 500`                                         |
| `description` | `font-size: 0.75rem` = **10,5px**, weight 400, line-height `1.5` → **15,75px**, `opacity: 0.64` |

**Ícone**

| Propriedade   | Valor bruto                                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bloco `.icon` | **48 × 48px**, `flex-shrink: 0`, `display: flex`, `align-items: center`, `align-self: flex-start`, `justify-content: center`, `border-radius: inherit` (= 12px) |
| `.icon__svg`  | **24 × 24px**                                                                                                                                                   |
| ícones usados | `solar:info-circle-bold`, `solar:check-circle-bold`, `solar:danger-triangle-bold`, `solar:danger-bold` (via `Iconify`)                                          |

**Botão fechar**

| Propriedade                  | Valor bruto                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------- |
| tamanho                      | **20 × 20px**                                                                 |
| `padding`                    | 0                                                                             |
| `border-radius`              | `50%`                                                                         |
| `position` / `top` / `right` | `absolute` / `0` / `0`                                                        |
| `transform`                  | **`translate(-6px, 6px)`**                                                    |
| `border`                     | `solid 1px rgba(145 158 171 / 0.16)` → hover `rgba(145 158 171 / 0.24)`       |
| `background-color`           | `transparent` → hover `rgba(145 158 171 / 0.08)`                              |
| `color`                      | `currentColor`                                                                |
| `transition`                 | `background-color, border-color` · **300ms** · `cubic-bezier(0.4, 0, 0.2, 1)` |
| `svg` interno                | **14 × 14px**                                                                 |

**Loader**

| Propriedade      | Valor bruto                                                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| overlay          | `position: relative`, `top: 0`, `left: 0`, `width: 100%`, `height: 100%`, `display: none` (→ `flex` quando `[data-visible="true"]`), `overflow: hidden`, `border-radius: inherit`, `transform: none` |
| fundo do overlay | `#F4F6F8` (light) / `#28323D` (dark) — `background.neutral`                                                                                                                                          |
| `.loading_icon`  | **24 × 24px**, `border-radius: 50%`, `z-index: 9`                                                                                                                                                    |
| animação         | **`rotate 3s infinite linear`** — keyframe `@keyframes rotate { to { transform: rotate(1turn) } }`                                                                                                   |
| gradiente        | `conic-gradient(transparent, rgba(145 158 171 / 0.64))` (light) · `conic-gradient(transparent, rgba(99 115 129 / 0.64))` (dark)                                                                      |

**Classes (todas com prefixo `minimal__`)**

`minimal__snackbar__root`, `__toast`, `__title`, `__icon`, `__icon__svg`, `__content`, `__description`,
`__action__button`, `__cancel__button`, `__close_button`, `__loading_icon`, `__default`, `__error`,
`__success`, `__warning`, `__info`. Além delas, o sonner contribui com `sonner-loader`,
`[data-visible="true"]` e `[data-close-button="true"]`.

### Regras de uso observadas

- `actionButton` e `cancelButton` têm **regras vazias** (`{}`) no arquivo de estilos: ficam com o estilo cru
  do `sonner` (que está `unstyled`), ou seja, **sem estilo**. É uma lacuna real do design system.
- O bloco `[&:has(.sonner-loader)]` aparece **duplicado** no código (mesma regra declarada duas vezes
  seguidas) — sem efeito prático.
- O raio de 12px do toast não pertence à escala do sistema (6 / 8 / 10 / 16px): é um valor isolado.
- O toast **default é inverso** (escuro no light) e os coloridos são claros — a hierarquia de atenção é dada
  pelo bloco de ícone colorido, não pelo fundo.
- Todas as cores de severidade usam **`<cor>.main` no ícone e `rgba(<main> / 0.08)` no bloco**, sem variação
  entre light e dark.

### Origem

| Fato                                                                                                  | Arquivo:linha                                                                                   |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `<Portal>` + props do `<Toaster>` (expand, gap 12, closeButton, offset 16, visibleToasts 4, position) | `frontend/src/components/snackbar/snackbar.tsx:11-19`                                           |
| `toastOptions.unstyled` + mapa de `classNames`                                                        | `frontend/src/components/snackbar/snackbar.tsx:20-40`                                           |
| ícones (`loading`, info, success, warning, error)                                                     | `frontend/src/components/snackbar/snackbar.tsx:41-49`                                           |
| `width: 300`                                                                                          | `frontend/src/components/snackbar/styles.tsx:59`                                                |
| `.toast` (gap 12, min-height 52, radius 12)                                                           | `frontend/src/components/snackbar/styles.tsx:60-67`                                             |
| `.content` (flex 1 1 auto)                                                                            | `frontend/src/components/snackbar/styles.tsx:71-73`                                             |
| `.title` (body2 font-size, weight medium)                                                             | `frontend/src/components/snackbar/styles.tsx:74-77`                                             |
| `.description` (caption, opacity 0.64)                                                                | `frontend/src/components/snackbar/styles.tsx:78-81`                                             |
| `actionButton` / `cancelButton` vazios                                                                | `frontend/src/components/snackbar/styles.tsx:85-86`                                             |
| `.close_button` (20×20, borda, transform, transition, hover, svg 14)                                  | `frontend/src/components/snackbar/styles.tsx:87-109`                                            |
| `.icon` (48×48) + `.icon__svg` (24×24)                                                                | `frontend/src/components/snackbar/styles.tsx:114-127`                                           |
| `@keyframes rotate`                                                                                   | `frontend/src/components/snackbar/styles.tsx:129`                                               |
| variante `default` (padding, z8, cores invertidas)                                                    | `frontend/src/components/snackbar/styles.tsx:14-19` e `:134-145`                                |
| variantes coloridas (`toastColor`: padding, z8, paper/text.primary)                                   | `frontend/src/components/snackbar/styles.tsx:20-25`                                             |
| `error` / `success` / `warning` / `info` (ícone main + bg 0.08)                                       | `frontend/src/components/snackbar/styles.tsx:149-185`                                           |
| loader (overlay, `loading_icon`, conic-gradient)                                                      | `frontend/src/components/snackbar/styles.tsx:26-31` e `:34-56`                                  |
| classes com prefixo `minimal__`                                                                       | `frontend/src/components/snackbar/classes.ts:5-27` + `frontend/src/theme/create-classes.ts:5-7` |
| prefixo `minimal`                                                                                     | `frontend/src/theme/theme-config.ts:36`                                                         |
| `customShadows.z8`                                                                                    | `frontend/src/theme/core/custom-shadows.ts:43`                                                  |
| versão `sonner` **2.0.2**                                                                             | `frontend/package-lock.json` (lockfileVersion 3)                                                |

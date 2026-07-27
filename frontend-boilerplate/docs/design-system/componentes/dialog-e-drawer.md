# Componentes — Sobreposições: Dialog, Drawer e Backdrop

Os três compartilham a mesma pilha (`Modal` → `Backdrop` + `Paper`), mas têm tratamentos visuais
**diferentes e propositais**: o `Dialog` é um cartão flutuante opaco; o `Drawer` temporário é um painel
translúcido com blur e dois gradientes de fundo; o `Backdrop` é o véu escuro comum aos dois.

> `rem` renderiza a **14px**. `theme.spacing(n)` sai como `calc(n * var(--spacing))`, `--spacing: 8px`.

---

## Dialog

### Anatomia

```
.MuiModal-root (z-index 1300)
├── .MuiBackdrop-root                       rgba(28 37 46 / 0.48)
└── .MuiDialog-container  (scroll: paper)
    └── .MuiDialog-paper   ← Paper
        │  margin 16px · border-radius 16px · box-shadow customShadows.dialog
        │  max-height calc(100% - 64px) · max-width 600px (maxWidth="sm")
        ├── .MuiDialogTitle-root      padding 24px
        ├── .MuiDialogContent-root    padding 0 24px  (+ dividers → border-bottom dashed)
        └── .MuiDialogActions-root    padding 24px · gap horizontal 12px
```

### Variantes e tamanhos

| Prop               | Valor default efetivo | max-width bruto                                                                   |
| ------------------ | --------------------- | --------------------------------------------------------------------------------- |
| `maxWidth="xs"`    | —                     | **444px** (`max(breakpoints.xs=0, 444)`)                                          |
| `maxWidth="sm"`    | **default do MUI**    | **600px**                                                                         |
| `maxWidth="md"`    | —                     | **900px**                                                                         |
| `maxWidth="lg"`    | —                     | **1200px**                                                                        |
| `maxWidth="xl"`    | —                     | **1536px**                                                                        |
| `maxWidth={false}` | —                     | `calc(100% - 64px)`                                                               |
| `fullWidth`        | `false`               | `width: calc(100% - 64px)`                                                        |
| `fullScreen`       | `false`               | `margin 0`, `width 100%`, `height 100%`, `max-height none`, **`border-radius 0`** |

### Tabela de estados

| Estado                   | Fundo                        | Texto                     | Borda   | Sombra                                                                  | Transição                                                                                                              |
| ------------------------ | ---------------------------- | ------------------------- | ------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| default / aberto (light) | `#FFFFFF` (rgb(255,255,255)) | `#1C252E` (rgb(28,37,46)) | nenhuma | `-40px 40px 80px -8px rgba(0 0 0 / 0.24)`                               | entrada `Fade`/`Grow` do MUI: `225ms` (enteringScreen) / saída `195ms` (leavingScreen), `cubic-bezier(0.4, 0, 0.2, 1)` |
| default / aberto (dark)  | `#1C252E`                    | `#FFFFFF`                 | nenhuma | **mesma sombra** (`customShadows.dialog` usa `0 0 0` nos dois esquemas) | idem                                                                                                                   |
| `fullScreen`             | idem                         | idem                      | nenhuma | idem                                                                    | idem                                                                                                                   |
| Backdrop (véu)           | `rgba(28 37 46 / 0.48)`      | —                         | —       | —                                                                       | `225ms` / `195ms`                                                                                                      |

Não há estados hover/focus/disabled no container do Dialog.

### Medidas

**`.MuiDialog-paper`**

| Propriedade                     | Valor bruto                               | Referência simbólica                                                |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| `border-radius`                 | **16px**                                  | `shape.borderRadius × 2`                                            |
| `border-radius` (`fullScreen`)  | **0**                                     | —                                                                   |
| `margin`                        | **16px** (só quando `fullScreen` é falso) | `theme.spacing(2)`                                                  |
| `box-shadow`                    | `-40px 40px 80px -8px rgba(0 0 0 / 0.24)` | `customShadows.dialog`                                              |
| `max-height` (`scroll="paper"`) | `calc(100% - 64px)`                       | default MUI (baseado no margin 32 do MUI, **não** no 16 do projeto) |
| `overflow-y`                    | `auto`                                    | default MUI                                                         |
| `background-color`              | `#FFFFFF` light / `#1C252E` dark          | `Paper`                                                             |

**`.MuiDialogTitle-root`**

| Propriedade | Valor bruto                                                                                                           | Referência simbólica                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `padding`   | **24px** (todos os lados)                                                                                             | `theme.spacing(3)`                                     |
| tipografia  | `h6` → `1.0625rem` = **14,875px** (≥600px `1.125rem` = **15,75px**), weight **600**, line-height `1.5555555555555556` | `Typography variant="h6"` (default do MUI para o slot) |
| `flex`      | `0 0 auto`                                                                                                            | default MUI                                            |

**`.MuiDialogContent-root`**

| Propriedade                       | Valor bruto                                   | Referência simbólica                                             |
| --------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| `padding`                         | **`0 24px`** (top 0, laterais 24px, bottom 0) | `theme.spacing(0, 3)`                                            |
| `padding-bottom` (com `dividers`) | **24px**                                      | `theme.spacing(3)`                                               |
| `border-top` (com `dividers`)     | **0**                                         | override do projeto (o MUI usaria `1px solid`)                   |
| `border-bottom` (com `dividers`)  | **`1px dashed rgba(145 158 171 / 0.2)`**      | width/cor do MUI (`palette.divider`), estilo `dashed` do projeto |
| `overflow-y`                      | `auto`                                        | default MUI                                                      |
| `flex`                            | `1 1 auto`                                    | default MUI                                                      |

**`.MuiDialogActions-root`**

| Propriedade                                   | Valor bruto                                           | Referência simbólica |
| --------------------------------------------- | ----------------------------------------------------- | -------------------- |
| `padding`                                     | **24px**                                              | `theme.spacing(3)`   |
| espaçamento entre botões                      | **`margin-left: 12px`** em `& > :not(:first-of-type)` | `theme.spacing(1.5)` |
| `display` / `justify-content` / `align-items` | `flex` / `flex-end` / `center`                        | default MUI          |
| `disableSpacing`                              | **`true`** (default do projeto)                       | —                    |

### Regras de uso observadas

- **Dashed é a linguagem de divisão do sistema.** O `DialogContent dividers` remove a linha de cima e deixa
  só a de baixo, tracejada. O mesmo padrão aparece em `TableCell`, `DataGrid` (filler/footer/cell) e no
  divisor do nav horizontal.
- **`disableSpacing: true` + margem manual de 12px**: o projeto desliga o espaçamento nativo do MUI (8px em
  `& > :not(style) ~ :not(style)`) e reimplementa com `:not(:first-of-type)` a 12px. O seletor é diferente:
  o do MUI ignora elementos `<style>` (relevante com Emotion/SSR), o do projeto não.
- **A sombra do Dialog usa preto puro nos dois esquemas** (`rgba(0 0 0 / 0.24)`), diferente de todas as outras
  `customShadows`, que trocam a base para `0 0 0` só no dark.
- **`margin: 16px` vs. `calc(100% - 64px)`**: o projeto reduz a margem de 32px→16px, mas as fórmulas de
  `max-width`/`max-height` do MUI continuam calculadas para 32px. Resultado: em telas pequenas sobra 16px de
  folga além da margem nominal. É comportamento herdado, não intencional.
- `closeAfterTransition: false` é declarado como _workaround_ documentado no código
  (issue mui/material-ui#43106) — não tem efeito visual, só de ciclo de vida/animação.

### Origem

| Fato                                                                                          | Arquivo:linha                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `boxShadow: customShadows.dialog`                                                             | `frontend/src/theme/core/components/dialog.tsx:21`                                                     |
| `borderRadius: 8 × 2 = 16px`                                                                  | `frontend/src/theme/core/components/dialog.tsx:22`                                                     |
| `margin: theme.spacing(2)` quando não fullScreen                                              | `frontend/src/theme/core/components/dialog.tsx:23`                                                     |
| `paperFullScreen: { borderRadius: 0 }`                                                        | `frontend/src/theme/core/components/dialog.tsx:25`                                                     |
| `closeAfterTransition: false`                                                                 | `frontend/src/theme/core/components/dialog.tsx:14`                                                     |
| DialogTitle `padding: spacing(3)`                                                             | `frontend/src/theme/core/components/dialog.tsx:33`                                                     |
| DialogContent `padding: spacing(0, 3)`                                                        | `frontend/src/theme/core/components/dialog.tsx:41`                                                     |
| DialogContent `dividers` (borderTop 0 / dashed / pb 24)                                       | `frontend/src/theme/core/components/dialog.tsx:42-46`                                                  |
| DialogActions `disableSpacing: true`                                                          | `frontend/src/theme/core/components/dialog.tsx:54`                                                     |
| DialogActions `padding` + `marginLeft: spacing(1.5)`                                          | `frontend/src/theme/core/components/dialog.tsx:60-63`                                                  |
| `customShadows.dialog`                                                                        | `frontend/src/theme/core/custom-shadows.ts:49`                                                         |
| `margin: 32`, `maxHeight/maxWidth calc(100% - 64px)`, `maxWidth` por breakpoint, `fullScreen` | default MUI 7.0.1 (`node_modules/@mui/material/Dialog/Dialog.js:115-194`); `maxWidth = 'sm'` em `:221` |
| DialogTitle base `padding: 16px 24px`                                                         | default MUI 7.0.1 (`node_modules/@mui/material/DialogTitle/DialogTitle.js:34`)                         |
| DialogContent base `padding: 20px 24px`, `dividers` `1px solid divider`                       | default MUI 7.0.1 (`node_modules/@mui/material/DialogContent/DialogContent.js:46-54`)                  |
| DialogActions base `padding: 8`, spacing `marginLeft: 8`                                      | default MUI 7.0.1 (`node_modules/@mui/material/DialogActions/DialogActions.js:40-50`)                  |
| durações/easings                                                                              | default MUI, sem override (`.ds-extract/FATOS.md` §5.3)                                                |

---

## Drawer

### Anatomia

```
.MuiDrawer-root (Modal, z-index 1200)
├── .MuiBackdrop-root
└── .MuiDrawer-paper .MuiDrawer-paperAnchorRight|Left   ← Paper
      height 100% · display flex · flex-direction column · overflow-y auto
      [variant="temporary"]  → paperStyles: 2 gradientes SVG + blur(20px) + fundo 90%
                             → box-shadow direcional
```

### Variantes e tamanhos

| Variante     | Origem         | Estilo aplicado                                                        |
| ------------ | -------------- | ---------------------------------------------------------------------- |
| `temporary`  | default do MUI | **recebe** `paperStyles` + sombra direcional                           |
| `persistent` | —              | **não** recebe (o override é condicionado a `variant === 'temporary'`) |
| `permanent`  | —              | **não** recebe                                                         |

| Âncora                      | box-shadow (light)                                       | box-shadow (dark)                                                                                                                        |
| --------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `anchor="right"`            | `-40px 40px 80px -8px rgba(145 158 171 / 0.24)`          | `-40px 40px 80px -8px rgba(0 0 0 / 0.24)`                                                                                                |
| `anchor="left"`             | `40px 40px 80px -8px rgba(145 158 171 / 0.24)`           | `40px 40px 80px -8px  rgba(0 0 0 / 0.24)` ⚠️ dois espaços no template literal do código (`drawer.tsx:26`); CSS tolera, sem efeito visual |
| `anchor="top"` / `"bottom"` | **sem override** — nem `paperStyles`, nem sombra própria | idem                                                                                                                                     |

**Larguras efetivamente usadas no app** (o DS não define largura padrão; cada uso declara a sua):

| Drawer                   | Âncora           | Largura bruta                                | Backdrop          | Arquivo:linha                                                                                                                 |
| ------------------------ | ---------------- | -------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Navegação mobile         | `left` (default) | **288px** (`var(--layout-nav-mobile-width)`) | padrão (visível)  | `frontend/src/layouts/dashboard/nav-mobile.tsx:48-63` (largura em `:58`); var em `frontend/src/layouts/core/css-vars.ts:5-14` |
| Conta do usuário         | `right`          | **320px**                                    | `invisible: true` | `frontend/src/layouts/components/account-drawer.tsx:138-146` (largura em `:144`)                                              |
| Notificações             | `right`          | `width: 100%` com **`max-width: 420px`**     | `invisible: true` | `frontend/src/layouts/components/notifications-drawer/index.tsx:144-152` (largura em `:150`)                                  |
| Configurações (Settings) | `right`          | **360px**                                    | `invisible: true` | `frontend/src/components/settings/drawer/settings-drawer.tsx:235-252` (largura em `:247`)                                     |

> O Settings Drawer **não** usa o `paperStyles` do override de `MuiDrawer` (ele é `anchor="right"` e
> `temporary`, então recebe o override) e **ainda** aplica `paperStyles` de novo no `sx`, desta vez com
> `color: rgba(255 255 255 / 0.9)` explícito (`background.defaultChannel` @ 0.9) — que no light coincide com
> o valor herdado e no dark muda de `rgba(28 37 46 / 0.9)` para `rgba(20 26 33 / 0.9)`.

### Tabela de estados

| Estado                                       | Fundo                                                                        | Texto     | Borda   | Sombra                                          | Transição                                                             |
| -------------------------------------------- | ---------------------------------------------------------------------------- | --------- | ------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| aberto, `temporary` `anchor="right"` (light) | `rgba(255 255 255 / 0.9)` + 2 gradientes SVG + `backdrop-filter: blur(20px)` | `#1C252E` | nenhuma | `-40px 40px 80px -8px rgba(145 158 171 / 0.24)` | slide `225ms` entrada / `195ms` saída, `cubic-bezier(0.4, 0, 0.2, 1)` |
| aberto, `temporary` `anchor="right"` (dark)  | `rgba(28 37 46 / 0.9)` + gradientes + blur                                   | `#FFFFFF` | nenhuma | `-40px 40px 80px -8px rgba(0 0 0 / 0.24)`       | idem                                                                  |
| aberto, `temporary` `anchor="left"`          | idem, gradientes idem                                                        | idem      | nenhuma | `40px 40px 80px -8px …`                         | idem                                                                  |
| `permanent` / `persistent`                   | `#FFFFFF` / `#1C252E` (Paper puro)                                           | idem      | nenhuma | **`none`** (elevation 0 do Paper)               | idem                                                                  |
| fechado                                      | —                                                                            | —         | —       | —                                               | `transform: translateX(±100%)`                                        |

### Medidas — mixin `paperStyles` (o "vidro fosco" do sistema)

Aplicado ao Drawer temporário, ao Popover/Menu (com `dropdown: true`), ao paper do DataGrid e ao dropdown do
nav mini/horizontal.

| Propriedade                                   | Valor bruto                                                                                                                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `background-image`                            | `url("data:image/svg+xml;base64,…")`, `url("data:image/svg+xml;base64,…")` — dois SVGs de 120×120                                                                             |
| SVG 1 (**cyan**)                              | `<rect 120×120>` preenchido por `radialGradient` de `#00B8D9` → transparente, `fill-opacity="0.1"`, gradiente transladado para `(120, 0)` com `rotate(-45)` e `scale(123.25)` |
| SVG 2 (**red**)                               | `<rect 120×120>` preenchido por `radialGradient` de `#FF5630` → transparente, `fill-opacity="0.1"`, gradiente transladado para `(0, 120)` com `rotate(135)` e `scale(123.25)` |
| `background-size`                             | `50%, 50%`                                                                                                                                                                    |
| `background-repeat`                           | `no-repeat, no-repeat`                                                                                                                                                        |
| `background-position` (LTR)                   | `top right, left bottom`                                                                                                                                                      |
| `background-position` (RTL)                   | `top left, right bottom`                                                                                                                                                      |
| `backdrop-filter` / `-webkit-backdrop-filter` | **`blur(20px)`**                                                                                                                                                              |
| `background-color` (light)                    | `rgba(255 255 255 / 0.9)`                                                                                                                                                     |
| `background-color` (dark)                     | `rgba(28 37 46 / 0.9)`                                                                                                                                                        |
| **extras quando `dropdown: true`**            | `padding: 4px` · `box-shadow: customShadows.dropdown` · `border-radius: 10px`                                                                                                 |

Ou seja: o cyan entra pelo **canto superior direito** e o vermelho pelo **canto inferior esquerdo**, cada um
ocupando um quarto da área (50% × 50%), a 10% de opacidade.

### Medidas — paper base

| Propriedade                  | Valor bruto                                                          | Referência simbólica |
| ---------------------------- | -------------------------------------------------------------------- | -------------------- |
| `height`                     | `100%`                                                               | default MUI          |
| `display` / `flex-direction` | `flex` / `column`                                                    | default MUI          |
| `overflow-y`                 | `auto`                                                               | default MUI          |
| `z-index`                    | **1200**                                                             | `zIndex.drawer`      |
| `elevation` (`temporary`)    | `16` passado pelo Drawer, mas o `box-shadow` efetivo é o do override | default MUI          |

### Regras de uso observadas

- Os três drawers de sistema (conta, notificações, settings) usam `backdrop: { invisible: true }`: o véu
  existe para capturar o clique de fechar, mas é `background: transparent`. Só o drawer de navegação mobile
  mostra o véu escuro.
- A sombra do drawer é sempre **direcional e para dentro da tela**: `-40px` no eixo X quando ancorado à
  direita, `+40px` quando à esquerda, ambos com `40px` de deslocamento vertical.
- `paperStyles` não é exclusivo do Drawer — é o mesmo mixin do dropdown. A diferença é o parâmetro
  `dropdown`, que adiciona padding, sombra e raio.

### Origem

| Fato                                                                                 | Arquivo:linha                                                                           |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| override `paperAnchorRight` (temporary)                                              | `frontend/src/theme/core/components/drawer.tsx:12-20`                                   |
| sombra right light / dark                                                            | `frontend/src/theme/core/components/drawer.tsx:15` / `:17`                              |
| override `paperAnchorLeft` (temporary)                                               | `frontend/src/theme/core/components/drawer.tsx:21-29`                                   |
| sombra left light / dark                                                             | `frontend/src/theme/core/components/drawer.tsx:24` / `:26`                              |
| mixin `paperStyles`                                                                  | `frontend/src/theme/core/mixins/global-styles-components.ts:79-97`                      |
| SVG cyan (base64)                                                                    | `frontend/src/theme/core/mixins/global-styles-components.ts:73-74`                      |
| SVG red (base64)                                                                     | `frontend/src/theme/core/mixins/global-styles-components.ts:76-77`                      |
| `bgGradient` (size/repeat/position)                                                  | `frontend/src/theme/core/mixins/background.ts:32-39`                                    |
| `customShadows.dropdown`                                                             | `frontend/src/theme/core/custom-shadows.ts:51`                                          |
| paper base (height/flex/overflow/z-index), `elevation = 16`, `variant = 'temporary'` | default MUI 7.0.1 (`node_modules/@mui/material/Drawer/Drawer.js:80-85`, `:197`, `:210`) |

---

## Backdrop

### Anatomia

```
.MuiBackdrop-root
  position: fixed · inset 0 · display flex · align-items center · justify-content center
  background-color: rgba(28 37 46 / 0.48)
  -webkit-tap-highlight-color: transparent
```

### Variantes e tamanhos

| Variante    | Fundo                                                    |
| ----------- | -------------------------------------------------------- |
| default     | `rgba(28 37 46 / 0.48)`                                  |
| `invisible` | `transparent` (declarado como `background: transparent`) |

### Tabela de estados

| Estado                 | Fundo                   | Texto | Borda   | Sombra  | Transição                                                               |
| ---------------------- | ----------------------- | ----- | ------- | ------- | ----------------------------------------------------------------------- |
| visível (light e dark) | `rgba(28 37 46 / 0.48)` | —     | nenhuma | nenhuma | `Fade`: `225ms` entrada / `195ms` saída, `cubic-bezier(0.4, 0, 0.2, 1)` |
| `invisible`            | `transparent`           | —     | nenhuma | nenhuma | idem                                                                    |

### Medidas

| Propriedade                   | Valor bruto                                                            | Referência simbólica              |
| ----------------------------- | ---------------------------------------------------------------------- | --------------------------------- |
| `background-color`            | `rgba(28 37 46 / 0.48)` — canal `grey.800` = `#1C252E` = rgb(28,37,46) | `varAlpha(grey.800Channel, 0.48)` |
| `position`                    | `fixed`, `inset: 0`                                                    | default MUI                       |
| `-webkit-tap-highlight-color` | `transparent`                                                          | default MUI                       |
| `z-index`                     | herda do Modal pai (`1300` para Dialog, `1200` para Drawer)            | `zIndex.modal` / `zIndex.drawer`  |

### Regras de uso observadas

- O véu é **idêntico em light e dark** — sempre o cinza-800 a 48%. O MUI usaria `rgba(0, 0, 0, 0.5)`; o
  projeto troca por um preto-azulado ligeiramente mais claro.
- A variante `invisible` usa a propriedade `background` (shorthand), não `background-color`.

### Origem

| Fato                                                       | Arquivo:linha                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| `backgroundColor: varAlpha(grey.800Channel, 0.48)`         | `frontend/src/theme/core/components/backdrop.tsx:12-14`                     |
| `invisible: { background: 'transparent' }`                 | `frontend/src/theme/core/components/backdrop.tsx:15`                        |
| `grey.800 = #1C252E` (canal `28 37 46`)                    | `frontend/src/theme/theme-config.ts:96-107`                                 |
| base `position: fixed`, `rgba(0, 0, 0, 0.5)` (sobrescrito) | default MUI 7.0.1 (`node_modules/@mui/material/Backdrop/Backdrop.js:40-49`) |
| z-index `modal 1300` / `drawer 1200`                       | default MUI, sem override (`.ds-extract/FATOS.md` §5.4)                     |

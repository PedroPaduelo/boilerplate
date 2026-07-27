# 07 — Motion

Catálogo de **durações, curvas de aceleração, propriedades animadas e animações contínuas**
efetivamente aplicadas hoje no frontend do AuditorIA.

Regras desta página:

- Valor sempre **bruto** (`250ms`, `cubic-bezier(0.4, 0, 0.2, 1)`, `0.64s`). A referência simbólica
  da biblioteca aparece só na coluna _Referência MUI_, como origem — nunca como valor.
- Toda linha cita `arquivo:linha`.
- Valores confirmados por `getComputedStyle` aparecem como **medido em runtime (Chrome 1911×898)**
  — viewport e método descritos em `frontend/.ds-extract/FATOS.md` §0 e §10.
- Nada foi arredondado nem sugerido. Onde não deu para confirmar, está marcado `⚠️ NÃO CONFIRMADO`.

---

## 1. Fundamentos

O projeto **não sobrescreve** `theme.transitions`. A escala inteira de durações e easings é o
default do MUI 7.0.1, resolvido pela computação do tema real (`frontend/.ds-extract/theme.json`
→ `computed.transitions`).

O único sistema de motion **próprio** do design system é o par de variáveis CSS de layout
(`--layout-transition-duration` / `--layout-transition-easing`), usado no colapso da sidebar.

| Fato                                                     | Valor                                                                             | Origem                                                                             |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Override de `transitions` no projeto                     | **não existe** (`grep -rn "transitions:" src/theme/` → 0 ocorrências de override) | `frontend/src/theme/create-theme.ts:21-38`                                         |
| Duração default de `transitions.create()`                | `300ms`                                                                           | default MUI 7.0.1                                                                  |
| Easing default de `transitions.create()`                 | `cubic-bezier(0.4, 0, 0.2, 1)`                                                    | default MUI 7.0.1                                                                  |
| Delay default de `transitions.create()`                  | `0ms`                                                                             | default MUI 7.0.1                                                                  |
| String completa gerada por `transitions.create(['all'])` | `all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`                                      | tema computado (`.ds-extract/theme.json` → `computed.transitions.samples.default`) |

---

## 2. Durations

Escala completa. Todos os valores são **milissegundos inteiros**.

| Token                   | Valor bruto | Referência MUI                              | Onde é usado                                                                                                                                                                                                                 | Origem (arquivo:linha)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------- | ----------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| duration-shortest       | `150ms`     | `theme.transitions.duration.shortest`       | borda do `notchedOutline` do TextField outlined; swatches do color-picker; popover da searchbar; hover de linha do file-manager; cartões de método de pagamento/entrega; transição do calendário                             | `frontend/src/theme/core/components/textfield.tsx:72`; `frontend/src/components/color-utils/color-picker.tsx:146`; `frontend/src/components/color-utils/color-picker.tsx:168`; `frontend/src/layouts/components/searchbar/index.tsx:94`; `frontend/src/layouts/components/searchbar/index.tsx:173`; `frontend/src/layouts/main/nav/desktop/nav-desktop-item-dashboard.tsx:36`; `frontend/src/sections/file-manager/file-manager-table-row.tsx:182`; `frontend/src/sections/checkout/checkout-delivery.tsx:79`; `frontend/src/sections/checkout/checkout-payment-methods.tsx:129`; `frontend/src/sections/payment/payment-methods.tsx:108`; `frontend/src/sections/calendar/view/calendar-view.tsx:199`            |
| duration-shorter        | `200ms`     | `theme.transitions.duration.shorter`        | **componente `Label`** (`all`); fundo e sombra do header ao rolar; dropdown do mega-menu; item de nav básico desktop; back-link; upload-avatar; halo do `AnimateLogoRotate`; itens de nav do header público; painéis do chat | `frontend/src/components/label/styles.tsx:104`; `frontend/src/layouts/core/header-section.tsx:97`; `frontend/src/components/mega-menu/components/nav-dropdown.tsx:32`; `frontend/src/components/nav-basic/desktop/nav-item.tsx:130`; `frontend/src/components/custom-breadcrumbs/back-link.tsx:32`; `frontend/src/components/upload/upload-avatar.tsx:71`; `frontend/src/components/animate/animate-logo.tsx:137`; `frontend/src/components/carousel/carousel.tsx:58`; `frontend/src/layouts/components/workspaces-popover.tsx:60`; `frontend/src/layouts/main/nav/desktop/nav-desktop-item.tsx:82`; `frontend/src/layouts/main/nav/desktop/nav-desktop-item.tsx:100`; `frontend/src/sections/chat/styles.tsx:47` |
| duration-short          | `250ms`     | `theme.transitions.duration.short`          | **transição base de todo `Button`/`ButtonBase`** (vem do MUI, não do projeto); thumbs e setas do carrossel; item de nav básico mobile; accordion de FAQ                                                                      | `frontend/node_modules/@mui/material/Button/Button.js:103-104`; `frontend/node_modules/@mui/material/Button/Button.js:282-283`; `frontend/src/components/carousel/components/carousel-thumb.tsx:45`; `frontend/src/components/carousel/components/arrow-button.tsx:70`; `frontend/src/components/carousel/components/carousel-dot-buttons.tsx:103`; `frontend/src/components/nav-basic/mobile/nav-item.tsx:139`; `frontend/src/sections/home/home-faqs.tsx:166`                                                                                                                                                                                                                                                   |
| duration-standard       | `300ms`     | `theme.transitions.duration.standard`       | **default de `transitions.create()`** → sombra do AppBar/Paper, botão de fechar do snackbar, botão back-to-top, hover de ícones do file-thumbnail, drawer de settings, upload; subheader do nav vertical; item do mega-menu  | default MUI 7.0.1 (`frontend/node_modules/@mui/material/Paper/Paper.js:49`); `frontend/src/components/nav-section/components/nav-subheader.tsx:40`; `frontend/src/components/nav-section/components/nav-subheader.tsx:47`; `frontend/src/components/mega-menu/components/nav-item.tsx:102`; `frontend/src/components/snackbar/styles.tsx:103`; `frontend/src/components/animate/back-to-top-button.tsx:46`; `frontend/src/components/file-thumbnail/action-buttons.tsx:28`; `frontend/src/components/settings/drawer/styles.tsx:105`; `frontend/src/components/upload/upload.tsx:92`                                                                                                                              |
| duration-complex        | `375ms`     | `theme.transitions.duration.complex`        | **nenhum uso no produto.** Só nas demos do template (`/components/**`): carrossel scale e carrossel opacity                                                                                                                  | `frontend/src/sections/_examples/extra/carousel-view/carousel-scale.tsx:63`; `frontend/src/sections/_examples/extra/carousel-view/carousel-opacity.tsx:76`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| duration-enteringScreen | `225ms`     | `theme.transitions.duration.enteringScreen` | **nenhuma chamada direta no projeto.** É o `timeout.enter` default de Dialog, Drawer, Fade, Slide, Zoom, Snackbar e Badge do MUI                                                                                             | default MUI 7.0.1: `frontend/node_modules/@mui/material/Dialog/Dialog.js:207`; `frontend/node_modules/@mui/material/Drawer/Drawer.js:189`; `frontend/node_modules/@mui/material/Fade/Fade.js:35`; `frontend/node_modules/@mui/material/Slide/Slide.js:92`; `frontend/node_modules/@mui/material/Zoom/Zoom.js:36`; `frontend/node_modules/@mui/material/Snackbar/Snackbar.js:115`; `frontend/node_modules/@mui/material/Badge/Badge.js:84`                                                                                                                                                                                                                                                                         |
| duration-leavingScreen  | `195ms`     | `theme.transitions.duration.leavingScreen`  | **nenhuma chamada direta no projeto.** É o `timeout.exit` default dos mesmos componentes acima                                                                                                                               | default MUI 7.0.1: `frontend/node_modules/@mui/material/Dialog/Dialog.js:208`; `frontend/node_modules/@mui/material/Drawer/Drawer.js:190`; `frontend/node_modules/@mui/material/Fade/Fade.js:36`; `frontend/node_modules/@mui/material/Slide/Slide.js:93`; `frontend/node_modules/@mui/material/Zoom/Zoom.js:37`; `frontend/node_modules/@mui/material/Snackbar/Snackbar.js:116`; `frontend/node_modules/@mui/material/Badge/Badge.js:215`                                                                                                                                                                                                                                                                        |

### 2.1 Durações fora da escala

Valores que **não** vêm de `theme.transitions.duration` e existem no código:

| Valor bruto         | Onde                                                         | Origem (arquivo:linha)                                              |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| `120ms`             | transição de layout própria (sidebar) — ver §4               | `frontend/src/layouts/dashboard/css-vars.ts:13`                     |
| `100ms`             | `exit` do popover da searchbar (literal, não token)          | `frontend/src/layouts/components/searchbar/index.tsx:173`           |
| `70ms` (`150 - 80`) | `exit` da transição do calendário (`duration.shortest - 80`) | `frontend/src/sections/calendar/view/calendar-view.tsx:200`         |
| `2500ms`            | pulsação do ripple do MUI (`ripplePulsate` → `childPulsate`) | `frontend/node_modules/@mui/material/ButtonBase/TouchRipple.js:119` |
| `550ms`             | entrada e saída do ripple do MUI                             | `frontend/node_modules/@mui/material/ButtonBase/TouchRipple.js:20`  |
| `500ms`             | `fadeIn` do card de kanban (fora do tema)                    | `frontend/src/sections/kanban/item/item-base.tsx:176`               |

### 2.2 Duração automática (Grow)

`Grow` — usado por Popover, Menu, Select, Autocomplete e Tooltip — tem `timeout = 'auto'`
(`frontend/node_modules/@mui/material/Grow/Grow.js:59`), ou seja, **a duração é calculada a partir da
altura do elemento**, não é um token:

```
constant = altura_em_px / 36
duração_ms = min( round( (4 + 15 * constant^0.25 + constant/5) * 10 ), 3000 )
```

Origem: `frontend/node_modules/@mui/material/styles/createTransitions.js:40-48` (default MUI 7.0.1).
Teto de `3000ms`. Exemplos calculados pela fórmula: altura `200px` → `328ms`; altura `400px` → `376ms`.

`Collapse` (usado por Accordion) tem `timeout` default `300ms`
(`frontend/node_modules/@mui/material/Collapse/Collapse.js:149` → `duration.standard`);
com `timeout="auto"` cai na mesma fórmula acima.

---

## 3. Easings

| Token            | Valor bruto                    | Referência MUI                       | Onde é usado                                                                                                                                                         | Origem (arquivo:linha)                                                                                                                                                                                               |
| ---------------- | ------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| easing-easeInOut | `cubic-bezier(0.4, 0, 0.2, 1)` | `theme.transitions.easing.easeInOut` | **easing default de todas as transições** (é o default de `transitions.create()`); explicitado no fundo/sombra do header e no halo do logo animado; timing do ripple | default MUI 7.0.1 (tema computado); `frontend/src/layouts/core/header-section.tsx:96`; `frontend/src/components/animate/animate-logo.tsx:136`; `frontend/node_modules/@mui/material/ButtonBase/TouchRipple.js:84-86` |
| easing-easeOut   | `cubic-bezier(0.0, 0, 0.2, 1)` | `theme.transitions.easing.easeOut`   | label flutuante do TextField (`color`, `transform`, `max-width`) — vem do MUI. Computa no browser como `cubic-bezier(0, 0, 0.2, 1)`                                  | default MUI 7.0.1; `frontend/node_modules/@mui/material/InputLabel/InputLabel.js:99-101`                                                                                                                             |
| easing-easeIn    | `cubic-bezier(0.4, 0, 1, 1)`   | `theme.transitions.easing.easeIn`    | ⚠️ **nenhum uso encontrado** em `frontend/src/**` (`grep -rn "easing.easeIn\b"` → 0)                                                                                 | default MUI 7.0.1 (tema computado)                                                                                                                                                                                   |
| easing-sharp     | `cubic-bezier(0.4, 0, 0.6, 1)` | `theme.transitions.easing.sharp`     | ⚠️ **nenhum uso encontrado** em `frontend/src/**`. Usado internamente pelo MUI no `Slide`                                                                            | default MUI 7.0.1 (tema computado)                                                                                                                                                                                   |

### 3.1 Easings fora da escala do tema

| Valor bruto                               | Onde                                                                                                                                                                                        | Origem (arquivo:linha)                                                                                                                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `linear`                                  | transição de layout da sidebar (§4); animação `wave` do Skeleton; rotação do CircularProgress; spinner do snackbar; `varBgColor`/`varBgPan` do framer-motion; outlines do `AnimateLogoZoom` | `frontend/src/layouts/dashboard/css-vars.ts:12`; `frontend/src/components/snackbar/styles.tsx:52`; `frontend/src/components/animate/variants/background.ts:12`; `frontend/src/components/animate/animate-logo.tsx:55`                    |
| `cubic-bezier(0.43, 0.13, 0.23, 0.96)`    | **curva-padrão do framer-motion no projeto** — entrada, saída, hover e `varPath`                                                                                                            | `frontend/src/components/animate/variants/transition.ts:7`; `frontend/src/components/animate/variants/transition.ts:13`; `frontend/src/components/animate/variants/actions.ts:22`; `frontend/src/components/animate/variants/path.ts:12` |
| `cubic-bezier(0.65, 0.815, 0.735, 0.395)` | `indeterminate1` do LinearProgress                                                                                                                                                          | `frontend/node_modules/@mui/material/LinearProgress/LinearProgress.js:45`                                                                                                                                                                |
| `cubic-bezier(0.165, 0.84, 0.44, 1)`      | `indeterminate2` do LinearProgress                                                                                                                                                          | `frontend/node_modules/@mui/material/LinearProgress/LinearProgress.js:64`                                                                                                                                                                |
| `ease-in-out` (keyword CSS)               | animação `pulse` do Skeleton (**não é o default do projeto**, que usa `wave`); dash do CircularProgress; `AnimateLogoZoom`                                                                  | `frontend/node_modules/@mui/material/Skeleton/Skeleton.js:66`; `frontend/node_modules/@mui/material/CircularProgress/CircularProgress.js:56`; `frontend/src/components/animate/animate-logo.tsx:31`                                      |
| `ease` (keyword CSS)                      | barra de progresso de rota (nprogress, default da lib)                                                                                                                                      | `frontend/node_modules/nprogress/nprogress.js:21`                                                                                                                                                                                        |
| `easeOut` (framer-motion)                 | `varBgKenburns`                                                                                                                                                                             | `frontend/src/components/animate/variants/background.ts:24`                                                                                                                                                                              |

---

## 4. Transição de layout própria (colapso da sidebar)

Este é o **único par de tokens de motion criado pelo projeto**. Vive como variável CSS aplicada
no `body` pelo `<GlobalStyles>` do layout de dashboard.

| Token                          | Valor bruto | Referência MUI        | Onde é usado                                       | Origem (arquivo:linha)                          |
| ------------------------------ | ----------- | --------------------- | -------------------------------------------------- | ----------------------------------------------- |
| `--layout-transition-duration` | `120ms`     | — (não existe no MUI) | duração da animação de colapso/expansão da sidebar | `frontend/src/layouts/dashboard/css-vars.ts:13` |
| `--layout-transition-easing`   | `linear`    | — (não existe no MUI) | curva da mesma animação                            | `frontend/src/layouts/dashboard/css-vars.ts:12` |

### 4.1 Propriedades animadas por essas variáveis

| Elemento                                                       | Propriedade animada | Valor CSS final                 | Origem (arquivo:linha)                                    |
| -------------------------------------------------------------- | ------------------- | ------------------------------- | --------------------------------------------------------- |
| Raiz do `NavVertical` (`.minimal__layout__nav__vertical`)      | `width`             | `width 120ms linear 0ms`        | `frontend/src/layouts/dashboard/nav-vertical.tsx:128-131` |
| Container do conteúdo (`.minimal__layout__sidebar__container`) | `padding-left`      | `padding-left 120ms linear 0ms` | `frontend/src/layouts/dashboard/layout.tsx:283-286`       |

### 4.2 Valores entre os quais se anima

| Estado                                      | `--layout-nav-vertical-width` / `--layout-nav-mini-width` | `padding-left` do container | Origem                                          |
| ------------------------------------------- | --------------------------------------------------------- | --------------------------- | ----------------------------------------------- |
| Sidebar expandida (`navLayout: 'vertical'`) | `300px`                                                   | `300px`                     | `frontend/src/layouts/dashboard/css-vars.ts:15` |
| Sidebar colapsada (`navLayout: 'mini'`)     | `88px`                                                    | `88px`                      | `frontend/src/layouts/dashboard/css-vars.ts:14` |

⚠️ A troca de `padding-left` só existe a partir do breakpoint `lg` (`@media (min-width:1200px)`) —
`layoutQuery = 'lg'` em `frontend/src/layouts/dashboard/layout.tsx:60`, aplicado em `:281`.
Abaixo disso a sidebar vira drawer temporário e a animação de largura não se aplica
(`frontend/src/layouts/dashboard/nav-vertical.tsx:121` → `display: none`; `:132` → `display: flex` a partir de `lg`).

**Reprodução agnóstica:**

```css
:root {
  --layout-transition-duration: 120ms;
  --layout-transition-easing: linear;
  --layout-nav-vertical-width: 300px;
  --layout-nav-mini-width: 88px;
}

.sidebar {
  width: var(--layout-nav-vertical-width);
  transition: width var(--layout-transition-duration) var(--layout-transition-easing) 0ms;
}
.sidebar[data-mini='true'] {
  width: var(--layout-nav-mini-width);
}

@media (min-width: 1200px) {
  .content-container {
    padding-left: var(--layout-nav-vertical-width);
    transition: padding-left var(--layout-transition-duration)
      var(--layout-transition-easing) 0ms;
  }
}
```

---

## 5. Transições medidas em runtime (por componente)

Todas as linhas abaixo foram lidas com `getComputedStyle` — **medido em runtime (Chrome 1911×898)**,
modo light, rotas `/components/mui/*` e `/auth/jwt/sign-in` (registro: `frontend/.ds-extract/FATOS.md`
§10). A coluna de origem aponta a regra que produz o valor.

| Componente / seletor                                  | Valor CSS medido (bruto)                                                                                                                                          | Propriedades                                     | Duração | Easing                                                 | Origem (arquivo:linha)                                                                                                                                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.MuiButton-root` (todos os variants e tamanhos)      | `background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` | `background-color`, `box-shadow`, `border-color` | `250ms` | `cubic-bezier(0.4, 0, 0.2, 1)`                         | default MUI 7.0.1 — `frontend/node_modules/@mui/material/Button/Button.js:282-283` (variante `loadingPosition: 'center'`, que é o **default** em `:504`, sobrescreve o `root` de `:103-104`) |
| `.MuiButton-root.Mui-disabled`                        | acrescenta `color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`                                                                                                         | `+ color`                                        | `250ms` | `cubic-bezier(0.4, 0, 0.2, 1)`                         | ⚠️ **NÃO CONFIRMADO na fonte** — ver §11                                                                                                                                                     |
| `.MuiOutlinedInput-notchedOutline`                    | `border-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`                                                                                                             | `border-color`                                   | `150ms` | `cubic-bezier(0.4, 0, 0.2, 1)` (default de `create()`) | `frontend/src/theme/core/components/textfield.tsx:71-73`                                                                                                                                     |
| `.MuiInputLabel-root` (repouso → shrink)              | `color 200ms cubic-bezier(0, 0, 0.2, 1) 0ms, transform 200ms cubic-bezier(0, 0, 0.2, 1) 0ms, max-width 200ms cubic-bezier(0, 0, 0.2, 1) 0ms`                      | `color`, `transform`, `max-width`                | `200ms` | `cubic-bezier(0.0, 0, 0.2, 1)`                         | default MUI 7.0.1 — `frontend/node_modules/@mui/material/InputLabel/InputLabel.js:99-101`                                                                                                    |
| `.MuiAppBar-root` (header do dashboard e do auth)     | `box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` (medido: `0.3s`)                                                                                              | `box-shadow`                                     | `300ms` | `cubic-bezier(0.4, 0, 0.2, 1)`                         | default MUI 7.0.1 — `frontend/node_modules/@mui/material/Paper/Paper.js:49` (AppBar estende Paper). O projeto zera a sombra: `frontend/src/theme/core/components/appbar.tsx:14`              |
| `Label` (componente próprio, `.minimal__label__root`) | `all 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`                                                                                                                      | `all`                                            | `200ms` | `cubic-bezier(0.4, 0, 0.2, 1)` (default de `create()`) | `frontend/src/components/label/styles.tsx:104`                                                                                                                                               |

### 5.1 Valores animados do label flutuante (TextField)

Complemento útil para reproduzir a transição do `InputLabel` — todos **medidos em runtime
(Chrome 1911×898)**, `frontend/.ds-extract/FATOS.md` §10.3.

| Estado                        | `font-size` | `font-weight` | `color`                          | `transform`                         |
| ----------------------------- | ----------- | ------------- | -------------------------------- | ----------------------------------- |
| Repouso                       | `12.25px`   | `400`         | `#919EAB` / `rgb(145, 158, 171)` | `translate(14px, 16px) scale(1)`    |
| Shrink (focado ou preenchido) | `14px`      | `600`         | `#637381` / `rgb(99, 115, 129)`  | `translate(14px, -9px) scale(0.75)` |

---

## 6. Header on-scroll (fundo e sombra)

O `HeaderSection` é `position: sticky` e **não tem fundo nem sombra em repouso**. Ao rolar, dois
pseudo-elementos entram em cena com `opacity`/`visibility`.

**Gatilho:** `useScrollOffsetTop()` chamado **sem argumento** → limiar `0`, ou seja, ativa assim que
`window.scrollY > 0`.
Origem: `frontend/src/layouts/core/header-section.tsx:43`; default `top = 0` em
`frontend/node_modules/minimal-shared/dist/index.js` (função `useScrollOffsetTop`).

| Pseudo-elemento | Papel           | Transição (valor bruto)                                                                             | Estado repouso                     | Estado rolado                          | Origem (arquivo:linha)                                                                                                                 |
| --------------- | --------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `::before`      | fundo desfocado | `opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, visibility 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` | `opacity: 0`; `visibility: hidden` | `opacity: 1`; `visibility: visible`    | `frontend/src/layouts/core/header-section.tsx:90-99` (transição em `:95-98`); estado rolado em `:111`; ligação ao `::before` em `:130` |
| `::after`       | sombra difusa   | `opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, visibility 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` | `opacity: 0`; `visibility: hidden` | `opacity: 0.48`; `visibility: visible` | `frontend/src/layouts/core/header-section.tsx:114-126` (estado rolado em `:125`)                                                       |

### 6.1 Geometria e cor dos dois pseudo-elementos

| Propriedade                 | `::before` (fundo)                                                                                                   | `::after` (sombra)                                                                                                                               | Origem (arquivo:linha)                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `position`                  | `absolute`                                                                                                           | `absolute`                                                                                                                                       | `header-section.tsx:94` (herdado de `pauseStyles`)                                                                               |
| `top` / `left`              | `0` / `0`                                                                                                            | —                                                                                                                                                | `header-section.tsx:106-107`                                                                                                     |
| `width`                     | `100%`                                                                                                               | `calc(100% - 48px)`                                                                                                                              | `header-section.tsx:108`; `:122`                                                                                                 |
| `height`                    | `100%`                                                                                                               | `24px`                                                                                                                                           | `header-section.tsx:109`; `:119`                                                                                                 |
| `border-radius`             | —                                                                                                                    | `50%`                                                                                                                                            | `header-section.tsx:121`                                                                                                         |
| `margin`                    | —                                                                                                                    | `auto`                                                                                                                                           | `header-section.tsx:120`                                                                                                         |
| `z-index`                   | `-1`                                                                                                                 | `-2`                                                                                                                                             | `header-section.tsx:88` (`pauseZindex = { top: -1, bottom: -2 }`); aplicado em `:110` e `:123`                                   |
| `backdrop-filter`           | `blur(8px)`                                                                                                          | —                                                                                                                                                | `frontend/src/layouts/core/css-vars.ts:9` (`--layout-header-blur: 8px`) via `theme.mixins.bgBlur` (`header-section.tsx:102-104`) |
| `background-color`          | light `rgba(255 255 255 / 0.8)` = `rgba(255, 255, 255, 0.8)` · dark `rgba(20 26 33 / 0.8)` = `rgba(20, 26, 33, 0.8)` | —                                                                                                                                                | `header-section.tsx:103` (`varAlpha(background.defaultChannel, 0.8)`)                                                            |
| `box-shadow`                | —                                                                                                                    | `0 8px 16px 0 rgba(145 158 171 / 0.16)` = `rgba(145, 158, 171, 0.16)` (light) · `0 8px 16px 0 rgba(0 0 0 / 0.16)` = `rgba(0, 0, 0, 0.16)` (dark) | `header-section.tsx:124` (`customShadows.z8`)                                                                                    |
| `z-index` do próprio header | `var(--layout-header-zIndex)` = `1101`                                                                               | —                                                                                                                                                | `header-section.tsx:129`; `frontend/src/layouts/core/css-vars.ts:10`                                                             |

⚠️ O `blur` do `::before` usa `8px` porque `bgBlur` recebe a variável de layout; o **default do mixin
`bgBlur` é `6px`** (`frontend/src/theme/core/mixins/background.ts:65`), valor que vale para qualquer
outro uso do mixin sem parâmetro.

---

## 7. Skeleton — animação `wave`

O projeto força `animation: 'wave'` como default (o default do MUI é `pulse`), e `variant: 'rounded'`.

| Item                                | Valor bruto                                                        | Origem (arquivo:linha)                                                                            |
| ----------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Animação default do projeto         | `wave`                                                             | `frontend/src/theme/core/components/skeleton.tsx:11`                                              |
| Variante default do projeto         | `rounded`                                                          | `frontend/src/theme/core/components/skeleton.tsx:11`                                              |
| `background-color` do bloco         | `rgba(145 158 171 / 0.12)`\*                                       | `frontend/src/theme/core/components/skeleton.tsx:18`                                              |
| `border-radius` (variant `rounded`) | `16px` (`8 × 2`)                                                   | `frontend/src/theme/core/components/skeleton.tsx:20`                                              |
| Declaração da animação              | `animation: wave 2s linear 0.5s infinite` (aplicada em `&::after`) | default MUI 7.0.1 — `frontend/node_modules/@mui/material/Skeleton/Skeleton.js:68-72` e `:176-184` |
| Duração                             | `2s`                                                               | idem                                                                                              |
| Easing                              | `linear`                                                           | idem                                                                                              |
| Delay                               | `0.5s`                                                             | idem                                                                                              |
| Iterações                           | `infinite`                                                         | idem                                                                                              |

\* O override usa `grey['400Channel']` (`#C4CDD5` → canal `196 205 213`), **não** `grey.500`.
Valor final: `rgba(196 205 213 / 0.12)` = `rgba(196, 205, 213, 0.12)`.

### 7.1 Keyframes reais de `wave` (MUI 7.0.1)

Fonte: `frontend/node_modules/@mui/material/Skeleton/Skeleton.js:47-60`.

```css
@keyframes wave {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  } /* +0.5s de espera entre voltas */
  100% {
    transform: translateX(100%);
  }
}
```

Estrutura que a animação move (`frontend/node_modules/@mui/material/Skeleton/Skeleton.js:151-175`):

```css
.skeleton--wave {
  position: relative;
  overflow: hidden;
  -webkit-mask-image: -webkit-radial-gradient(white, black); /* fix Safari */
}
.skeleton--wave::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(145 158 171 / 0.08), transparent);
  animation: wave 2s linear 0.5s infinite;
}
```

O gradiente usa `palette.action.hover`, que no projeto vale
`rgba(145 158 171 / 0.08)` = `rgba(145, 158, 171, 0.08)`
(`frontend/src/theme/core/palette.ts:104`).

### 7.2 Keyframes de `pulse` (não é o default do projeto)

Fonte: `frontend/node_modules/@mui/material/Skeleton/Skeleton.js:34-46` (keyframes), `:65-67` e
`:144-150` (declaração).
Declaração: `animation: pulse 2s ease-in-out 0.5s infinite`.

```css
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}
```

---

## 8. Spinners e indicadores de carregamento

### 8.1 `CircularProgress` (MUI, sem override no projeto)

Não existe `MuiCircularProgress` nos 81 overrides do tema (`grep -rn "MuiCircularProgress" src/` → 0).
Portanto vale **integralmente** o default do MUI 7.0.1.

| Item                            | Valor bruto                                                | Origem (arquivo:linha)                                                                                       |
| ------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Rotação do SVG                  | `animation: circular-rotate 1.4s linear infinite`          | `frontend/node_modules/@mui/material/CircularProgress/CircularProgress.js:53` e `:97`                        |
| Traço (indeterminado)           | `animation: circular-dash 1.4s ease-in-out infinite`       | `frontend/node_modules/@mui/material/CircularProgress/CircularProgress.js:56` e `:150`                       |
| Transição no modo `determinate` | `stroke-dashoffset 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` | `frontend/node_modules/@mui/material/CircularProgress/CircularProgress.js:133` (usa o default de `create()`) |
| Tamanho base do viewBox         | `44`                                                       | `frontend/node_modules/@mui/material/CircularProgress/CircularProgress.js:22`                                |
| Rotação inicial (determinate)   | `rotate(-90deg)`                                           | `frontend/node_modules/@mui/material/CircularProgress/CircularProgress.js:196`                               |

Keyframes reais (`CircularProgress.js:23-48`):

```css
@keyframes circular-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes circular-dash {
  0% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -15px;
  }
  100% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: -126px;
  }
}
```

Onde aparece no design system: overlay de carregamento do DataGrid, com a cor forçada para
`text.primary` — `frontend/src/theme/core/components/mui-x-data-grid.tsx:211-209`.

### 8.2 `LinearProgress`

O projeto sobrescreve **só a forma e as cores**, nunca a animação.

| Item                                | Valor bruto                                                                               | Origem (arquivo:linha)                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `border-radius` da trilha           | `4px`                                                                                     | `frontend/src/theme/core/components/progress.tsx:43`                                                   |
| `border-radius` da barra            | `inherit` (→ `4px`)                                                                       | `frontend/src/theme/core/components/progress.tsx:47`                                                   |
| Fundo da trilha (cores da paleta)   | `rgba(<main> / 0.24)`, ex. primary → `rgba(0 167 111 / 0.24)` = `rgba(0, 167, 111, 0.24)` | `frontend/src/theme/core/components/progress.tsx:34`                                                   |
| Fundo da trilha (`color="inherit"`) | `rgba(28 37 46 / 0.24)` = `rgba(28, 37, 46, 0.24)` (light, `text.primary` = `#1C252E`)    | `frontend/src/theme/core/components/progress.tsx:38`                                                   |
| Barra 1 (indeterminate)             | `animation: indeterminate1 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite`         | default MUI 7.0.1 — `frontend/node_modules/@mui/material/LinearProgress/LinearProgress.js:45` e `:266` |
| Barra 2 (indeterminate)             | `animation: indeterminate2 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite`        | default MUI 7.0.1 — `frontend/node_modules/@mui/material/LinearProgress/LinearProgress.js:64` e `:338` |
| Trilha (variant `buffer`)           | `animation: buffer 3s infinite linear`                                                    | default MUI 7.0.1 — `frontend/node_modules/@mui/material/LinearProgress/LinearProgress.js:83` e `:204` |

Keyframes reais (`LinearProgress.js:24-82`):

```css
@keyframes indeterminate1 {
  0% {
    left: -35%;
    right: 100%;
  }
  60% {
    left: 100%;
    right: -90%;
  }
  100% {
    left: 100%;
    right: -90%;
  }
}
@keyframes indeterminate2 {
  0% {
    left: -200%;
    right: 100%;
  }
  60% {
    left: 107%;
    right: -8%;
  }
  100% {
    left: 107%;
    right: -8%;
  }
}
@keyframes buffer {
  0% {
    opacity: 1;
    background-position: 0 -23px;
  }
  60% {
    opacity: 0;
    background-position: 0 -23px;
  }
  100% {
    opacity: 1;
    background-position: -200px -23px;
  }
}
```

### 8.3 `LoadingScreen` — fallback de rota do dashboard

| Item                                          | Valor bruto                                                                                                | Origem (arquivo:linha)                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Indicador                                     | `LinearProgress` com `color="inherit"` (usa as animações de §8.2)                                          | `frontend/src/components/loading-screen/loading-screen.tsx:22`    |
| Largura da barra                              | `100%`, `max-width: 360px`                                                                                 | `frontend/src/components/loading-screen/loading-screen.tsx:22`    |
| Container                                     | `flex-grow: 1; width: 100%; min-height: 100%; display: flex; align-items: center; justify-content: center` | `frontend/src/components/loading-screen/loading-screen.tsx:29-38` |
| `padding-left` / `padding-right` do container | `40px` / `40px` (`theme.spacing(5)`)                                                                       | `frontend/src/components/loading-screen/loading-screen.tsx:36-37` |
| Onde é usado                                  | `<Suspense fallback>` das rotas de dashboard                                                               | `frontend/src/routes/sections/dashboard.tsx:183`                  |

**Sem animação própria** — não há keyframes, fade-in nem delay declarados.

### 8.4 `SplashScreen` — fallback de boot da aplicação

| Item               | Valor bruto                                                       | Origem (arquivo:linha)                                                                  |
| ------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Conteúdo           | `<AnimateLogoZoom />` (framer-motion, ver §9.5)                   | `frontend/src/components/loading-screen/splash-screen.tsx:26`                           |
| Overlay            | `position: fixed; right: 0; bottom: 0; width: 100%; height: 100%` | `frontend/src/components/loading-screen/splash-screen.tsx:40-52`                        |
| `z-index`          | `9998`                                                            | `frontend/src/components/loading-screen/splash-screen.tsx:45`                           |
| `background-color` | `#FFFFFF` (light) · `#141A21` (dark) — `background.default`       | `frontend/src/components/loading-screen/splash-screen.tsx:51`                           |
| Onde é usado       | `<Suspense fallback>` das rotas raiz e main                       | `frontend/src/routes/sections/index.tsx:39`; `frontend/src/routes/sections/main.tsx:39` |

### 8.5 Barra de progresso de rota (nprogress 0.2.0)

Montada em `frontend/src/app.tsx:75`. O projeto **não chama `NProgress.configure()`**
(`grep -rn "NProgress.configure" src/` → 0), então valem os defaults da biblioteca.

| Item                              | Valor bruto                                                    | Origem (arquivo:linha)                                                         |
| --------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `height` da barra                 | `2.5px`                                                        | `frontend/src/components/progress-bar/styles.css:5`                            |
| `z-index`                         | `9999`                                                         | `frontend/src/components/progress-bar/styles.css:6`                            |
| `position`                        | `fixed`, `top: 0`, `left: 0`, `width: 100%`                    | `frontend/src/components/progress-bar/styles.css:2-7`                          |
| `pointer-events`                  | `none`                                                         | `frontend/src/components/progress-bar/styles.css:8`                            |
| Cor da barra                      | `var(--palette-primary-main)` = `#00A76F` / `rgb(0, 167, 111)` | `frontend/src/components/progress-bar/styles.css:12`                           |
| Sombra da barra                   | `0 0 2.5px #00A76F`                                            | `frontend/src/components/progress-bar/styles.css:13`                           |
| `peg` (rastro) — largura          | `100px`                                                        | `frontend/src/components/progress-bar/styles.css:18`                           |
| `peg` — transform                 | `rotate(3deg) translate(0px, -4px)`                            | `frontend/src/components/progress-bar/styles.css:22`                           |
| `peg` — sombra                    | `0 0 10px #00A76F, 0 0 5px #00A76F`                            | `frontend/src/components/progress-bar/styles.css:23-25`                        |
| Duração da transição (`speed`)    | `200ms`                                                        | default nprogress 0.2.0 — `frontend/node_modules/nprogress/nprogress.js:23`    |
| Easing (`easing`)                 | `ease`                                                         | default nprogress 0.2.0 — `frontend/node_modules/nprogress/nprogress.js:21`    |
| Progresso mínimo (`minimum`)      | `0.08`                                                         | default nprogress 0.2.0 — `frontend/node_modules/nprogress/nprogress.js:20`    |
| Incremento automático (`trickle`) | `true`, `trickleRate: 0.02`, `trickleSpeed: 800ms`             | default nprogress 0.2.0 — `frontend/node_modules/nprogress/nprogress.js:24-26` |

⚠️ O CSS do projeto **não estiliza** o `.spinner` do nprogress; a lib injeta o markup do spinner
(`frontend/node_modules/nprogress/nprogress.js:31`), que fica sem regra própria.

### 8.6 Spinner do Snackbar (sonner 2.0.2)

| Item                           | Valor bruto                                                                           | Origem (arquivo:linha)                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Animação                       | `rotate 3s infinite linear`                                                           | `frontend/src/components/snackbar/styles.tsx:52`                         |
| Keyframes                      | `@keyframes rotate { to { transform: rotate(1turn) } }`                               | `frontend/src/components/snackbar/styles.tsx:129`                        |
| Tamanho do ícone               | `24px × 24px`, `border-radius: 50%`                                                   | `frontend/src/components/snackbar/styles.tsx:49-51`                      |
| Fundo do ícone                 | `conic-gradient(transparent, rgba(145 158 171 / 0.64))` = `rgba(145, 158, 171, 0.64)` | `frontend/src/components/snackbar/styles.tsx:53`                         |
| Vida útil do toast             | `4000ms`                                                                              | default sonner 2.0.2 — `frontend/node_modules/sonner/dist/index.mjs:417` |
| Tempo até desmontar após saída | `200ms`                                                                               | default sonner 2.0.2 — `frontend/node_modules/sonner/dist/index.mjs:425` |
| Limiar de swipe para dispensar | `45px`                                                                                | default sonner 2.0.2 — `frontend/node_modules/sonner/dist/index.mjs:423` |

⚠️ As curvas de entrada/saída do toast são internas do `sonner` e **não** foram medidas —
ver §11.

---

## 9. framer-motion 12.6.1 — catálogo de variantes

Tudo em `frontend/src/components/animate/**`. Unidade nativa do framer-motion é **segundo**;
os valores brutos abaixo são exatamente os que estão no código, com o equivalente em ms entre parênteses.

### 9.1 Transições-base (a espinha dorsal de todo o catálogo)

| Token             | Valor bruto                                                                                           | Referência MUI  | Onde é usado                                                                                                                 | Origem (arquivo:linha)                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `transitionEnter` | `duration: 0.64` (`640ms`), `ease: [0.43, 0.13, 0.23, 0.96]` → `cubic-bezier(0.43, 0.13, 0.23, 0.96)` | — (fora do MUI) | estado `animate` de **todas** as variantes `varFade`, `varSlide`, `varZoom`, `varScale`, `varRotate`, `varFlip`, `varBounce` | `frontend/src/components/animate/variants/transition.ts:5-9`   |
| `transitionExit`  | `duration: 0.48` (`480ms`), `ease: [0.43, 0.13, 0.23, 0.96]`                                          | —               | estado `exit` das mesmas variantes                                                                                           | `frontend/src/components/animate/variants/transition.ts:11-15` |
| `transitionHover` | `duration: 0.32` (`320ms`), `ease: [0.43, 0.13, 0.23, 0.96]`                                          | —               | hover de elementos animados                                                                                                  | `frontend/src/components/animate/variants/actions.ts:20-24`    |
| `transitionTap`   | `type: 'spring'`, `stiffness: 400`, `damping: 18`                                                     | —               | feedback de clique (mola, sem duração fixa)                                                                                  | `frontend/src/components/animate/variants/actions.ts:13-18`    |

**Padrão de easing:** o design system usa **uma única curva** para praticamente todo o motion de
framer-motion — `cubic-bezier(0.43, 0.13, 0.23, 0.96)`. Ela **não** é nenhum dos 4 easings do tema MUI.

### 9.2 Orquestração (`varContainer`)

| Propriedade        | Valor bruto          | Estado    | Origem (arquivo:linha)                                     |
| ------------------ | -------------------- | --------- | ---------------------------------------------------------- |
| `staggerChildren`  | `0.05` (`50ms`)      | `animate` | `frontend/src/components/animate/variants/container.ts:13` |
| `delayChildren`    | `0.05` (`50ms`)      | `animate` | `frontend/src/components/animate/variants/container.ts:14` |
| `staggerChildren`  | `0.05` (`50ms`)      | `exit`    | `frontend/src/components/animate/variants/container.ts:20` |
| `staggerDirection` | `-1` (ordem inversa) | `exit`    | `frontend/src/components/animate/variants/container.ts:21` |

### 9.3 Variantes de entrada/saída

Todas usam `transitionEnter` no `animate` e `transitionExit` no `exit` (§9.1). A tabela lista o
**deslocamento/estado inicial**, que é o que muda entre elas.

| Variante    | Direções disponíveis                                                                          | Valor bruto característico                                            | Estado inicial (exemplo `inUp`)                                                         | Origem (arquivo:linha)                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `varFade`   | `in`, `inUp`, `inDown`, `inLeft`, `inRight`, `out`, `outUp`, `outDown`, `outLeft`, `outRight` | `distance` default **`120`** (px)                                     | `{ y: 120, opacity: 0 }` → `{ y: 0, opacity: 1 }`                                       | `frontend/src/components/animate/variants/fade.ts:26`; `frontend/src/components/animate/variants/fade.ts:37-41`             |
| `varSlide`  | `inUp`, `inDown`, `inLeft`, `inRight`, `outUp`, `outDown`, `outLeft`, `outRight`              | `distance` default **`160`** (px)                                     | `{ y: 160 }` → `{ y: 0 }` (sem opacidade)                                               | `frontend/src/components/animate/variants/slide.ts:24`; `frontend/src/components/animate/variants/slide.ts:30-34`           |
| `varZoom`   | `in`, `inUp`, `inDown`, `inLeft`, `inRight`, `out`, `outUp`, `outDown`, `outLeft`, `outRight` | `distance` default **`720`** (px)                                     | `{ scale: 0, opacity: 0, translateY: 720 }` → `{ scale: 1, opacity: 1, translateY: 0 }` | `frontend/src/components/animate/variants/zoom.ts:26`; `frontend/src/components/animate/variants/zoom.ts:37-55`             |
| `varScale`  | `in`, `inX`, `inY`, `out`, `outX`, `outY`                                                     | sem `distance`; só `scale`/`scaleX`/`scaleY` `0 → 1`                  | `{ scale: 0, opacity: 0 }` → `{ scale: 1, opacity: 1 }`                                 | `frontend/src/components/animate/variants/scale.ts:20-24`                                                                   |
| `varRotate` | `in`, `out`                                                                                   | `deg` default **`360`**                                               | `{ opacity: 0, rotate: -360 }` → `{ opacity: 1, rotate: 0 }`                            | `frontend/src/components/animate/variants/rotate.ts:16`; `frontend/src/components/animate/variants/rotate.ts:22-26`         |
| `varFlip`   | `inX`, `inY`, `outX`, `outY`                                                                  | rotação de **`-180`** na entrada e **`70`** na saída                  | `{ rotateX: -180, opacity: 0 }` → `{ rotateX: 0, opacity: 1 }`                          | `frontend/src/components/animate/variants/flip.ts:21-25`; saída em `frontend/src/components/animate/variants/flip.ts:32-35` |
| `varBounce` | `in`, `inUp`, `inDown`, `inLeft`, `inRight`, `out`, `outUp`, `outDown`, `outLeft`, `outRight` | `distance` default **`720`** (px), com keyframes múltiplos — ver §9.4 | `{ y: [720, -24, 12, -4, 0] }`                                                          | `frontend/src/components/animate/variants/bounce.ts:25`; `frontend/src/components/animate/variants/bounce.ts:36-45`         |
| `varPath`   | —                                                                                             | `duration: 2` (`2000ms`), `ease: [0.43, 0.13, 0.23, 0.96]`            | `fillOpacity: [0, 0, 1]`, `pathLength: [1, 0.4, 0]`                                     | `frontend/src/components/animate/variants/path.ts:5-16`                                                                     |

### 9.4 Keyframes de `varBounce` (valores literais)

| Direção    | Keyframes                                                                                  | Origem (arquivo:linha)                                       |
| ---------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `in`       | `scale: [0.3, 1.1, 0.9, 1.03, 0.97, 1]`; `opacity: [0, 1, 1, 1, 1, 1]`                     | `frontend/src/components/animate/variants/bounce.ts:29-36`   |
| `inUp`     | `y: [720, -24, 12, -4, 0]`; `scaleY: [4, 0.9, 0.95, 0.985, 1]`; `opacity: [0, 1, 1, 1, 1]` | `frontend/src/components/animate/variants/bounce.ts:37-45`   |
| `inDown`   | `y: [-720, 24, -12, 4, 0]`; `scaleY: [4, 0.9, 0.95, 0.985, 1]`; `opacity: [0, 1, 1, 1, 1]` | `frontend/src/components/animate/variants/bounce.ts:46-54`   |
| `inLeft`   | `x: [-720, 24, -12, 4, 0]`; `scaleX: [3, 1, 0.98, 0.995, 1]`; `opacity: [0, 1, 1, 1, 1]`   | `frontend/src/components/animate/variants/bounce.ts:55-63`   |
| `inRight`  | `x: [720, -24, 12, -4, 0]`; `scaleX: [3, 1, 0.98, 0.995, 1]`; `opacity: [0, 1, 1, 1, 1]`   | `frontend/src/components/animate/variants/bounce.ts:64-72`   |
| `out`      | `scale: [0.9, 1.1, 0.3]`; `opacity: [1, 1, 0]`                                             | `frontend/src/components/animate/variants/bounce.ts:74-80`   |
| `outUp`    | `y: [-12, 24, -720]`; `scaleY: [0.985, 0.9, 3]`; `opacity: [1, 1, 0]`                      | `frontend/src/components/animate/variants/bounce.ts:81-88`   |
| `outDown`  | `y: [12, -24, 720]`; `scaleY: [0.985, 0.9, 3]`; `opacity: [1, 1, 0]`                       | `frontend/src/components/animate/variants/bounce.ts:89-96`   |
| `outLeft`  | `x: [0, 24, -720]`; `scaleX: [1, 0.9, 2]`; `opacity: [1, 1, 0]`                            | `frontend/src/components/animate/variants/bounce.ts:97-104`  |
| `outRight` | `x: [0, -24, 720]`; `scaleX: [1, 0.9, 2]`; `opacity: [1, 1, 0]`                            | `frontend/src/components/animate/variants/bounce.ts:105-112` |

### 9.5 Animações de fundo e de marca (loops infinitos)

| Nome                                | Valor bruto                                                                                                                                                                                                          | Onde é usado                | Origem (arquivo:linha)                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `varBgColor`                        | `duration: 5` (`5000ms`), `ease: 'linear'`, `repeat: Infinity`, `repeatType: 'reverse'`                                                                                                                              | fundo com ciclo de cores    | `frontend/src/components/animate/variants/background.ts:7-18` (valores em `:12-15`)                                                                     |
| `varBgKenburns`                     | `duration: 5` (`5000ms`), `ease: 'easeOut'`; `scale: [1, 1.25]`; deslocamento `±15`/`±20` px conforme direção                                                                                                        | efeito Ken Burns em imagens | `frontend/src/components/animate/variants/background.ts:24-27` (transição); direções em `frontend/src/components/animate/variants/background.ts:29-68`  |
| `varBgPan`                          | `duration: 5` (`5000ms`), `ease: 'linear'`, `repeat: Infinity`, `repeatType: 'reverse'`; `background-size` `100% 600%` ou `600% 100%`                                                                                | gradiente em movimento      | `frontend/src/components/animate/variants/background.ts:83-89` (transição); direções em `frontend/src/components/animate/variants/background.ts:91-129` |
| `AnimateLogoZoom` — logo            | `scale: [1, 0.9, 0.9, 1, 1]`; `opacity: [1, 0.48, 0.48, 1, 1]`; `duration: 2` (`2000ms`); `repeatDelay: 1` (`1000ms`); `repeat: Infinity`; `ease: 'easeInOut'`                                                       | splash screen               | `frontend/src/components/animate/animate-logo.tsx:26-32`                                                                                                |
| `AnimateLogoZoom` — anel primário   | `scale: [1.6, 1, 1, 1.6, 1.6]`; `rotate: [270, 0, 0, 270, 270]`; `opacity: [0.25, 1, 1, 1, 0.25]`; `borderRadius: ['25%','25%','50%','50%','25%']`; `duration: 3.2` (`3200ms`); `ease: 'linear'`; `repeat: Infinity` | splash screen               | `frontend/src/components/animate/animate-logo.tsx:49-56`                                                                                                |
| `AnimateLogoZoom` — anel secundário | `scale: [1, 1.2, 1.2, 1, 1]`; `rotate: [0, 270, 270, 0, 0]`; `opacity: [1, 0.25, 0.25, 0.25, 1]`; `borderRadius: ['25%','25%','50%','50%','25%']`; `duration: 3.2` (`3200ms`); `ease: 'linear'`; `repeat: Infinity`  | splash screen               | `frontend/src/components/animate/animate-logo.tsx:59-66`                                                                                                |
| `AnimateLogoRotate`                 | `rotate: 360`; `duration: 10` (`10000ms`); `ease: 'linear'`; `repeat: Infinity`                                                                                                                                      | halo giratório do logo      | `frontend/src/components/animate/animate-logo.tsx:112-113`                                                                                              |
| `AnimateBorder` (`MovingBorder`)    | `duration` default **`8`** (`8000ms`) por volta completa; forma com `filter: blur(8px)`; `rx`/`ry` default `30%`                                                                                                     | borda animada de destaque   | `frontend/src/components/animate/animate-border.tsx:177-179`; `:236`                                                                                    |

### 9.6 Interação e utilitários

| Nome              | Valor bruto                                                                                                                          | Origem (arquivo:linha)                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `varHover`        | `scale: 1.09` (default do parâmetro)                                                                                                 | `frontend/src/components/animate/variants/actions.ts:5-7`                                                                                                                    |
| `varTap`          | `scale: 0.9` (default do parâmetro)                                                                                                  | `frontend/src/components/animate/variants/actions.ts:9-11`                                                                                                                   |
| `AnimateCountUp`  | `duration` default **`2`** (`2000ms`); dispara com `amount: 0.5`, `once: true`                                                       | `frontend/src/components/animate/animate-count-up.tsx:26-28`; `:50`                                                                                                          |
| `AnimateText`     | `repeatDelayMs` default **`100`** (`100ms`); `amount: 1/3`; `once: true`; variante por caractere default `varFade('in')`             | `frontend/src/components/animate/animate-text.tsx:53-56`; `:142`                                                                                                             |
| `MotionViewport`  | `viewport: { once: true, amount: 0.3 }`; **desliga a animação abaixo de `sm` (`< 600px`)** por default (`disableAnimate = true`)     | `frontend/src/components/animate/motion-viewport.tsx:21`; `frontend/src/components/animate/motion-viewport.tsx:26`; `frontend/src/components/animate/motion-viewport.tsx:35` |
| `MotionContainer` | usa `varContainer()`; `initial: 'initial'`, `animate: 'animate'`, `exit: 'exit'`                                                     | `frontend/src/components/animate/motion-container.tsx:27-31`                                                                                                                 |
| `MotionLazy`      | `LazyMotion` com `strict` e `features={domMax}` (carrega o bundle completo sob demanda)                                              | `frontend/src/components/animate/motion-lazy.tsx:11`                                                                                                                         |
| `ScrollProgress`  | mola: `stiffness: 100`, `damping: 30`, `restDelta: 0.001`; `thickness` default `3.6`; tamanho default `64` (circular) / `3` (linear) | `frontend/src/components/animate/scroll-progress/scroll-progress.tsx:45`; `:59`; `:61`                                                                                       |

---

## 10. Ripple (TouchRipple do MUI)

Confirmado no fonte `frontend/node_modules/@mui/material/ButtonBase/TouchRipple.js`.
O projeto **não sobrescreve** `MuiTouchRipple` (`grep -rn "MuiTouchRipple" src/` → 0).

| Item                                  | Valor bruto                                                                | Referência MUI                       | Origem (arquivo:linha)                                                                         |
| ------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Duração de entrada e saída            | `550ms`                                                                    | constante `DURATION`                 | `frontend/node_modules/@mui/material/ButtonBase/TouchRipple.js:20`; aplicada em `:83` e `:107` |
| Atraso antes de iniciar (toque)       | `80ms`                                                                     | constante `DELAY_RIPPLE`             | `frontend/node_modules/@mui/material/ButtonBase/TouchRipple.js:21`; usado em `:256`            |
| Easing de entrada/saída               | `cubic-bezier(0.4, 0, 0.2, 1)`                                             | `theme.transitions.easing.easeInOut` | `frontend/node_modules/@mui/material/ButtonBase/TouchRipple.js:84-86`; `:108-110`              |
| Duração do pulsate (foco por teclado) | `200ms`                                                                    | `theme.transitions.duration.shorter` | `frontend/node_modules/@mui/material/ButtonBase/TouchRipple.js:90-92`                          |
| Ciclo do `childPulsate`               | `2500ms`, `infinite`, delay `200ms`, easing `cubic-bezier(0.4, 0, 0.2, 1)` | —                                    | `frontend/node_modules/@mui/material/ButtonBase/TouchRipple.js:118-124`                        |
| Opacidade final do ripple visível     | `0.3`                                                                      | —                                    | `frontend/node_modules/@mui/material/ButtonBase/TouchRipple.js:80`                             |
| Cor do ripple                         | `currentColor`                                                             | —                                    | `frontend/node_modules/@mui/material/ButtonBase/TouchRipple.js:101`                            |
| `z-index` do container                | `0`                                                                        | —                                    | `frontend/node_modules/@mui/material/ButtonBase/TouchRipple.js:62`                             |

Keyframes reais (`TouchRipple.js:22-53`):

```css
@keyframes ripple-enter {
  0% {
    transform: scale(0);
    opacity: 0.1;
  }
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
}
@keyframes ripple-exit {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@keyframes ripple-pulsate {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.92);
  }
  100% {
    transform: scale(1);
  }
}
```

### 10.1 Onde o projeto DESLIGA o ripple

| Componente / contexto                                    | Prop                               | Escopo                                          | Origem (arquivo:linha)                                                    |
| -------------------------------------------------------- | ---------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| **`MuiTab`**                                             | `disableRipple: true`              | **global, via tema** — todas as abas do produto | `frontend/src/theme/core/components/tabs.tsx:33`                          |
| **Checkbox do DataGrid** (`baseCheckbox`)                | `disableRipple: true`              | **global, via tema** — todas as grades          | `frontend/src/theme/core/components/mui-x-data-grid.tsx:70`               |
| Item de nav básico desktop (raiz)                        | `disableRipple={navItem.rootItem}` | condicional                                     | `frontend/src/components/nav-basic/desktop/nav-item.tsx:59`               |
| Dots do carrossel                                        | `disableRipple`                    | local                                           | `frontend/src/components/carousel/components/carousel-dot-buttons.tsx:58` |
| Popover de países do phone-input                         | `disableRipple`                    | local                                           | `frontend/src/components/phone-input/list-popover.tsx:55`                 |
| `RHFSelect` (item de lista)                              | `disableRipple`                    | local                                           | `frontend/src/components/hook-form/rhf-select.tsx:128`                    |
| Drawer de settings (botão de reset, label pequeno, item) | `disableRipple`                    | local                                           | `frontend/src/components/settings/drawer/styles.tsx:59`; `:125`; `:143`   |
| Opção base do drawer de settings                         | `disableRipple`                    | local                                           | `frontend/src/components/settings/drawer/base-option.tsx:32`              |
| Item de resultado da searchbar                           | `disableRipple`                    | local                                           | `frontend/src/layouts/components/searchbar/index.tsx:149`                 |

⚠️ Há mais ~20 usos locais de `disableRipple` em `src/sections/**` (produto e demos). Os dois casos
acima marcados como **global** são os únicos que mudam o comportamento padrão do design system.

---

## 11. Itens `⚠️ NÃO CONFIRMADO`

| Item                                                                                           | Motivo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.MuiButton-root.Mui-disabled` incluir `color 250ms cubic-bezier(0.4, 0, 0.2, 1)` na transição | O valor consta como **medido em runtime (Chrome 1911×898)** em `frontend/.ds-extract/FATOS.md` §10.1, mas **não encontrei a regra correspondente no fonte do MUI 7.0.1**. Em `frontend/node_modules/@mui/material/Button/Button.js` só há 4 chamadas a `transitions.create` (linhas 103, 282, 320, 364) e nenhuma delas é condicionada ao estado `disabled`. Como `loadingPosition` tem default `'center'` (`:504`), a variante de `:282-283` (3 propriedades, sem `color`) sobrescreve o `root` de `:103-104` (4 propriedades) para **todo** botão. Não consegui reconciliar a medição com a fonte; a medição não foi refeita nesta rodada. |
| Curvas e durações de entrada/saída dos toasts do `sonner` 2.0.2                                | O componente é da biblioteca, sem override no projeto; as animações são internas (CSS injetado pelo pacote) e não foram medidas em runtime. Só os defaults numéricos de tempo de vida/desmontagem/swipe foram lidos no fonte (§8.6).                                                                                                                                                                                                                                                                                                                                                                                                         |
| Estilo do `.spinner` do nprogress                                                              | O CSS do projeto (`frontend/src/components/progress-bar/styles.css`) não declara nenhuma regra para `.spinner` / `.spinner-icon`, e a lib não injeta CSS próprio. Não há valor para documentar.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Uso real de `theme.transitions.easing.easeIn` e `easing.sharp`                                 | Existem no tema computado (defaults do MUI 7.0.1) mas **nenhuma ocorrência** em `frontend/src/**`. Ficam registrados como disponíveis, sem consumidor no projeto.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Uso de `theme.transitions.duration.complex` (`375ms`) no produto                               | As duas únicas ocorrências estão em `src/sections/_examples/**`, que é a galeria de demonstração do template, não o produto.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

---

## 12. Resumo para reprodução agnóstica

```css
/* Durations */
--duration-shortest: 150ms;
--duration-shorter: 200ms;
--duration-short: 250ms;
--duration-standard: 300ms;
--duration-complex: 375ms;
--duration-entering-screen: 225ms;
--duration-leaving-screen: 195ms;

/* Easings */
--easing-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--easing-ease-out: cubic-bezier(0, 0, 0.2, 1);
--easing-ease-in: cubic-bezier(0.4, 0, 1, 1);
--easing-sharp: cubic-bezier(0.4, 0, 0.6, 1);

/* Layout (próprio do projeto) */
--layout-transition-duration: 120ms;
--layout-transition-easing: linear;

/* Curva do framer-motion (fora do MUI) */
--easing-motion: cubic-bezier(0.43, 0.13, 0.23, 0.96);
--duration-motion-enter: 640ms; /* 0.64s */
--duration-motion-exit: 480ms; /* 0.48s */
--duration-motion-hover: 320ms; /* 0.32s */
```

Regras de ouro para não desviar do original:

1. **A transição default é `300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`** — qualquer transição sem
   duração explícita no projeto usa exatamente isso.
2. **Botão anima 3 propriedades, não 4**: `background-color`, `box-shadow`, `border-color` — em `250ms`.
3. **A sidebar é `120ms linear`**, não `300ms ease` — é o motion mais rápido e mais "seco" do sistema.
4. **Skeleton é `wave`, não `pulse`** — `2s linear 0.5s infinite`, com gradiente de `rgba(145 158 171 / 0.08)`.
5. **O framer-motion não usa nenhum easing do tema** — usa `cubic-bezier(0.43, 0.13, 0.23, 0.96)`.
6. **Abas não têm ripple.** Botões, sim (`550ms`, `cubic-bezier(0.4, 0, 0.2, 1)`, opacidade final `0.3`).

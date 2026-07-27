# 04 — Tamanhos e dimensões

> Documento descritivo do sistema de design **como ele é hoje**, apurado por leitura de código,
> computação do tema real e medição em runtime (Chrome, viewport 1911×898, tema light).
> Fonte primária: `frontend/.ds-extract/FATOS.md`.
>
> **Nenhum valor deste documento é sugestão.** Todo valor existe no código do projeto ou é
> default efetivo da biblioteca de componentes (MUI 7.0.1), e nesse caso está marcado como
> `default MUI 7.0.1`.

---

## ⚠️ 0. Regra obrigatória antes de ler qualquer número

**A base do `rem` neste projeto é 14px, não 16px.**

- `frontend/src/components/settings/settings-config.ts:18` → `fontSize: 14`
- `frontend/src/theme/with-settings/update-components.ts:54-57` → aplica `html { font-size: 14px }`
  (`MuiCssBaseline.styleOverrides.html.fontSize = settingsState?.fontSize`)
- Medido em runtime (Chrome 1911×898): `getComputedStyle(document.documentElement).fontSize === "14px"`

Porém os `rem` do tema são **gerados dividindo por 16** (`pxToRem(v) = v/16 + 'rem'`).
Logo todo `rem` renderiza a **87,5%** do valor nominal:

```
px_real = rem × 14
```

| Valor no código | rem gerado  | px real na tela |
| --------------- | ----------- | --------------- |
| `pxToRem(12)`   | `0.75rem`   | **10,5px**      |
| `pxToRem(13)`   | `0.8125rem` | **11,375px**    |
| `pxToRem(15)`   | `0.9375rem` | **13,125px**    |
| `pxToRem(20)`   | `1.25rem`   | **17,5px**      |
| `pxToRem(24)`   | `1.5rem`    | **21px**        |

**Valores escritos em `px` puro (ex.: `height: 30`, `padding: 12px`) NÃO sofrem essa escala.**
Só `rem`, `em` e `fontSize` numérico do sistema de tema escalam.

Isso é decisivo para as alturas de input, porque a altura interna do campo é declarada em `em`.

---

## 1. Barra superior (header / app bar)

Altura definida por variáveis CSS aplicadas no `body` (via estilos globais do layout).

| Token                              | Valor bruto                                                                          | Referência MUI                             | Onde é usado                                                 | Origem (arquivo:linha)                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------ |
| `--layout-header-mobile-height`    | `64px`                                                                               | — (variável própria do projeto)            | Altura do container do header abaixo do breakpoint de layout | `frontend/src/layouts/core/css-vars.ts:11`             |
| `--layout-header-desktop-height`   | `72px`                                                                               | —                                          | Altura do container do header a partir de `layoutQuery`      | `frontend/src/layouts/core/css-vars.ts:12`             |
| `--layout-header-zIndex`           | `1101` (`zIndex.appBar + 1` = `1100 + 1`)                                            | `zIndex.appBar = 1100` (default MUI 7.0.1) | z-index do header sticky                                     | `frontend/src/layouts/core/css-vars.ts:10`             |
| `--layout-header-blur`             | `8px`                                                                                | —                                          | **Somente** o `backdrop-filter` da barra de nav horizontal   | `frontend/src/layouts/core/css-vars.ts:9`              |
| altura aplicada (mobile → desktop) | `height: var(--layout-header-mobile-height)` → `var(--layout-header-desktop-height)` | `Container`                                | Container interno do header                                  | `frontend/src/layouts/core/header-section.tsx:141-142` |
| altura medida (desktop)            | **72px**                                                                             | —                                          | AppBar do dashboard e das telas de auth                      | medido em runtime (Chrome 1911×898)                    |

### 1.1 Header sticky: camadas `::before` e `::after`

O header é `position: sticky`, `color: transparent`, `box-shadow: none`, e ganha duas
pseudo-camadas que só aparecem quando a página está rolada (`isOffset`).

| Elemento                    | Propriedade             | Valor bruto                                                                                 | Origem (arquivo:linha)                                                                                                                                                      |
| --------------------------- | ----------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HeaderRoot`                | `position`              | `sticky`                                                                                    | `frontend/src/layouts/core/header-section.tsx:47`                                                                                                                           |
| `HeaderRoot`                | `color`                 | `transparent`                                                                               | `frontend/src/layouts/core/header-section.tsx:48`                                                                                                                           |
| `MuiAppBar`                 | `box-shadow`            | `none`                                                                                      | `frontend/src/theme/core/components/appbar.tsx:14`                                                                                                                          |
| `::before` (fundo com blur) | `backdrop-filter`       | `blur(6px)`                                                                                 | mixin `bgBlur` com `blur` default `6` — `frontend/src/theme/core/mixins/background.ts:65,88`, invocado sem `blur` em `frontend/src/layouts/core/header-section.tsx:102-104` |
| `::before`                  | `background-color`      | `rgba(255 255 255 / 0.8)` (light) / `rgba(20 26 33 / 0.8)` (dark)                           | `frontend/src/layouts/core/header-section.tsx:103`                                                                                                                          |
| `::before`                  | `width` / `height`      | `100%` / `100%`                                                                             | `frontend/src/layouts/core/header-section.tsx:108-109`                                                                                                                      |
| `::before`                  | `z-index`               | `-1`                                                                                        | `frontend/src/layouts/core/header-section.tsx:88,110`                                                                                                                       |
| `::after` (sombra)          | `height`                | `24px`                                                                                      | `frontend/src/layouts/core/header-section.tsx:119`                                                                                                                          |
| `::after`                   | `width`                 | `calc(100% - 48px)`                                                                         | `frontend/src/layouts/core/header-section.tsx:122`                                                                                                                          |
| `::after`                   | `border-radius`         | `50%`                                                                                       | `frontend/src/layouts/core/header-section.tsx:121`                                                                                                                          |
| `::after`                   | `box-shadow`            | `0 8px 16px 0 rgba(145 158 171 / 0.16)` (token `customShadows.z8`)                          | `frontend/src/layouts/core/header-section.tsx:124` + `frontend/src/theme/core/custom-shadows.ts:36-58`                                                                      |
| `::after`                   | `opacity` quando rolado | `0.48`                                                                                      | `frontend/src/layouts/core/header-section.tsx:125`                                                                                                                          |
| `::before` / `::after`      | `transition`            | `opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), visibility 200ms cubic-bezier(0.4, 0, 0.2, 1)` | `frontend/src/layouts/core/header-section.tsx:95-98` (duração `shorter` = `200ms`, easing `easeInOut`, defaults MUI 7.0.1)                                                  |

> ⚠️ **Correção sobre o dossiê**: `FATOS.md` §7.2 afirma que o `::before` do header usa
> `blur(8px)`. O código mostra que ele usa o **default do mixin `bgBlur`, que é `6px`**
> (`frontend/src/theme/core/mixins/background.ts:65`). A variável `--layout-header-blur: 8px`
> tem **um único consumidor no projeto**: o `backdrop-filter` da barra de navegação horizontal
> (`frontend/src/layouts/dashboard/nav-horizontal.tsx:57-58`). Verificado com busca global:
> não há outra ocorrência de `--layout-header-blur` fora de `default-mui`.

---

## 2. Barra lateral (sidebar / navegação)

| Token                            | Valor bruto                                                              | Referência MUI                                                            | Onde é usado                                       | Origem (arquivo:linha)                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--layout-nav-vertical-width`    | `300px`                                                                  | —                                                                         | Largura da sidebar no modo `vertical`              | `frontend/src/layouts/dashboard/css-vars.ts:15`                                                                                              |
| `--layout-nav-mini-width`        | `88px`                                                                   | —                                                                         | Largura da sidebar no modo `mini`                  | `frontend/src/layouts/dashboard/css-vars.ts:14`                                                                                              |
| `--layout-nav-mobile-width`      | `288px`                                                                  | —                                                                         | Largura do drawer temporário (nav mobile)          | `frontend/src/layouts/core/css-vars.ts:8`                                                                                                    |
| `--layout-nav-horizontal-height` | `64px`                                                                   | —                                                                         | Altura da faixa de nav horizontal dentro do header | `frontend/src/layouts/dashboard/css-vars.ts:16`                                                                                              |
| `--layout-nav-zIndex`            | `1201` (`zIndex.drawer + 1` = `1200 + 1`)                                | `zIndex.drawer = 1200` (default MUI 7.0.1)                                | z-index da sidebar fixa                            | `frontend/src/layouts/core/css-vars.ts:7`                                                                                                    |
| altura da sidebar                | `100%`                                                                   | —                                                                         | Raiz da `NavVertical`                              | `frontend/src/layouts/dashboard/nav-vertical.tsx:120`                                                                                        |
| borda direita da sidebar         | `1px solid var(--layout-nav-border-color, rgba(145 158 171 / 0.12))`     | —                                                                         | Raiz da `NavVertical`                              | `frontend/src/layouts/dashboard/nav-vertical.tsx:127`                                                                                        |
| largura aplicada na sidebar      | `var(--layout-nav-mini-width)` **ou** `var(--layout-nav-vertical-width)` | —                                                                         | Alterna conforme `navLayout`                       | `frontend/src/layouts/dashboard/nav-vertical.tsx:126`                                                                                        |
| transição de largura             | `width 120ms linear`                                                     | `transitions.create(['width'])` com easing/duração vindos de variável CSS | Colapso mini ↔ vertical                            | `frontend/src/layouts/dashboard/nav-vertical.tsx:128-131` + `frontend/src/layouts/dashboard/css-vars.ts:12-13`                               |
| largura do drawer mobile         | `var(--layout-nav-mobile-width)` = `288px`                               | `Drawer` (`slotProps.paper`)                                              | Menu lateral abaixo do breakpoint de layout        | `frontend/src/layouts/dashboard/nav-mobile.tsx:58`                                                                                           |
| altura interna da nav horizontal | `var(--nav-height)` = `56px`                                             | —                                                                         | `min-height` da lista de itens horizontais         | `frontend/src/components/nav-section/styles/css-vars.ts:95` + `frontend/src/components/nav-section/horizontal/nav-section-horizontal.tsx:43` |

> Observação: existem **dois** números para a navegação horizontal e eles não são redundantes —
> `--layout-nav-horizontal-height: 64px` é a altura da **faixa** dentro do header
> (`frontend/src/layouts/dashboard/nav-horizontal.tsx:55`), e `--nav-height: 56px` é a
> **altura mínima da lista de itens** dentro dessa faixa.

### 2.1 Outros drawers/popovers do layout

| Elemento                           | Valor bruto                                       | Referência MUI             | Origem (arquivo:linha)                                       |
| ---------------------------------- | ------------------------------------------------- | -------------------------- | ------------------------------------------------------------ |
| Drawer da conta (`AccountDrawer`)  | `width: 320` (→ `320px`)                          | `Drawer` `slotProps.paper` | `frontend/src/layouts/components/account-drawer.tsx:144`     |
| Popover da conta                   | `width: 200` (→ `200px`), `padding: 0`            | `Popover`                  | `frontend/src/layouts/components/account-popover.tsx:47`     |
| Popover de workspaces              | `width: 240` (→ `240px`)                          | `Popover`                  | `frontend/src/layouts/components/workspaces-popover.tsx:118` |
| Popover de contatos (área rolável) | `height: 320`, `width: 320` (→ `320px` × `320px`) | —                          | `frontend/src/layouts/components/contacts-popover.tsx:52`    |

---

## 3. Itens de navegação

Tamanhos definidos como variáveis CSS por variante de navegação.

### 3.1 Variante `vertical`

| Token                    | Valor bruto                                                                             | Referência MUI           | Onde é usado                     | Origem (arquivo:linha)                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------- | ------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `--nav-item-root-height` | `44px`                                                                                  | —                        | `min-height` do item de 1º nível | `frontend/src/components/nav-section/styles/css-vars.ts:52` (consumido em `frontend/src/components/nav-section/vertical/nav-item.tsx:186`) |
| `--nav-item-sub-height`  | `36px`                                                                                  | —                        | `min-height` do item filho       | `frontend/src/components/nav-section/styles/css-vars.ts:54` (consumido em `.../vertical/nav-item.tsx:202`)                                 |
| `--nav-item-gap`         | `4px`                                                                                   | —                        | Espaço entre itens               | `frontend/src/components/nav-section/styles/css-vars.ts:45`                                                                                |
| `--nav-item-radius`      | `8px` (`shape.borderRadius × 1`)                                                        | `shape.borderRadius = 8` | Raio do item                     | `frontend/src/components/nav-section/styles/css-vars.ts:46` + `frontend/src/theme/create-theme.ts:35`                                      |
| padding do item          | `--nav-item-pt: 4px`, `--nav-item-pr: 8px`, `--nav-item-pb: 4px`, `--nav-item-pl: 12px` | —                        | Padding do item                  | `frontend/src/components/nav-section/styles/css-vars.ts:47-50`                                                                             |
| `--nav-icon-size`        | `24px`                                                                                  | —                        | Ícone do item                    | `frontend/src/components/nav-section/styles/css-vars.ts:56`                                                                                |
| `--nav-icon-margin`      | `0 12px 0 0`                                                                            | —                        | Espaço ícone→texto               | `frontend/src/components/nav-section/styles/css-vars.ts:57`                                                                                |
| `--nav-bullet-size`      | `12px`                                                                                  | —                        | Marcador de item filho           | `frontend/src/components/nav-section/styles/css-vars.ts:59`                                                                                |

### 3.2 Variante `mini`

| Token                     | Valor bruto       | Referência MUI           | Onde é usado                     | Origem (arquivo:linha)                                                                                 |
| ------------------------- | ----------------- | ------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `--nav-item-root-height`  | `56px`            | —                        | `min-height` do item de 1º nível | `frontend/src/components/nav-section/styles/css-vars.ts:75` (consumido em `.../mini/nav-item.tsx:129`) |
| `--nav-item-root-padding` | `8px 4px 6px 4px` | —                        | Padding do item raiz             | `frontend/src/components/nav-section/styles/css-vars.ts:76`                                            |
| `--nav-item-sub-height`   | `34px`            | —                        | `min-height` do item filho       | `frontend/src/components/nav-section/styles/css-vars.ts:78` (consumido em `.../mini/nav-item.tsx:146`) |
| `--nav-item-sub-padding`  | `0 8px`           | —                        | Padding do item filho            | `frontend/src/components/nav-section/styles/css-vars.ts:79`                                            |
| `--nav-item-gap`          | `4px`             | —                        | Espaço entre itens               | `frontend/src/components/nav-section/styles/css-vars.ts:72`                                            |
| `--nav-item-radius`       | `8px`             | `shape.borderRadius = 8` | Raio do item                     | `frontend/src/components/nav-section/styles/css-vars.ts:73`                                            |
| `--nav-icon-size`         | `22px`            | —                        | Ícone do item                    | `frontend/src/components/nav-section/styles/css-vars.ts:81`                                            |
| `--nav-icon-root-margin`  | `0 0 6px 0`       | —                        | Ícone acima do rótulo            | `frontend/src/components/nav-section/styles/css-vars.ts:82`                                            |
| `--nav-icon-sub-margin`   | `0 8px 0 0`       | —                        | Ícone do item filho              | `frontend/src/components/nav-section/styles/css-vars.ts:83`                                            |

### 3.3 Variante `horizontal`

| Token                     | Valor bruto                         | Referência MUI           | Onde é usado                     | Origem (arquivo:linha)                                                                                        |
| ------------------------- | ----------------------------------- | ------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--nav-height`            | `56px`                              | —                        | `min-height` da lista horizontal | `frontend/src/components/nav-section/styles/css-vars.ts:95`                                                   |
| `--nav-item-root-height`  | `32px`                              | —                        | `min-height` do item de 1º nível | `frontend/src/components/nav-section/styles/css-vars.ts:98` (consumido em `.../horizontal/nav-item.tsx:128`)  |
| `--nav-item-root-padding` | `0 6px`                             | —                        | Padding do item raiz             | `frontend/src/components/nav-section/styles/css-vars.ts:99`                                                   |
| `--nav-item-sub-height`   | `34px`                              | —                        | `min-height` do item filho       | `frontend/src/components/nav-section/styles/css-vars.ts:101` (consumido em `.../horizontal/nav-item.tsx:145`) |
| `--nav-item-sub-padding`  | `0 8px`                             | —                        | Padding do item filho            | `frontend/src/components/nav-section/styles/css-vars.ts:102`                                                  |
| `--nav-item-gap`          | `6px`                               | —                        | Espaço entre itens               | `frontend/src/components/nav-section/styles/css-vars.ts:94`                                                   |
| `--nav-item-radius`       | `6px` (`shape.borderRadius × 0.75`) | `shape.borderRadius = 8` | Raio do item                     | `frontend/src/components/nav-section/styles/css-vars.ts:96`                                                   |
| `--nav-icon-size`         | `22px`                              | —                        | Ícone do item                    | `frontend/src/components/nav-section/styles/css-vars.ts:104`                                                  |

---

## 4. Botões

### 4.1 Alturas efetivas

| Tamanho  | Altura   | Como a altura é obtida                                                           | Origem (arquivo:linha)                              |
| -------- | -------- | -------------------------------------------------------------------------------- | --------------------------------------------------- |
| `small`  | **30px** | **Declarada** (`height: 30`)                                                     | `frontend/src/theme/core/components/button.tsx:153` |
| `medium` | **33px** | **NÃO é declarada** — é resultado de `padding vertical + line-height` (ver §4.3) | derivado; medido em runtime (Chrome 1911×898)       |
| `large`  | **48px** | **Declarada** (`height: 48`)                                                     | `frontend/src/theme/core/components/button.tsx:164` |

> ⚠️ Não existe `height` para `sizeMedium` no tema
> (`frontend/src/theme/core/components/button.tsx:158-162` só define padding horizontal).
> Os **33px** são emergentes: qualquer mudança em `typography.button` (font-size ou line-height)
> muda a altura do botão médio, mas **não** muda a de small/large, que estão travadas.

### 4.2 Paddings horizontais (todos sobrescritos pelo projeto)

| Tamanho  | Variante `text` | Demais variantes | Origem (arquivo:linha)                                  |
| -------- | --------------- | ---------------- | ------------------------------------------------------- |
| `small`  | `4px`           | `8px`            | `frontend/src/theme/core/components/button.tsx:158-156` |
| `medium` | `8px`           | `12px`           | `frontend/src/theme/core/components/button.tsx:159-161` |
| `large`  | `10px`          | `16px`           | `frontend/src/theme/core/components/button.tsx:165-167` |

Valores medidos em runtime batem exatamente com a tabela acima.

### 4.3 Tipografia e geometria base do botão

| Token                                | Valor bruto                                                                                                                                                                                     | Referência MUI                              | Origem (arquivo:linha)                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| `font-size` small                    | `0.8125rem / 11,375px` (`pxToRem(13)`)                                                                                                                                                          | `Button` `sizeSmall`                        | default MUI 7.0.1 — `@mui/material/Button/Button.js` (variante `size: 'small'`) |
| `font-size` medium                   | `0.875rem / 12,25px` (`typography.button`)                                                                                                                                                      | `typography.button`                         | `frontend/src/theme/core/typography.ts:120-126`                                 |
| `font-size` large                    | `0.9375rem / 13,125px` (`pxToRem(15)`)                                                                                                                                                          | `Button` `sizeLarge`                        | default MUI 7.0.1                                                               |
| `line-height` (fator)                | `24/14 = 1.7142857142857142`                                                                                                                                                                    | `typography.button.lineHeight`              | `frontend/src/theme/core/typography.ts:120-126`                                 |
| `line-height` small                  | `19,5px`                                                                                                                                                                                        | —                                           | derivado (`1.7142857… × 11,375px`); medido em runtime                           |
| `line-height` medium                 | `21px`                                                                                                                                                                                          | —                                           | derivado (`1.7142857… × 12,25px`); medido em runtime                            |
| `line-height` large                  | `22,5px`                                                                                                                                                                                        | —                                           | derivado (`1.7142857… × 13,125px`); medido em runtime                           |
| `padding` vertical (root)            | `6px` (topo) + `6px` (base)                                                                                                                                                                     | `Button` root `padding: '6px 16px'`         | default MUI 7.0.1                                                               |
| `padding` vertical (`outlined` root) | `5px` + `5px` + `1px` de borda em cima e embaixo                                                                                                                                                | `Button` `outlined` `padding: '5px 15px'`   | default MUI 7.0.1                                                               |
| `border-radius`                      | `8px`                                                                                                                                                                                           | `shape.borderRadius`                        | `frontend/src/theme/create-theme.ts:35`                                         |
| `min-width`                          | `64px`                                                                                                                                                                                          | `Button` root                               | default MUI 7.0.1 — `@mui/material/Button/Button.js:99`                         |
| `min-width` dentro de `ButtonGroup`  | `40px`                                                                                                                                                                                          | `ButtonGroup`                               | default MUI 7.0.1 — `@mui/material/ButtonGroup/ButtonGroup.js:231`              |
| `box-shadow`                         | `none`                                                                                                                                                                                          | `disableElevation: true`                    | `frontend/src/theme/core/components/button.tsx:84`                              |
| `transition`                         | `background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)` | duração `short = 250ms`, easing `easeInOut` | default MUI 7.0.1; medido em runtime                                            |

---

## 5. FAB (botão de ação flutuante)

### 5.1 Variantes circulares (`circular`) — dimensões default da biblioteca

| Tamanho           | Largura × altura | Referência MUI         | Origem                                               |
| ----------------- | ---------------- | ---------------------- | ---------------------------------------------------- |
| `large` (default) | `56px × 56px`    | `Fab` root             | default MUI 7.0.1 — `@mui/material/Fab/Fab.js:61-62` |
| `medium`          | `48px × 48px`    | `Fab` `size: 'medium'` | default MUI 7.0.1 — `@mui/material/Fab/Fab.js:94-95` |
| `small`           | `40px × 40px`    | `Fab` `size: 'small'`  | default MUI 7.0.1 — `@mui/material/Fab/Fab.js:86-87` |
| `min-height`      | `36px`           | `Fab` root             | default MUI 7.0.1 — `@mui/material/Fab/Fab.js:54`    |
| `border-radius`   | `50%`            | `Fab` root             | default MUI 7.0.1 — `@mui/material/Fab/Fab.js:58`    |

> O projeto **não** sobrescreve tamanhos das variantes circulares — só cores, sombras e
> as variantes `outlined`/`soft` (`frontend/src/theme/core/components/button-fab.tsx:31-148`).

### 5.2 Variantes estendidas (`extended`, `outlinedExtended`, `softExtended`) — sobrescritas pelo projeto

| Tamanho           | Altura / min-height | `border-radius`   | `gap`                  | `padding`                  | Origem (arquivo:linha)                                      |
| ----------------- | ------------------- | ----------------- | ---------------------- | -------------------------- | ----------------------------------------------------------- |
| `large` (default) | `48px` / `48px`     | `24px` (`48 / 2`) | `8px` (`spacing(1)`)   | `0 16px` (`spacing(0, 2)`) | `frontend/src/theme/core/components/button-fab.tsx:154-159` |
| `medium`          | `40px` / `40px`     | `20px` (`40 / 2`) | herda `8px`            | herda `0 16px`             | `frontend/src/theme/core/components/button-fab.tsx:167`     |
| `small`           | `34px` / `34px`     | `17px` (`34 / 2`) | `4px` (`spacing(0.5)`) | `0 8px` (`spacing(0, 1)`)  | `frontend/src/theme/core/components/button-fab.tsx:160-166` |
| `width` (todas)   | `auto`              | —                 | —                      | —                          | `frontend/src/theme/core/components/button-fab.tsx:155`     |

Variantes de FAB criadas pelo projeto (não existem na biblioteca pura):
`outlined`, `outlinedExtended`, `soft`, `softExtended`
(`frontend/src/theme/core/components/button-fab.tsx:14-19`).

---

## 6. Inputs (campos de formulário)

### 6.1 Alturas efetivas

| Variante   | Tamanho  | Altura      | Origem                                                               |
| ---------- | -------- | ----------- | -------------------------------------------------------------------- |
| `outlined` | `medium` | **51,86px** | medido em runtime (Chrome 1911×898); reproduzido pelo cálculo em §11 |
| `outlined` | `small`  | **35,86px** | medido em runtime; reproduzido pelo cálculo em §11                   |
| `filled`   | `medium` | **51,86px** | medido em runtime; reproduzido pelo cálculo em §11                   |
| `filled`   | `small`  | **34,61px** | medido em runtime — ⚠️ composição **NÃO CONFIRMADA**, ver §6.4       |
| `standard` | `medium` | **27,86px** | medido em runtime; reproduzido pelo cálculo em §11                   |
| `standard` | `small`  | **24,86px** | medido em runtime; reproduzido pelo cálculo em §11                   |

### 6.2 Peças que compõem a altura

| Token                                   | Valor bruto                            | Referência MUI                                  | Onde é usado                         | Origem (arquivo:linha)                                                            |
| --------------------------------------- | -------------------------------------- | ----------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| `font-size` do `<input>`                | `0.9375rem / 13,125px` (`pxToRem(15)`) | `MuiInputBase.input`                            | Todos os inputs (todas as variantes) | `frontend/src/theme/core/components/textfield.tsx:21`                             |
| `font-size` do `<input>` abaixo de `sm` | `1rem / 14px` (`pxToRem(16)`)          | `MuiInputBase.input` + `breakpoints.down('sm')` | Evita zoom automático no Safari iOS  | `frontend/src/theme/core/components/textfield.tsx:22-25`                          |
| `height` do `<input>`                   | `1.4375em`                             | `InputBase` slot `input`                        | Define a altura do conteúdo do campo | default MUI 7.0.1 — `@mui/material/InputBase/InputBase.js` (`height: '1.4375em'`) |
| `box-sizing` do `<input>`               | `content-box`                          | `InputBase` slot `input`                        | Padding soma por fora da altura      | default MUI 7.0.1                                                                 |
| `box-sizing` da raiz                    | `border-box`                           | `InputBase` slot `root`                         | —                                    | default MUI 7.0.1                                                                 |
| `line-height` da raiz                   | `1.4375em`                             | `InputBase` slot `root`                         | —                                    | default MUI 7.0.1                                                                 |

**Altura de conteúdo do input (padrão do projeto):**
`1.4375 × 13,125px = 18,8671875px` → arredondado pelo browser para **18,87px**.

### 6.3 Paddings por variante (defaults da biblioteca — o projeto não os altera)

| Variante   | Tamanho                 | `padding` do `<input>`                                        | Origem                                                                                                      |
| ---------- | ----------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `outlined` | `medium`                | `16.5px 14px`                                                 | default MUI 7.0.1 — `@mui/material/OutlinedInput/OutlinedInput.js:136`                                      |
| `outlined` | `small`                 | `8.5px 14px`                                                  | default MUI 7.0.1 — `@mui/material/OutlinedInput/OutlinedInput.js:162`                                      |
| `filled`   | `medium`                | `25px 12px 8px 12px`                                          | default MUI 7.0.1 — `@mui/material/FilledInput/FilledInput.js:200-203`                                      |
| `filled`   | `small`                 | `paddingTop: 21`, `paddingBottom: 4` (mantém `12px` laterais) | default MUI 7.0.1 — `@mui/material/FilledInput/FilledInput.js` (variante `size: 'small'`)                   |
| `filled`   | `small` + `hiddenLabel` | `paddingTop: 8`, `paddingBottom: 9`                           | default MUI 7.0.1 — `@mui/material/FilledInput/FilledInput.js` (variante `hiddenLabel && size === 'small'`) |
| `standard` | `medium`                | `4px 0 5px`                                                   | default MUI 7.0.1 — `@mui/material/InputBase/InputBase.js` (slot `input`)                                   |
| `standard` | `small`                 | `paddingTop: 1` (sobrepõe o `4px`), mantém `5px` embaixo      | default MUI 7.0.1 — `@mui/material/InputBase/InputBase.js` (variante `size: 'small'`)                       |

### 6.4 ⚠️ NÃO CONFIRMADO — composição do `filled` + `small` (34,61px)

O valor **34,61px** está registrado como medição de runtime em `FATOS.md` §10.3, junto de
`padding 8px 4px 9px` e `font-size 12,25px` para o `<input>`.

Esses três números **não são reproduzíveis** a partir do tema do projeto:

- `8px` topo e `9px` base correspondem à combinação `hiddenLabel + size="small"` do MUI 7.0.1,
  mas essa combinação usa **`12px` laterais**, não `4px`;
- `font-size: 12,25px` (`0.875rem`) contradiz o override do projeto, que fixa `0.9375rem`
  (`13,125px`) para o `<input>` (`frontend/src/theme/core/components/textfield.tsx:21`);
- com o `font-size` do tema, a mesma combinação daria `8 + 18,87 + 9 = 35,87px`, não `34,61px`.

**Conclusão:** o elemento medido não é um `TextField` `filled`/`small` isolado — é provavelmente
um input embutido em outro componente (que redefine `font-size` e paddings). A altura de
`34,61px` **não é um token do design system** e não deve ser reproduzida.
Não foi possível determinar a cadeia de declarações que a produz sem uma nova medição
identificando o seletor exato do elemento.

### 6.5 Contorno, rótulo e texto auxiliar

| Token                         | Valor bruto                                                                                                                      | Referência MUI                              | Origem (arquivo:linha)                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `border-radius` do `outlined` | `8px`                                                                                                                            | `shape.borderRadius`                        | default MUI 7.0.1 (`OutlinedInput` usa `shape.borderRadius`) + `frontend/src/theme/create-theme.ts:35` |
| `border` do contorno          | `1px solid rgba(145 158 171 / 0.2)`                                                                                              | `notchedOutline`                            | `frontend/src/theme/core/components/textfield.tsx:70`                                                  |
| `transition` do contorno      | `border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)`                                                                                | duração `shortest = 150ms`                  | `frontend/src/theme/core/components/textfield.tsx:71-73`                                               |
| `border-color` em erro        | `#FF5630` / `rgb(255 86 48)`                                                                                                     | `palette.error.main`                        | `frontend/src/theme/core/components/textfield.tsx:60`                                                  |
| `border-radius` do `filled`   | `8px`                                                                                                                            | `shape.borderRadius`                        | `frontend/src/theme/core/components/textfield.tsx:91`                                                  |
| fundo do `filled`             | `rgba(145 158 171 / 0.08)`                                                                                                       | —                                           | `frontend/src/theme/core/components/textfield.tsx:92`                                                  |
| rótulo em repouso             | `font-size 12,25px`, `font-weight 400`, `color #919EAB` / `rgb(145 158 171)`, `transform translate(14px, 16px)`                  | `InputLabel`                                | medido em runtime (Chrome 1911×898)                                                                    |
| rótulo encolhido (`shrink`)   | `font-size 14px`, `font-weight 600`, `color #637381` / `rgb(99 115 129)`, `transform translate(14px, -9px) scale(0.75)`          | `InputLabel`                                | medido em runtime                                                                                      |
| `transition` do rótulo        | `color 200ms cubic-bezier(0, 0, 0.2, 1), transform 200ms cubic-bezier(0, 0, 0.2, 1), max-width 200ms cubic-bezier(0, 0, 0.2, 1)` | duração `shorter = 200ms`, easing `easeOut` | medido em runtime                                                                                      |
| texto auxiliar (`helperText`) | `font-size 10,5px`, `line-height 15,75px`, `margin-top 8px`, `margin-left 14px`, `color #637381`                                 | `FormHelperText`                            | medido em runtime                                                                                      |

### 6.6 Ícones internos de campos

| Token                         | Valor bruto                                                                                                         | Referência MUI                 | Onde é usado                      | Origem (arquivo:linha)                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------- | ----------------------------------------------------------- |
| ícone do `Select`             | `18px × 18px`, `right: 10px`, `top: calc(50% - 9px)`                                                                | `MuiSelect.icon`               | Seta do select                    | `frontend/src/theme/core/components/select.tsx:34-37`       |
| ícone do `NativeSelect`       | `18px × 18px`, `right: 10px`, `top: calc(50% - 9px)`                                                                | `MuiNativeSelect.icon`         | Seta do select nativo             | `frontend/src/theme/core/components/select.tsx:55-58`       |
| ícone final do `Autocomplete` | `18px × 18px`                                                                                                       | `MuiAutocomplete.endAdornment` | Seta e "limpar"                   | `frontend/src/theme/core/components/autocomplete.tsx:54`    |
| tag do `Autocomplete`         | `height: 24px`, `min-width: 24px`, `line-height: 24px`, `padding: 0 6px` (`spacing(0, 0.75)`), `border-radius: 8px` | `MuiAutocomplete.root`         | Contador "+N" de seleção múltipla | `frontend/src/theme/core/components/autocomplete.tsx:39-46` |

---

## 7. Tabelas

### 7.1 Célula e linha (tabela padrão)

| Token                                           | Valor bruto                                                     | Referência MUI                        | Onde é usado        | Origem (arquivo:linha)                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------- | ------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `padding` da célula (`normal`)                  | `16px`                                                          | `TableCell` root                      | Todas as células    | default MUI 7.0.1 — `@mui/material/TableCell/TableCell.js:57`                                     |
| `padding` da célula (`size="small"` / densa)    | `6px 16px`                                                      | `TableCell` `size: 'small'`           | Tabela densa        | default MUI 7.0.1 — `@mui/material/TableCell/TableCell.js:88`                                     |
| `padding` da célula `padding="checkbox"`        | `0 0 0 4px`; largura `48px`                                     | `TableCell`                           | Coluna de seleção   | default MUI 7.0.1 — `@mui/material/TableCell/TableCell.js:105` e `:103`                           |
| `padding-left` da célula de checkbox (override) | `8px` (`spacing(1)`)                                            | `MuiTableCell.paddingCheckbox`        | Coluna de seleção   | `frontend/src/theme/core/components/table.tsx:69`                                                 |
| `font-size` do cabeçalho                        | `14px` (px puro — **não escala com o rem**)                     | `MuiTableCell.head`                   | Cabeçalho           | `frontend/src/theme/core/components/table.tsx:60`                                                 |
| `font-weight` do cabeçalho                      | `600` (`fontWeightSemiBold`)                                    | `MuiTableCell.head`                   | Cabeçalho           | `frontend/src/theme/core/components/table.tsx:62` + `frontend/src/theme/core/typography.ts:47-51` |
| `line-height` do cabeçalho                      | `1.5rem / 21px` (`pxToRem(24)`)                                 | `TableCell` `variant: 'head'`         | Cabeçalho           | default MUI 7.0.1 — `@mui/material/TableCell/TableCell.js:64`                                     |
| corpo: `font-size` / `line-height`              | `0.875rem / 12,25px` · `22/14 = 1.5714285714285714` → `19,25px` | `typography.body2`                    | Células de corpo    | `frontend/src/theme/core/typography.ts:106-109` (herdado por `TableCell` root)                    |
| estilo da borda inferior                        | `dashed`, `1px`, cor `rgba(145 158 171 / 0.2)` (`divider`)      | `MuiTableCell.root` + `MuiTable.root` | Separador de linhas | `frontend/src/theme/core/components/table.tsx:58` e `:30`                                         |

**Altura mínima de linha (uma linha de texto), calculada — não medida:**

| Linha                       | Aritmética                 | Altura      |
| --------------------------- | -------------------------- | ----------- |
| Cabeçalho, densidade normal | `16 + 21 + 16 + 1` (borda) | **54px**    |
| Corpo, densidade normal     | `16 + 19,25 + 16 + 1`      | **52,25px** |
| Corpo, `size="small"`       | `6 + 19,25 + 6 + 1`        | **32,25px** |

> Esses três valores são **derivados** dos tokens acima, não medidos em runtime. A altura real
> cresce se a célula tiver conteúdo de mais de uma linha ou componentes internos mais altos
> (chip 32px, avatar 40px etc.).

### 7.2 Paginação de tabela

| Token                     | Valor bruto                                         | Referência MUI                                | Onde é usado             | Origem (arquivo:linha)                                |
| ------------------------- | --------------------------------------------------- | --------------------------------------------- | ------------------------ | ----------------------------------------------------- |
| altura da barra           | `64px`                                              | `MuiTablePagination.toolbar`                  | Rodapé de paginação      | `frontend/src/theme/core/components/table.tsx:90`     |
| largura da raiz           | `100%`                                              | `MuiTablePagination.root`                     | —                        | `frontend/src/theme/core/components/table.tsx:93`     |
| margem das ações          | `8px` à direita                                     | `MuiTablePagination.actions`                  | Botões anterior/próximo  | `frontend/src/theme/core/components/table.tsx:93`     |
| ícone do seletor          | `16px × 16px`, `right: 4px`, `top: calc(50% - 8px)` | `MuiTablePagination.selectIcon`               | Seta "linhas por página" | `frontend/src/theme/core/components/table.tsx:98-103` |
| `padding-left` do seletor | `8px`                                               | `MuiTablePagination.select`                   | —                        | `frontend/src/theme/core/components/table.tsx:93`     |
| botões de navegação       | `size: 'small'`                                     | `backIconButtonProps` / `nextIconButtonProps` | —                        | `frontend/src/theme/core/components/table.tsx:80-81`  |

### 7.3 Grade de dados (DataGrid)

| Token                         | Valor bruto                        | Referência MUI X                   | Onde é usado                | Origem                                                                                        |
| ----------------------------- | ---------------------------------- | ---------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| altura da linha               | `52px`                             | `rowHeight`                        | Linhas                      | default MUI X DataGrid 7.28.2 — `@mui/x-data-grid/constants/dataGridPropsDefaultValues.js:50` |
| altura do cabeçalho           | `56px`                             | `columnHeaderHeight`               | Cabeçalho                   | default MUI X DataGrid 7.28.2 — `@mui/x-data-grid/constants/dataGridPropsDefaultValues.js:13` |
| `font-size` do cabeçalho      | `14px` (px puro)                   | `MuiDataGrid.columnHeader`         | Cabeçalho                   | `frontend/src/theme/core/components/mui-x-data-grid.tsx:131`                                  |
| raio da grade                 | `0` (`--unstable_DataGrid-radius`) | `MuiDataGrid.root`                 | Contêiner                   | `frontend/src/theme/core/components/mui-x-data-grid.tsx:101`                                  |
| largura da borda da grade     | `0`                                | `MuiDataGrid.root`                 | Contêiner                   | `frontend/src/theme/core/components/mui-x-data-grid.tsx:105`                                  |
| `min-width` do menu de coluna | `140px`                            | `MuiDataGrid.menu`                 | Menu suspenso do cabeçalho  | `frontend/src/theme/core/components/mui-x-data-grid.tsx:180`                                  |
| ícone de excluir filtro       | `16px × 16px`                      | `MuiDataGrid.filterFormDeleteIcon` | Painel de filtros           | `frontend/src/theme/core/components/mui-x-data-grid.tsx:244`                                  |
| ícones da grade               | `20px × 20px`                      | `svgIconProps`                     | Todos os ícones do DataGrid | `frontend/src/theme/core/components/mui-x-data-grid.tsx:256`                                  |
| ícone de busca rápida         | `24px × 24px`                      | slot `quickFilterIcon`             | Barra de busca              | `frontend/src/theme/core/components/mui-x-data-grid.tsx:62`                                   |
| ícone "coluna filtrada"       | `width: 16px`                      | slot `columnFilteredIcon`          | Cabeçalho                   | `frontend/src/theme/core/components/mui-x-data-grid.tsx:50`                                   |

---

## 8. Elementos de conteúdo

### 8.1 Avatares

| Token                                          | Valor bruto                                      | Referência MUI                           | Onde é usado                | Origem                                                       |
| ---------------------------------------------- | ------------------------------------------------ | ---------------------------------------- | --------------------------- | ------------------------------------------------------------ |
| avatar padrão                                  | `40px × 40px`                                    | `Avatar` root                            | Avatar isolado              | default MUI 7.0.1 — `@mui/material/Avatar/Avatar.js:51-52`   |
| `font-size` do avatar                          | `1.25rem / 17,5px` (`pxToRem(20)`)               | `Avatar` root                            | Iniciais                    | default MUI 7.0.1 — `@mui/material/Avatar/Avatar.js:54`      |
| ícone dentro do avatar                         | `75%` da caixa                                   | `Avatar` `fallback`                      | Fallback                    | default MUI 7.0.1 — `@mui/material/Avatar/Avatar.js:110-111` |
| `border-radius` variante `rounded`             | `12px` (`shape.borderRadius × 1.5`)              | `MuiAvatar.rounded`                      | Avatar quadrado arredondado | `frontend/src/theme/core/components/avatar.tsx:64`           |
| `AvatarGroup` `max`                            | `4`                                              | `MuiAvatarGroup.defaultProps`            | Grupo de avatares           | `frontend/src/theme/core/components/avatar.tsx:91`           |
| `AvatarGroup` `font-size` dos itens            | `16px` (px puro)                                 | `MuiAvatarGroup.avatar`                  | —                           | `frontend/src/theme/core/components/avatar.tsx:114`          |
| `AvatarGroup` `font-size` do 1º item           | `12px` (px puro)                                 | `MuiAvatarGroup.avatar` `:first-of-type` | Contador "+N"               | `frontend/src/theme/core/components/avatar.tsx:117`          |
| `AvatarGroup` variante `compact` — caixa       | `40px × 40px`                                    | variante criada pelo projeto             | Empilhamento diagonal       | `frontend/src/theme/core/components/avatar.tsx:100-101`      |
| `AvatarGroup` variante `compact` — cada avatar | `28px × 28px`, `margin: 0`, `position: absolute` | variante criada pelo projeto             | —                           | `frontend/src/theme/core/components/avatar.tsx:105-107`      |
| `AvatarGroup` `compact` — z-index do 1º        | `9`                                              | —                                        | Sobreposição                | `frontend/src/theme/core/components/avatar.tsx:108`          |

### 8.2 Chips

| Token                          | Valor bruto                                          | Referência MUI         | Onde é usado  | Origem                                                   |
| ------------------------------ | ---------------------------------------------------- | ---------------------- | ------------- | -------------------------------------------------------- |
| altura `medium`                | `32px`                                               | `Chip` root            | Chip padrão   | default MUI 7.0.1 — `@mui/material/Chip/Chip.js:94`      |
| altura `small`                 | `24px`                                               | `Chip` `size: 'small'` | Chip compacto | default MUI 7.0.1 — `@mui/material/Chip/Chip.js:157`     |
| `border-radius` `medium`       | `10px` (`shape.borderRadius × 1.25`)                 | `MuiChip.sizeMedium`   | —             | `frontend/src/theme/core/components/chip.tsx:140`        |
| `border-radius` `small`        | `8px` (`shape.borderRadius × 1`)                     | `MuiChip.sizeSmall`    | —             | `frontend/src/theme/core/components/chip.tsx:141`        |
| `font-size`                    | `0.8125rem / 11,375px` (`pxToRem(13)`)               | `Chip` root            | Rótulo        | default MUI 7.0.1 — `@mui/material/Chip/Chip.js:90`      |
| `font-weight` do rótulo        | `500` (`fontWeightMedium`)                           | `MuiChip.label`        | Rótulo        | `frontend/src/theme/core/components/chip.tsx:130`        |
| `padding` horizontal do rótulo | `12px` de cada lado                                  | `Chip` `label`         | —             | default MUI 7.0.1 — `@mui/material/Chip/Chip.js:320-321` |
| avatar interno                 | `24px × 24px`, `font-size 10,5px`, `margin-left 5px` | `Chip` `avatar`        | —             | default MUI 7.0.1; medido em runtime                     |
| ícone de remover               | `22px × 22px`, `margin-right 5px`                    | `Chip` `deleteIcon`    | —             | medido em runtime                                        |
| opacidade do ícone de remover  | `0.48` (hover: `1`)                                  | `MuiChip.deleteIcon`   | —             | `frontend/src/theme/core/components/chip.tsx:133-135`    |

### 8.3 Etiqueta (`Label`) — componente próprio do projeto

| Token                                | Valor bruto                                                               | Referência MUI            | Onde é usado           | Origem (arquivo:linha)                             |
| ------------------------------------ | ------------------------------------------------------------------------- | ------------------------- | ---------------------- | -------------------------------------------------- |
| altura                               | `24px`                                                                    | — (componente próprio)    | Etiqueta de status     | `frontend/src/components/label/styles.tsx:90`      |
| `min-width`                          | `24px`                                                                    | —                         | —                      | `frontend/src/components/label/styles.tsx:91`      |
| `line-height`                        | `0`                                                                       | —                         | Centralização por flex | `frontend/src/components/label/styles.tsx:92`      |
| `gap`                                | `6px` (`spacing(0.75)`)                                                   | —                         | Espaço ícone→texto     | `frontend/src/components/label/styles.tsx:98`      |
| `padding`                            | `0 6px` (`spacing(0, 0.75)`)                                              | —                         | —                      | `frontend/src/components/label/styles.tsx:100`     |
| `font-size`                          | `0.75rem / 10,5px` (`pxToRem(12)`)                                        | —                         | —                      | `frontend/src/components/label/styles.tsx:101`     |
| `font-weight`                        | `700` (`fontWeightBold`)                                                  | —                         | —                      | `frontend/src/components/label/styles.tsx:102`     |
| `border-radius`                      | `6px` (`shape.borderRadius × 0.75`)                                       | —                         | —                      | `frontend/src/components/label/styles.tsx:103`     |
| `transition`                         | `all 200ms cubic-bezier(0.4, 0, 0.2, 1)`                                  | duração `shorter = 200ms` | —                      | `frontend/src/components/label/styles.tsx:104`     |
| opacidade quando desabilitada        | `0.48` + `pointer-events: none`                                           | —                         | —                      | `frontend/src/components/label/styles.tsx:107`     |
| ícone interno                        | `16px × 16px`                                                             | —                         | —                      | `frontend/src/components/label/styles.tsx:112-113` |
| borda da variante `outlined`         | `2px solid #1C252E` / `rgb(28 37 46)` (cor default/`inherit`)             | —                         | —                      | `frontend/src/components/label/styles.tsx:29-32`   |
| borda da variante `outlined` com cor | `2px solid <cor>.main` (ex.: `#00A76F` / `rgb(0 167 111)` para `primary`) | —                         | —                      | `frontend/src/components/label/styles.tsx:64-67`   |

### 8.4 Interruptor (`Switch`)

| Token                     | Valor bruto                                                | Referência MUI           | Onde é usado | Origem                                                     |
| ------------------------- | ---------------------------------------------------------- | ------------------------ | ------------ | ---------------------------------------------------------- |
| caixa `medium`            | `58px × 38px` (`34 + 12×2` × `14 + 12×2`), `padding: 12px` | `Switch` root            | —            | default MUI 7.0.1 — `@mui/material/Switch/Switch.js:60-63` |
| caixa `small`             | `40px × 24px`, `padding: 7px`                              | `Switch` `size: 'small'` | —            | default MUI 7.0.1 — `@mui/material/Switch/Switch.js:93-95` |
| trilho `medium` (`track`) | altura `20px`                                              | `MuiSwitch.sizeMedium`   | —            | `frontend/src/theme/core/components/switch.tsx:50`         |
| trilho `small`            | altura `16px`                                              | `MuiSwitch.sizeSmall`    | —            | `frontend/src/theme/core/components/switch.tsx:54`         |
| botão `medium` (`thumb`)  | `14px × 14px`                                              | `MuiSwitch.sizeMedium`   | —            | `frontend/src/theme/core/components/switch.tsx:51`         |
| botão `small`             | `10px × 10px`                                              | `MuiSwitch.sizeSmall`    | —            | `frontend/src/theme/core/components/switch.tsx:55`         |
| `border-radius` do trilho | `10px`                                                     | `MuiSwitch.track`        | —            | `frontend/src/theme/core/components/switch.tsx:45`         |
| cor do trilho (desligado) | `rgba(145 158 171 / 0.48)`                                 | `MuiSwitch.track`        | —            | `frontend/src/theme/core/components/switch.tsx:46`         |
| deslocamento inicial      | `translateX(6px)`                                          | `MuiSwitch.switchBase`   | —            | `frontend/src/theme/core/components/switch.tsx:17`         |

### 8.5 Controle deslizante (`Slider`)

Tamanho default do projeto: **`small`** (`frontend/src/theme/core/components/slider.tsx:30`).

| Token                              | Valor bruto                                                 | Referência MUI              | Onde é usado | Origem (arquivo:linha)                                     |
| ---------------------------------- | ----------------------------------------------------------- | --------------------------- | ------------ | ---------------------------------------------------------- |
| trilho (`rail` e `track`) `medium` | `10px` de altura                                            | `MuiSlider.rail` / `.track` | —            | `frontend/src/theme/core/components/slider.tsx:21,84,87`   |
| trilho `small`                     | `6px` de altura                                             | `MuiSlider.sizeSmall`       | —            | `frontend/src/theme/core/components/slider.tsx:21,113-114` |
| botão (`thumb`) `medium`           | `20px × 20px`                                               | `MuiSlider.root`            | —            | `frontend/src/theme/core/components/slider.tsx:22,65-66`   |
| botão `small`                      | `16px × 16px`                                               | `MuiSlider.sizeSmall`       | —            | `frontend/src/theme/core/components/slider.tsx:22,112`     |
| borda do botão                     | `1px solid rgba(145 158 171 / 0.08)`                        | `MuiSlider.root`            | —            | `frontend/src/theme/core/components/slider.tsx:63-64,69`   |
| sombra do botão                    | `0 1px 2px 0 rgba(145 158 171 / 0.16)` (`customShadows.z1`) | —                           | —            | `frontend/src/theme/core/components/slider.tsx:67`         |
| marca (`mark`) `medium`            | `1px × 6px`                                                 | `MuiSlider.mark`            | —            | `frontend/src/theme/core/components/slider.tsx:23,89-90`   |
| marca `small`                      | `1px × 4px`                                                 | `MuiSlider.sizeSmall`       | —            | `frontend/src/theme/core/components/slider.tsx:23,115`     |
| `font-size` do rótulo de marca     | `0.8125rem / 11,375px` (`pxToRem(13)`)                      | `MuiSlider.markLabel`       | —            | `frontend/src/theme/core/components/slider.tsx:101`        |
| `border-radius` do balão de valor  | `8px`                                                       | `MuiSlider.valueLabel`      | —            | `frontend/src/theme/core/components/slider.tsx:105`        |
| opacidade do trilho de fundo       | `0.12`                                                      | `MuiSlider.rail`            | —            | `frontend/src/theme/core/components/slider.tsx:83`         |

### 8.6 Selo (`Badge`) — variantes de ponto

| Token                                      | Valor bruto                                                            | Referência MUI                 | Onde é usado          | Origem (arquivo:linha)                               |
| ------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------ | --------------------- | ---------------------------------------------------- |
| ponto (`online`/`always`/`busy`/`offline`) | `10px × 10px`                                                          | variantes criadas pelo projeto | Indicador de presença | `frontend/src/theme/core/components/badge.tsx:21,23` |
| `border-radius` da variante `dot`          | `50%`                                                                  | `MuiBadge.dot`                 | —                     | `frontend/src/theme/core/components/badge.tsx:42`    |
| posição do ponto                           | `right: 14%`, `bottom: 14%`, `transform: scale(1) translate(50%, 50%)` | —                              | —                     | `frontend/src/theme/core/components/badge.tsx:26-29` |
| z-index do ponto                           | `9`                                                                    | —                              | —                     | `frontend/src/theme/core/components/badge.tsx:22`    |
| glifo interno `always`                     | `2px × 4px` (dois traços)                                              | —                              | Ícone de relógio      | `frontend/src/theme/core/components/badge.tsx:57-58` |
| glifo interno `busy`                       | `6px × 2px`                                                            | —                              | Traço de "ocupado"    | `frontend/src/theme/core/components/badge.tsx:65`    |
| glifo interno `offline`                    | `6px × 6px`, `border-radius: 50%`                                      | —                              | Anel de "offline"     | `frontend/src/theme/core/components/badge.tsx:73`    |

### 8.7 Caixa de seleção e opção única

| Token                               | Valor bruto               | Referência MUI                       | Onde é usado  | Origem (arquivo:linha)                                                                                   |
| ----------------------------------- | ------------------------- | ------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------- |
| tamanho default do `Checkbox`       | `small`                   | `MuiCheckbox.defaultProps`           | —             | `frontend/src/theme/core/components/checkbox.tsx:37`                                                     |
| tamanho default do `Radio`          | `small`                   | `MuiRadio.defaultProps`              | —             | `frontend/src/theme/core/components/radio.tsx:38`                                                        |
| `padding` de ambos                  | `8px` (`spacing(1)`)      | `MuiCheckbox.root` / `MuiRadio.root` | Área de toque | `frontend/src/theme/core/components/checkbox.tsx:48` · `frontend/src/theme/core/components/radio.tsx:45` |
| ícone com `size="small"`            | `1.25rem / 17,5px`        | `SvgIcon` `fontSizeSmall`            | —             | default MUI 7.0.1 (o `size` do controle vira `fontSize` do ícone)                                        |
| caixa de toque resultante (`small`) | `33,5px` (`8 + 17,5 + 8`) | —                                    | —             | derivado — **não medido**                                                                                |

### 8.8 Abas

| Token                             | Valor bruto                         | Referência MUI | Onde é usado | Origem (arquivo:linha)                               |
| --------------------------------- | ----------------------------------- | -------------- | ------------ | ---------------------------------------------------- |
| `min-height` da aba               | `48px`                              | `MuiTab.root`  | —            | `frontend/src/theme/core/components/tabs.tsx:42`     |
| `min-width` da aba                | `48px`                              | `MuiTab.root`  | —            | `frontend/src/theme/core/components/tabs.tsx:41`     |
| `padding` da aba                  | `8px 0` (`spacing(1, 0)`)           | `MuiTab.root`  | —            | `frontend/src/theme/core/components/tabs.tsx:43`     |
| espaço entre abas                 | `24px`; a partir de `600px`: `40px` | `MuiTabs.list` | —            | `frontend/src/theme/core/components/tabs.tsx:19-20`  |
| `min-height` do contêiner de abas | `48px`                              | `Tabs` root    | —            | default MUI 7.0.1 — `@mui/material/Tabs/Tabs.js:111` |

### 8.9 Barra de progresso e tela de carregamento

| Token                                  | Valor bruto                                                                                                               | Referência MUI           | Onde é usado                 | Origem                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------- | ------------------------------------------------------------------------ |
| altura da barra linear                 | `4px`                                                                                                                     | `LinearProgress` root    | —                            | default MUI 7.0.1 — `@mui/material/LinearProgress/LinearProgress.js:120` |
| `border-radius` da barra linear        | `4px`                                                                                                                     | `MuiLinearProgress.root` | —                            | `frontend/src/theme/core/components/progress.tsx:43`                     |
| `LoadingScreen` — largura da barra     | `100%` limitada a `max-width: 360px`                                                                                      | —                        | Tela de carregamento de rota | `frontend/src/components/loading-screen/loading-screen.tsx:22`           |
| `LoadingScreen` — padding lateral      | `40px` de cada lado (`spacing(5)`)                                                                                        | —                        | Contêiner                    | `frontend/src/components/loading-screen/loading-screen.tsx:37-38`        |
| `LoadingScreen` — `min-height`         | `100%`                                                                                                                    | —                        | Contêiner                    | `frontend/src/components/loading-screen/loading-screen.tsx:34`           |
| barra de progresso de rota (nprogress) | `height: 2.5px`, `z-index: 9999`, `position: fixed`; "peg" `width: 100px`, `transform: rotate(3deg) translate(0px, -4px)` | —                        | Topo da janela               | `frontend/src/components/progress-bar/styles.css`                        |

### 8.10 Logotipo

| Token                               | Valor bruto                            | Referência MUI | Onde é usado    | Origem (arquivo:linha)                        |
| ----------------------------------- | -------------------------------------- | -------------- | --------------- | --------------------------------------------- |
| logo compacto (default, `isSingle`) | `40px × 40px`                          | —              | Sidebar, header | `frontend/src/components/logo/logo.tsx:44-45` |
| logo completo (`isSingle = false`)  | `102px × 36px`                         | —              | —               | `frontend/src/components/logo/logo.tsx:46`    |
| arquivo de imagem                   | `/assets/fiscaliza/icon_fiscaliza.png` | —              | —               | `frontend/src/components/logo/logo.tsx:32`    |

---

## 9. Camadas flutuantes: tooltip, menu, dropdown

| Token                                  | Valor bruto                                                                                                    | Referência MUI                            | Onde é usado                    | Origem                                                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `max-width` do tooltip                 | `300px`                                                                                                        | `Tooltip` `tooltip`                       | —                               | default MUI 7.0.1 — `@mui/material/Tooltip/Tooltip.js:174`                                                          |
| `padding` do tooltip                   | `4px 8px`                                                                                                      | `Tooltip` `tooltip`                       | —                               | default MUI 7.0.1 — `@mui/material/Tooltip/Tooltip.js:172`                                                          |
| `font-size` do tooltip                 | `0.6875rem / 9,625px` (`pxToRem(11)`)                                                                          | `Tooltip` `tooltip`                       | —                               | default MUI 7.0.1 — `@mui/material/Tooltip/Tooltip.js:173`                                                          |
| `border-radius` do tooltip             | `8px` (`shape.borderRadius`)                                                                                   | `Tooltip` `tooltip`                       | —                               | default MUI 7.0.1 + `frontend/src/theme/create-theme.ts:35`                                                         |
| distância tooltip→âncora               | `12px` (em qualquer direção)                                                                                   | `MuiTooltip.popper`                       | —                               | `frontend/src/theme/core/components/tooltip.tsx:26,29,32,35`                                                        |
| `padding` do papel de dropdown         | `4px` (`spacing(0.5)`)                                                                                         | mixin `paperStyles({ dropdown: true })`   | Popover, Autocomplete, DataGrid | `frontend/src/theme/core/mixins/global-styles-components.ts:92`                                                     |
| `border-radius` do papel de dropdown   | `10px` (`shape.borderRadius × 1.25`)                                                                           | mixin `paperStyles`                       | —                               | `frontend/src/theme/core/mixins/global-styles-components.ts:94`                                                     |
| `backdrop-filter` do papel de dropdown | `blur(20px)`                                                                                                   | mixin `paperStyles` (default `blur = 20`) | —                               | `frontend/src/theme/core/mixins/global-styles-components.ts:80,88`                                                  |
| sombra do papel de dropdown            | `0 0 2px 0 rgba(145 158 171 / 0.24), -20px 20px 40px -4px rgba(145 158 171 / 0.24)` (`customShadows.dropdown`) | —                                         | —                               | `frontend/src/theme/core/mixins/global-styles-components.ts:93` + `frontend/src/theme/core/custom-shadows.ts:36-58` |
| `padding` do item de menu              | `6px 8px` (`spacing(0.75, 1)`)                                                                                 | mixin `menuItemStyles`                    | Menu, Autocomplete              | `frontend/src/theme/core/mixins/global-styles-components.ts:24`                                                     |
| `border-radius` do item de menu        | `6px` (`shape.borderRadius × 0.75`)                                                                            | mixin `menuItemStyles`                    | —                               | `frontend/src/theme/core/mixins/global-styles-components.ts:25`                                                     |
| espaço entre itens de menu             | `4px` (`margin-bottom`, exceto o último)                                                                       | mixin `menuItemStyles`                    | —                               | `frontend/src/theme/core/mixins/global-styles-components.ts:26-28`                                                  |
| checkbox dentro do item de menu        | `padding: 4px`, `margin-left: -4px`, `margin-right: 4px`                                                       | mixin `menuItemStyles`                    | —                               | `frontend/src/theme/core/mixins/global-styles-components.ts:34-38`                                                  |
| separador dentro do menu               | `margin: 4px 0` (`spacing(0.5, 0)`)                                                                            | mixin `menuItemStyles`                    | —                               | `frontend/src/theme/core/mixins/global-styles-components.ts:43-45`                                                  |
| `min-width` do menu do DataGrid        | `140px`                                                                                                        | `MuiDataGrid.menu`                        | Menu de coluna                  | `frontend/src/theme/core/components/mui-x-data-grid.tsx:180`                                                        |
| ícone de lista dentro de menu          | `min-width: auto`, `margin-right: 16px` (`spacing(2)`)                                                         | `MuiListItemIcon.root`                    | —                               | `frontend/src/theme/core/components/list.tsx:10`                                                                    |
| `border-radius` do popper de datas     | `12px` (`shape.borderRadius × 1.5`)                                                                            | `MuiPickersPopper.paper`                  | Seletores de data/hora          | `frontend/src/theme/core/components/mui-x-date-picker.tsx:190`                                                      |

> **Não há `min-width` global para `Menu`/`Popover`.** O único `min-width` de dropdown declarado
> no design system é o `140px` do menu do DataGrid. Larguras de outros popovers são definidas
> caso a caso pelo consumidor (ver §2.1).

---

## 10. Modais, diálogos e gavetas

| Token                                  | Valor bruto                                                                                     | Referência MUI               | Onde é usado                         | Origem (arquivo:linha)                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `margin` do papel do diálogo           | `16px` (`spacing(2)`) — apenas quando **não** é `fullScreen`                                    | `MuiDialog.paper`            | Modal padrão                         | `frontend/src/theme/core/components/dialog.tsx:23`                                                            |
| `border-radius` do papel do diálogo    | `16px` (`shape.borderRadius × 2`)                                                               | `MuiDialog.paper`            | —                                    | `frontend/src/theme/core/components/dialog.tsx:22`                                                            |
| `border-radius` em `fullScreen`        | `0`                                                                                             | `MuiDialog.paperFullScreen`  | Modal em tela cheia                  | `frontend/src/theme/core/components/dialog.tsx:25`                                                            |
| sombra do diálogo                      | `-40px 40px 80px -8px rgba(0 0 0 / 0.24)` (`customShadows.dialog`)                              | —                            | —                                    | `frontend/src/theme/core/components/dialog.tsx:21` + `frontend/src/theme/core/custom-shadows.ts:36-58`        |
| `padding` do título                    | `24px` (`spacing(3)`)                                                                           | `MuiDialogTitle.root`        | —                                    | `frontend/src/theme/core/components/dialog.tsx:33`                                                            |
| `padding` do conteúdo                  | `0 24px` (`spacing(0, 3)`)                                                                      | `MuiDialogContent.root`      | —                                    | `frontend/src/theme/core/components/dialog.tsx:41`                                                            |
| separadores do conteúdo                | `border-top: 0`, `border-bottom-style: dashed`, `padding-bottom: 24px`                          | `MuiDialogContent.dividers`  | —                                    | `frontend/src/theme/core/components/dialog.tsx:42-46`                                                         |
| `margin` default do papel (biblioteca) | `32px`                                                                                          | `Dialog` `paper`             | Sobrescrito pelo projeto para `16px` | default MUI 7.0.1 — `@mui/material/Dialog/Dialog.js:115`                                                      |
| `max-width` default do diálogo         | `sm` → `600px`; com viewport estreita cai para `calc(100% - 64px)`                              | `Dialog` `maxWidth`          | —                                    | default MUI 7.0.1 — `@mui/material/Dialog/Dialog.js:159-167,221`                                              |
| gaveta lateral direita (temporária)    | sombra `-40px 40px 80px -8px rgba(145 158 171 / 0.24)` + fundo `paperStyles`                    | `MuiDrawer.paperAnchorRight` | Drawers de conta/notificações        | `frontend/src/theme/core/components/drawer.tsx:12-20`                                                         |
| gaveta lateral esquerda (temporária)   | sombra `40px 40px 80px -8px rgba(145 158 171 / 0.24)` + fundo `paperStyles`                     | `MuiDrawer.paperAnchorLeft`  | Nav mobile                           | `frontend/src/theme/core/components/drawer.tsx:21-29`                                                         |
| largura da gaveta                      | **não há default no design system** — cada uso define a sua (nav mobile `288px`, conta `320px`) | `Drawer` `slotProps.paper`   | —                                    | `frontend/src/layouts/dashboard/nav-mobile.tsx:58` · `frontend/src/layouts/components/account-drawer.tsx:144` |

### 10.1 Cartões e superfícies

| Token                                  | Valor bruto                                                                                           | Referência MUI             | Onde é usado                | Origem (arquivo:linha)                               |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------- | ---------------------------------------------------- |
| `border-radius` do cartão              | `16px` (`shape.borderRadius × 2`)                                                                     | `MuiCard.root`             | Cartão                      | `frontend/src/theme/core/components/card.tsx:13`     |
| sombra do cartão                       | `0 0 2px 0 rgba(145 158 171 / 0.2), 0 12px 24px -4px rgba(145 158 171 / 0.12)` (`customShadows.card`) | —                          | —                           | `frontend/src/theme/core/components/card.tsx:12`     |
| `padding` do cabeçalho do cartão       | `24px 24px 0` (`spacing(3, 3, 0)`)                                                                    | `MuiCardHeader.root`       | —                           | `frontend/src/theme/core/components/card.tsx:33`     |
| `padding` do conteúdo do cartão        | `24px` (`spacing(3)`)                                                                                 | `MuiCardContent.root`      | —                           | `frontend/src/theme/core/components/card.tsx:42`     |
| elevação default do papel              | `0`                                                                                                   | `MuiPaper.defaultProps`    | Toda superfície             | `frontend/src/theme/core/components/paper.tsx:11`    |
| borda do papel `outlined`              | `rgba(145 158 171 / 0.16)`                                                                            | `MuiPaper.outlined`        | —                           | `frontend/src/theme/core/components/paper.tsx:19-20` |
| `border-radius` do esqueleto `rounded` | `16px` (`shape.borderRadius × 2`)                                                                     | `MuiSkeleton.rounded`      | Placeholder de carregamento | `frontend/src/theme/core/components/skeleton.tsx:20` |
| variante default do esqueleto          | `rounded`, animação `wave`                                                                            | `MuiSkeleton.defaultProps` | —                           | `frontend/src/theme/core/components/skeleton.tsx:11` |

---

## 11. Como reproduzir a altura de um input/botão

Esta seção existe para que qualquer implementação (com ou sem MUI) chegue **no mesmo pixel**.

### 11.1 Botão

**Regra:** `small` e `large` têm altura travada; `medium` é calculado.

```
altura_medium = padding-top + line-height + padding-bottom            (variantes contained/text/soft)
altura_medium = padding-top + line-height + padding-bottom + 2 × 1px  (variante outlined, por causa da borda)

line-height = fator_line_height × font-size
fator_line_height = 24 / 14 = 1.7142857142857142      (typography.button)
font-size medium  = 0.875rem × 14 = 12,25px
```

| Variante                               | Aritmética                                            | Altura   |
| -------------------------------------- | ----------------------------------------------------- | -------- |
| `contained` / `soft` / `text` (medium) | `6 + (1.7142857142857142 × 12,25) + 6` = `6 + 21 + 6` | **33px** |
| `outlined` (medium)                    | `5 + 21 + 5 + 1 + 1`                                  | **33px** |
| `small` (qualquer variante)            | ignorado — `height: 30` é declarado                   | **30px** |
| `large` (qualquer variante)            | ignorado — `height: 48` é declarado                   | **48px** |

Conferência: sem a trava de altura, `small` daria `4 + (1.7142857142857142 × 11,375) + 4 = 4 + 19,5 + 4 = 27,5px`
e `large` daria `8 + (1.7142857142857142 × 13,125) + 8 = 8 + 22,5 + 8 = 38,5px`.
Os valores declarados (`30px` e `48px`) **substituem** esses resultados. Só o `medium` é emergente.

### 11.2 Input

**Regra:** a altura vem de `height: 1.4375em` no elemento `<input>` (que é `content-box`)
somada aos paddings verticais da variante.

```
altura_conteudo = 1.4375 × font-size_do_input
font-size_do_input = 0.9375rem × 14 = 13,125px        (pxToRem(15), override do projeto)
altura_conteudo = 1.4375 × 13,125 = 18,8671875px      → 18,87px

altura_input = padding-top + 18,8671875 + padding-bottom
```

| Variante   | Tamanho                 | Aritmética                 | Altura calculada | Altura medida |
| ---------- | ----------------------- | -------------------------- | ---------------- | ------------- |
| `outlined` | `medium`                | `16,5 + 18,8671875 + 16,5` | `51,8671875px`   | **51,86px** ✔ |
| `outlined` | `small`                 | `8,5 + 18,8671875 + 8,5`   | `35,8671875px`   | **35,86px** ✔ |
| `filled`   | `medium`                | `25 + 18,8671875 + 8`      | `51,8671875px`   | **51,86px** ✔ |
| `filled`   | `small`                 | `21 + 18,8671875 + 4`      | `43,8671875px`   | ⚠️ ver §6.4   |
| `filled`   | `small` + `hiddenLabel` | `8 + 18,8671875 + 9`       | `35,8671875px`   | ⚠️ ver §6.4   |
| `standard` | `medium`                | `4 + 18,8671875 + 5`       | `27,8671875px`   | **27,86px** ✔ |
| `standard` | `small`                 | `1 + 18,8671875 + 5`       | `24,8671875px`   | **24,86px** ✔ |

> ⚠️ **Armadilha número 1**: se a base do `rem` mudar de `14px` para `16px`, a altura de conteúdo
> vira `1.4375 × 15 = 21,5625px` e **todo input cresce ~2,7px**, enquanto botões `small`/`large`,
> chips, avatares e o header ficam parados (estão em px puro). Isso quebra o alinhamento vertical
> de formulários inteiros.
>
> ⚠️ **Armadilha número 2**: abaixo de `600px` o `font-size` do `<input>` sobe para `1rem` (`14px`)
> (`frontend/src/theme/core/components/textfield.tsx:22-25`), então a altura de conteúdo vira
> `1.4375 × 14 = 20,125px` e o `outlined medium` passa a **53,125px** nessa faixa.
> Este valor é **calculado, não medido** — a medição de runtime disponível foi feita a 1911px.

### 11.3 Regra prática de alinhamento

Para alinhar um botão a um input na mesma linha:

- input `outlined medium` (**51,86px**) **não** casa com botão `medium` (**33px**) nem com
  botão `large` (**48px**) — a diferença é de `3,86px`;
- input `outlined small` (**35,86px**) **não** casa com botão `small` (**30px**) — diferença de `5,86px`.

Esses desencontros são característica do sistema atual, não erro de medição.
Qualquer alinhamento perfeito hoje exige altura explícita no consumidor.

# 01 — Cores

Todas as cores em **HEX + RGB(A)**, com opacidade explícita quando houver.

> **Sintaxe usada pelo projeto:** `rgba(R G B / A)` — separadores por espaço (CSS Color 4).
> Ex.: `rgba(145 158 171 / 0.08)`. O equivalente tradicional é `rgba(145, 158, 171, 0.08)`.
> Ambas as formas estão documentadas nas tabelas.

> **Canal (`channel`)**: o projeto guarda cada cor também como trio RGB sem função
> (ex.: `0 167 111`) para compor transparências via `varAlpha(canal, alfa)`.
> Isso é gerado por `createPaletteChannel()` (`minimal-shared` 1.0.7),
> aplicado em `frontend/src/theme/core/palette.ts:67-88`.

---

## 1. Cores semânticas

Cada família tem **6 tons**: `lighter`, `light`, `main`, `dark`, `darker`, `contrastText`.
Os tons `lighter` e `darker` são **extensões do projeto** (não existem na biblioteca base).

**As cores semânticas são idênticas nos temas claro e escuro** — só mudam texto, fundo e o que
deriva de opacidade. Origem: `frontend/src/theme/core/palette.ts:122-131` (`basePalette` compartilhada).

### 1.1 Primary (verde)

| Token                        | Valor bruto                                            | Referência MUI                 | Onde é usado                                                                             | Origem (arquivo:linha)                  |
| ---------------------------- | ------------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------- |
| `color.primary.lighter`      | `#C8FAD6` / `rgb(200, 250, 214)` — canal `200 250 214` | `palette.primary.lighter`      | fundo de avatar em chip primary; Label `inverted`                                        | `frontend/src/theme/theme-config.ts:49` |
| `color.primary.light`        | `#5BE49B` / `rgb(91, 228, 155)` — canal `91 228 155`   | `palette.primary.light`        | texto de botão/chip `soft` no tema escuro; item de nav ativo no nav escuro               | `frontend/src/theme/theme-config.ts:50` |
| `color.primary.main`         | `#00A76F` / `rgb(0, 167, 111)` — canal `0 167 111`     | `palette.primary.main`         | botão primário, links ativos, item de nav ativo, barra de progresso de rota, indicadores | `frontend/src/theme/theme-config.ts:51` |
| `color.primary.dark`         | `#007867` / `rgb(0, 120, 103)` — canal `0 120 103`     | `palette.primary.dark`         | texto de botão/chip `soft`; base do realce de linha selecionada em tabela                | `frontend/src/theme/theme-config.ts:52` |
| `color.primary.darker`       | `#004B50` / `rgb(0, 75, 80)` — canal `0 75 80`         | `palette.primary.darker`       | fundos de destaque escuros, Label `inverted`                                             | `frontend/src/theme/theme-config.ts:53` |
| `color.primary.contrastText` | `#FFFFFF` / `rgb(255, 255, 255)`                       | `palette.primary.contrastText` | texto sobre `primary.main`                                                               | `frontend/src/theme/theme-config.ts:54` |

### 1.2 Secondary (roxo)

| Token                          | Valor bruto                                            | Referência MUI                   | Onde é usado                       | Origem (arquivo:linha)                  |
| ------------------------------ | ------------------------------------------------------ | -------------------------------- | ---------------------------------- | --------------------------------------- |
| `color.secondary.lighter`      | `#EFD6FF` / `rgb(239, 214, 255)` — canal `239 214 255` | `palette.secondary.lighter`      | fundos suaves secundários          | `frontend/src/theme/theme-config.ts:57` |
| `color.secondary.light`        | `#C684FF` / `rgb(198, 132, 255)` — canal `198 132 255` | `palette.secondary.light`        | texto `soft` no tema escuro        | `frontend/src/theme/theme-config.ts:58` |
| `color.secondary.main`         | `#8E33FF` / `rgb(142, 51, 255)` — canal `142 51 255`   | `palette.secondary.main`         | botões/chips secundários           | `frontend/src/theme/theme-config.ts:59` |
| `color.secondary.dark`         | `#5119B7` / `rgb(81, 25, 183)` — canal `81 25 183`     | `palette.secondary.dark`         | texto `soft` no tema claro         | `frontend/src/theme/theme-config.ts:60` |
| `color.secondary.darker`       | `#27097A` / `rgb(39, 9, 122)` — canal `39 9 122`       | `palette.secondary.darker`       | Label `inverted`, Alert `standard` | `frontend/src/theme/theme-config.ts:61` |
| `color.secondary.contrastText` | `#FFFFFF` / `rgb(255, 255, 255)`                       | `palette.secondary.contrastText` | texto sobre `secondary.main`       | `frontend/src/theme/theme-config.ts:62` |

### 1.3 Info (ciano)

| Token                     | Valor bruto                                            | Referência MUI              | Onde é usado                                            | Origem (arquivo:linha)                  |
| ------------------------- | ------------------------------------------------------ | --------------------------- | ------------------------------------------------------- | --------------------------------------- |
| `color.info.lighter`      | `#CAFDF5` / `rgb(202, 253, 245)` — canal `202 253 245` | `palette.info.lighter`      | fundo de Alert `standard` severity info (claro)         | `frontend/src/theme/theme-config.ts:65` |
| `color.info.light`        | `#61F3F3` / `rgb(97, 243, 243)` — canal `97 243 243`   | `palette.info.light`        | ícone de Alert info no tema escuro                      | `frontend/src/theme/theme-config.ts:66` |
| `color.info.main`         | `#00B8D9` / `rgb(0, 184, 217)` — canal `0 184 217`     | `palette.info.main`         | Alert/Chip/Botão info; gradiente ciano do `paperStyles` | `frontend/src/theme/theme-config.ts:67` |
| `color.info.dark`         | `#006C9C` / `rgb(0, 108, 156)` — canal `0 108 156`     | `palette.info.dark`         | texto `soft`/`outlined` info (claro)                    | `frontend/src/theme/theme-config.ts:68` |
| `color.info.darker`       | `#003768` / `rgb(0, 55, 104)` — canal `0 55 104`       | `palette.info.darker`       | texto de Alert `standard` info (claro)                  | `frontend/src/theme/theme-config.ts:69` |
| `color.info.contrastText` | `#FFFFFF` / `rgb(255, 255, 255)`                       | `palette.info.contrastText` | texto sobre `info.main`                                 | `frontend/src/theme/theme-config.ts:70` |

### 1.4 Success (verde-folha)

| Token                        | Valor bruto                                                  | Referência MUI                 | Onde é usado                              | Origem (arquivo:linha)                  |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------ | ----------------------------------------- | --------------------------------------- |
| `color.success.lighter`      | `#D3FCD2` / `rgb(211, 252, 210)` — canal `211 252 210`       | `palette.success.lighter`      | fundo de Alert `standard` success (claro) | `frontend/src/theme/theme-config.ts:73` |
| `color.success.light`        | `#77ED8B` / `rgb(119, 237, 139)` — canal `119 237 139`       | `palette.success.light`        | ícone/texto success no tema escuro        | `frontend/src/theme/theme-config.ts:74` |
| `color.success.main`         | `#22C55E` / `rgb(34, 197, 94)` — canal `34 197 94`           | `palette.success.main`         | badge `online`, estados de sucesso        | `frontend/src/theme/theme-config.ts:75` |
| `color.success.dark`         | `#118D57` / `rgb(17, 141, 87)` — canal `17 141 87`           | `palette.success.dark`         | texto `soft` success (claro)              | `frontend/src/theme/theme-config.ts:76` |
| `color.success.darker`       | `#065E49` / `rgb(6, 94, 73)` — canal `6 94 73`               | `palette.success.darker`       | texto de Alert `standard` success (claro) | `frontend/src/theme/theme-config.ts:77` |
| `color.success.contrastText` | `#ffffff` (grafia minúscula no fonte) / `rgb(255, 255, 255)` | `palette.success.contrastText` | texto sobre `success.main`                | `frontend/src/theme/theme-config.ts:78` |

### 1.5 Warning (âmbar)

| Token                        | Valor bruto                                            | Referência MUI                 | Onde é usado                                        | Origem (arquivo:linha)                  |
| ---------------------------- | ------------------------------------------------------ | ------------------------------ | --------------------------------------------------- | --------------------------------------- |
| `color.warning.lighter`      | `#FFF5CC` / `rgb(255, 245, 204)` — canal `255 245 204` | `palette.warning.lighter`      | fundo de Alert `standard` warning (claro)           | `frontend/src/theme/theme-config.ts:81` |
| `color.warning.light`        | `#FFD666` / `rgb(255, 214, 102)` — canal `255 214 102` | `palette.warning.light`        | texto/ícone warning no tema escuro                  | `frontend/src/theme/theme-config.ts:82` |
| `color.warning.main`         | `#FFAB00` / `rgb(255, 171, 0)` — canal `255 171 0`     | `palette.warning.main`         | badge `always`, alertas de atenção                  | `frontend/src/theme/theme-config.ts:83` |
| `color.warning.dark`         | `#B76E00` / `rgb(183, 110, 0)` — canal `183 110 0`     | `palette.warning.dark`         | texto `soft` warning (claro)                        | `frontend/src/theme/theme-config.ts:84` |
| `color.warning.darker`       | `#7A4100` / `rgb(122, 65, 0)` — canal `122 65 0`       | `palette.warning.darker`       | texto de Alert `standard` warning (claro)           | `frontend/src/theme/theme-config.ts:85` |
| `color.warning.contrastText` | **`#1C252E`** / `rgb(28, 37, 46)` — canal `28 37 46`   | `palette.warning.contrastText` | texto sobre `warning.main` — **escuro**, não branco | `frontend/src/theme/theme-config.ts:86` |

### 1.6 Error (vermelho-coral)

| Token                      | Valor bruto                                            | Referência MUI               | Onde é usado                                                              | Origem (arquivo:linha)                  |
| -------------------------- | ------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------- | --------------------------------------- |
| `color.error.lighter`      | `#FFE9D5` / `rgb(255, 233, 213)` — canal `255 233 213` | `palette.error.lighter`      | fundo de Alert `standard` error (claro)                                   | `frontend/src/theme/theme-config.ts:89` |
| `color.error.light`        | `#FFAC82` / `rgb(255, 172, 130)` — canal `255 172 130` | `palette.error.light`        | texto error no tema escuro                                                | `frontend/src/theme/theme-config.ts:90` |
| `color.error.main`         | `#FF5630` / `rgb(255, 86, 48)` — canal `255 86 48`     | `palette.error.main`         | borda de campo em erro, badge `busy`, gradiente vermelho do `paperStyles` | `frontend/src/theme/theme-config.ts:91` |
| `color.error.dark`         | `#B71D18` / `rgb(183, 29, 24)` — canal `183 29 24`     | `palette.error.dark`         | texto `soft`/`outlined` error (claro)                                     | `frontend/src/theme/theme-config.ts:92` |
| `color.error.darker`       | `#7A0916` / `rgb(122, 9, 22)` — canal `122 9 22`       | `palette.error.darker`       | texto de Alert `standard` error (claro)                                   | `frontend/src/theme/theme-config.ts:93` |
| `color.error.contrastText` | `#FFFFFF` / `rgb(255, 255, 255)`                       | `palette.error.contrastText` | texto sobre `error.main`                                                  | `frontend/src/theme/theme-config.ts:94` |

---

## 2. Neutros (escala de cinza)

Escala de **10 degraus**, do 50 ao 900. É a espinha dorsal da interface:
texto, fundo, sombras, divisores e todos os overlays de estado derivam dela.

| Token                | Valor bruto                      | Canal         | Referência MUI      | Onde é usado                                                                                          | Origem (arquivo:linha)                   |
| -------------------- | -------------------------------- | ------------- | ------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `color.grey.50`      | `#FCFDFD` / `rgb(252, 253, 253)` | `252 253 253` | `palette.grey[50]`  | — (declarado, sem uso direto no tema)                                                                 | `frontend/src/theme/theme-config.ts:97`  |
| `color.grey.100`     | `#F9FAFB` / `rgb(249, 250, 251)` | `249 250 251` | `palette.grey[100]` | hover de chip/paginação no tema escuro; `AppBar.defaultBg` (não usado, AppBar é transparente)         | `frontend/src/theme/theme-config.ts:98`  |
| `color.grey.200`     | `#F4F6F8` / `rgb(244, 246, 248)` | `244 246 248` | `palette.grey[200]` | `background.neutral` no tema claro → cabeçalho de tabela, fundo do DataGrid                           | `frontend/src/theme/theme-config.ts:99`  |
| `color.grey.300`     | `#DFE3E8` / `rgb(223, 227, 232)` | `223 227 232` | `palette.grey[300]` | fundo de FAB `default`/`soft default`                                                                 | `frontend/src/theme/theme-config.ts:100` |
| `color.grey.400`     | `#C4CDD5` / `rgb(196, 205, 213)` | `196 205 213` | `palette.grey[400]` | hover de FAB default; base do Skeleton; `Avatar.defaultBg`                                            | `frontend/src/theme/theme-config.ts:101` |
| **`color.grey.500`** | `#919EAB` / `rgb(145, 158, 171)` | `145 158 171` | `palette.grey[500]` | **base de todos os overlays de estado, do divisor e da escala de sombras**                            | `frontend/src/theme/theme-config.ts:102` |
| `color.grey.600`     | `#637381` / `rgb(99, 115, 129)`  | `99 115 129`  | `palette.grey[600]` | `text.secondary` (claro), `action.active` (claro), `text.disabled` (escuro)                           | `frontend/src/theme/theme-config.ts:103` |
| `color.grey.700`     | `#454F5B` / `rgb(69, 79, 91)`    | `69 79 91`    | `palette.grey[700]` | hover de botão `contained inherit`; fundo de tooltip no tema escuro                                   | `frontend/src/theme/theme-config.ts:104` |
| `color.grey.800`     | `#1C252E` / `rgb(28, 37, 46)`    | `28 37 46`    | `palette.grey[800]` | `text.primary` (claro), `background.paper` (escuro), fundo de tooltip (claro), `warning.contrastText` | `frontend/src/theme/theme-config.ts:105` |
| `color.grey.900`     | `#141A21` / `rgb(20, 26, 33)`    | `20 26 33`    | `palette.grey[900]` | `background.default` (escuro), fundo do nav no modo `apparent`                                        | `frontend/src/theme/theme-config.ts:106` |

### 2.1 Cinzas "A" herdados

Não são declarados pelo projeto, mas **existem no tema final** (default MUI 7.0.1) e são
referenciados por slots gerados da biblioteca:

| Token             | Valor bruto                      | Onde aparece                     | Origem            |
| ----------------- | -------------------------------- | -------------------------------- | ----------------- |
| `color.grey.A100` | `#f5f5f5` / `rgb(245, 245, 245)` | `Button.inheritContainedHoverBg` | default MUI 7.0.1 |
| `color.grey.A200` | `#eeeeee` / `rgb(238, 238, 238)` | —                                | default MUI 7.0.1 |
| `color.grey.A400` | `#bdbdbd` / `rgb(189, 189, 189)` | —                                | default MUI 7.0.1 |
| `color.grey.A700` | `#616161` / `rgb(97, 97, 97)`    | —                                | default MUI 7.0.1 |

### 2.2 Comuns

| Token                       | Valor bruto                      | Canal         | Referência MUI                | Origem (arquivo:linha)                   |
| --------------------------- | -------------------------------- | ------------- | ----------------------------- | ---------------------------------------- |
| `color.common.black`        | `#000000` / `rgb(0, 0, 0)`       | `0 0 0`       | `palette.common.black`        | `frontend/src/theme/theme-config.ts:108` |
| `color.common.white`        | `#FFFFFF` / `rgb(255, 255, 255)` | `255 255 255` | `palette.common.white`        | `frontend/src/theme/theme-config.ts:108` |
| `color.common.background`   | `#fff`                           | `255 255 255` | `palette.common.background`   | default MUI 7.0.1                        |
| `color.common.onBackground` | `#000`                           | `0 0 0`       | `palette.common.onBackground` | default MUI 7.0.1                        |

---

## 3. Texto, fundo, divisor — claro × escuro

### 3.1 Texto

| Token                  | **Claro**                        | **Escuro**                       | Referência MUI           | Onde é usado                                                                       | Origem (arquivo:linha)                     |
| ---------------------- | -------------------------------- | -------------------------------- | ------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------ |
| `color.text.primary`   | `#1C252E` / `rgb(28, 37, 46)`    | `#FFFFFF` / `rgb(255, 255, 255)` | `palette.text.primary`   | corpo de texto, títulos, chip `filled default`, fundo de botão `contained inherit` | `frontend/src/theme/core/palette.ts:92-93` |
| `color.text.secondary` | `#637381` / `rgb(99, 115, 129)`  | `#919EAB` / `rgb(145, 158, 171)` | `palette.text.secondary` | texto de apoio, aba não selecionada, cabeçalho de tabela, item de nav              | `frontend/src/theme/core/palette.ts:92-93` |
| `color.text.disabled`  | `#919EAB` / `rgb(145, 158, 171)` | `#637381` / `rgb(99, 115, 129)`  | `palette.text.disabled`  | placeholder, label em repouso, legenda do slider, badge `offline`, scrollbar       | `frontend/src/theme/core/palette.ts:92-93` |

Canais: claro → `primary 28 37 46`, `secondary 99 115 129`, `disabled 145 158 171`.

### 3.2 Fundo

| Token                      | **Claro**                        | **Escuro**                        | Referência MUI                                         | Onde é usado                                                    | Origem (arquivo:linha)                     |
| -------------------------- | -------------------------------- | --------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------ |
| `color.background.default` | `#FFFFFF` / `rgb(255, 255, 255)` | `#141A21` / `rgb(20, 26, 33)`     | `palette.background.default`                           | fundo da página, `--layout-nav-bg`, células fixadas do DataGrid | `frontend/src/theme/core/palette.ts:98-99` |
| `color.background.paper`   | `#FFFFFF` / `rgb(255, 255, 255)` | `#1C252E` / `rgb(28, 37, 46)`     | `palette.background.paper`                             | cards, diálogos, menus, accordion expandido                     | `frontend/src/theme/core/palette.ts:98-99` |
| `color.background.neutral` | `#F4F6F8` / `rgb(244, 246, 248)` | **`#28323D`** / `rgb(40, 50, 61)` | `palette.background.neutral` (**extensão do projeto**) | cabeçalho de tabela, container do DataGrid, blocos de destaque  | `frontend/src/theme/core/palette.ts:98-99` |

⚠️ `#28323D` é um literal que **não pertence à escala de cinzas** — ver `99-inconsistencias.md`.

**Não existe escala de elevação por cor de fundo.** A elevação é feita só com sombra:
`MuiPaper` tem `elevation: 0` por padrão e `background-image: none`
(`frontend/src/theme/core/components/paper.tsx:12,18`).

### 3.3 Divisor e bordas derivadas

| Token                             | Valor bruto (claro e escuro)                                             | Referência MUI              | Onde é usado                                                                                   | Origem (arquivo:linha)                                    |
| --------------------------------- | ------------------------------------------------------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `color.divider`                   | `rgba(145 158 171 / 0.2)` = `rgba(145, 158, 171, 0.2)` — `#919EAB @ 20%` | `palette.divider`           | `Divider`, borda de célula de tabela, conector de timeline/stepper, borda de linha do DataGrid | `frontend/src/theme/core/palette.ts:131`                  |
| borda de `Paper outlined`         | `rgba(145 158 171 / 0.16)` = `#919EAB @ 16%`                             | —                           | superfícies com contorno                                                                       | `frontend/src/theme/core/components/paper.tsx:19`         |
| contorno de campo (repouso)       | `rgba(145 158 171 / 0.2)` = `#919EAB @ 20%`                              | —                           | `notchedOutline` do campo de texto                                                             | `frontend/src/theme/core/components/textfield.tsx:70`     |
| borda de botão `outlined inherit` | `rgba(145 158 171 / 0.32)` = `#919EAB @ 32%`                             | —                           | botão/FAB com contorno neutro, chip `outlined default`                                         | `frontend/src/theme/core/components/button.tsx:125`       |
| borda de nav lateral              | `rgba(145 158 171 / 0.12)` = `#919EAB @ 12%`                             | `--layout-nav-border-color` | separador da sidebar (claro). No escuro: `@ 0.08`                                              | `frontend/src/layouts/dashboard/css-vars.ts:40,47`        |
| borda do grupo de toggle          | `rgba(145 158 171 / 0.08)` = `#919EAB @ 8%`                              | —                           | contêiner de `ToggleButtonGroup`                                                               | `frontend/src/theme/core/components/button-toggle.tsx:82` |
| borda de paginação `outlined`     | `rgba(145 158 171 / 0.24)` = `#919EAB @ 24%`                             | —                           | itens de paginação com contorno                                                                | `frontend/src/theme/core/components/pagination.tsx:103`   |

---

## 4. Estados interativos e overlays

Todos os estados neutros são **overlays de `#919EAB` (grey.500)** com opacidades fixas.
Isso vale para os dois temas — o valor **não muda** entre claro e escuro.

### 4.1 Tokens de ação

| Token                             | Valor bruto                                  | Equivalente tradicional                    | Referência MUI                      | Onde é usado                                                                         | Origem (arquivo:linha)                       |
| --------------------------------- | -------------------------------------------- | ------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| `color.action.hover`              | `rgba(145 158 171 / 0.08)` — `#919EAB @ 8%`  | `rgba(145, 158, 171, 0.08)`                | `palette.action.hover`              | hover de item de lista/menu/nav, botão `text`/`outlined` inherit, item de nav aberto | `frontend/src/theme/core/palette.ts:104`     |
| `color.action.selected`           | `rgba(145 158 171 / 0.16)` — `#919EAB @ 16%` | `rgba(145, 158, 171, 0.16)`                | `palette.action.selected`           | item de menu selecionado, opção selecionada no autocomplete, item de nav filho ativo | `frontend/src/theme/core/palette.ts:105`     |
| `color.action.focus`              | `rgba(145 158 171 / 0.24)` — `#919EAB @ 24%` | `rgba(145, 158, 171, 0.24)`                | `palette.action.focus`              | anel/realce de foco padrão da biblioteca                                             | `frontend/src/theme/core/palette.ts:106`     |
| `color.action.disabled`           | `rgba(145 158 171 / 0.8)` — `#919EAB @ 80%`  | `rgba(145, 158, 171, 0.8)`                 | `palette.action.disabled`           | **texto/ícone** de qualquer controle desabilitado                                    | `frontend/src/theme/core/palette.ts:107`     |
| `color.action.disabledBackground` | `rgba(145 158 171 / 0.24)` — `#919EAB @ 24%` | `rgba(145, 158, 171, 0.24)`                | `palette.action.disabledBackground` | **fundo/borda** de controle desabilitado                                             | `frontend/src/theme/core/palette.ts:108`     |
| `color.action.active`             | claro `#637381` / escuro `#919EAB`           | `rgb(99, 115, 129)` / `rgb(145, 158, 171)` | `palette.action.active`             | ícones em estado ativo/neutro                                                        | `frontend/src/theme/core/palette.ts:115-116` |
| `opacity.action.hover`            | `0.08`                                       | —                                          | `palette.action.hoverOpacity`       | multiplicador de hover colorido (ex.: ToggleButton)                                  | `frontend/src/theme/core/palette.ts:109`     |
| `opacity.action.disabled`         | `0.48`                                       | —                                          | `palette.action.disabledOpacity`    | opacidade de desabilitado (Slider, Rating, Label)                                    | `frontend/src/theme/core/palette.ts:110`     |
| `opacity.action.selected`         | `0.08`                                       | —                                          | `palette.action.selectedOpacity`    | overlay de linha selecionada no DataGrid                                             | default MUI 7.0.1                            |
| `opacity.action.focus`            | `0.12`                                       | —                                          | `palette.action.focusOpacity`       | —                                                                                    | default MUI 7.0.1                            |
| `opacity.action.activated`        | `0.12`                                       | —                                          | `palette.action.activatedOpacity`   | —                                                                                    | default MUI 7.0.1                            |

### 4.2 Matriz de estados por família de controle

Valores confirmados por medição em runtime (Chrome, viewport 1911×898, tema claro).

#### Botão sólido (`contained`)

| Estado                  | Fundo                         | Texto                     | Sombra                                     |
| ----------------------- | ----------------------------- | ------------------------- | ------------------------------------------ |
| default (cor semântica) | `<cor>.main`                  | `<cor>.contrastText`      | `none` (elevação desligada)                |
| default (`inherit`)     | `#1C252E` / `rgb(28, 37, 46)` | `#FFFFFF`                 | `none`                                     |
| hover (cor semântica)   | mantém `<cor>.main`           | mantém                    | `0 8px 16px 0 rgba(<canal da cor> / 0.24)` |
| hover (`inherit`)       | `#454F5B` / `rgb(69, 79, 91)` | `#FFFFFF`                 | `0 8px 16px 0 rgba(145 158 171 / 0.16)`    |
| **disabled**            | `rgba(145 158 171 / 0.24)`    | `rgba(145 158 171 / 0.8)` | `none`                                     |

Origem: `frontend/src/theme/core/components/button.tsx:83-109`; medição em runtime.

#### Botão com contorno (`outlined`)

| Estado                  | Fundo                                       | Texto                     | Borda                                | Sombra                      |
| ----------------------- | ------------------------------------------- | ------------------------- | ------------------------------------ | --------------------------- |
| default (cor semântica) | transparente                                | `<cor>.main`              | `1px solid rgba(<canal> / 0.48)`     | `none`                      |
| default (`inherit`)     | transparente                                | `#1C252E`                 | `1px solid rgba(145 158 171 / 0.32)` | `none`                      |
| hover                   | `rgba(145 158 171 / 0.08)` quando `inherit` | mantém                    | `currentColor`                       | `0 0 0 0.75px currentColor` |
| **disabled**            | transparente                                | `rgba(145 158 171 / 0.8)` | `1px solid rgba(145 158 171 / 0.24)` | `none`                      |

Origem: `frontend/src/theme/core/components/button.tsx:114-134`; medição em runtime.

#### Botão suave (`soft` — variante do projeto)

| Estado                          | Fundo                      | Texto                     |
| ------------------------------- | -------------------------- | ------------------------- |
| default (cor semântica, claro)  | `rgba(<canal> / 0.16)`     | `<cor>.dark`              |
| default (cor semântica, escuro) | `rgba(<canal> / 0.16)`     | `<cor>.light`             |
| default (`inherit`/sem cor)     | `rgba(145 158 171 / 0.08)` | herda                     |
| hover (cor semântica)           | `rgba(<canal> / 0.32)`     | mantém                    |
| hover (`inherit`)               | `rgba(145 158 171 / 0.24)` | mantém                    |
| **disabled**                    | `rgba(145 158 171 / 0.24)` | `rgba(145 158 171 / 0.8)` |

Origem: `frontend/src/theme/core/components/button.tsx:46-71`; medição em runtime.

#### Campo de texto (contorno)

| Estado       | Cor da borda                                          | Espessura |
| ------------ | ----------------------------------------------------- | --------- |
| default      | `rgba(145 158 171 / 0.2)` — `#919EAB @ 20%`           | `1px`     |
| hover        | ⚠️ não customizado — comportamento da biblioteca base | `1px`     |
| **focus**    | `#1C252E` / `rgb(28, 37, 46)` (`text.primary`)        | `1px`     |
| **error**    | `#FF5630` / `rgb(255, 86, 48)`                        | `1px`     |
| **disabled** | `rgba(145 158 171 / 0.24)`                            | `1px`     |

Transição da borda: `border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)`.
Origem: `frontend/src/theme/core/components/textfield.tsx:53-72`; medição em runtime.

#### Campo preenchido (`filled`)

| Estado        | Fundo                      |
| ------------- | -------------------------- |
| default       | `rgba(145 158 171 / 0.08)` |
| hover         | `rgba(145 158 171 / 0.16)` |
| focus         | `rgba(145 158 171 / 0.16)` |
| error         | `rgba(255 86 48 / 0.08)`   |
| error + focus | `rgba(255 86 48 / 0.16)`   |
| disabled      | `rgba(145 158 171 / 0.24)` |

Origem: `frontend/src/theme/core/components/textfield.tsx:88-108`.

#### Linha de tabela

| Estado           | Fundo                                                        |
| ---------------- | ------------------------------------------------------------ |
| default          | herda do container                                           |
| selected         | `rgba(0 120 103 / 0.04)` — `#007867` (`primary.dark`) `@ 4%` |
| selected + hover | `rgba(0 120 103 / 0.08)` — `#007867 @ 8%`                    |

Origem: `frontend/src/theme/core/components/table.tsx:41-44`.

#### Item de menu / opção de lista

| Estado           | Fundo                      | Peso da fonte |
| ---------------- | -------------------------- | ------------- |
| default          | transparente               | `400`         |
| selected         | `rgba(145 158 171 / 0.16)` | `600`         |
| selected + hover | `rgba(145 158 171 / 0.08)` | `600`         |

Origem: `frontend/src/theme/core/mixins/global-styles-components.ts:28-32`.

#### Item de navegação lateral

| Estado               | Fundo                                         | Texto                        |
| -------------------- | --------------------------------------------- | ---------------------------- |
| default              | transparente                                  | `#637381` (`text.secondary`) |
| hover                | `rgba(145 158 171 / 0.08)`                    | mantém                       |
| **ativo (raiz)**     | `rgba(0 167 111 / 0.08)` — `#00A76F @ 8%`     | `#00A76F`                    |
| ativo + hover (raiz) | `rgba(0 167 111 / 0.16)` — `#00A76F @ 16%`    | `#00A76F`                    |
| aberto (raiz)        | `rgba(145 158 171 / 0.08)`                    | `#1C252E`                    |
| ativo (filho)        | `rgba(145 158 171 / 0.08)` no layout vertical | `#1C252E`                    |
| legenda (`caption`)  | —                                             | `#919EAB` (`text.disabled`)  |
| subcabeçalho         | —                                             | `#919EAB`; hover → `#1C252E` |

Origem: `frontend/src/components/nav-section/styles/css-vars.ts:15-35`.

#### Chip

| Estado       | `filled default`                                                                | `outlined default`                   | `soft` (cor)                                     |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------ |
| default      | fundo `#1C252E`, texto `#FFFFFF`                                                | borda `1px rgba(145 158 171 / 0.32)` | fundo `rgba(<canal> / 0.16)`, texto `<cor>.dark` |
| hover        | fundo `#454F5B` (claro) / `#F9FAFB` (escuro)                                    | —                                    | fundo `rgba(<canal> / 0.32)`                     |
| **disabled** | fundo `rgba(145 158 171 / 0.24)`, texto `rgba(145 158 171 / 0.8)`, `opacity: 1` | borda `rgba(145 158 171 / 0.24)`     | fundo `rgba(145 158 171 / 0.24)`                 |

Origem: `frontend/src/theme/core/components/chip.tsx:97-124,152-181`; medição em runtime.

### 4.3 Foco visível — ⚠️ ponto de atenção

O projeto **não** define `:focus-visible` em nenhum override do tema (varredura em
`frontend/src/theme/**` não encontra `focusVisible` nem `:focus-visible`).
O único realce de foco explícito é:

- `outlined` e `ToggleButton` selecionado: `box-shadow: 0 0 0 0.75px currentColor`
  (`button.tsx:130`, `button-toggle.tsx:44-47`)
- `MuiInputBase`: `& .MuiInputBase-input:focus { border-radius: inherit }` (`textfield.tsx:18`)
- `MuiTablePagination` select: `&:focus { border-radius: 8px }` (`table.tsx:92`)

Todo o restante do foco vem do comportamento padrão da biblioteca base (anel/ripple),
usando `action.focus` = `rgba(145 158 171 / 0.24)`.
Ver `99-inconsistencias.md`.

---

## 5. Tema claro × tema escuro — tabela lado a lado

O tema escuro **existe e está completo**, mas o padrão da aplicação é `light`
(`frontend/src/theme/theme-config.ts:32` → `defaultMode: 'light'`;
`frontend/src/theme/create-theme.ts:37` → `defaultColorScheme`).
Troca via atributo `data-color-scheme` (`theme-config.ts:109`), persistida em `localStorage`
na chave `theme-mode` (`theme-config.ts:34`). `enableSystemMode: false` (`theme-config.ts:33`) —
o sistema operacional **não** influencia.

| Token                                                                  | Claro                                      | Escuro                                     | Muda?           |
| ---------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------ | --------------- |
| primary / secondary / info / success / warning / error (todos os tons) | idem                                       | idem                                       | **não**         |
| grey (50–900)                                                          | idem                                       | idem                                       | **não**         |
| `text.primary`                                                         | `#1C252E`                                  | `#FFFFFF`                                  | sim             |
| `text.secondary`                                                       | `#637381`                                  | `#919EAB`                                  | sim             |
| `text.disabled`                                                        | `#919EAB`                                  | `#637381`                                  | sim             |
| `background.default`                                                   | `#FFFFFF`                                  | `#141A21`                                  | sim             |
| `background.paper`                                                     | `#FFFFFF`                                  | `#1C252E`                                  | sim             |
| `background.neutral`                                                   | `#F4F6F8`                                  | `#28323D`                                  | sim             |
| `divider`                                                              | `rgba(145 158 171 / 0.2)`                  | `rgba(145 158 171 / 0.2)`                  | **não**         |
| `action.*` (hover/selected/focus/disabled/disabledBackground)          | overlays de `#919EAB`                      | idênticos                                  | **não**         |
| `action.active`                                                        | `#637381`                                  | `#919EAB`                                  | sim             |
| base da escala de sombras                                              | `#919EAB` (`145 158 171`)                  | `#000000` (`0 0 0`)                        | **sim**         |
| `customShadows.dialog`                                                 | `rgba(0 0 0 / 0.24)`                       | `rgba(0 0 0 / 0.24)`                       | **não**         |
| texto de `soft`/`outlined` colorido                                    | `<cor>.dark`                               | `<cor>.light`                              | sim             |
| Alert `standard`                                                       | texto `<cor>.darker` sobre `<cor>.lighter` | texto `<cor>.lighter` sobre `<cor>.darker` | sim (invertido) |
| fundo do tooltip                                                       | `#1C252E`                                  | `#454F5B`                                  | sim             |
| botão `contained inherit`                                              | `#1C252E` sobre texto `#FFFFFF`            | `#FFFFFF` sobre texto `#1C252E`            | sim (invertido) |
| `--layout-nav-border-color`                                            | `rgba(145 158 171 / 0.12)`                 | `rgba(145 158 171 / 0.08)`                 | sim             |
| `--layout-nav-horizontal-bg`                                           | `rgba(255 255 255 / 0.8)`                  | `rgba(20 26 33 / 0.96)`                    | sim             |

Origens: `frontend/src/theme/core/palette.ts:91-117`, `frontend/src/theme/core/shadows.ts:45-48`,
`frontend/src/theme/core/custom-shadows.ts:60-63`, `frontend/src/layouts/dashboard/css-vars.ts:34-53`.

---

## 6. Slots de cor gerados pela biblioteca

Existem no tema final (resolvidos pelo MUI 7.0.1) e **não** são declarados pelo projeto.
Vários são **sobrepostos** pelos overrides do projeto — a coluna final indica isso.

| Slot                                    | Valor computado         | Efetivo?                                             |
| --------------------------------------- | ----------------------- | ---------------------------------------------------- |
| `Alert.errorColor`                      | `rgb(102, 68, 52)`      | ❌ sobreposto por `alert.tsx:110-129`                |
| `Alert.infoColor`                       | `rgb(38, 97, 97)`       | ❌ sobreposto                                        |
| `Alert.successColor`                    | `rgb(47, 94, 55)`       | ❌ sobreposto                                        |
| `Alert.warningColor`                    | `rgb(102, 85, 40)`      | ❌ sobreposto                                        |
| `Alert.errorStandardBg`                 | `rgb(255, 246, 242)`    | ❌ sobreposto (usa `error.lighter` `#FFE9D5`)        |
| `Alert.infoStandardBg`                  | `rgb(239, 253, 253)`    | ❌ sobreposto (usa `info.lighter` `#CAFDF5`)         |
| `Alert.successStandardBg`               | `rgb(241, 253, 243)`    | ❌ sobreposto (usa `#D3FCD2`)                        |
| `Alert.warningStandardBg`               | `rgb(255, 250, 239)`    | ❌ sobreposto (usa `#FFF5CC`)                        |
| `Alert.<sev>FilledBg`                   | `palette.<sev>.main`    | ✅                                                   |
| `Alert.errorFilledColor`                | `#fff`                  | ❌ sobreposto (usa `<sev>.contrastText`)             |
| `Alert.info/success/warningFilledColor` | `rgba(0, 0, 0, 0.87)`   | ❌ sobreposto                                        |
| `AppBar.defaultBg`                      | `#F9FAFB` (`grey.100`)  | ❌ AppBar usa `color: transparent` (`appbar.tsx:11`) |
| `Avatar.defaultBg`                      | `#C4CDD5` (`grey.400`)  | ❌ sobreposto por `avatar.tsx:44-53`                 |
| `Button.inheritContainedBg`             | `#DFE3E8` (`grey.300`)  | ❌ sobreposto (usa `grey.800`)                       |
| `Button.inheritContainedHoverBg`        | `#f5f5f5` (`grey.A100`) | ❌ sobreposto (usa `grey.700`)                       |
| `Chip.defaultBorder`                    | `#C4CDD5` (`grey.400`)  | ❌ sobreposto (`rgba(145 158 171 / 0.32)`)           |
| `Chip.defaultAvatarColor`               | `#454F5B` (`grey.700`)  | parcialmente                                         |
| `Chip.defaultIconColor`                 | `#454F5B` (`grey.700`)  | ❌ sobreposto (`currentColor`)                       |
| `FilledInput.bg`                        | `rgba(0, 0, 0, 0.06)`   | ❌ sobreposto (`rgba(145 158 171 / 0.08)`)           |
| `FilledInput.hoverBg`                   | `rgba(0, 0, 0, 0.09)`   | ❌ sobreposto (`rgba(145 158 171 / 0.16)`)           |
| `FilledInput.disabledBg`                | `rgba(0, 0, 0, 0.12)`   | ❌ sobreposto (`rgba(145 158 171 / 0.24)`)           |

`contrastThreshold: 3` e `tonalOffset: 0.2` também são defaults da biblioteca; como todos os tons
são declarados explicitamente, **não há geração automática de tons** em uso.

---

## 7. Presets de cor disponíveis (inativos por padrão)

`frontend/src/theme/with-settings/color-presets.ts` define paletas alternativas selecionáveis pelo
painel de configurações. Com `primaryColor: 'default'`, **nenhuma está ativa**.

### 7.1 Primary

| Preset    | lighter   | light     | main      | dark      | darker    | contrastText | Origem                   |
| --------- | --------- | --------- | --------- | --------- | --------- | ------------ | ------------------------ |
| `default` | `#C8FAD6` | `#5BE49B` | `#00A76F` | `#007867` | `#004B50` | `#FFFFFF`    | `color-presets.ts:8-15`  |
| `preset1` | `#CCF4FE` | `#68CDF9` | `#078DEE` | `#0351AB` | `#012972` | `#FFFFFF`    | `color-presets.ts:16-23` |
| `preset2` | `#EBD6FD` | `#B985F4` | `#7635dc` | `#431A9E` | `#200A69` | `#FFFFFF`    | `color-presets.ts:24-31` |
| `preset3` | `#CDE9FD` | `#6BB1F8` | `#0C68E9` | `#063BA7` | `#021D6F` | `#FFFFFF`    | `color-presets.ts:32-39` |
| `preset4` | `#FEF4D4` | `#FED680` | `#fda92d` | `#B66816` | `#793908` | `#1C252E`    | `color-presets.ts:40-47` |
| `preset5` | `#FFE3D5` | `#FFC1AC` | `#FF3030` | `#B71833` | `#7A0930` | `#FFFFFF`    | `color-presets.ts:48-55` |

### 7.2 Secondary

Definidos em `color-presets.ts:58-105`, mas ⚠️ **nunca aplicados**: a linha que os usaria está
comentada em `frontend/src/theme/with-settings/update-core.ts:34` e `:44`.

| Preset    | lighter   | light     | main      | dark      | darker    | contrastText |
| --------- | --------- | --------- | --------- | --------- | --------- | ------------ |
| `default` | `#EFD6FF` | `#C684FF` | `#8E33FF` | `#5119B7` | `#27097A` | `#FFFFFF`    |
| `preset1` | `#CAFDEB` | `#61F4D9` | `#00DCDA` | `#00849E` | `#004569` | `#FFFFFF`    |
| `preset2` | `#D6E5FD` | `#85A9F3` | `#3562D7` | `#1A369A` | `#0A1967` | `#FFFFFF`    |
| `preset3` | `#FFF3D8` | `#FFD18B` | `#FFA03F` | `#B75D1F` | `#7A2D0C` | `#1C252E`    |
| `preset4` | `#FEEFD5` | `#FBC182` | `#F37F31` | `#AE4318` | `#741B09` | `#FFFFFF`    |
| `preset5` | `#FCF0DA` | `#EEC18D` | `#C87941` | `#904220` | `#601B0C` | `#FFFFFF`    |

---

## 8. Cores fixas fora da paleta (hardcoded)

Varredura em `frontend/src/**/*.{ts,tsx}`, **excluindo** `src/theme/**` e `src/_mock/**`:

- **972** ocorrências de cor hexadecimal literal
- **70** ocorrências de `rgb()` / `rgba()` literal

### 8.1 Dentro do próprio design system (poucos, controlados)

| Valor                            | Uso                                                 | Origem (arquivo:linha)                                          |
| -------------------------------- | --------------------------------------------------- | --------------------------------------------------------------- |
| `#282F37` / `rgb(40, 47, 55)`    | `bulletColor.dark` — marcador de item de nav        | `frontend/src/components/nav-section/styles/css-vars.ts:7`      |
| `#EDEFF2` / `rgb(237, 239, 242)` | `bulletColor.light` — marcador de item de nav       | `frontend/src/components/nav-section/styles/css-vars.ts:7`      |
| `#28323D` / `rgb(40, 50, 61)`    | `background.neutral` do tema escuro                 | `frontend/src/theme/core/palette.ts:99`                         |
| `#00B8D9` (dentro de SVG base64) | gradiente radial ciano do fundo de menus/drawers    | `frontend/src/theme/core/mixins/global-styles-components.ts:73` |
| `#FF5630` (dentro de SVG base64) | gradiente radial vermelho do fundo de menus/drawers | `frontend/src/theme/core/mixins/global-styles-components.ts:76` |
| `#000000`                        | `<meta name="theme-color">`                         | `frontend/index.html:6`                                         |

### 8.2 Fora do design system — valores mais frequentes

| Ocorrências | Valor                           | Situação                                                                                                | Exemplo de origem                                                                             |
| ----------- | ------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 63          | `#FF4842` / `rgb(255, 72, 66)`  | ⚠️ **não existe na paleta atual** (era o `error.main` da versão anterior do template; hoje é `#FF5630`) | `frontend/src/modules/dashboards/views/malha-diferenca-fator-r-view.tsx:174`                  |
| 55          | `#00AB55` / `rgb(0, 171, 85)`   | ⚠️ **não existe na paleta atual** (era o `primary.main` anterior; hoje é `#00A76F`)                     | `frontend/src/modules/dashboards/components/GraficosGerenciais/RetificacoesTab.tsx:336`       |
| 50          | `#00B8D9`                       | duplicação literal de `info.main`                                                                       | vários dashboards                                                                             |
| 45          | `#FFAB00`                       | duplicação literal de `warning.main`                                                                    | vários dashboards                                                                             |
| 20          | `#4CAF50` / `rgb(76, 175, 80)`  | fora da paleta (verde Material)                                                                         | `frontend/src/components/iconify/icon-sets.ts` (dentro de SVG)                                |
| 17          | `#10B981` / `rgb(16, 185, 129)` | fora da paleta (verde Tailwind)                                                                         | `frontend/src/modules/dashboards/components/GraficosGerenciais/DashboardExecutivoTab.tsx:213` |
| 16          | `#F5F5F5`                       | igual a `grey.A100`                                                                                     | diversos                                                                                      |
| 16          | `#F59E0B` / `rgb(245, 158, 11)` | fora da paleta (âmbar Tailwind)                                                                         | `.../DashboardExecutivoTab.tsx:277`                                                           |
| 16          | `#8B5CF6` / `rgb(139, 92, 246)` | fora da paleta (violeta Tailwind)                                                                       | `frontend/src/modules/dashboards/views/malha-diferenca-fator-r-view.tsx:395`                  |
| 14          | `#C38323` / `rgb(195, 131, 35)` | fora da paleta                                                                                          | `frontend/src/sections/_examples/**`                                                          |
| 14          | `#00A76F`                       | duplicação literal de `primary.main`                                                                    | diversos                                                                                      |
| 13          | `#FF9800`                       | fora da paleta (laranja Material)                                                                       | diversos                                                                                      |
| 12          | `#2563EB` / `rgb(37, 99, 235)`  | fora da paleta (azul Tailwind)                                                                          | `.../DashboardExecutivoTab.tsx:203`                                                           |
| 11          | `#E0E0E0`                       | fora da paleta (cinza Material)                                                                         | diversos                                                                                      |
| 10          | `#FFD666`                       | duplicação literal de `warning.light`                                                                   | diversos                                                                                      |
| 10          | `#DFE3E8`                       | duplicação literal de `grey.300`                                                                        | diversos                                                                                      |
| 10          | `#637381`                       | duplicação literal de `text.secondary` / `grey.600`                                                     | diversos                                                                                      |
| 8           | `#1976D2`, `#D32F2F`            | azul/vermelho padrão da biblioteca base, fora da paleta                                                 | diversos                                                                                      |
| 8           | `#0E4595`                       | fora da paleta                                                                                          | `frontend/src/components/iconify/icon-sets.ts` (SVG de bandeira)                              |
| 5           | `#212B36` / `rgb(33, 43, 54)`   | ⚠️ era o `grey.800` da versão anterior (hoje `#1C252E`)                                                 | `frontend/src/modules/dashboards/components/GraficosGerenciais/EvolucaoChart.tsx:58`          |

### 8.3 Arquivos com maior concentração

| Ocorrências | Arquivo                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| 158         | `frontend/src/modules/malha-fiscal-execucao/views/comparativo-declaracoes-view.tsx`                     |
| 46          | `frontend/src/modules/malha-fiscal-execucao/views/sections/ActivityFlowSection/ActivityFlowSection.tsx` |
| 38          | `frontend/src/layouts/components/notifications-drawer/icons.tsx`                                        |
| 33          | `frontend/src/modules/acao-fiscal/views/apuracao-xml-pgdasd-acao-fiscal-view.tsx`                       |
| 32          | `frontend/src/modules/acao-fiscal/views/apuracao-detalhes-calculo.tsx`                                  |
| 25          | `frontend/src/modules/dashboards/views/malha-sublimite-view.tsx`                                        |
| 25          | `frontend/src/modules/dashboards/views/malha-funil-autorregularizacao-view.tsx`                         |
| 24          | `frontend/src/modules/dashboards/views/malha-diferenca-nao-incidente-view.tsx`                          |
| 24          | `frontend/src/components/iconify/icon-sets.ts` (cores embutidas em SVGs de bandeiras/logos — esperado)  |
| 23          | `frontend/src/modules/dashboards/views/malha-fiscal-view.tsx`                                           |

Análise e recomendações: `99-inconsistencias.md`.

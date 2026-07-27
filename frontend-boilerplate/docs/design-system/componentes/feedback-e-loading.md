# Componentes — Feedback e carregamento

Quatro mecanismos distintos de "estou processando":

| Mecanismo                   | Onde aparece                                       |
| --------------------------- | -------------------------------------------------- |
| `LinearProgress`            | dentro de blocos, e como base do `LoadingScreen`   |
| `CircularProgress`          | overlays (ex.: `DataGrid`), botões de carregamento |
| `Skeleton`                  | placeholders de conteúdo (listas, tabelas, cards)  |
| `nprogress` (`ProgressBar`) | barra fina no topo, durante troca de rota          |

Mais o `SplashScreen` — a tela cheia de abertura do app.

> `rem` renderiza a **14px**. `theme.spacing(n)` = `calc(n * var(--spacing))`, `--spacing: 8px`.

---

## LinearProgress

### Anatomia

```
.MuiLinearProgress-root   position relative · overflow hidden · height 4px · z-index 0
  border-radius 4px · background-color rgba(<main> / 0.24)
  ├── [.MuiLinearProgress-dashed]  (só em variant="buffer")
  ├── .MuiLinearProgress-bar1      position absolute · left/top/bottom 0 · width 100%
  │                                background-color <main> · border-radius inherit
  └── [.MuiLinearProgress-bar2]    (indeterminate / buffer)
```

### Variantes e tamanhos

| Variante                                              | Fundo da trilha                                                                                                      |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `indeterminate` (default MUI), `determinate`, `query` | `rgba(<main> / 0.24)` (override do projeto)                                                                          |
| `buffer`                                              | **não recebe** o override — mantém o `LinearProgress.<cor>Bg` do MUI (ex.: `rgb(158,221,200)` para primary no light) |

| Cor           | Fundo da trilha (light e dark)                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `primary`     | `rgba(0 167 111 / 0.24)`                                                                                                             |
| `secondary`   | `rgba(142 51 255 / 0.24)`                                                                                                            |
| `info`        | `rgba(0 184 217 / 0.24)`                                                                                                             |
| `success`     | `rgba(34 197 94 / 0.24)`                                                                                                             |
| `warning`     | `rgba(255 171 0 / 0.24)`                                                                                                             |
| `error`       | `rgba(255 86 48 / 0.24)`                                                                                                             |
| **`inherit`** | `rgba(28 37 46 / 0.24)` (light) / `rgba(255 255 255 / 0.24)` (dark) — base `text.primary`; além disso, `&::before { display: none }` |

Sem tamanhos (altura fixa de 4px).

### Tabela de estados

| Estado            | Fundo (trilha)                                       | Barra                                          | Borda   | Sombra  | Transição                                                                                                                         |
| ----------------- | ---------------------------------------------------- | ---------------------------------------------- | ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `determinate`     | `rgba(<main> / 0.24)`                                | `<cor>.main`, `border-radius: inherit` (= 4px) | nenhuma | nenhuma | `transform 0.2s linear`                                                                                                           |
| `indeterminate`   | idem                                                 | duas barras animadas                           | nenhuma | nenhuma | `bar1`: `2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite`; `bar2`: `2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite` |
| `buffer`          | `LinearProgress.<cor>Bg` (default MUI)               | idem                                           | nenhuma | nenhuma | `dashed`: `3s infinite linear`                                                                                                    |
| `query`           | idem `indeterminate`                                 | idem                                           | nenhuma | nenhuma | `transform: rotate(180deg)`                                                                                                       |
| `color="inherit"` | `rgba(28 37 46 / 0.24)` / `rgba(255 255 255 / 0.24)` | `currentColor`                                 | nenhuma | nenhuma | idem                                                                                                                              |

### Medidas

| Propriedade                         | Valor bruto                                     | Referência simbólica                  |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------- |
| `border-radius` (root)              | **4px**                                         | override                              |
| `border-radius` (bar)               | **`inherit`** (= 4px)                           | override                              |
| `height`                            | **4px**                                         | default MUI                           |
| `position` / `overflow` / `z-index` | `relative` / `hidden` / `0`                     | default MUI                           |
| trilha (cores)                      | `rgba(<main> / 0.24)`                           | `varAlpha(<cor>.mainChannel, 0.24)`   |
| trilha (`inherit`)                  | `rgba(<text.primary> / 0.24)`                   | `varAlpha(text.primaryChannel, 0.24)` |
| animação indeterminada              | `2.1s` (duas fases, a 2ª com `1.15s` de atraso) | default MUI                           |
| animação de buffer                  | `3s infinite linear`                            | default MUI                           |

### Regras de uso observadas

- A trilha translúcida a 24% da própria cor substitui o "tom claro calculado" do MUI: o resultado é uma
  barra que funciona sobre qualquer fundo, inclusive escuro.
- `border-radius: inherit` na barra garante que a ponta da barra acompanhe o arredondamento da trilha.
- `color="inherit"` desliga o `::before` (usado pelo MUI no `buffer`) e é a variante usada pelo
  `LoadingScreen`.

### Origem

| Fato                                                                      | Arquivo:linha                                                                                       |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `borderRadius: 4` + aplicação condicional (`variant !== 'buffer'`)        | `frontend/src/theme/core/components/progress.tsx:42-45`                                             |
| cores `rgba(<main> / 0.24)`                                               | `frontend/src/theme/core/components/progress.tsx:32-34`                                             |
| `color="inherit"` (`::before display none` + `rgba(text.primary / 0.24)`) | `frontend/src/theme/core/components/progress.tsx:35-40`                                             |
| `bar: { borderRadius: 'inherit' }`                                        | `frontend/src/theme/core/components/progress.tsx:47`                                                |
| base (`height 4`, `position relative`, `overflow hidden`, keyframes)      | default MUI 7.0.1 (`node_modules/@mui/material/LinearProgress/LinearProgress.js:117-120`, `:24-84`) |
| slots `LinearProgress.<cor>Bg` (usados no `buffer`)                       | tema computado (`frontend/.ds-extract/theme.json` → `computed.paletteLight.LinearProgress`)         |

---

## CircularProgress

**Não há override de `MuiCircularProgress` no tema do projeto.** Tudo abaixo é default do MUI 7.0.1.
A única customização registrada é indireta: no `DataGrid`, o overlay força
`color: text.primary` no `CircularProgress` (`mui-x-data-grid.tsx:211-209`).

### Anatomia

```
.MuiCircularProgress-root   display inline-block
└── .MuiCircularProgress-svg   display block · viewBox "22 22 44 44"
    └── .MuiCircularProgress-circle   stroke currentColor · cx 44 · cy 44 · r 20.2
```

### Variantes e tamanhos

| Prop            | Default               |
| --------------- | --------------------- |
| `variant`       | `indeterminate`       |
| `size`          | **40** (px)           |
| `thickness`     | **3.6**               |
| `color`         | `primary` (`#00A76F`) |
| `disableShrink` | `false`               |

### Tabela de estados

| Estado            | Fundo        | Traço                         | Borda   | Sombra  | Transição                                                                                        |
| ----------------- | ------------ | ----------------------------- | ------- | ------- | ------------------------------------------------------------------------------------------------ |
| `indeterminate`   | transparente | `currentColor` (`<cor>.main`) | nenhuma | nenhuma | root: `rotate 1.4s linear infinite`; circle: `dash 1.4s ease-in-out infinite`                    |
| `determinate`     | transparente | idem                          | nenhuma | nenhuma | `stroke-dashoffset 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`; root com `transform: rotate(-90deg)` |
| `color="inherit"` | transparente | cor herdada do contexto       | nenhuma | nenhuma | idem                                                                                             |

### Medidas

| Propriedade                     | Valor bruto                      |
| ------------------------------- | -------------------------------- |
| `size` (largura/altura do root) | **40 × 40px**                    |
| `SIZE` interno (viewBox)        | **44** → `viewBox="22 22 44 44"` |
| `thickness` (stroke-width)      | **3.6**                          |
| raio do círculo                 | `(44 − 3.6) / 2` = **20,2**      |
| circunferência                  | `2π × 20.2` ≈ **126,92**         |
| animação de rotação             | `1.4s linear infinite`           |
| animação de traço               | `1.4s ease-in-out infinite`      |

### Regras de uso observadas

- O projeto **não personaliza** o CircularProgress: espessura, tamanho e animação são os do Material Design.
- Onde o fundo é escuro/claro demais, o app usa `color="inherit"` ou força a cor via `sx` (padrão do
  overlay do DataGrid).

### Origem

| Fato                                                        | Arquivo:linha                                                                                                                                                                                      |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ausência de override                                        | não existe arquivo `circular-progress` em `frontend/src/theme/core/components/` (só `progress.tsx`, que exporta apenas `MuiLinearProgress` — `frontend/src/theme/core/components/progress.tsx:53`) |
| `SIZE = 44`, `size = 40`, `thickness = 3.6`, animações 1.4s | default MUI 7.0.1 (`node_modules/@mui/material/CircularProgress/CircularProgress.js:22`, `:52-56`, `:171-173`)                                                                                     |
| cor forçada no overlay do DataGrid                          | `frontend/src/theme/core/components/mui-x-data-grid.tsx:211-209`                                                                                                                                   |

---

## Skeleton

### Anatomia

```
.MuiSkeleton-root   display block · background-color rgba(196 205 213 / 0.12)
                    height 1.2em (variant="text") · border-radius conforme variante
                    ::after (animation="wave") → gradiente que atravessa o bloco
```

### Variantes e tamanhos

| Variante      | Default                | `border-radius`              | Observações                                                                                    |
| ------------- | ---------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `text`        | —                      | `8px/13.3px` (raio elíptico) | `transform: scale(1, 0.60)`, `transform-origin: 0 55%`, `height: auto`, `margin-top/bottom: 0` |
| `circular`    | —                      | `50%`                        | —                                                                                              |
| **`rounded`** | **default do projeto** | **16px**                     | `shape.borderRadius × 2`                                                                       |
| `rectangular` | —                      | `0`                          | —                                                                                              |

| Animação   | Default                                     |
| ---------- | ------------------------------------------- |
| **`wave`** | **default do projeto** (MUI usaria `pulse`) |
| `pulse`    | `2s ease-in-out 0.5s infinite`              |
| `false`    | sem animação                                |

### Tabela de estados

| Estado                        | Fundo                                                            | Texto | Borda   | Sombra  | Transição                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------- | ----- | ------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| default (`wave`)              | **`rgba(196 205 213 / 0.12)`** (light e dark — o valor não muda) | —     | nenhuma | nenhuma | `::after`: `wave 2s linear 0.5s infinite` (gradiente deslizando de `translateX(-100%)` a `translateX(100%)`) |
| `animation="pulse"`           | idem                                                             | —     | nenhuma | nenhuma | `pulse 2s ease-in-out 0.5s infinite` (opacidade)                                                             |
| `animation={false}`           | idem                                                             | —     | nenhuma | nenhuma | nenhuma                                                                                                      |
| com `children` e sem `width`  | idem                                                             | —     | nenhuma | nenhuma | `max-width: fit-content`                                                                                     |
| com `children` e sem `height` | idem                                                             | —     | nenhuma | nenhuma | `height: auto`                                                                                               |

### Medidas

| Propriedade                 | Valor bruto                                          | Referência simbólica              |
| --------------------------- | ---------------------------------------------------- | --------------------------------- |
| `background-color`          | **`rgba(196 205 213 / 0.12)`**                       | `varAlpha(grey.400Channel, 0.12)` |
| `border-radius` (`rounded`) | **16px**                                             | `shape.borderRadius × 2`          |
| `height` (`text`)           | `auto` com `transform: scale(1, 0.60)` sobre `1.2em` | default MUI                       |
| animação `wave`             | `2s linear 0.5s infinite`                            | default MUI                       |
| animação `pulse`            | `2s ease-in-out 0.5s infinite`                       | default MUI                       |
| `display`                   | `block`                                              | default MUI                       |

> O MUI usaria `rgba(28 37 46 / 0.11)` no light e `rgba(255 255 255 / 0.13)` no dark
> (`palette.Skeleton.bg`). O projeto substitui por um cinza único (`grey.400` a 12%), **igual nos dois
> esquemas**.

### Regras de uso observadas

- O par de defaults `variant="rounded"` + `animation="wave"` faz o skeleton padrão do sistema ser um bloco
  de cantos de 16px com brilho deslizante — combinando com o raio dos `Card`.
- Quem quer imitar linhas de texto precisa passar `variant="text"` explicitamente (é o que faz o
  `TableSkeleton`).

### Origem

| Fato                                                                                       | Arquivo:linha                                                                                      |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `defaultProps: { animation: 'wave', variant: 'rounded' }`                                  | `frontend/src/theme/core/components/skeleton.tsx:11`                                               |
| `backgroundColor: varAlpha(grey.400Channel, 0.12)`                                         | `frontend/src/theme/core/components/skeleton.tsx:17-19`                                            |
| `rounded: borderRadius × 2 = 16px`                                                         | `frontend/src/theme/core/components/skeleton.tsx:20`                                               |
| base (keyframes `pulse`/`wave`, `variant="text"` scale 0.6, `circular` 50%, `Skeleton.bg`) | default MUI 7.0.1 (`node_modules/@mui/material/Skeleton/Skeleton.js:34-71`, `:85-119`, `:146-186`) |
| `grey.400 = #C4CDD5` (canal `196 205 213`)                                                 | `frontend/src/theme/theme-config.ts:96-107`                                                        |

---

## LoadingScreen (componente próprio)

### Anatomia

```
[<Portal>]                            (opcional, prop `portal`)
└── LoadingContent <div>              flex-grow 1 · width 100% · min-height 100%
      display flex · align-items center · justify-content center
      padding-left 40px · padding-right 40px
      └── <LinearProgress color="inherit" sx={{ width: 1, maxWidth: 360 }} />
```

### Variantes e tamanhos

| Prop     | Default             | Efeito                                                      |
| -------- | ------------------- | ----------------------------------------------------------- |
| `portal` | `undefined` (falso) | quando verdadeiro, renderiza dentro de um `<Portal>` do MUI |

### Tabela de estados

| Estado             | Fundo                         | Barra                                                              | Borda   | Sombra  | Transição                     |
| ------------------ | ----------------------------- | ------------------------------------------------------------------ | ------- | ------- | ----------------------------- |
| carregando (light) | transparente (herda a página) | trilha `rgba(28 37 46 / 0.24)`, barra `currentColor` (= `#1C252E`) | nenhuma | nenhuma | animação indeterminada `2.1s` |
| carregando (dark)  | transparente                  | trilha `rgba(255 255 255 / 0.24)`, barra `#FFFFFF`                 | nenhuma | nenhuma | idem                          |

### Medidas

| Propriedade                                  | Valor bruto                   | Referência simbólica |
| -------------------------------------------- | ----------------------------- | -------------------- |
| container: `padding-left` / `padding-right`  | **40px** cada                 | `theme.spacing(5)`   |
| container: `min-height`                      | `100%`                        | —                    |
| container: `flex-grow` / `width`             | `1` / `100%`                  | —                    |
| container: `align-items` / `justify-content` | `center` / `center`           | —                    |
| barra: `width`                               | `100%`                        | `width: 1`           |
| barra: `max-width`                           | **360px**                     | —                    |
| barra: `height`                              | **4px**, `border-radius: 4px` | `MuiLinearProgress`  |
| barra: `color`                               | **`inherit`**                 | —                    |

### Regras de uso observadas

- É a tela de carregamento **de rota/lazy chunk**: ocupa o espaço disponível e centraliza uma barra de no
  máximo 360px.
- Usa `color="inherit"`, então a barra assume a cor de texto do contexto (preto-azulado no light, branco no
  dark) — nunca verde.

### Origem

| Fato                                                         | Arquivo:linha                                                     |
| ------------------------------------------------------------ | ----------------------------------------------------------------- |
| `LinearProgress color="inherit"` + `width: 1, maxWidth: 360` | `frontend/src/components/loading-screen/loading-screen.tsx:22`    |
| `LoadingContent` (flex, min-height, padding 40px)            | `frontend/src/components/loading-screen/loading-screen.tsx:30-39` |
| `Portal` opcional                                            | `frontend/src/components/loading-screen/loading-screen.tsx:17-25` |

---

## SplashScreen (componente próprio)

### Anatomia

```
[<Portal>]                              (default: portal = true)
└── LoadingWrapper <div>                flex-grow 1 · display flex · column
    └── LoadingContent <div>            position fixed · right 0 · bottom 0
          width 100% · height 100% · z-index 9998
          display flex · align-items center · justify-content center
          background-color: background.default
          └── <AnimateLogoZoom />       120×120px
                ├── <Logo disabled sx={{ width: 64, height: 64 }} />   (animado)
                ├── LogoZoomPrimaryOutline    calc(100% - 20px) · borda 3px
                └── LogoZoomSecondaryOutline  100% · borda 8px
```

### Variantes e tamanhos

| Prop                | Default    |
| ------------------- | ---------- |
| `portal`            | **`true`** |
| `slotProps.wrapper` | —          |

### Tabela de estados

| Estado        | Fundo                                   | Conteúdo                                             | Borda                                | Sombra  | Transição            |
| ------------- | --------------------------------------- | ---------------------------------------------------- | ------------------------------------ | ------- | -------------------- |
| ativo (light) | **#FFFFFF** (`background.default`)      | logo 64×64 + 2 contornos em `rgba(0 120 103 / 0.24)` | contornos: `solid 3px` e `solid 8px` | nenhuma | ver animações abaixo |
| ativo (dark)  | **#141A21** (`background.default` dark) | idem                                                 | idem                                 | nenhuma | idem                 |

**Animações (framer-motion)**

| Elemento            | Keyframes                                                                                                                                              | Duração / repetição                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| logo                | `scale: [1, 0.9, 0.9, 1, 1]`, `opacity: [1, 0.48, 0.48, 1, 1]`                                                                                         | `duration: 2`, `repeatDelay: 1`, `repeat: Infinity`, `ease: 'easeInOut'` |
| contorno primário   | `scale: [1.6, 1, 1, 1.6, 1.6]`, `rotate: [270, 0, 0, 270, 270]`, `opacity: [0.25, 1, 1, 1, 0.25]`, `borderRadius: ['25%', '25%', '50%', '50%', '25%']` | `duration: 3.2`, `ease: 'linear'`, `repeat: Infinity`                    |
| contorno secundário | `scale: [1, 1.2, 1.2, 1, 1]`, `rotate: [0, 270, 270, 0, 0]`, `opacity: [1, 0.25, 0.25, 0.25, 1]`, `borderRadius: ['25%', '25%', '50%', '50%', '25%']`  | `duration: 3.2`, `ease: 'linear'`, `repeat: Infinity`                    |

### Medidas

| Propriedade                   | Valor bruto                                                                           | Referência simbólica                  |
| ----------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------- |
| container: `position`         | `fixed`, `right: 0`, `bottom: 0`                                                      | —                                     |
| container: `width` / `height` | `100%` / `100%`                                                                       | —                                     |
| container: **`z-index`**      | **9998**                                                                              | literal                               |
| container: `background-color` | `#FFFFFF` (light) / `#141A21` (dark)                                                  | `background.default`                  |
| `AnimateLogoZoom` root        | **120 × 120px**, `position: relative`, `display: inline-flex`                         | —                                     |
| logo                          | **64 × 64px**, `pointer-events: none` (`disabled`)                                    | —                                     |
| contorno primário             | `calc(100% - 20px)` × `calc(100% - 20px)`, `border: solid 3px rgba(0 120 103 / 0.24)` | `varAlpha(primary.darkChannel, 0.24)` |
| contorno secundário           | `100% × 100%`, `border: solid 8px rgba(0 120 103 / 0.24)`                             | idem                                  |
| imagem do logo                | `/assets/fiscaliza/icon_fiscaliza.png` (`width/height 100%`)                          | —                                     |

### Regras de uso observadas

- `z-index: 9998` fica **abaixo** do `#nprogress` (9999) e **acima** de tudo mais do app — inclusive do
  tooltip (1500). É a camada mais alta depois da barra de rota.
- Os dois contornos giram 270° em sentidos opostos e alternam entre quadrado arredondado (25%) e círculo
  (50%), sempre em verde `primary.dark` a 24%.

### Origem

| Fato                                                       | Arquivo:linha                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| `portal = true`                                            | `frontend/src/components/loading-screen/splash-screen.tsx:20`               |
| `LoadingWrapper`                                           | `frontend/src/components/loading-screen/splash-screen.tsx:36-40`            |
| `LoadingContent` (fixed, z-index 9998, background.default) | `frontend/src/components/loading-screen/splash-screen.tsx:42-54`            |
| `AnimateLogoZoom` (root 120×120)                           | `frontend/src/components/animate/animate-logo.tsx:71-78`                    |
| logo 64×64 + animação                                      | `frontend/src/components/animate/animate-logo.tsx:25-46` (tamanho em `:39`) |
| contorno primário (3px)                                    | `frontend/src/components/animate/animate-logo.tsx:80-85`                    |
| contorno secundário (8px)                                  | `frontend/src/components/animate/animate-logo.tsx:87-92`                    |
| `Logo` (40×40 default, imagem)                             | `frontend/src/components/logo/logo.tsx:31-50`                               |

---

## ProgressBar / nprogress

Barra fina de progresso de navegação. O componente React **não renderiza nada** (`return null`): ele só
dispara `NProgress.start()` / `NProgress.done()` a cada mudança de `pathname`. Todo o visual está no CSS.

### Anatomia

```
#nprogress                position fixed · top 0 · left 0 · width 100% · height 2.5px
                          z-index 9999 · pointer-events none
├── #nprogress .bar       height 100% · background-color primary.main
│                         box-shadow 0 0 2.5px primary.main
└── #nprogress .peg       right 0 · width 100px · height 100% · opacity 1
                          transform rotate(3deg) translate(0px, -4px)
                          box-shadow 0 0 10px …, 0 0 5px …
```

### Variantes e tamanhos

Sem variantes.

### Tabela de estados

| Estado    | Fundo                                      | Barra                                             | Borda   | Sombra                                                                         | Transição                                        |
| --------- | ------------------------------------------ | ------------------------------------------------- | ------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| navegando | transparente (a faixa em si não tem fundo) | **`#00A76F`** (via `var(--palette-primary-main)`) | nenhuma | barra: `0 0 2.5px #00A76F`; ponta (`peg`): `0 0 10px #00A76F, 0 0 5px #00A76F` | animação interna do `nprogress` 0.2.0            |
| ocioso    | —                                          | —                                                 | —       | —                                                                              | elemento removido do DOM pelo `NProgress.done()` |

### Medidas

| Propriedade                           | Valor bruto                                                                 | Referência simbólica |
| ------------------------------------- | --------------------------------------------------------------------------- | -------------------- |
| `height`                              | **2,5px**                                                                   | literal              |
| `z-index`                             | **9999**                                                                    | literal              |
| `position` / `top` / `left` / `width` | `fixed` / `0` / `0` / `100%`                                                | literais             |
| `pointer-events`                      | `none`                                                                      | literal              |
| barra: `background-color`             | `var(--palette-primary-main)` = **#00A76F**                                 | `primary.main`       |
| barra: `box-shadow`                   | `0 0 2.5px var(--palette-primary-main)`                                     | —                    |
| `peg`: `width`                        | **100px**                                                                   | literal              |
| `peg`: `transform`                    | **`rotate(3deg) translate(0px, -4px)`**                                     | literal              |
| `peg`: `box-shadow`                   | `0 0 10px var(--palette-primary-main), 0 0 5px var(--palette-primary-main)` | —                    |

### Regras de uso observadas

- **`z-index: 9999` é o valor mais alto do sistema** — acima do `SplashScreen` (9998), do tooltip (1500) e
  de qualquer modal (1300).
- O CSS consome as CSS vars do tema (`--palette-primary-main`), então a barra segue automaticamente
  qualquer troca de cor primária feita pelo Settings Drawer.
- ⚠️ O componente `ProgressBar` chama `NProgress.start()` e `NProgress.done()` no **mesmo efeito**
  (alternando por um estado `visible`), o que produz um ciclo curto de início/fim a cada navegação. É o
  comportamento do código.

### Origem

| Fato                                                             | Arquivo:linha                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------------- |
| `#nprogress` (height 2.5px, z-index 9999, fixed, pointer-events) | `frontend/src/components/progress-bar/styles.css:1-9`         |
| `.bar` (bg + box-shadow)                                         | `frontend/src/components/progress-bar/styles.css:10-14`       |
| `.peg` (100px, rotate/translate, box-shadow)                     | `frontend/src/components/progress-bar/styles.css:15-26`       |
| lógica `start()`/`done()` e `return null`                        | `frontend/src/components/progress-bar/progress-bar.tsx:16-46` |
| versão `nprogress` **0.2.0**                                     | `frontend/package-lock.json` (lockfileVersion 3)              |

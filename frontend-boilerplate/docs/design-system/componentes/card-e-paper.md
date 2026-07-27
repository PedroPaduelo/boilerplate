# Componentes — Superfícies: Paper e Card

Superfícies são a base visual de todo o resto: `Card`, `Dialog`, `Drawer`, `Popover`, `Menu`, `Alert`,
`Accordion` e `AppBar` são **todos** derivados de `Paper` na implementação atual. Documentar `Paper`
primeiro evita repetir a mesma herança em cada componente.

> **Base de leitura obrigatória**: `rem` renderiza a **14px** (`html { font-size: 14px }`).
> Todo `rem` desta página traz o px real (`rem × 14`). Valores escritos em `px` puro **não** escalam.
> `theme.spacing(n)` é emitido como `calc(n * var(--spacing))` com `--spacing: 8px`; a coluna "valor bruto"
> mostra o px resultante.

---

## Paper

Superfície genérica. Não tem forma própria: só cor de fundo, cor de texto, transição de sombra e — quando
`variant="elevation"` — a sombra vinda de `--Paper-shadow`.

### Anatomia

```
┌─ .MuiPaper-root ─────────────────────────────┐
│  (bloco único, sem slots internos)           │
│  background-color · color · box-shadow       │
└──────────────────────────────────────────────┘
```

Sem sub-elementos. Todo o resto vem de quem o usa (`Card`, `Dialog`, `Popover`…).

### Variantes e tamanhos

| Variante               | Prop                                | Efeito                                                                       |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `elevation`            | `variant="elevation"` (default MUI) | `box-shadow: var(--Paper-shadow)` + `background-image: var(--Paper-overlay)` |
| `outlined`             | `variant="outlined"`                | `border: 1px solid <borderColor>` e **sem** sombra                           |
| `square` / arredondado | `square={false}` (default)          | `border-radius: 8px`                                                         |

**Elevation default do projeto = `0`** (`defaultProps: { elevation: 0 }`). Ou seja: um `<Paper>` sem props
sai **sem sombra**, ao contrário do MUI puro (que usa `elevation: 1`).

Os 25 níveis `shadows[0..24]` continuam existindo e são usados quando alguém passa `elevation={n}`
explicitamente. A cor base deles é customizada (`rgba(145 158 171 / …)` no light, `rgba(0 0 0 / …)` no dark).

### Tabela de estados

`Paper` não tem estados de interação próprios (não é focável nem clicável).

| Estado                       | Fundo                        | Texto                     | Borda                                | Sombra                     | Transição                                           |
| ---------------------------- | ---------------------------- | ------------------------- | ------------------------------------ | -------------------------- | --------------------------------------------------- |
| default (light)              | `#FFFFFF` (rgb(255,255,255)) | `#1C252E` (rgb(28,37,46)) | nenhuma                              | `none` (elevation 0)       | `box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` |
| default (dark)               | `#1C252E` (rgb(28,37,46))    | `#FFFFFF`                 | nenhuma                              | `none`                     | idem                                                |
| `variant="outlined"` (light) | `#FFFFFF`                    | `#1C252E`                 | `1px solid rgba(145 158 171 / 0.16)` | `none`                     | idem                                                |
| `variant="outlined"` (dark)  | `#1C252E`                    | `#FFFFFF`                 | `1px solid rgba(145 158 171 / 0.16)` | `none`                     | idem                                                |
| `elevation={n>0}`            | idem default                 | idem default              | nenhuma                              | `shadows[n]` (ver Medidas) | idem                                                |

> A borda do `outlined` é override do projeto: o MUI usaria `palette.divider` = `rgba(145 158 171 / 0.2)`;
> aqui é `rgba(145 158 171 / 0.16)`.

### Medidas

| Propriedade                  | Valor bruto                                         | Referência simbólica                                     |
| ---------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| `border-radius` (não-square) | **8px**                                             | `shape.borderRadius`                                     |
| `background-color` light     | `#FFFFFF` → `rgb(255,255,255)`                      | `palette.background.paper`                               |
| `background-color` dark      | `#1C252E` → `rgb(28,37,46)`                         | `palette.background.paper` (dark)                        |
| `color` light                | `#1C252E` → `rgb(28,37,46)`                         | `palette.text.primary`                                   |
| `color` dark                 | `#FFFFFF` → `rgb(255,255,255)`                      | `palette.text.primary` (dark)                            |
| `background-image`           | **`none`** (override do projeto)                    | —                                                        |
| `transition`                 | `box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` | `transitions.create('box-shadow')` (duration `standard`) |
| `border` (outlined)          | `1px solid rgba(145 158 171 / 0.16)`                | `varAlpha(grey.500Channel, 0.16)`                        |
| `elevation` default          | `0`                                                 | —                                                        |

**Sombras por elevação** (light — trocar `145 158 171` por `0 0 0` no dark):

| n    | box-shadow bruto                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| 0    | `none`                                                                                                                         |
| 1    | `0px 2px 1px -1px rgba(145 158 171 / 0.2), 0px 1px 1px 0px rgba(145 158 171 / 0.14), 0px 1px 3px 0px rgba(145 158 171 / 0.12)` |
| 2–24 | mesma geometria do MUI 7.0.1, com as três camadas nas opacidades `0.2 / 0.14 / 0.12` e a cor base acima                        |

### Regras de uso observadas

- **Nenhuma superfície do projeto usa a sombra padrão de `Paper`.** Quem precisa de sombra a declara:
  `Card` usa `customShadows.card`, `Dialog` usa `customShadows.dialog`, `Popover`/`Menu` usam
  `customShadows.dropdown`, `Drawer` usa uma sombra direcional própria. Por isso `elevation: 0` é o default.
- `background-image: none` no root serve para **anular o overlay de elevação do dark mode** do MUI
  (`--Paper-overlay`), que clareia superfícies conforme a elevação. No dark deste projeto, o `paper` é
  sempre `#1C252E`, independentemente da elevação.
- `outlined` e `elevation` são mutuamente exclusivos no MUI: `outlined` não emite `box-shadow`.

### Origem

| Fato                                       | Arquivo:linha                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| `elevation: 0` default                     | `frontend/src/theme/core/components/paper.tsx:11`                              |
| `backgroundImage: 'none'`                  | `frontend/src/theme/core/components/paper.tsx:17`                              |
| borda do `outlined`                        | `frontend/src/theme/core/components/paper.tsx:19-20`                           |
| bg/color/transition/radius base            | default MUI 7.0.1 (`frontend/node_modules/@mui/material/Paper/Paper.js:47-70`) |
| `shape.borderRadius = 8`                   | `frontend/src/theme/create-theme.ts:35`                                        |
| cor das `shadows[0..24]`                   | `frontend/src/theme/core/shadows.ts:11-48`                                     |
| paleta `background.paper` / `text.primary` | `frontend/src/theme/core/palette.ts:91-100`                                    |

---

## Card

`Card` = `Paper` + `overflow: hidden` (MUI) + sombra/raio/z-index do projeto.

### Anatomia

```
┌─ .MuiCard-root ───────────────────────────────────────┐
│  position: relative · z-index: 0 · overflow: hidden   │
│  border-radius: 16px · box-shadow: customShadows.card │
│                                                       │
│  ┌─ .MuiCardHeader-root ───────────────────────────┐  │
│  │ [avatar] [title (h6) / subheader (body2)] [act] │  │  padding 24px 24px 0
│  └─────────────────────────────────────────────────┘  │
│  ┌─ .MuiCardContent-root ──────────────────────────┐  │
│  │  conteúdo                                        │ │  padding 24px
│  └─────────────────────────────────────────────────┘  │
│  ┌─ .MuiCardActions-root ──────────────────────────┐  │  (sem override no projeto)
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

### Variantes e tamanhos

`Card` **não tem variantes customizadas** no projeto. Herda as de `Paper`:

| Variante              | Resultado efetivo                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| default (`elevation`) | sombra `customShadows.card` (declarada no root do Card, sobrescreve a de `Paper`)                                       |
| `variant="outlined"`  | `border: 1px solid rgba(145 158 171 / 0.16)`; a sombra `customShadows.card` **continua aplicada** pelo override do Card |
| `raised`              | prop do MUI (`elevation={8}`); sem efeito visual sobre a sombra, pois o Card declara `boxShadow` fixo                   |

Não há tamanhos (`size`) — o Card se ajusta ao conteúdo.

### Tabela de estados

`Card` não é interativo por padrão (sem hover/focus/active próprios).

| Estado             | Fundo     | Texto     | Borda                                | Sombra                                                                         | Transição                                           |
| ------------------ | --------- | --------- | ------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| default (light)    | `#FFFFFF` | `#1C252E` | nenhuma                              | `0 0 2px 0 rgba(145 158 171 / 0.2), 0 12px 24px -4px rgba(145 158 171 / 0.12)` | `box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` |
| default (dark)     | `#1C252E` | `#FFFFFF` | nenhuma                              | `0 0 2px 0 rgba(0 0 0 / 0.2), 0 12px 24px -4px rgba(0 0 0 / 0.12)`             | idem                                                |
| `outlined` (light) | `#FFFFFF` | `#1C252E` | `1px solid rgba(145 158 171 / 0.16)` | mesma sombra do default                                                        | idem                                                |

⚠️ **NÃO CONFIRMADO**: não há estado `hover`/`selected` de Card no design system. Cards clicáveis existentes
no app declaram o próprio hover localmente, fora do tema — não é regra do DS.

### Medidas

| Propriedade          | Valor bruto                                                                    | Referência simbólica        |
| -------------------- | ------------------------------------------------------------------------------ | --------------------------- |
| `border-radius`      | **16px**                                                                       | `shape.borderRadius × 2`    |
| `box-shadow` (light) | `0 0 2px 0 rgba(145 158 171 / 0.2), 0 12px 24px -4px rgba(145 158 171 / 0.12)` | `customShadows.card`        |
| `box-shadow` (dark)  | `0 0 2px 0 rgba(0 0 0 / 0.2), 0 12px 24px -4px rgba(0 0 0 / 0.12)`             | `customShadows.card` (dark) |
| `position`           | `relative`                                                                     | —                           |
| `z-index`            | **0**                                                                          | —                           |
| `overflow`           | `hidden`                                                                       | default MUI                 |
| `background-color`   | `#FFFFFF` light / `#1C252E` dark                                               | herdado de `Paper`          |

### Regras de uso observadas

- `z-index: 0` está no código com comentário explícito: _"Fix Safari overflow: hidden with border radius"_ —
  cria um stacking context para o Safari respeitar `overflow: hidden` combinado com `border-radius`.
- `position: relative` existe para permitir posicionamento absoluto de badges/labels dentro do Card
  (padrão usado nas telas do app).
- Existe um caminho **inativo** que adicionaria `boxShadow: customShadows.z1` ao Card: só é aplicado quando
  `settings.contrast === 'hight'`. O default é `contrast: 'default'` → **não aplicado**.
- O raio de 16px é o mesmo do `Dialog` e do `Skeleton variant="rounded"` — é o "raio de superfície grande"
  do sistema (o raio base 8px fica para controles).

### Origem

| Fato                                                                              | Arquivo:linha                                                                        |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `boxShadow: customShadows.card`                                                   | `frontend/src/theme/core/components/card.tsx:12`                                     |
| `borderRadius: 8 × 2 = 16px`                                                      | `frontend/src/theme/core/components/card.tsx:13`                                     |
| `zIndex: 0` + comentário Safari                                                   | `frontend/src/theme/core/components/card.tsx:14`                                     |
| `position: relative`                                                              | `frontend/src/theme/core/components/card.tsx:11`                                     |
| valor de `customShadows.card`                                                     | `frontend/src/theme/core/custom-shadows.ts:50`                                       |
| `overflow: hidden`                                                                | default MUI 7.0.1 (`node_modules/@mui/material/Card/Card.js:34`)                     |
| override condicional por `contrast` (`contrast === 'hight'` → `customShadows.z1`) | `frontend/src/theme/with-settings/update-components.ts:34-52` (condição em `:46-48`) |
| `contrast: 'default'`                                                             | `frontend/src/components/settings/settings-config.ts:13`                             |

---

## CardHeader

### Anatomia

```
.MuiCardHeader-root  (display:flex; align-items:center; padding 24px 24px 0)
├── .MuiCardHeader-avatar    (flex 0 0 auto; margin-right 16px)   [opcional]
├── .MuiCardHeader-content   (flex 1 1 auto)
│   ├── title      → <Typography variant="h6">
│   └── subheader  → <Typography variant="body2"> + margin-top 4px
└── .MuiCardHeader-action    (flex 0 0 auto; align-self flex-start) [opcional]
```

### Variantes e tamanhos

Sem variantes. A tipografia de `title` e `subheader` é fixada por `defaultProps` e pode ser trocada
caso a caso via `titleTypographyProps` / `subheaderTypographyProps`.

| Slot        | Variante tipográfica | font-size                                                     | weight  | line-height                  |
| ----------- | -------------------- | ------------------------------------------------------------- | ------- | ---------------------------- |
| `title`     | `h6`                 | `1.0625rem` = **14,875px** (≥600px: `1.125rem` = **15,75px**) | **600** | `1.5555555555555556` (28/18) |
| `subheader` | `body2`              | `0.875rem` = **12,25px**                                      | **400** | `1.5714285714285714` (22/14) |

### Tabela de estados

Não interativo — apenas o estado default.

| Estado          | Fundo                                 | Texto (title) | Texto (subheader)                             | Borda   | Sombra  | Transição |
| --------------- | ------------------------------------- | ------------- | --------------------------------------------- | ------- | ------- | --------- |
| default (light) | transparente (herda o Card `#FFFFFF`) | `#1C252E`     | `#1C252E` (herda; **não** é `text.secondary`) | nenhuma | nenhuma | nenhuma   |
| default (dark)  | transparente (herda `#1C252E`)        | `#FFFFFF`     | `#FFFFFF`                                     | nenhuma | nenhuma | nenhuma   |

> ⚠️ O `subheader` do MUI recebe `color: text.secondary` **apenas** quando renderizado pelo slot padrão de
> Typography do CardHeader. Como o projeto substitui `subheaderTypographyProps`, a cor efetiva **não foi
> medida** → ⚠️ NÃO CONFIRMADO (o override não declara `color`).

### Medidas

| Propriedade              | Valor bruto                                                | Referência simbólica            |
| ------------------------ | ---------------------------------------------------------- | ------------------------------- |
| `padding`                | **`24px 24px 0`** (top 24 / right 24 / bottom 0 / left 24) | `theme.spacing(3, 3, 0)`        |
| `display`                | `flex`                                                     | default MUI                     |
| `align-items`            | `center`                                                   | default MUI                     |
| `subheader` `margin-top` | **4px**                                                    | valor literal no `defaultProps` |
| avatar `margin-right`    | **16px**                                                   | default MUI                     |

### Regras de uso observadas

- `padding-bottom: 0` é intencional: o espaçamento vertical entre header e conteúdo é responsabilidade do
  `CardContent` (que traz 24px de padding-top). Header + Content encostados produzem 24px de respiro, não 48px.
- O `title` usar `h6` (peso 600, ~14,9px) e não `subtitle1`/`h5` é a razão de os títulos de card do app
  parecerem "pequenos e pesados" em vez de grandes.

### Origem

| Fato                                                                | Arquivo:linha                                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `titleTypographyProps: { variant: 'h6' }`                           | `frontend/src/theme/core/components/card.tsx:26`                                |
| `subheaderTypographyProps: { variant: 'body2', marginTop: '4px' }`  | `frontend/src/theme/core/components/card.tsx:27`                                |
| `padding: theme.spacing(3, 3, 0)`                                   | `frontend/src/theme/core/components/card.tsx:33`                                |
| `display:flex / align-items:center / padding:16` (base sobrescrita) | default MUI 7.0.1 (`node_modules/@mui/material/CardHeader/CardHeader.js:44-46`) |
| tipografia `h6` / `body2`                                           | `frontend/src/theme/core/typography.ts:87-92` e `:107-110`                      |

---

## CardContent

### Anatomia

```
.MuiCardContent-root  (bloco simples; padding 24px)
```

### Variantes e tamanhos

Sem variantes e sem tamanhos.

### Tabela de estados

| Estado  | Fundo                       | Texto                                      | Borda   | Sombra  | Transição |
| ------- | --------------------------- | ------------------------------------------ | ------- | ------- | --------- |
| default | transparente (herda o Card) | herdado (`#1C252E` light / `#FFFFFF` dark) | nenhuma | nenhuma | nenhuma   |

### Medidas

| Propriedade                    | Valor bruto               | Referência simbólica |
| ------------------------------ | ------------------------- | -------------------- |
| `padding`                      | **24px** (todos os lados) | `theme.spacing(3)`   |
| `:last-child` `padding-bottom` | **24px**                  | ⚠️ ver observação    |

> O MUI aplica `&:last-child { padding-bottom: 24px }` sobre um padding base de 16px. Como o projeto eleva o
> padding base para 24px, a regra do último filho passa a coincidir com o valor base — o resultado é 24px
> uniforme em todos os lados, inclusive no último `CardContent`.

### Regras de uso observadas

- 24px é o **padding canônico de superfície** do sistema: aparece igual em `CardContent`, `DialogTitle`,
  `DialogContent` (horizontal) e `DialogActions`.
- Combinado com `CardHeader` (`24px 24px 0`), produz uma grade vertical consistente de 24px.

### Origem

| Fato                                  | Arquivo:linha                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| `padding: theme.spacing(3)`           | `frontend/src/theme/core/components/card.tsx:42`                                  |
| `padding: 16` base + `:last-child` 24 | default MUI 7.0.1 (`node_modules/@mui/material/CardContent/CardContent.js:32-34`) |
| `--spacing: 8px`                      | default MUI, sem override (`.ds-extract/FATOS.md` §5.1)                           |

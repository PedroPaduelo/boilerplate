# Componentes — Tabela (MUI Table + componentes próprios)

Existem **duas** tabelas no projeto: a `Table` do MUI (documentada aqui) e a `DataGrid` do MUI X
(ver `data-grid.md`). Elas não compartilham estilos — são sistemas separados com aparências parecidas.

> `rem` renderiza a **14px**. `theme.spacing(n)` = `calc(n * var(--spacing))`, `--spacing: 8px`.

---

## TableContainer

### Anatomia

```
.MuiTableContainer-root   width 100% · overflow-x auto · position relative
                          scrollbar fina (scrollbar-width: thin)
```

### Variantes e tamanhos

Sem variantes.

### Tabela de estados

| Estado  | Fundo                                                | Texto   | Borda   | Sombra  | Transição |
| ------- | ---------------------------------------------------- | ------- | ------- | ------- | --------- |
| default | transparente (herda o `Card`/`Paper` em que estiver) | herdado | nenhuma | nenhuma | nenhuma   |

### Medidas

| Propriedade               | Valor bruto                                                              | Referência simbólica                |
| ------------------------- | ------------------------------------------------------------------------ | ----------------------------------- |
| `width`                   | `100%`                                                                   | default MUI                         |
| `overflow-x`              | `auto`                                                                   | default MUI                         |
| `position`                | `relative`                                                               | override do projeto                 |
| `scrollbar-width`         | **`thin`**                                                               | override                            |
| `scrollbar-color` (light) | **`rgba(145 158 171 / 0.4) rgba(145 158 171 / 0.08)`** (polegar, trilho) | `text.disabledChannel` @ 0.4 / 0.08 |
| `scrollbar-color` (dark)  | **`rgba(99 115 129 / 0.4) rgba(99 115 129 / 0.08)`**                     | `text.disabled` dark = `#637381`    |

### Regras de uso observadas

- `position: relative` existe para ancorar o `TableSelectedAction` (barra de seleção com
  `position: absolute`) sobre o cabeçalho.
- A scrollbar fina é a **mesma receita** usada no `DataGrid` (`scrollbarWidth: thin` + mesmo
  `scrollbarColor`), mas **diferente** do `Scrollbar` (simplebar) usado nas demais áreas do app.

### Origem

| Fato                                             | Arquivo:linha                                                                           |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `position/scrollbarWidth/scrollbarColor`         | `frontend/src/theme/core/components/table.tsx:15-19`                                    |
| `width: 100%`, `overflow-x: auto`                | default MUI 7.0.1 (`node_modules/@mui/material/TableContainer/TableContainer.js:32-33`) |
| `text.disabled` light `#919EAB` / dark `#637381` | `frontend/src/theme/core/palette.ts:91-94`                                              |

---

## Table

### Anatomia

```
.MuiTable-root  <table>   display table · width 100% · border-collapse collapse
                          --palette-TableCell-border: var(--palette-divider)
├── <thead> .MuiTableHead-root
├── <tbody> .MuiTableBody-root
└── <tfoot> .MuiTableFooter-root
```

### Variantes e tamanhos

| Prop           | Valores                                  | Efeito                                                      |
| -------------- | ---------------------------------------- | ----------------------------------------------------------- |
| `size`         | `medium` (default) / `small`             | muda o padding das células (ver `TableCell`)                |
| `stickyHeader` | `false` (default) / `true`               | `border-collapse: separate` + estilo próprio de `TableCell` |
| `padding`      | `normal` (default) / `checkbox` / `none` | propagado às células                                        |

### Tabela de estados

| Estado  | Fundo        | Texto   | Borda                                                     | Sombra  | Transição |
| ------- | ------------ | ------- | --------------------------------------------------------- | ------- | --------- |
| default | transparente | herdado | `border-collapse: collapse` (as bordas ficam nas células) | nenhuma | nenhuma   |

### Medidas

| Propriedade                             | Valor bruto                                              | Referência simbólica |
| --------------------------------------- | -------------------------------------------------------- | -------------------- |
| `--palette-TableCell-border`            | **`var(--palette-divider)`** = `rgba(145 158 171 / 0.2)` | `palette.divider`    |
| `display` / `width` / `border-collapse` | `table` / `100%` / `collapse`                            | default MUI          |
| `border-collapse` com `stickyHeader`    | `separate`                                               | default MUI          |

### Regras de uso observadas

- **O único job do override de `MuiTable` é redefinir a cor da borda das células.** O MUI calcularia
  `--palette-TableCell-border` clareando o `divider` em 88% (light) — no tema deste projeto esse cálculo
  **falha**, porque `divider` está na sintaxe `rgba(R G B / a)` (CSS Color 4) e o parser do MUI não a
  entende. O valor computado global fica `rgba(241, NaN, NaN, 1)` (inválido).
- Dentro de `<Table>`, a variável é redefinida e tudo funciona: bordas em `rgba(145 158 171 / 0.2)`.
- ⚠️ **NÃO CONFIRMADO**: o efeito visual de um `TableCell` **fora** de um `<Table>` (caso do
  `TablePagination` com `component="div"`, que é um `TableCell` por dentro) não foi medido em runtime.
  Pela regra do CSS, um valor inválido em `border-bottom-color` descarta a declaração — mas isso não foi
  verificado no navegador.

### Origem

| Fato                                                           | Arquivo:linha                                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--palette-TableCell-border: divider`                          | `frontend/src/theme/core/components/table.tsx:30`                                                                        |
| base `display/width/borderCollapse`, `stickyHeader → separate` | default MUI 7.0.1 (`node_modules/@mui/material/Table/Table.js:42-58`)                                                    |
| valor computado inválido de `TableCell.border`                 | tema computado (`frontend/.ds-extract/theme.json` → `computed.paletteLight.TableCell.border = "rgba(241, NaN, NaN, 1)"`) |
| `divider = rgba(145 158 171 / 0.2)`                            | `frontend/src/theme/core/palette.ts:131`                                                                                 |

---

## TableRow

### Anatomia

```
.MuiTableRow-root  <tr>   display table-row · vertical-align middle · color inherit · outline 0
```

### Variantes e tamanhos

Sem variantes de tamanho. Props: `hover`, `selected`.

### Tabela de estados

| Estado                             | Fundo                                                        | Texto                                      | Borda                                                     | Sombra  | Transição |
| ---------------------------------- | ------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------------------- | ------- | --------- |
| default                            | transparente                                                 | herdado (`#1C252E` light / `#FFFFFF` dark) | borda **na célula**: `1px dashed rgba(145 158 171 / 0.2)` | nenhuma | nenhuma   |
| hover (com prop `hover`)           | `rgba(145 158 171 / 0.08)`                                   | idem                                       | idem                                                      | nenhuma | nenhuma   |
| **selected**                       | **`rgba(0 120 103 / 0.04)`** — base `primary.dark` `#007867` | idem                                       | idem                                                      | nenhuma | nenhuma   |
| **selected + hover**               | **`rgba(0 120 103 / 0.08)`**                                 | idem                                       | idem                                                      | nenhuma | nenhuma   |
| **última linha** (`:last-of-type`) | conforme acima                                               | idem                                       | **`border-color: transparent`** em todas as suas células  | nenhuma | nenhuma   |

> O MUI usaria `rgba(<primary.main> / 0.08)` para `selected` (verde `#00A76F` a 8%). O projeto troca a base
> para `primary.dark` (`#007867`) e reduz a opacidade para **0.04**, resultando num verde muito mais discreto.

### Medidas

| Propriedade                              | Valor bruto                  | Referência simbólica                  |
| ---------------------------------------- | ---------------------------- | ------------------------------------- |
| `display` / `vertical-align` / `outline` | `table-row` / `middle` / `0` | default MUI                           |
| fundo `selected`                         | `rgba(0 120 103 / 0.04)`     | `varAlpha(primary.darkChannel, 0.04)` |
| fundo `selected:hover`                   | `rgba(0 120 103 / 0.08)`     | `varAlpha(primary.darkChannel, 0.08)` |
| fundo `hover` (prop `hover`)             | `rgba(145 158 171 / 0.08)`   | `action.hover`                        |
| `:last-of-type .MuiTableCell-root`       | `border-color: transparent`  | override                              |

### Regras de uso observadas

- A **última linha não tem borda**: o rodapé da tabela nunca ganha um traço extra antes da paginação.
- O `hover` **não é automático** — depende da prop `hover` no `<TableRow>` do MUI.

### Origem

| Fato                                                             | Arquivo:linha                                                               |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `selected` + `selected:hover`                                    | `frontend/src/theme/core/components/table.tsx:42-45`                        |
| `:last-of-type` sem borda                                        | `frontend/src/theme/core/components/table.tsx:46`                           |
| base `display/vertical-align/color/outline`, `hover`, `selected` | default MUI 7.0.1 (`node_modules/@mui/material/TableRow/TableRow.js:46-58`) |
| `primary.dark = #007867` (canal `0 120 103`)                     | `frontend/src/theme/theme-config.ts:47-108`                                 |

---

## TableCell

### Anatomia

```
.MuiTableCell-root  <td> / <th>
  typography body2 · display table-cell · vertical-align inherit
  text-align left · padding 16px
  border-bottom: 1px dashed var(--palette-TableCell-border)
  [variant="head"]   → bg background.neutral · 12,25px* · weight 600 · color text.secondary
  [stickyHeader]     → bg background.paper + linear-gradient(neutral, neutral)
  [padding="checkbox"] → width 48px · padding 0 0 0 8px
```

\* ver observação sobre `fontSize: 14` em px puro.

### Variantes e tamanhos

| Variante (`variant`) | Cor do texto                                 | Peso    | line-height                        | font-size                         |
| -------------------- | -------------------------------------------- | ------- | ---------------------------------- | --------------------------------- |
| `body` (default)     | `#1C252E` (light) / `#FFFFFF` (dark)         | 400     | `1.5714285714285714` → **19,25px** | `0.875rem` = **12,25px**          |
| `head`               | **`#637381`** (light) / **`#919EAB`** (dark) | **600** | `1.5rem` = **21px**                | **`14px`** (px puro — não escala) |
| `footer`             | `#637381` (light)                            | 400     | `1.3125rem` = **18,375px**         | `0.75rem` = **10,5px**            |

| Tamanho (`size`)   | `padding`                 |
| ------------------ | ------------------------- |
| `medium` (default) | **16px** (todos os lados) |
| `small`            | **`6px 16px`**            |

| `padding` (prop)            | Resultado                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `normal` (default)          | conforme `size`                                                                                                     |
| `checkbox`                  | `width: 48px`; `padding: 0` nos três lados e **`padding-left: 8px`** (override do projeto; o MUI usaria 4px)        |
| `checkbox` + `size="small"` | `width: 24px`; `padding: 0 12px 0 16px` do MUI, com `padding-left: 8px` do projeto por cima; `& > * { padding: 0 }` |
| `none`                      | `padding: 0`                                                                                                        |

### Tabela de estados

`TableCell` não tem estados próprios (hover/selected pertencem à linha).

| Estado                | Fundo                                                                                                           | Texto                 | Borda                                               | Sombra  | Transição |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------- | ------- | --------- |
| body (light)          | transparente                                                                                                    | `#1C252E`             | `border-bottom: 1px dashed rgba(145 158 171 / 0.2)` | nenhuma | nenhuma   |
| head (light)          | **`#F4F6F8`** (rgb(244,246,248))                                                                                | `#637381`, weight 600 | idem                                                | nenhuma | nenhuma   |
| head (dark)           | **`#28323D`** (rgb(40,50,61))                                                                                   | `#919EAB`, weight 600 | idem                                                | nenhuma | nenhuma   |
| head + `stickyHeader` | `#FFFFFF` (`background.paper`) **coberto** por `background-image: linear-gradient(to bottom, #F4F6F8, #F4F6F8)` | idem                  | idem                                                | nenhuma | nenhuma   |
| última linha          | conforme acima                                                                                                  | idem                  | `border-color: transparent`                         | nenhuma | nenhuma   |

### Medidas

| Propriedade                           | Valor bruto                                                                                   | Referência simbólica         |
| ------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------- |
| `padding` (medium)                    | **16px**                                                                                      | default MUI                  |
| `padding` (small)                     | **`6px 16px`**                                                                                | default MUI                  |
| `padding-left` (`padding="checkbox"`) | **8px**                                                                                       | `theme.spacing(1)`           |
| `width` (`padding="checkbox"`)        | **48px** (24px se `size="small"`)                                                             | default MUI                  |
| `border-bottom`                       | **`1px dashed rgba(145 158 171 / 0.2)`** (width e cor do MUI; **estilo `dashed` do projeto**) | `--palette-TableCell-border` |
| `text-align`                          | `left`                                                                                        | default MUI                  |
| `vertical-align`                      | `inherit`                                                                                     | default MUI                  |
| head: `font-size`                     | **14px** (valor em px puro, **não** afetado pela base rem de 14px)                            | override                     |
| head: `line-height`                   | `1.5rem` = **21px**                                                                           | `pxToRem(24)` (default MUI)  |
| head: `background-color`              | `#F4F6F8` light / `#28323D` dark                                                              | `background.neutral`         |
| body: `font-size` / `line-height`     | `0.875rem` = **12,25px** / **19,25px**                                                        | `typography.body2`           |

**Altura resultante da célula** — derivação aritmética dos valores acima (⚠️ **NÃO CONFIRMADO**: não foi
medida em runtime):

| Célula                | Cálculo         | Altura        |
| --------------------- | --------------- | ------------- |
| body, `size="medium"` | 16 + 19,25 + 16 | ≈ **51,25px** |
| body, `size="small"`  | 6 + 19,25 + 6   | ≈ **31,25px** |
| head, `size="medium"` | 16 + 21 + 16    | ≈ **53px**    |
| head, `size="small"`  | 6 + 21 + 6      | ≈ **33px**    |

### Regras de uso observadas

- **`fontSize: 14` no head é o único texto do sistema declarado em px puro dentro do tema.** Como a base rem
  é 14px, o cabeçalho (14px) fica **maior** que o corpo da tabela (12,25px) — provavelmente não intencional,
  já que em rem a intenção seria `pxToRem(14)` = 12,25px. Registrado como fato.
- O `stickyHeader` usa `background-image: linear-gradient(neutral, neutral)` em cima de
  `background-color: background.paper`: é um truque para o cabeçalho fixo não ficar translúcido enquanto as
  linhas passam por baixo.
- A borda tracejada de 1px é a assinatura visual da tabela — igual à do `DialogContent dividers` e à do
  `DataGrid`.

### Origem

| Fato                                                                                | Arquivo:linha                                                                  |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `root: { borderBottomStyle: 'dashed' }`                                             | `frontend/src/theme/core/components/table.tsx:58`                              |
| head (fontSize 14 / color / weight 600 / bg neutral)                                | `frontend/src/theme/core/components/table.tsx:59-64`                           |
| `stickyHeader` (paper + linear-gradient neutral)                                    | `frontend/src/theme/core/components/table.tsx:65-68`                           |
| `paddingCheckbox: { paddingLeft: spacing(1) }`                                      | `frontend/src/theme/core/components/table.tsx:69`                              |
| base (`typography.body2`, `padding 16`, `borderBottom 1px solid`, `textAlign left`) | default MUI 7.0.1 (`node_modules/@mui/material/TableCell/TableCell.js:49-57`)  |
| variantes head/body/footer                                                          | default MUI 7.0.1 (`node_modules/@mui/material/TableCell/TableCell.js:58-82`)  |
| `size="small"` e `padding="checkbox"/"none"`                                        | default MUI 7.0.1 (`node_modules/@mui/material/TableCell/TableCell.js:83-113`) |
| `background.neutral` = `#F4F6F8` / `#28323D`                                        | `frontend/src/theme/core/palette.ts:97-100`                                    |

---

## TablePagination

### Anatomia

```
.MuiTablePagination-root   ← TableCell · width 100% · overflow auto · font-size 12,25px
└── .MuiTablePagination-toolbar   height 64px · padding-right 2px
    ├── .MuiTablePagination-spacer        flex 1 1 100%
    ├── .MuiTablePagination-selectLabel   body2 · flex-shrink 0
    ├── .MuiTablePagination-select        (Select) margin-left 8px · margin-right 32px
    │     ├── .MuiTablePagination-select (inner)  padding-left 8px · padding-right 24px
    │     └── .MuiTablePagination-selectIcon      16×16px · right 4px · top calc(50% - 8px)
    ├── .MuiTablePagination-displayedRows  body2 · flex-shrink 0
    └── .MuiTablePagination-actions        flex-shrink 0 · margin-left 20px · margin-right 8px
          └── IconButton size="small" ×2
```

### Variantes e tamanhos

Sem variantes. Defaults do projeto: botões de navegação em `size="small"`; o `select` recebe
`name="table-pagination-select"`.

### Tabela de estados

| Estado                       | Fundo        | Texto                                            | Borda                                                    | Sombra  | Transição                                 |
| ---------------------------- | ------------ | ------------------------------------------------ | -------------------------------------------------------- | ------- | ----------------------------------------- |
| default                      | transparente | `#1C252E` (light) / `#FFFFFF` (dark)             | herda `border-bottom` de `TableCell` (ver ⚠️ em `Table`) | nenhuma | nenhuma                                   |
| select em foco               | transparente | idem                                             | —                                                        | nenhuma | `border-radius: 8px` aplicado ao `:focus` |
| botão de página desabilitado | transparente | `opacity` do `IconButton` disabled (default MUI) | —                                                        | —       | —                                         |

### Medidas

| Propriedade                                               | Valor bruto                                                   | Referência simbólica                  |
| --------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------- |
| root: `width`                                             | **100%**                                                      | override                              |
| root: `font-size`                                         | `0.875rem` = **12,25px**                                      | `pxToRem(14)` (default MUI)           |
| root: `overflow`                                          | `auto`                                                        | default MUI                           |
| toolbar: `height`                                         | **64px** (o `min-height: 52px` do MUI permanece, mas é menor) | override                              |
| toolbar: `padding-right`                                  | `2px`                                                         | default MUI                           |
| `actions`: `margin-left` / `margin-right`                 | `20px` (MUI) / **8px** (projeto)                              | —                                     |
| `select` (Select externo): `margin-left` / `margin-right` | `8px` / `32px`                                                | default MUI                           |
| `select` (inner): `padding-left`                          | **8px**                                                       | override (coincide com o default MUI) |
| `select` (inner): `padding-right`                         | `24px`                                                        | default MUI                           |
| `select` (inner): `display` / `align-items`               | `flex` / `center`                                             | override                              |
| `select:focus`: `border-radius`                           | **8px**                                                       | `shape.borderRadius`                  |
| `selectIcon`: `width` / `height`                          | **16px / 16px**                                               | override                              |
| `selectIcon`: `right` / `top`                             | **4px** / `calc(50% - 8px)`                                   | override                              |
| `selectLabel` e `displayedRows`                           | `0.875rem` = **12,25px**, weight 400, line-height **19,25px** | `typography.body2`                    |

### Regras de uso observadas

- A toolbar de 64px é **12px mais alta** que a do MUI (52px), alinhando-se à altura do header mobile do
  layout (64px) e à grade de 8px.
- `top: calc(50% - 8px)` centraliza verticalmente um ícone de 16px — é o cálculo manual equivalente a
  `transform: translateY(-50%)`.

### Origem

| Fato                                                                                    | Arquivo:linha                                                                                  |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| defaults (`backIconButtonProps`, `nextIconButtonProps`, `slotProps.select`)             | `frontend/src/theme/core/components/table.tsx:79-83`                                           |
| `root: { width: '100%' }`                                                               | `frontend/src/theme/core/components/table.tsx:93`                                              |
| `toolbar: { height: 64 }`                                                               | `frontend/src/theme/core/components/table.tsx:90`                                              |
| `actions: { marginRight: 8 }`                                                           | `frontend/src/theme/core/components/table.tsx:93`                                              |
| `select` (paddingLeft 8, flex, `:focus` radius 8)                                       | `frontend/src/theme/core/components/table.tsx:92-97`                                           |
| `selectIcon` (right 4, 16×16, top calc)                                                 | `frontend/src/theme/core/components/table.tsx:98-103`                                          |
| base root (`overflow auto`, `pxToRem(14)`, `:last-child padding 0`)                     | default MUI 7.0.1 (`node_modules/@mui/material/TablePagination/TablePagination.js:38-44`)      |
| base toolbar (`minHeight 52`, `paddingRight 2`, `actions marginLeft 20`)                | default MUI 7.0.1 (`node_modules/@mui/material/TablePagination/TablePagination.js:56-68`)      |
| base select (`marginLeft 8`, `marginRight 32`, inner `paddingLeft 8 / paddingRight 24`) | default MUI 7.0.1 (`node_modules/@mui/material/TablePagination/TablePagination.js:96-108`)     |
| base `selectLabel` / `displayedRows` (`typography.body2`)                               | default MUI 7.0.1 (`node_modules/@mui/material/TablePagination/TablePagination.js:84`, `:121`) |

---

# Componentes próprios de tabela (`frontend/src/components/table/`)

Sete arquivos exportados por `frontend/src/components/table/index.ts:1-15`:
`utils`, `use-table`, `table-no-data`, `table-skeleton`, `table-empty-rows`, `table-head-custom`,
`table-selected-action`, `table-pagination-custom`.

> ⚠️ **NÃO CONFIRMADO**: **não existe** `TableToolbar` em `frontend/src/components/table/`.
> A pasta tem exatamente os arquivos listados acima (verificado por listagem do diretório). Barras de
> filtro/toolbar aparecem implementadas dentro de cada módulo de tela, não no design system.

---

## TableHeadCustom

### Anatomia

```
<TableHead sx={…}>
└── <TableRow>
    ├── [<TableCell padding="checkbox">  → <Checkbox indeterminate/checked>]
    └── <TableCell align={…} sortDirection={…} sx={{ width }}>
        └── [<TableSortLabel hideSortIcon active direction>]
            ├── label
            └── <Box component="span" sx={visuallyHidden}>  ("sorted ascending/descending")
```

### Variantes e tamanhos

Sem variantes visuais próprias — herda 100% do `TableCell variant="head"` (bg `#F4F6F8`, 14px, weight 600).

| Prop                       | Default   | Efeito                                                              |
| -------------------------- | --------- | ------------------------------------------------------------------- |
| `headCells[].align`        | `'left'`  | `text-align` da célula                                              |
| `headCells[].width`        | —         | `width` da célula via `sx`                                          |
| `onSort`                   | —         | quando ausente, renderiza só o texto (sem `TableSortLabel`)         |
| `onSelectAllRows`          | —         | quando presente, injeta a coluna de checkbox (`padding="checkbox"`) |
| `rowCount` / `numSelected` | `0` / `0` | controlam `checked` e `indeterminate`                               |

### Tabela de estados

| Estado                     | Fundo                                | Texto                                                          | Borda                                | Sombra  | Transição |
| -------------------------- | ------------------------------------ | -------------------------------------------------------------- | ------------------------------------ | ------- | --------- |
| default                    | `#F4F6F8` (light) / `#28323D` (dark) | `#637381` / `#919EAB`, 14px, weight 600                        | `1px dashed rgba(145 158 171 / 0.2)` | nenhuma | nenhuma   |
| coluna ordenada (`active`) | idem                                 | herda o estilo `.Mui-active` do `TableSortLabel` (default MUI) | idem                                 | nenhuma | idem      |
| checkbox indeterminado     | idem                                 | —                                                              | idem                                 | nenhuma | —         |

### Medidas

Todas herdadas de `TableCell variant="head"` (ver acima). Estilo local exclusivo:

| Item                                       | Valor bruto                                                                                                                                                            |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `visuallyHidden` (texto de acessibilidade) | `border: 0` · `padding: 0` · `width: 1px` · `height: 1px` · `margin: -1px` · `overflow: hidden` · `position: absolute` · `white-space: nowrap` · `clip: rect(0 0 0 0)` |
| `TableSortLabel`                           | `hideSortIcon` — o ícone de ordenação só aparece no hover/ativo (comportamento MUI)                                                                                    |

### Regras de uso observadas

- O componente **não** estiliza nada: existe para padronizar acessibilidade (`aria-label` no checkbox,
  texto `visuallyHidden` de direção de ordenação) e a API de colunas (`headCells`).
- `hideSortIcon` deixa o cabeçalho limpo: a seta só aparece quando relevante.

### Origem

| Fato                                                             | Arquivo:linha                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `visuallyHidden`                                                 | `frontend/src/components/table/table-head-custom.tsx:12-22`  |
| coluna de checkbox (`padding="checkbox"`, ids de acessibilidade) | `frontend/src/components/table/table-head-custom.tsx:58-74`  |
| células + `TableSortLabel hideSortIcon`                          | `frontend/src/components/table/table-head-custom.tsx:76-105` |

---

## TableNoData

### Anatomia

```
<TableRow>
└── <TableCell colSpan={12}>        (quando notFound)
    └── <EmptyContent filled sx={{ py: 10 }} />
    ou
    <TableCell colSpan={12} sx={{ p: 0 }} />   (quando !notFound)
```

### Variantes e tamanhos

| `notFound` | Resultado                                                     |
| ---------- | ------------------------------------------------------------- |
| `true`     | célula com `EmptyContent filled` e `padding-top/bottom: 80px` |
| `false`    | célula vazia com `padding: 0` (não ocupa espaço)              |

### Tabela de estados

| Estado             | Fundo                                                     | Texto                    | Borda                                                                                    | Sombra  | Transição |
| ------------------ | --------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------- | ------- | --------- |
| vazio (`notFound`) | **`rgba(145 158 171 / 0.04)`** (do `EmptyContent filled`) | título `h6` em `#919EAB` | **`1px dashed rgba(145 158 171 / 0.08)`** (do `EmptyContent filled`) + a borda da célula | nenhuma | nenhuma   |
| com dados          | transparente                                              | —                        | borda da célula                                                                          | nenhuma | nenhuma   |

### Medidas

| Propriedade                                     | Valor bruto                                                                                             | Referência simbólica              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `colSpan`                                       | **12**                                                                                                  | literal                           |
| `padding-top` / `padding-bottom` (EmptyContent) | **80px** cada                                                                                           | `py: 10` → `10 × 8px`             |
| `EmptyContent`: `padding`                       | `0 24px`                                                                                                | `theme.spacing(0, 3)`             |
| `EmptyContent filled`: `border-radius`          | **16px**                                                                                                | `shape.borderRadius × 2`          |
| `EmptyContent filled`: `background-color`       | `rgba(145 158 171 / 0.04)`                                                                              | `varAlpha(grey.500Channel, 0.04)` |
| `EmptyContent filled`: `border`                 | `1px dashed rgba(145 158 171 / 0.08)`                                                                   | `varAlpha(grey.500Channel, 0.08)` |
| `EmptyContent`: imagem                          | `width: 100%`, `max-width: 160px`, `src` default `/assets/icons/empty/ic-content.svg`                   | —                                 |
| `EmptyContent`: título                          | `h6` → `1.0625rem` = **14,875px** (≥600px **15,75px**), weight 600, `color: #919EAB`, `margin-top: 8px` | `text.disabled`                   |
| `EmptyContent`: descrição                       | `body2` → **12,25px**, `color: #919EAB`, `margin-top: 8px`                                              | `text.disabled`                   |

### Regras de uso observadas

- `colSpan={12}` é fixo — assume tabelas com no máximo 12 colunas.
- O estado "sem dados" é uma **caixa tracejada** com ícone, não uma linha de texto: mesma linguagem do
  `dashed` das bordas.

### Origem

| Fato                                                          | Arquivo:linha                                                               |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `TableNoData`                                                 | `frontend/src/components/table/table-no-data.tsx:15-27` (`py: 10` em `:20`) |
| `EmptyContent` (padding, filled, radius, bg, border)          | `frontend/src/components/empty-content/empty-content.tsx:102-117`           |
| imagem `max-width: 160`                                       | `frontend/src/components/empty-content/empty-content.tsx:46-55`             |
| título `h6` / descrição `body2` com `text.disabled` e `mt: 1` | `frontend/src/components/empty-content/empty-content.tsx:57-93`             |

---

## TableSkeleton

### Anatomia

```
Array(rowCount) × <TableRow>
  └── Array(cellCount) × <TableCell>
        └── <Skeleton variant="text" />
```

### Variantes e tamanhos

| Prop        | Default | Efeito                   |
| ----------- | ------- | ------------------------ |
| `rowCount`  | `0`     | número de linhas falsas  |
| `cellCount` | `0`     | número de colunas falsas |

### Tabela de estados

| Estado  | Fundo                                      | Texto | Borda                  | Sombra  | Transição                                  |
| ------- | ------------------------------------------ | ----- | ---------------------- | ------- | ------------------------------------------ |
| loading | `rgba(196 205 213 / 0.12)` (do `Skeleton`) | —     | borda normal da célula | nenhuma | animação `wave`: `2s linear 0.5s infinite` |

### Medidas

| Propriedade                                | Valor bruto                                                         | Referência simbólica              |
| ------------------------------------------ | ------------------------------------------------------------------- | --------------------------------- |
| `Skeleton variant="text"`: `height`        | `auto`, com `transform: scale(1, 0.60)` e `transform-origin: 0 55%` | default MUI                       |
| `Skeleton variant="text"`: `border-radius` | `8px/13.3px` (raio elíptico: `${8}px/${round(8/0.6×10)/10}px`)      | default MUI                       |
| `Skeleton`: `background-color`             | `rgba(196 205 213 / 0.12)`                                          | `varAlpha(grey.400Channel, 0.12)` |
| altura da célula                           | igual à da célula real (padding 16px + conteúdo)                    | —                                 |

> Detalhe: o `variant="text"` **sobrepõe** o default `variant="rounded"` do projeto — logo o skeleton da
> tabela **não** usa o raio de 16px, e sim o raio elíptico do MUI para texto.

### Regras de uso observadas

- Usar `variant="text"` (e não `rounded`) faz o skeleton imitar a linha de texto, respeitando a altura real
  da célula sem inflar a linha.

### Origem

| Fato                                               | Arquivo:linha                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `TableSkeleton`                                    | `frontend/src/components/table/table-skeleton.tsx:14-23` (`variant="text"` em `:19`) |
| `MuiSkeleton` defaults + bg                        | `frontend/src/theme/core/components/skeleton.tsx:11`, `:17-20`                       |
| `variant="text"` base (scale 0.6, radius elíptico) | default MUI 7.0.1 (`node_modules/@mui/material/Skeleton/Skeleton.js:95-103`)         |

---

## TableEmptyRows

### Anatomia

```
<TableRow sx={{ height: height × emptyRows }}>
└── <TableCell colSpan={9} />
```

### Variantes e tamanhos

Retorna `null` quando `emptyRows === 0`.

### Tabela de estados

| Estado  | Fundo        | Texto | Borda                  | Sombra  | Transição |
| ------- | ------------ | ----- | ---------------------- | ------- | --------- |
| default | transparente | —     | borda normal da célula | nenhuma | nenhuma   |

### Medidas

| Propriedade | Valor bruto                                                   |
| ----------- | ------------------------------------------------------------- |
| `height`    | `height × emptyRows` (px; `height` é passado pelo consumidor) |
| `colSpan`   | **9** ⚠️ (diferente do `colSpan={12}` do `TableNoData`)       |

### Regras de uso observadas

- Serve para manter a altura da tabela estável na última página. O `colSpan` divergente (9 vs. 12) é uma
  inconsistência real do código.

### Origem

| Fato                    | Arquivo:linha                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `TableEmptyRows`        | `frontend/src/components/table/table-empty-rows.tsx:13-31` (`colSpan={9}` em `:28`) |
| `emptyRows()` (cálculo) | `frontend/src/components/table/utils.ts:9-11`                                       |

---

## TableSelectedAction

Barra flutuante que aparece **sobre** o cabeçalho quando há linhas selecionadas.

### Anatomia

```
<Box position="absolute" top=0 left=0 width=1 z-index=9>
├── <Checkbox indeterminate/checked>
├── <Typography variant="subtitle2">  "{n} selected"
└── {action}
```

### Variantes e tamanhos

| Variante | `height` | `margin-left` do texto |
| -------- | -------- | ---------------------- |
| normal   | **58px** | **16px** (`ml: 2`)     |
| `dense`  | **38px** | **24px** (`ml: 3`)     |

Renderiza `null` quando `numSelected === 0`.

### Tabela de estados

| Estado  | Fundo                                                | Texto                                                                               | Borda   | Sombra  | Transição |
| ------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- | ------- | ------- | --------- |
| visível | **`#C8FAD6`** (rgb(200,250,214)) — `primary.lighter` | **`#00A76F`** (rgb(0,167,111)) — `primary.main`, `subtitle2` (12,25px / weight 600) | nenhuma | nenhuma | nenhuma   |

### Medidas

| Propriedade                           | Valor bruto                                                                | Referência simbólica   |
| ------------------------------------- | -------------------------------------------------------------------------- | ---------------------- |
| `height`                              | **58px** (dense: **38px**)                                                 | literal                |
| `padding-left` / `padding-right`      | **8px** / **16px**                                                         | `pl: 1` / `pr: 2`      |
| `position` / `top` / `left` / `width` | `absolute` / `0` / `0` / `100%`                                            | —                      |
| `z-index`                             | **9**                                                                      | literal                |
| `background-color`                    | `#C8FAD6`                                                                  | `primary.lighter`      |
| cor do texto                          | `#00A76F`                                                                  | `primary.main`         |
| tipografia do texto                   | `0.875rem` = **12,25px**, weight **600**, line-height `1.5714285714285714` | `typography.subtitle2` |

### Regras de uso observadas

- É a **única superfície do sistema que usa `primary.lighter` como fundo cheio** — sinaliza "modo seleção"
  de forma inequívoca.
- Depende de `position: relative` no `TableContainer` (declarado no override do tema) para se posicionar.
- ⚠️ O texto `"{n} selected"` está **em inglês** no componente (não internacionalizado).

### Origem

| Fato                                                    | Arquivo:linha                                                   |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| Box (pl/pr/top/left/width/z-index/height/bgcolor/dense) | `frontend/src/components/table/table-selected-action.tsx:32-48` |
| `Typography subtitle2` + `color: primary.main` + `ml`   | `frontend/src/components/table/table-selected-action.tsx:65-75` |
| `position: relative` no container                       | `frontend/src/theme/core/components/table.tsx:16`               |

---

## TablePaginationCustom

### Anatomia

```
<Box position="relative">
├── <TablePagination component="div" sx={{ borderTopColor: 'transparent' }} />
└── [<FormControlLabel label="Dense" control={<Switch>} />]   (quando onChangeDense)
```

### Variantes e tamanhos

| Prop                 | Default                                                |
| -------------------- | ------------------------------------------------------ |
| `rowsPerPageOptions` | **`[5, 10, 25]`**                                      |
| `onChangeDense`      | — (quando ausente, o switch "Dense" não é renderizado) |

Defaults relacionados no hook `useTable`: `rowsPerPage = 5`, `page = 0`, `order = 'asc'`,
`orderBy = 'name'`, `dense = false`, `selected = []`.

### Tabela de estados

| Estado  | Fundo        | Texto                          | Borda                                                                              | Sombra  | Transição |
| ------- | ------------ | ------------------------------ | ---------------------------------------------------------------------------------- | ------- | --------- |
| default | transparente | `#1C252E` / `#FFFFFF`, 12,25px | `border-top-color: transparent` (declarado); demais bordas herdadas do `TableCell` | nenhuma | nenhuma   |

### Medidas

| Propriedade                                      | Valor bruto                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| container                                        | `position: relative`                                                     |
| `FormControlLabel` "Dense": `padding-left`       | **16px** (`pl: 2`)                                                       |
| `FormControlLabel` "Dense": `padding-top/bottom` | **12px** cada (`py: 1.5`)                                                |
| `FormControlLabel` "Dense": `position`           | `absolute` a partir de `@media (min-width:600px)`; `static` abaixo disso |
| `FormControlLabel` "Dense": `top`                | `0`                                                                      |
| toolbar                                          | **64px** (herdado do override de `MuiTablePagination`)                   |

### Regras de uso observadas

- O switch "Dense" fica **sobreposto à esquerda** da paginação em telas ≥600px e empilhado abaixo em telas
  menores — por isso o `position: { sm: 'absolute' }`.
- ⚠️ O rótulo `"Dense"` está **em inglês** no componente.

### Origem

| Fato                                                                            | Arquivo:linha                                                     |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `rowsPerPageOptions = [5, 10, 25]`                                              | `frontend/src/components/table/table-pagination-custom.tsx:21`    |
| `Box position: relative`                                                        | `frontend/src/components/table/table-pagination-custom.tsx:25`    |
| `sx={{ borderTopColor: 'transparent' }}`                                        | `frontend/src/components/table/table-pagination-custom.tsx:30`    |
| `FormControlLabel` (pl/py/top/position)                                         | `frontend/src/components/table/table-pagination-custom.tsx:43-48` |
| defaults do `useTable` (`rowsPerPage = 5`, `orderBy = 'name'`, `order = 'asc'`) | `frontend/src/components/table/use-table.ts:42-52`                |

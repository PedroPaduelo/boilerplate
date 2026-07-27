# Componentes — DataGrid (MUI X 7.28.2)

A `DataGrid` é a **segunda** tabela do sistema, independente da `Table` do MUI Core (ver `tabela.md`).
Ela é controlada por um conjunto de **CSS custom properties próprias** (`--DataGrid-*`), que o projeto
redefine no `root`.

> `rem` renderiza a **14px**. `theme.spacing(n)` = `calc(n * var(--spacing))`, `--spacing: 8px`.

---

## DataGrid

### Anatomia

```
.MuiDataGrid-root                       border-width 0 · scrollbar fina
│  --unstable_DataGrid-radius: 0
│  --DataGrid-rowBorderColor: var(--palette-divider)
│  --DataGrid-containerBackground: var(--palette-background-neutral)
│  --unstable_DataGrid-headWeight: 600
├── .MuiDataGrid-toolbarContainer        gap 16px · padding 16px
├── .MuiDataGrid-main
│   ├── .MuiDataGrid-topContainer        ::after { height: 0 }
│   │   └── .MuiDataGrid-columnHeader    font-size 14px · color text.secondary
│   │         ├── .MuiDataGrid-iconButtonContainer   IconButton padding 2px · margin-left 8px
│   │         ├── .MuiDataGrid-menuIcon              IconButton margin 0 8px · padding 2px
│   │         └── .MuiDataGrid-columnSeparator       color var(--DataGrid-rowBorderColor)
│   ├── .MuiDataGrid-virtualScrollerContent
│   │   └── .MuiDataGrid-row
│   │       └── .MuiDataGrid-cell        border-top: dashed
│   │             [--pinnedLeft/--pinnedRight] → ::after (camada de fundo, z-index -1)
│   ├── .MuiDataGrid-filler > div        border-top: dashed
│   └── .MuiDataGrid-overlay             CircularProgress color text.primary
└── .MuiDataGrid-footerContainer         min-height auto · border-top: dashed
    └── .MuiDataGrid-selectedRowCount     display none

Painéis (em Popper/Paper com paperStyles dropdown):
├── .MuiDataGrid-paper                   padding 0
├── .MuiDataGrid-menu .MuiPaper-root     min-width 140px
├── .MuiDataGrid-filterForm              gap 12px · padding 16px
├── .MuiDataGrid-columnsManagementHeader padding 20px 16px 0 16px
├── .MuiDataGrid-columnsManagement       gap 4px · padding 16px 12px
└── .MuiDataGrid-columnsManagementFooter padding 12px · border-top: dashed
```

### CSS custom properties declaradas

Estas são **todas** as variáveis declaradas pelo override (`root`):

| Variável                         | Valor bruto (light)                                                        | Valor bruto (dark)            | Referência simbólica            |
| -------------------------------- | -------------------------------------------------------------------------- | ----------------------------- | ------------------------------- |
| `--unstable_DataGrid-radius`     | **`0`**                                                                    | `0`                           | literal                         |
| `--DataGrid-rowBorderColor`      | **`rgba(145 158 171 / 0.2)`** (via `var(--palette-divider)`)               | `rgba(145 158 171 / 0.2)`     | `palette.divider`               |
| `--DataGrid-containerBackground` | **`#F4F6F8`** → rgb(244,246,248) (via `var(--palette-background-neutral)`) | **`#28323D`** → rgb(40,50,61) | `palette.background.neutral`    |
| `--unstable_DataGrid-headWeight` | **`600`**                                                                  | `600`                         | `typography.fontWeightSemiBold` |

Variáveis **consumidas** (mas não declaradas) pelo override:

| Onde                           | Uso                                            |
| ------------------------------ | ---------------------------------------------- |
| `.MuiDataGrid-withBorderColor` | `border-color: var(--DataGrid-rowBorderColor)` |
| `.MuiDataGrid-columnSeparator` | `color: var(--DataGrid-rowBorderColor)`        |

### Variantes e tamanhos

A `DataGrid` não tem variantes de tema. Os _defaults de slot_ declarados pelo projeto são:

| Slot / prop      | Valor default do projeto               |
| ---------------- | -------------------------------------- |
| `basePopper`     | `placement: 'bottom-end'`              |
| `baseChip`       | `size: 'small'`                        |
| `baseSwitch`     | `size: 'small'`                        |
| `baseCheckbox`   | `size: 'small'`, `disableRipple: true` |
| `baseInputLabel` | `shrink: true`                         |
| `baseTextField`  | `variant: 'outlined'`                  |
| `baseSelect`     | `native: true`, `variant: 'outlined'`  |

Densidade (`density="compact" | "standard" | "comfortable"`) continua a do MUI X — o projeto só substitui os
**ícones** do seletor de densidade.

### Tabela de estados

**Célula / linha**

| Estado                                        | Fundo                                                                                                           | Texto                            | Borda                                            | Sombra                                      | Transição                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------ | ------------------------------------------- | ------------------------------- |
| célula default                                | transparente                                                                                                    | `#1C252E` light / `#FFFFFF` dark | `border-top: 1px dashed rgba(145 158 171 / 0.2)` | nenhuma                                     | nenhuma declarada pelo override |
| célula em edição (`--editing`)                | **`rgba(0 167 111 / 0.08)`**                                                                                    | idem                             | idem                                             | **`none`** (anula a sombra padrão do MUI X) | —                               |
| linha hover — célula **pinada** (esq./dir.)   | **`#FFFFFF`** light / **`#141A21`** dark (`background.default`) + `::after` em `rgba(145 158 171 / 0.08)`       | idem                             | idem                                             | nenhuma                                     | —                               |
| linha selecionada — célula **pinada**         | `#FFFFFF` / `#141A21` + `::after` em **`rgba(0 167 111 / 0.08)`** (light) / **`rgba(0 167 111 / 0.16)`** (dark) | idem                             | idem                                             | nenhuma                                     | —                               |
| linha selecionada + hover — célula **pinada** | idêntico ao "selecionada" (o hover **não** altera)                                                              | idem                             | idem                                             | nenhuma                                     | —                               |

> A diferença de alfa entre light e dark vem de `action.selectedOpacity`: **0.08** no light e **0.16** no dark.

**Cabeçalho de coluna**

| Estado                                            | Fundo                                                         | Texto                                                                           | Borda                                  | Sombra  | Transição |
| ------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------- | ------- | --------- |
| default                                           | `var(--DataGrid-containerBackground)` = `#F4F6F8` / `#28323D` | **`#637381`** (light) / **`#919EAB`** (dark), `font-size: 14px`, weight **600** | separador em `rgba(145 158 171 / 0.2)` | nenhuma | nenhuma   |
| ordenado (`--sorted`)                             | idem                                                          | **`#1C252E`** (light) / **`#FFFFFF`** (dark)                                    | idem                                   | nenhuma | nenhuma   |
| ícone de ordenação ativo                          | —                                                             | `text.primary` (`sx` do slot)                                                   | —                                      | —       | —         |
| ícone de ordenação inativo (`columnUnsortedIcon`) | —                                                             | **`#919EAB`** (`text.disabled`)                                                 | —                                      | —       | —         |
| ícone de filtro ativo (`columnFilteredIcon`)      | —                                                             | `text.primary`, **16px** de largura                                             | —                                      | —       | —         |

**Painéis (paper)**

| Estado         | Fundo                                                                        | Texto     | Borda   | Sombra                                                                              | Transição     |
| -------------- | ---------------------------------------------------------------------------- | --------- | ------- | ----------------------------------------------------------------------------------- | ------------- |
| aberto (light) | `rgba(255 255 255 / 0.9)` + 2 gradientes SVG + `backdrop-filter: blur(20px)` | `#1C252E` | nenhuma | `0 0 2px 0 rgba(145 158 171 / 0.24), -20px 20px 40px -4px rgba(145 158 171 / 0.24)` | `Grow` do MUI |
| aberto (dark)  | `rgba(28 37 46 / 0.9)` + gradientes + blur                                   | `#FFFFFF` | nenhuma | `0 0 2px 0 rgba(0 0 0 / 0.24), -20px 20px 40px -4px rgba(0 0 0 / 0.24)`             | idem          |

**Botão de excluir filtro**

| Estado  | Fundo                          | Ícone   | Borda   | Sombra  | Transição                       |
| ------- | ------------------------------ | ------- | ------- | ------- | ------------------------------- |
| default | **`rgba(145 158 171 / 0.16)`** | 16×16px | nenhuma | nenhuma | a do `IconButton` (default MUI) |

### Medidas

**Root**

| Propriedade                        | Valor bruto                                        |
| ---------------------------------- | -------------------------------------------------- |
| `border-width`                     | **0**                                              |
| `scrollbar-width`                  | **`thin`**                                         |
| `scrollbar-color` (light)          | `rgba(145 158 171 / 0.4) rgba(145 158 171 / 0.08)` |
| `scrollbar-color` (dark)           | `rgba(99 115 129 / 0.4) rgba(99 115 129 / 0.08)`   |
| `.MuiDataGrid-filler > div`        | `border-top-style: dashed`                         |
| `.MuiDataGrid-topContainer::after` | `height: 0` (anula a sombra/linha padrão do MUI X) |

**Cabeçalho e célula**

| Propriedade                         | Valor bruto                                                                                                  | Referência simbólica                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `columnHeader`: `font-size`         | **14px** (px puro — **não** escala com a base rem)                                                           | literal                               |
| `columnHeader`: `color`             | `#637381` / `#919EAB` (dark)                                                                                 | `text.secondary`                      |
| `columnHeader--sorted`: `color`     | `#1C252E` / `#FFFFFF`                                                                                        | `text.primary`                        |
| `cell`: `border-top-style`          | **`dashed`**                                                                                                 | —                                     |
| `cell--editing`: `background-color` | `rgba(0 167 111 / 0.08)`                                                                                     | `varAlpha(primary.mainChannel, 0.08)` |
| `cell--pinnedLeft/Right::after`     | `top: 0` · `left: 0` · `z-index: -1` · `content: ""` · `width: 100%` · `height: 100%` · `position: absolute` | —                                     |

**Toolbar**

| Propriedade                                          | Valor bruto                                                | Referência simbólica |
| ---------------------------------------------------- | ---------------------------------------------------------- | -------------------- |
| `toolbarContainer`: `gap`                            | **16px**                                                   | `theme.spacing(2)`   |
| `toolbarContainer`: `padding`                        | **16px**                                                   | `theme.spacing(2)`   |
| `TextField` dentro da toolbar: `padding`             | **0**                                                      | —                    |
| `TextField` dentro da toolbar: `width`               | `100%`; **`unset`** a partir de `@media (min-width:900px)` | breakpoint `md`      |
| `input` da toolbar: `padding-top` / `padding-bottom` | **16px** / **16px**                                        | `theme.spacing(2)`   |

**Painel de colunas**

| Propriedade                                           | Valor bruto                  | Referência simbólica          |
| ----------------------------------------------------- | ---------------------------- | ----------------------------- |
| `columnsManagementHeader`: `padding`                  | **`20px 16px 0 16px`**       | `theme.spacing(2.5, 2, 0, 2)` |
| `columnsManagementHeader` input: `padding-top/bottom` | **16px** cada                | `theme.spacing(2)`            |
| `columnsManagement`: `gap`                            | **4px**                      | `theme.spacing(0.5)`          |
| `columnsManagement`: `padding`                        | **`16px 12px`**              | `theme.spacing(2, 1.5)`       |
| `columnsManagement` `FormControlLabel`                | `gap: 4px`, `margin-left: 0` | literais                      |
| `columnsManagementFooter`: `padding`                  | **12px**                     | `theme.spacing(1.5)`          |
| `columnsManagementFooter`: `border-top-style`         | **`dashed`**                 | —                             |
| `columnsManagementFooter` `FormControlLabel`          | `gap: 4px`, `margin-left: 0` | literais                      |

**Painel de filtro**

| Propriedade                                           | Valor bruto                             | Referência simbólica              |
| ----------------------------------------------------- | --------------------------------------- | --------------------------------- |
| `filterForm`: `align-items`                           | `center`                                | —                                 |
| `filterForm`: `gap`                                   | **12px**                                | `theme.spacing(1.5)`              |
| `filterForm`: `padding`                               | **16px**                                | `theme.spacing(2)`                |
| `filterForm` label shrink: `transform`                | **`translate(14px, -9px) scale(0.75)`** | correção para inputs `outlined`   |
| `filterFormDeleteIcon` IconButton: `padding`          | **2px**                                 | `theme.spacing(0.25)`             |
| `filterFormDeleteIcon` IconButton: `background-color` | `rgba(145 158 171 / 0.16)`              | `varAlpha(grey.500Channel, 0.16)` |
| `filterFormDeleteIcon` ícone: tamanho                 | **16 × 16px**                           | literal                           |

**Menu de coluna / paper**

| Propriedade                      | Valor bruto                                                                | Referência simbólica                          |
| -------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------- |
| `paper`                          | `paperStyles(dropdown: true)` **com `padding: 0`** (anula os 4px do mixin) | —                                             |
| `menu .MuiPaper-root`            | `paperStyles(dropdown: true)` + **`min-width: 140px`**                     | —                                             |
| `menu .MuiList-root`             | `padding: 0`                                                               | —                                             |
| `menu .MuiListItemIcon-root`     | `min-width: 0`, `margin-right: **16px**`                                   | `theme.spacing(2)`                            |
| `menuIcon` IconButton            | `margin: 0 8px`, `padding: 2px`                                            | `theme.spacing(0, 1)` / `theme.spacing(0.25)` |
| `iconButtonContainer` IconButton | `padding: 2px`, `margin-left: 8px`                                         | `theme.spacing(0.25)` / `theme.spacing(1)`    |

**Rodapé e overlay**

| Propriedade                           | Valor bruto                                       |
| ------------------------------------- | ------------------------------------------------- |
| `footerContainer`: `min-height`       | **`auto`**                                        |
| `footerContainer`: `border-top-style` | **`dashed`**                                      |
| `selectedRowCount`: `display`         | **`none`** (o contador nativo é escondido)        |
| `selectedRowCount`: `white-space`     | `nowrap`                                          |
| `overlay` `CircularProgress`: `color` | `#1C252E` light / `#FFFFFF` dark (`text.primary`) |

**Ícones**

Todos os ícones inline recebem `width: 20px; height: 20px` via o helper `svgIconProps`
(`sx: [{ width: 20, height: 20 }, …]`). Exceções declaradas nos slots:

| Slot                                                       | Tamanho / cor                                          |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| `columnFilteredIcon`                                       | `width: 16px`, `color: text.primary`                   |
| `quickFilterIcon`                                          | `width: 24px`, `height: 24px`, `color: text.secondary` |
| `columnMenuIcon`                                           | `width={20}` (prop) — mesmo tamanho padrão             |
| `columnSortedAscendingIcon` / `columnSortedDescendingIcon` | 20×20, `color: text.primary`                           |
| `columnUnsortedIcon`                                       | 20×20, `color: text.disabled`                          |

Os **12 ícones inline** (SVG proprietário, `viewBox` 24×24):

| Slot(s)                                                                          | Ícone de origem                              |
| -------------------------------------------------------------------------------- | -------------------------------------------- |
| `columnSortedAscendingIcon`, `columnUnsortedIcon`, `columnMenuSortAscendingIcon` | `solar:alt-arrow-up-bold-duotone`            |
| `columnSortedDescendingIcon`, `columnMenuSortDescendingIcon`                     | `solar:alt-arrow-down-bold-duotone`          |
| `columnMenuFilterIcon`, `openFilterButtonIcon`, `columnFilteredIcon`             | `solar:filter-bold`                          |
| `exportIcon`                                                                     | `solar:export-bold`                          |
| `columnMenuManageColumnsIcon`, `columnSelectorIcon`                              | `solar:eye-bold`                             |
| `columnMenuHideIcon`                                                             | `ph:eye-closed-bold`                         |
| `quickFilterIcon`                                                                | `eva:search-fill`                            |
| `filterPanelDeleteIcon`, `quickFilterClearIcon`                                  | `eva:close-fill`                             |
| `columnMenuIcon`                                                                 | `mingcute:more-1-fill`                       |
| `densityCompactIcon`                                                             | `material-symbols:table-rows-narrow-rounded` |
| `densityComfortableIcon`                                                         | `mingcute:rows-2-fill`                       |
| `densityStandardIcon`                                                            | `mingcute:rows-4-fill`                       |

### Regras de uso observadas

- **A DataGrid não tem moldura**: `border-width: 0` e `--unstable_DataGrid-radius: 0`. O enquadramento
  (raio, sombra) vem do `Card` que a envolve.
- **Tudo que separa é tracejado**: `cell` (border-top), `filler`, `footerContainer` e
  `columnsManagementFooter` usam `dashed`. É a mesma linguagem da `Table`.
- **As células pinadas usam `::after` com `z-index: -1`** em vez de `background-color` direto: assim o fundo
  de hover/seleção fica **atrás** do conteúdo, evitando que a célula pinada tape a linha ao rolar
  horizontalmente. O fundo base delas é `background.default` (e não `paper`), o que garante opacidade total.
- **O contador nativo de linhas selecionadas é escondido** (`selectedRowCount: display none`) — a informação
  é exibida por componentes próprios das telas, quando existe.
- A `columnHeader` usa `font-size: 14px` em **px puro**, exatamente como o `TableCell variant="head"` — ou
  seja: cabeçalho maior (14px) que o corpo (12,25px) nas duas tabelas do sistema.
- Os painéis (filtro, colunas, menu) reutilizam o **mesmo `paperStyles` dropdown** dos popovers: blur 20px,
  raio 10px, sombra `dropdown`, dois gradientes SVG.

### Origem

| Fato                                                                  | Arquivo:linha                                                                                                   |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `slots` (12 ícones) e tamanhos por slot                               | `frontend/src/theme/core/components/mui-x-data-grid.tsx:24-65`                                                  |
| `slotProps` (popper/chip/switch/checkbox/inputLabel/textField/select) | `frontend/src/theme/core/components/mui-x-data-grid.tsx:66-74`                                                  |
| estilos de célula pinada (hover/selected)                             | `frontend/src/theme/core/components/mui-x-data-grid.tsx:83-97` e `:110-123`                                     |
| `--unstable_DataGrid-radius`                                          | `frontend/src/theme/core/components/mui-x-data-grid.tsx:101`                                                    |
| `--DataGrid-rowBorderColor`                                           | `frontend/src/theme/core/components/mui-x-data-grid.tsx:102`                                                    |
| `--DataGrid-containerBackground`                                      | `frontend/src/theme/core/components/mui-x-data-grid.tsx:103`                                                    |
| `--unstable_DataGrid-headWeight`                                      | `frontend/src/theme/core/components/mui-x-data-grid.tsx:104`                                                    |
| `borderWidth: 0`                                                      | `frontend/src/theme/core/components/mui-x-data-grid.tsx:105`                                                    |
| scrollbar fina + cor                                                  | `frontend/src/theme/core/components/mui-x-data-grid.tsx:106-107`                                                |
| `filler > div` dashed                                                 | `frontend/src/theme/core/components/mui-x-data-grid.tsx:108`                                                    |
| `topContainer::after { height: 0 }`                                   | `frontend/src/theme/core/components/mui-x-data-grid.tsx:109`                                                    |
| `withBorderColor`                                                     | `frontend/src/theme/core/components/mui-x-data-grid.tsx:126`                                                    |
| `columnHeader` (14px, text.secondary, `--sorted`)                     | `frontend/src/theme/core/components/mui-x-data-grid.tsx:130-134`                                                |
| `columnSeparator`                                                     | `frontend/src/theme/core/components/mui-x-data-grid.tsx:135`                                                    |
| `cell` (dashed, editing, pinned ::after)                              | `frontend/src/theme/core/components/mui-x-data-grid.tsx:139-156`                                                |
| `toolbarContainer`                                                    | `frontend/src/theme/core/components/mui-x-data-grid.tsx:160-172`                                                |
| `paper` (dropdown + padding 0)                                        | `frontend/src/theme/core/components/mui-x-data-grid.tsx:176`                                                    |
| `menu` (paper 140px, list padding 0, listItemIcon)                    | `frontend/src/theme/core/components/mui-x-data-grid.tsx:177-186`                                                |
| `menuIcon`                                                            | `frontend/src/theme/core/components/mui-x-data-grid.tsx:190-195`                                                |
| `iconButtonContainer`                                                 | `frontend/src/theme/core/components/mui-x-data-grid.tsx:196-201`                                                |
| `footerContainer`                                                     | `frontend/src/theme/core/components/mui-x-data-grid.tsx:205`                                                    |
| `selectedRowCount`                                                    | `frontend/src/theme/core/components/mui-x-data-grid.tsx:206`                                                    |
| `overlay` (CircularProgress)                                          | `frontend/src/theme/core/components/mui-x-data-grid.tsx:211-209`                                                |
| `columnsManagementHeader`                                             | `frontend/src/theme/core/components/mui-x-data-grid.tsx:213-219`                                                |
| `columnsManagement`                                                   | `frontend/src/theme/core/components/mui-x-data-grid.tsx:224-224`                                                |
| `columnsManagementFooter`                                             | `frontend/src/theme/core/components/mui-x-data-grid.tsx:225-229`                                                |
| `filterForm`                                                          | `frontend/src/theme/core/components/mui-x-data-grid.tsx:233-239`                                                |
| `filterFormDeleteIcon`                                                | `frontend/src/theme/core/components/mui-x-data-grid.tsx:240-246`                                                |
| `svgIconProps` (20×20)                                                | `frontend/src/theme/core/components/mui-x-data-grid.tsx:254-257`                                                |
| definições dos 12 ícones inline                                       | `frontend/src/theme/core/components/mui-x-data-grid.tsx:263-410`                                                |
| mixin `paperStyles`                                                   | `frontend/src/theme/core/mixins/global-styles-components.ts:79-97`                                              |
| `action.selectedOpacity` 0.08 (light) / 0.16 (dark)                   | tema computado (`frontend/.ds-extract/theme.json` → `computed.paletteLight/paletteDark.action.selectedOpacity`) |
| versão `@mui/x-data-grid` **7.28.2**                                  | `frontend/package-lock.json` (lockfileVersion 3)                                                                |

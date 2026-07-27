# 09 — Catálogo de componentes

O catálogo foi dividido em arquivos por família, dentro de **[`componentes/`](./componentes/)**,
porque o conteúdo completo passa de 4.500 linhas.

Cada componente segue a mesma estrutura:

1. **Anatomia** — as partes que o compõem, com o papel de cada uma
2. **Variantes e tamanhos** — todos os que existem **neste projeto** (inclusive os criados por ele)
3. **Tabela de estados** — `default`, `hover`, `focus`/`focus-visible`, `active`, `selected`,
   `disabled`, `error`, `loading` — com fundo, texto, borda, sombra e transição de cada um
4. **Medidas** — altura, padding interno, gap, raio e tamanho de ícone, em px
5. **Regras de uso observadas** — o que o código revela sobre como o componente é aplicado
6. **Origem** — `arquivo:linha` de cada valor

> **Lembrete permanente:** a base do `rem` é **14 px**. Todo valor em `rem` foi convertido
> para o px real (`rem × 14`). Ver `00-visao-geral.md` §5.

---

## Índice

### Ações e entrada de dados

| Arquivo                                                                          | Componentes cobertos                                                                                                     |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`componentes/botao.md`](./componentes/botao.md)                                 | Botão (`contained`, `outlined`, `text`, **`soft`**) e base de botão                                                      |
| [`componentes/botao-grupo-e-toggle.md`](./componentes/botao-grupo-e-toggle.md)   | Grupo de botões (incl. **`soft`**), botão de alternância e grupo de alternância                                          |
| [`componentes/fab.md`](./componentes/fab.md)                                     | Botão de ação flutuante (`circular`, `extended`, **`outlined`**, **`outlinedExtended`**, **`soft`**, **`softExtended`**) |
| [`componentes/campo-texto.md`](./componentes/campo-texto.md)                     | Campo de texto e as três formas de entrada: contorno, preenchido e sublinhado                                            |
| [`componentes/select-e-autocomplete.md`](./componentes/select-e-autocomplete.md) | Seletor, seletor nativo e autocompletar                                                                                  |
| [`componentes/checkbox-radio-switch.md`](./componentes/checkbox-radio-switch.md) | Caixa de seleção, botão de opção e interruptor                                                                           |
| [`componentes/slider-e-rating.md`](./componentes/slider-e-rating.md)             | Controle deslizante e avaliação por estrelas                                                                             |
| [`componentes/form-labels.md`](./componentes/form-labels.md)                     | Rótulo de campo, texto de ajuda e rótulo de controle                                                                     |

### Superfícies e sobreposições

| Arquivo                                                                        | Componentes cobertos                                                       |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| [`componentes/card-e-paper.md`](./componentes/card-e-paper.md)                 | Superfície base, cartão, cabeçalho e conteúdo de cartão                    |
| [`componentes/dialog-e-drawer.md`](./componentes/dialog-e-drawer.md)           | Modal/diálogo (título, conteúdo, ações), gaveta lateral e fundo escurecido |
| [`componentes/menu-popover-tooltip.md`](./componentes/menu-popover-tooltip.md) | Item de menu, painel flutuante e dica de ferramenta                        |

### Navegação

| Arquivo                                                                                      | Componentes cobertos                                                              |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`componentes/tabs-breadcrumbs-pagination.md`](./componentes/tabs-breadcrumbs-pagination.md) | Abas, trilha de navegação (incl. a versão própria) e paginação (incl. **`soft`**) |
| [`componentes/navegacao-lateral.md`](./componentes/navegacao-lateral.md)                     | Navegação principal nas três formas: vertical, reduzida e horizontal              |

### Dados

| Arquivo                                                  | Componentes cobertos                                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [`componentes/tabela.md`](./componentes/tabela.md)       | Tabela, linha, célula, contêiner, paginação de tabela e utilitários próprios                          |
| [`componentes/data-grid.md`](./componentes/data-grid.md) | Grade de dados avançada (cabeçalho, células fixas, barra de ferramentas, painéis de filtro e colunas) |

### Feedback e indicadores

| Arquivo                                                                              | Componentes cobertos                                                                                               |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [`componentes/alert-e-snackbar.md`](./componentes/alert-e-snackbar.md)               | Alerta (3 variantes × 4 severidades), título de alerta e notificação temporária                                    |
| [`componentes/chip-badge-avatar-label.md`](./componentes/chip-badge-avatar-label.md) | Etiqueta removível, marcador de status, avatar, grupo de avatares e o componente próprio `Label`                   |
| [`componentes/feedback-e-loading.md`](./componentes/feedback-e-loading.md)           | Barra de progresso linear e circular, esqueleto de carregamento, tela de carregamento e barra de progresso de rota |

### Diversos

| Arquivo                                            | Componentes cobertos                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [`componentes/outros.md`](./componentes/outros.md) | Acordeão, linha do tempo, conector de etapas, item de árvore, itens de lista, empilhamento, link, barra superior e ícone SVG |

---

## Cobertura em relação ao inventário

Os **81 identificadores `Mui*`** presentes no tema estão cobertos. Mapeamento:

| Grupo no tema                                                                                                                                                                                                                                                                                    | Onde está documentado                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `MuiButton`, `MuiButtonBase`                                                                                                                                                                                                                                                                     | `botao.md`                                                                       |
| `MuiButtonGroup`, `MuiToggleButton`, `MuiToggleButtonGroup`                                                                                                                                                                                                                                      | `botao-grupo-e-toggle.md`                                                        |
| `MuiFab`                                                                                                                                                                                                                                                                                         | `fab.md`                                                                         |
| `MuiTextField`, `MuiInputBase`, `MuiOutlinedInput`, `MuiFilledInput`, `MuiInput`                                                                                                                                                                                                                 | `campo-texto.md`                                                                 |
| `MuiSelect`, `MuiNativeSelect`, `MuiAutocomplete`                                                                                                                                                                                                                                                | `select-e-autocomplete.md`                                                       |
| `MuiCheckbox`, `MuiRadio`, `MuiSwitch`                                                                                                                                                                                                                                                           | `checkbox-radio-switch.md`                                                       |
| `MuiSlider`, `MuiRating`                                                                                                                                                                                                                                                                         | `slider-e-rating.md`                                                             |
| `MuiFormLabel`, `MuiFormHelperText`, `MuiFormControlLabel`                                                                                                                                                                                                                                       | `form-labels.md`                                                                 |
| `MuiPaper`, `MuiCard`, `MuiCardHeader`, `MuiCardContent`                                                                                                                                                                                                                                         | `card-e-paper.md`                                                                |
| `MuiDialog`, `MuiDialogTitle`, `MuiDialogContent`, `MuiDialogActions`, `MuiDrawer`, `MuiBackdrop`                                                                                                                                                                                                | `dialog-e-drawer.md`                                                             |
| `MuiMenuItem`, `MuiPopover`, `MuiTooltip`                                                                                                                                                                                                                                                        | `menu-popover-tooltip.md`                                                        |
| `MuiTabs`, `MuiTab`, `MuiBreadcrumbs`, `MuiPagination`                                                                                                                                                                                                                                           | `tabs-breadcrumbs-pagination.md`                                                 |
| `MuiTable`, `MuiTableRow`, `MuiTableCell`, `MuiTableContainer`, `MuiTablePagination`                                                                                                                                                                                                             | `tabela.md`                                                                      |
| `MuiDataGrid`                                                                                                                                                                                                                                                                                    | `data-grid.md`                                                                   |
| `MuiAlert`, `MuiAlertTitle`                                                                                                                                                                                                                                                                      | `alert-e-snackbar.md`                                                            |
| `MuiChip`, `MuiBadge`, `MuiAvatar`, `MuiAvatarGroup`                                                                                                                                                                                                                                             | `chip-badge-avatar-label.md`                                                     |
| `MuiLinearProgress`, `MuiSkeleton`                                                                                                                                                                                                                                                               | `feedback-e-loading.md`                                                          |
| `MuiAccordion`, `MuiAccordionSummary`, `MuiTimelineDot`, `MuiTimelineConnector`, `MuiStepConnector`, `MuiTreeItem`, `MuiListItemIcon`, `MuiListItemAvatar`, `MuiListItemText`, `MuiStack`, `MuiLink`, `MuiAppBar`, `MuiSvgIcon`                                                                  | `outros.md`                                                                      |
| `MuiTypography`                                                                                                                                                                                                                                                                                  | `02-tipografia.md` (o override é vazio; toda a definição está na tipografia)     |
| `MuiCssBaseline`                                                                                                                                                                                                                                                                                 | `00-visao-geral.md` §5 e `03-espacamento.md` (define `html { font-size: 14px }`) |
| `MuiPickersPopper`, `MuiPickersLayout`, `MuiDatePicker`, `MuiDateTimePicker`, `MuiStaticDatePicker`, `MuiDesktopDatePicker`, `MuiDesktopDateTimePicker`, `MuiMobileDatePicker`, `MuiMobileDateTimePicker`, `MuiTimePicker`, `MuiMobileTimePicker`, `MuiStaticTimePicker`, `MuiDesktopTimePicker` | `06-icones.md` (só trocam ícones) + `outros.md` (superfície do seletor de data)  |

Componentes próprios do projeto documentados: `Label`, `Iconify`, `Logo`, `LoadingScreen`,
`SplashScreen`, `ProgressBar`, `Scrollbar`, `CustomBreadcrumbs`, `NavSection` (3 formas),
utilitários de tabela e o sistema de notificação temporária.

---

## Como ler a tabela de estados

- **Estado não customizado**: quando o projeto não sobrescreve um estado, a linha indica o
  comportamento herdado da biblioteca base com a marca `default MUI 7.0.1` e a origem no
  arquivo real de `node_modules`.
- **Overlay**: quase todos os estados neutros são camadas de `#919EAB` com opacidade fixa
  (8 % hover, 16 % selecionado, 24 % desabilitado). Ver `01-cores.md` §4.
- **Foco**: o projeto quase não customiza foco. Os poucos casos com realce próprio usam
  `box-shadow: 0 0 0 0.75px currentColor`. Ver `99-inconsistencias.md`.

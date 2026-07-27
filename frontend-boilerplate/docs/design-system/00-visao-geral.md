# 00 — Visão geral

Ficha técnica do design system **aplicado hoje** no frontend do AuditorIA (`/workspace/frontend`).

O objetivo desta documentação é permitir que alguém que nunca viu o projeto reproduza a interface
**pixel a pixel em qualquer biblioteca de UI**, sem abrir o código-fonte. Por isso:

- Todos os valores estão em **forma bruta** (px, rem, hex/rgb(a), ms, cubic-bezier).
- A referência simbólica do MUI aparece **apenas** como coluna de origem, nunca como valor.
- Cada token cita **arquivo:linha**.
- Nada foi arredondado, padronizado ou "melhorado". O que está aqui é o que existe.

---

## 1. Como esta documentação foi produzida

| Método                      | Descrição                                                                                                                                                                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Leitura de código**       | 58 arquivos de `frontend/src/theme/**`, todo `frontend/src/layouts/**` e os componentes próprios de `frontend/src/components/**`.                                                                                                                                                                |
| **Computação do tema real** | O tema foi empacotado com esbuild e executado em Node, reproduzindo exatamente a cadeia de `src/theme/create-theme.ts`. Isso resolve **todos os defaults implícitos** do MUI (breakpoints, spacing, transitions, z-index, slots de cor gerados). Saída bruta: `frontend/.ds-extract/theme.json`. |
| **Medição em runtime**      | Aplicação rodando em Chrome, viewport **1911×898 px**, modo light, nas rotas `/auth/jwt/sign-in` e `/components/mui/*`, lendo `getComputedStyle`. Serve como confirmação empírica.                                                                                                               |

Dossiê completo de fatos brutos: `frontend/.ds-extract/FATOS.md`.

---

## 2. Stack e versões exatas

Versões extraídas de `frontend/package-lock.json` (lockfileVersion 3) — são as **efetivamente instaladas**,
não os ranges de `package.json`.

### 2.1 Núcleo de UI

| Pacote                | Versão exata  | Papel                                                                              |
| --------------------- | ------------- | ---------------------------------------------------------------------------------- |
| `@mui/material`       | **7.0.1**     | biblioteca base de componentes e tema                                              |
| `@mui/system`         | 7.0.1         | motor de estilo/`sx`                                                               |
| `@mui/lab`            | 7.0.0-beta.10 | Timeline                                                                           |
| `@mui/x-data-grid`    | 7.28.2        | tabela de dados                                                                    |
| `@mui/x-date-pickers` | 7.28.2        | date/time pickers                                                                  |
| `@mui/x-tree-view`    | 7.28.1        | árvore                                                                             |
| `@emotion/react`      | 11.14.0       | CSS-in-JS (engine de estilo do MUI)                                                |
| `@emotion/styled`     | 11.14.0       | idem                                                                               |
| `@emotion/cache`      | 11.14.0       | cache/RTL                                                                          |
| `react` / `react-dom` | 19.1.0        | runtime                                                                            |
| `minimal-shared`      | 1.0.7         | utilitários do template (`varAlpha`, `pxToRem`, `setFont`, `createPaletteChannel`) |

### 2.2 Fontes

| Pacote                             | Versão | Uso                                              |
| ---------------------------------- | ------ | ------------------------------------------------ |
| `@fontsource-variable/public-sans` | 5.2.5  | **fonte primária** (variável)                    |
| `@fontsource/barlow`               | 5.2.5  | **fonte secundária** (pesos 400/500/600/700/800) |
| `@fontsource-variable/dm-sans`     | 5.2.5  | importada, **não usada** no tema default         |
| `@fontsource-variable/inter`       | 5.2.5  | importada, **não usada** no tema default         |
| `@fontsource-variable/nunito-sans` | 5.2.5  | importada, **não usada** no tema default         |

Origem dos imports: `frontend/src/global.css:4-21`.

### 2.3 Ícones, animação, formulário e apoio

| Categoria                  | Pacote                                          | Versão        | Observação                                              |
| -------------------------- | ----------------------------------------------- | ------------- | ------------------------------------------------------- |
| Ícones                     | `@iconify/react`                                | 5.2.0         | wrapper próprio em `src/components/iconify/iconify.tsx` |
| Animação                   | `framer-motion`                                 | 12.6.1        | usada em `src/components/animate/**`                    |
| Formulário                 | `react-hook-form`                               | 7.55.0        | + `@hookform/resolvers` 4.1.3                           |
| Validação                  | `zod`                                           | 3.24.2        | schemas de formulário                                   |
| Scrollbar                  | `simplebar-react`                               | 3.3.0         | scrollbar custom                                        |
| Toast                      | `sonner`                                        | 2.0.2         | snackbar da aplicação                                   |
| Barra de progresso de rota | `nprogress`                                     | 0.2.0         | topo da tela                                            |
| Gráficos                   | `apexcharts` / `react-apexcharts`               | 4.5.0 / 1.7.0 | dashboards                                              |
| RTL                        | `stylis` 4.3.6 + `stylis-plugin-rtl` 2.1.1      | —             | direção `ltr` no default                                |
| Build                      | `vite` 6.2.3 + `@vitejs/plugin-react-swc` 3.8.1 | —             | dev server na porta 5173                                |

### 2.4 O que **não** existe no projeto

Verificado por varredura em `frontend/`:

- ❌ Tailwind (nenhum `tailwind.config.*`)
- ❌ SCSS/Sass (0 arquivos `.scss`)
- ❌ CSS Modules (0 arquivos `*.module.css`)
- ❌ `makeStyles` / JSS (0 ocorrências)

---

## 3. Arquitetura de estilos

O estilo do projeto vem de **quatro** origens, nesta ordem de precedência (da menor para a maior):

| #   | Origem                              | Onde                                                                   | Peso                                                     |
| --- | ----------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | **Tema MUI** (`createTheme`)        | `src/theme/**`                                                         | base de tudo — tokens + overrides globais por componente |
| 2   | **CSS global**                      | `src/global.css` + 5 CSS de plugin                                     | reset/baseline e estilos de bibliotecas externas         |
| 3   | **CSS custom properties de layout** | `src/layouts/**/css-vars.ts`, injetadas em `body` via `<GlobalStyles>` | dimensões do chrome da aplicação                         |
| 4   | **`sx` e `styled()` locais**        | ~1.400 arquivos `.tsx`                                                 | ajustes por tela/componente                              |

O tema é publicado como **CSS custom properties** (`cssVariables` ligado), com prefixo **vazio**:
as variáveis saem como `--palette-primary-main`, `--shape-borderRadius`, `--spacing`,
`--customShadows-card` etc. Origem: `src/theme/theme-config.ts:107-110`.

O seletor de esquema de cor é o atributo **`data-color-scheme`** (`theme-config.ts:109`),
e não a media query `prefers-color-scheme`.

### 3.1 Arquivos CSS globais

| Arquivo                                                                                                          | Conteúdo                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/global.css`                                                                                                 | imports de fontes, imports dos CSS de plugin e o baseline (`html`, `body`, `#root`, `img`, `ul`, `input[type=number]`) |
| `src/components/scrollbar/styles.css`                                                                            | scrollbar do SimpleBar                                                                                                 |
| `src/components/map/styles.css`                                                                                  | Mapbox                                                                                                                 |
| `src/components/lightbox/styles.css`                                                                             | lightbox                                                                                                               |
| `src/components/chart/styles.css`                                                                                | ApexCharts                                                                                                             |
| `src/components/progress-bar/styles.css`                                                                         | nprogress                                                                                                              |
| `src/components/markdown/code-highlight-block.css` e `src/components/editor/components/code-highlight-block.css` | realce de código                                                                                                       |

---

## 4. Como o tema é montado (cadeia real)

```
src/main.tsx:16-24                      createBrowserRouter → <App>
└── src/app.tsx:66-72                   <SettingsProvider defaultSettings={defaultSettings}>
    └──                                 <ThemeProvider>
        └── src/theme/theme-provider.tsx:22-38
            └── createTheme({ settingsState, localeComponents, themeOverrides })
                └── src/theme/create-theme.ts:55-63
                    createMuiTheme(updatedCore, updatedComponents, localeComponents, themeOverrides)
```

### 4.1 `baseTheme` — `src/theme/create-theme.ts:21-38`

| Chave                          | Origem                                                                     |
| ------------------------------ | -------------------------------------------------------------------------- |
| `colorSchemes.light` / `.dark` | `src/theme/core/palette.ts`, `core/shadows.ts`, `core/custom-shadows.ts`   |
| `mixins`                       | `src/theme/core/mixins/mixins.ts`                                          |
| `components`                   | `src/theme/core/components/index.ts` (44 arquivos → **81 chaves `Mui*`**)  |
| `typography`                   | `src/theme/core/typography.ts`                                             |
| `shape`                        | `{ borderRadius: 8 }` — **único** override de shape (`create-theme.ts:35`) |
| `direction`                    | `'ltr'` (`theme-config.ts:35`)                                             |
| `cssVariables`                 | `{ cssVarPrefix: '', colorSchemeSelector: 'data-color-scheme' }`           |
| `defaultColorScheme`           | `'light'` (`theme-config.ts:32`)                                           |

**Não há override** de `spacing`, `breakpoints`, `transitions` nem `zIndex` — todos são o default do MUI 7.0.1
(valores resolvidos em `03-espacamento.md`, `05-grid-e-layout.md`, `07-motion.md` e `08-elevacao-bordas-zindex.md`).

### 4.2 Configurações do usuário que afetam o tema

`defaultSettings` (`src/components/settings/settings-config.ts:10-21`), persistido em `localStorage`
sob a chave `app-settings`:

| Campo           | Valor default            | Efeito no tema                                                                                                                                   |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `colorScheme`   | `'light'`                | esquema de cor ativo                                                                                                                             |
| `direction`     | `'ltr'`                  | direção do texto                                                                                                                                 |
| `contrast`      | `'default'`              | se fosse `'hight'`: `background.default` viraria `#F4F6F8` e todo Card ganharia `box-shadow: 0 1px 2px 0 rgba(145 158 171 / 0.16)`. **Inativo.** |
| `navLayout`     | `'vertical'`             | sidebar vertical de 300px                                                                                                                        |
| `primaryColor`  | `'default'`              | mantém a primary verde. **Nenhum preset ativo.**                                                                                                 |
| `navColor`      | `'integrate'`            | nav com fundo `#FFFFFF`                                                                                                                          |
| `compactLayout` | `false`                  | container do conteúdo **sem** max-width                                                                                                          |
| `fontSize`      | **`14`**                 | ⚠️ define `html { font-size: 14px }` — ver §5                                                                                                    |
| `fontFamily`    | `'Public Sans Variable'` | família primária                                                                                                                                 |
| `version`       | `'7.0.0'`                | invalidação do storage                                                                                                                           |

---

## 5. ⚠️ Fato mais importante para reproduzir a UI: a base do `rem` é **14 px**

O projeto grava `html { font-size: 14px }`:

- `src/components/settings/settings-config.ts:18` → `fontSize: 14`
- `src/theme/with-settings/update-components.ts:54-59` → `MuiCssBaseline.styleOverrides.html.fontSize = settingsState.fontSize`
- **Confirmado em runtime**: `getComputedStyle(document.documentElement).fontSize === "14px"`

Ao mesmo tempo, **todos os `rem` do tema foram gerados dividindo por 16** (`pxToRem(v) = v/16 + 'rem'`,
`minimal-shared` 1.0.7) e `typography.htmlFontSize` continua `16`.

> **Consequência prática:** todo valor em `rem` renderiza a **87,5 %** do número que aparece no código.
>
> **`px_real = rem × 14`**
>
> Ex.: `h1` está escrito como `pxToRem(40)` → `2.5rem` → renderiza **35 px**, não 40 px.

Valores escritos em **px puro** no tema (ex.: `height: 30`, `padding: '12px'`, `borderRadius: 8`)
**não** sofrem essa escala.

Comprovação medida em runtime:

| Elemento         | rem nominal | px esperado (× 14) | px medido       |
| ---------------- | ----------- | ------------------ | --------------- |
| `body` / `body1` | `1rem`      | 14 px              | **14 px** ✔     |
| `body2`          | `0.875rem`  | 12,25 px           | **12,25 px** ✔  |
| `h3` (≥1200px)   | `2rem`      | 28 px              | **28 px** ✔     |
| Botão medium     | `0.875rem`  | 12,25 px           | **12,25 px** ✔  |
| Botão large      | `0.9375rem` | 13,125 px          | **13,125 px** ✔ |
| Ícone SVG medium | `1.5rem`    | 21 px              | **21 px** ✔     |

Em toda esta documentação, valores em `rem` vêm sempre acompanhados do **px real**.

---

## 6. Inventário

### 6.1 Overrides de componente no tema — 44 arquivos, 81 chaves

`src/theme/core/components/`:

```
accordion · alert · appbar · autocomplete · avatar · backdrop · badge · breadcrumbs
button · button-fab · button-group · button-toggle · card · checkbox · chip · dialog
drawer · form · link · list · menu · mui-x-data-grid · mui-x-date-picker · mui-x-tree-view
pagination · paper · popover · progress · radio · rating · select · skeleton · slider
stack · stepper · svg-icon · switch · table · tabs · textfield · timeline · tooltip · typography
```

Chaves geradas (81): `MuiFab, MuiCard, MuiCardHeader, MuiCardContent, MuiLink, MuiFormLabel,
MuiFormHelperText, MuiFormControlLabel, MuiTabs, MuiTab, MuiChip, MuiMenuItem, MuiListItemIcon,
MuiListItemAvatar, MuiListItemText, MuiStack, MuiPaper, MuiTable, MuiTableRow, MuiTableCell,
MuiTableContainer, MuiTablePagination, MuiAlert, MuiAlertTitle, MuiBadge, MuiRadio, MuiDialog,
MuiDialogTitle, MuiDialogContent, MuiDialogActions, MuiAppBar, MuiAvatar, MuiAvatarGroup, MuiDrawer,
MuiSlider, MuiRating, MuiSelect, MuiNativeSelect, MuiButtonBase, MuiButton, MuiStepConnector,
MuiTooltip, MuiPopover, MuiSvgIcon, MuiSkeleton, MuiTimelineDot, MuiTimelineConnector, MuiBackdrop,
MuiLinearProgress, MuiSwitch, MuiCheckbox, MuiTreeItem, MuiDataGrid, MuiAccordion, MuiAccordionSummary,
MuiInput, MuiInputBase, MuiFilledInput, MuiOutlinedInput, MuiTextField, MuiTypography, MuiPagination,
MuiPickersPopper, MuiPickersLayout, MuiDatePicker, MuiDateTimePicker, MuiStaticDatePicker,
MuiDesktopDatePicker, MuiDesktopDateTimePicker, MuiMobileDatePicker, MuiMobileDateTimePicker,
MuiTimePicker, MuiMobileTimePicker, MuiStaticTimePicker, MuiDesktopTimePicker, MuiBreadcrumbs,
MuiButtonGroup, MuiAutocomplete, MuiToggleButton, MuiToggleButtonGroup, MuiCssBaseline`.

### 6.2 Variantes criadas pelo projeto (não existem na biblioteca base)

| Componente                     | Variantes adicionadas                                  |
| ------------------------------ | ------------------------------------------------------ |
| Botão                          | `soft`                                                 |
| Chip                           | `soft`                                                 |
| Grupo de botões                | `soft`                                                 |
| Paginação                      | `soft` + cores `info`, `success`, `warning`, `error`   |
| FAB                            | `outlined`, `outlinedExtended`, `soft`, `softExtended` |
| Grupo de avatares              | `compact`                                              |
| Badge                          | `online`, `always`, `busy`, `offline`, `invisible`     |
| Slider                         | cor `inherit`                                          |
| **Label** (componente próprio) | `filled`, `outlined`, `soft`, `inverted`               |

### 6.3 Componentes próprios — `src/components/` (38 pastas)

```
animate · carousel · chart · color-utils · country-select · custom-breadcrumbs
custom-date-range-picker · custom-dialog · custom-popover · custom-tabs · editor
empty-content · file-thumbnail · filters-result · flag-icon · hook-form · iconify
image · label · lightbox · loading-screen · logo · map · markdown · mega-menu
nav-basic · nav-section · number-input · organizational-chart · phone-input
progress-bar · scrollbar · search-not-found · settings · snackbar · svg-color
table · upload
```

### 6.4 Layouts — `src/layouts/`

| Layout                          | Uso                                                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `core/`                         | primitivos: `LayoutSection`, `HeaderSection`, `MainSection`, `classes.ts`, `css-vars.ts`                          |
| `dashboard/`                    | layout principal da aplicação (header + sidebar + conteúdo)                                                       |
| `auth-centered/`, `auth-split/` | telas de autenticação                                                                                             |
| `main/`                         | páginas institucionais                                                                                            |
| `simple/`                       | páginas simples (erro, manutenção)                                                                                |
| `components/`                   | peças do chrome: account drawer, searchbar, settings button, nav toggle, notifications drawer, workspaces popover |

### 6.5 Páginas e rotas — `src/pages/` e `src/routes/sections/`

Grupos de rota: `auth`, `auth-demo`, `dashboard`, `main`, `components` (galeria de demonstração do template),
mais **57 módulos de negócio** em `src/modules/` (ação fiscal, dívida ativa, malha fiscal, DTE, processo
eletrônico, dashboards, cadastros etc.).

⚠️ A rota `/components/**` é a **galeria de demonstração do template**, não faz parte do produto.
Estilos aplicados lá (ex.: `text-transform: capitalize` nos botões) **não** são regra do design system —
ver `99-inconsistencias.md`.

---

## 7. Índice da documentação

| Arquivo                        | Conteúdo                                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `00-visao-geral.md`            | este documento                                                                                        |
| `01-cores.md`                  | paleta completa, neutros, texto/fundo/borda, estados e overlays, light × dark, cores hardcoded        |
| `02-tipografia.md`             | famílias, pesos, escala completa com rem + px real, variações responsivas, onde cada variante é usada |
| `03-espacamento.md`            | unidade base, tabela de multiplicadores, padding/margin/gap por contexto                              |
| `04-tamanhos-e-dimensoes.md`   | alturas e larguras padronizadas de todo o chrome e dos controles                                      |
| `05-grid-e-layout.md`          | breakpoints, containers, estrutura macro do app e comportamento responsivo                            |
| `06-icones.md`                 | biblioteca, tamanhos, cor/alinhamento e catálogo semântico                                            |
| `07-motion.md`                 | durações, easings, propriedades animadas e por interação                                              |
| `08-elevacao-bordas-zindex.md` | 25 níveis de sombra, customShadows, raios, bordas, opacidades e camadas                               |
| `09-componentes.md`            | índice do catálogo → `componentes/*.md`                                                               |
| `10-tokens.json`               | todos os tokens em formato de máquina                                                                 |
| `99-inconsistencias.md`        | divergências, hardcodes, código morto e pontos não confirmados                                        |

---

## 8. Avisos gerais de fidelidade

1. **Base do `rem` = 14 px.** Reproduzir com 16 px deixa a interface ~14 % maior.
2. **Sintaxe de cor.** O projeto usa `rgba(R G B / A)` (CSS Color 4, separadores por espaço).
   Toda cor aqui vem também em `rgba(R, G, B, A)` tradicional.
3. **Sombras não são cinza-preto.** A escala inteira usa `#919EAB` (grey.500) como base no tema claro —
   sombras "esverdeadas/frias", não pretas. Só `customShadows.dialog` usa preto.
4. **`text-transform` do botão é `unset`**, não `uppercase`. A biblioteca base usa `uppercase`.
5. **Elevação padrão do Paper é 0** e `background-image: none` — não há gradiente de elevação.
6. **`border-radius` base é 8 px**, não 4 px.

# 02 — Tipografia

> ⚠️ **Leia primeiro:** a base do `rem` desta aplicação é **14 px**, não 16 px
> (`html { font-size: 14px }` — ver `00-visao-geral.md` §5).
> Os valores em `rem` do tema foram gerados dividindo por **16**, mas renderizam sobre **14**.
> Por isso toda tabela abaixo traz as duas colunas: **`rem` nominal** e **px real** (`rem × 14`).
> Quem reproduzir a interface com base 16 px terá textos ~14 % maiores.

---

## 1. Famílias

| Papel          | Família                | Origem da fonte                                              | Pesos realmente carregados                                                 | Onde é usada                                                                                             | Origem (arquivo:linha)                  |
| -------------- | ---------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Primária**   | `Public Sans Variable` | self-hosted, pacote `@fontsource-variable/public-sans` 5.2.5 | fonte **variável** — eixo de peso contínuo; o tema usa 300/400/500/600/700 | todo o corpo da interface: `h4`–`h6`, `subtitle*`, `body*`, `caption`, `overline`, `button`, componentes | `frontend/src/theme/theme-config.ts:41` |
| **Secundária** | `Barlow`               | self-hosted, pacote `@fontsource/barlow` 5.2.5               | **400, 500, 600, 700, 800** (só esses 5 são importados)                    | apenas `h1`, `h2` e `h3`                                                                                 | `frontend/src/theme/theme-config.ts:42` |

Imports reais (`frontend/src/global.css:4-11`):

```css
@import '@fontsource-variable/public-sans'; /* eixo variável completo */
@import '@fontsource/barlow/400.css';
@import '@fontsource/barlow/500.css';
@import '@fontsource/barlow/600.css';
@import '@fontsource/barlow/700.css';
@import '@fontsource/barlow/800.css';
```

⚠️ `h1` e `h2` pedem **peso 800** de Barlow — importado (`800.css`). ✔
⚠️ Barlow **não tem peso 300** importado; nenhuma variante o pede. ✔

### 1.1 Fontes carregadas mas não utilizadas

| Família                | Pacote                                   | Situação                                                                          |
| ---------------------- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| `DM Sans Variable`     | `@fontsource-variable/dm-sans` 5.2.5     | importada em `frontend/src/global.css:16`, **não referenciada** pelo tema default |
| `Inter Variable`       | `@fontsource-variable/inter` 5.2.5       | importada em `frontend/src/global.css:17`, **não referenciada**                   |
| `Nunito Sans Variable` | `@fontsource-variable/nunito-sans` 5.2.5 | importada em `frontend/src/global.css:18`, **não referenciada**                   |

Elas existem porque o painel de configurações permite trocar a família primária em tempo de execução
(`frontend/src/components/settings/**`). Com `fontFamily: 'Public Sans Variable'` no default
(`frontend/src/components/settings/settings-config.ts:19`), **as três ficam ociosas** —
custo de rede sem uso. Ver `99-inconsistencias.md`.

### 1.2 Stacks completas (valor bruto)

Geradas por `setFont()` (`minimal-shared` 1.0.7) e **confirmadas em runtime**:

**Primária** (valor de `font-family` no `body` e na maioria dos elementos):

```
"Public Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"
```

**Secundária** (`h1`, `h2`, `h3`):

```
"Barlow", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"
```

⚠️ Em runtime o Chrome normaliza o primeiro item da stack secundária para `Barlow` (sem aspas),
porque o nome não tem espaço. Não altera o resultado.

---

## 2. Pesos nomeados

Declarados como **string**, não número (`frontend/src/theme/core/typography.ts:49-53`):

| Token                  | Valor bruto | Referência MUI                                            | Onde é usado                                                                                                       | Origem (arquivo:linha)                        |
| ---------------------- | ----------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `font.weight.light`    | `300`       | `typography.fontWeightLight`                              | declarado, sem uso no tema                                                                                         | `frontend/src/theme/core/typography.ts:49`    |
| `font.weight.regular`  | `400`       | `typography.fontWeightRegular`                            | `body1`, `body2`, `caption`                                                                                        | `frontend/src/theme/core/typography.ts:50`    |
| `font.weight.medium`   | `500`       | `typography.fontWeightMedium`                             | rótulo de chip, item de aba não selecionado                                                                        | `frontend/src/theme/core/typography.ts:51`    |
| `font.weight.semiBold` | `600`       | `typography.fontWeightSemiBold` (**extensão do projeto**) | `subtitle1/2`, `h6`, cabeçalho de tabela, item selecionado de menu/aba/paginação, título de alerta, `ToggleButton` | `frontend/src/theme/core/typography.ts:52`    |
| `font.weight.bold`     | `700`       | `typography.fontWeightBold`                               | `h3`–`h5`, `overline`, `button`, componente `Label`                                                                | `frontend/src/theme/core/typography.ts:53`    |
| —                      | `800`       | — (literal na variante)                                   | `h1`, `h2`                                                                                                         | `frontend/src/theme/core/typography.ts:56,63` |

`fontWeightSemiBold` (600) é **acréscimo do projeto** — a biblioteca base não tem esse token.
É o peso mais usado nos overrides (11 ocorrências em `frontend/src/theme/**`).

---

## 3. Escala tipográfica completa

Colunas:

- **rem nominal** = o que está escrito no tema
- **px real** = `rem × 14` (o que o navegador renderiza)
- **line-height bruto** = número sem unidade, como está no código
- **line-height px** = `line-height × px real`

### 3.1 Títulos

#### `h1`

| Faixa            | rem nominal | px real      | line-height bruto | line-height px | Peso | Família |
| ---------------- | ----------- | ------------ | ----------------- | -------------- | ---- | ------- |
| `< 600px` (base) | `2.5rem`    | **35 px**    | `1.25` (= 80/64)  | 43,75 px       | 800  | Barlow  |
| `≥ 600px`        | `3.25rem`   | **45,5 px**  | `1.25`            | 56,88 px       | 800  | Barlow  |
| `≥ 900px`        | `3.625rem`  | **50,75 px** | `1.25`            | 63,44 px       | 800  | Barlow  |
| `≥ 1200px`       | `4rem`      | **56 px**    | `1.25`            | 70 px          | 800  | Barlow  |

`letter-spacing`: não definido → `normal`. `text-transform`: não definido → `none`.
Origem: `frontend/src/theme/core/typography.ts:54-60`.
Uso: 6 ocorrências de `variant="h1"` — páginas institucionais e telas de erro.

#### `h2`

| Faixa      | rem nominal | px real     | line-height bruto              | line-height px | Peso | Família |
| ---------- | ----------- | ----------- | ------------------------------ | -------------- | ---- | ------- |
| base       | `2rem`      | **28 px**   | `1.3333333333333333` (= 64/48) | 37,33 px       | 800  | Barlow  |
| `≥ 600px`  | `2.5rem`    | **35 px**   | idem                           | 46,67 px       | 800  | Barlow  |
| `≥ 900px`  | `2.75rem`   | **38,5 px** | idem                           | 51,33 px       | 800  | Barlow  |
| `≥ 1200px` | `3rem`      | **42 px**   | idem                           | 56 px          | 800  | Barlow  |

Origem: `frontend/src/theme/core/typography.ts:61-67`. Uso: 11 `variant="h2"` + 5 `typography: 'h2'`.

#### `h3`

| Faixa      | rem nominal | px real      | line-height bruto | line-height px | Peso | Família |
| ---------- | ----------- | ------------ | ----------------- | -------------- | ---- | ------- |
| base       | `1.5rem`    | **21 px**    | `1.5`             | 31,5 px        | 700  | Barlow  |
| `≥ 600px`  | `1.625rem`  | **22,75 px** | `1.5`             | 34,13 px       | 700  | Barlow  |
| `≥ 900px`  | `1.875rem`  | **26,25 px** | `1.5`             | 39,38 px       | 700  | Barlow  |
| `≥ 1200px` | `2rem`      | **28 px**    | `1.5`             | **42 px**      | 700  | Barlow  |

**Medido em runtime** (viewport 1911 px): `font-size: 28px`, `line-height: 42px`, `font-weight: 700`,
família Barlow, `letter-spacing: normal` ✔
Origem: `frontend/src/theme/core/typography.ts:68-74`. Uso: 23 `variant="h3"` + 11 `typography: 'h3'` — título de tela de login e cabeçalhos de seção.

#### `h4`

| Faixa     | rem nominal | px real     | line-height bruto | line-height px | Peso | Família         |
| --------- | ----------- | ----------- | ----------------- | -------------- | ---- | --------------- |
| base      | `1.25rem`   | **17,5 px** | `1.5`             | 26,25 px       | 700  | **Public Sans** |
| `≥ 900px` | `1.5rem`    | **21 px**   | `1.5`             | 31,5 px        | 700  | Public Sans     |

⚠️ Sem regra para `sm` e `lg` — só `md`. Origem: `frontend/src/theme/core/typography.ts:75-80`.
Uso: 75 `variant="h4"` + 9 `typography: 'h4'` — **título principal de página** no dashboard.

#### `h5`

| Faixa     | rem nominal | px real       | line-height bruto | line-height px | Peso | Família     |
| --------- | ----------- | ------------- | ----------------- | -------------- | ---- | ----------- |
| base      | `1.125rem`  | **15,75 px**  | `1.5`             | 23,63 px       | 700  | Public Sans |
| `≥ 600px` | `1.1875rem` | **16,625 px** | `1.5`             | 24,94 px       | 700  | Public Sans |

⚠️ Salto de apenas **0,875 px** entre as duas faixas (19 px vs 18 px nominais). Origem: `frontend/src/theme/core/typography.ts:81-86`.
Uso: 32 `variant="h5"` + 9 `typography: 'h5'`.

#### `h6`

| Faixa     | rem nominal | px real       | line-height bruto              | line-height px | Peso | Família     |
| --------- | ----------- | ------------- | ------------------------------ | -------------- | ---- | ----------- |
| base      | `1.0625rem` | **14,875 px** | `1.5555555555555556` (= 28/18) | 23,14 px       | 600  | Public Sans |
| `≥ 600px` | `1.125rem`  | **15,75 px**  | idem                           | 24,5 px        | 600  | Public Sans |

Origem: `frontend/src/theme/core/typography.ts:87-92`.
Uso: 111 `variant="h6"` + 11 `typography: 'h6'` — **título de card** (é o default de `CardHeader`,
`frontend/src/theme/core/components/card.tsx:26`).

### 3.2 Subtítulos, corpo e auxiliares

| Variante    | rem nominal | px real      | line-height bruto              | line-height px | Peso | Família     | `text-transform`               | Origem (arquivo:linha)  |
| ----------- | ----------- | ------------ | ------------------------------ | -------------- | ---- | ----------- | ------------------------------ | ----------------------- |
| `subtitle1` | `1rem`      | **14 px**    | `1.5`                          | 21 px          | 600  | Public Sans | —                              | `typography.ts:93-97`   |
| `subtitle2` | `0.875rem`  | **12,25 px** | `1.5714285714285714` (= 22/14) | 19,25 px       | 600  | Public Sans | —                              | `typography.ts:98-102`  |
| `body1`     | `1rem`      | **14 px**    | `1.5`                          | 21 px          | 400  | Public Sans | —                              | `typography.ts:103-106` |
| `body2`     | `0.875rem`  | **12,25 px** | `1.5714285714285714`           | **19,25 px**   | 400  | Public Sans | —                              | `typography.ts:107-110` |
| `caption`   | `0.75rem`   | **10,5 px**  | `1.5`                          | 15,75 px       | 400  | Public Sans | —                              | `typography.ts:111-114` |
| `overline`  | `0.75rem`   | **10,5 px**  | `1.5`                          | 15,75 px       | 700  | Public Sans | **`uppercase`**                | `typography.ts:115-120` |
| `button`    | `0.875rem`  | **12,25 px** | `1.7142857142857142` (= 24/14) | 21 px          | 700  | Public Sans | **`unset`** (renderiza `none`) | `typography.ts:121-126` |

**Medições em runtime** (confirmações):

- `body` → `font-size: 14px`, `line-height: 21px` ✔ (`body1`)
- `.MuiTypography-body2` → `font-size: 12,25px`, `line-height: 19,25px`, `font-weight: 400` ✔
- botão medium → `font-size: 12,25px`, `line-height: 21px`, `font-weight: 700`, `text-transform: none` ✔
- helper text de campo → `font-size: 10,5px`, `line-height: 15,75px` ✔ (`caption`)

⚠️ **`text-transform: unset` no botão** é uma decisão explícita do projeto — a biblioteca base usa
`uppercase`. Ao reproduzir em outra biblioteca, **desligue** qualquer transformação automática.

### 3.3 `letter-spacing`

**Nenhuma variante define `letter-spacing`.** Varredura em `frontend/src/theme/core/typography.ts`:
zero ocorrências. O valor computado é sempre `normal`
(medido em runtime no `h3`: `letter-spacing: normal`).

Há uma variante `inherit` gerada pela biblioteca (`fontFamily/fontWeight/fontSize/lineHeight/letterSpacing: inherit`),
usada por `<Typography variant="inherit">` — default MUI 7.0.1.

---

## 4. Variações responsivas — resumo

Geradas por `responsiveFontSizes()` (`frontend/src/theme/core/typography.ts:22-37`), que emite
media queries `@media (min-width: …)` a partir dos breakpoints da biblioteca.

| Variante                                                  | base      | `≥600px` (sm) | `≥900px` (md) | `≥1200px` (lg) | `≥1536px` (xl) |
| --------------------------------------------------------- | --------- | ------------- | ------------- | -------------- | -------------- |
| `h1`                                                      | 35 px     | 45,5 px       | 50,75 px      | 56 px          | —              |
| `h2`                                                      | 28 px     | 35 px         | 38,5 px       | 42 px          | —              |
| `h3`                                                      | 21 px     | 22,75 px      | 26,25 px      | 28 px          | —              |
| `h4`                                                      | 17,5 px   | —             | 21 px         | —              | —              |
| `h5`                                                      | 15,75 px  | 16,625 px     | —             | —              | —              |
| `h6`                                                      | 14,875 px | 15,75 px      | —             | —              | —              |
| `subtitle1/2`, `body1/2`, `caption`, `overline`, `button` | fixo      | fixo          | fixo          | fixo           | fixo           |

⚠️ **Nenhuma variante tem regra em `xl` (1536 px).** Acima de 1200 px a tipografia congela.

Media queries literais emitidas:
`@media (min-width:600px)`, `@media (min-width:900px)`, `@media (min-width:1200px)`.

---

## 5. Onde cada variante é usada (frequência real)

Contagem por varredura em `frontend/src/**/*.tsx`.

| Variante    | `variant="…"` | `typography: '…'` em `sx` | Total   | Papel observado                                     |
| ----------- | ------------- | ------------------------- | ------- | --------------------------------------------------- |
| `body2`     | 418           | 120                       | **538** | texto padrão de toda a interface                    |
| `subtitle2` | 192           | 74                        | **266** | rótulos, títulos de item de lista, ênfase em tabela |
| `caption`   | 187           | 80                        | **267** | metadados, datas, texto auxiliar, ajuda de campo    |
| `h6`        | 111           | 11                        | **122** | título de card e de diálogo                         |
| `h4`        | 75            | 9                         | **84**  | título principal de página                          |
| `subtitle1` | 54            | 19                        | **73**  | subtítulo de bloco                                  |
| `h5`        | 32            | 9                         | **41**  | título de seção                                     |
| `overline`  | 28            | 10                        | **38**  | rótulo de categoria em caixa alta                   |
| `h3`        | 23            | 11                        | **34**  | título de destaque (login, páginas institucionais)  |
| `h2`        | 11            | 5                         | **16**  | títulos de página institucional                     |
| `body1`     | 11            | 1                         | **12**  | pouco usado explicitamente — é o default do `body`  |
| `h1`        | 6             | 0                         | **6**   | telas de erro e landing                             |
| `button`    | —             | —                         | —       | aplicado automaticamente a botões                   |

**Leitura**: a interface é fortemente baseada em `body2` (12,25 px) + `subtitle2` (12,25 px, peso 600)

- `caption` (10,5 px). É uma UI de **alta densidade**.

### 5.1 Aplicações automáticas de variante (defaults do tema)

| Componente                        | Variante aplicada                                       | Origem (arquivo:linha)                                          |
| --------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| Título de card                    | `h6`                                                    | `frontend/src/theme/core/components/card.tsx:26`                |
| Subtítulo de card                 | `body2` + `margin-top: 4px`                             | `frontend/src/theme/core/components/card.tsx:27`                |
| Texto primário de item de lista   | `subtitle2`                                             | `frontend/src/theme/core/components/list.tsx:32`                |
| Texto secundário de item de lista | renderizado como `<span>`                               | `frontend/src/theme/core/components/list.tsx:33`                |
| Item de menu                      | `body2`                                                 | `frontend/src/theme/core/mixins/global-styles-components.ts:21` |
| Item de breadcrumb                | `body2`                                                 | `frontend/src/theme/core/components/breadcrumbs.tsx:12`         |
| Rótulo de item de árvore          | `body2`                                                 | `frontend/src/theme/core/components/mui-x-tree-view.tsx:10`     |
| Rótulo de campo (repouso)         | `body2`                                                 | `frontend/src/theme/core/components/form.tsx:13`                |
| Rótulo de campo (recolhido)       | `body1` + peso `600`                                    | `frontend/src/theme/core/components/form.tsx:16-17`             |
| Rótulo de checkbox/radio/switch   | `body2`                                                 | `frontend/src/theme/core/components/form.tsx:47`                |
| Etiqueta de autocomplete          | `subtitle2`                                             | `frontend/src/theme/core/components/autocomplete.tsx:36`        |
| Item de aba                       | peso `500`; selecionado `600`; `line-height` de `body2` | `frontend/src/theme/core/components/tabs.tsx:44-50`             |
| Cabeçalho de tabela               | `font-size: 14px` (px puro!) + peso `600`               | `frontend/src/theme/core/components/table.tsx:59-62`            |
| Cabeçalho do DataGrid             | `font-size: 14px` (px puro!)                            | `frontend/src/theme/core/components/mui-x-data-grid.tsx:131`    |

⚠️ **Cabeçalho de tabela usa `fontSize: 14` em px puro**, e não a escala em `rem`.
Como o corpo do texto (`body2`) renderiza 12,25 px, o cabeçalho fica **maior que o conteúdo**
(14 px vs 12,25 px). Ver `99-inconsistencias.md`.

---

## 6. Tamanhos tipográficos fora da escala

Valores de fonte definidos diretamente em componentes, sem passar pelas variantes:

| Valor          | rem nominal | px real       | Onde                                                                  | Origem (arquivo:linha)                                       |
| -------------- | ----------- | ------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `pxToRem(15)`  | `0.9375rem` | **13,125 px** | texto digitado dentro de qualquer campo                               | `frontend/src/theme/core/components/textfield.tsx:21`        |
| `pxToRem(16)`  | `1rem`      | **14 px**     | texto de campo **abaixo de 600 px** (evita zoom automático no Safari) | `frontend/src/theme/core/components/textfield.tsx:22-25`     |
| `pxToRem(13)`  | `0.8125rem` | **11,375 px** | rótulo de marca do slider                                             | `frontend/src/theme/core/components/slider.tsx:104`          |
| `pxToRem(12)`  | `0.75rem`   | **10,5 px**   | componente `Label`                                                    | `frontend/src/components/label/styles.tsx:98`                |
| `14` (px puro) | —           | **14 px**     | cabeçalho de tabela                                                   | `frontend/src/theme/core/components/table.tsx:60`            |
| `14` (px puro) | —           | **14 px**     | cabeçalho do DataGrid                                                 | `frontend/src/theme/core/components/mui-x-data-grid.tsx:131` |
| `16` (px puro) | —           | **16 px**     | avatar dentro de grupo de avatares                                    | `frontend/src/theme/core/components/avatar.tsx:114`          |
| `12` (px puro) | —           | **12 px**     | primeiro avatar do grupo (contador)                                   | `frontend/src/theme/core/components/avatar.tsx:117`          |
| `0.8125rem`    | `0.8125rem` | **11,375 px** | rótulo de chip (default da biblioteca base, 13/16)                    | default MUI 7.0.1 — medido em runtime                        |

---

## 7. Referência rápida — px real por token

Tabela para consulta durante a reprodução (viewport ≥ 1200 px):

| Token               | px real | line-height px       | Peso |
| ------------------- | ------- | -------------------- | ---- |
| `h1`                | 56      | 70                   | 800  |
| `h2`                | 42      | 56                   | 800  |
| `h3`                | 28      | 42                   | 700  |
| `h4`                | 21      | 31,5                 | 700  |
| `h5`                | 16,625  | 24,94                | 700  |
| `h6`                | 15,75   | 24,5                 | 600  |
| `subtitle1`         | 14      | 21                   | 600  |
| `subtitle2`         | 12,25   | 19,25                | 600  |
| `body1`             | 14      | 21                   | 400  |
| `body2`             | 12,25   | 19,25                | 400  |
| `caption`           | 10,5    | 15,75                | 400  |
| `overline`          | 10,5    | 15,75                | 700  |
| `button`            | 12,25   | 21                   | 700  |
| texto de campo      | 13,125  | 20,125               | 400  |
| cabeçalho de tabela | 14      | —                    | 600  |
| `Label`             | 10,5    | 0 (`line-height: 0`) | 700  |

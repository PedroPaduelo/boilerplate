# FAB (Floating Action Button)

`MuiFab`.

> **Base de conversão**: `html { font-size: 14px }` → `px_real = rem × 14` (`FATOS.md` §1).

---

## Anatomia

| Parte              | Classe                                     | O que é                                                                                                                   |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| root               | `.MuiFab-root` / `.MuiButtonBase-root`     | `ButtonBase` (`<button>`), `display: inline-flex`, `align-items: center`, `justify-content: center`, `position: relative` |
| conteúdo           | (children direto)                          | ícone e/ou texto; não há slot próprio                                                                                     |
| variante estendida | `.MuiFab-extended`                         | pílula com texto                                                                                                          |
| cor herdada        | `.MuiFab-colorInherit`                     | seletor usado pelos overrides do projeto                                                                                  |
| tamanhos           | `.MuiFab-sizeSmall` / `.MuiFab-sizeMedium` | (não existe `sizeLarge`: `large` é o default e não recebe classe de tamanho no seletor usado)                             |
| desabilitado       | `.Mui-disabled`                            | estado                                                                                                                    |
| ripple             | `.MuiTouchRipple-root`                     | do `ButtonBase`                                                                                                           |

Nas variantes estendidas, o espaçamento entre ícone e texto é feito por **`gap`** (não por margem de
ícone como no `Button`): `8px` em `large`/`medium`, `4px` em `small`
(`src/theme/core/components/button-fab.tsx:158, 164`).

---

## Variantes e tamanhos

### Variantes

| Variante               | Forma                   | Origem                                                                             | Existe no MUI puro? |
| ---------------------- | ----------------------- | ---------------------------------------------------------------------------------- | ------------------- |
| `circular`             | círculo                 | MUI (**default**, `default MUI 7.0.1 (node_modules/@mui/material/Fab/Fab.js:184)`) | sim                 |
| `extended`             | pílula com texto        | MUI + override de tamanho do projeto                                               | sim                 |
| **`outlined`**         | círculo com borda       | **criada pelo projeto**                                                            | **não**             |
| **`outlinedExtended`** | pílula com borda        | **criada pelo projeto**                                                            | **não**             |
| **`soft`**             | círculo com fundo fraco | **criada pelo projeto**                                                            | **não**             |
| **`softExtended`**     | pílula com fundo fraco  | **criada pelo projeto**                                                            | **não**             |

Declaração das 4 variantes novas: `src/theme/core/components/button-fab.tsx:14-19`.
Agrupamentos usados internamente (`button-fab.tsx:25-29`):

```
DEFAULT_COLORS   = ['default', 'inherit']
EXTENDED_VARIANT = ['extended', 'outlinedExtended', 'softExtended']
FILLED_VARIANT   = ['circular', 'extended']
OUTLINED_VARIANT = ['outlined', 'outlinedExtended']
SOFT_VARIANT     = ['soft', 'softExtended']
```

### Cores

`default` + `inherit` + as 6 de paleta (`primary`, `secondary`, `info`, `success`, `warning`, `error`).

⚠️ **`defaultProps: { color: 'primary' }`** — `src/theme/core/components/button-fab.tsx:176`.
Isso muda o default do MUI, que é `color: 'default'` (`default MUI 7.0.1 (Fab.js:178)`).

### Tamanhos

`small` | `medium` | `large` (**default**, `default MUI 7.0.1 (Fab.js:183)`).

---

## Medidas

### Variantes **circulares** (`circular`, `outlined`, `soft`)

| size              | width    | height   | border-radius  | padding | Origem                             |
| ----------------- | -------- | -------- | -------------- | ------- | ---------------------------------- |
| `large` (default) | **56px** | **56px** | `50%` (= 28px) | `0`     | `default MUI 7.0.1 (Fab.js:58-62)` |
| `medium`          | **48px** | **48px** | `50%` (= 24px) | `0`     | `default MUI 7.0.1 (Fab.js:89-96)` |
| `small`           | **40px** | **40px** | `50%` (= 20px) | `0`     | `default MUI 7.0.1 (Fab.js:81-88)` |

⚠️ As variantes `outlined` e `soft` **não** são reconhecidas pelo MUI, mas as regras de tamanho do
MUI casam apenas por `size` — logo, valem 56/48/40 também para elas. O `border-radius: 50%` do root
(`Fab.js:58`) também permanece. `⚠️ NÃO CONFIRMADO` em runtime (não consta na §10 do `FATOS.md`);
derivado por leitura de fonte.

### Variantes **estendidas** (`extended`, `outlinedExtended`, `softExtended`)

Todas passam pelo bloco `sizes` do projeto (`src/theme/core/components/button-fab.tsx:150-170`):

| size              | height / min-height | border-radius         | gap             | padding              | Origem                   |
| ----------------- | ------------------- | --------------------- | --------------- | -------------------- | ------------------------ |
| `large` (default) | **48px**            | **24px** (= `48 / 2`) | `8px`           | `0px 16px`           | `button-fab.tsx:154-159` |
| `medium`          | **40px**            | **20px** (= `40 / 2`) | `8px` (herdado) | `0px 16px` (herdado) | `button-fab.tsx:167`     |
| `small`           | **34px**            | **17px** (= `34 / 2`) | `4px`           | `0px 8px`            | `button-fab.tsx:160-166` |

- `width: auto` em todas (`button-fab.tsx:155`).
- `gap` e `padding` são emitidos via `theme.spacing()`: com `cssVariables` ligado o CSS sai como
  `calc(1 * var(--spacing))` / `calc(2 * var(--spacing))`, e `--spacing: 8px` (`FATOS.md` §5.1).
- `min-width`: só `extended` recebe `min-width: 48px` / `40px` / `34px` do MUI
  (`default MUI 7.0.1 (Fab.js:97-132)`). `outlinedExtended` e `softExtended` **não** casam com
  `variant: 'extended'`, então ficam com o `min-width: 0` do root (`Fab.js:60`).

### Comuns a todas as variantes

| Propriedade         | Valor bruto                                                                                                                                                       | Referência simbólica                       | Origem                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| `min-height` (root) | `36px`                                                                                                                                                            | —                                          | `default MUI 7.0.1 (Fab.js:54)`                   |
| `font-size`         | `0.875rem` = **12,25px**                                                                                                                                          | `typography.button.fontSize`               | `src/theme/core/typography.ts:121-126`            |
| `line-height`       | `1.7142857142857142` (= 24/14) → **21px**                                                                                                                         | `typography.button.lineHeight`             | idem                                              |
| `font-weight`       | `700`                                                                                                                                                             | `typography.button.fontWeight`             | idem                                              |
| `text-transform`    | `none`                                                                                                                                                            | `typography.button.textTransform: 'unset'` | idem                                              |
| `z-index`           | `1050`                                                                                                                                                            | `zIndex.fab`                               | `default MUI 7.0.1 (Fab.js:63)` + `FATOS.md` §5.4 |
| `transition`        | `background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` | `duration.short`, `easing.easeInOut`       | `default MUI 7.0.1 (Fab.js:55-57)`                |

⚠️ Na página de demonstração `/components/mui/buttons` o texto do FAB aparece em `capitalize`;
isso vem só da demo (`src/sections/_examples/mui/button-view/view.tsx:22`), não do design system.

---

## Tabela de estados

Cores usadas (`FATOS.md` §3): `grey.300 = #DFE3E8` · `grey.400 = #C4CDD5` · `grey.700 = #454F5B` ·
`grey.800 = #1C252E` · `text.primary = #1C252E` · `text.secondary = #637381` ·
`action.hover = rgba(145 158 171 / 0.08)` · `action.disabled = rgba(145 158 171 / 0.8)` ·
`action.disabledBackground = rgba(145 158 171 / 0.24)`.

### `circular` / `extended` — cores de paleta (inclui o **default `primary`**)

| Estado         | Fundo                      | Texto                     | Borda   | Sombra                                                                                                                                          | Transição                          |
| -------------- | -------------------------- | ------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| default        | `<cor>.main`               | `<cor>.contrastText`      | nenhuma | **`customShadows[<cor>]`**                                                                                                                      | 250ms cubic-bezier(0.4, 0, 0.2, 1) |
| hover          | `<cor>.dark`               | idem                      | nenhuma | **`none`**                                                                                                                                      | idem                               |
| focus-visible  | `<cor>.main`               | idem                      | nenhuma | `0px 3px 5px -1px rgba(145 158 171 / 0.2),0px 6px 10px 0px rgba(145 158 171 / 0.14),0px 1px 18px 0px rgba(145 158 171 / 0.12)` (`shadows[6]`)   | idem                               |
| active/pressed | `<cor>.main`               | idem                      | nenhuma | `0px 7px 8px -4px rgba(145 158 171 / 0.2),0px 12px 17px 2px rgba(145 158 171 / 0.14),0px 5px 22px 4px rgba(145 158 171 / 0.12)` (`shadows[12]`) | idem                               |
| disabled       | `rgba(145 158 171 / 0.24)` | `rgba(145 158 171 / 0.8)` | nenhuma | `none`                                                                                                                                          | idem                               |

Sombras coloridas de repouso (`src/theme/core/components/button-fab.tsx:37-40` + `src/theme/core/custom-shadows.ts:35-37, 53-58`):

| Cor       | Fundo                     | Sombra de repouso                      |
| --------- | ------------------------- | -------------------------------------- |
| primary   | `#00A76F` rgb(0,167,111)  | `0 8px 16px 0 rgba(0 167 111 / 0.24)`  |
| secondary | `#8E33FF` rgb(142,51,255) | `0 8px 16px 0 rgba(142 51 255 / 0.24)` |
| info      | `#00B8D9` rgb(0,184,217)  | `0 8px 16px 0 rgba(0 184 217 / 0.24)`  |
| success   | `#22C55E` rgb(34,197,94)  | `0 8px 16px 0 rgba(34 197 94 / 0.24)`  |
| warning   | `#FFAB00` rgb(255,171,0)  | `0 8px 16px 0 rgba(255 171 0 / 0.24)`  |
| error     | `#FF5630` rgb(255,86,48)  | `0 8px 16px 0 rgba(255 86 48 / 0.24)`  |

⚠️ **Inversão de comportamento**: o FAB tem sombra **em repouso** e **perde** a sombra no hover —
oposto do `Button`, que não tem sombra em repouso e ganha no hover.

### `circular` / `extended` — cor `default`

| Estado   | Fundo                                   | Texto                                | Borda   | Sombra                                                       | Transição                          |
| -------- | --------------------------------------- | ------------------------------------ | ------- | ------------------------------------------------------------ | ---------------------------------- |
| default  | `#DFE3E8` rgb(223,227,232) (`grey.300`) | `#1C252E` rgb(28,37,46) (`grey.800`) | nenhuma | `0 8px 16px 0 rgba(145 158 171 / 0.16)` (`customShadows.z8`) | 250ms cubic-bezier(0.4, 0, 0.2, 1) |
| hover    | `#C4CDD5` rgb(196,205,213) (`grey.400`) | `#1C252E`                            | nenhuma | **`none`**                                                   | idem                               |
| active   | `#DFE3E8`                               | `#1C252E`                            | nenhuma | `shadows[12]`                                                | idem                               |
| disabled | `rgba(145 158 171 / 0.24)`              | `rgba(145 158 171 / 0.8)`            | nenhuma | `none`                                                       | idem                               |

Origem: `src/theme/core/components/button-fab.tsx:42-53`.

### `circular` / `extended` — cor `inherit`

| Estado   | Fundo                                    | Texto                     | Borda   | Sombra                                                       | Transição                          |
| -------- | ---------------------------------------- | ------------------------- | ------- | ------------------------------------------------------------ | ---------------------------------- |
| default  | `#1C252E` rgb(28,37,46) (`text.primary`) | `#FFFFFF`                 | nenhuma | `0 8px 16px 0 rgba(145 158 171 / 0.16)` (`customShadows.z8`) | 250ms cubic-bezier(0.4, 0, 0.2, 1) |
| hover    | `#454F5B` rgb(69,79,91) (`grey.700`)     | `#FFFFFF`                 | nenhuma | `none`                                                       | idem                               |
| disabled | `rgba(145 158 171 / 0.24)`               | `rgba(145 158 171 / 0.8)` | nenhuma | `none`                                                       | idem                               |

Modo dark: texto `#1C252E` (`grey.800`) e hover `#C4CDD5` (`grey.400`) — `button-fab.tsx:61-64`.
Origem: `src/theme/core/components/button-fab.tsx:57-65`.

### `outlined` / `outlinedExtended`

| Estado                        | Fundo                                       | Texto                                        | Borda                                 | Sombra                          | Transição                          |
| ----------------------------- | ------------------------------------------- | -------------------------------------------- | ------------------------------------- | ------------------------------- | ---------------------------------- |
| default (sem cor / `default`) | `transparent`                               | `#637381` rgb(99,115,129) (`text.secondary`) | `solid 1px rgba(145 158 171 / 0.32)`  | **`none`**                      | 250ms cubic-bezier(0.4, 0, 0.2, 1) |
| default (`inherit`)           | `transparent`                               | `#1C252E` (`text.primary`)                   | `solid 1px rgba(145 158 171 / 0.32)`  | `none`                          | idem                               |
| default (cor de paleta)       | `transparent`                               | `<cor>.main`                                 | `solid 1px rgba(<canal main> / 0.48)` | `none`                          | idem                               |
| hover (sem cor / `inherit`)   | `rgba(145 158 171 / 0.08)` (`action.hover`) | idem                                         | `1px solid currentColor`              | **`0 0 0 0.75px currentColor`** | idem                               |
| hover (cor de paleta)         | `rgba(<canal main> / 0.08)`                 | `<cor>.main`                                 | `1px solid currentColor`              | **`0 0 0 0.75px currentColor`** | idem                               |
| active                        | igual ao default                            | idem                                         | idem                                  | `shadows[12]` (não anulado)     | idem                               |
| disabled                      | `transparent`                               | `rgba(145 158 171 / 0.8)`                    | `1px solid rgba(145 158 171 / 0.24)`  | `none`                          | idem                               |

Bordas de repouso por cor (`varAlpha(<canal main>, 0.48)`, `button-fab.tsx:79`):
primary `rgba(0 167 111 / 0.48)` · secondary `rgba(142 51 255 / 0.48)` · info `rgba(0 184 217 / 0.48)` ·
success `rgba(34 197 94 / 0.48)` · warning `rgba(255 171 0 / 0.48)` · error `rgba(255 86 48 / 0.48)`.

Fundos de hover por cor (`varAlpha(<canal main>, 0.08)`, `button-fab.tsx:80`):
primary `rgba(0 167 111 / 0.08)` · secondary `rgba(142 51 255 / 0.08)` · info `rgba(0 184 217 / 0.08)` ·
success `rgba(34 197 94 / 0.08)` · warning `rgba(255 171 0 / 0.08)` · error `rgba(255 86 48 / 0.08)`.

⚠️ Diferente do `MuiButton` `outlined`, aqui **o anel de hover `0 0 0 0.75px currentColor` vale
também para `inherit`/`default`**, porque as regras são entradas separadas do array `variants`
(não um spread raso). Origem: `src/theme/core/components/button-fab.tsx:83-103` (base) e `:71-82` (cores).

### `soft` / `softExtended`

| Estado                  | Fundo                                                    | Texto                      | Borda   | Sombra                      | Transição                          |
| ----------------------- | -------------------------------------------------------- | -------------------------- | ------- | --------------------------- | ---------------------------------- |
| default (cor de paleta) | `rgba(<canal main> / 0.16)`                              | `<cor>.dark`               | nenhuma | **`none`**                  | 250ms cubic-bezier(0.4, 0, 0.2, 1) |
| hover (cor de paleta)   | `rgba(<canal main> / 0.32)`                              | `<cor>.dark`               | nenhuma | `none`                      | idem                               |
| default (`default`)     | `#DFE3E8` (`grey.300`)                                   | `#1C252E` (`grey.800`)     | nenhuma | `none`                      | idem                               |
| hover (`default`)       | `#C4CDD5` (`grey.400`)                                   | `#1C252E`                  | nenhuma | `none`                      | idem                               |
| default (`inherit`)     | `rgba(145 158 171 / 0.08)`                               | `#1C252E` (`text.primary`) | nenhuma | `none`                      | idem                               |
| hover (`inherit`)       | `rgba(145 158 171 / 0.24)`                               | `#1C252E`                  | nenhuma | `none`                      | idem                               |
| active                  | igual ao default                                         | idem                       | nenhuma | `shadows[12]` (não anulado) | idem                               |
| disabled                | `rgba(145 158 171 / 0.24)` (`action.disabledBackground`) | `rgba(145 158 171 / 0.8)`  | nenhuma | `none`                      | idem                               |

Valores por cor (`button-fab.tsx:112-123`):

| Cor       | Fundo default             | Texto     | Fundo hover               |
| --------- | ------------------------- | --------- | ------------------------- |
| primary   | `rgba(0 167 111 / 0.16)`  | `#007867` | `rgba(0 167 111 / 0.32)`  |
| secondary | `rgba(142 51 255 / 0.16)` | `#5119B7` | `rgba(142 51 255 / 0.32)` |
| info      | `rgba(0 184 217 / 0.16)`  | `#006C9C` | `rgba(0 184 217 / 0.32)`  |
| success   | `rgba(34 197 94 / 0.16)`  | `#118D57` | `rgba(34 197 94 / 0.32)`  |
| warning   | `rgba(255 171 0 / 0.16)`  | `#B76E00` | `rgba(255 171 0 / 0.32)`  |
| error     | `rgba(255 86 48 / 0.16)`  | `#B71D18` | `rgba(255 86 48 / 0.32)`  |

Modo dark: texto passa a `<cor>.light` (`button-fab.tsx:120-122`).
Origem: `src/theme/core/components/button-fab.tsx:106-148`.

### Estados sem customização

| Estado              | Comportamento                                                                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `focus-visible`     | `box-shadow: shadows[6]` — `default MUI 7.0.1 (Fab.js:78-80)`. Nas variantes `outlined`/`soft` esse valor **não** é anulado pelo projeto, mas o `box-shadow: none` da base (`button-fab.tsx:87, 113, 133`) tem menor especificidade que `.Mui-focusVisible` → o `shadows[6]` prevalece no foco. `⚠️ NÃO CONFIRMADO` em runtime. |
| `active`/pressed    | `box-shadow: shadows[12]` — `default MUI 7.0.1 (Fab.js:65-67)`. Nenhuma variante do projeto anula.                                                                                                                                                                                                                              |
| `selected`          | não existe em `Fab`.                                                                                                                                                                                                                                                                                                            |
| `error`             | não existe; usa-se `color="error"`.                                                                                                                                                                                                                                                                                             |
| `loading`           | não existe em `Fab` (só em `Button`).                                                                                                                                                                                                                                                                                           |
| disabled (ponteiro) | `pointer-events: none`, `cursor: default` — `default MUI 7.0.1 (node_modules/@mui/material/ButtonBase/ButtonBase.js:75-79)`                                                                                                                                                                                                     |

---

## Regras de uso observadas

1. **A cor padrão do FAB é `primary`** (verde `#00A76F`), diferente do `Button`, cuja padrão é
   `inherit`. Um `<Fab>` sem props é um botão redondo verde de 56×56px com sombra verde.
2. **Sombra em repouso, sem sombra no hover** — nas variantes preenchidas (`circular`/`extended`).
   A sombra é a **colorida** `customShadows[<cor>]` (16px de blur, 24% de alfa), não a sombra
   neutra do MUI.
3. **Raio = altura ÷ 2 nas variantes estendidas**: 48→24px, 40→20px, 34→17px. Nas circulares,
   `border-radius: 50%`.
4. **`small` estendido é 34px**, altura que não existe em nenhum outro componente do sistema
   (o `Button` small é 30px, o `Chip` small é 24px).
5. **`outlined*` reaproveita o mesmo "anel" de hover do `Button` `outlined`**
   (`box-shadow: 0 0 0 0.75px currentColor` + `border-color: currentColor`), mas aqui o anel
   também se aplica às cores `default`/`inherit`.
6. **`soft*` nunca tem sombra**, em nenhum estado declarado — é o FAB mais "plano" do conjunto.
7. **`gap`, não margem**: para reproduzir o espaçamento ícone↔texto em outra biblioteca use
   `gap: 8px` (`4px` no small), e não margens no ícone.

---

## Origem

| Item                                                               | Arquivo:linha                                               |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| Tipos das variantes novas                                          | `src/theme/core/components/button-fab.tsx:14-19`            |
| Lista de cores                                                     | `src/theme/core/components/button-fab.tsx:23`               |
| Agrupamentos de variantes                                          | `src/theme/core/components/button-fab.tsx:25-29`            |
| `filled` — sombras coloridas + hover sem sombra                    | `src/theme/core/components/button-fab.tsx:31-41`            |
| `filled` — cor `default` e `inherit`                               | `src/theme/core/components/button-fab.tsx:42-68`            |
| `outlined` — cores (texto/borda 48% /hover 8%)                     | `src/theme/core/components/button-fab.tsx:71-82`            |
| `outlined` — base (sem sombra, borda 32%, anel de hover, disabled) | `src/theme/core/components/button-fab.tsx:83-104`           |
| `soft` — cores (fundo 16% → 32%, texto `dark`/`light`)             | `src/theme/core/components/button-fab.tsx:106-124`          |
| `soft` — base (`default` e `inherit`)                              | `src/theme/core/components/button-fab.tsx:125-148`          |
| `sizes` — alturas 48/40/34, raio ÷2, gap, padding                  | `src/theme/core/components/button-fab.tsx:150-170`          |
| `defaultProps: { color: 'primary' }`                               | `src/theme/core/components/button-fab.tsx:176`              |
| Registro das variantes no root                                     | `src/theme/core/components/button-fab.tsx:181-205`          |
| Export                                                             | `src/theme/core/components/button-fab.tsx:210`              |
| `shadows[6]` e `shadows[12]`                                       | `src/theme/core/shadows.ts:23, 29`                          |
| `customShadows.z8` e coloridas                                     | `src/theme/core/custom-shadows.ts:35-37, 43, 53-58`         |
| `typography.button`                                                | `src/theme/core/typography.ts:121-126`                      |
| `--spacing: 8px`                                                   | `FATOS.md` §5.1                                             |
| Defaults do MUI (`Fab`)                                            | `node_modules/@mui/material/Fab/Fab.js:40-169, 170-209`     |
| Defaults do MUI (`ButtonBase` root)                                | `node_modules/@mui/material/ButtonBase/ButtonBase.js:41-83` |

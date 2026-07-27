# 06 — Ícones

> Documento descritivo do sistema de design **como ele é hoje**, apurado por leitura de código,
> computação do tema real e medição em runtime (Chrome, viewport 1911×898, tema light).
> Fonte primária: `frontend/.ds-extract/FATOS.md`.
>
> **Nenhum valor deste documento é sugestão.** Todo valor existe no código do projeto ou é
> default efetivo da biblioteca de componentes (MUI 7.0.1), e nesse caso está marcado como
> `default MUI 7.0.1`.

---

## 1. Biblioteca de ícones

| Item                          | Valor bruto                                                                 | Origem                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Biblioteca                    | **Iconify** — pacote `@iconify/react`                                       | `frontend/package-lock.json` (lockfileVersion 3)                                                                |
| Versão exata instalada        | `5.2.0`                                                                     | `frontend/package-lock.json`                                                                                    |
| Componente de acesso          | `Iconify` (wrapper próprio sobre `Icon` do Iconify)                         | `frontend/src/components/iconify/iconify.tsx:21-54`                                                             |
| Elemento raiz                 | `styled(Icon)` sem estilos próprios                                         | `frontend/src/components/iconify/iconify.tsx:58`                                                                |
| Classe CSS aplicada           | `minimal__iconify__root`                                                    | `frontend/src/components/iconify/classes.ts:5-7` (prefixo `minimal` em `frontend/src/theme/theme-config.ts:36`) |
| Renderização                  | `ssr` ativado (evita flicker de hidratação)                                 | `frontend/src/components/iconify/iconify.tsx:38`                                                                |
| Registro offline              | `addCollection` por prefixo, executado uma única vez (`areIconsRegistered`) | `frontend/src/components/iconify/register-icons.ts:33-51`                                                       |
| Aviso de ícone não registrado | `console.warn` informando que o ícone será carregado online e pode piscar   | `frontend/src/components/iconify/iconify.tsx:24-32`                                                             |

**Há duas famílias de ícones no sistema, com origens diferentes:**

1. **Ícones Iconify registrados offline** — 224 ícones embutidos em
   `frontend/src/components/iconify/icon-sets.ts`, consumidos via `<Iconify icon="..." />`.
2. **Ícones SVG inline definidos dentro do tema** — 30 componentes desenhados diretamente nos
   arquivos de override (`frontend/src/theme/core/components/**`), usados como `defaultProps` de
   componentes (§5). **Não passam pelo Iconify** — são `SvgIcon` puros.

---

## 2. Coleções (icon sets) registradas offline

Total: **224 ícones**, em **8 prefixos**
(contagem sobre `frontend/src/components/iconify/icon-sets.ts`, 702 linhas).

| Prefixo    | Qtd. | Estilo predominante (contagem por sufixo/prefixo de nome)               | Natureza                                                                                 |
| ---------- | ---- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `solar`    | 118  | `bold` (75), `bold-duotone` (24), `outline` (17), `broken` (2)          | Sólidos com variantes duotone — é o vocabulário visual principal do produto              |
| `eva`      | 35   | `fill` (32), `outline` (3)                                              | Sólidos geométricos, usados sobretudo em setas e ações                                   |
| `ic`       | 24   | `round` (20), `baseline` (4)                                            | Material Icons (Google) — usados em formatação de texto e alinhamento                    |
| `carbon`   | 15   | sem sufixo de estilo (nomes simples: `close`, `menu`, `play`, `pause`…) | IBM Carbon — **único set com grade nativa 32×32** (§3.3)                                 |
| `mingcute` | 12   | `fill` (6), `line` (6)                                                  | Setas, calendários, logos de plataforma (`apple-fill`, `windows-fill`, `android-2-fill`) |
| `custom`   | 11   | `fill` (6), `duotone` (3), `outline` (2)                                | **Ícones próprios do projeto** (§2.1)                                                    |
| `socials`  | 6    | logos coloridos                                                         | Marcas: `linkedin`, `facebook`, `github`, `twitter`, `google`, `instagram`               |
| `payments` | 3    | logos coloridos                                                         | Bandeiras: `mastercard`, `visa`, `paypal`                                                |

Comando de verificação (reproduzível):

```
grep -cE "^  '[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+':" frontend/src/components/iconify/icon-sets.ts   # → 224
```

### 2.1 Ícones próprios (`custom:`)

Os 11 ícones do prefixo `custom` não vêm de nenhuma coleção pública — são desenhados para o
produto e registrados no mesmo mecanismo offline.

| Nome                             | Estilo  | Uso conhecido no design system                                                              |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| `custom:menu-duotone`            | duotone | Botão de menu (hambúrguer) do header — `frontend/src/layouts/components/menu-button.tsx:12` |
| `custom:invoice-duotone`         | duotone | —                                                                                           |
| `custom:profile-duotone`         | duotone | —                                                                                           |
| `custom:location-fill`           | fill    | —                                                                                           |
| `custom:sidebar-unfold-fill`     | fill    | Alternância da sidebar (expandir)                                                           |
| `custom:sidebar-fold-fill`       | fill    | Alternância da sidebar (recolher)                                                           |
| `custom:flash-outline`           | outline | —                                                                                           |
| `custom:fast-food-fill`          | fill    | —                                                                                           |
| `custom:drag-dots-fill`          | fill    | —                                                                                           |
| `custom:send-fill`               | fill    | —                                                                                           |
| `custom:calendar-agenda-outline` | outline | —                                                                                           |

Todos em `frontend/src/components/iconify/icon-sets.ts`.

### 2.2 ⚠️ Ícones que **não** herdam a cor do texto

Sete ícones têm cores fixas embutidas no SVG (são logotipos de marca, onde a cor é parte da
identidade). Eles **ignoram `currentColor`** e por isso **não** respondem a tema claro/escuro.

| Ícone                 | Nº de cores fixas                                                                          | Origem (arquivo:linha)                             |
| --------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `socials:linkedin`    | 1 (`#0A66C2`)                                                                              | `frontend/src/components/iconify/icon-sets.ts:632` |
| `socials:facebook`    | 1 (`#1877F2`)                                                                              | `frontend/src/components/iconify/icon-sets.ts:635` |
| `socials:google`      | 4 (`#4CAF50`, `#1976D2`, `#FFC107`, `#FF3D00`)                                             | `frontend/src/components/iconify/icon-sets.ts:644` |
| `socials:instagram`   | 8 (`#FD0056`, `#F30072`, `#E50097`, `#D800B9`, `#FF6400`, `#FF0100`, `#009BE1`, `#FFD600`) | `frontend/src/components/iconify/icon-sets.ts:647` |
| `payments:mastercard` | 3 (`#FF5F00`, `#EB001B`, `#F79E1B`)                                                        | `frontend/src/components/iconify/icon-sets.ts:653` |
| `payments:visa`       | 4 (`#0E4595` ×4)                                                                           | `frontend/src/components/iconify/icon-sets.ts:658` |
| `payments:paypal`     | 3 (`#002C8A`, `#0E4595`, `#001F6B`)                                                        | `frontend/src/components/iconify/icon-sets.ts:663` |

**Total: 24 cores hexadecimais literais**, confirmando a contagem de `FATOS.md` §13.
Os demais 217 ícones usam `currentColor` e herdam a cor do contexto.

---

## 3. Tamanhos

### 3.1 Tamanho padrão do wrapper `Iconify`

| Token            | Valor bruto                    | Referência MUI   | Onde é usado                  | Origem (arquivo:linha)                           |
| ---------------- | ------------------------------ | ---------------- | ----------------------------- | ------------------------------------------------ |
| `width` default  | **`20px`**                     | — (prop própria) | Todo `<Iconify>` sem `width`  | `frontend/src/components/iconify/iconify.tsx:21` |
| `height` default | **`20px`** (`height ?? width`) | —                | Todo `<Iconify>` sem `height` | `frontend/src/components/iconify/iconify.tsx:46` |

Ou seja: um `<Iconify icon="solar:eye-bold" />` sem props renderiza uma caixa de **20 × 20 px**.
O valor é **px puro**, não `rem` — portanto **não escala** com a base de `14px` do documento.

### 3.2 Tamanhos usados dentro do design system

Todos rastreáveis; são os tamanhos que o próprio sistema aplica (não são escolhas de tela).

| Tamanho             | Onde é usado                                                 | Origem (arquivo:linha)                                               |
| ------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------- |
| `16px × 16px`       | Ícone do componente `Label`                                  | `frontend/src/components/label/styles.tsx:112-113`                   |
| `16px × 16px`       | Ícone do seletor de "linhas por página"                      | `frontend/src/theme/core/components/table.tsx:100-101`               |
| `16px × 16px`       | Ícone de excluir filtro no DataGrid                          | `frontend/src/theme/core/components/mui-x-data-grid.tsx:244`         |
| `16px` (só largura) | Ícone "coluna filtrada" no DataGrid                          | `frontend/src/theme/core/components/mui-x-data-grid.tsx:50`          |
| `18px × 18px`       | Seta do `Select`                                             | `frontend/src/theme/core/components/select.tsx:35-36`                |
| `18px × 18px`       | Seta do `NativeSelect`                                       | `frontend/src/theme/core/components/select.tsx:56-57`                |
| `18px × 18px`       | Ícones do `endAdornment` do `Autocomplete`                   | `frontend/src/theme/core/components/autocomplete.tsx:54`             |
| `20px × 20px`       | **Todos** os ícones do DataGrid (normalização, §6)           | `frontend/src/theme/core/components/mui-x-data-grid.tsx:254-257`     |
| `20px × 20px`       | Ícones do `Rating` tamanho `small`                           | `frontend/src/theme/core/components/rating.tsx:34`                   |
| `22px × 22px`       | Ícone de remover do `Chip`                                   | medido em runtime (Chrome 1911×898)                                  |
| `22px`              | Ícone de item de navegação — variantes `mini` e `horizontal` | `frontend/src/components/nav-section/styles/css-vars.ts:81` e `:104` |
| `24px × 24px`       | Ícones do `Rating` tamanho `medium`                          | `frontend/src/theme/core/components/rating.tsx:35`                   |
| `24px × 24px`       | Ícone de busca rápida do DataGrid                            | `frontend/src/theme/core/components/mui-x-data-grid.tsx:62`          |
| `24px`              | Ícone de item de navegação — variante `vertical`             | `frontend/src/components/nav-section/styles/css-vars.ts:56`          |
| `24px`              | Ícone do botão de menu (hambúrguer)                          | `frontend/src/layouts/components/menu-button.tsx:12`                 |
| `28px × 28px`       | Ícones do `Rating` tamanho `large`                           | `frontend/src/theme/core/components/rating.tsx:36`                   |
| `32px × 32px`       | `SvgIcon` com `fontSize="large"`                             | `frontend/src/theme/core/components/svg-icon.tsx:9`                  |

### 3.3 Grade nativa das coleções registradas

No momento do registro, cada coleção recebe um `viewBox` implícito via `width`/`height`:

| Coleção                                                                             | `width` / `height` de registro | Origem (arquivo:linha)                                    |
| ----------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------- |
| `carbon`                                                                            | `32` / `32`                    | `frontend/src/components/iconify/register-icons.ts:43-44` |
| Todas as demais (`solar`, `eva`, `ic`, `mingcute`, `custom`, `socials`, `payments`) | `24` / `24`                    | `frontend/src/components/iconify/register-icons.ts:43-44` |

```js
width:  (iconSet.prefix === 'carbon' && 32) || 24,
height: (iconSet.prefix === 'carbon' && 32) || 24,
```

> Isso **não muda o tamanho renderizado** (que é o `width` do wrapper, §3.1) — muda a grade de
> desenho. Ícones `carbon` foram desenhados numa grade 32×32 e, ao serem exibidos a 20px, ficam
> opticamente mais finos que os `solar`/`eva` (desenhados em 24×24) no mesmo tamanho.

### 3.4 Distribuição real de uso na aplicação (informativo — não é token)

Ocorrências de `<Iconify … width={N}>` em `frontend/src` (1034 usos de `<Iconify` no total;
355 com `width` numérico explícito):

| `width`                | Ocorrências |
| ---------------------- | ----------- |
| `24`                   | 156         |
| `16`                   | 77          |
| `18`                   | 54          |
| `32`                   | 30          |
| `14`                   | 11          |
| `22`                   | 9           |
| `20`                   | 6           |
| `40`                   | 5           |
| `36`                   | 5           |
| `12`                   | 3           |
| `30`                   | 2           |
| `28`                   | 2           |
| `48`, `44`, `34`, `26` | 1 cada      |

> ⚠️ Leitura factual: o tamanho **mais usado na prática é `24px`**, e não o default do wrapper
> (`20px`), que aparece explicitamente só 6 vezes. Isso significa que a maioria dos ícones da
> aplicação **sobrescreve** o default do design system. Registrado aqui como fato observado —
> nenhuma recomendação de mudança é feita neste documento.

---

## 4. Cor e alinhamento

### 4.1 Propriedades aplicadas pelo wrapper

| Propriedade   | Valor bruto                | Efeito                                                                                                                                             | Origem (arquivo:linha)                           |
| ------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `width`       | `20px` (default)           | Caixa do ícone                                                                                                                                     | `frontend/src/components/iconify/iconify.tsx:44` |
| `height`      | `20px` (`height ?? width`) | Caixa do ícone                                                                                                                                     | `frontend/src/components/iconify/iconify.tsx:46` |
| `flex-shrink` | `0`                        | **Impede que o ícone seja comprimido** quando é filho de um contêiner flex com pouco espaço — garante que o texto quebre antes de o ícone deformar | `frontend/src/components/iconify/iconify.tsx:45` |
| `display`     | `inline-flex`              | Faz o ícone participar do fluxo de texto **e** centralizar o SVG interno; o baseline fica alinhado à caixa, não à linha de base tipográfica        | `frontend/src/components/iconify/iconify.tsx:47` |

### 4.2 Cor

- Os SVGs das coleções (exceto os 7 logotipos de §2.2) usam **`currentColor`** — ou seja,
  **a cor do ícone é a cor do texto do elemento pai**. Não existe token de cor de ícone no
  design system: a cor vem sempre por herança.
- Os ícones inline do tema (§5) também usam `fill="currentColor"` nos `path`, com duas exceções
  intencionais: os ícones de `Checkbox` (`frontend/src/theme/core/components/checkbox.tsx:12-28`)
  e o de `Rating` (`frontend/src/theme/core/components/rating.tsx:14-18`) não declaram `fill`,
  herdando o `fill` default de `SvgIcon`, que é `currentColor`
  (default MUI 7.0.1 — `@mui/material/SvgIcon/SvgIcon.js`).

Pontos onde a cor do ícone é **explicitamente** definida pelo design system:

| Regra                               | Valor bruto                                                                                                    | Origem (arquivo:linha)                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Ícone do `Chip`                     | `currentColor`                                                                                                 | `frontend/src/theme/core/components/chip.tsx:131`                 |
| Ícone de remover do `Chip`          | `currentColor` com `opacity: 0.48` (hover: `opacity: 1`)                                                       | `frontend/src/theme/core/components/chip.tsx:132-136`             |
| Ícone dentro de campo desabilitado  | `#919EAB` / `rgb(145 158 171)` (`text.disabled`)                                                               | `frontend/src/theme/core/components/textfield.tsx:17`             |
| Ícone de `ListItemIcon`             | `inherit`                                                                                                      | `frontend/src/theme/core/components/list.tsx:10`                  |
| Ícone do `Alert`                    | `opacity: 1`; cor = `<severidade>.main` no light e `<severidade>.light` no dark (variante `standard`)          | `frontend/src/theme/core/components/alert.tsx:99` e `:112-117`    |
| Ícone vazio do `Rating`             | `rgba(145 158 171 / 0.48)`                                                                                     | `frontend/src/theme/core/components/rating.tsx:33`                |
| Ícones de ordenação do DataGrid     | ativo: `text.primary` (`#1C252E` / `rgb(28 37 46)`); inativo: `text.disabled` (`#919EAB` / `rgb(145 158 171)`) | `frontend/src/theme/core/components/mui-x-data-grid.tsx:27,30,36` |
| Ícone de busca rápida do DataGrid   | `text.secondary` (`#637381` / `rgb(99 115 129)`)                                                               | `frontend/src/theme/core/components/mui-x-data-grid.tsx:62`       |
| Ícones do header com nav horizontal | `var(--layout-nav-text-secondary-color)` = `#637381` / `rgb(99 115 129)`                                       | `frontend/src/layouts/dashboard/layout.tsx:160`                   |

### 4.3 Alinhamento em relação ao texto

O sistema **não** usa alinhamento por baseline tipográfica. O padrão é sempre alinhamento por
caixa, dentro de um contêiner flex:

| Contexto                                            | Mecanismo                                                        | Valor bruto                | Origem (arquivo:linha)                                               |
| --------------------------------------------------- | ---------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------- |
| Ícone isolado                                       | `display: inline-flex` + `flex-shrink: 0`                        | —                          | `frontend/src/components/iconify/iconify.tsx:45,47`                  |
| Ícone em item de nav (`vertical`)                   | margem fixa à direita                                            | `0 12px 0 0`               | `frontend/src/components/nav-section/styles/css-vars.ts:57`          |
| Ícone em item de nav (`mini`, raiz)                 | margem abaixo (ícone acima do rótulo)                            | `0 0 6px 0`                | `frontend/src/components/nav-section/styles/css-vars.ts:82`          |
| Ícone em item de nav (`mini`/`horizontal`, subitem) | margem à direita                                                 | `0 8px 0 0`                | `frontend/src/components/nav-section/styles/css-vars.ts:83` e `:105` |
| Ícone em item de lista/menu                         | `min-width: auto` + `margin-right: 16px` (`spacing(2)`)          | `16px`                     | `frontend/src/theme/core/components/list.tsx:10`                     |
| Ícone dentro do `Label`                             | `gap: 6px` no contêiner (`spacing(0.75)`), `align-items: center` | `6px`                      | `frontend/src/components/label/styles.tsx:95,98`                     |
| Ícone no `Chip`                                     | `margin: 0 5px 0 -6px`                                           | `5px` / `-6px`             | default MUI 7.0.1 — `@mui/material/Chip/Chip.js:147`                 |
| Ícone dentro de `Tab`                               | `iconPosition: 'start'` (ícone à esquerda do rótulo)             | —                          | `frontend/src/theme/core/components/tabs.tsx:33`                     |
| Ícone no menu do DataGrid                           | `min-width: 0` + `margin-right: 16px` (`spacing(2)`)             | `16px`                     | `frontend/src/theme/core/components/mui-x-data-grid.tsx:184`         |
| Ícone do `Select`                                   | posicionado absolutamente: `right: 10px`, `top: calc(50% - 9px)` | `10px` / `calc(50% - 9px)` | `frontend/src/theme/core/components/select.tsx:34,37`                |
| Ícone da paginação de tabela                        | `right: 4px`, `top: calc(50% - 8px)`                             | `4px` / `calc(50% - 8px)`  | `frontend/src/theme/core/components/table.tsx:99,102`                |

> A consequência prática de `flexShrink: 0` + `display: inline-flex`: em uma linha
> `[ícone][texto longo]`, o texto quebra ou é truncado, **o ícone nunca encolhe**. Esse é o
> contrato de alinhamento do sistema.

---

## 5. Ícones SVG inline definidos dentro do tema

São **30 componentes** `SvgIcon` desenhados diretamente nos arquivos de override do tema.
Todos usam `viewBox` 24×24 (herdado do default de `SvgIcon`) e são injetados como `defaultProps`
— ou seja, **aparecem sem que o consumidor peça**.

> **Por que existem:** garantem que componentes de biblioteca (alert, chip, select, checkbox,
> radio, rating, seletores de data, grade de dados) usem o vocabulário visual do produto
> **sem depender de carregamento de coleção Iconify**, evitando piscada e requisição de rede.

### 5.1 Chip — 1 ícone

| Componente       | Set Iconify de origem     | Significado semântico      | Onde entra                        | Origem (arquivo:linha)                                                         |
| ---------------- | ------------------------- | -------------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| `ChipDeleteIcon` | `solar/close-circle-bold` | Remover / descartar o chip | `MuiChip.defaultProps.deleteIcon` | definição `frontend/src/theme/core/components/chip.tsx:26-36`; aplicação `:85` |

### 5.2 Alert — 4 ícones

| Componente         | Set Iconify de origem        | Significado semântico        | Onde entra            | Origem (arquivo:linha)                                                          |
| ------------------ | ---------------------------- | ---------------------------- | --------------------- | ------------------------------------------------------------------------------- |
| `AlertInfoIcon`    | `solar/info-circle-bold`     | Informação neutra            | `iconMapping.info`    | definição `frontend/src/theme/core/components/alert.tsx:15-25`; aplicação `:89` |
| `AlertSuccessIcon` | `solar/check-circle-bold`    | Operação concluída com êxito | `iconMapping.success` | definição `frontend/src/theme/core/components/alert.tsx:27-37`; aplicação `:90` |
| `AlertWarningIcon` | `solar/danger-triangle-bold` | Atenção / risco reversível   | `iconMapping.warning` | definição `frontend/src/theme/core/components/alert.tsx:39-49`; aplicação `:91` |
| `AlertErrorIcon`   | `solar/danger-bold`          | Erro / falha bloqueante      | `iconMapping.error`   | definição `frontend/src/theme/core/components/alert.tsx:51-61`; aplicação `:88` |

> Note a distinção semântica proposital: **aviso** usa triângulo (`danger-triangle-bold`) e
> **erro** usa octógono (`danger-bold`). São formas diferentes, não a mesma cor em intensidades
> diferentes.

### 5.3 Select e Autocomplete — 2 ícones (mesmo desenho, definidos em dois arquivos)

| Componente      | Set Iconify de origem         | Significado semântico      | Onde entra                                                                            | Origem (arquivo:linha)                                                                    |
| --------------- | ----------------------------- | -------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `ArrowDownIcon` | `eva/arrow-ios-downward-fill` | Abrir a lista de opções    | `MuiSelect.defaultProps.IconComponent` e `MuiNativeSelect.defaultProps.IconComponent` | definição `frontend/src/theme/core/components/select.tsx:11-19`; aplicações `:27` e `:48` |
| `ArrowDownIcon` | `eva/arrow-ios-downward-fill` | Abrir a lista de sugestões | `MuiAutocomplete.defaultProps.popupIcon`                                              | definição `frontend/src/theme/core/components/autocomplete.tsx:14-22`; aplicação `:30`    |

> ⚠️ O **mesmo** `path` SVG está duplicado nos dois arquivos (`select.tsx:16` e
> `autocomplete.tsx:19`, strings idênticas). Não há um módulo compartilhado. Registrado como fato.

### 5.4 Checkbox — 3 ícones (desenhos proprietários)

| Componente                  | Set Iconify de origem                                      | Significado semântico                                                        | Onde entra                                   | Origem (arquivo:linha)                                                             |
| --------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| `CheckboxIcon`              | **nenhum** — `path` proprietário, sem comentário de origem | Estado não marcado (moldura arredondada vazia)                               | `MuiCheckbox.defaultProps.icon`              | definição `frontend/src/theme/core/components/checkbox.tsx:12-16`; aplicação `:38` |
| `CheckboxCheckedIcon`       | **nenhum** — `path` proprietário                           | Estado marcado (caixa preenchida com "✓")                                    | `MuiCheckbox.defaultProps.checkedIcon`       | definição `frontend/src/theme/core/components/checkbox.tsx:18-22`; aplicação `:39` |
| `CheckboxIndeterminateIcon` | **nenhum** — `path` proprietário                           | Estado parcial (caixa preenchida com traço) — seleção incompleta de um grupo | `MuiCheckbox.defaultProps.indeterminateIcon` | definição `frontend/src/theme/core/components/checkbox.tsx:24-28`; aplicação `:40` |

### 5.5 Radio — 2 ícones (desenhos proprietários)

| Componente         | Set Iconify de origem            | Significado semântico                                 | Onde entra                          | Origem (arquivo:linha)                                                          |
| ------------------ | -------------------------------- | ----------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `RadioIcon`        | **nenhum** — `path` proprietário | Opção não selecionada (anel vazio)                    | `MuiRadio.defaultProps.icon`        | definição `frontend/src/theme/core/components/radio.tsx:12-19`; aplicação `:38` |
| `RadioCheckedIcon` | **nenhum** — `path` proprietário | Opção selecionada (anel com disco central em recorte) | `MuiRadio.defaultProps.checkedIcon` | definição `frontend/src/theme/core/components/radio.tsx:21-30`; aplicação `:38` |

### 5.6 Rating — 1 ícone (desenho proprietário)

| Componente   | Set Iconify de origem                                  | Significado semântico                                                                                | Onde entra                                       | Origem (arquivo:linha)                                                           |
| ------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `RatingIcon` | **nenhum** — `path` proprietário (estrela de 5 pontas) | Unidade de avaliação — o **mesmo** desenho serve para estado cheio e vazio, diferenciados só por cor | `MuiRating.defaultProps.icon` **e** `.emptyIcon` | definição `frontend/src/theme/core/components/rating.tsx:14-18`; aplicação `:26` |

### 5.7 Seletores de data e hora — 5 ícones

| Componente           | Set Iconify de origem              | Significado semântico                   | Onde entra                          | Origem (arquivo:linha)                                                                              |
| -------------------- | ---------------------------------- | --------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `PickerSwitchIcon`   | `eva/chevron-down-fill`            | Alternar entre visão de dia / mês / ano | slot `switchViewIcon` (data e hora) | definição `frontend/src/theme/core/components/mui-x-date-picker.tsx:13-21`; aplicação `:76` e `:81` |
| `PickerLeftIcon`     | `eva/arrow-ios-back-fill`          | Mês/período anterior                    | slot `leftArrowIcon` (data)         | definição `frontend/src/theme/core/components/mui-x-date-picker.tsx:23-31`; aplicação `:74`         |
| `PickerRightIcon`    | `eva/arrow-ios-forward-fill`       | Mês/período seguinte                    | slot `rightArrowIcon` (data e hora) | definição `frontend/src/theme/core/components/mui-x-date-picker.tsx:33-41`; aplicação `:75` e `:80` |
| `PickerCalendarIcon` | `solar/calendar-mark-bold-duotone` | Abrir o seletor de **data**             | slot `openPickerIcon` (data)        | definição `frontend/src/theme/core/components/mui-x-date-picker.tsx:43-57`; aplicação `:73`         |
| `PickerClockIcon`    | `solar/clock-circle-outline`       | Abrir o seletor de **hora**             | slot `openPickerIcon` (hora)        | definição `frontend/src/theme/core/components/mui-x-date-picker.tsx:59-69`; aplicação `:79`         |

Esses 5 ícones são distribuídos para **12 componentes** de seleção de data/hora
(`MuiDatePicker`, `MuiDateTimePicker`, `MuiStaticDatePicker`, `MuiDesktopDatePicker`,
`MuiDesktopDateTimePicker`, `MuiMobileDatePicker`, `MuiMobileDateTimePicker`, `MuiTimePicker`,
`MuiMobileTimePicker`, `MuiStaticTimePicker`, `MuiDesktopTimePicker`) através de dois mapas
compartilhados, `defaultProps.date` e `defaultProps.time`
(`frontend/src/theme/core/components/mui-x-date-picker.tsx:71-83`, consumidos em `:85-160`).

### 5.8 Grade de dados (DataGrid) — 12 ícones

| #   | Componente                       | Set Iconify de origem                        | Significado semântico                                                                | Slot(s) onde entra                                                               | Origem (arquivo:linha)                                                                                           |
| --- | -------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | `DataGridArrowUpIcon`            | `solar/alt-arrow-up-bold-duotone`            | Ordenação crescente; também usado em estado "não ordenado" (com cor `text.disabled`) | `columnSortedAscendingIcon`, `columnUnsortedIcon`, `columnMenuSortAscendingIcon` | definição `frontend/src/theme/core/components/mui-x-data-grid.tsx:262-275`; aplicações `:26-28`, `:32-38`, `:40` |
| 2   | `DataGridArrowDownIcon`          | `solar/alt-arrow-down-bold-duotone`          | Ordenação decrescente                                                                | `columnSortedDescendingIcon`, `columnMenuSortDescendingIcon`                     | definição `:277-290`; aplicações `:29-31`, `:41`                                                                 |
| 3   | `DataGridFilterIcon`             | `solar/filter-bold`                          | Filtrar coluna / abrir painel de filtros / indicar coluna filtrada                   | `columnMenuFilterIcon`, `openFilterButtonIcon`, `columnFilteredIcon`             | definição `:292-300`; aplicações `:42`, `:48`, `:49-51`                                                          |
| 4   | `DataGridExportIcon`             | `solar/export-bold`                          | Exportar dados                                                                       | `exportIcon`                                                                     | definição `:302-316`; aplicação `:59`                                                                            |
| 5   | `DataGridEyeIcon`                | `solar/eye-bold`                             | Gerenciar/exibir colunas                                                             | `columnMenuManageColumnsIcon`, `columnSelectorIcon`                              | definição `:318-329`; aplicações `:44`, `:45`                                                                    |
| 6   | `DataGridEyeCloseIcon`           | **`ph/eye-closed-bold`** (Phosphor)          | Ocultar coluna                                                                       | `columnMenuHideIcon`                                                             | definição `:331-341`; aplicação `:43`                                                                            |
| 7   | `DataGridSearchIcon`             | `eva/search-fill`                            | Busca rápida (filtro livre)                                                          | `quickFilterIcon`                                                                | definição `:343-351`; aplicação `:61-63`                                                                         |
| 8   | `DataGridCloseIcon`              | `eva/close-fill`                             | Limpar busca / remover filtro                                                        | `quickFilterClearIcon`, `filterPanelDeleteIcon`                                  | definição `:353-361`; aplicações `:64`, `:47`                                                                    |
| 9   | `DataGridMoreIcon`               | `mingcute/more-1-fill`                       | Abrir menu da coluna (três pontos)                                                   | `columnMenuIcon`                                                                 | definição `:363-374`; aplicação `:39`                                                                            |
| 10  | `DataGridDensityCompactIcon`     | `material-symbols/table-rows-narrow-rounded` | Densidade compacta                                                                   | `densityCompactIcon`                                                             | definição `:376-384`; aplicação `:53`                                                                            |
| 11  | `DataGridDensityComfortableIcon` | `mingcute/rows-2-fill`                       | Densidade confortável                                                                | `densityComfortableIcon`                                                         | definição `:386-397`; aplicação `:55-57`                                                                         |
| 12  | `DataGridDensityStandardIcon`    | `mingcute/rows-4-fill`                       | Densidade padrão                                                                     | `densityStandardIcon`                                                            | definição `:399-410`; aplicação `:54`                                                                            |

> ⚠️ **Correção sobre o dossiê**: `FATOS.md` §9 registra "11 ícones" para o DataGrid e lista
> apenas 4 sets (`solar`, `eva`, `mingcute`, `material-symbols`). A contagem real no código é de
> **12 ícones** distribuídos em **5 sets** — o set ausente na lista do dossiê é **`ph`**
> (Phosphor), usado em `DataGridEyeCloseIcon`
> (`frontend/src/theme/core/components/mui-x-data-grid.tsx:331`).
> Verificação: `grep -n "^const DataGrid" frontend/src/theme/core/components/mui-x-data-grid.tsx`
> retorna 12 linhas.

### 5.9 Resumo por origem

| Set de origem              | Qtd. de ícones inline                                                                                                                                                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `solar`                    | 12 (`close-circle-bold`, `info-circle-bold`, `check-circle-bold`, `danger-triangle-bold`, `danger-bold`, `calendar-mark-bold-duotone`, `clock-circle-outline`, `alt-arrow-up-bold-duotone`, `alt-arrow-down-bold-duotone`, `filter-bold`, `export-bold`, `eye-bold`) |
| `eva`                      | 6 (`arrow-ios-downward-fill` ×2, `chevron-down-fill`, `arrow-ios-back-fill`, `arrow-ios-forward-fill`, `search-fill`, `close-fill` — sendo `arrow-ios-downward-fill` duplicado em dois arquivos)                                                                     |
| `mingcute`                 | 3 (`more-1-fill`, `rows-2-fill`, `rows-4-fill`)                                                                                                                                                                                                                      |
| `material-symbols`         | 1 (`table-rows-narrow-rounded`)                                                                                                                                                                                                                                      |
| `ph`                       | 1 (`eye-closed-bold`)                                                                                                                                                                                                                                                |
| **proprietário (sem set)** | 6 (3 de checkbox, 2 de radio, 1 de rating)                                                                                                                                                                                                                           |
| **Total**                  | **30**                                                                                                                                                                                                                                                               |

> Contagem de `eva`: 7 componentes, mas `arrow-ios-downward-fill` aparece duas vezes (§5.3),
> logo **6 desenhos distintos**.

---

## 6. Normalização de tamanho no DataGrid

Todos os 12 ícones do DataGrid passam por um único adaptador que injeta tamanho fixo:

```js
const svgIconProps = (props) => ({
  ...props,
  sx: [
    { width: 20, height: 20 },
    ...(Array.isArray(props?.sx) ? (props?.sx ?? []) : [props?.sx]),
  ],
});
```

`frontend/src/theme/core/components/mui-x-data-grid.tsx:254-257`

| Token               | Valor bruto   | Referência MUI X | Efeito                                                       | Origem (arquivo:linha)                                       |
| ------------------- | ------------- | ---------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| tamanho normalizado | `20px × 20px` | —                | Sobrescreve o `fontSize` que a grade injetaria via `SvgIcon` | `frontend/src/theme/core/components/mui-x-data-grid.tsx:256` |

**Ordem de precedência (importante):** o `sx` de tamanho é o **primeiro** item do array, e o `sx`
recebido por prop vem **depois** — portanto **o consumidor consegue sobrescrever** os 20px.
O próprio tema faz isso em dois pontos:

| Exceção              | Valor bruto                             | Origem (arquivo:linha)                                      |
| -------------------- | --------------------------------------- | ----------------------------------------------------------- |
| `columnFilteredIcon` | `width: 16px` (altura permanece `20px`) | `frontend/src/theme/core/components/mui-x-data-grid.tsx:50` |
| `quickFilterIcon`    | `24px × 24px`                           | `frontend/src/theme/core/components/mui-x-data-grid.tsx:62` |

E um terceiro ponto onde o tamanho é imposto por CSS, não por `sx`:

| Exceção                                          | Valor bruto                              | Origem (arquivo:linha)                                       |
| ------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------ |
| ícone de excluir filtro (`filterFormDeleteIcon`) | `16px × 16px` (via `& .MuiSvgIcon-root`) | `frontend/src/theme/core/components/mui-x-data-grid.tsx:244` |

> ⚠️ `columnFilteredIcon` define **só `width: 16`**, deixando `height: 20` do adaptador. Isso
> produz uma caixa **16 × 20 px** (não quadrada) para esse ícone específico. Registrado como fato
> observado no código — nenhuma correção é proposta aqui.

---

## 7. Tamanhos do `SvgIcon` (ícones que não passam pelo Iconify)

Todos os 30 ícones inline do tema (§5) são `SvgIcon`, então respondem à escala de `fontSize`
do `SvgIcon` — que é declarada em `rem` e, portanto, **escala com a base de 14px**.

| Token                           | Valor bruto (rem)         | **px real (rem × 14)**       | Referência MUI              | Onde é usado                                                       | Origem                                                                            |
| ------------------------------- | ------------------------- | ---------------------------- | --------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `fontSize="small"`              | `1.25rem` (`pxToRem(20)`) | **`17,5px`**                 | `SvgIcon` `fontSizeSmall`   | Ícones de `Checkbox`/`Radio` (que usam `size="small"` por default) | default MUI 7.0.1 — `@mui/material/SvgIcon/SvgIcon.js:70`                         |
| `fontSize="medium"` (default)   | `1.5rem` (`pxToRem(24)`)  | **`21px`**                   | `SvgIcon` `fontSizeMedium`  | Qualquer `SvgIcon` sem prop de tamanho                             | default MUI 7.0.1 — `@mui/material/SvgIcon/SvgIcon.js:77`                         |
| `fontSize="large"`              | — (`fontSize: 'inherit'`) | **`32px`** (fixado em px)    | `MuiSvgIcon.fontSizeLarge`  | —                                                                  | **sobrescrito pelo projeto**: `frontend/src/theme/core/components/svg-icon.tsx:9` |
| `fontSize="inherit"`            | herda do pai              | depende do pai               | `SvgIcon` `fontSizeInherit` | Ícones dentro de texto                                             | default MUI 7.0.1                                                                 |
| `width` / `height` do `SvgIcon` | `1em` / `1em`             | = valor de `font-size` acima | `SvgIcon` root              | —                                                                  | default MUI 7.0.1 — `@mui/material/SvgIcon/SvgIcon.js:44-45`                      |
| `fill`                          | `currentColor`            | —                            | `SvgIcon` root              | Herança de cor                                                     | default MUI 7.0.1                                                                 |
| `viewBox`                       | `0 0 24 24`               | —                            | `SvgIcon`                   | Todos os ícones inline do tema                                     | default MUI 7.0.1                                                                 |

**Confirmação empírica:** `.MuiSvgIcon-fontSizeMedium` medido em runtime (Chrome 1911×898) →
**21 × 21 px**, exatamente `1.5rem × 14`.

> ⚠️ O override de `fontSizeLarge` (`frontend/src/theme/core/components/svg-icon.tsx:9`) troca a
> unidade: o default da biblioteca seria `2.1875rem` (`pxToRem(35)` → `30,625px` na base de 14px),
> e o projeto substitui por `width: 32`, `height: 32` e `fontSize: 'inherit'` — ou seja,
> **`32px` fixos, que não escalam**. É o único dos três tamanhos de `SvgIcon` que ficou em px puro.

### 7.1 Tabela de conversão rápida

| Tamanho                         | rem       | px real  | Escala com o `rem`? |
| ------------------------------- | --------- | -------- | ------------------- |
| `SvgIcon` small                 | `1.25rem` | `17,5px` | ✅ sim              |
| `SvgIcon` medium                | `1.5rem`  | `21px`   | ✅ sim              |
| `SvgIcon` large                 | —         | `32px`   | ❌ não (px puro)    |
| `Iconify` (default do wrapper)  | —         | `20px`   | ❌ não (px puro)    |
| Ícone de item de nav (vertical) | —         | `24px`   | ❌ não (px puro)    |
| Ícone do DataGrid               | —         | `20px`   | ❌ não (px puro)    |
| Ícone do `Label`                | —         | `16px`   | ❌ não (px puro)    |

> ⚠️ **Consequência**: se a base do `rem` mudar de `14px` para `16px`, os ícones `SvgIcon`
> small/medium crescem (`17,5px → 20px` e `21px → 24px`), enquanto os ícones Iconify, os do
> DataGrid, os de navegação e o `SvgIcon` large **ficam parados**. Isso desalinha ícones que hoje
> parecem do mesmo tamanho.

---

## 8. Resumo operacional

1. **Uma biblioteca só**: Iconify (`@iconify/react` 5.2.0), com 224 ícones registrados offline em
   8 prefixos — nenhum ícone é buscado na rede em uso normal.
2. **Vocabulário visual dominante**: `solar` (118 de 224), predominantemente `bold` e
   `bold-duotone`.
3. **Tamanho padrão do wrapper**: `20px` (px puro). Na prática, `24px` é o mais usado na
   aplicação.
4. **Cor**: sempre por herança (`currentColor`). Sete logotipos de marca (`socials`/`payments`)
   têm 24 cores fixas e são as únicas exceções.
5. **Alinhamento**: `display: inline-flex` + `flex-shrink: 0` — o ícone nunca encolhe.
6. **30 ícones vivem dentro do tema** como `SvgIcon` inline, injetados por `defaultProps` em
   chip, alert, select, autocomplete, checkbox, radio, rating, 12 seletores de data/hora e a
   grade de dados.
7. **DataGrid normaliza tudo para `20 × 20 px`**, com três exceções declaradas no próprio tema
   (`16px` de largura, `24 × 24`, `16 × 16`).
8. **Só `SvgIcon` small/medium escalam com o `rem`**; todo o resto está em px puro.

---

## 9. Itens não confirmados

Nenhum. Todos os valores deste documento foram confirmados por leitura de código
(`frontend/src/**` e `frontend/node_modules/@mui/material/**`), com exceção de dois valores
provenientes de medição em runtime, explicitamente identificados como tal:

- ícone de remover do `Chip` = `22px × 22px` — medido em runtime (Chrome 1911×898);
- `.MuiSvgIcon-fontSizeMedium` = `21 × 21 px` — medido em runtime (Chrome 1911×898),
  usado apenas como confirmação do valor já derivado do código (`1.5rem × 14`).

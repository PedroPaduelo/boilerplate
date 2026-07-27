# Slider e Rating

`MuiSlider` + `MuiRating`.

> **Base de conversão**: `html { font-size: 14px }` → `px_real = rem × 14` (`FATOS.md` §1).

---

# Slider

## Anatomia

```
span                    .MuiSlider-root
├── span                 .MuiSlider-rail        (trilho de fundo, 100%)
├── span                 .MuiSlider-track       (trecho preenchido)
├── span                 .MuiSlider-mark        (marcas; 0..n)
├── span                 .MuiSlider-markLabel   (rótulos das marcas)
└── span                 .MuiSlider-thumb       (o pino)
    ├── ::before          brilho interno (gradiente)
    ├── ::after           alvo de toque 42×42px
    ├── input             (range, invisível)
    └── span              .MuiSlider-valueLabel  (balão de valor)
```

| Parte           | Classe                  | Papel                                                                                                                                    |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| root            | `.MuiSlider-root`       | `display: inline-block`, `position: relative`, `box-sizing: content-box`, `cursor: pointer`, `touch-action: none`, `border-radius: 12px` |
| trilho          | `.MuiSlider-rail`       | `position: absolute`, `border-radius: inherit`                                                                                           |
| trecho ativo    | `.MuiSlider-track`      | `position: absolute`, `border-radius: inherit`                                                                                           |
| pino            | `.MuiSlider-thumb`      | `position: absolute`, `border-radius: 50%`, `display: flex`                                                                              |
| marca           | `.MuiSlider-mark`       | `position: absolute`                                                                                                                     |
| marca ativa     | `.MuiSlider-markActive` | marcas já cobertas pelo `track`                                                                                                          |
| rótulo da marca | `.MuiSlider-markLabel`  | `position: absolute`, `white-space: nowrap`                                                                                              |
| balão de valor  | `.MuiSlider-valueLabel` | `position: absolute`, `z-index: 1`                                                                                                       |

## Variantes e tamanhos

- **Não há variantes** de aparência.
- Tamanhos: `small` (**default do projeto**, `src/theme/core/components/slider.tsx:30`) | `medium`.
  Default do MUI é `medium` (`default MUI 7.0.1 (node_modules/@mui/material/Slider/Slider.js:598)`).
- Orientações: `horizontal` (default) | `vertical` (`default MUI 7.0.1 (Slider.js:596)`).
- `track`: `'normal'` (default) | `'inverted'` | `false` (`default MUI 7.0.1 (Slider.js:604)`).
- `valueLabelDisplay`: `'off'` (default) | `'auto'` | `'on'` (`default MUI 7.0.1 (Slider.js:606)`).
- Cores: as 6 de paleta + **`inherit`** (extensão do projeto, `src/theme/core/components/slider.tsx:14-16`).
  Default do MUI = `primary` (`Slider.js:583`).

⚠️ A cor `inherit` **não** é mapeada pelo MUI (que só percorre as cores de paleta,
`default MUI 7.0.1 (Slider.js:65-72)`), então o root fica sem `color` declarada e **herda** a cor do
contexto. O único estilo que o projeto anexa a `inherit` é a cor da marca ativa no modo dark
(`src/theme/core/components/slider.tsx:39-48`).

## Medidas

### Constante `SIZE` do projeto (`src/theme/core/components/slider.tsx:20-24`)

| Peça                      | `small` (default) | `medium`   |
| ------------------------- | ----------------- | ---------- |
| `rail` / `track` (altura) | **`6px`**         | **`10px`** |
| `thumb` (lado)            | **`16px`**        | **`20px`** |
| `mark` (altura)           | **`4px`**         | **`6px`**  |

### Aplicação

| Elemento           | `small`                     | `medium`                    | Origem                                            |
| ------------------ | --------------------------- | --------------------------- | ------------------------------------------------- |
| `.MuiSlider-rail`  | `height: 6px`               | `height: 10px`              | `src/theme/core/components/slider.tsx:84, 113`    |
| `.MuiSlider-track` | `height: 6px`               | `height: 10px`              | `src/theme/core/components/slider.tsx:87, 114`    |
| `.MuiSlider-thumb` | `16px × 16px`               | `20px × 20px`               | `src/theme/core/components/slider.tsx:65-66, 112` |
| `.MuiSlider-mark`  | `width: 1px`, `height: 4px` | `width: 1px`, `height: 6px` | `src/theme/core/components/slider.tsx:89-90, 115` |

⚠️ A altura do **root** continua a do MUI e **não** acompanha o `rail`:
`4px` (horizontal medium) e `2px` (horizontal small), com `padding: 13px 0`
(`@media (pointer: coarse)`: `20px 0`) — `default MUI 7.0.1 (Slider.js:72-93)`.
Vertical: `width: 4px` / `2px`, `padding: 0 13px` (coarse: `0 20px`) — `Slider.js:102-123`.
`⚠️ NÃO CONFIRMADO` em runtime como isso interage com `rail` de 6/10px (não consta na §10 do `FATOS.md`).

### Pino (thumb)

| Propriedade                                  | Valor bruto                                                                       | Referência simbólica              | Origem                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| `border-width`                               | **`1px`**                                                                         | —                                 | `src/theme/core/components/slider.tsx:63`                                         |
| `border-style`                               | **`solid`**                                                                       | —                                 | `src/theme/core/components/slider.tsx:64`                                         |
| `border-color`                               | **`rgba(145 158 171 / 0.08)`**                                                    | `varAlpha(grey.500Channel, 0.08)` | `src/theme/core/components/slider.tsx:69`                                         |
| `color` (→ `background-color: currentColor`) | **`#FFFFFF`**                                                                     | `common.white`                    | `src/theme/core/components/slider.tsx:68`                                         |
| `box-shadow`                                 | **`0 1px 2px 0 rgba(145 158 171 / 0.16)`**                                        | `customShadows.z1`                | `src/theme/core/components/slider.tsx:67` + `src/theme/core/custom-shadows.ts:41` |
| `border-radius`                              | `50%`                                                                             | —                                 | `default MUI 7.0.1 (Slider.js:260)`                                               |
| `box-sizing`                                 | `border-box`                                                                      | —                                 | `default MUI 7.0.1 (Slider.js:259)`                                               |
| `transition`                                 | `box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, left 150ms …, bottom 150ms …` | `duration.shortest`               | `default MUI 7.0.1 (Slider.js:266-268)`                                           |

**`::before` — brilho interno (customizado pelo projeto):**

| Propriedade                  | Valor bruto                                         | Origem                                                                                    |
| ---------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `opacity`                    | **`0.4`** (dark: **`0.8`**)                         | `src/theme/core/components/slider.tsx:71, 76-78`                                          |
| `box-shadow`                 | **`none`**                                          | `src/theme/core/components/slider.tsx:72` — anula o `shadows[2]` do MUI (`Slider.js:275`) |
| `width` / `height`           | **`calc(100% - 4px)`**                              | `src/theme/core/components/slider.tsx:73-74`                                              |
| `background-image`           | **`linear-gradient(180deg, #919EAB, transparent)`** | `src/theme/core/components/slider.tsx:75` (`grey.500`)                                    |
| `position` / `border-radius` | `absolute` / `inherit`                              | `default MUI 7.0.1 (Slider.js:269-276)`                                                   |

**`::after` — alvo de toque** (não customizado): `42px × 42px`, `border-radius: 50%`,
`top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)` — `default MUI 7.0.1 (Slider.js:277-287)`.

### Trilho e trecho ativo

| Propriedade                      | Valor bruto                                                                                  | Origem                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `rail` — `opacity`               | **`0.12`**                                                                                   | `src/theme/core/components/slider.tsx:83` (MUI usaria `0.38`, `Slider.js:143`)         |
| `rail` — `background-color`      | **`#919EAB`** rgb(145,158,171) (`grey.500`)                                                  | `src/theme/core/components/slider.tsx:85` (MUI usaria `currentColor`, `Slider.js:142`) |
| `track` — `background-color`     | `currentColor` (= cor da paleta)                                                             | `default MUI 7.0.1 (Slider.js:185)`                                                    |
| `track` — `border`               | `1px solid currentColor` (medium) / **`none`** (small)                                       | `default MUI 7.0.1 (Slider.js:184, 189-195)`                                           |
| `track` — `transition`           | `left 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, width 150ms …, bottom 150ms …, height 150ms …` | `default MUI 7.0.1 (Slider.js:186-188)`                                                |
| `rail`/`track` — `border-radius` | `inherit` (= `12px` do root)                                                                 | `default MUI 7.0.1 (Slider.js:141, 183)`                                               |

### Marcas

| Propriedade                          | Valor bruto                                                                | Origem                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `width`                              | **`1px`**                                                                  | `src/theme/core/components/slider.tsx:89` (MUI: `2px`)                                 |
| `height`                             | **`6px`** (medium) / **`4px`** (small)                                     | `src/theme/core/components/slider.tsx:90, 115` (MUI: `2px`)                            |
| `background-color`                   | **`rgba(145 158 171 / 0.48)`**                                             | `src/theme/core/components/slider.tsx:91`                                              |
| primeira marca (`[data-index="0"]`)  | **`display: none`**                                                        | `src/theme/core/components/slider.tsx:93`                                              |
| última marca (`left: 100%`)          | **`display: none`**                                                        | `src/theme/core/components/slider.tsx:95`                                              |
| marca ativa                          | **`background-color: rgba(255 255 255 / 0.64)`** + `opacity: 0.8` (do MUI) | `src/theme/core/components/slider.tsx:97-99` + `default MUI 7.0.1 (Slider.js:486-493)` |
| marca ativa, `color="inherit"`, dark | `background-color: rgba(28 37 46 / 0.48)` (`grey.800` @48%)                | `src/theme/core/components/slider.tsx:42-45`                                           |
| posição (horizontal)                 | `top: 50%`, `transform: translate(-1px, -50%)`                             | `default MUI 7.0.1 (Slider.js:470-477)`                                                |
| `border-radius`                      | `1px`                                                                      | `default MUI 7.0.1 (Slider.js:468)`                                                    |

⚠️ A marca ativa acumula duas opacidades: `rgba(255 255 255 / 0.64)` **dentro** de um elemento com
`opacity: 0.8` → branco efetivo ≈ **0,512** de alfa.

### Rótulo das marcas

| Propriedade                   | Valor bruto                                                                     | Referência simbólica | Origem                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| `font-size`                   | **`0.8125rem`** = **11,375px**                                                  | `pxToRem(13)`        | `src/theme/core/components/slider.tsx:101`                                                |
| `color`                       | **`#919EAB`** rgb(145,158,171)                                                  | `text.disabled`      | `src/theme/core/components/slider.tsx:102` (MUI usaria `text.secondary`, `Slider.js:505`) |
| `font-weight` / `line-height` | `400` / `1.5714285714285714` (= 22/14) → **17,87px**                            | `typography.body2`   | `default MUI 7.0.1 (Slider.js:504)`                                                       |
| posição (horizontal)          | `top: 30px` (`@media (pointer: coarse)`: `40px`), `transform: translateX(-50%)` | —                    | `default MUI 7.0.1 (Slider.js:508-518)`                                                   |

### Balão de valor

| Propriedade        | Valor bruto                                                                               | Origem                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `border-radius`    | **`8px`**                                                                                 | `src/theme/core/components/slider.tsx:105` (MUI: `2px`, `Slider.js:361`)                         |
| `background-color` | **`#1C252E`** rgb(28,37,46) (`grey.800`); dark: **`#454F5B`** (`grey.700`)                | `src/theme/core/components/slider.tsx:106-109` (MUI: `grey.600` = `#637381`, `Slider.js:360`)    |
| `color`            | `#FFFFFF` (`common.white`)                                                                | `default MUI 7.0.1 (Slider.js:362)`                                                              |
| `font-size`        | `0.875rem` = **12,25px** (medium) / `0.75rem` = **10,5px** (small)                        | `typography.body2` / `pxToRem(12)` — `default MUI 7.0.1 (Slider.js:354, 412-419)`                |
| `font-weight`      | `500`                                                                                     | `default MUI 7.0.1 (Slider.js:355)`                                                              |
| `padding`          | `0.25rem 0.75rem` = **3,5px 10,5px** (medium) / `0.25rem 0.5rem` = **3,5px 7px** (small)  | `default MUI 7.0.1 (Slider.js:366, 418)` — ⚠️ declarado em `rem`, logo escala com a base de 14px |
| `top` (horizontal) | `-10px`; `transform: translateY(-100%) scale(0)` → `scale(1)` quando aberto               | `default MUI 7.0.1 (Slider.js:367-388)`                                                          |
| seta (`::before`)  | `8px × 8px`, `transform: translate(-50%, 50%) rotate(45deg)`, `background-color: inherit` | `default MUI 7.0.1 (Slider.js:375-384)`                                                          |
| `transition`       | `transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`                                        | `default MUI 7.0.1 (Slider.js:356-358)`                                                          |

## Tabela de estados

| Estado               | Fundo (rail / track)                                                            | "Texto" (pino) | Borda (pino)                         | Sombra (pino)                                    | Transição                                                       |
| -------------------- | ------------------------------------------------------------------------------- | -------------- | ------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------- |
| default              | rail `#919EAB` @ `opacity 0.12` · track `<cor>.main`                            | `#FFFFFF`      | `1px solid rgba(145 158 171 / 0.08)` | `0 1px 2px 0 rgba(145 158 171 / 0.16)`           | `box-shadow`/`left`/`bottom` 150ms cubic-bezier(0.4, 0, 0.2, 1) |
| hover (pino)         | inalterado                                                                      | `#FFFFFF`      | idem                                 | **`0px 0px 0px 8px rgba(<canal main> / 0.16)`**  | idem                                                            |
| focus-visible (pino) | inalterado                                                                      | `#FFFFFF`      | idem                                 | `0px 0px 0px 8px rgba(<canal main> / 0.16)`      | idem                                                            |
| active / arrastando  | inalterado                                                                      | `#FFFFFF`      | idem                                 | **`0px 0px 0px 14px rgba(<canal main> / 0.16)`** | `transition: none` no pino e no track enquanto arrasta          |
| hover em touch       | inalterado                                                                      | `#FFFFFF`      | idem                                 | `none`                                           | idem                                                            |
| disabled             | rail e track em **`rgba(145 158 171 / 0.48)`** (o root inteiro muda de `color`) | `#FFFFFF`      | idem                                 | `none` no hover                                  | `pointer-events: none`, `cursor: default`                       |
| `selected`           | não existe                                                                      | —              | —                                    | —                                                | —                                                               |
| `error`              | não existe (usa-se `color="error"`)                                             | —              | —                                    | —                                                | —                                                               |
| `loading`            | não existe                                                                      | —              | —                                    | —                                                | —                                                               |

Anéis de foco/hover por cor (`rgba(<canal main> / 0.16)`), `default MUI 7.0.1 (Slider.js:320-343)`:
primary `rgba(0 167 111 / 0.16)` · secondary `rgba(142 51 255 / 0.16)` · info `rgba(0 184 217 / 0.16)` ·
success `rgba(34 197 94 / 0.16)` · warning `rgba(255 171 0 / 0.16)` · error `rgba(255 86 48 / 0.16)`.

Estado desabilitado: `color: rgba(145 158 171 / 0.48)`
(`varAlpha(grey.500Channel, action.disabledOpacity)`) — `src/theme/core/components/slider.tsx:50-60`.
Sobrescreve o `grey.400` = `#C4CDD5` do MUI (`Slider.js:55-59`).

---

# Rating

## Anatomia

```
span                    .MuiRating-root
├── label               .MuiRating-label            (uma por estrela)
│   ├── span            .MuiRating-icon .MuiRating-iconFilled | .MuiRating-iconEmpty
│   │   └── svg         .MuiSvgIcon-root
│   └── input[type=radio] (visualmente oculto)
└── span                .MuiRating-decimal          (só com precision < 1)
```

| Parte          | Classe                      | Papel                                                                                                     |
| -------------- | --------------------------- | --------------------------------------------------------------------------------------------------------- |
| root           | `.MuiRating-root`           | `display: inline-flex`, `position: relative`, `cursor: pointer`, `text-align: left`, `width: min-content` |
| rótulo         | `.MuiRating-label`          | `cursor: inherit`                                                                                         |
| ícone          | `.MuiRating-icon`           | `display: flex`, `pointer-events: none`                                                                   |
| ícone vazio    | `.MuiRating-iconEmpty`      | cor customizada pelo projeto                                                                              |
| ícone ativo    | `.MuiRating-iconActive`     | `transform: scale(1.2)`                                                                                   |
| acessibilidade | `.MuiRating-visuallyHidden` | texto para leitores de tela                                                                               |

## Variantes e tamanhos

- **Não há variantes** de aparência.
- Tamanhos: `small` | `medium` (**default**, `default MUI 7.0.1 (node_modules/@mui/material/Rating/Rating.js:373)`) | `large`.
- Outros defaults MUI (não alterados): `max: 5`, `precision: 1`, `readOnly: false`,
  `disabled: false`, `highlightSelectedOnly: false` — `Rating.js:358-373`.
- O projeto **não** define `size` nem `max` em `defaultProps`.

## Medidas

| size               | tamanho do SVG    | `font-size` do root (MUI, ignorado na prática) | Origem                                    |
| ------------------ | ----------------- | ---------------------------------------------- | ----------------------------------------- |
| `small`            | **`20px × 20px`** | `1.125rem` = 15,75px                           | `src/theme/core/components/rating.tsx:34` |
| `medium` (default) | **`24px × 24px`** | `1.5rem` = 21px                                | `src/theme/core/components/rating.tsx:35` |
| `large`            | **`28px × 28px`** | `1.875rem` = 26,25px                           | `src/theme/core/components/rating.tsx:36` |

⚠️ O projeto força `width`/`height` em px no `.MuiSvgIcon-root` dentro de cada size
(`rating.tsx:34-36`), **sobrepondo** o dimensionamento por `font-size` do MUI
(`default MUI 7.0.1 (Rating.js:82, 96-109)`). O `font-size` do root continua declarado, mas não
determina mais o tamanho do desenho.

| Propriedade                   | Valor bruto                                        | Origem                                                                             |
| ----------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `transition` do ícone         | `transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms` | `default MUI 7.0.1 (Rating.js:155-157)`                                            |
| `transform` do ícone ativo    | `scale(1.2)`                                       | `default MUI 7.0.1 (Rating.js:161-167)`                                            |
| `outline` no foco por teclado | `1px solid #999` no `.MuiRating-iconActive`        | `default MUI 7.0.1 (Rating.js:92-94)` — ⚠️ `#999` é hex do MUI, **fora da paleta** |

## Ícone (proprietário)

`RatingIcon`: `<SvgIcon>` com `viewBox` 24×24 e um `<path>` de **estrela de 5 pontas com cantos
arredondados**, `fill` herdado (`currentColor`) — `src/theme/core/components/rating.tsx:14-18`.

⚠️ O **mesmo** ícone é usado como `icon` e como `emptyIcon`
(`src/theme/core/components/rating.tsx:26`): a diferença entre cheio e vazio é **só a cor**, não a
forma. No MUI o default seria `Star` / `StarBorder` (formas diferentes).

## Tabela de estados

| Estado        | Fundo                                       | Texto (cor da estrela)                | Borda   | Sombra | Transição                                      |
| ------------- | ------------------------------------------- | ------------------------------------- | ------- | ------ | ---------------------------------------------- |
| estrela cheia | `transparent`                               | **`#faaf00`** rgb(250,175,0)          | nenhuma | `none` | `transform 150ms cubic-bezier(0.4, 0, 0.2, 1)` |
| estrela vazia | `transparent`                               | **`rgba(145 158 171 / 0.48)`**        | nenhuma | `none` | idem                                           |
| hover / ativa | `transparent`                               | `#faaf00`, `transform: scale(1.2)`    | nenhuma | `none` | idem                                           |
| focus-visible | `transparent`                               | `#faaf00` + `outline: 1px solid #999` | nenhuma | `none` | idem                                           |
| `readOnly`    | `transparent`                               | inalterada                            | nenhuma | `none` | `pointer-events: none`                         |
| disabled      | `transparent` + **`opacity: 0.48`** no root | inalterada                            | nenhuma | `none` | `pointer-events: none`                         |

- Cor da estrela cheia: **`#faaf00`** — hardcoded no MUI (`default MUI 7.0.1 (Rating.js:83)`),
  **não sobrescrito** pelo projeto. ⚠️ Esse hex **não existe na paleta** do design system
  (o `warning.main` é `#FFAB00`); são cores próximas, porém distintas.
- Cor da estrela vazia: `rgba(145 158 171 / 0.48)` — `src/theme/core/components/rating.tsx:33`.
  Substitui o `action.disabled` (`rgba(145 158 171 / 0.8)`) do MUI (`Rating.js:169-174`).
- `opacity: 0.48` no disabled — `src/theme/core/components/rating.tsx:32`. Numericamente igual ao
  `action.disabledOpacity` do MUI (`Rating.js:88-91`), mas escrito literalmente.
- ⚠️ **Não há estado `error`, `selected` nem `loading`** em `Rating`.

---

## Regras de uso observadas

1. **Slider nasce `small`**: trilho de 6px, pino de 16px, marcas de 4px. O `medium` (10/20/6) só
   aparece quando pedido.
2. **O pino é branco com borda cinza a 8% e sombra sutil** (`customShadows.z1`), com um gradiente
   interno (`::before`) de `#919EAB` para transparente a 40% de opacidade — um "brilho" de topo.
   A cor da paleta fica no `track`, nunca no pino.
3. **Trilho quase invisível**: `#919EAB` com `opacity: 0.12`. O contraste vem do `track`.
4. **Marcas são fios de 1px**, e a primeira e a última são **escondidas** — só marcas intermediárias
   aparecem.
5. **Anéis de foco/arraste são `box-shadow` de 8px e 14px** a 16% da cor — mesmo padrão do
   Material, com o alfa do projeto.
6. **Balão de valor quase-preto com raio 8px**, alinhado ao `shape.borderRadius` do sistema
   (o MUI usaria `2px` e cinza médio).
7. **Rating usa o mesmo desenho para cheio e vazio** — só muda a cor. Ao portar, use **uma** estrela
   e duas cores: `#faaf00` e `rgba(145 158 171 / 0.48)`.
8. **O tamanho do Rating é em px fixo (20/24/28)**, não em `em` — não escala com a tipografia.
9. **`#faaf00` e `#999` são resíduos do MUI dentro do Rating** — dois valores fora da paleta do
   projeto. Registrados também em `99-inconsistencias`.

---

## Origem

| Item                                                           | Arquivo:linha                                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Slider — extensão de cor `inherit`                             | `src/theme/core/components/slider.tsx:14-16`                                                                        |
| Slider — constante `SIZE` (rail/thumb/mark)                    | `src/theme/core/components/slider.tsx:20-24`                                                                        |
| Slider — `defaultProps: { size: 'small' }`                     | `src/theme/core/components/slider.tsx:30`                                                                           |
| Slider — variante `color="inherit"` (marca ativa no dark)      | `src/theme/core/components/slider.tsx:39-48`                                                                        |
| Slider — variante `disabled` (`rgba(145 158 171 / 0.48)`)      | `src/theme/core/components/slider.tsx:50-60`                                                                        |
| Slider — pino (borda 1px, 20×20, `z1`, branco, borda 8%)       | `src/theme/core/components/slider.tsx:62-69`                                                                        |
| Slider — pino `::before` (gradiente, `opacity 0.4`/`0.8`)      | `src/theme/core/components/slider.tsx:70-79`                                                                        |
| Slider — `rail` (`opacity 0.12`, altura 10, `grey.500`)        | `src/theme/core/components/slider.tsx:82-86`                                                                        |
| Slider — `track` (altura 10)                                   | `src/theme/core/components/slider.tsx:87`                                                                           |
| Slider — `mark` (1×6, 48%, primeira/última ocultas)            | `src/theme/core/components/slider.tsx:88-96`                                                                        |
| Slider — `markActive` (`rgba(255 255 255 / 0.64)`)             | `src/theme/core/components/slider.tsx:97-99`                                                                        |
| Slider — `markLabel` (`pxToRem(13)`, `text.disabled`)          | `src/theme/core/components/slider.tsx:100-103`                                                                      |
| Slider — `valueLabel` (raio 8px, `grey.800`/`grey.700`)        | `src/theme/core/components/slider.tsx:104-110`                                                                      |
| Slider — `sizeSmall` (16/6/6/4)                                | `src/theme/core/components/slider.tsx:111-116`                                                                      |
| Slider — export                                                | `src/theme/core/components/slider.tsx:122`                                                                          |
| Rating — ícone estrela (SVG inline)                            | `src/theme/core/components/rating.tsx:14-18`                                                                        |
| Rating — `defaultProps` (`icon` = `emptyIcon` = estrela)       | `src/theme/core/components/rating.tsx:26`                                                                           |
| Rating — `disabled` → `opacity: 0.48`                          | `src/theme/core/components/rating.tsx:32`                                                                           |
| Rating — `iconEmpty` → `rgba(145 158 171 / 0.48)`              | `src/theme/core/components/rating.tsx:33`                                                                           |
| Rating — `sizeSmall` / `sizeMedium` / `sizeLarge` (20/24/28px) | `src/theme/core/components/rating.tsx:34-36`                                                                        |
| Rating — export                                                | `src/theme/core/components/rating.tsx:42`                                                                           |
| `customShadows.z1`                                             | `src/theme/core/custom-shadows.ts:41`                                                                               |
| `action.disabledOpacity = 0.48`                                | `src/theme/core/palette.ts:110`                                                                                     |
| `typography.body2`                                             | `src/theme/core/typography.ts:107-110`                                                                              |
| Defaults MUI — `Slider`                                        | `node_modules/@mui/material/Slider/Slider.js:33-133, 134-172, 173-243, 244-344, 345-429, 452-495, 496-520, 583-606` |
| Defaults MUI — `Rating`                                        | `node_modules/@mui/material/Rating/Rating.js:65-119, 120-197, 358-373`                                              |

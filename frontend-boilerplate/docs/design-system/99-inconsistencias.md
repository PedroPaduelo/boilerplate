# 99 — Inconsistências, divergências e pontos não confirmados

Registro de tudo que **não** se resolve sozinho: valores conflitantes, código morto, valores fixos
fora do sistema, armadilhas de leitura e itens que não foi possível confirmar.

**Nada aqui foi "resolvido" silenciosamente.** Quando um mesmo elemento tem valores diferentes em
lugares diferentes, todas as ocorrências estão listadas.

Classificação de severidade:

| Nível          | Significado                                                      |
| -------------- | ---------------------------------------------------------------- |
| 🔴 **Crítico** | Reproduzir a interface errado se não for observado               |
| 🟠 **Alto**    | Divergência real do sistema, com impacto visual ou de manutenção |
| 🟡 **Médio**   | Inconsistência interna sem impacto visual imediato               |
| ⚪ **Baixo**   | Ruído, código morto, detalhe cosmético                           |

---

## 1. 🔴 A base do `rem` é 14 px, mas os `rem` foram gerados sobre 16 px

**A armadilha número um deste projeto.**

| Fato                                        | Valor      | Origem                                                                                                                   |
| ------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `html { font-size }` aplicado               | **`14px`** | `frontend/src/components/settings/settings-config.ts:18` → `frontend/src/theme/with-settings/update-components.ts:54-59` |
| Divisor usado para gerar os `rem`           | **16**     | `pxToRem(v) = v/16 + 'rem'` (`minimal-shared` 1.0.7)                                                                     |
| `typography.htmlFontSize` no objeto do tema | **16**     | default MUI 7.0.1                                                                                                        |

Confirmado em runtime: `getComputedStyle(document.documentElement).fontSize === "14px"`.

**Efeito:** todo valor em `rem` renderiza a **87,5 %** do número escrito no código.
`pxToRem(40)` vira `2.5rem`, que na tela é **35 px** — não 40 px.

**Por que é uma inconsistência e não uma decisão:** os dois lados discordam.
`typography.htmlFontSize: 16` afirma que a raiz é 16 px, enquanto o CSS efetivo diz 14 px.
Quem lê o tema pelo objeto (o caminho natural) conclui um tamanho e o navegador entrega outro.

**Agrava:** o valor vem de `settings.fontSize`, que o usuário pode alterar no painel de
configurações. Ou seja, **toda a escala tipográfica é redimensionável em runtime** e os valores
absolutos mudam junto.

**Precisa de decisão humana:**

- (a) manter como está e documentar (o que esta ficha faz), ou
- (b) alinhar `htmlFontSize` a 14 e regerar os `rem`, ou
- (c) remover o override de `html` e assumir 16 px — **isso aumentaria toda a interface em ~14 %**.

---

## 2. 🔴 `theme-overrides.ts` define uma paleta primária roxa que nunca é aplicada

O arquivo `frontend/src/theme/theme-overrides.ts` declara uma primary completa:

| Tom        | Valor no arquivo morto | Valor realmente em uso |
| ---------- | ---------------------- | ---------------------- |
| `lighter`  | `#E4DCFD`              | `#C8FAD6`              |
| `light`    | `#A996F8`              | `#5BE49B`              |
| **`main`** | **`#6950E8`** (roxo)   | **`#00A76F`** (verde)  |
| `dark`     | `#3828A7`              | `#007867`              |
| `darker`   | `#180F6F`              | `#004B50`              |

**Prova de que está morto:** `grep -rn "theme-overrides" frontend/src/` retorna **0 importações**.
A prop `themeOverrides` existe em `frontend/src/theme/theme-provider.tsx:19,22,30`, mas
`frontend/src/app.tsx:53-56` e `:68-71` **não a passam**.
Confirmado em runtime: `--palette-primary-main === "#00A76F"`.

**Risco:** qualquer pessoa que abra `theme-overrides.ts` para descobrir a cor da marca vai
documentar/reproduzir a interface **na cor errada**.

**Precisa de decisão humana:** apagar o arquivo ou ligá-lo. Hoje ele é uma armadilha.

---

## 3. 🟠 972 cores fixas fora da paleta

Varredura em `frontend/src/**/*.{ts,tsx}`, excluindo `src/theme/**` e `src/_mock/**`:

- **972** cores hexadecimais literais
- **70** `rgb()` / `rgba()` literais

### 3.1 Cores de uma versão anterior do template (as mais graves)

Continuam espalhadas cores que **não existem mais na paleta**:

| Valor     | Ocorrências | O que era                         | Valor atual equivalente |
| --------- | ----------- | --------------------------------- | ----------------------- |
| `#FF4842` | **63**      | `error.main` da versão anterior   | `#FF5630`               |
| `#00AB55` | **55**      | `primary.main` da versão anterior | `#00A76F`               |
| `#212B36` | 5           | `grey.800` da versão anterior     | `#1C252E`               |

Exemplos: `frontend/src/modules/dashboards/components/GraficosGerenciais/RetificacoesTab.tsx:336`
(`colors: ['#00AB55']`), `frontend/src/modules/dashboards/views/malha-diferenca-fator-r-view.tsx:174`
(`colors: ['#FF4842', '#FFAB00', '#00B8D9']`),
`frontend/src/modules/dashboards/components/GraficosGerenciais/EvolucaoChart.tsx:58` (`color: '#212B36'`).

**Efeito visual:** existem hoje **dois verdes** e **dois vermelhos** convivendo na interface.
Um gráfico com `#00AB55` ao lado de um botão com `#00A76F` mostra tons diferentes.

### 3.2 Duplicação literal de cores que já são token

| Valor     | Ocorrências | Token equivalente             |
| --------- | ----------- | ----------------------------- |
| `#00B8D9` | 50          | `info.main`                   |
| `#FFAB00` | 45          | `warning.main`                |
| `#00A76F` | 14          | `primary.main`                |
| `#FFD666` | 10          | `warning.light`               |
| `#DFE3E8` | 10          | `grey.300`                    |
| `#637381` | 10          | `text.secondary` / `grey.600` |
| `#F5F5F5` | 16          | `grey.A100`                   |

Não quebram o visual, mas **congelam** a cor: uma troca de tema não as alcança.

### 3.3 Cores de outras famílias (Tailwind / Material padrão)

| Valor                                                 | Ocorrências | Origem provável                    |
| ----------------------------------------------------- | ----------- | ---------------------------------- |
| `#10B981`                                             | 17          | verde Tailwind                     |
| `#F59E0B`                                             | 16          | âmbar Tailwind                     |
| `#8B5CF6`                                             | 16          | violeta Tailwind                   |
| `#2563EB`                                             | 12          | azul Tailwind                      |
| `#EF4444`                                             | 5           | vermelho Tailwind                  |
| `#4CAF50`                                             | 20          | verde Material                     |
| `#FF9800`                                             | 13          | laranja Material                   |
| `#E0E0E0`                                             | 11          | cinza Material                     |
| `#1976D2`                                             | 8           | azul padrão da biblioteca base     |
| `#D32F2F`                                             | 8           | vermelho padrão da biblioteca base |
| `#C38323`, `#0E4595`, `#FF8A65`, `#F36F56`, `#FFC444` | 5–14 cada   | sem origem identificada            |

Concentração por arquivo:

| Ocorrências | Arquivo                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| 158         | `frontend/src/modules/malha-fiscal-execucao/views/comparativo-declaracoes-view.tsx`                      |
| 46          | `frontend/src/modules/malha-fiscal-execucao/views/sections/ActivityFlowSection/ActivityFlowSection.tsx`  |
| 38          | `frontend/src/layouts/components/notifications-drawer/icons.tsx`                                         |
| 33          | `frontend/src/modules/acao-fiscal/views/apuracao-xml-pgdasd-acao-fiscal-view.tsx`                        |
| 32          | `frontend/src/modules/acao-fiscal/views/apuracao-detalhes-calculo.tsx`                                   |
| 25          | `frontend/src/modules/dashboards/views/malha-sublimite-view.tsx`                                         |
| 25          | `frontend/src/modules/dashboards/views/malha-funil-autorregularizacao-view.tsx`                          |
| 24          | `frontend/src/components/iconify/icon-sets.ts` (**aceitável** — cores dentro de SVGs de bandeiras/logos) |

**Precisa de decisão humana:** definir a paleta de dados/gráficos como token. Hoje cada dashboard
escolhe as suas cores, então não existe "cor de gráfico" reproduzível — é caso a caso.

### 3.4 Cores fixas dentro do próprio design system (controladas)

| Valor                                       | Uso                                  | Origem                                                                                                      |
| ------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `#282F37` / `#EDEFF2`                       | marcador de item de navegação        | `frontend/src/components/nav-section/styles/css-vars.ts:7`                                                  |
| `#28323D`                                   | `background.neutral` do tema escuro  | `frontend/src/theme/core/palette.ts:99` — ⚠️ **não pertence à escala de cinzas**; é o único fundo sem token |
| `#00B8D9` e `#FF5630` codificados em base64 | gradientes do fundo de menus/gavetas | `frontend/src/theme/core/mixins/global-styles-components.ts:73,76` — não acompanham troca de tema           |
| `#000000`                                   | `<meta name="theme-color">`          | `frontend/index.html:6` — ⚠️ preto, enquanto a interface é branca                                           |

---

## 4. 🟠 Cabeçalho de tabela é maior que o conteúdo da tabela

| Elemento                    | Valor                                     | Origem                                                       |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| Cabeçalho de tabela         | **`font-size: 14`** (px puro, não escala) | `frontend/src/theme/core/components/table.tsx:60`            |
| Cabeçalho da grade de dados | **`font-size: 14`** (px puro)             | `frontend/src/theme/core/components/mui-x-data-grid.tsx:131` |
| Corpo do texto (`body2`)    | `0.875rem` → **12,25 px**                 | `frontend/src/theme/core/typography.ts:107-110`              |

O cabeçalho fica **1,75 px maior** que o conteúdo. Como os dois valores foram escritos em unidades
diferentes (px puro vs `rem`), a diferença **não era intencional** — se a base do `rem` fosse 16 px,
ambos dariam 14 px e ficariam iguais.

**É consequência direta do item 1.**

---

## 5. 🟠 Foco visível praticamente não é customizado

Varredura em `frontend/src/theme/**`: **zero** ocorrências de `focusVisible` ou `:focus-visible`.

Os únicos realces de foco próprios:

| Onde                             | Estilo                                     | Origem                                                       |
| -------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| Botão `outlined` (hover)         | `box-shadow: 0 0 0 0.75px currentColor`    | `frontend/src/theme/core/components/button.tsx:130`          |
| Botão de alternância selecionado | `box-shadow: 0 0 0 0.75px currentColor`    | `frontend/src/theme/core/components/button-toggle.tsx:44-47` |
| Campo de texto                   | `& input:focus { border-radius: inherit }` | `frontend/src/theme/core/components/textfield.tsx:18`        |
| Seletor de paginação de tabela   | `&:focus { border-radius: 8px }`           | `frontend/src/theme/core/components/table.tsx:93`            |

Note que os dois primeiros são de **hover** e **selecionado**, não de foco por teclado.

**Consequência:** a navegação por teclado depende inteiramente do comportamento padrão da
biblioteca base (ripple + `action.focus` = `rgba(145 158 171 / 0.24)`). Em fundos claros esse
overlay de 24 % é de baixo contraste.

**Precisa de decisão humana:** definir um anel de foco explícito. É também um ponto de
acessibilidade (WCAG 2.4.7).

---

## 6. 🟠 Três famílias tipográficas carregadas sem uso

| Família                | Import                       | Uso no tema |
| ---------------------- | ---------------------------- | ----------- |
| `DM Sans Variable`     | `frontend/src/global.css:16` | **nenhum**  |
| `Inter Variable`       | `frontend/src/global.css:17` | **nenhum**  |
| `Nunito Sans Variable` | `frontend/src/global.css:18` | **nenhum**  |

Existem porque o painel de configurações permite trocar a família em runtime. Com
`fontFamily: 'Public Sans Variable'` no default (`frontend/src/components/settings/settings-config.ts:19`),
são três fontes variáveis baixadas e nunca desenhadas.

**Precisa de decisão humana:** se a troca de fonte não é um recurso de produto, remover os imports.

---

## 7. 🟡 Escala tipográfica com saltos irregulares e faixas faltando

| Problema                     | Detalhe                                                                                                     | Origem                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `h5` quase não cresce        | base `1.125rem` (15,75 px) → `sm` `1.1875rem` (16,625 px). Salto de **0,875 px** — imperceptível            | `frontend/src/theme/core/typography.ts:81-86` |
| `h4` pula faixas             | define só `md`; não tem `sm` nem `lg`                                                                       | `frontend/src/theme/core/typography.ts:75-80` |
| `h6` idem                    | define só `sm`                                                                                              | `frontend/src/theme/core/typography.ts:87-92` |
| Nenhuma variante usa `xl`    | acima de 1200 px a tipografia congela, embora o breakpoint `xl` (1536 px) exista                            | `frontend/src/theme/core/typography.ts:22-37` |
| `letter-spacing` inexistente | nenhuma das 13 variantes define — nem os títulos grandes (56 px), onde normalmente se aperta o rastreamento | `frontend/src/theme/core/typography.ts`       |

Não são erros; são lacunas do sistema. Registrado porque quem reproduzir vai estranhar.

---

## 8. 🟡 Altura de botão: apenas 2 dos 3 tamanhos são declarados

| Tamanho  | Altura     | Como surge                                                          |
| -------- | ---------- | ------------------------------------------------------------------- |
| `small`  | `30px`     | **declarada** — `frontend/src/theme/core/components/button.tsx:156` |
| `medium` | **`33px`** | **não declarada** — resulta de `padding 6+6` + `line-height 21px`   |
| `large`  | `48px`     | **declarada** — `frontend/src/theme/core/components/button.tsx:168` |

O tamanho mais usado é justamente o único sem altura fixa, e por isso é o único que **muda se a
tipografia mudar** (ver item 1: o `line-height` de 21 px depende da base do `rem`).

Confirmado em runtime: 30 px / 33 px / 48 px.

**Precisa de decisão humana:** fixar `height` no tamanho médio, ou remover dos outros dois.

---

## 9. 🟡 Mistura de unidades dentro do próprio tema

O tema alterna entre a função de espaçamento e valores fixos, às vezes no mesmo arquivo:

| Forma              | Exemplos                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `theme.spacing(n)` | 43 ocorrências em `frontend/src/theme/**`                                   |
| String em px       | `'24px'`, `'40px'`, `'8px'`, `'4px'`, `'12px'`, `'10px'`, `'16px'`          |
| Número puro        | `height: 30`, `minWidth: 48`, `width: 18`, `marginRight: 8`, `fontSize: 14` |

Casos concretos de mistura:

- `frontend/src/theme/core/components/tabs.tsx:19-20` usa `'24px'` / `'40px'` literais, mas
  `:43` usa `theme.spacing(1, 0)`
- `frontend/src/theme/core/components/card.tsx:27` usa `marginTop: '4px'` literal, mas
  `:33` usa `theme.spacing(3, 3, 0)`
- `frontend/src/theme/core/components/table.tsx:60` usa `fontSize: 14` (px), enquanto toda a
  tipografia usa `rem`

Sem impacto visual — mas é o que produziu o item 4.

---

## 10. 🟡 Presets de cor secundária existem e nunca podem ser ativados

`frontend/src/theme/with-settings/color-presets.ts:58-105` define 5 paletas secundárias completas.
O código que as aplicaria está **comentado**:

- `frontend/src/theme/with-settings/update-core.ts:36` → `// const updatedSecondaryColor = ...`
- `frontend/src/theme/with-settings/update-core.ts:45` → `// secondary: updatedSecondaryColor,`
- `frontend/src/theme/with-settings/update-core.ts:62` → `// secondary: createShadowColor(...)`

Resultado: trocar o preset de cor muda **só** a primária; a secundária fica sempre `#8E33FF`.
`grep -rn "secondaryColorPresets" frontend/src/` fora do próprio arquivo: **0 usos**.

---

## 11. ⚪ 60 arquivos `-default-mui` + 5 arquivos `copy` fora da árvore de execução

Convivem no repositório versões paralelas de arquivos ativos:

```
index-default-mui.html · public/favicon-default-mui.ico · src/main-default-mui.tsx
src/app copy.tsx · src/routes/paths-default-mui.ts · src/routes/sections/*-default-mui.tsx
src/layouts/dashboard/layout-default-mui.tsx · nav-vertical-default-mui.tsx · nav-mobile-default-mui.tsx
src/layouts/components/account-drawer-default-mui.tsx · sign-out-button-default-mui.tsx
src/layouts/auth-split/layout-default-mui.tsx · section-default-mui.tsx
src/layouts/nav-config-*-default-mui.tsx · src/components/iconify/icon-sets-default-mui.ts
src/components/logo/logo-default-mui.tsx · src/lib/axios-default-mui.ts
src/locales/*-default-mui.* · src/auth/**/*-default-mui.* · src/sections/user/*-default-mui.tsx
src/modules/malha-fiscal-parametrizacao/routes copy.tsx
```

Total: **60** arquivos `-default-mui` + **5** com `copy` no nome.
`src/app copy.tsx` não é importado por ninguém (verificado).

**Risco de documentação:** vários contêm valores de design **diferentes** dos ativos. Quem
inspecionar o arquivo errado documenta a interface errada.

Regra prática: **só vale o que está na árvore a partir de `frontend/src/main.tsx`.**

---

## 12. ⚪ Armadilhas de leitura (valores que parecem do sistema e não são)

| Armadilha                                                                       | Realidade                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Botões com `text-transform: capitalize` na rota `/components/mui/buttons`       | Vem **só da demo**: `frontend/src/sections/_examples/mui/button-view/view.tsx:21-22`. O sistema usa `text-transform: unset` (`frontend/src/theme/core/typography.ts:125`)                                                                   |
| Toda a rota `/components/**`                                                    | É a **galeria do template**, não o produto. Componentes ali podem receber estilos locais                                                                                                                                                    |
| `--layout-header-blur: 8px` sugere que o header borra em 8 px                   | O header usa o **default do mixin, `6px`** (`frontend/src/theme/core/mixins/background.ts:65`). A variável de 8 px tem **um único consumidor**: a barra de navegação horizontal (`frontend/src/layouts/dashboard/nav-horizontal.tsx:57-58`) |
| `typography.htmlFontSize: 16`                                                   | A raiz real é 14 px (item 1)                                                                                                                                                                                                                |
| Slots `Alert.*`, `Chip.*`, `FilledInput.*`, `Button.inherit*` no tema computado | São defaults gerados pela biblioteca e **sobrepostos** pelos overrides do projeto. Ver `01-cores.md` §6                                                                                                                                     |

---

## 13. ⚪ Detalhes menores registrados

| Item                                                 | Detalhe                                                                                                                                                                                                                                                                                            | Origem                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `success.contrastText` em minúsculas                 | `'#ffffff'`, enquanto todos os outros usam `'#FFFFFF'`                                                                                                                                                                                                                                             | `frontend/src/theme/theme-config.ts:78`    |
| `action.selectedChannel` truncado                    | Computa a string `"145"` (deveria ser `145 158 171`). O gerador de canais não consegue analisar um valor que já é `rgba(...)`. **Sem efeito visual** — nada consome esse canal                                                                                                                     | tema computado                             |
| `<ThemeProvider>` recebe props não declaradas        | `frontend/src/app.tsx:53-56` e `:68-71` passam `modeStorageKey` e `defaultMode`, mas a assinatura em `frontend/src/theme/theme-provider.tsx:17-22` não as declara; caem no repasse genérico. O modo é definido de fato por `defaultColorScheme: 'light'` (`frontend/src/theme/create-theme.ts:37`) | —                                          |
| `grey.50` declarado e não usado                      | `#FCFDFD` não aparece em nenhum override                                                                                                                                                                                                                                                           | `frontend/src/theme/theme-config.ts:97`    |
| `fontWeightLight` (300) declarado e não usado        | nenhuma variante o utiliza                                                                                                                                                                                                                                                                         | `frontend/src/theme/core/typography.ts:49` |
| `mixins.toolbar` do padrão da biblioteca fica ocioso | 56/48/64 px nunca usados: o layout define as próprias alturas (64/72 px)                                                                                                                                                                                                                           | default MUI 7.0.1                          |
| `43` usos de `!important`                            | concentrados em `frontend/src/components/chart/styles.css`, `frontend/src/components/editor/styles.tsx`, `frontend/src/sections/calendar/styles.tsx` e views de malha fiscal                                                                                                                       | —                                          |
| `161` estilos `style={{…}}` inline                   | escapam do sistema de tema                                                                                                                                                                                                                                                                         | —                                          |
| `6.005` usos de `sx={…}` e `251` de `styled(…)`      | volume alto de estilo local; parte dos valores desta ficha vale só para os componentes-base                                                                                                                                                                                                        | —                                          |
| `TableToolbar` não existe                            | apesar do padrão do template, `frontend/src/components/table/` não tem esse arquivo                                                                                                                                                                                                                | verificado por listagem                    |

---

## 14. Itens `⚠️ NÃO CONFIRMADO`

Todos os pontos em que não foi possível cravar o valor. Nenhum deles foi preenchido por suposição.

### 14.1 Resolvidos durante a apuração (registrados aqui por transparência)

| Item                                             | Como foi resolvido                                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Caixa total de caixa de seleção / botão de opção | **Medido**: `33,50 × 33,50px` (small) e `37,00 × 37,00px` (medium)                                                              |
| Dimensões completas do interruptor               | **Medido**: raiz `58×38` / `40×24`, trilha `34×20` / `26×16`, polegar `14×14` / `10×10` — bate 100 % com a derivação por código |
| Blur do header                                   | **Verificado no código**: `6px` (default do mixin), não `8px`                                                                   |

### 14.2 Em aberto

| #   | Item                                                     | Por quê                                                                             | Onde                                                               |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | Estado `hover`/`selected` de cartão                      | O sistema **não define** — cartões clicáveis usam estilo local de cada tela         | `componentes/card-e-paper.md:149`                                  |
| 2   | Cor efetiva do subtítulo do cabeçalho de cartão          | O override troca a variante sem declarar `color`; a herança depende do contexto     | `componentes/card-e-paper.md:224`                                  |
| 3   | Item de menu `selected` + `focus-visible`                | Combinação de opacidades (`0.08 + 0.12`) não medida                                 | `componentes/menu-popover-tooltip.md:54`                           |
| 4   | Herança do estilo de painel flutuante pelo menu          | Lido no fonte, não medido                                                           | `componentes/menu-popover-tooltip.md:128`                          |
| 5   | Célula de tabela fora de uma tabela                      | Computa `rgba(241, NaN, NaN, 1)` — cor inválida. Efeito visual real não determinado | `componentes/tabela.md:98`                                         |
| 6   | Alturas de célula de tabela (51,25 / 31,25 / 53 / 33 px) | Derivação aritmética, não medição                                                   | `componentes/tabela.md:228`                                        |
| 7   | Qual `margin-bottom` prevalece no título de alerta       | 4 px do override × `0.35em` do modificador padrão                                   | `componentes/alert-e-snackbar.md:130`                              |
| 8   | Campo preenchido no tamanho pequeno (34,61 px)           | Composição interna não fecha exatamente                                             | `componentes/campo-texto.md:115`, `04-tamanhos-e-dimensoes.md:280` |
| 9   | Conector de etapas: cor em `active`/`completed`          | Deduzido da ordem dos estilos                                                       | `componentes/outros.md:169`                                        |
| 10  | Ícone de item de lista dentro de item de menu            | `min-width: 36px` só por leitura de código                                          | `componentes/outros.md:303`                                        |
| 11  | Botão `large` + `outlined`                               | Não apareceu na amostra medida                                                      | `componentes/botao.md:77`                                          |
| 12  | Botão `soft` nos tamanhos pequeno/grande                 | Duas medições divergentes; pode ser interferência da demo                           | `componentes/botao.md:117`                                         |
| 13  | Foco do botão                                            | O modificador de elevação zera a sombra de foco; sem realce próprio                 | `componentes/botao.md:273`                                         |
| 14  | Grupo de botões: borda efetiva entre itens               | Derivado de fonte (3 px)                                                            | `componentes/botao-grupo-e-toggle.md:138,255`                      |
| 15  | Sobreposição do rótulo em campo com valor                | Não medido                                                                          | `componentes/form-labels.md:124,231`                               |
| 16  | Marca do controle deslizante × trilha                    | Interação não medida                                                                | `componentes/slider-e-rating.md:76`                                |
| 17  | Foco do botão de ação flutuante nas variantes próprias   | Sombra do padrão não é anulada                                                      | `componentes/fab.md:76,221`                                        |
| 18  | Adornos do seletor/autocompletar                         | Possível sobreposição não medida                                                    | `componentes/select-e-autocomplete.md:93`                          |
| 19  | Transição de cor do botão desabilitado                   | Aparece só em parte das medições                                                    | `07-motion.md:170`                                                 |

Nenhum é bloqueante para reproduzir a interface: todos são detalhes de estado secundário.

---

## 15. O que precisa de decisão humana

Em ordem de impacto:

| #   | Decisão                                                            | Impacto se ignorada                                                  |
| --- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1   | **Base do `rem`: 14 px ou 16 px?**                                 | Reproduzir com 16 px deixa **toda** a interface ~14 % maior          |
| 2   | **Apagar ou ligar `theme-overrides.ts`**                           | Risco permanente de alguém usar a cor de marca errada (roxo × verde) |
| 3   | **Definir tokens de cor para gráficos/dados**                      | 972 cores fixas; dois verdes e dois vermelhos convivendo hoje        |
| 4   | **Substituir `#FF4842`, `#00AB55`, `#212B36`** pelos tokens atuais | Inconsistência visual já presente na tela                            |
| 5   | **Definir um anel de foco explícito**                              | Acessibilidade por teclado (WCAG 2.4.7)                              |
| 6   | **Remover os 60 arquivos `-default-mui` e os 5 `copy`**            | Fonte recorrente de leitura errada                                   |
| 7   | **Alinhar cabeçalho de tabela (14 px) ao corpo (12,25 px)**        | Hierarquia tipográfica invertida na tabela                           |
| 8   | **Remover as 3 fontes não usadas** (ou ativar a troca de fonte)    | Peso de rede sem contrapartida                                       |
| 9   | **Fixar a altura do botão médio**                                  | Único tamanho que muda quando a tipografia muda                      |
| 10  | **Descomentar ou remover os presets de cor secundária**            | Recurso pela metade                                                  |

---

## 16. Como esta ficha lida com conflitos

1. **Nenhum "vencedor" foi escolhido em silêncio.** Onde há dois valores, os dois estão documentados
   com a respectiva origem.
2. **Defaults implícitos foram resolvidos executando o tema**, não estimados — e estão marcados como
   `default MUI 7.0.1`.
3. **Rastreabilidade foi validada por script**: as **2.340** citações `arquivo:linha` desta pasta
   foram verificadas contra o código real (arquivo existe, linha existe, valor confere na
   vizinhança). Correções aplicadas onde as linhas estavam defasadas.
4. **A medição em runtime tem precedência** sobre a leitura de código quando as duas divergem —
   e a divergência é registrada.

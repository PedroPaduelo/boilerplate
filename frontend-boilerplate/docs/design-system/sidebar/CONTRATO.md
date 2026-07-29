# Sidebar AuditorIA — contrato de implementação (réplica pixel-perfect)

> **Fonte da verdade do DESIGN**: `docs/design-system/componentes/navegacao-lateral.md`
> (extração do sistema original) + o pacote de referência entregue pelo usuário
> (`sidebar/README.md`, `sidebar/sidebar.css`, `sidebar/demo.html`), copiado em
> `docs/design-system/sidebar/referencia/`.
>
> **Fonte da verdade dos VALORES**: os tokens `--ds-*` publicados por
> `src/shared/theme/ds/auditoria.css`. Nenhum `#hex`, `px` ou `ms` novo é
> digitado no CSS do componente — se um valor não existe como token, ele entra
> em `ds-tokens.source.json` e o pipeline (`npm run ds:tokens && npm run ds:build`)
> republica. É a regra que já vale no projeto inteiro.

Este documento é o **contrato** que os dois consumidores da navegação seguem:

| Consumidor                     | Arquivo                                                                | O que muda                                                                 |
| ------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Navegação principal do app     | `src/app/app-sidebar.tsx`                                              | deixa de usar `SideNav` do Astryx e passa a usar `@/shared/ui/nav-section` |
| Navegação de abas do dashboard | `src/features/dashboards/components/viewer/dashboard-tabs-sidebar.tsx` | idem                                                                       |

---

## 1. Por que um componente próprio (e não tema em cima do `SideNav`)

Três fatos, medidos, não opinião:

1. **DOM incompatível.** O `SideNavItem` do Astryx não tem legenda (2ª linha),
   não tem "cotovelo"/linha vertical de aninhamento, e no estado recolhido vira
   ícone puro (24px) — não o bloco de 56px com rótulo de 8,75px embaixo que a
   forma **mini** exige. Não há prop, slot ou variante que produza isso.
2. **CSS não alcança.** O DS injeta classes atômicas do StyleX **fora de
   `@layer`**; regra escrita dentro de qualquer layer perde para elas por mais
   específica que seja (fato já registrado em `src/app/index.css`). Ou seja:
   nem com `!important` de layer dá para reposicionar o que o StyleX fixou.
3. **O contrato de migração permite.** `shared/ui` é exatamente o lugar de
   "primitivos de apresentação sem equivalente no Astryx" — é onde já vivem
   gráficos, KPI e ladrilhos.

O que **continua** do DS: `AppShell` (frame, drawer mobile, skip-link),
`LinkProvider` (navegação client-side), `Tooltip`, `Text`, e todos os tokens.

---

## 2. Estrutura de arquivos (nova)

```
src/shared/ui/nav-section/
  index.ts                 barrel (API pública)
  types.ts                 NavGroup, NavItemData, NavSectionProps…
  nav-section.tsx          <nav> + grupos            (≤ 120 linhas)
  nav-group.tsx            subheader + lista do grupo (≤ 120)
  nav-subheader.tsx        rótulo CAPS com seta no hover (≤ 90)
  nav-list.tsx             item + filhos + estado aberto/ativo (≤ 160)
  nav-item.tsx             a caixa do item (raiz/sub/mini) (≤ 180)
  nav-mini-dropdown.tsx    painel flutuante da forma mini (≤ 120)
  nav-collapse.tsx         animação de altura dos filhos (≤ 90)
  nav-icons.tsx            setas/info (eva) usadas pela própria nav (≤ 80)
  nav-sidebar.tsx          contêiner: superfície, largura, scroll, toggle (≤ 180)
  nav-section.css          TODO o estilo (único arquivo de CSS)
  __tests__/…              testes de comportamento e de contrato visual
```

`nav-section.css` é importado por `src/app/index.css` na camada `components`
(mesmo tratamento de `shared/ui/charts/chart-theme.css`).

---

## 3. API pública

```ts
// types.ts
export interface NavItemData {
  /** Chave estável. Default: href ?? title. */
  key?: string;
  title: string;
  href?: string;
  onClick?: (event: React.MouseEvent) => void;
  /** SVG 24×24 em currentColor (ver @/shared/ui/icons). */
  icon?: ReactNode;
  /** Legenda (2ª linha, 10,5px). Tooltip mostra o texto completo. */
  caption?: string;
  /** Badge textual à direita (12px/600). */
  info?: ReactNode;
  disabled?: boolean;
  /** Rota atual. Quem calcula é o consumidor (ele conhece o roteador). */
  active?: boolean;
  children?: NavItemData[];
  /** Dica no hover (estado expandido). Não vira 2ª linha. */
  description?: string;
  /** Divisor ANTES do item, dentro do mesmo grupo. */
  divider?: boolean;
  'data-testid'?: string;
}

export interface NavGroup {
  /** Rótulo do grupo (renderizado em CAIXA ALTA). Sem ele, não há subheader. */
  subheader?: string;
  items: NavItemData[];
  /** Começa colapsado. Default: false. */
  defaultCollapsed?: boolean;
}

export interface NavSectionProps {
  groups: NavGroup[];
  /** Forma mini (88px): ícone em cima, rótulo de 8,75px embaixo. */
  isMini?: boolean;
  'aria-label': string;
  'data-testid'?: string;
}

export interface NavSidebarProps {
  groups: NavGroup[];
  'aria-label': string;
  /** Estado controlado da forma mini. */
  isCollapsed?: boolean;
  onCollapsedChange?: (isCollapsed: boolean) => void;
  /** Botão redondo flutuante na borda. Default: true quando há onCollapsedChange. */
  hasToggle?: boolean;
  toggleLabel?: string;
  /** Conteúdo fixo acima da lista (ex.: campo de busca). Oculto na forma mini. */
  topContent?: ReactNode;
  /** Rodapé fixo (ex.: menu do usuário). */
  footer?: ReactNode;
  /** Conteúdo alternativo quando a lista está vazia (ex.: "nada encontrado"). */
  emptyContent?: ReactNode;
  'data-testid'?: string;
}
```

Regras de comportamento (todas vêm da referência):

- **Item com filhos** não navega: clicar abre/fecha (animação de altura).
  Item sem filhos com `href` é `<a>` (⌘/Ctrl+clique, botão do meio, copiar link);
  sem `href` é `<button>`.
- **Auto-abertura**: um item cujo descendente está `active` nasce aberto.
- **`open` ≠ `active`**: pai aberto com filho ativo fica **cinza**
  (`text.primary` + `action.hover`); só a rota ativa **raiz** fica verde.
- **Sub-item ativo é escuro** (`#1C252E` / branco no escuro), nunca verde.
- **Subheader** é botão: colapsa o grupo inteiro; a seta aparece no hover e o
  rótulo empurra 12px → 16px em 300ms.
- **Forma mini**: subheaders somem; filhos não expandem para baixo — abrem um
  **painel flutuante** à direita (hover), com sub-itens no formato normal;
  `caption` vira um ícone `info` de 16px no canto superior esquerdo do bloco.
- **Modo drawer (mobile)**: quando `useSideNavRenderMode() !== 'default'`, o
  `NavSidebar` renderiza **só a lista** (sem superfície, sem largura fixa, sem
  botão de recolher) — quem desenha a gaveta é o `AppShell`.
- **Teclado**: item é elemento focável nativo (`a`/`button`), `aria-expanded`
  em quem tem filhos, `aria-current="page"` no ativo, `aria-controls` ligando
  item ↔ bloco de filhos.
- **`prefers-reduced-motion`**: sem animação de altura nem de largura.

---

## 3.1 Nomes de classe (contrato entre CSS e JSX)

O projeto já prefixa as próprias classes com `app-` (`.app-chat`,
`.app-editor-shell`, `.app-canvas-block`). A navegação segue o mesmo padrão:

```
.app-nav-sidebar                contêiner (superfície, largura, transição)
.app-nav-sidebar--mini          forma mini (88px)
.app-nav-sidebar--plain         modo gaveta/mobile: só a lista, sem superfície
.app-nav-sidebar__top           conteúdo fixo acima da lista
.app-nav-sidebar__scroll        área rolável
.app-nav-sidebar__footer        rodapé fixo
.app-nav-sidebar__toggle        botão redondo de recolher

.app-nav                        <nav> raiz (publica as CSS vars da variante)
.app-nav__ul / .app-nav__li     listas
.app-nav__subheader             rótulo do grupo (CAPS) — botão
.app-nav__subheader-arrow       seta que aparece no hover

.app-nav__item                  a caixa clicável
.app-nav__item--root            nível 1
.app-nav__item--sub             nível ≥ 2 (desenha o cotovelo)
.app-nav__icon / __texts / __title / __caption / __info / __arrow
.app-nav__children              bloco dos filhos (linha vertical + recuo)
.app-nav__dropdown              painel flutuante da forma mini

estados: .is-active · .is-open · .is-disabled
```

### Botão de recolher — desvio consciente de 12px

Na origem o botão fica **centrado na borda** (metade para fora, `left: 300px;
transform: translate(-50%,-50%)`), porque lá a sidebar é `position: fixed` e
nada a recorta. Aqui ela vive dentro do `LayoutPanel` do `AppShell`, que aplica
`overflow: clip` — metade do botão sumiria. Então ele fica **tangente por
dentro**: `top: 36px; right: 0; transform: translate(-50%, -50%)`. Mesma leitura
visual (círculo colado na borda, na altura do topo), sem recorte.

---

## 4. Tabela de valores → token (o que o CSS deve usar)

| Papel                     | Valor da referência                          | Token a usar                                                                                                                                                                                                                                                          |
| ------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Largura vertical          | 300px                                        | `--ds-layout-nav-vertical-width`                                                                                                                                                                                                                                      |
| Largura mini              | 88px                                         | `--ds-layout-nav-mini-width`                                                                                                                                                                                                                                          |
| Largura mobile            | 288px                                        | `--ds-layout-nav-mobile-width`                                                                                                                                                                                                                                        |
| Transição de largura      | 120ms linear                                 | `--ds-layout-transition-duration` / `--ds-layout-transition-easing`                                                                                                                                                                                                   |
| Fundo da nav              | #FFF / #141A21                               | `--ds-color-background-default`                                                                                                                                                                                                                                       |
| Borda da nav              | rgba(145,158,171,.12) / .08                  | `--ds-color-border-nav-sidebar`                                                                                                                                                                                                                                       |
| Gap entre itens           | 4px                                          | `--ds-layout-nav-item-vertical-gap`                                                                                                                                                                                                                                   |
| Raio do item              | 8px                                          | `--ds-layout-nav-item-vertical-radius`                                                                                                                                                                                                                                |
| Padding do item           | 4px 8px 4px 12px                             | `--ds-layout-nav-item-vertical-padding`                                                                                                                                                                                                                               |
| Altura raiz / sub         | 44px / 36px                                  | `--ds-layout-nav-item-vertical-root-height` / `…-sub-height`                                                                                                                                                                                                          |
| Ícone raiz                | 24px, margin `0 12px 0 0`                    | `--ds-layout-nav-item-vertical-icon-size` / `…-icon-margin`                                                                                                                                                                                                           |
| Bullet (cotovelo)         | 12px                                         | `--ds-layout-nav-item-vertical-bullet-size`                                                                                                                                                                                                                           |
| Cor do bullet/linha       | #EDEFF2 / #282F37                            | **`--ds-color-border-nav-bullet`** (token novo — ver §5)                                                                                                                                                                                                              |
| Cor do item               | #637381 / #919EAB                            | `--ds-color-text-secondary`                                                                                                                                                                                                                                           |
| Fundo hover               | rgba(145,158,171,.08)                        | `--ds-color-action-hover`                                                                                                                                                                                                                                             |
| Cor da legenda            | #919EAB / #637381                            | `--ds-color-text-disabled`                                                                                                                                                                                                                                            |
| Ativo raiz (claro/escuro) | #00A76F / #5BE49B                            | `light-dark(var(--ds-color-primary-main), var(--ds-color-primary-light))`                                                                                                                                                                                             |
| Fundo ativo raiz          | rgba(0,167,111,.08)                          | `rgba(var(--ds-channel-primary-main) / var(--ds-opacity-selected))`                                                                                                                                                                                                   |
| Fundo ativo raiz hover    | rgba(0,167,111,.16)                          | `rgba(var(--ds-channel-primary-main) / 0.16)` → usar `--ds-color-action-selected`? **não**: é canal primary; usar `calc`-free literal via token de opacidade `--ds-opacity-activated` (0.12) **não serve** — declarar `0.16` só aqui, com comentário citando a origem |
| Aberto (open)             | #1C252E / #FFF + action.hover                | `--ds-color-text-primary` + `--ds-color-action-hover`                                                                                                                                                                                                                 |
| Sub ativo                 | #1C252E / #FFF + action.hover                | idem                                                                                                                                                                                                                                                                  |
| Subheader                 | #919EAB → #1C252E no hover                   | `--ds-color-text-disabled` → `--ds-color-text-primary`                                                                                                                                                                                                                |
| Título                    | 12,25px / 500 (ativo 600), lh 1.5714         | `--ds-typography-body2-*` (ver `dsTypography.body2`) ou `--font-size-2xs`                                                                                                                                                                                             |
| Legenda                   | 10,5px / lh 1.5                              | `--font-size-4xs`                                                                                                                                                                                                                                                     |
| Subheader                 | 9,625px / 700 CAPS                           | **novo**: `--ds-typography-overline-nav-size` **não** — usar o valor da tipografia `overline` com `font-size` sobrescrito; declarar `9.625px` com comentário (é sobrescrita da origem, `nav-subheader.tsx:15-55`)                                                     |
| Título mini               | 8,75px / 600 (ativo 700), lh 16px            | idem, valor da origem `mini/nav-item.tsx:186-205`                                                                                                                                                                                                                     |
| Item mini                 | 56px, padding `8px 4px 6px 4px`, ícone 22px  | `--ds-layout-nav-item-mini-*`                                                                                                                                                                                                                                         |
| Sub do dropdown mini      | 34px, padding `0 8px`                        | `--ds-layout-nav-item-mini-sub-height` / `…-sub-padding`                                                                                                                                                                                                              |
| Painel do dropdown        | raio 10px, padding 4px, blur 20px, fundo 90% | `--ds-radius-chip` (10px), `--ds-opacity-paper-surface`, `--ds-shadow-dropdown`                                                                                                                                                                                       |
| Transição do subheader    | 300ms easeInOut                              | `--duration-medium` + `--ds-easing-in-out`                                                                                                                                                                                                                            |
| Desabilitado              | opacity .48                                  | `--ds-opacity-disabled`                                                                                                                                                                                                                                               |

> Onde a tabela manda "declarar o valor com comentário", o comentário **cita a
> origem** (`arquivo:linha` do sistema original, como o resto do DS faz). São
> exatamente 3 exceções: `0.16` do fundo ativo+hover, `9.625px` do subheader e
> `8.75px` do título mini — todas registradas em `navegacao-lateral.md` como
> valores literais da origem.

---

## 5. Token novo: `--ds-color-border-nav-bullet`

`#EDEFF2` (claro) / `#282F37` (escuro) — o "cotovelo" e a linha vertical do
aninhamento. A doc da origem registra que **não existem na paleta**
(`css-vars.ts:7`), então entram como token de **borda** (é uma linha):

1. em `src/shared/theme/ds/ds-tokens.source.json`, dentro de `color.border`,
   ao lado de `navSidebar`, no mesmo formato `{ light: {...}, dark: {...} }`
   com `source: "frontend/src/components/nav-section/styles/css-vars.ts:7"`;
2. `npm run ds:tokens && npm run ds:build` (o gerador itera `color.border`
   genericamente — nada mais precisa mudar);
3. conferir que `auditoria.css` passou a publicar
   `--ds-color-border-nav-bullet: light-dark(#EDEFF2, #282F37)`.

---

## 6. Ícones

Os ícones do menu vêm do **pacote real do sistema** (`icones-auditoria.zip`),
coleção **Solar** na grade 24×24, `fill/stroke: currentColor`. Eles viram
componentes React em `src/shared/ui/icons/` (SVG inline; nada de rede — a doc
do pacote registra que 163 ícones do original piscavam por serem carregados
online).

Mapa dos itens do menu (o original usa exatamente estes em
`layouts/nav-config-dashboard.tsx`):

| Item do app | Ícone                              |
| ----------- | ---------------------------------- |
| Início      | `solar:home-angle-bold-duotone`    |
| Dashboards  | `solar:chart-2-line-duotone`       |
| Gráficos    | `solar:chart-square-bold-duotone`  |
| Catálogo    | `solar:library-broken`             |
| Conexões    | `solar:server-path-broken`         |
| Chat        | `solar:chat-round-dots-bold`       |
| Usuários    | `solar:users-group-rounded-broken` |

Setas e apoio da própria nav (coleção **eva**, como no original):
`eva:arrow-ios-forward-fill` (fechado), `eva:arrow-ios-downward-fill` (aberto),
`eva:arrow-ios-back-fill` (botão de recolher), `eva:info-outline` (legenda na
forma mini).

---

## 6.1 Desvios de MOLDURA — decididos, medidos e fechados

A **barra** é réplica fiel (§7 mede cada valor). O que NÃO é idêntico à origem é
a **moldura** em volta dela, que pertence ao `AppShell` do design system. Três
desvios, os três conscientes — estão aqui para ninguém reabrir sem dado novo.

### a) A barra começa abaixo do cabeçalho (49px), não em `top: 0`

Na origem a sidebar é `position: fixed; top: 0` com `z-index: 1201` e é o
**cabeçalho** que se desloca (`left: 300px`). Aqui ela é a região `start` do
`AppShell`, que renderiza cabeçalho em cima e a linha `nav + conteúdo` embaixo.

- **O que muda na tela:** a borda direita da barra nasce 49px mais abaixo e o
  botão de recolher desce junto. Medido: as duas superfícies (cabeçalho e barra)
  usam `background.default` e o cabeçalho **não tem borda inferior**, então não
  há emenda visível — o que se perde são 49px de borda vertical.
- **O que custaria inverter:** tirar a barra do fluxo (`position: fixed`),
  manter um espaçador de 300/88px para o conteúdo não deslizar por baixo,
  empurrar o cabeçalho com `padding-left` animado, e vencer as classes do StyleX
  do `TopNav` a partir de fora de `@layer` (o projeto proíbe: `index.css`).
  Fragilidade recorrente a cada atualização do DS.
- **Decisão:** não inverter. O ganho é 49px de borda; o custo é lutar com o
  frame do DS para sempre.

### b) O botão de recolher fica tangente POR DENTRO da borda

Origem: centrado na borda (`transform: translate(-50%,-50%)` sobre `left:300px`).
Aqui o `LayoutPanel` aplica `overflow: clip` e cortaria a metade de fora. Fica
tangente por dentro — mesma leitura, sem recorte (detalhes em §3.1).

### c) A gaveta do mobile tem 320px, não 288px

Quem monta a gaveta é o `TopNav` do DS (`<MobileNav header={heading}>`), sem
expor `width` — o default do componente é 320px. Para chegar aos 288px da origem
seria preciso assumir a gaveta inteira (estado de abertura, cabeçalho, contexto
de render) ou um `!important` fora de layer. **32px não pagam nenhum dos dois.**
O CONTEÚDO da gaveta é o mesmo da coluna (mesmas três zonas, mesmos itens).

### d) `AppShell variant="wash"` (e não o default `elevated`)

Medido no escuro com o default: área de conteúdo `#1C252E` (paper) **igual** à
cor do cartão — cartão sumindo no fundo, e um canto arredondado de 16px que a
origem não tem. `wash` põe navegação e conteúdo em `background.default`, e a
única linha entre as regiões passa a ser a borda da barra. É o desvio que
APROXIMA da origem, não o que afasta.

## 6.2 Largura da barra de abas do dashboard: 300px (decidido)

A tela `/dashboards/:id/view` é **autônoma** — registrada no slot raiz das rotas,
fora do `DashboardLayout`: não tem menu do app nem topbar (`features/dashboards/
routes.tsx`). Logo, a barra de abas **é a navegação daquela tela**, exatamente o
caso que a especificação descreve com 300px. Não há duas navs disputando espaço.

O custo medido é uma linha de 4 KPIs em viewport de 1280px: precisa de 976px
úteis e sobram 932px, então ela quebra em 3+1. Com os 248px anteriores sobravam
984px — passava por **8px**, ou seja, já era fio de navalha (qualquer mudança de
respiro quebraria também). Contra isso: a forma mini (88px) devolve 212px e a
escolha agora **persiste** por dashboard (`dashboards:viewer:tabs-collapsed`).

**Decisão:** manter 300px, via token. Se um dia a medida precisar mudar, muda-se
`--ds-layout-nav-vertical-width` — nunca um valor solto no componente.

---

## 7. Critérios de aceite (verificáveis)

Medidos no browser (computed style) e nos testes:

- [ ] `nav` vertical mede **300px**; recolhida, **88px**; transição `120ms linear`.
- [ ] Item raiz: `min-height 44px`, `border-radius 8px`, `padding 4px 8px 4px 12px`.
- [ ] Ícone raiz **24×24** com `margin-right 12px`; mini **22×22**.
- [ ] Título **12,25px/500**; ativo **600**; legenda **10,5px**.
- [ ] Subheader **9,625px/700 CAPS**; no hover `padding-left` vai a 16px e a seta aparece.
- [ ] Sub-item: `min-height 36px`, bullet 12px e linha vertical de 2px na cor do token.
- [ ] Ativo raiz: texto `#00A76F` (claro) / `#5BE49B` (escuro) sobre fundo 8%.
- [ ] Sub ativo: texto `text.primary`, fundo `action.hover` — **não** verde.
- [ ] Forma mini: bloco de **56px**, rótulo **8,75px/600** (ativo 700), seta
      absoluta em `top 11px / right 6px`, submenu em painel flutuante.
- [ ] `npm run lint`, `npm run typecheck` e `npm test` verdes.
- [ ] Nada de `#hex`/`px` fora da tabela §4 no CSS do componente.

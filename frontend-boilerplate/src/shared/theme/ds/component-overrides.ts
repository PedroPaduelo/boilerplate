/**
 * OVERRIDES DE COMPONENTE — as decisões do DS do AuditorIA nos componentes do Astryx.
 * ============================================================================
 *
 * `auditoria-theme.ts` liga TOKEN a TOKEN (a paleta do DS nos slots do Astryx).
 * Este arquivo faz a camada de cima: onde um componente do Astryx desenha algo
 * diferente do que o design de origem desenhava, o desvio é corrigido aqui.
 *
 * ---------------------------------------------------------------------------
 * COMO ISSO VIRA CSS (importa para entender as regras abaixo)
 * ---------------------------------------------------------------------------
 * Cada chave de primeiro nível é o NOME DA CLASSE ESTÁVEL do componente, sem o
 * prefixo: `button` → `.astryx-button`, `text-input` → `.astryx-text-input`.
 * As chaves internas viram sufixos de seletor (`parseStyleKey`):
 *
 *   base                     → .astryx-button
 *   'variant:soft'           → .astryx-button.soft
 *   'variant:ghost+size:sm'  → .astryx-button.ghost.sm
 *   'checked'                → .astryx-switch.checked          (estado, sem `prop:`)
 *   ':hover' / ':focus-visible' (valor objeto) → regra separada com o pseudo
 *
 * O CSS sai em `@layer astryx-theme`, que fica ACIMA das camadas do StyleX —
 * então uma propriedade declarada aqui vence a do componente mesmo com
 * especificidade menor. Não é preciso `!important` em lugar nenhum.
 *
 * ---------------------------------------------------------------------------
 * DUAS REGRAS QUE VALEM PARA O ARQUIVO INTEIRO
 * ---------------------------------------------------------------------------
 * 1. **Zero valor literal.** Nenhum `#hex`, `rgb()`, `px` ou `ms` é digitado.
 *    Tudo é `var(--ds-*)` (paleta bruta do DS) ou `var(--color-*)`/`--radius-*`/
 *    `--font-*` (slots do Astryx que o tema já ligou à paleta). Transparência
 *    segue o padrão da origem: `rgba(var(--ds-channel-x) / alfa)` — ver `alpha()`.
 *    O `ds:check` quebra o build se algo escapar.
 *
 * 2. **Par claro/escuro é explícito.** `defineTheme` converte tuplas
 *    `[claro, escuro]` para `light-dark()` só em `tokens`; em `components` o
 *    valor é usado cru. Por isso existe `scheme()` — quando um componente muda
 *    de cor por esquema, o `light-dark()` é escrito à mão.
 *
 * ---------------------------------------------------------------------------
 * O QUE FOI CORRIGIDO DE PROPÓSITO (não é infidelidade, é decisão registrada)
 * ---------------------------------------------------------------------------
 * a) **Cabeçalho de tabela** — na origem ficou 14px contra 12,25px do corpo,
 *    efeito colateral da base de `rem` (99-inconsistencias.md §4, classificado
 *    lá mesmo como "não intencional"). Aqui os dois usam a mesma escala.
 * b) **Anel de foco** — o DS de origem não tem `:focus-visible` em lugar nenhum
 *    (99-inconsistencias.md §5, falha WCAG 2.4.7). Adicionado com os tokens
 *    `--ds-focus-ring-*`, publicados no tema.
 *
 * Tudo o mais é tradução direta das fichas de `docs/design-system/componentes/`.
 */

import type { ComponentStyleMap } from '@astryxdesign/core/theme';

import { dsTypography } from './tokens.generated';

/* ========================================================================== *
 * Helpers
 * ========================================================================== */

/** Referência a um token. */
const ref = (token: string) => `var(${token})`;

/**
 * Transparência no formato da origem: `rgba(<canal> / <alfa>)`.
 * É como o `varAlpha` do DS compõe TODA cor translúcida — guarda o trio RGB
 * sem função e injeta o alfa na hora.
 */
const alpha = (channelToken: string, a: number) => `rgba(var(${channelToken}) / ${a})`;

/**
 * Par claro/escuro para valores de COMPONENTE (tokens usam tupla; aqui não).
 * Ver nota 2 do cabeçalho.
 */
const scheme = (light: string, dark: string) => `light-dark(${light}, ${dark})`;

/**
 * Anel de foco por teclado — a correção (b) do cabeçalho.
 * Fora do fluxo do layout (`outline`), então nunca desloca conteúdo.
 */
const focusRing = {
  outline: `${ref('--ds-focus-ring-width')} solid ${ref('--color-accent')}`,
  outlineOffset: ref('--ds-focus-ring-offset'),
};

/* ========================================================================== *
 * TIPOGRAFIA — Heading
 *
 * O DS tem DUAS famílias e a divisão não é por "título x corpo": Barlow vale
 * só em h1–h3; h4–h6 usam Public Sans (02-tipografia.md §2). O Astryx tem um
 * único `--font-family-heading`, então os três níveis menores são devolvidos
 * à família do corpo.
 *
 * Vale lembrar o papel real de cada nível no produto (02-tipografia.md §5):
 * h4 = título de página (75 usos), h6 = título de card (111), h1/h2 quase só
 * em telas de erro. Numa tela de dashboard o título é `level={4}`.
 * ========================================================================== */

const familyOf = (variant: keyof typeof dsTypography) =>
  dsTypography[variant].family === 'secondary'
    ? ref('--font-family-heading')
    : ref('--font-family-body');

const heading = {
  'level:1': { fontFamily: familyOf('h1') },
  'level:2': { fontFamily: familyOf('h2') },
  'level:3': { fontFamily: familyOf('h3') },
  'level:4': { fontFamily: familyOf('h4') },
  'level:5': { fontFamily: familyOf('h5') },
  'level:6': { fontFamily: familyOf('h6') },
};

/* ========================================================================== *
 * BOTÃO — `componentes/botao.md`
 *
 * Mapa de variantes. O DS tem 4 variantes × 7 cores; o Astryx tem 4 variantes
 * e nenhum eixo de cor. A tradução escolhe, para cada variante do Astryx, a
 * combinação {variante, cor} que cumpre o MESMO PAPEL no produto:
 *
 *   Astryx        DS de origem                     por quê
 *   ───────────── ──────────────────────────────── ─────────────────────────────
 *   primary       contained + color="primary"      ação principal da tela
 *   secondary     outlined  + color="inherit"      ação de apoio (borda neutra)
 *   ghost         text      + color="inherit"      ação terciária, sem caixa
 *   destructive   contained + color="error"        ação irreversível
 *   soft ★        soft      + color="primary"      preenchimento fraco do DS
 *
 * ★ `soft` não existe no Astryx: é variante NOVA, declarada aqui. O
 *   `astryx theme build` gera a augmentation de tipos (`auditoria.variants.d.ts`),
 *   então `<Button variant="soft" />` fica type-safe depois do build.
 *
 * Duas decisões globais do DS (botao.md §"Regras de uso observadas"):
 *   - `text-transform: unset` — o rótulo respeita o texto escrito, não vira
 *     caixa alta (a origem sobrescreve o default do MUI de propósito);
 *   - `disableElevation: true` — nenhuma sombra em repouso/foco/pressionado.
 *     A ÚNICA sombra do botão é a de hover, e só nas variantes preenchidas,
 *     colorida pela família (`customShadows[cor]`).
 * ========================================================================== */

/** Hover das variantes preenchidas: cor cheia `.dark` + sombra colorida. */
const filledHover = (background: string, shadow: string) => ({
  backgroundColor: background,
  // O Astryx pinta o hover com um véu cinza sobre a cor
  // (`background-image: linear-gradient(overlay, overlay)`). O DS troca a cor
  // inteira por `.dark`, sem véu — daí o `none`.
  backgroundImage: 'none',
  boxShadow: shadow,
});

const button = {
  base: {
    textTransform: dsTypography.button.textTransform,
    fontWeight: ref('--font-weight-bold'),
    // 1,714 — adimensional de propósito: nos três tamanhos do DS o
    // line-height é sempre 1,714 × font-size (21 / 19,5 / 22,5px).
    lineHeight: String(dsTypography.button.lineHeight),
    borderRadius: ref('--ds-size-button-radius'),
    boxShadow: 'none',

    /**
     * `min-width: 64px` do DS, sem quebrar o botão só-ícone do Astryx.
     *
     * Em `isIconOnly` o Astryx declara `--button-icon-only-aspect: 1/1` NO
     * PRÓPRIO ELEMENTO. Lendo essa variável com o min-width como fallback:
     *   - botão normal   → variável ausente → usa o fallback (64px);
     *   - botão só-ícone → resolve para `1 / 1`, inválido para `min-width`,
     *     a declaração é descartada e vale o `auto` inicial — que é o que o
     *     quadrado precisa.
     * Um seletor faria o mesmo, mas não existe classe/atributo para o estado.
     */
    minWidth: `var(--button-icon-only-aspect, ${ref('--ds-size-button-min-width')})`,

    // O DS usa 0.48 como opacidade de desabilitado (`action.disabledOpacity`);
    // o default do Astryx é 0.5.
    '--button-disabled-opacity': ref('--ds-opacity-disabled'),
    '--button-focus-offset': ref('--ds-focus-ring-offset'),

    // Correção (b): o Astryx já traz anel nas 4 variantes nativas, mas cada
    // uma declara o seu — a variante `soft`, sendo nova, ficaria sem. Declarar
    // no `base` cobre todas de uma vez, com o mesmo token.
    ':focus-visible': focusRing,
  },

  /* --- Tamanhos: 30 / 33 / 48px (botao.md §Medidas) ---------------------- *
   * Só `small` e `large` têm altura declarada na origem; os 33px do `medium`
   * são soma de padding + line-height (99-inconsistencias.md §8). Fixamos os
   * três: no Astryx a altura é sempre um token, então "flutuar" não é opção.
   * O padding lateral muda por tamanho E por variante (a `text` é mais
   * apertada) — daí as combinações `variant:ghost+size:*`.                   */
  'size:sm': {
    height: ref('--ds-size-button-small-height'),
    paddingInline: ref('--ds-size-button-small-padding-x'),
    fontSize: ref('--ds-size-button-small-font-size'),
  },
  'size:md': {
    height: ref('--ds-size-button-medium-height'),
    paddingInline: ref('--ds-size-button-medium-padding-x'),
    fontSize: ref('--ds-size-button-medium-font-size'),
  },
  'size:lg': {
    height: ref('--ds-size-button-large-height'),
    paddingInline: ref('--ds-size-button-large-padding-x'),
    fontSize: ref('--ds-size-button-large-font-size'),
  },
  'variant:ghost+size:sm': {
    paddingInline: ref('--ds-size-button-small-padding-x-text'),
  },
  'variant:ghost+size:md': {
    paddingInline: ref('--ds-size-button-medium-padding-x-text'),
  },
  'variant:ghost+size:lg': {
    paddingInline: ref('--ds-size-button-large-padding-x-text'),
  },

  /* --- Variantes --------------------------------------------------------- */

  'variant:primary': {
    backgroundColor: ref('--ds-color-primary-main'),
    color: ref('--ds-color-primary-contrast-text'),
    ':hover:not(:disabled)': filledHover(
      ref('--ds-color-primary-dark'),
      ref('--ds-shadow-primary'),
    ),
  },

  /**
   * `outlined` + cor `inherit`: borda cinza a 32%, fundo transparente, texto
   * herdado. A ficha registra que o "anel" `0 0 0 0.75px currentColor` do
   * hover NÃO se aplica à cor `inherit` (botao.md §outlined, "assimetria real
   * do código") — por isso aqui o hover só troca o fundo.
   */
  'variant:secondary': {
    backgroundColor: 'transparent',
    color: ref('--ds-color-text-primary'),
    // O botão do Astryx nasce sem borda (`border-width: 0`); o `outlined` do
    // DS tem 1px — que é justamente o `--border-width` do Astryx.
    borderWidth: ref('--ds-border-width-thin'),
    borderStyle: 'solid',
    borderColor: ref('--ds-color-border-button-outlined-inherit'),
    ':hover:not(:disabled)': {
      backgroundColor: ref('--ds-color-action-hover'),
      backgroundImage: 'none',
    },
  },

  'variant:ghost': {
    backgroundColor: 'transparent',
    color: ref('--ds-color-text-primary'),
    ':hover:not(:disabled)': {
      backgroundColor: ref('--ds-color-action-hover'),
      backgroundImage: 'none',
    },
  },

  'variant:destructive': {
    backgroundColor: ref('--ds-color-error-main'),
    color: ref('--ds-color-error-contrast-text'),
    ':hover:not(:disabled)': filledHover(
      ref('--ds-color-error-dark'),
      ref('--ds-shadow-error'),
    ),
  },

  /**
   * `soft` — o preenchimento fraco do projeto (botao.md §soft).
   * Fundo = cor a 16%, hover = 32%; o texto usa `.dark` no claro e `.light`
   * no escuro (é a mesma receita de `Chip soft` e `Label soft`).
   */
  'variant:soft': {
    backgroundColor: alpha('--ds-channel-primary-main', 0.16),
    color: scheme(ref('--ds-color-primary-dark'), ref('--ds-color-primary-light')),
    boxShadow: 'none',
    ':hover:not(:disabled)': {
      backgroundColor: alpha('--ds-channel-primary-main', 0.32),
      backgroundImage: 'none',
    },
  },
};

/* ========================================================================== *
 * CAMPO DE TEXTO — `componentes/campo-texto.md`, `componentes/form-labels.md`
 *
 * O ponto não-óbvio, e o mais fácil de errar: **a cor de foco do campo não é a
 * cor de marca**. Tanto a borda do `outlined` quanto a linha do `standard`
 * usam `text.primary`; o verde da marca só apareceria num caminho
 * praticamente inalcançável (campo-texto.md §"Regras de uso observadas" #4).
 * O Astryx, por padrão, usa `--color-accent` no `:focus-within` — é
 * exatamente esse desvio que o override abaixo corrige.
 *
 * Escala de alfas do cinza, que governa TODA a família de inputs (§6):
 *   0.08 fundo filled · 0.16 hover/focus filled · 0.20 borda outlined ·
 *   0.24 disabled · 0.32 linha do standard.
 * ========================================================================== */

/** Aparência compartilhada por text-input / textarea / selector. */
const inputSurface = {
  backgroundColor: 'transparent',
  borderColor: ref('--ds-color-border-input-rest'),
  borderRadius: ref('--ds-size-input-radius'),
  fontSize: ref('--ds-size-input-font-size'),
  // Em repouso o campo do DS é liso: sem sombra, sem anel.
  boxShadow: 'none',

  // Hover escurece a borda para `text.primary` (o Astryx clareia com um anel
  // interno; o DS não tem esse anel).
  ':hover:not(:focus-within)': {
    borderColor: ref('--ds-color-text-primary'),
    boxShadow: 'none',
  },

  // Foco: cor de texto, não cor de marca — ver bloco acima.
  ':focus-within': {
    borderColor: ref('--ds-color-text-primary'),
    boxShadow: 'none',
  },

  // Correção (b): foco por TECLADO ganha anel visível. `:has(:focus-visible)`
  // porque quem recebe o foco é o `<input>` interno, não o wrapper.
  ':has(:focus-visible)': focusRing,

  /**
   * Desabilitado: borda a 24% e a opacidade do DS (0.48, contra 0.5 do Astryx).
   *
   * Não existe classe de estado para isto — `text-input` só reflete `size` e
   * `status`. O seletor cobre as duas formas do wrapper: campo que EMBALA um
   * `<input disabled>` (TextInput, TextArea) e controle que É o próprio botão
   * desabilitado (Selector).
   */
  ':is(:disabled, :has(:disabled))': {
    borderColor: alpha('--ds-channel-grey-500', 0.24),
    opacity: ref('--ds-opacity-disabled'),
  },
};

/** Estado de erro: borda `error.main` cheia, em repouso e no foco. */
const inputError = {
  borderColor: ref('--ds-color-border-input-error'),
  ':hover:not(:focus-within)': { borderColor: ref('--ds-color-border-input-error') },
  ':focus-within': { borderColor: ref('--ds-color-border-input-error') },
};

const textInput = {
  base: inputSurface,
  'status:error': inputError,
};

/* --------------------------------------------------------------------------
 * Rótulo e texto auxiliar (`form-labels.md`)
 *
 * No DS o rótulo vive dois estados (flutuante e encolhido). No Astryx ele é
 * sempre estático acima do campo — ou seja, equivale ao estado ENCOLHIDO:
 * 14px / peso 600 / `text.secondary` (form-labels.md §"Estado encolhido").
 * É uma inversão deliberada da hierarquia Material: o rótulo encolhido é
 * mais escuro e mais pesado que o em repouso.
 * -------------------------------------------------------------------------- */

const fieldLabel = {
  base: {
    fontSize: ref('--font-size-sm'),
    fontWeight: ref('--font-weight-semibold'),
    color: ref('--ds-color-text-secondary'),
  },
};

/**
 * Texto auxiliar = `FormHelperText`: 10,5px (`caption`), `text.secondary`,
 * 8px de respiro do campo (o DS sobe os 3px do MUI para 8px).
 * O fundo colorido que o Astryx pinta atrás da mensagem não existe no DS.
 */
const fieldStatus = {
  base: {
    fontSize: ref('--font-size-4xs'),
    marginTop: ref('--ds-spacing-1'),
    paddingBlock: ref('--ds-spacing-0'),
    paddingInline: ref('--ds-spacing-0'),
    backgroundColor: 'transparent',
  },
  'type:error': { color: ref('--ds-color-error-main') },
  'type:warning': { color: ref('--ds-color-warning-dark') },
  'type:success': { color: ref('--ds-color-success-dark') },
};

/* ========================================================================== *
 * SUPERFÍCIES — `componentes/card-e-paper.md`
 *
 * `Paper` do DS tem `elevation: 0` por default: um cartão NÃO usa a escala de
 * sombras, usa `customShadows.card`. E `background-image: none` anula o
 * overlay de elevação do modo escuro — no DS o `paper` é sempre a mesma cor,
 * independentemente da elevação.
 *
 * 16px de raio (= base × 2) é o "raio de superfície grande" do sistema:
 * o mesmo do Dialog. Os 8px ficam para controles.
 * ========================================================================== */

const card = {
  base: {
    borderRadius: ref('--radius-container'),
    padding: ref('--ds-spacing-3'),
    boxShadow: ref('--ds-shadow-card'),
    backgroundImage: 'none',
  },
};

/* ========================================================================== *
 * TABELA — `componentes/tabela.md`
 *
 * Três marcas registradas da tabela do DS:
 *   1. cabeçalho sobre `background.neutral` (#F4F6F8 / #28323D);
 *   2. divisória TRACEJADA — a assinatura visual do sistema, repetida no
 *      `DialogContent dividers` e no DataGrid;
 *   3. linha selecionada em verde MUITO discreto: base `primary.dark` a 4%
 *      (o MUI usaria `primary.main` a 8%).
 * ========================================================================== */

const tableHeaderCell = {
  base: {
    backgroundColor: ref('--ds-color-background-neutral'),
    // Correção (a): a origem escreveu 14px em px puro aqui e `rem` no corpo,
    // e o cabeçalho acabou 1,75px MAIOR que o conteúdo. Alinhado ao corpo.
    // `--font-size-2xs` é o degrau que vale `body2` (12,25px), o texto
    // dominante da UI e o tamanho real da célula de conteúdo.
    fontSize: ref('--font-size-2xs'),
    borderBottomStyle: 'dashed',
  },
};

const tableCell = {
  base: {
    // O corpo da tabela é `body2` no DS; no Astryx a célula usa o slot de
    // "body" (14px). Fixado no degrau certo.
    fontSize: ref('--font-size-2xs'),
    borderBottomStyle: 'dashed',
  },
};

const tableRow = {
  base: {
    // O Astryx marca a linha selecionada com `aria-selected` no `<tr>`; não há
    // classe de estado, então o seletor é escrito como pseudo.
    ':is([aria-selected=true])': {
      backgroundColor: alpha('--ds-channel-primary-dark', 0.04),
    },
    ':is([aria-selected=true]):hover': {
      backgroundColor: alpha('--ds-channel-primary-dark', 0.08),
    },
  },
};

/* ========================================================================== *
 * MARCADORES — `componentes/chip-badge-avatar-label.md`
 *
 * Correspondência de papéis (nomes divergem entre os dois sistemas):
 *
 *   Astryx `Badge` ← DS `Label`  — etiqueta de status, o componente próprio
 *                                  mais usado do sistema
 *   Astryx `Token` ← DS `Chip`   — pílula removível/interativa
 *
 * O `Label` do DS tem `variant="soft"` como DEFAULT: fundo da cor a 16%,
 * texto `.dark` no claro e `.light` no escuro. É a mesma receita do botão
 * `soft`. As variantes de matiz (blue/cyan/…) já saem certas do tema, porque
 * os tokens categóricos reproduzem o `inverted` do Label (fundo `lighter`,
 * texto `darker`).
 * ========================================================================== */

/** Uma variante `soft` do Label: fundo 16% + texto que inverte por esquema. */
const softLabel = (background: string, textLight: string, textDark: string) => ({
  backgroundColor: background,
  color: scheme(textLight, textDark),
});

const badge = {
  base: {
    // Label: 24px de altura, raio 6 (= base × 0,75), 10,5px em peso 700.
    height: ref('--ds-size-label-height'),
    minWidth: ref('--ds-size-label-min-width'),
    padding: ref('--ds-size-label-padding'),
    gap: ref('--ds-size-label-gap'),
    borderRadius: ref('--ds-size-label-radius'),
    fontSize: ref('--ds-size-label-font-size'),
    fontWeight: ref('--ds-size-label-font-weight'),
  },
  'variant:neutral': softLabel(
    alpha('--ds-channel-grey-500', 0.16),
    ref('--ds-color-grey-600'),
    ref('--ds-color-grey-500'),
  ),
  // `info` do Astryx aponta para o acento; no DS existe uma família `info`
  // própria (ciano #00B8D9), e é ela que o Label usa.
  'variant:info': softLabel(
    alpha('--ds-channel-info-main', 0.16),
    ref('--ds-color-info-dark'),
    ref('--ds-color-info-light'),
  ),
  'variant:success': softLabel(
    alpha('--ds-channel-success-main', 0.16),
    ref('--ds-color-success-dark'),
    ref('--ds-color-success-light'),
  ),
  'variant:warning': softLabel(
    alpha('--ds-channel-warning-main', 0.16),
    ref('--ds-color-warning-dark'),
    ref('--ds-color-warning-light'),
  ),
  'variant:error': softLabel(
    alpha('--ds-channel-error-main', 0.16),
    ref('--ds-color-error-dark'),
    ref('--ds-color-error-light'),
  ),
};

/**
 * Chip: retângulo arredondado, NÃO pílula — o DS troca os 16px do MUI
 * (metade da altura) por 10px no médio e 8px no pequeno, alinhando o chip aos
 * demais controles. O Astryx tem três tamanhos e o DS dois: `lg` herda a
 * forma do médio.
 */
const token = {
  base: {
    borderRadius: ref('--ds-size-chip-medium-radius'),
    fontSize: ref('--font-size-3xs'),
    fontWeight: ref('--font-weight-medium'),
    paddingInline: ref('--ds-size-chip-medium-label-padding-x'),
    ':focus-visible': focusRing,
  },
  'size:sm': {
    height: ref('--ds-size-chip-small-height'),
    borderRadius: ref('--ds-size-chip-small-radius'),
  },
  'size:md': { height: ref('--ds-size-chip-medium-height') },
};

/**
 * Avatar — deliberadamente SEM override.
 *
 * O DS fixa 40×40px com iniciais de 17,5px porque só existe um tamanho. O
 * Astryx calcula o tamanho da inicial como proporção do diâmetro, em estilo
 * dinâmico (inline) — que um override de tema não venceria, e cuja proporção
 * fixar um valor quebraria. A regra do DS (`rounded` = 12px, base × 1,5)
 * também não tem onde entrar: o Avatar do Astryx não expõe eixo de forma.
 * O valor segue publicado como `--ds-radius-avatar` para quem precisar.
 */

/* ========================================================================== *
 * ALERT — `componentes/alert-e-snackbar.md`
 *
 * O Astryx chama de `Banner` o alerta embutido na página.
 *
 * A variante `standard` (a default) INVERTE por esquema, e é o que dá a
 * identidade do alerta no DS:
 *   claro  → texto `.darker` sobre fundo `.lighter`
 *   escuro → texto `.lighter` sobre fundo `.darker`
 *
 * O fundo já sai certo do tema (`--color-<status>-muted` é essa tupla). O que
 * falta é a COR DO TEXTO: o Banner escreve título em `text.primary` e
 * descrição em `text.secondary`; no DS os dois assumem o tom da severidade.
 * Por isso o override pinta `color` no container e deixa o texto herdar.
 *
 * `info` é o caso especial: o Astryx trata info como "acento" (verde da
 * marca); o DS tem família `info` própria (ciano).
 * ========================================================================== */

const bannerStatus = (bg: string, fg: string) => ({
  backgroundColor: bg,
  color: fg,
});

const banner = {
  base: {
    borderRadius: ref('--radius-element'),
    // O alerta do DS herda `Paper elevation: 0` — nenhuma sombra.
    boxShadow: 'none',
  },
  'status:info': bannerStatus(
    scheme(ref('--ds-color-info-lighter'), ref('--ds-color-info-darker')),
    scheme(ref('--ds-color-info-darker'), ref('--ds-color-info-lighter')),
  ),
  'status:success': bannerStatus(
    scheme(ref('--ds-color-success-lighter'), ref('--ds-color-success-darker')),
    scheme(ref('--ds-color-success-darker'), ref('--ds-color-success-lighter')),
  ),
  'status:warning': bannerStatus(
    scheme(ref('--ds-color-warning-lighter'), ref('--ds-color-warning-darker')),
    scheme(ref('--ds-color-warning-darker'), ref('--ds-color-warning-lighter')),
  ),
  'status:error': bannerStatus(
    scheme(ref('--ds-color-error-lighter'), ref('--ds-color-error-darker')),
    scheme(ref('--ds-color-error-darker'), ref('--ds-color-error-lighter')),
  ),
};

/**
 * O ícone do alerta é o único elemento que NÃO inverte: fica sempre no tom
 * `main` no claro e `light` no escuro (alert-e-snackbar.md §standard).
 */
const bannerIcon = {
  'status:info': {
    color: scheme(ref('--ds-color-info-main'), ref('--ds-color-info-light')),
  },
  'status:success': {
    color: scheme(ref('--ds-color-success-main'), ref('--ds-color-success-light')),
  },
  'status:warning': {
    color: scheme(ref('--ds-color-warning-main'), ref('--ds-color-warning-light')),
  },
  'status:error': {
    color: scheme(ref('--ds-color-error-main'), ref('--ds-color-error-light')),
  },
};

/* ========================================================================== *
 * CAMADAS FLUTUANTES — `componentes/menu-popover-tooltip.md`
 *
 * O DS tem UM só visual de dropdown (`paperStyles({ dropdown: true })`),
 * compartilhado por Popover, Menu, Select e Autocomplete: 4px de padding,
 * raio 10px, `customShadows.dropdown`.
 *
 * O encaixe é proposital: paper com 4px de padding + item com raio 6px dentro
 * de um paper de raio 10px deixa exatamente 4px de moldura em volta.
 *
 * NÃO reproduzido de propósito: o `backdrop-filter: blur(20px)` com dois
 * gradientes SVG em base64 (ciano no topo-direito, coral embaixo-esquerda).
 * São imagens embutidas com cor fixa, fora da paleta e sem token — entram na
 * lista de pendências do relatório em vez de virar hardcode aqui.
 * ========================================================================== */

const dropdownMenu = {
  base: {
    padding: ref('--ds-spacing-0_5'),
    borderRadius: ref('--ds-radius-chip'),
    boxShadow: ref('--ds-shadow-dropdown'),
    backgroundColor: ref('--ds-color-background-paper'),
  },
};

/**
 * Item de menu: compacto (6px/8px contra 6px/16px do MUI) e com raio 6px —
 * a mesma "pílula pequena" do Label e do item de nav horizontal.
 * A seleção é NEUTRA (cinza a 16%), não colorida: o DS troca a base `primary`
 * do MUI por `grey.500`.
 */
const dropdownMenuItem = {
  base: {
    padding: `${ref('--ds-spacing-0_75')} ${ref('--ds-spacing-1')}`,
    borderRadius: ref('--radius-inner'),
    fontSize: ref('--font-size-2xs'),
    ':hover': { backgroundColor: ref('--ds-color-action-hover') },
    ':focus-visible': focusRing,
  },
};

const popover = {
  base: {
    borderRadius: ref('--ds-radius-chip'),
    boxShadow: ref('--ds-shadow-dropdown'),
  },
};

/**
 * Tooltip: o DS troca o cinza translúcido do MUI por cores OPACAS —
 * `grey.800` no claro e `grey.700` no escuro — com texto branco nos dois.
 * O Astryx inverte usando `text.primary`/`background.surface`, o que no
 * escuro daria fundo branco; daí o par explícito.
 */
const tooltip = {
  base: {
    backgroundColor: scheme(ref('--ds-color-grey-800'), ref('--ds-color-grey-700')),
    color: ref('--ds-color-common-white'),
    borderRadius: ref('--radius-element'),
    fontSize: ref('--font-size-4xs'),
    fontWeight: ref('--font-weight-medium'),
  },
};

/* ========================================================================== *
 * TABS — `componentes/tabs-breadcrumbs-pagination.md`
 *
 * Tabs do DS não têm caixa nem fundo: são texto + barra inferior. O indicador
 * usa `currentColor`, e é por isso que a barra é cinza-escuro/branco — nunca
 * verde. `indicatorColor` do MUI fica sem efeito.
 *
 * O espaçamento entre tabs é 100% `gap` (24px, 40px ≥600px): o padding
 * horizontal é zero (`8px 0`).
 * ========================================================================== */

const tab = {
  base: {
    fontSize: ref('--ds-size-button-medium-font-size'),
    fontWeight: ref('--font-weight-medium'),
    color: ref('--ds-color-text-secondary'),
    minWidth: ref('--ds-size-tab-min-width'),
    minHeight: ref('--ds-size-tab-min-height'),
    paddingBlock: ref('--ds-spacing-1'),
    paddingInline: ref('--ds-spacing-0'),
    ':focus-visible': focusRing,
  },
  selected: {
    color: ref('--ds-color-text-primary'),
    fontWeight: ref('--font-weight-semibold'),
  },
};

const tabIndicator = {
  base: { backgroundColor: 'currentColor' },
};

const tabList = {
  base: { gap: ref('--ds-spacing-3') },
};

/* ========================================================================== *
 * DIÁLOGO — `componentes/dialog-e-drawer.md`
 *
 * O Dialog é um cartão flutuante OPACO: raio 16px (mesmo do Card) e a única
 * sombra preta do sistema (`customShadows.dialog`) — todas as outras têm base
 * #919EAB. 24px é o padding canônico de superfície, o mesmo do CardContent.
 * ========================================================================== */

const dialog = {
  base: {
    borderRadius: ref('--radius-container'),
    padding: ref('--ds-spacing-3'),
    boxShadow: ref('--ds-shadow-dialog'),
    backgroundImage: 'none',
  },
  // Tela cheia perde o raio (o cartão vira a própria tela).
  'variant:fullscreen': { borderRadius: ref('--radius-none') },
};

/* ========================================================================== *
 * CONTROLES DE SELEÇÃO — `componentes/checkbox-radio-switch.md`
 *
 * Fidelidade por omissão: o DS documenta `color="default"` marcando em
 * `text.primary`, mas o DEFAULT real desses controles no projeto continua
 * `color="primary"` (a ficha registra que o projeto não altera o default do
 * MUI). Ou seja: caixa marcada é VERDE, que é o que o Astryx já faz.
 * Sobrescrever para `text.primary` reproduziria um caso de uso raro e ainda
 * apagaria o "check" branco no modo escuro. Fica como está, de propósito.
 *
 * O que realmente diverge é o interruptor.
 * ========================================================================== */

const switchTrack = {
  base: {
    // Trilha desligada: cinza a 48% (o Astryx usaria `background.neutral`,
    // que é opaco e some sobre fundo neutro).
    backgroundColor: alpha('--ds-channel-grey-500', 0.48),
    borderRadius: ref('--ds-size-switch-track-radius'),
  },
  disabled: { opacity: ref('--ds-opacity-disabled') },
};

const switchThumb = {
  base: {
    // O polegar é SEMPRE branco no DS, nos dois esquemas — não segue a
    // superfície (que no escuro seria #1C252E e sumiria na trilha).
    backgroundColor: ref('--ds-color-common-white'),
    boxShadow: ref('--ds-elevation-1'),
  },
};

const checkbox = {
  disabled: { opacity: ref('--ds-opacity-disabled') },
};

const radio = {
  disabled: { opacity: ref('--ds-opacity-disabled') },
};

/* ========================================================================== *
 * CARGA / VAZIO
 *
 * Skeleton do DS: `grey.400` a 12%, com raio de superfície grande (o default
 * do projeto é `variant="rounded"` = 16px). `componentes/feedback-e-loading.md`.
 * ========================================================================== */

const skeleton = {
  base: {
    backgroundColor: alpha('--ds-channel-grey-400', 0.12),
    borderRadius: ref('--radius-container'),
  },
};

/**
 * Estado vazio = `EmptyContent filled`: caixa TRACEJADA com fundo a 4% e
 * borda a 8%, raio 16px, texto em `text.disabled` (tabela.md §TableNoData).
 * Mesma linguagem `dashed` das divisórias de tabela.
 */
const emptyState = {
  base: {
    backgroundColor: alpha('--ds-channel-grey-500', 0.04),
    borderWidth: ref('--ds-border-width-thin'),
    borderStyle: 'dashed',
    borderColor: alpha('--ds-channel-grey-500', 0.08),
    borderRadius: ref('--radius-container'),
    color: ref('--ds-color-text-disabled'),
  },
};

/* ========================================================================== *
 * EXPORT
 *
 * A chave é o nome da classe estável do componente (ver cabeçalho). Os nomes
 * saem de `astryx component <Nome>` → seção "Theming" → coluna
 * "Component class", sem o prefixo `astryx-`.
 * ========================================================================== */

export const dsComponentOverrides = {
  heading,
  button,
  'text-input': textInput,
  // `TextArea` e `Selector` compartilham o mesmo wrapper de input do Astryx
  // (`Field/inputStyles.stylex.ts`), então recebem a mesma aparência de campo.
  textarea: textInput,
  selector: textInput,
  'field-label': fieldLabel,
  'field-status': fieldStatus,
  card,
  'table-header-cell': tableHeaderCell,
  'table-cell': tableCell,
  'table-row': tableRow,
  badge,
  token,
  banner,
  'banner-icon': bannerIcon,
  'dropdown-menu': dropdownMenu,
  'dropdown-menu-item': dropdownMenuItem,
  popover,
  tooltip,
  'tab-list': tabList,
  tab,
  'tab-indicator': tabIndicator,
  dialog,
  switch: switchTrack,
  'switch-thumb': switchThumb,
  checkbox,
  radio,
  skeleton,
  'empty-state': emptyState,
} satisfies ComponentStyleMap;

export default dsComponentOverrides;

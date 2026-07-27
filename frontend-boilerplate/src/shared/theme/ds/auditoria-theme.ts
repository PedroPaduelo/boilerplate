/**
 * TEMA AUDITORIA — design system do AuditorIA (MUI/Minimal v7) sobre o Astryx.
 * ============================================================================
 *
 * Este arquivo NÃO contém valores de design. Ele só faz duas coisas:
 *
 *   1. PUBLICA a paleta bruta do DS como tokens `--ds-*`
 *      (vindos de `tokens.generated.ts`, gerado do JSON da auditoria);
 *   2. LIGA os slots do Astryx a esses tokens, por referência (`var(--ds-…)`).
 *
 * Nenhum `#hex`, `px` ou `ms` é digitado aqui. Trocar uma cor = trocar no JSON
 * de origem e rodar `npm run ds:tokens`. É isso que impede o design system de
 * virar hardcode espalhado.
 *
 * ---------------------------------------------------------------------------
 * POR QUE A CAMADA `--ds-*` EXISTE
 * ---------------------------------------------------------------------------
 * O Astryx expõe ~172 slots semânticos; o DS de origem tem tons que não têm
 * slot equivalente — `lighter`/`darker` de cada família, os 10 degraus de
 * cinza, os overlays de ação (#919EAB @ 8/16/24/80%), as 16 `customShadows`.
 *
 * Jogar isso fora empobreceria o sistema (as variantes `soft` do DS dependem
 * de `lighter`/`darker`). Então publicamos a paleta INTEIRA e mapeamos o
 * Astryx em cima dela. Uma cor, uma fonte da verdade, dois consumidores.
 *
 * ---------------------------------------------------------------------------
 * LIGHT E DARK
 * ---------------------------------------------------------------------------
 * Todo token que muda por esquema é uma tupla `[claro, escuro]` — o Astryx
 * compila para `light-dark()`. Os dois esquemas vêm da auditoria (§5 de
 * `01-cores.md`), não de inferência: no DS as famílias semânticas são
 * IDÊNTICAS nos dois modos; o que muda é texto, fundo e o que deriva de
 * opacidade — e a base da escala de sombras (#919EAB no claro, #000 no escuro).
 */

import { defineTheme } from '@astryxdesign/core/theme';

import { dsComponentOverrides } from './component-overrides';
import {
  duo,
  dsColorTokens,
  dsFontFamilies,
  dsFontWeights,
  dsLayoutTokens,
  dsMotion,
  dsOpacityTokens,
  dsRadius,
  dsShadowTokens,
  dsSizeTokens,
  dsSpacingTokens,
  dsTypography,
} from './tokens.generated';

/* ========================================================================== *
 * Helpers — referência a token e composição de transparência
 * ========================================================================== */

/** Referência CSS a um token do DS. */
const ref = (token: string) => `var(${token})`;

/**
 * Overlay do DS: `rgba(<canal> / <alfa>)`.
 *
 * É como o design de origem compõe TODA transparência (`varAlpha`): guarda a
 * cor como trio RGB sem função (`0 167 111`) e injeta o alfa na hora. Por isso
 * o gerador publica os `--ds-channel-*` junto com os `--ds-color-*`.
 */
const alpha = (channelToken: string, a: number) => `rgba(var(${channelToken}) / ${a})`;

/** px numérico → string CSS. */
const px = (n: number) => `${n}px`;

/* ========================================================================== *
 * Tipografia — 13 variantes do DS nos slots de texto do Astryx
 *
 * Mapa 1:1 com a origem. Vale registrar o PAPEL de cada nível no DS, porque
 * não é o convencional (levantamento de uso real em `02-tipografia.md` §5):
 *
 *   h4  → título principal de PÁGINA   (75 usos)
 *   h6  → título de CARD               (111 usos; default do CardHeader)
 *   h5  → título de seção              (32 usos)
 *   h1/h2 → só telas de erro e páginas institucionais (6 e 11 usos)
 *
 * Ou seja: numa tela de dashboard o título é `level={4}`, não `level={1}`.
 * A UI é de alta densidade — body2 (12,25px) é o texto dominante.
 *
 * (A troca de família por nível — Barlow só em h1–h3 — é um override de
 * COMPONENTE e vive em `component-overrides.ts`.)
 * ========================================================================== */

/** Escala de tamanho — os 12 degraus do Astryx preenchidos com a escala do DS. */
const fontSizeScale = {
  '--font-size-4xs': px(dsTypography.caption.size), // 10,5 — caption, overline, Label
  '--font-size-3xs': dsSizeTokens['--ds-size-button-small-font-size'], // 11,375 — chip, botão sm
  '--font-size-2xs': px(dsTypography.body2.size), // 12,25 — body2/subtitle2/button ← dominante
  '--font-size-xs': dsSizeTokens['--ds-size-button-large-font-size'], // 13,125 — campo, botão lg
  '--font-size-sm': px(dsTypography.body1.size), // 14 — body1, subtitle1, thead
  '--font-size-base': px(dsTypography.h6.size), // 15,75 — h6
  '--font-size-lg': px(dsTypography.h5.size), // 16,625 — h5
  '--font-size-xl': px(dsTypography.h4.size), // 21 — h4
  '--font-size-2xl': px(dsTypography.h3.size), // 28 — h3
  '--font-size-3xl': px(dsTypography.h2.size), // 35 — h2 base
  '--font-size-4xl': px(dsTypography.h1.size), // 42 — h1 base / h2 lg
  '--font-size-5xl': px(dsTypography.h1.responsive?.lg?.size ?? dsTypography.h1.size), // 56
};

/** Um trio `size/weight/leading` a partir de uma variante do DS. */
const textSlot = (slot: string, variant: keyof typeof dsTypography) => {
  const v = dsTypography[variant];
  return {
    [`--text-${slot}-size`]: px(v.size),
    [`--text-${slot}-weight`]: v.weight,
    [`--text-${slot}-leading`]: String(v.lineHeight),
  };
};

const typographyTokens = {
  ...fontSizeScale,

  '--font-family-body': dsFontFamilies.primary, // Public Sans Variable
  '--font-family-heading': dsFontFamilies.secondary, // Barlow (só h1–h3)
  '--font-family-code': dsFontFamilies.primary,

  '--font-weight-light': dsFontWeights.light,
  '--font-weight-normal': dsFontWeights.regular,
  '--font-weight-medium': dsFontWeights.medium,
  '--font-weight-semibold': dsFontWeights.semiBold, // extensão do DS (600)
  '--font-weight-bold': dsFontWeights.bold,
  '--font-weight-extrabold': dsFontWeights.extraBold, // h1/h2

  // Títulos — 1:1 com h1..h6
  ...textSlot('heading-1', 'h1'),
  ...textSlot('heading-2', 'h2'),
  ...textSlot('heading-3', 'h3'),
  ...textSlot('heading-4', 'h4'),
  ...textSlot('heading-5', 'h5'),
  ...textSlot('heading-6', 'h6'),

  // Corpo e auxiliares
  ...textSlot('body', 'body1'), // 14 / 400
  ...textSlot('supporting', 'body2'), // 12,25 / 400 ← texto dominante da UI
  ...textSlot('label', 'subtitle2'), // 12,25 / 600
  ...textSlot('large', 'subtitle1'), // 14 / 600
  ...textSlot('code', 'body2'),

  // Display — o DS não tem "display"; reaproveita os títulos maiores
  ...textSlot('display-1', 'h1'),
  ...textSlot('display-2', 'h2'),
  ...textSlot('display-3', 'h3'),
};

/* ========================================================================== *
 * Cor — slots do Astryx ligados à paleta do DS
 * ========================================================================== */

const colorTokens = {
  /* --- Acento: a primária verde do DS ----------------------------------- */
  // Semânticas são idênticas nos dois esquemas (fato da auditoria).
  '--color-accent': ref('--ds-color-primary-main'),
  '--color-on-accent': ref('--ds-color-primary-contrast-text'),
  // Texto colorido segue a regra do DS: `.dark` no claro, `.light` no escuro.
  '--color-text-accent': duo(
    ref('--ds-color-primary-main'),
    ref('--ds-color-primary-light'),
  ),
  '--color-icon-accent': duo(
    ref('--ds-color-primary-main'),
    ref('--ds-color-primary-light'),
  ),
  // Fundo suave do acento = o `soft` do DS: canal da main a 16%.
  '--color-accent-muted': alpha('--ds-channel-primary-main', 0.16),

  /* --- Superfícies ------------------------------------------------------- */
  '--color-background-body': ref('--ds-color-background-default'),
  '--color-background-card': ref('--ds-color-background-paper'),
  '--color-background-popover': ref('--ds-color-background-paper'),
  '--color-background-surface': ref('--ds-color-background-paper'),
  '--color-background-muted': ref('--ds-color-background-neutral'),

  /* --- Texto ------------------------------------------------------------- */
  '--color-text-primary': ref('--ds-color-text-primary'),
  '--color-text-secondary': ref('--ds-color-text-secondary'),
  '--color-text-disabled': ref('--ds-color-text-disabled'),

  /* --- Ícone ------------------------------------------------------------- */
  '--color-icon-primary': ref('--ds-color-text-primary'),
  '--color-icon-secondary': ref('--ds-color-action-active'),
  '--color-icon-disabled': ref('--ds-color-text-disabled'),

  /* --- Bordas ------------------------------------------------------------ */
  '--color-border': ref('--ds-color-divider'),
  '--color-border-emphasized': ref('--ds-color-border-button-outlined-inherit'),

  /* --- Overlays de estado (todos derivam de #919EAB) --------------------- */
  '--color-overlay-hover': ref('--ds-color-action-hover'),
  '--color-overlay-pressed': ref('--ds-color-action-selected'),
  '--color-neutral': ref('--ds-color-action-hover'),

  /* --- Contraste sobre cores cheias -------------------------------------- */
  '--color-on-dark': ref('--ds-color-common-white'),
  '--color-on-light': ref('--ds-color-grey-800'),
  '--color-on-success': ref('--ds-color-success-contrast-text'),
  '--color-on-error': ref('--ds-color-error-contrast-text'),
  // No DS o texto sobre âmbar é ESCURO (#1C252E), não branco.
  '--color-on-warning': ref('--ds-color-warning-contrast-text'),

  /* --- Efeitos ----------------------------------------------------------- */
  '--color-skeleton': ref('--ds-color-grey-400'),
  '--color-tint-hover': duo(
    ref('--ds-color-common-black'),
    ref('--ds-color-common-white'),
  ),
};

/* ========================================================================== *
 * Status — segue o padrão de Alert `standard` do DS:
 *
 *   claro : texto `.darker` sobre fundo `.lighter`
 *   escuro: texto `.lighter` sobre fundo `.darker`   (INVERTE)
 *
 * (`01-cores.md` §5). É o mesmo par que o Astryx espera em
 * `--color-X` (texto/ícone) + `--color-X-muted` (fundo).
 * ========================================================================== */

const statusPair = (family: 'success' | 'warning' | 'error' | 'info') => ({
  [`--color-${family}`]: duo(
    ref(`--ds-color-${family}-darker`),
    ref(`--ds-color-${family}-lighter`),
  ),
  [`--color-${family}-muted`]: duo(
    ref(`--ds-color-${family}-lighter`),
    ref(`--ds-color-${family}-darker`),
  ),
});

const statusTokens = {
  ...statusPair('success'),
  ...statusPair('warning'),
  ...statusPair('error'),
};

/* ========================================================================== *
 * Categóricos — o Astryx tem 10 famílias de matiz (red…gray) usadas por
 * Badge, Banner e afins. O DS não tem paleta categórica de 10; tem 6 famílias
 * semânticas + cinza. Mapeamos cada matiz do Astryx para a família do DS de
 * matiz correspondente, para que TODO componente do DS continue funcionando
 * dentro da paleta — sem inventar cor nova.
 *
 *   red/pink → error (coral #FF5630)    orange/yellow → warning (âmbar)
 *   green    → success                  teal          → primary (verde-teal)
 *   cyan/blue→ info (ciano)             purple        → secondary (roxo)
 *   gray     → escala de cinza
 * ========================================================================== */

const HUE_TO_FAMILY = {
  red: 'error',
  pink: 'error',
  orange: 'warning',
  yellow: 'warning',
  green: 'success',
  teal: 'primary',
  cyan: 'info',
  blue: 'info',
  purple: 'secondary',
} as const;

const categoricalTokens = Object.entries(HUE_TO_FAMILY).reduce<Record<string, unknown>>(
  (acc, [hue, family]) => {
    acc[`--color-background-${hue}`] = duo(
      ref(`--ds-color-${family}-lighter`),
      ref(`--ds-color-${family}-darker`),
    );
    acc[`--color-border-${hue}`] = duo(
      ref(`--ds-color-${family}-light`),
      ref(`--ds-color-${family}-dark`),
    );
    acc[`--color-icon-${hue}`] = duo(
      ref(`--ds-color-${family}-dark`),
      ref(`--ds-color-${family}-light`),
    );
    acc[`--color-text-${hue}`] = duo(
      ref(`--ds-color-${family}-darker`),
      ref(`--ds-color-${family}-lighter`),
    );
    return acc;
  },
  {
    // Cinza: usa a escala neutra, não uma família semântica.
    '--color-background-gray': ref('--ds-color-background-neutral'),
    '--color-border-gray': ref('--ds-color-divider'),
    '--color-icon-gray': ref('--ds-color-text-secondary'),
    '--color-text-gray': ref('--ds-color-text-primary'),
  },
);

/* ========================================================================== *
 * Elevação — o DS não usa sombra preta: a escala inteira tem base #919EAB
 * (grey.500) no claro. São sombras FRIAS. Só `dialog` usa preto nos dois modos.
 * ========================================================================== */

const shadowTokens = {
  '--color-shadow': alpha('--ds-channel-grey-500', 0.16),
  '--shadow-low': ref('--ds-shadow-z1'),
  '--shadow-med': ref('--ds-shadow-card'),
  '--shadow-high': ref('--ds-shadow-dropdown'),
  // Anel de foco/seleção com o acento do DS.
  '--shadow-inset-hover': `inset 0 0 0 2px ${alpha('--ds-channel-primary-main', 0.24)}`,
  '--shadow-inset-selected': `inset 0 0 0 2px ${alpha('--ds-channel-primary-main', 0.48)}`,
  '--shadow-inset-success': `inset 0 0 0 2px ${alpha('--ds-channel-success-main', 0.24)}`,
  '--shadow-inset-warning': `inset 0 0 0 2px ${alpha('--ds-channel-warning-main', 0.24)}`,
  '--shadow-inset-error': `inset 0 0 0 2px ${alpha('--ds-channel-error-main', 0.24)}`,
};

/* ========================================================================== *
 * Foco visível — o único bloco deste arquivo que NÃO vem da auditoria.
 *
 * O DS de origem não tem `:focus-visible` em lugar nenhum: zero ocorrências
 * em `src/theme/**` (`99-inconsistencias.md` §5). Quem navega por teclado
 * depende do overlay de 24% do MUI, que é de baixo contraste em fundo claro —
 * falha de WCAG 2.4.7, listada lá como "precisa de decisão humana".
 *
 * A decisão tomada aqui: existe anel, e ele é feito com o que o DS JÁ tem —
 * a cor de acento e o menor degrau da escala de espaçamento (2px). Nenhum
 * número novo entra no sistema. Se a auditoria oficializar tokens de foco,
 * estes três aliases passam a apontar para eles sem tocar nos componentes.
 * ========================================================================== */

const focusTokens = {
  '--ds-focus-ring-width': dsSpacingTokens['--ds-spacing-0_25'], // 2px
  '--ds-focus-ring-offset': dsSpacingTokens['--ds-spacing-0_25'], // 2px
  '--ds-focus-ring-color': ref('--color-accent'),
};

/* ========================================================================== *
 * Forma — base 8px (o DS sobrescreve o 4px da lib de origem) e os
 * multiplicadores realmente usados: ×0.75=6, ×1=8, ×1.25=10, ×1.5=12, ×2=16.
 * ========================================================================== */

const radiusTokens = {
  '--radius-none': '0px',
  '--radius-inner': dsRadius.multipliers['0.75'], // 6 — item de menu, Label
  '--radius-element': px(dsRadius.base), // 8 — botão, campo, chip sm
  '--radius-container': dsRadius.multipliers['2'], // 16 — Card, Dialog
  '--radius-page': dsRadius.multipliers['2'], // 16
  '--radius-full': '9999px',
  // Degraus intermediários do DS, sem slot próprio no Astryx.
  '--ds-radius-chip': dsRadius.multipliers['1.25'], // 10 — chip md, dropdown
  '--ds-radius-avatar': dsRadius.multipliers['1.5'], // 12 — avatar, popper
};

/* ========================================================================== *
 * Motion — durações e easings da lib de origem (o DS não os sobrescreve).
 * ========================================================================== */

const motionTokens = {
  '--duration-fast-min': dsMotion.duration.shortest, // 150
  '--duration-fast': dsMotion.duration.shorter, // 200
  '--duration-fast-max': dsMotion.duration.short, // 250
  '--duration-medium-min': dsMotion.duration.enteringScreen, // 225
  '--duration-medium': dsMotion.duration.standard, // 300
  '--duration-medium-max': dsMotion.duration.complex, // 375
  '--duration-slow-min': dsMotion.duration.complex,
  '--duration-slow': dsMotion.duration.complex,
  '--duration-slow-max': dsMotion.duration.complex,

  '--ds-easing-in-out': dsMotion.easing.easeInOut,
  '--ds-easing-out': dsMotion.easing.easeOut,
  '--ds-easing-in': dsMotion.easing.easeIn,
  '--ds-easing-sharp': dsMotion.easing.sharp,
  // Transição do chrome (sidebar abrindo/fechando): 120ms linear.
  '--ds-layout-transition-duration': dsMotion.layout.duration,
  '--ds-layout-transition-easing': dsMotion.layout.easing,
};

/* ========================================================================== *
 * TEMA
 * ========================================================================== */

export const auditoriaTheme = defineTheme({
  name: 'auditoria',

  tokens: {
    // 1) paleta bruta do DS (fonte da verdade)
    ...dsColorTokens,
    ...dsShadowTokens,
    ...dsLayoutTokens,
    ...dsSizeTokens,
    ...dsSpacingTokens,
    ...dsOpacityTokens,

    // 2) slots do Astryx apontando para ela
    ...colorTokens,
    ...statusTokens,
    ...categoricalTokens,
    ...shadowTokens,
    ...focusTokens,
    ...radiusTokens,
    ...motionTokens,
    ...typographyTokens,
  },

  /**
   * Overrides de COMPONENTE — onde o Astryx desenha diferente do DS.
   *
   * Ficam em `component-overrides.ts` porque são de outra natureza: aqui é
   * ligação de token (uma cor, um nome); lá é decisão de desenho (alturas de
   * botão, borda de foco do campo, cabeçalho de tabela). Separados, cada
   * arquivo tem uma razão para mudar.
   */
  components: dsComponentOverrides,
});

export default auditoriaTheme;

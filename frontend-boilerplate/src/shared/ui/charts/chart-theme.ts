/**
 * CHART THEME — a ESPECIFICAÇÃO VISUAL ÚNICA dos gráficos do catálogo.
 * ============================================================================
 *
 * Equivalente ao `useChart()` do sistema de origem: a configuração que TODO
 * gráfico herda. Nenhum gráfico declara cor, espessura, raio, tamanho de fonte
 * ou duração de animação por conta própria — tudo sai daqui.
 *
 * Fonte da verdade: `uploads/graficos-ref/graficos/` (referência de design dos
 * gráficos do AuditorIA), arquivos `01-fundamentos.md` §2–§8,
 * `02-configuracao-base.md` §2–§11 e `05-tooltip-legenda-css.md`.
 *
 * ---------------------------------------------------------------------------
 * COR: TOKEN, NUNCA HEX
 * ---------------------------------------------------------------------------
 * A referência publica as 9 cores de série em hexadecimal. Todas as nove JÁ
 * existem no tema (`--ds-color-*`, geradas da mesma auditoria), então aqui
 * guardamos o NOME DO TOKEN e a resolução acontece em runtime contra o tema
 * ativo (`use-chart-palette`). Consequência prática: o valor bate 1:1 com a
 * referência no modo claro e adapta sozinho no escuro — o que a referência não
 * cobre, mas o produto precisa.
 *
 *   referência   token do DS                 valor (claro)
 *   #00A76F      --ds-color-primary-main     #00A76F   verde (principal)
 *   #FFAB00      --ds-color-warning-main     #FFAB00   âmbar
 *   #00B8D9      --ds-color-info-main        #00B8D9   ciano
 *   #FF5630      --ds-color-error-main       #FF5630   vermelho
 *   #22C55E      --ds-color-success-main     #22C55E   verde folha
 *   #B76E00      --ds-color-warning-dark     #B76E00   âmbar escuro
 *   #065E49      --ds-color-success-darker   #065E49   verde profundo
 *   #006C9C      --ds-color-info-dark        #006C9C   azul petróleo
 *   #003768      --ds-color-info-darker      #003768   azul noite
 *
 * ---------------------------------------------------------------------------
 * MÉTRICA: CONSTANTE DE ESPECIFICAÇÃO, CONCENTRADA
 * ---------------------------------------------------------------------------
 * Espessura de linha (2,5px), raio de coluna (4px), tracejado da grade (3),
 * 12px do rótulo de eixo: são MEDIDAS DO DESENHO, não espaçamento de layout —
 * o DS não tem slot para elas e o recharts só aceita número. Ficam aqui, com a
 * seção da referência ao lado, e em lugar nenhum mais. "Zero hardcode" quer
 * dizer exatamente isto: um arquivo com os números, o resto consumindo.
 */

/* ========================================================================== *
 * 1. CORES DE SÉRIE
 * ========================================================================== */

/**
 * As 9 cores de série NA ORDEM da referência (`01-fundamentos.md` §2). A 1ª
 * série recebe a 1ª cor — a ordem é parte da identidade visual.
 */
export const CHART_SERIES_COLORS = [
  'emerald', // 1 · #00A76F · verde (cor principal do produto)
  'amber', //   2 · #FFAB00 · âmbar
  'cyan', //    3 · #00B8D9 · ciano
  'red', //     4 · #FF5630 · vermelho
  'green', //   5 · #22C55E · verde folha
  'bronze', //  6 · #B76E00 · âmbar escuro
  'forest', //  7 · #065E49 · verde profundo
  'steel', //   8 · #006C9C · azul petróleo
  'navy', //    9 · #003768 · azul noite
] as const;

/** Cor de série do ciclo padrão. */
export type ChartCycleColor = (typeof CHART_SERIES_COLORS)[number];

/**
 * Cores aceitas FORA do ciclo. Duas origens:
 *  - `purple`/`lilac`: os medidores radiais da referência (§11–§12), únicos
 *    lugares onde o roxo aparece;
 *  - os nomes do vocabulário ANTIGO (`blue`, `orange`, `pink`, `teal`,
 *    `brown`, `indigo`, `gray`), mantidos porque `accent` é contrato com o
 *    backend e com o agente: um painel salvo não pode perder a cor.
 */
export const CHART_ALIAS_COLORS = [
  'purple',
  'lilac',
  'blue',
  'orange',
  'yellow',
  'pink',
  'teal',
  'brown',
  'indigo',
  'gray',
] as const;

/** Nome de cor aceito por uma série/ponto. */
export type ChartSeriesColor = ChartCycleColor | (typeof CHART_ALIAS_COLORS)[number];

/** Nome do token do DS de cada cor — a ÚNICA tabela de cor do data-viz. */
const SERIES_TOKEN: Record<ChartSeriesColor, string> = {
  // --- ciclo (ordem da referência) ---
  emerald: '--ds-color-primary-main', //    #00A76F
  amber: '--ds-color-warning-main', //      #FFAB00
  cyan: '--ds-color-info-main', //          #00B8D9
  red: '--ds-color-error-main', //          #FF5630
  green: '--ds-color-success-main', //      #22C55E
  bronze: '--ds-color-warning-dark', //     #B76E00
  forest: '--ds-color-success-darker', //   #065E49
  steel: '--ds-color-info-dark', //         #006C9C
  navy: '--ds-color-info-darker', //        #003768
  // --- fora do ciclo: medidores radiais (§11–§12 da referência) ---
  purple: '--ds-color-secondary-main', //   #8E33FF
  lilac: '--ds-color-secondary-light', //   #C684FF
  // --- aliases do vocabulário antigo, pelo matiz mais próximo ---
  blue: '--ds-color-info-dark', //          azul petróleo
  orange: '--ds-color-warning-main', //     âmbar
  yellow: '--ds-color-warning-light', //    âmbar claro
  pink: '--ds-color-error-main', //         vermelho
  teal: '--ds-color-success-darker', //     verde profundo
  brown: '--ds-color-warning-dark', //      âmbar escuro
  indigo: '--ds-color-info-darker', //      azul noite
  gray: '--ds-color-grey-500', //           cinza da interface
};

/** Todos os nomes de cor aceitos (ciclo + fora do ciclo + aliases). */
export const CHART_COLOR_NAMES = Object.keys(SERIES_TOKEN) as ChartSeriesColor[];

/** O valor é um nome de cor de série reconhecido? */
export function isChartSeriesColor(value: unknown): value is ChartSeriesColor {
  return typeof value === 'string' && value in SERIES_TOKEN;
}

/** Token do DS de uma cor de série. */
export function chartSeriesToken(color: ChartSeriesColor): string {
  return SERIES_TOKEN[color];
}

/** Token da cor da série `index` do ciclo (`override` fixa a cor). */
export function chartSeriesTokenAt(index: number, override?: ChartSeriesColor): string {
  if (override && isChartSeriesColor(override)) return SERIES_TOKEN[override];
  const safe = Math.abs(Math.trunc(index || 0)) % CHART_SERIES_COLORS.length;
  return SERIES_TOKEN[CHART_SERIES_COLORS[safe]];
}

/* ========================================================================== *
 * 2. RAMPAS SEQUENCIAIS (escalas ordenadas — mapa de calor, densidade)
 * ========================================================================== */

/** Famílias com rampa de 5 passos (lighter → darker) no DS. */
export const CHART_RAMP_COLORS = [
  'emerald',
  'amber',
  'cyan',
  'red',
  'green',
  'purple',
  'gray',
  // aliases legados aceitos por retrocompatibilidade
  'blue',
  'shamrock',
  'orange',
  'pink',
  'teal',
  'yellow',
] as const;

/** Rampa sequencial disponível. */
export type ChartRampColor = (typeof CHART_RAMP_COLORS)[number];

/** Passos de uma rampa (1 = mais claro, 5 = mais escuro). */
export const RAMP_STEPS = [1, 2, 3, 4, 5] as const;

/** Rampa → família do DS. */
const RAMP_FAMILY: Record<ChartRampColor, string> = {
  emerald: 'primary',
  shamrock: 'primary',
  teal: 'primary',
  amber: 'warning',
  orange: 'warning',
  yellow: 'warning',
  cyan: 'info',
  blue: 'info',
  red: 'error',
  pink: 'error',
  green: 'success',
  purple: 'secondary',
  gray: 'grey',
};

/** Tons do DS na ordem claro → escuro (a rampa de 5 passos). */
const RAMP_TONES = ['lighter', 'light', 'main', 'dark', 'darker'] as const;

/** Degraus da escala de cinza usados quando a rampa é `gray`. */
const GREY_STEPS = ['200', '300', '400', '600', '800'] as const;

/** Token de um passo da rampa sequencial (1..5). */
export function chartRampToken(color: ChartRampColor, step: number): string {
  const family = RAMP_FAMILY[color] ?? 'primary';
  const index = Math.min(Math.max(Math.trunc(step), 1), RAMP_STEPS.length) - 1;
  return family === 'grey'
    ? `--ds-color-grey-${GREY_STEPS[index]}`
    : `--ds-color-${family}-${RAMP_TONES[index]}`;
}

/* ========================================================================== *
 * 3. CHROME — tudo que NÃO é dado (grade, eixo, rótulo, trilho, superfície)
 * ========================================================================== */

/**
 * Papel do chrome → token do DS. Os valores da referência
 * (`01-fundamentos.md` §3) batem 1:1 com estes tokens no modo claro:
 *
 *   grid            rgba(145,158,171,0.2)   --ds-color-divider
 *   axis            #919EAB                 --ds-color-text-disabled
 *   label           #637381                 --ds-color-text-secondary
 *   emphasis        #1C252E                 --ds-color-text-primary
 *   surface         #FFFFFF                 --ds-color-background-paper
 *   tooltipTitle    #F4F6F8                 --ds-color-background-neutral
 *   track           rgba(145,158,171,0.16)  --ds-color-action-selected
 *   trackLight      rgba(145,158,171,0.08)  --ds-color-action-hover
 *   markerStroke    #FFFFFF                 --ds-color-background-paper
 */
export const CHART_CHROME_TOKENS = {
  /** Linha da grade horizontal. */
  grid: '--ds-color-divider',
  /** Texto dos eixos (X e Y). */
  axis: '--ds-color-text-disabled',
  /** Rótulo/legenda secundária. */
  label: '--ds-color-text-secondary',
  /** Texto principal (valor central, tooltip). */
  emphasis: '--ds-color-text-primary',
  /** Superfície do card/tooltip. */
  surface: '--ds-color-background-paper',
  /** Faixa do título do tooltip. */
  tooltipTitle: '--ds-color-background-neutral',
  /** Trilha de medidor radial (16%). */
  track: '--ds-color-action-selected',
  /** Trilha alternativa, mais clara (8%). */
  trackLight: '--ds-color-action-hover',
  /** Contorno do marcador de linha. */
  markerStroke: '--ds-color-background-paper',
  /** Borda de controle (seletor de período). */
  controlBorder: '--ds-color-action-focus',
  /** Série neutra / sem categoria. */
  neutral: '--ds-color-grey-500',
  /** Destaque (acento do produto). */
  accent: '--ds-color-primary-main',
  /** Sinal positivo. */
  positive: '--ds-color-success-main',
  /** Sinal de atenção. */
  warning: '--ds-color-warning-main',
  /** Sinal negativo. */
  negative: '--ds-color-error-main',
  /** Verde escuro a 80% — a cor mais usada do catálogo da referência. */
  primaryDark: '--ds-color-primary-dark',
} as const;

/** Papel de chrome de um gráfico. */
export type ChartChromeRole = keyof typeof CHART_CHROME_TOKENS;

/* ========================================================================== *
 * 4. GEOMETRIA — `02-configuracao-base.md` §6, §7, §10, §11
 * ========================================================================== */

export const CHART_GEOMETRY = {
  /** Espessura da linha (px). §6 */
  lineWidth: 2.5,
  /** Espessura da linha em mini-gráficos (spark). */
  sparkLineWidth: 2,
  /** Curva padrão: suave. §6 */
  curve: 'monotone',
  /** Ponta da linha arredondada. §6 */
  lineCap: 'round',
  /** Marcadores invisíveis por padrão. §6 */
  markerSize: 0,
  /** Marcador dos tipos que o exibem (linha, dispersão). §1/§15 */
  markerVisibleSize: 6,
  /** Contorno do marcador visível (px). §1 */
  markerStrokeWidth: 3,
  /** Raio da coluna — SÓ no topo. §10 */
  barRadius: 4,
  /** Raio da barra horizontal / coluna negativa. §7/§8 */
  barRadiusFlat: 2,
  /** Largura da coluna (fração da faixa). §10 */
  barWidth: 0.48,
  /** Largura da coluna SIMPLES — o §4 estreita para 40%. */
  barWidthSingle: 0.4,
  /** Largura da coluna EMPILHADA — o §6 estreita para 36%. */
  barWidthStacked: 0.36,
  /**
   * TETO ABSOLUTO da coluna, em px.
   *
   * A referência define a espessura como FRAÇÃO da faixa (48/40/36%), e fração
   * não tem teto: a mesma regra que dá 21px num card de 330px dá 118px num
   * painel de 1.500px com cinco categorias — a coluna deixa de ser uma marca de
   * medida e vira um bloco de cor. Todo sistema de data-viz sério limita a
   * espessura em pixel por isso.
   *
   * 32px é a espessura que a própria referência produz no `demo.html` (fração
   * aplicada à largura em que os 18 tipos foram desenhados), então o teto não
   * inventa uma medida nova: ele PRESERVA a da referência quando o contêiner
   * cresce além dela. Múltiplo de 8 na escala de 4px do tema.
   */
  barMaxWidth: 32,
  /** TETO ABSOLUTO da barra horizontal, em px — mesmo raciocínio de `barMaxWidth`. */
  hBarMaxWidth: 24,
  /**
   * Respiro entre colunas vizinhas do mesmo grupo (px). No original é um traço
   * de 2px TRANSPARENTE (§5); no recharts, `barGap`.
   */
  barGroupGap: 2,
  /** Altura da barra horizontal (fração da faixa). §8 */
  hBarWidth: 0.3,
  /** Traço das colunas/barras: a referência zera em §4, §6 e §8. */
  barStrokeWidth: 0,
  /** Tracejado da grade. §7 */
  gridDash: '3 3',
  /** Grade vertical desligada. §7 */
  gridVertical: false,
  /** Divisões do eixo Y. §7 */
  yTickCount: 5,
  /** Furo da rosca (fração do raio). §10 */
  donutHole: 0.72,
  /** Furo da barra radial. §11 */
  radialHole: 0.32,
  /** Espessura da trilha do medidor (fração). §base */
  trackWidth: 0.5,
  /** Raio do contêiner do gráfico (px). §7 */
  containerRadius: 12,
  /** Raio do card que envolve o gráfico (px). §05-4 */
  cardRadius: 16,
  /** Raio do tooltip (px). §05-1 */
  tooltipRadius: 10,
  /** Largura mínima do tooltip (px). §05-1 */
  tooltipMinWidth: 80,
  /** Desfoque do tooltip. §05-1 */
  tooltipBlur: 6,

  /* --- Preenchimento (§5) ------------------------------------------------ */
  /** Gradiente vertical da área: 0.4 no topo → 0 na base, paradas 0 e 100. */
  areaGradient: { opacityFrom: 0.4, opacityTo: 0, from: '0%', to: '100%' },
  /**
   * Área de CONTEXTO sob a linha (§1 não pede preenchimento, mas o catálogo
   * expõe `area` como prop): bem discreta, para não competir com o traço.
   */
  areaContextOpacity: 0.12,

  /* --- Medidores (§12, §13) ---------------------------------------------- */
  /** Tracejado da barra de valor do medidor tracejado (§13). */
  gaugeDash: 4,

  /* --- Mini-gráfico / sparkline (§04-2.3, §04-2.4) ----------------------- */
  /** Raio da coluna do mini-gráfico de card de resumo. */
  sparkBarRadius: 1.5,
  /** Largura da coluna do mini-gráfico (fração da faixa). */
  sparkBarWidth: 0.64,
  /** Contorno do marcador no mini-gráfico: zero. */
  sparkMarkerStrokeWidth: 0,

  /* --- Dispersão (§15) ---------------------------------------------------- */
  /** Divisões do eixo X da dispersão (o Y segue `yTickCount`). */
  scatterXTickCount: 8,
  /** Casas decimais do rótulo do eixo X da dispersão. */
  scatterAxisDecimals: 1,
} as const;

/**
 * Margem da área de plotagem, em unidades do SVG. Espelha o padding
 * assimétrico da referência (`05-tooltip-legenda-css.md` §4): 8px à esquerda
 * porque o eixo Y já ocupa espaço ali, 20px nos demais lados.
 */
export const CHART_MARGIN = { top: 20, right: 20, bottom: 0, left: 0 } as const;

/** Margem de mini-gráfico (`sparkline`): 6px em todos os lados. §04-2.3 */
export const CHART_SPARK_MARGIN = { top: 6, right: 6, bottom: 6, left: 6 } as const;

/**
 * Margem ZERO — o modo `sparkline` dos circulares (pizza, rosca, medidores)
 * remove eixos, grade E paddings (`03-tipos-de-grafico.md` §9–§13).
 */
export const CHART_NO_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 } as const;

/** Largura reservada ao eixo Y (rótulos compactos cabem em 44px). */
export const Y_AXIS_WIDTH = 44;

/* ========================================================================== *
 * 5. TIPOGRAFIA — `01-fundamentos.md` §4 (já em PIXELS REAIS)
 * ========================================================================== */

export const CHART_TYPOGRAPHY = {
  /** Rótulos dos eixos. */
  axis: { size: 12, weight: 400 },
  /** Legenda nativa (dentro do gráfico). */
  legend: { size: 13, weight: 500 },
  /** Valor central de rosca/medidor. */
  centerValue: { size: 17.5, weight: 700 },
  /** Rótulo "Total" central. */
  centerTotal: { size: 12.25, weight: 600 },
  /** Rótulo "Total" do medidor semicircular — o §12 o afina para 10,5/400. */
  gaugeTotal: { size: 10.5, weight: 400 },
  /** Legenda própria (fora do gráfico) — rótulo. */
  ownLegend: { size: 11.375, weight: 500 },
  /** Legenda própria — valor. */
  ownLegendValue: { size: 14.875, weight: 600 },
  /** Título do card. §05-4 */
  cardTitle: { size: 15.75, weight: 600 },
  /** Subtítulo do card. §05-4 */
  cardSubtitle: { size: 12.25, weight: 400 },
  /** Rótulo de dado dentro do desenho (pizza, treemap). */
  dataLabel: { size: 12, weight: 600 },
} as const;

/* ========================================================================== *
 * 6. MOVIMENTO — `02-configuracao-base.md` §3
 * ========================================================================== */

export const CHART_MOTION = {
  /** Duração da animação de entrada (ms). */
  duration: 360,
  /** Atraso entre séries (ms) — entrada em cascata. */
  stagger: 120,
  /** Fator de escurecimento no hover (a referência ESCURECE, não clareia). §4 */
  hoverDarken: 0.2,
} as const;

/* ========================================================================== *
 * 7. ALTURAS — `01-fundamentos.md` §7
 * ========================================================================== */

export const CHART_HEIGHT = {
  /** Padrão do catálogo (13 dos 18 tipos). */
  default: 320,
  /** Padrão dos dashboards do produto. */
  dashboard: 350,
  /** Cards de análise. */
  analysis: 364,
  /** Gráficos principais. */
  large: 400,
  /** Circulares (pizza/rosca). */
  circular: 240,
  /** Medidores. */
  gauge: 260,
  /** Barra radial. */
  radial: 320,
  /** Radar. */
  radar: 280,
  /** Dispersão. */
  scatter: 350,
  /** Mini-gráfico de card de resumo. */
  spark: 56,
} as const;

/* ========================================================================== *
 * 8. HOVER — escurecer, não clarear (`02-configuracao-base.md` §4)
 * ========================================================================== */

/**
 * Escurece uma cor para o estado de hover/ativo. A referência é explícita:
 * "a maioria das bibliotecas clareia no hover — precisa inverter".
 *
 * Aceita `#rgb`, `#rrggbb`, `rgb()/rgba()` e `rgba(r g b / a)` (a forma que o
 * DS usa nos overlays). Qualquer outra coisa volta inalterada — melhor não
 * mexer do que inventar uma cor.
 */
export function darkenColor(color: string, amount = CHART_MOTION.hoverDarken): string {
  const rgb = readRgb(color);
  if (!rgb) return color;
  const factor = 1 - Math.min(Math.max(amount, 0), 1);
  const [r, g, b, a] = rgb;
  const scale = (channel: number) => Math.round(Math.max(0, channel * factor));
  return a < 1
    ? `rgba(${scale(r)}, ${scale(g)}, ${scale(b)}, ${a})`
    : `rgb(${scale(r)}, ${scale(g)}, ${scale(b)})`;
}

/** Lê `[r, g, b, a]` de uma cor CSS suportada. `null` quando não reconhece. */
function readRgb(color: string): [number, number, number, number] | null {
  const value = color.trim();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const raw = hex[1];
    const full =
      raw.length === 3
        ? raw
            .split('')
            .map((c) => c + c)
            .join('')
        : raw;
    const n = Number.parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }

  // `rgb(0 167 111 / 0.8)` e `rgba(0, 167, 111, 0.8)`
  const fn = /^rgba?\(([^)]+)\)$/i.exec(value);
  if (fn) {
    const parts = fn[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
      const alpha = parts.length > 3 && Number.isFinite(parts[3]) ? parts[3] : 1;
      return [parts[0], parts[1], parts[2], alpha];
    }
  }

  return null;
}

/**
 * Aplica opacidade a uma cor resolvida do tema. Usado pelo verde escuro a 80%
 * (`rgba(0,120,103,0.8)` — a cor mais recorrente da referência) e pelos
 * preenchimentos de área. Sem reconhecer a cor, devolve-a inalterada.
 */
export function fadeColor(color: string, alpha: number): string {
  const rgb = readRgb(color);
  if (!rgb) return color;
  const [r, g, b] = rgb;
  return `rgba(${r}, ${g}, ${b}, ${Math.min(Math.max(alpha, 0), 1)})`;
}

/** Referência CSS de um token (`var(--x)`) — forma usada no DOM. */
export function chartTokenVar(token: string): string {
  return `var(${token})`;
}

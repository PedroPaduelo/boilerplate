/**
 * COMPONENTE PRÓPRIO — o Astryx não tem medidores. Resolve "onde este valor cai
 * dentro de uma faixa": um arco com trilha, leitura central e limiares de cor.
 *
 * Substitui o `radial-gauge.tsx` legado, que montava o arco com
 * `strokeDasharray` à mão, usava `var(--muted)`/`var(--primary)` do tema antigo
 * e aplicava `drop-shadow` na cor do arco. Aqui o arco é do recharts, a cor sai
 * da paleta do DS e o papel ARIA é `meter` — um medidor tem valor, não é só uma
 * imagem.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT — os TRÊS medidores da referência, um por `variant`
 * ---------------------------------------------------------------------------
 * `semicircle` (padrão) — `03-tipos-de-grafico.md` §12 Medidor semicircular
 *   1. ângulos −90° → +90° (no recharts: 180 → 0);
 *   2. quadro 240×240 (`CHART_HEIGHT.circular`), desenhado BAIXO no quadro — o
 *      `offsetY: 56` da referência;
 *   3. preenchimento em GRADIENTE do par claro/escuro da cor do arco;
 *   4. trilha `rgba(145,158,171,.16)` — `palette.chrome('track')`;
 *   5. valor central 17,5px/700 e rótulo "Total" 10,5px/400 na cor de eixo.
 *
 * `radial` — §11 Barra radial
 *   1. volta completa começando no topo;
 *   2. trilha `rgba(145,158,171,.08)` — `palette.chrome('trackLight')`;
 *   3. gradiente entre o par de cores (claro → escuro, offsets 0 → 100);
 *   4. valor central 15,75px;
 *   5. legenda PRÓPRIA embaixo (`ChartLegends`), nunca a nativa.
 *
 * `dashed` — §13 Medidor tracejado
 *   1. ângulos −135° → +135° (no recharts: 225 → −45);
 *   2. barra de valor PONTILHADA (`dashArray: 4`, ponta reta) — a referência é
 *      explícita: o tracejado é da BARRA, não da trilha;
 *   3. trilha da MESMA espessura da barra, em `trackLight`;
 *   4. rótulo "Total" 12,25px/600 na cor de erro (#FF5630).
 *
 * Comum aos três (`01-fundamentos.md` §9 e §8): modo `sparkline` — sem eixo,
 * sem grade e sem padding —, esqueleto REDONDO e entrada de 360ms.
 *
 * ---------------------------------------------------------------------------
 * ESPESSURA E DIÂMETRO: UM NÚMERO SÓ, PARA OS TRÊS
 * ---------------------------------------------------------------------------
 * Cada layout herdava da sua seção uma FRAÇÃO diferente para o mesmo elemento
 * (furo de 32% na barra radial, trilha de 50% nos outros dois) e um quadro
 * diferente (260 no semicircular, 320 na barra radial). Medido lado a lado no
 * `/catalog`, o anel do medidor saía com 88px contra 34 da rosca e 30 do anel
 * de progresso — e num diâmetro maior que os dois. Não lia como família.
 *
 * Agora os três derivam de `chartRingInnerRadius` (degrau de 24px do tema) e
 * desenham no quadro único dos circulares (`CHART_HEIGHT.circular`). A trilha
 * compartilha o MESMO objeto de geometria do arco de valor — ela muda de cor,
 * nunca de espessura.
 *
 * ---------------------------------------------------------------------------
 * COR
 * ---------------------------------------------------------------------------
 * O par roxo do §12 (e o vermelho do §13) era a cor da REFERÊNCIA, não a do
 * produto: no catálogo inteiro em verde, o medidor era o único bloco roxo. O
 * padrão passou a ser a 1ª cor do ciclo (`CHART_SERIES_COLORS[0]`) — o mesmo
 * acento que abre qualquer outro gráfico. Quem pede roxo (`color="purple"`,
 * `accent`, `thresholds`) continua recebendo roxo: mudou só o default.
 *
 * A tradução Apex → recharts está em `06-portabilidade.md` §3.1 ("medidor
 * semicircular: `<Pie startAngle={180} endAngle={0} />`").
 */
import { useId } from 'react';
import { Cell, Label, Pie, PieChart } from 'recharts';
import { chartAnimationProps } from './chart-axes';
import { formatChartValue } from './chart-data';
import { ChartFrame } from './chart-frame';
import type { ChartFrameState } from './chart-frame';
import { ChartLegends } from './chart-legend';
import type { ChartScope } from './chart-template';
import { chartPlainText } from './chart-text-html';
import {
  CHART_GEOMETRY,
  CHART_HEIGHT,
  CHART_NO_MARGIN,
  CHART_SERIES_COLORS,
  chartRingInnerRadius,
  chartSeriesToken,
} from './chart-theme';
import type { ChartStateProps, ValueFormatter } from './types';
import { useChartPalette } from './use-chart-palette';
import type { ChartPalette, ChartSeriesColor } from './use-chart-palette';

/** Qual dos três medidores da referência desenhar. */
export type RadialGaugeVariant = 'semicircle' | 'radial' | 'dashed';

/** Faixa de cor: vale enquanto `value <= upTo`. */
export interface RadialGaugeThreshold {
  /** Limite superior (inclusive) da faixa. */
  upTo: number;
  /** Cor categórica aplicada ao arco dentro da faixa. */
  color: ChartSeriesColor;
}

export interface RadialGaugeProps extends Omit<ChartStateProps, 'label'> {
  /** Valor medido. */
  value: number;
  /** Início da escala. */
  min?: number;
  /** Fim da escala. */
  max?: number;
  /** Rótulo acessível do medidor — obrigatório. */
  label: string;
  /** Legenda sob a leitura central (o "Total" da referência). */
  caption?: string;
  /** Diâmetro do medidor em px. */
  size?: number;
  /**
   * Espessura do arco em px — mesmo nome, mesmo tipo e mesmo efeito de antes.
   * Sem isto, sai do degrau do tema (24px): é o `override` de
   * `chartRingInnerRadius`, então espessura declarada continua vencendo o token.
   */
  thickness?: number;
  /** Cor fixa do arco. Vence `thresholds` e o padrão do produto. */
  color?: ChartSeriesColor;
  /** Faixas de cor por valor, do menor `upTo` para o maior. */
  thresholds?: RadialGaugeThreshold[];
  /** Formata a leitura central. */
  valueFormatter?: ValueFormatter;
  /** Layout do medidor (§12, §11 ou §13 da referência). */
  variant?: RadialGaugeVariant;
  /** Legenda própria embaixo. Sem isto, só a barra radial (§11) a exibe. */
  showLegend?: boolean;
  /**
   * Escopo de `{{interpolação}}` dos textos (de `buildChartScope`). Vale para
   * rótulo acessível, legenda central e resumo — o contrato comum do catálogo
   * manda TODO texto de bloco passar por ele.
   */
  scope?: ChartScope;
  /**
   * Estado do gráfico, para o que `isLoading`/vazio não cobrem (erro, sem
   * permissão). `success` é ignorado de propósito: quem sabe se há valor para
   * desenhar é este componente.
   */
  state?: ChartFrameState;
  /** Detalhe do erro, exibido no aviso quando `state="error"`. */
  errorMessage?: string;
}

/**
 * Raio externo do arco, como fração do lado do quadro — agora do tema
 * (`geometry.ringOuterRatio`), o mesmo da rosca e do anel de progresso.
 */

/**
 * Modo `sparkline` (§11–§13): o desenho encosta nas bordas do quadro, sem
 * padding. Também alinha o traço pontilhado do §13 ao setor do recharts — o
 * gráfico SOMA o deslocamento da margem ao `cx`/`cy` que recebe, e o caminho
 * solto no SVG não passa por essa conta.
 */
const NO_MARGIN = CHART_NO_MARGIN;

/** Volta completa, em graus — o limite em que o arco fecha o círculo. */
const FULL_TURN = 360;

/**
 * Paradas do gradiente (`02-configuracao-base.md` §5: paradas 0 e 100). A
 * direção é horizontal: o par de cores corre ao longo da barra, como no Apex.
 */
const GRADIENT_STOPS = { from: '0%', to: '100%' } as const;

/**
 * Tracejado da barra do medidor §13 (`dashArray: 4`). Em SVG, `4` = 4px de
 * traço e 4px de vão. É uma métrica de ESPECIFICAÇÃO que o `chart-theme` ainda
 * não publica (pedido em `docs/charts/PEDIDOS-BASE.md`, SUB-06); até lá fica
 * aqui, num lugar só, e nunca solta no JSX.
 */
const DASH_ARRAY = CHART_GEOMETRY.gaugeDash;

/**
 * Deslocamentos da referência, expressos sobre o quadro dos circulares — assim
 * viram fração e acompanham `size`.
 *
 * §12: medidor desenhado baixo no quadro (`offsetY: 56` ⇒ centro em 176/240),
 * valor 40px acima do centro e "Total" 8px abaixo.
 * §13: valor 48px abaixo do centro e "Total" 96px — o rótulo cai no vão de
 * baixo, entre as duas pontas do arco de 270°.
 *
 * O divisor era `CHART_HEIGHT.gauge` (o quadro de 260 em que a referência
 * mediu); agora é o `circular`, o quadro ÚNICO de todo circular do catálogo.
 */
const SEMI_CENTER_Y = (CHART_HEIGHT.circular / 2 + 56) / CHART_HEIGHT.circular;
const SEMI_VALUE_DY = -40 / CHART_HEIGHT.circular;
const SEMI_TOTAL_DY = 8 / CHART_HEIGHT.circular;
const DASHED_VALUE_DY = 48 / CHART_HEIGHT.circular;
const DASHED_TOTAL_DY = 96 / CHART_HEIGHT.circular;

/**
 * Cor PADRÃO do arco: a 1ª cor do CICLO — o acento do produto, o mesmo que
 * abre qualquer outro gráfico do catálogo (`01-fundamentos.md` §2).
 *
 * Antes cada layout trazia a cor da sua seção da referência (roxo no §11/§12,
 * vermelho no §13). Isso fazia do medidor o único bloco roxo de um catálogo
 * inteiro em verde — leitura de "componente de outra origem", não de destaque.
 * A cor da REFERÊNCIA continua alcançável de propósito, via `color`/`accent`.
 */
const DEFAULT_ARC_COLOR: ChartSeriesColor = CHART_SERIES_COLORS[0];

/** O que cada layout da referência tem de próprio, em código. */
interface GaugeLayout {
  /** Ângulo inicial (convenção do recharts: 0 = leste, sentido anti-horário). */
  start: number;
  /** Ângulo final. */
  end: number;
  /** Centro vertical do arco, em fração do lado do quadro. */
  centerY: number;
  /** Papel de chrome da trilha — a ÚNICA diferença permitida entre elas. */
  track: 'track' | 'trackLight';
  /** Gradiente do tom CLARO para o escuro (§11) em vez do inverso. */
  isLightFirst: boolean;
  /** Barra de valor pontilhada (§13). */
  isDashed: boolean;
  /** Deslocamento do valor central, em fração do lado do quadro. */
  valueDy: number;
  /** Deslocamento do "Total". `null` = vai para a legenda própria (§11). */
  totalDy: number | null;
  /** Legenda própria embaixo por padrão. */
  hasLegend: boolean;
}

/**
 * O que sobrou de específico de cada layout: ÂNGULO, posição do centro, tom da
 * trilha, ordem do gradiente e onde ficam os rótulos. Espessura, diâmetro e cor
 * saíram da tabela de propósito — eram justamente os três eixos em que os
 * medidores divergiam entre si e do resto do catálogo.
 */
const LAYOUT: Record<RadialGaugeVariant, GaugeLayout> = {
  // §12 — semicircular: −90° → +90°, trilha 16%.
  semicircle: {
    start: 180,
    end: 0,
    centerY: SEMI_CENTER_Y,
    track: 'track',
    isLightFirst: false,
    isDashed: false,
    valueDy: SEMI_VALUE_DY,
    totalDy: SEMI_TOTAL_DY,
    hasLegend: false,
  },
  // §11 — barra radial: volta completa, trilha 8%, legenda embaixo.
  radial: {
    start: 90,
    end: 90 - FULL_TURN,
    centerY: 0.5,
    track: 'trackLight',
    isLightFirst: true,
    isDashed: false,
    valueDy: 0,
    totalDy: null,
    hasLegend: true,
  },
  // §13 — tracejado: −135° → +135°, barra pontilhada, trilha 8%.
  dashed: {
    start: 225,
    end: -45,
    centerY: 0.5,
    track: 'trackLight',
    isLightFirst: false,
    isDashed: true,
    valueDy: DASHED_VALUE_DY,
    totalDy: DASHED_TOTAL_DY,
    hasLegend: false,
  },
};

/** Sufixo de tom de um token do DS (`--ds-color-<família>-<tom>`). */
const TONE_SUFFIX = /-(lighter|light|main|dark|darker)$/;

/**
 * Par do gradiente: o tom `-light` da MESMA família do DS. Os três medidores da
 * referência usam sempre um par claro/escuro da mesma cor (#8E33FF→#C684FF,
 * #FFAB00→#FFD666, #FF5630→#FFAC82), então a regra é uma só. Cor sem tom claro
 * equivalente (o cinza) devolve ela mesma — o gradiente vira cor sólida.
 */
function lightPartner(palette: ChartPalette, color: ChartSeriesColor): string {
  const token = chartSeriesToken(color);
  if (!TONE_SUFFIX.test(token)) return palette.colorAt(0, color);
  return palette.token(token.replace(TONE_SUFFIX, '-light'));
}

/** Escolhe a cor da faixa em que o valor cai. */
function resolveColor(
  value: number,
  color?: ChartSeriesColor,
  thresholds?: RadialGaugeThreshold[],
): ChartSeriesColor | undefined {
  if (color) return color;
  if (!thresholds || thresholds.length === 0) return undefined;
  const match = thresholds.find((threshold) => value <= threshold.upTo);
  return (match ?? thresholds[thresholds.length - 1]).color;
}

/** Ponto da circunferência no ângulo dado (mesma convenção do recharts). */
function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy - radius * Math.sin(radians) };
}

/** Caminho de um arco de `start` até `end`, em graus. */
function arcPath(
  cx: number,
  cy: number,
  radius: number,
  start: number,
  end: number,
): string {
  const from = polar(cx, cy, radius, start);
  const to = polar(cx, cy, radius, end);
  const largeArc = Math.abs(start - end) > 180 ? 1 : 0;
  const sweep = start > end ? 1 : 0;
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${to.x} ${to.y}`;
}

/** Centro polar entregue pelo `<Label>` do recharts. `null` se vier outra forma. */
function readCenter(viewBox: unknown): { cx: number; cy: number } | null {
  if (!viewBox || typeof viewBox !== 'object') return null;
  const { cx, cy } = viewBox as { cx?: unknown; cy?: unknown };
  if (typeof cx !== 'number' || typeof cy !== 'number') return null;
  return { cx, cy };
}

/** Tipografia dos rótulos centrais, por layout (`01-fundamentos.md` §4). */
function centerTypography(variant: RadialGaugeVariant, palette: ChartPalette) {
  return {
    value: {
      // §11 pede 15,75px; §12 e §13 herdam os 17,5px da rosca (base §10).
      fontSize:
        variant === 'radial'
          ? palette.token('--font-size-lg')
          : palette.typography.centerValue.size,
      fontWeight: palette.typography.centerValue.weight,
      fill: palette.chrome('emphasis'),
    },
    total:
      variant === 'dashed'
        ? {
            // §13 pede 12,25px/600 na COR DE ERRO. O tamanho e o peso ficam; a
            // cor sai. Na referência o medidor tracejado é vermelho inteiro
            // (arco + rótulo), e vermelho ali significa "risco". Aqui o arco
            // passou a nascer no acento do produto, então um "Total" vermelho
            // embaixo de um arco verde deixaria de ser ênfase e viraria um
            // alarme sem causa — a leitura de status tem de vir do DADO
            // (`thresholds`), nunca da variante escolhida para desenhar.
            fontSize: palette.typography.centerTotal.size,
            fontWeight: palette.typography.centerTotal.weight,
            fill: palette.chrome('label'),
          }
        : {
            // §12: 10,5px/400 na cor de eixo — o degrau `4xs` do tema.
            fontSize: palette.token('--font-size-4xs'),
            fontWeight: palette.token('--font-weight-normal'),
            fill: palette.chrome('axis'),
          },
  };
}

/** Medidor radial nos três layouts da referência (§11, §12 e §13). */
export function RadialGauge({
  value,
  min = 0,
  max = 100,
  label,
  caption,
  size = CHART_HEIGHT.circular,
  thickness,
  color,
  thresholds,
  valueFormatter = formatChartValue,
  variant = 'semicircle',
  showLegend,
  scope,
  state,
  isLoading,
  emptyMessage,
  errorMessage,
  summary,
}: RadialGaugeProps) {
  const palette = useChartPalette();
  // `useId` devolve `:r0:`; os dois-pontos atrapalham `url(#id)` em SVG.
  const uid = useId().replace(/:/g, '');
  const gradientId = `${uid}-gauge`;
  const layout = LAYOUT[variant];

  const span = max - min || 1;
  const fraction = Math.min(Math.max((value - min) / span, 0), 1);
  const sweep = layout.start - layout.end;
  const valueEnd = layout.start - sweep * fraction;

  const cx = size / 2;
  const cy = size * layout.centerY;
  const outerRadius = Math.round(size * palette.geometry.ringOuterRatio);
  // Espessura do degrau do tema (24px), com `thickness` como override em px —
  // igual à rosca e ao anel de progresso, e igual nos três layouts.
  const innerRadius = chartRingInnerRadius(outerRadius, size, thickness);
  const band = outerRadius - innerRadius;
  /**
   * A geometria do arco, UMA VEZ, espalhada na trilha e na barra de valor (e,
   * no §13, virando a espessura do traço pontilhado). Trilha e valor com
   * espessuras diferentes é o defeito mais fácil de notar num medidor; com um
   * objeto só, a trilha NÃO TEM COMO divergir — ela só muda de cor.
   */
  const ring = { cx, cy, innerRadius, outerRadius } as const;

  // §6: ponta ARREDONDADA — no recharts, raio de canto igual à meia espessura.
  // O tracejado (§13) usa ponta reta, e um arco fechado não tem ponta.
  const roundCap = (angle: number) =>
    layout.isDashed || Math.abs(angle) >= FULL_TURN ? 0 : band / 2;

  const arcColor = resolveColor(value, color, thresholds) ?? DEFAULT_ARC_COLOR;
  const arcMain = palette.colorAt(0, arcColor);
  const arcLight = lightPartner(palette, arcColor);
  const [stopFrom, stopTo] = layout.isLightFirst
    ? [arcLight, arcMain]
    : [arcMain, arcLight];

  const reading = valueFormatter(value);
  const plainLabel = chartPlainText(label, scope) || label;
  const total = caption ? chartPlainText(caption, scope) || caption : undefined;
  const typography = centerTypography(variant, palette);
  const hasLegend = showLegend ?? layout.hasLegend;
  // `success` não sobrepõe o vazio/carregando que este componente calcula.
  const frameState = state && state !== 'success' ? state : undefined;

  return (
    <ChartFrame
      label={label}
      scope={scope}
      summary={summary ? chartPlainText(summary, scope) || summary : undefined}
      height={size}
      role="meter"
      valueNow={value}
      valueMin={min}
      valueMax={max}
      valueText={total ? `${reading} — ${total}` : reading}
      isCircular
      isBare
      isCompact
      state={frameState}
      isLoading={isLoading}
      isEmpty={!Number.isFinite(value)}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
      footer={
        hasLegend ? (
          <ChartLegends
            items={[
              {
                label: total ?? plainLabel,
                color: palette.varAt(0, arcColor),
                value: reading,
              },
            ]}
          />
        ) : null
      }
    >
      <PieChart width={size} height={size} margin={NO_MARGIN}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset={GRADIENT_STOPS.from} stopColor={stopFrom} />
            <stop offset={GRADIENT_STOPS.to} stopColor={stopTo} />
          </linearGradient>
        </defs>
        <Pie
          data={[{ value: 1 }]}
          dataKey="value"
          {...ring}
          startAngle={layout.start}
          endAngle={layout.end}
          cornerRadius={roundCap(sweep)}
          isAnimationActive={false}
          stroke="none"
        >
          <Cell fill={palette.chrome(layout.track)} />
          <Label
            position="center"
            content={(props) => {
              const center = readCenter(props.viewBox);
              if (!center) return null;
              return (
                <g data-slot="chart-center-label">
                  <text
                    x={center.cx}
                    y={center.cy + layout.valueDy * size}
                    textAnchor="middle"
                    dominantBaseline="central"
                    {...typography.value}
                  >
                    {reading}
                  </text>
                  {total && layout.totalDy !== null ? (
                    <text
                      x={center.cx}
                      y={center.cy + layout.totalDy * size}
                      textAnchor="middle"
                      dominantBaseline="central"
                      {...typography.total}
                    >
                      {total}
                    </text>
                  ) : null}
                </g>
              );
            }}
          />
        </Pie>
        {fraction > 0 && !layout.isDashed ? (
          <Pie
            data={[{ value: 1 }]}
            dataKey="value"
            {...ring}
            startAngle={layout.start}
            endAngle={valueEnd}
            cornerRadius={roundCap(sweep * fraction)}
            stroke="none"
            {...chartAnimationProps(palette)}
          >
            <Cell fill={`url(#${gradientId})`} />
          </Pie>
        ) : null}
        {fraction > 0 && layout.isDashed ? (
          // §13: a barra de valor vira um caminho tracejado desenhado na LINHA
          // DO MEIO da faixa, com a espessura dela (`band`) no traço — é assim
          // que o pontilhado ocupa exatamente o anel da trilha, sem sobrar nem
          // faltar. Fica FORA do `<Pie>` porque o setor do recharts é
          // preenchido, e o pontilhado é do TRAÇO.
          <path
            data-slot="chart-gauge-dashed"
            d={arcPath(
              ring.cx,
              ring.cy,
              (ring.innerRadius + ring.outerRadius) / 2,
              layout.start,
              valueEnd,
            )}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={band}
            strokeDasharray={DASH_ARRAY}
            strokeLinecap="butt"
          />
        ) : null}
      </PieChart>
    </ChartFrame>
  );
}

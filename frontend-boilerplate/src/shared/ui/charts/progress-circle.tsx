/**
 * COMPONENTE PRÓPRIO — o Astryx só tem `ProgressBar` (linear). Resolve
 * "progresso rumo a um total": um anel de volta completa com a leitura no vão
 * central.
 *
 * Substitui `progress-circle-tremor.tsx` + `progress-circle-tremor-variants.ts`,
 * cujas variantes eram cores cruas do Tailwind (`stroke-blue-500`,
 * `stroke-emerald-200`) sem relação com o tema. Agora o tom sai dos tokens
 * semânticos do DS e o papel ARIA é `progressbar`, com valor de verdade.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT — o vocabulário dos circulares da referência
 * ---------------------------------------------------------------------------
 * A referência não tem um "anel de progresso" próprio: ele é a rosca
 * (`03-tipos-de-grafico.md` §10) com UMA fatia, então herda o vocabulário dela
 * e o dos medidores (§11–§13) — decisão registrada em `docs/charts/NOTAS.md`.
 *
 *   1. volta completa (0 → 360) começando no topo;
 *   2. anel de 24px — o degrau de espessura dos circulares
 *      (`CHART_GEOMETRY.ringThickness`, via `chartRingInnerRadius`). Era o furo
 *      de 72% da rosca, que num quadro de 240 dava 30px de anel enquanto a
 *      rosca dava 34 e o medidor 88;
 *   3. trilha `rgba(145,158,171,.16)` — `palette.chrome('track')`, a trilha de
 *      medidor radial da base (§10). A trilha muda de COR, NUNCA de espessura:
 *      ela é o mesmo anel apagado, e por isso sai da MESMA geometria do arco de
 *      valor (o objeto `ring` abaixo, espalhado nos dois `<circle>`);
 *   4. valor central 17,5px/700 na cor de ênfase e rótulo "Total" 12,25px/600
 *      na cor de rótulo — os rótulos centrais da rosca (`01-fundamentos.md` §4);
 *   5. ponta ARREDONDADA do arco (base §6);
 *   6. modo `sparkline`: sem eixo, sem grade, sem padding; esqueleto REDONDO
 *      (§8) e movimento de 360ms (§3).
 *
 * ---------------------------------------------------------------------------
 * POR QUE O ARCO NÃO É MAIS UM `<Pie>` DO RECHARTS
 * ---------------------------------------------------------------------------
 * O arco de valor era um `<Pie>` com a animação de entrada do motor
 * (`chartAnimationProps`). O recharts anima interpolando os ÂNGULOS a partir do
 * zero, então no PRIMEIRO QUADRO o setor tem abertura nula e o motor não
 * escreve caminho nenhum: o DOM ficava com a trilha cinza e nada mais. Medido
 * na auditoria de inércia (`catalog/__audit__/prop-effect.audit.test.tsx`), os
 * cinco valores de `variant` e os seis de `accent` produziam **exatamente o
 * mesmo HTML** — a única parte do desenho que depende deles não existia ainda.
 * O mesmo acontece em toda leitura que não espera o quadro seguinte: SSR,
 * impressão, captura de tela e leitor que sirva do HTML inicial.
 *
 * Um anel de progresso não precisa do motor: ele é UM traço circular. Desenhado
 * como `<circle>` com `stroke-dasharray`/`stroke-dashoffset` — a técnica padrão
 * de anel de progresso —, a geometria é exata, a ponta arredondada sai de
 * `stroke-linecap` e o desenho existe já no primeiro quadro, com a cor pedida.
 *
 * O MOVIMENTO não se perde: ele passa a ser o mesmo das outras marcas de
 * progresso do catálogo (`ChartBarTrack`, `RankingBar`) — transição de
 * `motion.duration` (os 360ms da §3) quando o VALOR muda, e desenho já na
 * posição final quando o sistema pede menos movimento
 * (`prefers-reduced-motion`), coisa que a animação do motor ignorava.
 *
 * O anel é pintado por TOM SEMÂNTICO (`tone`) — ele responde "quanto falta",
 * não "qual categoria" — ou, quando quem chama pede uma cor de série (`color`),
 * por ela: é a regra de precedência publicada em `chart-accent.ts`, em que um
 * acento reconhecível vence sempre.
 */
import type { CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import { ChartFrame } from './chart-frame';
import type { ChartFrameState } from './chart-frame';
import type { ChartScope } from './chart-template';
import { chartPlainText } from './chart-text-html';
import { CHART_HEIGHT, chartRingInnerRadius } from './chart-theme';
import type { ChartStateProps } from './types';
import { useChartPalette } from './use-chart-palette';
import type { ChartPalette, ChartSeriesColor } from './use-chart-palette';

/** Tom semântico do anel — espelha as variantes do `ProgressBar` do DS. */
export type ProgressCircleTone =
  | 'accent'
  | 'positive'
  | 'warning'
  | 'negative'
  | 'neutral';

export interface ProgressCircleProps extends Omit<ChartStateProps, 'label'> {
  /** Valor atual (0..`max`). */
  value: number;
  /** Total da escala. */
  max?: number;
  /** Diâmetro do anel em px. */
  size?: number;
  /**
   * Espessura do anel em px — mesmo nome, mesmo tipo e mesmo efeito de antes.
   * Sem isto, sai do degrau do tema (24px): é o `override` de
   * `chartRingInnerRadius`, então espessura declarada continua vencendo o token.
   */
  thickness?: number;
  /** Tom semântico do preenchimento. */
  tone?: ProgressCircleTone;
  /**
   * Cor de SÉRIE do arco. Quando presente VENCE o `tone` — é a regra de
   * precedência de `chart-accent.ts`: pedir uma cor É pedir cor única, e a
   * escolha mais específica não pode ser descartada em silêncio.
   */
  color?: ChartSeriesColor;
  /** Rótulo acessível — obrigatório (ex.: "Cobertura de testes"). */
  label: string;
  /** Leitura central já formatada (ex.: "73%"). */
  centerValue?: string;
  /** Legenda sob a leitura central (o "Total" da referência). */
  centerCaption?: string;
  /**
   * Escopo de `{{interpolação}}` dos textos (de `buildChartScope`). Vale para
   * rótulo acessível, leitura central e legenda — o contrato comum do catálogo
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
 * Meia-volta em graus. O `<circle>` do SVG começa às 3 horas; o anel da
 * referência começa no TOPO, então o desenho inteiro gira −90°.
 */
const QUARTER_TURN = -90;

/** Distância entre o valor e a legenda central, em fração do lado do quadro. */
const STACK_OFFSET = 12 / CHART_HEIGHT.circular;

/** Percentual inteiro exibido quando quem chama não formata a leitura. */
function defaultReading(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** Tipografia dos rótulos centrais da rosca (`01-fundamentos.md` §4). */
function centerTypography(palette: ChartPalette) {
  return {
    value: {
      fontSize: palette.typography.centerValue.size,
      fontWeight: palette.typography.centerValue.weight,
      fill: palette.chrome('emphasis'),
    },
    total: {
      fontSize: palette.typography.centerTotal.size,
      fontWeight: palette.typography.centerTotal.weight,
      fill: palette.chrome('label'),
    },
  };
}

/** Anel de progresso com leitura central. */
export function ProgressCircle({
  value,
  max = 100,
  size = CHART_HEIGHT.circular,
  thickness,
  tone = 'accent',
  color,
  label,
  centerValue,
  centerCaption,
  scope,
  state,
  isLoading,
  emptyMessage,
  errorMessage,
  summary,
}: ProgressCircleProps) {
  const palette = useChartPalette();
  const prefersReducedMotion = useReducedMotion();
  const safeMax = max || 1;
  const fraction = Math.min(Math.max(value / safeMax, 0), 1);

  const center = size / 2;
  const outerRadius = Math.round(size * palette.geometry.ringOuterRatio);
  // Espessura do degrau do tema (24px), com `thickness` como override em px.
  const innerRadius = chartRingInnerRadius(outerRadius, size, thickness);
  const band = outerRadius - innerRadius;
  /**
   * A geometria do anel, UMA VEZ, espalhada na trilha e no arco de valor.
   *
   * Não é economia de digitação: trilha e valor com espessuras diferentes é o
   * defeito mais fácil de notar num medidor (o anel de progresso chegou a ter
   * trilha visivelmente mais larga que o arco), e ele nasce justamente de os
   * dois desenhos calcularem raio por conta própria. Com um objeto só, a trilha
   * NÃO TEM COMO divergir — a única diferença permitida entre eles é a cor.
   *
   * O traço é centrado no caminho, então o raio do `<circle>` é a LINHA DO MEIO
   * da faixa: com espessura `band`, o anel ocupa exatamente de `innerRadius` a
   * `outerRadius` — a mesma faixa que o setor do motor desenhava.
   */
  const ring = {
    cx: center,
    cy: center,
    r: (outerRadius + innerRadius) / 2,
    strokeWidth: band,
    fill: 'none',
  } as const;

  const circumference = 2 * Math.PI * ring.r;
  // O quanto do traço fica ESCONDIDO: 0 = anel fechado, `circumference` = vazio.
  const dashOffset = circumference * (1 - fraction);

  /**
   * Movimento (§3): a mesma regra das outras marcas de progresso do catálogo —
   * a transição acontece quando o VALOR muda, e some quando o sistema pede
   * menos movimento. Nunca esconde o desenho: o arco já nasce na posição certa.
   */
  const arcStyle: CSSProperties = {
    transition: prefersReducedMotion
      ? undefined
      : `stroke-dashoffset ${palette.motion.duration}ms ease-out`,
  };

  const raw = centerValue ?? defaultReading(fraction);
  const reading = chartPlainText(raw, scope) || raw;
  const total = centerCaption
    ? chartPlainText(centerCaption, scope) || centerCaption
    : undefined;
  const typography = centerTypography(palette);
  // `success` não sobrepõe o vazio/carregando que este componente calcula.
  const frameState = state && state !== 'success' ? state : undefined;
  // A cor pedida vence o tom semântico (regra de `chart-accent.ts`).
  const arcColor = color ? palette.colorAt(0, color) : palette.chrome(tone);
  const shift = total ? STACK_OFFSET * size : 0;

  return (
    <ChartFrame
      label={label}
      scope={scope}
      summary={summary ? chartPlainText(summary, scope) || summary : undefined}
      height={size}
      role="progressbar"
      valueNow={value}
      valueMin={0}
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
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="presentation"
        data-slot="progress-circle"
        data-tone={color ? undefined : tone}
        // RESPONSIVIDADE: o quadro do anel é fixo (240, o degrau único dos
        // circulares), mas em card estreito ele transbordava — o `<PieChart>`
        // do motor desenhava numa caixa de largura fixa. Com `viewBox`, o
        // desenho é vetorial: limitar a largura à do contêiner faz o anel
        // ENCOLHER em proporção em vez de ser cortado. Não é medida nova (é
        // "no máximo, o que couber"), e nada muda enquanto houver espaço.
        style={{ maxInlineSize: '100%', blockSize: 'auto' }}
      >
        {/* O anel inteiro girado para começar no topo, no sentido horário. */}
        <g transform={`rotate(${QUARTER_TURN} ${ring.cx} ${ring.cy})`}>
          <circle
            {...ring}
            data-slot="progress-circle-track"
            stroke={palette.chrome('track')}
          />
          {fraction > 0 ? (
            <circle
              {...ring}
              data-slot="progress-circle-value"
              stroke={arcColor}
              // §6: ponta ARREDONDADA. Um anel fechado não tem ponta — e com
              // `round` num traço de volta completa as duas pontas se
              // sobreporiam, engrossando o fecho do círculo.
              strokeLinecap={fraction >= 1 ? 'butt' : 'round'}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={arcStyle}
            />
          ) : null}
        </g>

        <g data-slot="chart-center-label">
          <text
            x={ring.cx}
            y={ring.cy - shift}
            textAnchor="middle"
            dominantBaseline="central"
            {...typography.value}
          >
            {reading}
          </text>
          {total ? (
            <text
              x={ring.cx}
              y={ring.cy + shift}
              textAnchor="middle"
              dominantBaseline="central"
              {...typography.total}
            >
              {total}
            </text>
          ) : null}
        </g>
      </svg>
    </ChartFrame>
  );
}

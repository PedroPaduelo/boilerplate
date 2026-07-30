/**
 * COMPONENTE PRÓPRIO — o Astryx não tem gráficos. Resolve "composição de um
 * total": fatias proporcionais com leitura central opcional.
 *
 * LAYOUT — `03-tipos-de-grafico.md` §9 (Pizza) e §10 (Rosca):
 *   • 240 × 240 px, QUADRADO e centralizado (`CHART_HEIGHT.circular`);
 *   • modo `sparkline`: sem eixos, sem grade e sem padding — o anel ocupa a
 *     caixa inteira;
 *   • traço 0 entre fatias (nada de contorno branco separando pedaço);
 *   • ANEL DE 24px (`chartRingInnerRadius`), o mesmo do anel de progresso e dos
 *     medidores; PIZZA é o MESMO componente com furo 0 (`thickness={1}`), como
 *     na referência, que só troca `donut.size`;
 *   • rótulos centrais da base (`ChartCenterLabel`);
 *   • legenda PRÓPRIA, FORA do desenho (`ChartLegends`) — a legenda do motor
 *     roubaria área do anel e a referência é explícita em não usá-la.
 *
 * ESPESSURA — por que o furo de 72% saiu:
 * A referência mede o furo como FRAÇÃO do raio, e cada circular herdou a
 * fração da sua própria seção: 72% aqui, 32% na barra radial, 50% na trilha do
 * medidor. Lado a lado na grade do `/catalog` isso dava anéis de 34px, 88px e
 * 30px para a MESMA figura — três componentes de origens diferentes, não uma
 * família. Agora a espessura é um DEGRAU EM PIXEL do tema
 * (`CHART_GEOMETRY.ringThickness`, 24px), aplicado por `chartRingInnerRadius`,
 * e a fração da referência só volta a mandar quando o desenho é pequeno demais
 * para os 24px (o `clamp` do helper).
 *
 * COR — a sequência é a da PROPORÇÃO (§9), não o ciclo de 9 cores dos
 * cartesianos: verde escuro a 80%, âmbar, azul petróleo e vermelho.
 */
import { useState } from 'react';
import { Cell, Label, Pie, PieChart, Tooltip } from 'recharts';
import { chartAnimationProps } from './chart-axes';
import { ChartCenterLabel } from './chart-center-label';
import {
  CATEGORY_KEY,
  describePoints,
  formatChartValue,
  isPointsEmpty,
  toPointRows,
} from './chart-data';
import { ChartFrame, type ChartFrameState } from './chart-frame';
import { ChartLegends } from './chart-legend';
import { buildChartScope } from './chart-template';
import { chartPlainText } from './chart-text-html';
import { CHART_HEIGHT, CHART_NO_MARGIN, chartRingInnerRadius } from './chart-theme';
import { ChartTooltip } from './chart-tooltip';
import type { ChartPoint, ChartStateProps, ValueFormatter } from './types';
import {
  darkenColor,
  useChartPalette,
  type ChartPalette,
  type ChartSeriesColor,
} from './use-chart-palette';

export interface DonutChartProps extends ChartStateProps {
  /** Fatias do anel. O ângulo de cada uma é proporcional ao total. */
  data: ChartPoint[];
  /** Lado da plotagem em px — o desenho é quadrado (240 × 240 na referência). */
  height?: number;
  /**
   * Espessura do anel, de 0 (sem anel) a 1 (**pizza**, furo 0), como FRAÇÃO do
   * raio — o tipo e o efeito são os de sempre. Sem valor, a espessura sai do
   * degrau do tema (24px, `CHART_GEOMETRY.ringThickness`) em vez do antigo
   * furo de 72%.
   *
   * Em pixel, esta fração é exatamente o `override` de `chartRingInnerRadius`:
   * quem declara espessura continua vencendo o token. Único efeito colateral
   * da mudança: o helper tem piso de 1px, então `thickness={0}` desenha um fio
   * de cabelo em vez de nada — na prática ninguém pede anel de espessura zero.
   */
  thickness?: number;
  /** Leitura principal no vão central. Aceita Markdown e `{{variaveis}}`. */
  centerValue?: string;
  /** Legenda abaixo da leitura central ("Total"). Aceita `{{variaveis}}`. */
  centerCaption?: string;
  /** Legenda PRÓPRIA (categoria → cor + valor) abaixo da plotagem. */
  showLegend?: boolean;
  /** Formata o valor no tooltip, na legenda e no equivalente textual. */
  valueFormatter?: ValueFormatter;
  /**
   * Texto do valor de cada fatia NA LEGENDA. Sem isto, usa `valueFormatter` —
   * que é o que a referência mostra. Existe para quem precisa acrescentar a
   * participação no total (o bloco `donut` do catálogo).
   */
  legendValueFormatter?: (point: ChartPoint) => string;
  /** Estado do gráfico. Tem prioridade sobre `isLoading`. */
  state?: ChartFrameState;
  /** Detalhe do erro, quando `state="error"`. */
  errorMessage?: string;
  /**
   * Clique numa fatia. Quando declarado, o desenho vira SELEÇÃO: a fatia ganha
   * cursor de mão e o clique devolve o ponto. Existe para o drill-down (ver um
   * recorte no gráfico e agir sobre ele) — sem a prop, nada muda.
   *
   * Gráfico é atalho, não único caminho: a tela que liga isto precisa oferecer
   * um controle equivalente alcançável por teclado.
   */
  onSelect?: (point: ChartPoint, index: number) => void;
}

/**
 * As cores da PROPORÇÃO a partir da 2ª fatia (`03-tipos-de-grafico.md` §9:
 * `[VERDE80, #FFAB00, #006C9C, #FF5630]`). A 1ª fica de fora da lista porque
 * não é token do ciclo e sim uma derivação dele — o verde escuro a 80%
 * (`palette.primary80`), a cor mais recorrente do catálogo da referência.
 */
const PROPORTION_COLORS: readonly ChartSeriesColor[] = ['amber', 'steel', 'red'];

/**
 * Modo `sparkline` (§9/§10): sem eixos, sem grade e **sem padding**. Zero aqui
 * não é medida de estilo — é a ausência dela; o respiro do card vem do
 * `ChartFrame`.
 */
const SPARKLINE_MARGIN = CHART_NO_MARGIN;

/** Uma fatia tem três formas da mesma cor: SVG, hover e DOM. */
interface SliceInk {
  /** Valor RESOLVIDO — atributo de apresentação de SVG não aceita `var()`. */
  fill: string;
  /** A mesma cor ESCURECIDA — o hover da referência escurece, não clareia. */
  hover: string;
  /** `var(--token)` — a forma preferida no DOM (legenda). */
  ink: string;
}

/** A sequência de cores da proporção, resolvida contra o tema ativo. */
function proportionSlices(palette: ChartPalette): SliceInk[] {
  return [
    // 1ª fatia: verde escuro a 80% — derivação, sem token próprio no tema.
    {
      fill: palette.primary80,
      hover: darkenColor(palette.primary80),
      ink: palette.primary80,
    },
    ...PROPORTION_COLORS.map((color, index) => ({
      fill: palette.colorAt(index + 1, color),
      hover: palette.hoverAt(index + 1, color),
      ink: palette.varAt(index + 1, color),
    })),
  ];
}

/** Rosca (ou pizza, com `thickness={1}`) com leitura central e legenda própria. */
export function DonutChart({
  data,
  height = CHART_HEIGHT.circular,
  thickness,
  centerValue,
  centerCaption,
  showLegend = true,
  valueFormatter = formatChartValue,
  legendValueFormatter,
  state,
  errorMessage,
  isLoading,
  emptyMessage,
  label = 'Gráfico de rosca',
  summary,
  onSelect,
}: DonutChartProps) {
  const palette = useChartPalette();
  // Hover ESCURECE (a maioria das libs clareia): o recharts não tem filtro de
  // estado em `Pie`, então a fatia sob o cursor troca de cor.
  const [activeSlice, setActiveSlice] = useState(-1);

  const isEmpty = isPointsEmpty(data);
  const rows = toPointRows(data);
  const scope = buildChartScope(data);
  const slices = proportionSlices(palette);

  /** Cor da fatia `index`: a do ponto, se declarada; senão a da proporção. */
  const inkAt = (index: number, override?: ChartSeriesColor): SliceInk =>
    override
      ? {
          fill: palette.colorAt(index, override),
          hover: palette.hoverAt(index, override),
          ink: palette.varAt(index, override),
        }
      : slices[index % slices.length];

  // Os dois raios vão em PIXEL para o `<Pie>` porque a espessura do anel agora
  // é um degrau em pixel: em percentual ela voltaria a depender do que o
  // recharts calcula como raio máximo, e 24px deixariam de ser 24px.
  //
  // O raio externo sai de `ringOuterRatio` — o MESMO do anel de progresso e dos
  // medidores. Antes era `height / 2` (o anel encostando na borda, Ø240) contra
  // os 0,45 dos outros (Ø216): a espessura já estava unificada, mas os círculos
  // continuavam de tamanhos diferentes um ao lado do outro na grade.
  const outerRadius = Math.round(height * palette.geometry.ringOuterRatio);
  // `thickness` é fração do raio (contrato público); em pixel ela é exatamente
  // o `override` do helper — espessura declarada continua vencendo o token.
  const innerRadius = chartRingInnerRadius(
    outerRadius,
    height,
    thickness == null ? undefined : Math.min(Math.max(thickness, 0), 1) * outerRadius,
  );

  // Contrato comum: todo texto do bloco aceita Markdown + `{{variavel}}`.
  const centerText = chartPlainText(centerValue, scope);
  const captionText = chartPlainText(centerCaption, scope);

  return (
    <ChartFrame
      label={label}
      scope={scope}
      summary={summary ?? describePoints(data, valueFormatter)}
      height={height}
      isCircular
      state={state}
      errorMessage={errorMessage}
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      footer={
        showLegend ? (
          <ChartLegends
            items={data.map((point, index) => ({
              label: point.label,
              color: inkAt(index, point.color).ink,
              value: legendValueFormatter
                ? legendValueFormatter(point)
                : valueFormatter(point.value),
            }))}
          />
        ) : null
      }
    >
      {/* Quadrado de lado fixo: o anel da referência tem 240 × 240 e é o
          `ChartFrame` (isCircular) que o centraliza no corpo do card. */}
      <PieChart width={height} height={height} margin={SPARKLINE_MARGIN}>
        <Tooltip
          wrapperStyle={{ outline: 'none' }}
          content={(props) => {
            const entry = props.payload?.[0];
            if (!props.active || !entry) return null;
            const index = data.findIndex((point) => point.label === String(entry.name));
            return (
              <ChartTooltip
                rows={[
                  {
                    label: String(entry.name ?? ''),
                    value: valueFormatter(Number(entry.value ?? 0)),
                    color: index >= 0 ? inkAt(index, data[index].color).ink : undefined,
                  },
                ]}
              />
            );
          }}
        />
        <Pie
          data={rows}
          dataKey="value"
          nameKey={CATEGORY_KEY}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={0}
          stroke="none"
          onMouseEnter={(_point: unknown, index: number) => setActiveSlice(index)}
          onMouseLeave={() => setActiveSlice(-1)}
          onClick={
            onSelect
              ? (_point: unknown, index: number) => {
                  const point = data[index];
                  if (point) onSelect(point, index);
                }
              : undefined
          }
          {...chartAnimationProps(palette)}
        >
          {data.map((point, index) => {
            const slice = inkAt(index, point.color);
            return (
              <Cell
                key={`${point.label}-${index}`}
                fill={index === activeSlice ? slice.hover : slice.fill}
                // `cursor` é atributo de APRESENTAÇÃO do SVG (não precisa de
                // CSS), então a mão aparece sem `style` inline.
                cursor={onSelect ? 'pointer' : undefined}
              />
            );
          })}
          {centerText ? (
            <Label
              position="center"
              content={(props) => (
                <ChartCenterLabel
                  viewBox={props.viewBox}
                  value={centerText}
                  caption={captionText || undefined}
                  palette={palette}
                />
              )}
            />
          ) : null}
        </Pie>
      </PieChart>
    </ChartFrame>
  );
}

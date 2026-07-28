/**
 * Bloco `signal_card` (shape 'series') — destaca o ÚLTIMO valor da série, a
 * variação e a tendência. Desenha o próprio cartão (`signal-card.tsx`), por
 * isso NÃO recebe a moldura `BlockFrame` (evita card dentro de card).
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL — `BRIEFING-SUBAGENTE.md` §4 sobre
 * `04-widgets-prontos.md` §2 (card de resumo com mini-gráfico)
 * ---------------------------------------------------------------------------
 * 1. Grade só horizontal, tracejada 3 ...... N/A — o modo sparkline não tem grade (§2.3)
 * 2. Eixos sem linha e sem marcações ....... N/A — o modo sparkline não tem eixo (§2.3)
 * 3. Texto de eixo 12px/400/#919EAB ........ N/A — sem eixo não há texto de eixo
 * 4. Linha, curva suave, sem pontos ........ `SparkChart` (monotone, `dot={false}`)
 * 5. Coluna com raio no topo ............... N/A — a variante do cartão é ÁREA (§2.4)
 * 6. Hover ESCURECE ........................ marcador do `SparkChart` com `strokeWidth: 0` (§2.3)
 * 7. Tooltip branco 90% com blur ........... `ChartTooltip` com o VALOR e SEM título (§2.3)
 * + Card ................................... padding 24px, `position: relative`, SEM sombra (§2.1)
 * + Tendência .............................. bloco absoluto no topo-direito, gap 4px, ícone 20px (§2.2)
 * + Tipografia ............................. título 12,25px/600, valor 17,5px/700 (§2.2)
 * + Mini-gráfico ........................... área 100 × 66px, à direita e à base (§2.2/§2.4)
 *
 * ---------------------------------------------------------------------------
 * CONTRATO COMUM (`BRIEFING-SUBAGENTE.md` §5)
 * ---------------------------------------------------------------------------
 *  - CABEÇALHO: o cartão é o próprio cabeçalho — `label` é o título do bloco
 *    (o `BlockRenderer` promove o título do bloco para `props.label`).
 *  - DADOS: `data` alimenta valor, variação, desenho E o escopo de variáveis.
 *  - MARKDOWN + `{{interpolação}}`: rótulo, texto da variação e mensagem de
 *    vazio passam por `ChartText`/`chartPlainText` com `buildChartScope(data)`.
 *  - ESTADOS: `loading`/`skeleton` → esqueleto da tendência; sem pontos → o
 *    `SparkChart` avisa em vez de desenhar uma caixa vazia.
 *  - PARÂMETROS: `label`, `valueFormat`, `accent`, `trendPolarity`,
 *    `trendBasis` e `showSparkline` continuam todos com efeito.
 */
import type { SeriesData } from '@dashboards/contracts';
import { buildChartScope, chartAccentColor } from '@/shared/ui';
import { formatValueByEnum, type ValueFormat } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { SignalCard } from './signal-card';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SignalProps = {
  label?: string;
  /** Formato PT-BR do valor em destaque (enum fechado do catálogo). */
  valueFormat?: ValueFormat;
  /** Cor da tendência; resolvida para token de dado do DS. */
  accent?: string;
  /** Subir é bom (verde) ou ruim (vermelho). */
  trendPolarity?: 'up-good' | 'up-bad';
  /** Base do cálculo da tendência. */
  trendBasis?: 'first-vs-last' | 'prev-vs-last';
  /** Mostra a tendência desenhada. */
  showSparkline?: boolean;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

/** Rótulo usado quando o bloco não recebe título nem `label`. */
const DEFAULT_LABEL = 'Sinal';

/** Mensagem do estado sem dados (aceita Markdown e `{{variaveis}}`). */
const SIGNAL_EMPTY = 'Sem série para desenhar';

/**
 * Variação como fração. `prev-vs-last` compara com o ponto anterior (o
 * movimento recente); `first-vs-last`, com o começo do período. Sem base válida
 * — série curta ou base zero — não há variação: um "+∞%" seria pior que nada.
 */
function computeTrend(
  values: number[],
  basis: 'first-vs-last' | 'prev-vs-last',
): number | undefined {
  if (values.length < 2) return undefined;
  const last = values[values.length - 1];
  const base = basis === 'prev-vs-last' ? values[values.length - 2] : values[0];
  if (base === 0) return undefined;
  return (last - base) / Math.abs(base);
}

export const Component: BlockComponent<SignalProps, SeriesData> = ({
  props,
  data,
  state,
}) => {
  const points = (data ?? []) as SeriesPoint[];
  const values = points.map((point) => point.y ?? 0);
  const last = values.length > 0 ? values[values.length - 1] : null;
  const value = formatValueByEnum(last, props.valueFormat ?? 'compactNumber');

  // O valor JÁ FORMATADO entra no escopo: um texto que repete o número do
  // cartão precisa da mesma unidade que o cartão desenhou.
  const scope = buildChartScope(data, { valorFormatado: value });

  return (
    <SignalCard
      label={props.label ?? DEFAULT_LABEL}
      value={value}
      data={values}
      trend={computeTrend(values, props.trendBasis ?? 'prev-vs-last')}
      higherIsBetter={(props.trendPolarity ?? 'up-good') === 'up-good'}
      showSparkline={props.showSparkline ?? true}
      color={chartAccentColor(props.accent)}
      scope={scope}
      emptyMessage={SIGNAL_EMPTY}
      isLoading={state === 'loading' || state === 'skeleton'}
    />
  );
};

export const definition = defineBlock<SignalProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

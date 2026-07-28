/**
 * Bloco `spark_chart` (shape 'series') — minigráfico de tendência sobre o
 * `SparkChart` de `@/shared/ui`. Sem eixos e sem grade: é o desenho que
 * acompanha um número, não um gráfico para ler valor.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL — `BRIEFING-SUBAGENTE.md` §4 sobre
 * `04-widgets-prontos.md` §2.3/§2.4 (mini-gráfico do card de resumo)
 * ---------------------------------------------------------------------------
 * 1. Grade só horizontal, tracejada 3 ...... N/A — o modo sparkline não tem grade (§2.3)
 * 2. Eixos sem linha e sem marcações ....... N/A — o modo sparkline não tem eixo (§2.3)
 * 3. Texto de eixo 12px/400/#919EAB ........ N/A — sem eixo não há texto de eixo
 * 4. Linha, curva suave, sem pontos ........ `geometry.sparkLineWidth` + `curve` (monotone) + `dot={false}`
 * 5. Coluna com raio no topo ............... §2.4 SOBREPÕE a base: raio 1,5px só na ponta, coluna 64%, traço 0
 * 6. Hover ESCURECE ........................ `darkenColor` no `activeBar`; marcador com `strokeWidth: 0` (§2.3)
 *    …e o marcador com 6px de DIÂMETRO ..... `chartSparkMarkerProps` — o MESMO ponto da linha e da dispersão
 *                                            (o spark já dividia o token por 2; agora todos dividem)
 * 7. Tooltip branco 90% com blur ........... `ChartTooltip` com o VALOR formatado e SEM título (§2.3)
 * + Margem ................................. `CHART_SPARK_MARGIN` — `grid.padding` de 6px em todos os lados (§2.3)
 * + Cor .................................... tom `dark` da família (`primary.dark`), não a `main` (§2.3)
 * + Dimensões .............................. linha 84×56, barra 60×40, área 100×66 (§2.4)
 * + Animação ............................... 360ms (`chartAnimationProps`, `02-configuracao-base` §3)
 *
 * ---------------------------------------------------------------------------
 * CONTRATO COMUM (`BRIEFING-SUBAGENTE.md` §5)
 * ---------------------------------------------------------------------------
 *  - CABEÇALHO: desenhado pelo `BlockFrame` — o bloco não repete título.
 *  - DADOS: `data` alimenta o desenho E o escopo de `{{variaveis}}`.
 *  - MARKDOWN + `{{interpolação}}`: rótulo acessível, resumo e mensagem de
 *    vazio passam por `chartPlainText`/`ChartFrame` com `buildChartScope(data)`.
 *  - ESTADOS: `loading`/`skeleton` → `isLoading`; `error` → `state="error"`.
 *  - ACESSIBILIDADE: sem eixo, o texto é a ÚNICA leitura possível — o bloco
 *    publica a série como tabela para leitor de tela, além do rótulo.
 */
import type { SeriesData } from '@dashboards/contracts';
import {
  ChartDataTable,
  SparkChart,
  buildChartScope,
  chartAccentColor,
  chartPlainText,
} from '@/shared/ui';
import { formatCompactNumberBR } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SparkProps = {
  type?: 'area' | 'bar' | 'line';
  curveType?: 'linear' | 'monotone' | 'step';
  palette?: 'single' | 'multi' | 'none';
  /** Cor da série; resolvida para token do DS. */
  accent?: string;
};

type SeriesPoint = { x: string | number; y: number | null; series?: string };

/** Rótulo acessível: sem eixo nem legenda, é a única descrição do desenho. */
const SPARK_LABEL = 'Minigráfico de tendência';

/**
 * Equivalente textual da tendência. Como todo texto do catálogo, aceita
 * Markdown e `{{variavel}}` — aqui as variáveis vêm do próprio dado.
 */
const SPARK_SUMMARY =
  '{{contagem}} pontos. Menor {{minimo}}, maior {{maximo}}, último {{ultimo}}.';

/** Mensagem do estado sem dados (aceita Markdown e `{{variaveis}}`). */
const SPARK_EMPTY = 'Sem dados para desenhar a tendência';

/** Mensagem do estado de erro. */
const SPARK_ERROR = 'Erro ao carregar os dados';

export const Component: BlockComponent<SparkProps, SeriesData> = ({
  props,
  data,
  state,
  error,
}) => {
  const points = (data ?? []) as SeriesPoint[];
  const values = points.map((point) => point.y ?? 0);
  const scope = buildChartScope(data);

  // `multi` era o gradiente arco-íris do legado: numa série só, cor não carrega
  // informação nenhuma. Nesse modo a série cai na cor padrão do mini-gráfico.
  const accent = props.palette === 'multi' ? undefined : chartAccentColor(props.accent);

  return (
    <>
      <SparkChart
        data={values}
        type={props.type ?? 'area'}
        color={accent}
        curve={props.curveType ?? 'monotone'}
        label={SPARK_LABEL}
        scope={scope}
        summary={points.length > 0 ? chartPlainText(SPARK_SUMMARY, scope) : undefined}
        valueFormatter={formatCompactNumberBR}
        isLoading={state === 'loading' || state === 'skeleton'}
        state={state === 'error' ? 'error' : undefined}
        errorMessage={state === 'error' ? (error ?? SPARK_ERROR) : undefined}
        emptyMessage={SPARK_EMPTY}
      />
      <ChartDataTable
        caption={`${manifest.name}: valores da série`}
        columns={['Ponto', 'Valor']}
        rows={points.map((point, index) => [
          String(point.x ?? index + 1),
          formatCompactNumberBR(point.y ?? 0),
        ])}
      />
    </>
  );
};

/** Insights de rodapé: direção da tendência e alcance dos valores. */
function deriveTakeaway(data: SeriesData): string[] | undefined {
  const points = (data ?? []) as SeriesPoint[];
  if (points.length === 0) return undefined;

  const values = points.map((point) => point.y ?? 0);
  const first = values[0];
  const last = values[values.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (first === 0 && last !== 0) {
    return [
      `Tendência: alta (de 0 para ${formatCompactNumberBR(last)})`,
      `Faixa: ${formatCompactNumberBR(min)}–${formatCompactNumberBR(max)}`,
    ];
  }

  // Variação do primeiro ao último ponto, limitada para não virar "9999%" num
  // outlier — o número aqui é leitura rápida, não análise.
  const delta =
    first === 0
      ? 0
      : Math.max(-999, Math.min(999, ((last - first) / Math.abs(first)) * 100));
  const direction = Math.abs(delta) < 0.5 ? 'estável' : delta > 0 ? 'alta' : 'queda';

  const insights = [
    `Tendência: ${direction} (${delta > 0 ? '+' : ''}${delta.toFixed(1)}%)`,
  ];
  if (points.length > 1) {
    insights.push(`Faixa: ${formatCompactNumberBR(min)}–${formatCompactNumberBR(max)}`);
  }
  return insights;
}

export const definition = defineBlock<SparkProps, SeriesData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;

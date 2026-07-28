/**
 * Bloco `graph_chart` (shape 'table') — GRAFO/rede: nós ligados por arestas,
 * sobre a casca comum dos gráficos (`ChartFrame` de `@/shared/ui`).
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL — `03-tipos-de-grafico.md`
 * ---------------------------------------------------------------------------
 * Grafo NÃO existe na referência (ela cobre 18 tipos cartesianos, circulares e
 * medidores). Repaginado por ANALOGIA com a DISPERSÃO (§15), o outro tipo em
 * que o dado é uma NUVEM DE MARCAS e não uma série:
 *
 *  1. Grade só horizontal, tracejada 3 .... N/A — não há plano cartesiano: a
 *     posição de um nó não é medida, é resultado do layout. Desenhar grade
 *     prometeria um eixo que não existe.
 *  2. Eixos sem linha e sem marcações ..... N/A — idem.
 *  3. Texto dos eixos 12px/400/#919EAB .... OK — é a tipografia dos RÓTULOS dos
 *     nós (`typography.axis` + `chrome('label')`).
 *  4. Linha 2,5px, sem pontos ............. OK — é o TETO da espessura da
 *     aresta (`geometry.lineWidth`); o piso é 1px.
 *  5. Coluna raio 4px, largura 48% ........ N/A — não há coluna.
 *  6. Hover ESCURECE ...................... ADAPTADO — escurecer um nó de 12px
 *     não se enxerga. O realce aqui é de VIZINHANÇA: o nó sob o cursor e quem
 *     ele toca ficam cheios, o resto apaga, e as arestas ligadas assumem a cor
 *     do nó. Mesma intenção, na escala em que ela é visível.
 *  7. Tooltip branco 90% com blur ......... ADAPTADO — o tooltip da base é
 *     posicionado pelo recharts, que não desenha rede. Cada nó e cada aresta
 *     traz um `<title>` nativo do SVG: aparece no hover, sobrevive à impressão
 *     e não depende de JavaScript.
 *  + Cor por GRUPO ciclando a paleta categórica do DS — é ela que separa uma
 *    camada da outra; `accent` fixa cor única (regra de `chart-accent.ts`).
 *  + Altura de 280px (`CHART_HEIGHT.default`), a mesma dos demais gráficos.
 *  + Contrato comum de texto: escopo de `buildChartScope(data)` mais o
 *    vocabulário do grafo (`{{nos}}`, `{{ligacoes}}`, `{{camadas}}`,
 *    `{{grupos}}`).
 */
import { useMemo } from 'react';
import type { TableData } from '@dashboards/contracts';
import {
  CHART_HEIGHT,
  ChartFrame,
  ChartLegends,
  buildChartScope,
  useChartPalette,
} from '@/shared/ui';
import type { ChartLegendItem } from '@/shared/ui';
import type { ValueFormat } from '@/shared/lib/format';
import { fixedSeriesColor, type PaletteMode } from '../../lib/series-color';
import { formatCatalogValue } from '../../lib/value-format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { GraphCanvas } from './graph-canvas';
import { readGraph, type GraphModel } from './graph-data';
import { computeLayers, type GraphLayoutKind } from './graph-layout';
import { buildGraphView } from './graph-view';
import { manifest } from './manifest';
import { fixture } from './fixture';

type GraphChartProps = {
  layout?: GraphLayoutKind | string;
  showLabels?: boolean;
  showArrows?: boolean;
  linkStyle?: 'straight' | 'curved' | string;
  showLegend?: boolean;
  palette?: PaletteMode;
  /** Cor de TODOS os nós; declarada, vence o modo de paleta. */
  accent?: string;
  valueFormat?: ValueFormat;
};

/** Layout efetivo — valor desconhecido cai no padrão, nunca quebra o render. */
function resolveLayout(raw: unknown): GraphLayoutKind {
  return raw === 'layered' || raw === 'radial' ? raw : 'force';
}

export const Component: BlockComponent<GraphChartProps, TableData> = ({
  props,
  data,
  state,
  error,
}) => {
  const palette = useChartPalette();
  const model = useMemo(() => readGraph(data), [data]);

  /**
   * COR — a regra de precedência publicada em `chart-accent.ts`: `accent`
   * reconhecível vence sempre (pedir uma cor É pedir cor única) e
   * `palette: "multi"` só cicla quando não há acento. `fixedSeriesColor` é a
   * mesma decisão que os outros blocos de série usam, sem recopiar a condição.
   */
  const fixed = fixedSeriesColor({ palette: props.palette, accent: props.accent });
  const fixedColor = fixed ? palette.colorAt(0, fixed) : undefined;

  const layout = resolveLayout(props.layout);
  const valueFormat = props.valueFormat;

  const view = useMemo(
    () =>
      buildGraphView(model, {
        colorAt: (index) => palette.colorAt(index),
        fixedColor,
        formatValue: (value) => formatCatalogValue(value, valueFormat),
      }),
    [model, palette, fixedColor, valueFormat],
  );

  // Quantas camadas o dado tem — para a leitura textual e o `{{camadas}}`. O
  // POSICIONAMENTO por camada acontece no canvas, que é quem mede o card.
  const layerCount = useMemo(() => {
    if (model.nodes.length === 0) return 0;
    return Math.max(...computeLayers(model).values()) + 1;
  }, [model]);

  const scope = buildChartScope(data, {
    nos: model.nodes.length,
    ligacoes: model.edges.length,
    camadas: layerCount,
    grupos: view.groups.length,
  });

  /**
   * Legenda de GRUPOS. Com cor única ela some junto com a distinção que
   * justifica sua existência: cinco rótulos pintados da mesma cor não são uma
   * legenda, são cinco linhas de texto no rodapé.
   */
  const legend: ChartLegendItem[] =
    props.showLegend !== false && !fixedColor
      ? view.groups.map((group, index) => ({
          label: group,
          color: palette.varAt(index),
          value: describeGroup(model, group, (value) =>
            formatCatalogValue(value, valueFormat),
          ),
        }))
      : [];

  return (
    <ChartFrame
      label={manifest.name}
      summary={describeGraph(model, view.groups.length, layerCount)}
      scope={scope}
      height={CHART_HEIGHT.default}
      isLoading={state === 'loading' || state === 'skeleton'}
      state={state === 'error' ? 'error' : undefined}
      errorMessage={error}
      isEmpty={model.nodes.length === 0}
      // Sem eixo Y, o padding assimétrico da referência (8px à esquerda, 20px
      // nos outros lados) não tem o que compensar. O respiro do grafo é a
      // margem do próprio desenho, que reserva o raio do maior nó e a altura
      // do rótulo — reservar duas vezes só encolheria a área útil.
      isBare
      footer={legend.length > 0 ? <ChartLegends items={legend} /> : null}
    >
      <GraphCanvas
        model={model}
        view={view}
        layout={layout}
        height={CHART_HEIGHT.default}
        showLabels={props.showLabels !== false}
        showArrows={props.showArrows !== false}
        curved={props.linkStyle === 'curved'}
      />
    </ChartFrame>
  );
};

/** Total do grupo — valor somado quando há medida; senão, quantos nós. */
function describeGroup(
  model: GraphModel,
  group: string,
  formatValue: (value: number) => string,
): string {
  const nodes = model.nodes.filter((node) => node.group === group);
  const measured = nodes.filter((node) => node.value != null);
  if (measured.length === 0) {
    return `${nodes.length} ${nodes.length === 1 ? 'nó' : 'nós'}`;
  }
  return formatValue(measured.reduce((sum, node) => sum + (node.value ?? 0), 0));
}

/**
 * Equivalente textual — o que um leitor de tela recebe no lugar do desenho.
 * Ler 40 nós em voz alta não ajuda ninguém a entender uma rede; o que informa
 * é o tamanho dela, quantos grupos e quantas camadas.
 */
function describeGraph(model: GraphModel, groups: number, layers: number): string {
  const { nodes, edges } = model;
  if (nodes.length === 0) return 'Grafo sem nós';

  const parts = [
    `${nodes.length} ${nodes.length === 1 ? 'nó' : 'nós'}`,
    `${edges.length} ${edges.length === 1 ? 'ligação' : 'ligações'}`,
  ];
  if (groups > 1) parts.push(`${groups} grupos`);
  if (layers > 1) parts.push(`${layers} camadas`);
  return `Grafo com ${parts.join(', ')}`;
}

/** Insights de rodapé: tamanho da rede, nó mais conectado e maior fluxo. */
function deriveTakeaway(data: TableData, props?: GraphChartProps): string[] | undefined {
  const model = readGraph(data);
  if (model.nodes.length === 0) return undefined;

  const layers = computeLayers(model);
  const depth = Math.max(...layers.values()) + 1;

  const insights = [
    `${model.nodes.length} nós e ${model.edges.length} ligações` +
      (depth > 1 ? ` em ${depth} camadas` : ''),
  ];

  const hub = mostConnected(model);
  if (hub) insights.push(`Nó mais conectado: ${hub.label} (${hub.degree} ligações)`);

  const flow = biggestFlow(model);
  if (flow) {
    insights.push(
      `Maior ligação: ${flow.path} (${formatCatalogValue(flow.value, props?.valueFormat)})`,
    );
  }

  return insights;
}

/** O nó com mais ligações (empate: o primeiro declarado). */
function mostConnected(model: GraphModel): { label: string; degree: number } | undefined {
  const degrees = new Map<string, number>();
  for (const edge of model.edges) {
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
  }

  let best: { label: string; degree: number } | undefined;
  for (const node of model.nodes) {
    const degree = degrees.get(node.id) ?? 0;
    if (degree > 0 && (!best || degree > best.degree)) {
      best = { label: node.label, degree };
    }
  }
  return best;
}

/** A ligação de maior valor — o caminho por onde mais coisa passa. */
function biggestFlow(model: GraphModel): { path: string; value: number } | undefined {
  const labels = new Map(model.nodes.map((node) => [node.id, node.label]));
  let best: { path: string; value: number } | undefined;
  for (const edge of model.edges) {
    if (edge.value == null) continue;
    if (!best || edge.value > best.value) {
      const from = labels.get(edge.source) ?? edge.source;
      const to = labels.get(edge.target) ?? edge.target;
      best = { path: `${from} → ${to}`, value: edge.value };
    }
  }
  return best;
}

export const definition = defineBlock<GraphChartProps, TableData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;

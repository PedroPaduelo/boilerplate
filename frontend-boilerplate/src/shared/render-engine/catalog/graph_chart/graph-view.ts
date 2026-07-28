/**
 * MODELO DE DESENHO — junta dado (`graph-data`), posição (`graph-layout`) e
 * cor do tema num objeto que o `graph-canvas` só precisa pintar.
 *
 * Continua PURO: as cores entram como função (`colorAt`), já resolvidas pelo
 * `useChartPalette` de quem chama. É o que permite testar tamanho, cor por
 * grupo e vizinhança sem montar React — e o que impede este arquivo de
 * inventar uma cor.
 *
 * ---------------------------------------------------------------------------
 * ESCALA DO NÓ E DA ARESTA — degraus do tema, não números novos
 * ---------------------------------------------------------------------------
 * O nó é uma MARCA DE DADO, então o diâmetro anda na escala de espessura do
 * `chart-theme`: do degrau da barra de lista (12px) ao da coluna com eixo
 * (32px). A aresta é o TRAÇO que carrega o dado: vai de 1px até a espessura de
 * linha da referência (2,5px). Nenhuma medida nova é criada aqui — é a mesma
 * decisão que impediu o catálogo de voltar a ter sete espessuras para a mesma
 * ideia.
 *
 * A área cresce com a RAIZ do valor (e não linearmente com o raio): dobrar o
 * valor deve dobrar a mancha de tinta, não o diâmetro — senão um nó dez vezes
 * maior fica cem vezes mais pesado na tela.
 */
import { CHART_GEOMETRY } from '@/shared/ui';
import { degreesOf, groupsOf, type GraphModel, type GraphNode } from './graph-data';
import { layoutGraph, type GraphFit, type GraphLayoutKind } from './graph-layout';

/** Faixa de DIÂMETRO do nó, em px — degraus de espessura do tema. */
const NODE_DIAMETER = {
  min: CHART_GEOMETRY.trackThickness,
  max: CHART_GEOMETRY.barMaxWidth,
} as const;

/** Faixa de espessura da aresta, em px. */
const EDGE_WIDTH = { min: 1, max: CHART_GEOMETRY.lineWidth } as const;

export interface GraphViewNode extends GraphNode {
  /** Posição no quadrado unitário. */
  x: number;
  y: number;
  layer: number;
  /** Raio em px. */
  radius: number;
  /** Cor RESOLVIDA (vai para atributo de SVG, que não aceita `var()`). */
  color: string;
  /** Ligações que tocam o nó. */
  degree: number;
  /** Texto do tooltip nativo (`<title>`). */
  title: string;
}

export interface GraphViewEdge {
  /** Chave estável de render. */
  id: string;
  source: string;
  target: string;
  /** Espessura em px. */
  width: number;
  title: string;
}

export interface GraphView {
  nodes: GraphViewNode[];
  edges: GraphViewEdge[];
  /** Grupos na ordem de aparição — a ordem das cores e da legenda. */
  groups: string[];
  layerCount: number;
  fit: GraphFit;
  /** Proporção ocupada pelo desenho (maior lado = 1) — vem do layout. */
  extent: { x: number; y: number };
  /** Vizinhança de cada nó — usada pelo realce no hover. */
  neighbours: Map<string, Set<string>>;
}

export interface GraphViewOptions {
  layout: GraphLayoutKind;
  /** Cor resolvida do grupo `index` (cicla a paleta categórica). */
  colorAt: (index: number) => string;
  /** Cor única: quando definida, vence o grupo (regra de `chart-accent`). */
  fixedColor?: string;
  /** Formatador dos valores exibidos nos tooltips. */
  formatValue: (value: number) => string;
}

/** Monta o modelo de desenho do grafo. */
export function buildGraphView(model: GraphModel, options: GraphViewOptions): GraphView {
  const { points, layerCount, fit, extent } = layoutGraph(model, options.layout);
  const degrees = degreesOf(model);
  const groups = groupsOf(model);

  // Tamanho por VALOR quando a consulta mediu alguma coisa; senão, por número
  // de ligações — que é a única grandeza que todo grafo tem.
  const hasValue = model.nodes.some((node) => node.value != null);
  const weightOf = (node: GraphNode) =>
    hasValue ? (node.value ?? 0) : (degrees.get(node.id) ?? 0);
  const weights = model.nodes.map(weightOf);
  const nodeScale = makeScale(weights, NODE_DIAMETER.min, NODE_DIAMETER.max);

  const labels = new Map(model.nodes.map((node) => [node.id, node.label]));

  const nodes: GraphViewNode[] = model.nodes.map((node) => {
    const point = points.get(node.id);
    const degree = degrees.get(node.id) ?? 0;
    const groupIndex = node.group ? groups.indexOf(node.group) : 0;
    return {
      ...node,
      x: point?.x ?? 0.5,
      y: point?.y ?? 0.5,
      layer: point?.layer ?? 0,
      radius: nodeScale(weightOf(node)) / 2,
      color: options.fixedColor ?? options.colorAt(groupIndex),
      degree,
      title: nodeTitle(node, degree, options.formatValue),
    };
  });

  const edgeValues = model.edges.map((edge) => edge.value ?? 0);
  const edgeScale = makeScale(edgeValues, EDGE_WIDTH.min, EDGE_WIDTH.max);

  const edges: GraphViewEdge[] = model.edges.map((edge, i) => ({
    id: `${edge.source}→${edge.target}#${i}`,
    source: edge.source,
    target: edge.target,
    width: edgeScale(edge.value ?? 0),
    title: edgeTitle(edge.label, labels, edge, options.formatValue),
  }));

  return {
    nodes,
    edges,
    groups,
    layerCount,
    fit,
    extent,
    neighbours: neighboursOf(model),
  };
}

/**
 * Escala do peso para uma faixa de pixels, pela RAIZ do valor.
 *
 * Todos os pesos iguais (ou nenhum peso) → o degrau do MEIO da faixa: um grafo
 * sem medida não deve sair todo no tamanho mínimo, que lê como "tudo
 * irrelevante", nem no máximo, que lê como "tudo urgente".
 */
function makeScale(
  weights: number[],
  min: number,
  max: number,
): (value: number) => number {
  const valid = weights.filter((weight) => Number.isFinite(weight) && weight > 0);
  const lowest = valid.length > 0 ? Math.min(...valid) : 0;
  const highest = valid.length > 0 ? Math.max(...valid) : 0;
  const span = highest - lowest;
  const middle = (min + max) / 2;

  return (value: number) => {
    if (span <= 0 || !Number.isFinite(value)) return middle;
    const ratio = Math.sqrt(Math.max(value - lowest, 0) / span);
    return min + (max - min) * ratio;
  };
}

/** "Inscrito em DA · 2.774.676 · 3 ligações · N2 · Cobrança" */
function nodeTitle(
  node: GraphNode,
  degree: number,
  formatValue: (value: number) => string,
): string {
  const parts = [node.label];
  if (node.value != null) parts.push(formatValue(node.value));
  parts.push(`${degree} ${degree === 1 ? 'ligação' : 'ligações'}`);
  if (node.group) parts.push(node.group);
  return parts.join(' · ');
}

/** "Lançado → Inscrito em DA · 2.774.676" (ou o rótulo declarado). */
function edgeTitle(
  label: string | undefined,
  labels: Map<string, string>,
  edge: { source: string; target: string; value?: number },
  formatValue: (value: number) => string,
): string {
  const base =
    label ??
    `${labels.get(edge.source) ?? edge.source} → ${labels.get(edge.target) ?? edge.target}`;
  return edge.value == null ? base : `${base} · ${formatValue(edge.value)}`;
}

/** Quem toca quem (ligação em qualquer sentido). */
function neighboursOf({ edges }: GraphModel): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const add = (from: string, to: string) => {
    const set = map.get(from);
    if (set) set.add(to);
    else map.set(from, new Set([to]));
  };
  for (const edge of edges) {
    add(edge.source, edge.target);
    add(edge.target, edge.source);
  }
  return map;
}

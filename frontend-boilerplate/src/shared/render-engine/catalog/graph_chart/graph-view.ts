/**
 * MODELO DE DESENHO — junta dado (`graph-data`) e cor do tema num objeto que o
 * `graph-canvas` só precisa pintar: cor, tamanho, texto de apoio e vizinhança.
 *
 * O que NÃO está aqui é a POSIÇÃO. Ela depende da proporção do retângulo em que
 * o desenho vai aparecer (uma rede num card 5:1 não se organiza como num card
 * quadrado), e quem mede esse retângulo é o canvas. Misturar as duas coisas
 * obrigava o layout a adivinhar o formato do card — e a adivinhação errada
 * aparecia como um desenho pequeno no meio de um card largo e vazio.
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

/** Faixa de DIÂMETRO do nó, em px — degraus de espessura do tema. */
const NODE_DIAMETER = {
  min: CHART_GEOMETRY.trackThickness,
  max: CHART_GEOMETRY.barMaxWidth,
} as const;

/** Faixa de espessura da aresta, em px. */
const EDGE_WIDTH = { min: 1, max: CHART_GEOMETRY.lineWidth } as const;

/**
 * DENSIDADE — a marca encolhe conforme a rede cresce.
 *
 * Os degraus do tema (nó de 12 a 32px, aresta de 1 a 2,5px) foram calibrados
 * para o card com algumas dezenas de marcas. Aplicados a uma rede de 200 nós no
 * mesmo card, viram uma mancha: 200 discos de 12px não cabem em 280px de altura
 * e as arestas de 2,5px empastam o desenho. Um grafo grande é feito de pontos
 * pequenos e fios finos — é assim em toda ferramenta do gênero.
 *
 * O fator é `sqrt(referência / nº de nós)`: a RAIZ porque o que satura a tela é
 * ÁREA, não diâmetro (dobrar o número de nós pede um raio 1,41× menor, não 2×).
 * Nunca AUMENTA a marca — rede pequena continua nos degraus do tema.
 */
const DENSITY_REFERENCE = 24;

/**
 * Piso absoluto da marca. Calibrado OLHANDO o card renderizado: com 3,5px de
 * diâmetro e o halo da superfície por cima, o satélite quase desaparecia — a
 * rede densa saía lavada. 4px é o menor ponto que ainda se lê como ponto.
 */
const NODE_FLOOR = { min: 4, max: 12 } as const;

/** Piso absoluto do fio: abaixo disto a aresta some no fundo. */
const EDGE_FLOOR = { min: 0.5, max: 1 } as const;

/** Fator de encolhimento da marca para uma rede de `count` nós (≤ 1). */
function densityScale(count: number): number {
  return Math.min(1, Math.sqrt(DENSITY_REFERENCE / Math.max(count, 1)));
}

export interface GraphViewNode extends GraphNode {
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
  /** Vizinhança de cada nó — usada pelo realce no hover. */
  neighbours: Map<string, Set<string>>;
}

export interface GraphViewOptions {
  /** Cor resolvida do grupo `index` (cicla a paleta categórica). */
  colorAt: (index: number) => string;
  /** Cor única: quando definida, vence o grupo (regra de `chart-accent`). */
  fixedColor?: string;
  /** Formatador dos valores exibidos nos tooltips. */
  formatValue: (value: number) => string;
}

/** Monta o modelo de desenho do grafo (cor, tamanho e texto — sem posição). */
export function buildGraphView(model: GraphModel, options: GraphViewOptions): GraphView {
  const degrees = degreesOf(model);
  const groups = groupsOf(model);

  // Tamanho por VALOR quando a consulta mediu alguma coisa; senão, por número
  // de ligações — que é a única grandeza que todo grafo tem.
  const hasValue = model.nodes.some((node) => node.value != null);
  const weightOf = (node: GraphNode) =>
    hasValue ? (node.value ?? 0) : (degrees.get(node.id) ?? 0);
  const density = densityScale(model.nodes.length);
  const weights = model.nodes.map(weightOf);
  const nodeScale = makeScale(
    weights,
    Math.max(NODE_DIAMETER.min * density, NODE_FLOOR.min),
    Math.max(NODE_DIAMETER.max * density, NODE_FLOOR.max),
  );

  const labels = new Map(model.nodes.map((node) => [node.id, node.label]));

  const nodes: GraphViewNode[] = model.nodes.map((node) => {
    const degree = degrees.get(node.id) ?? 0;
    const groupIndex = node.group ? groups.indexOf(node.group) : 0;
    return {
      ...node,
      radius: nodeScale(weightOf(node)) / 2,
      color: options.fixedColor ?? options.colorAt(groupIndex),
      degree,
      title: nodeTitle(node, degree, options.formatValue),
    };
  });

  const edgeValues = model.edges.map((edge) => edge.value ?? 0);
  const edgeScale = makeScale(
    edgeValues,
    Math.max(EDGE_WIDTH.min * density, EDGE_FLOOR.min),
    Math.max(EDGE_WIDTH.max * density, EDGE_FLOOR.max),
  );

  const edges: GraphViewEdge[] = model.edges.map((edge, i) => ({
    id: `${edge.source}→${edge.target}#${i}`,
    source: edge.source,
    target: edge.target,
    width: edgeScale(edge.value ?? 0),
    title: edgeTitle(edge.label, labels, edge, options.formatValue),
  }));

  return { nodes, edges, groups, neighbours: neighboursOf(model) };
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

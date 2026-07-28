/**
 * POSICIONAMENTO dos nós — funções PURAS que traduzem o grafo em coordenadas
 * no quadrado unitário [0,1]². Quem converte para pixel é o `graph-canvas`.
 *
 * ---------------------------------------------------------------------------
 * POR QUE O LAYOUT É CALCULADO AQUI, E NÃO ANIMADO NA TELA
 * ---------------------------------------------------------------------------
 * A referência mental de um grafo (Obsidian, Gephi) é uma simulação que roda
 * quadro a quadro e nunca "termina". Isso é ótimo para explorar e péssimo para
 * um painel: o mesmo dado desenharia diferente a cada visita, a exportação em
 * PDF pegaria a simulação no meio, e o teste não teria o que afirmar.
 *
 * Aqui a simulação roda UMA vez, síncrona, com posições iniciais determinísticas
 * (espiral de ângulo áureo — sem número aleatório em lugar nenhum) e um número
 * fixo de iterações. Mesmos dados, mesmo desenho, sempre — na tela, no papel e
 * no teste. O movimento que sobra é o do HOVER, que é resposta ao usuário, não
 * ruído de fundo.
 *
 * Três layouts, cada um respondendo a uma pergunta diferente:
 *   force    — "como isto se conecta?"        (rede sem hierarquia)
 *   layered  — "por onde o volume passa?"     (funil: uma coluna por camada)
 *   radial   — "o que está longe do centro?"  (hierarquia em anéis)
 */
import type { GraphModel } from './graph-data';

/** Layouts publicados no `propsSchema` do bloco. */
export type GraphLayoutKind = 'force' | 'layered' | 'radial';

/** Posição de um nó no quadrado unitário. */
export interface GraphPoint {
  id: string;
  x: number;
  y: number;
  /** Camada do nó (declarada ou deduzida) — usada também na leitura textual. */
  layer: number;
}

/**
 * Como o canvas deve ocupar o retângulo disponível:
 *
 *  - `stretch` estica até as bordas, cada eixo com o seu fator. Só vale para
 *    layout em GRADE (o `layered`): lá a posição é "coluna 2, linha 3", e
 *    alargar a coluna não distorce leitura nenhuma — é o que faz o funil usar
 *    a largura toda do card.
 *
 *  - `uniform` escala os dois eixos pelo MESMO fator e centraliza. Obrigatório
 *    onde a posição é geométrica: no `radial` (senão o anel vira elipse) e no
 *    `force`, em que a distância entre dois nós É a informação. Esticar uma
 *    simulação de forças num card 5:1 espalhava os nós numa faixa horizontal e
 *    fazia vizinhos igualmente distantes parecerem a dois passos de distância —
 *    exatamente a leitura que o layout existe para dar.
 */
export type GraphFit = 'stretch' | 'uniform';

export interface GraphLayout {
  points: Map<string, GraphPoint>;
  layerCount: number;
  fit: GraphFit;
  /**
   * Proporção ocupada pelo desenho, com o maior lado valendo 1 (ex.: uma rede
   * duas vezes mais larga que alta devolve `{ x: 1, y: 0.5 }`). É o que permite
   * ao canvas escalar pelo conteúdo REAL em vez de assumir um quadrado —
   * uma rede achatada centralizada num quadrado desperdiçaria metade do card.
   */
  extent: { x: number; y: number };
}

/** Proporção padrão: o desenho ocupa o quadrado inteiro. */
const FULL_EXTENT = { x: 1, y: 1 } as const;

/** Ângulo áureo — espalha os pontos iniciais sem repetir direção. */
const GOLDEN_ANGLE = 2.399963229728653;

/** Orçamento da simulação: iterações ≈ ORÇAMENTO / nº de nós, dentro da faixa. */
const FORCE_ITERATIONS = { budget: 3000, min: 60, max: 300 } as const;

/** Passo máximo inicial de um nó por iteração (em fração do quadro). */
const INITIAL_TEMPERATURE = 0.14;

/** Resfriamento por iteração — o passo encolhe até o desenho assentar. */
const COOLING = 0.95;

/** Atração ao centro: segura os componentes desconexos dentro do quadro. */
const GRAVITY = 0.02;

/** Distância mínima considerada entre dois nós (evita divisão por zero). */
const EPSILON = 1e-4;

/** Posiciona o grafo. Nunca devolve `NaN`: grafo vazio → mapa vazio. */
export function layoutGraph(model: GraphModel, kind: GraphLayoutKind): GraphLayout {
  const layers = computeLayers(model);
  const layerCount = model.nodes.length === 0 ? 0 : Math.max(...layers.values()) + 1;

  if (model.nodes.length === 0) {
    return { points: new Map(), layerCount: 0, fit: 'uniform', extent: FULL_EXTENT };
  }

  if (kind === 'layered') {
    return {
      points: layeredPoints(model, layers),
      layerCount,
      fit: 'stretch',
      extent: FULL_EXTENT,
    };
  }
  if (kind === 'radial') {
    return {
      points: radialPoints(model, layers, layerCount),
      layerCount,
      fit: 'uniform',
      extent: FULL_EXTENT,
    };
  }

  const { points, extent } = forcePoints(model, layers);
  return { points, layerCount, fit: 'uniform', extent };
}

/**
 * Camada de cada nó: a DECLARADA quando existe; senão, o caminho mais longo
 * desde uma origem (nó sem aresta entrando).
 *
 * A relaxação é iterativa e limitada ao número de nós, o que resolve o caso
 * chato sem precisar detectar ciclo: numa rede cíclica a profundidade pararia
 * de crescer sozinha, e o teto garante que ela pare mesmo.
 */
export function computeLayers({ nodes, edges }: GraphModel): Map<string, number> {
  const layers = new Map<string, number>();
  for (const node of nodes) layers.set(node.id, node.layer ?? 0);

  const declared = new Set(nodes.filter((n) => n.layer != null).map((n) => n.id));
  const limit = nodes.length;

  for (let pass = 0; pass < limit; pass += 1) {
    let changed = false;
    for (const edge of edges) {
      // Camada declarada é escolha do autor: nunca é empurrada pelo caminho.
      if (declared.has(edge.target)) continue;
      const from = layers.get(edge.source);
      const to = layers.get(edge.target);
      if (from == null || to == null) continue;
      if (from + 1 > to && from + 1 < limit) {
        layers.set(edge.target, from + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }

  return layers;
}

/* ========================================================================== *
 * FORCE — simulação de forças (Fruchterman–Reingold), uma passada só
 * ========================================================================== */

function forcePoints(
  model: GraphModel,
  layers: Map<string, number>,
): { points: Map<string, GraphPoint>; extent: { x: number; y: number } } {
  const { nodes, edges } = model;
  const count = nodes.length;
  const index = new Map(nodes.map((node, i) => [node.id, i]));

  const xs = new Float64Array(count);
  const ys = new Float64Array(count);
  // Espiral de ângulo áureo: pontos bem distribuídos e SEM aleatoriedade — é o
  // que torna o desenho reproduzível entre sessões, máquinas e testes.
  for (let i = 0; i < count; i += 1) {
    const radius = 0.45 * Math.sqrt((i + 0.5) / count);
    const angle = i * GOLDEN_ANGLE;
    xs[i] = 0.5 + radius * Math.cos(angle);
    ys[i] = 0.5 + radius * Math.sin(angle);
  }

  const links = edges
    .map((edge) => [index.get(edge.source), index.get(edge.target)] as const)
    .filter(
      (pair): pair is readonly [number, number] => pair[0] != null && pair[1] != null,
    );

  // Distância de repouso entre nós num quadro de área 1.
  const k = Math.sqrt(1 / count);
  const iterations = Math.min(
    FORCE_ITERATIONS.max,
    Math.max(FORCE_ITERATIONS.min, Math.round(FORCE_ITERATIONS.budget / count)),
  );

  const dx = new Float64Array(count);
  const dy = new Float64Array(count);
  let temperature = INITIAL_TEMPERATURE;

  for (let step = 0; step < iterations; step += 1) {
    dx.fill(0);
    dy.fill(0);

    // Repulsão entre todos os pares (o que abre o desenho).
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        const vx = xs[i] - xs[j];
        const vy = ys[i] - ys[j];
        const distance = Math.max(Math.hypot(vx, vy), EPSILON);
        const force = (k * k) / distance;
        const ux = (vx / distance) * force;
        const uy = (vy / distance) * force;
        dx[i] += ux;
        dy[i] += uy;
        dx[j] -= ux;
        dy[j] -= uy;
      }
    }

    // Atração ao longo das arestas (o que junta quem se conecta).
    for (const [from, to] of links) {
      const vx = xs[from] - xs[to];
      const vy = ys[from] - ys[to];
      const distance = Math.max(Math.hypot(vx, vy), EPSILON);
      const force = (distance * distance) / k;
      const ux = (vx / distance) * force;
      const uy = (vy / distance) * force;
      dx[from] -= ux;
      dy[from] -= uy;
      dx[to] += ux;
      dy[to] += uy;
    }

    for (let i = 0; i < count; i += 1) {
      dx[i] += (0.5 - xs[i]) * GRAVITY * count * k;
      dy[i] += (0.5 - ys[i]) * GRAVITY * count * k;
      const length = Math.max(Math.hypot(dx[i], dy[i]), EPSILON);
      const stepSize = Math.min(length, temperature);
      xs[i] += (dx[i] / length) * stepSize;
      ys[i] += (dy[i] / length) * stepSize;
    }

    temperature *= COOLING;
  }

  return normalize(model, xs, ys, layers);
}

/**
 * Reenquadra o resultado PRESERVANDO a proporção — um grafo em linha continua
 * uma linha, em vez de ser inflado até virar um quadrado. O reenquadramento é
 * necessário porque a simulação não respeita as bordas: ela só busca o
 * equilíbrio.
 *
 * O maior lado vira 1 e o outro vira a fração correspondente (`extent`), que o
 * canvas usa para escalar pelo conteúdo real. Centralizar aqui dentro de um
 * quadrado seria jogar fora essa informação — e foi assim que uma rede
 * achatada apareceu esticada de ponta a ponta num card largo.
 */
function normalize(
  model: GraphModel,
  xs: Float64Array,
  ys: Float64Array,
  layers: Map<string, number>,
): { points: Map<string, GraphPoint>; extent: { x: number; y: number } } {
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const span = Math.max(spanX, spanY);

  const points = new Map<string, GraphPoint>();

  // Nó único (ou todos no mesmo ponto): centro do quadro, sem divisão por zero.
  if (span <= EPSILON) {
    for (const node of model.nodes) {
      points.set(node.id, {
        id: node.id,
        x: 0.5,
        y: 0.5,
        layer: layers.get(node.id) ?? 0,
      });
    }
    return { points, extent: { ...FULL_EXTENT } };
  }

  model.nodes.forEach((node, i) => {
    points.set(node.id, {
      id: node.id,
      x: (xs[i] - minX) / span,
      y: (ys[i] - minY) / span,
      layer: layers.get(node.id) ?? 0,
    });
  });

  return { points, extent: { x: spanX / span, y: spanY / span } };
}

/* ========================================================================== *
 * LAYERED — uma coluna por camada (o layout do funil)
 * ========================================================================== */

function layeredPoints(
  model: GraphModel,
  layers: Map<string, number>,
): Map<string, GraphPoint> {
  const columns = groupByLayer(model, layers);
  orderByBarycenter(model, columns);

  const points = new Map<string, GraphPoint>();
  const last = columns.length - 1;
  columns.forEach((ids, layer) => {
    const x = last === 0 ? 0.5 : layer / last;
    ids.forEach((id, i) => {
      points.set(id, { id, x, y: (i + 0.5) / ids.length, layer });
    });
  });
  return points;
}

/* ========================================================================== *
 * RADIAL — uma camada por anel
 * ========================================================================== */

function radialPoints(
  model: GraphModel,
  layers: Map<string, number>,
  layerCount: number,
): Map<string, GraphPoint> {
  const columns = groupByLayer(model, layers);
  orderByBarycenter(model, columns);

  // Camada inicial com um nó só vira o CENTRO; com mais de um, o primeiro anel
  // já se abre — senão os nós se empilhariam todos no mesmo ponto.
  const inner = columns[0]?.length === 1 ? 0 : 0.12;
  const outer = 0.46;

  const points = new Map<string, GraphPoint>();
  columns.forEach((ids, layer) => {
    const radius =
      layerCount <= 1 ? outer : inner + (outer - inner) * (layer / (layerCount - 1));
    // Cada anel gira um pouco: sem isso, todas as camadas alinham os nós no
    // mesmo raio e as arestas viram um feixe de linhas sobrepostas.
    const spin = layer * GOLDEN_ANGLE * 0.25;
    ids.forEach((id, i) => {
      const angle = (2 * Math.PI * (i + 0.5)) / ids.length + spin;
      points.set(id, {
        id,
        x: 0.5 + radius * Math.cos(angle),
        y: 0.5 + radius * Math.sin(angle),
        layer,
      });
    });
  });
  return points;
}

/* ========================================================================== *
 * Apoio comum aos layouts hierárquicos
 * ========================================================================== */

/** Ids agrupados por camada, na ordem em que a consulta os descreveu. */
function groupByLayer(model: GraphModel, layers: Map<string, number>): string[][] {
  let depth = 0;
  for (const node of model.nodes) depth = Math.max(depth, layers.get(node.id) ?? 0);

  // Lista criada COMPLETA (inclusive camadas vazias, que acontecem quando a
  // consulta declara `camada` com buraco): um furo no meio viraria `undefined`
  // e derrubaria a ordenação.
  const columns: string[][] = Array.from({ length: depth + 1 }, () => []);
  for (const node of model.nodes) columns[layers.get(node.id) ?? 0].push(node.id);
  return columns;
}

/**
 * Reordena cada camada pela média das posições dos vizinhos da camada anterior
 * (heurística do baricentro) — é o que desembaraça os cruzamentos de um funil.
 * Uma passada para frente e uma para trás bastam: o ganho da terceira é
 * invisível e o custo é real em redes grandes.
 */
function orderByBarycenter(model: GraphModel, columns: string[][]): void {
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  const link = (map: Map<string, string[]>, key: string, value: string) => {
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  };
  for (const edge of model.edges) {
    link(incoming, edge.target, edge.source);
    link(outgoing, edge.source, edge.target);
  }

  const rank = new Map<string, number>();
  const refreshRanks = () => {
    for (const ids of columns) {
      ids.forEach((id, i) => rank.set(id, ids.length === 1 ? 0.5 : i / (ids.length - 1)));
    }
  };
  refreshRanks();

  const sortBy = (ids: string[], neighbours: Map<string, string[]>) => {
    const keys = new Map<string, number>();
    ids.forEach((id, i) => {
      const list = neighbours.get(id) ?? [];
      const values = list
        .map((other) => rank.get(other))
        .filter((v): v is number => v != null);
      const fallback = ids.length === 1 ? 0.5 : i / (ids.length - 1);
      keys.set(id, values.length === 0 ? fallback : average(values));
    });
    ids.sort((a, b) => (keys.get(a) ?? 0) - (keys.get(b) ?? 0));
  };

  for (let layer = 1; layer < columns.length; layer += 1) {
    sortBy(columns[layer], incoming);
    refreshRanks();
  }
  for (let layer = columns.length - 2; layer >= 0; layer -= 1) {
    sortBy(columns[layer], outgoing);
    refreshRanks();
  }
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * SIMULAÇÃO DE FORÇAS — o desenho de mapa de conhecimento (Obsidian, Gephi):
 * aglomerados separados, cada um com um centro e a sua coroa de satélites.
 *
 * ---------------------------------------------------------------------------
 * POR QUE NÃO É SÓ "RODAR FRUCHTERMAN–REINGOLD"
 * ---------------------------------------------------------------------------
 * Uma simulação crua com 200 nós entrega um NOVELO: ela busca equilíbrio de
 * distâncias, não legibilidade de estrutura. O que dá a leitura de aglomerado
 * são três coisas que esta implementação faz de propósito:
 *
 *  1. FOLHA NÃO ENTRA NA SIMULAÇÃO. Numa rede real a maioria dos nós é folha
 *     (grau 1: um satélite pendurado num hub). Elas são retiradas, a simulação
 *     roda só no ESQUELETO — que costuma ser 5× a 10× menor —, e no fim cada
 *     folha é posta numa COROA em volta do seu hub. É exatamente o "dente-de-
 *     leão" que se vê num grafo bonito, e de quebra derruba o custo: o laço é
 *     O(n²) por iteração, e n aqui é o esqueleto, não a rede toda.
 *
 *  2. HUB PESA MAIS. Um nó com 20 folhas ocupa uma área de raio grande; se ele
 *     repelisse igual a um nó solitário, a coroa dele invadiria a do vizinho. O
 *     peso de repulsão cresce com o número de folhas, então a simulação abre
 *     espaço para a coroa ANTES de ela existir.
 *
 *  3. GRUPO PUXA. Nós do mesmo `grupo` sofrem uma atração fraca ao centróide do
 *     grupo. É o que transforma "categoria = cor" em "categoria = região da
 *     tela": sem isso, dois nós do mesmo grupo sem aresta entre eles não teriam
 *     motivo nenhum para ficar perto, e a cor viraria confete.
 *
 * Tudo determinístico: posições iniciais em espiral de ângulo áureo, nenhum
 * número aleatório. Mesmo dado, mesmo desenho — na tela, no PDF e no teste.
 */
import { degreesOf, type GraphModel } from './graph-data';
import type { GraphPoint } from './graph-layout';

/** Ângulo áureo — espalha os pontos iniciais sem repetir direção. */
const GOLDEN_ANGLE = 2.399963229728653;

/**
 * Orçamento de iterações: `budget / esqueleto`, dentro da faixa. Como as folhas
 * saíram, o esqueleto de uma rede de 250 nós costuma ter algumas dezenas — e aí
 * a simulação roda o teto de iterações gastando quase nada.
 */
const ITERATIONS = { budget: 20000, min: 80, max: 400 } as const;

/** Passo máximo de um nó por iteração, em fração do quadro. */
const INITIAL_TEMPERATURE = 0.14;

/** Resfriamento por iteração — o passo encolhe até o desenho assentar. */
const COOLING = 0.96;

/** Atração ao centro: segura os componentes desconexos dentro do quadro. */
const GRAVITY = 0.02;

/** Atração ao centróide do próprio grupo — o que forma os aglomerados por cor. */
const GROUP_PULL = 0.12;

/** A cada quantas folhas o hub ganha +1 de peso na repulsão. */
const LEAF_WEIGHT_STEP = 4;

/**
 * Geometria da coroa de folhas, em FRAÇÃO DO QUADRO — e não em fração da
 * distância de repouso da simulação.
 *
 * A diferença não é cosmética. A simulação trabalha numa escala própria, que
 * se expande quanto mais nós existem; uma coroa medida ali encolhia junto e
 * chegava ao desenho com 7px de raio para 21 folhas — ou seja, um borrão, não
 * um dente-de-leão. Aqui o raio é declarado no espaço em que o desenho VAI
 * acontecer (o quadro normalizado), então uma coroa de 21 folhas nasce com uns
 * 30px em qualquer rede.
 */
const LEAF_RING = {
  /** Raio de um hub com uma folha só. */
  base: 0.03,
  /** Quanto o raio cresce por folha (a coroa precisa de circunferência). */
  perLeaf: 0.0035,
  /** Teto: acima disto a coroa competiria com o resto da rede. */
  max: 0.12,
  /** Raio reservado a um nó SEM coroa (ele também não pode ser invadido). */
  bare: 0.018,
  /** Folga entre duas coroas vizinhas. */
  gap: 0.025,
  /** Abertura do leque quando o hub tem tronco (deixa a saída livre). */
  arc: 0.82,
} as const;

/** Passadas de afastamento entre coroas — poucas bastam e todas convergem. */
const SEPARATION_PASSES = 60;

/** Distância mínima considerada entre dois nós (evita divisão por zero). */
const EPSILON = 1e-4;

export interface ForceResult {
  points: Map<string, GraphPoint>;
  /** Proporção ocupada pelo desenho, com o maior lado valendo 1. */
  extent: { x: number; y: number };
}

/**
 * Posiciona o grafo por simulação de forças.
 *
 * A ordem importa e é o miolo do desenho:
 *   1. simula o ESQUELETO (sem as folhas) — a escala aqui é interna;
 *   2. reenquadra o esqueleto no quadro unitário, que é onde a coroa pode ser
 *      medida em fração do desenho FINAL;
 *   3. afasta os hubs até nenhuma coroa invadir a vizinha;
 *   4. distribui as folhas na coroa de cada hub;
 *   5. reenquadra tudo, agora com as folhas dentro da conta.
 */
export function forceLayout(
  model: GraphModel,
  layers: Map<string, number>,
  aspect: number,
): ForceResult {
  const degrees = degreesOf(model);
  const adjacency = adjacencyOf(model);
  const { core, leavesOf } = splitLeaves(model, degrees, adjacency);

  const simulated = simulateCore(model, core, leavesOf, adjacency, aspect);
  const { positions, extent } = fitToUnitBox(simulated);

  // A coroa é medida no MENOR lado do desenho. Num card 5:1, o maior lado não
  // diz nada sobre o espaço disponível para um círculo — quem limita é a
  // altura, e uma coroa de "12% do maior lado" sairia maior que o card é alto.
  const ringScale = Math.min(extent.x, extent.y);
  const ringOf = (id: string) => ringRadius(leavesOf.get(id)?.length ?? 0) * ringScale;

  separateBursts(positions, ringOf);
  placeLeaves(positions, leavesOf, adjacency, ringOf);

  return normalize(model, positions, layers);
}

/** Raio da coroa de um hub com `leaves` folhas (fração do menor lado). */
function ringRadius(leaves: number): number {
  if (leaves === 0) return LEAF_RING.bare;
  return Math.min(LEAF_RING.base + leaves * LEAF_RING.perLeaf, LEAF_RING.max);
}

/* ========================================================================== *
 * 1. Separar o esqueleto das folhas
 * ========================================================================== */

/** Vizinhos de cada nó (ligação em qualquer sentido, sem repetição). */
function adjacencyOf({ nodes, edges }: GraphModel): Map<string, string[]> {
  const map = new Map<string, string[]>(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    map.get(edge.source)?.push(edge.target);
    map.get(edge.target)?.push(edge.source);
  }
  return map;
}

interface Split {
  /** Ids que entram na simulação. */
  core: string[];
  /** hub → folhas penduradas nele. */
  leavesOf: Map<string, string[]>;
}

/**
 * Folha = nó de grau 1 pendurado num nó de grau ≥ 2.
 *
 * O par isolado (dois nós ligados só entre si) NÃO vira folha: os dois ficam no
 * esqueleto, senão um deles seria posicionado em volta de um hub que não existe.
 * Pela mesma razão, um hub que só tem folhas continua no esqueleto — é ele o
 * centro do dente-de-leão.
 */
function splitLeaves(
  model: GraphModel,
  degrees: Map<string, number>,
  adjacency: Map<string, string[]>,
): Split {
  const leavesOf = new Map<string, string[]>();
  const isLeaf = new Set<string>();

  for (const node of model.nodes) {
    if (degrees.get(node.id) !== 1) continue;
    const parent = adjacency.get(node.id)?.[0];
    if (!parent || (degrees.get(parent) ?? 0) < 2) continue;
    isLeaf.add(node.id);
    const siblings = leavesOf.get(parent);
    if (siblings) siblings.push(node.id);
    else leavesOf.set(parent, [node.id]);
  }

  const core = model.nodes.filter((node) => !isLeaf.has(node.id)).map((node) => node.id);

  // Esqueleto degenerado (rede que é só uma estrela, ou menor): simular tudo é
  // mais honesto do que pendurar a rede inteira num ponto só.
  if (core.length < 2) {
    return { core: model.nodes.map((node) => node.id), leavesOf: new Map() };
  }
  return { core, leavesOf };
}

/* ========================================================================== *
 * 2. Fruchterman–Reingold no esqueleto
 * ========================================================================== */

function simulateCore(
  model: GraphModel,
  core: string[],
  leavesOf: Map<string, string[]>,
  adjacency: Map<string, string[]>,
  aspect: number,
): Map<string, { x: number; y: number }> {
  const count = core.length;
  const index = new Map(core.map((id, i) => [id, i]));
  const xs = new Float64Array(count);
  const ys = new Float64Array(count);

  // A simulação roda dentro do RETÂNGULO em que o desenho vai aparecer (largura
  // `aspect`, altura 1). É o que faz a rede preencher um card largo em vez de
  // virar um quadrado com 70% de espaço vazio dos lados — e é diferente de
  // ESTICAR um desenho quadrado depois de pronto: aqui as distâncias continuam
  // corretas, porque a repulsão já cresce na medida da área disponível.
  const width = Math.max(aspect, EPSILON);

  // Espiral de ângulo áureo: pontos bem distribuídos e SEM aleatoriedade — é o
  // que torna o desenho reproduzível entre sessões, máquinas e testes.
  for (let i = 0; i < count; i += 1) {
    const radius = 0.45 * Math.sqrt((i + 0.5) / count);
    const angle = i * GOLDEN_ANGLE;
    xs[i] = width * (0.5 + radius * Math.cos(angle));
    ys[i] = 0.5 + radius * Math.sin(angle);
  }

  // Peso de repulsão: quem carrega coroa precisa de mais espaço.
  const weights = new Float64Array(count);
  for (let i = 0; i < count; i += 1) {
    weights[i] = 1 + (leavesOf.get(core[i])?.length ?? 0) / LEAF_WEIGHT_STEP;
  }

  const links: [number, number][] = [];
  const seen = new Set<string>();
  for (const [id, neighbours] of adjacency) {
    const from = index.get(id);
    if (from == null) continue;
    for (const other of neighbours) {
      const to = index.get(other);
      if (to == null || to === from) continue;
      const key = from < to ? `${from}:${to}` : `${to}:${from}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push([from, to]);
    }
  }

  const groups = groupBuckets(model, index);
  // Distância de repouso para a ÁREA disponível (largura × altura = aspect × 1).
  const k = Math.sqrt(width / count);
  const iterations = Math.min(
    ITERATIONS.max,
    Math.max(ITERATIONS.min, Math.round(ITERATIONS.budget / count)),
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
        const force = ((k * k) / distance) * weights[i] * weights[j];
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

    // Atração ao centróide do grupo — o que agrupa por categoria.
    for (const bucket of groups) {
      let cx = 0;
      let cy = 0;
      for (const i of bucket) {
        cx += xs[i];
        cy += ys[i];
      }
      cx /= bucket.length;
      cy /= bucket.length;
      for (const i of bucket) {
        dx[i] += (cx - xs[i]) * GROUP_PULL;
        dy[i] += (cy - ys[i]) * GROUP_PULL;
      }
    }

    for (let i = 0; i < count; i += 1) {
      dx[i] += (width / 2 - xs[i]) * GRAVITY * count * k;
      dy[i] += (0.5 - ys[i]) * GRAVITY * count * k;
      const length = Math.max(Math.hypot(dx[i], dy[i]), EPSILON);
      const stepSize = Math.min(length, temperature);
      // Preso ao retângulo: é o que faz o desenho OCUPAR a área em vez de
      // escapar dela (Fruchterman–Reingold original faz o mesmo).
      xs[i] = Math.min(Math.max(xs[i] + (dx[i] / length) * stepSize, 0), width);
      ys[i] = Math.min(Math.max(ys[i] + (dy[i] / length) * stepSize, 0), 1);
    }

    temperature *= COOLING;
  }

  const positions = new Map<string, { x: number; y: number }>();
  core.forEach((id, i) => positions.set(id, { x: xs[i], y: ys[i] }));
  return positions;
}

/** Índices do esqueleto agrupados por `grupo` (grupos de 1 nó não contam). */
function groupBuckets(model: GraphModel, index: Map<string, number>): number[][] {
  const buckets = new Map<string, number[]>();
  for (const node of model.nodes) {
    const i = index.get(node.id);
    if (i == null || !node.group) continue;
    const bucket = buckets.get(node.group);
    if (bucket) bucket.push(i);
    else buckets.set(node.group, [i]);
  }
  return [...buckets.values()].filter((bucket) => bucket.length > 1);
}

/* ========================================================================== *
 * 3. Do espaço da simulação para o espaço do DESENHO
 * ========================================================================== */

/**
 * Reenquadra o esqueleto no quadro unitário preservando a proporção.
 *
 * É o passo que faltava: sem ele, a coroa era medida na escala interna da
 * simulação — que se expande quanto mais nós existem — e chegava ao desenho
 * espremida. Depois daqui, "0,1 do quadro" quer dizer a mesma coisa numa rede
 * de 20 e numa de 200 nós.
 */
function fitToUnitBox(positions: Map<string, { x: number; y: number }>): {
  positions: Map<string, { x: number; y: number }>;
  extent: { x: number; y: number };
} {
  const values = [...positions.values()];
  const fitted = new Map<string, { x: number; y: number }>();
  if (values.length === 0) return { positions: fitted, extent: { x: 1, y: 1 } };

  const minX = Math.min(...values.map((p) => p.x));
  const maxX = Math.max(...values.map((p) => p.x));
  const minY = Math.min(...values.map((p) => p.y));
  const maxY = Math.max(...values.map((p) => p.y));
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const span = Math.max(spanX, spanY);

  if (span <= EPSILON) {
    for (const id of positions.keys()) fitted.set(id, { x: 0.5, y: 0.5 });
    return { positions: fitted, extent: { x: 1, y: 1 } };
  }
  for (const [id, point] of positions) {
    fitted.set(id, { x: (point.x - minX) / span, y: (point.y - minY) / span });
  }
  return { positions: fitted, extent: { x: spanX / span, y: spanY / span } };
}

/**
 * Afasta os hubs até nenhuma coroa invadir a vizinha.
 *
 * A simulação já dá mais peso a quem tem muitas folhas, mas peso é pressão
 * MÉDIA — não garante a distância exata de que duas coroas precisam. Aqui a
 * garantia é geométrica: enquanto dois centros estiverem mais perto que a soma
 * dos raios das coroas, os dois recuam metade da diferença. Converge em poucas
 * passadas e é determinístico.
 */
function separateBursts(
  positions: Map<string, { x: number; y: number }>,
  ringOf: (id: string) => number,
): void {
  const ids = [...positions.keys()];
  const radii = ids.map(ringOf);

  for (let pass = 0; pass < SEPARATION_PASSES; pass += 1) {
    let moved = false;
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const a = positions.get(ids[i]);
        const b = positions.get(ids[j]);
        if (!a || !b) continue;
        const needed = radii[i] + radii[j] + LEAF_RING.gap;
        const vx = b.x - a.x;
        const vy = b.y - a.y;
        const distance = Math.hypot(vx, vy);
        if (distance >= needed) continue;

        // Sobrepostos exatamente: separa por uma direção fixa (determinismo).
        const ux = distance < EPSILON ? 1 : vx / distance;
        const uy = distance < EPSILON ? 0 : vy / distance;
        const push = (needed - distance) / 2;
        positions.set(ids[i], { x: a.x - ux * push, y: a.y - uy * push });
        positions.set(ids[j], { x: b.x + ux * push, y: b.y + uy * push });
        moved = true;
      }
    }
    if (!moved) break;
  }
}

/* ========================================================================== *
 * 4. Coroa de folhas
 * ========================================================================== */

/**
 * Põe cada folha numa coroa em volta do hub.
 *
 * O leque abre para o lado CONTRÁRIO ao tronco (a média das direções dos
 * vizinhos de esqueleto): assim as folhas não se espalham por cima da aresta
 * que liga o hub ao resto da rede. Hub sem tronco — o dente-de-leão solto —
 * recebe a volta completa.
 */
function placeLeaves(
  positions: Map<string, { x: number; y: number }>,
  leavesOf: Map<string, string[]>,
  adjacency: Map<string, string[]>,
  ringOf: (id: string) => number,
): void {
  for (const [parentId, leaves] of leavesOf) {
    const parent = positions.get(parentId);
    if (!parent) continue;

    const trunk = trunkAngle(parentId, positions, adjacency, parent);
    const span = trunk == null ? Math.PI * 2 : Math.PI * 2 * LEAF_RING.arc;
    const start = (trunk == null ? 0 : trunk + Math.PI) - span / 2;
    const radius = ringOf(parentId);

    leaves.forEach((id, i) => {
      const angle = start + (span * (i + 0.5)) / leaves.length;
      positions.set(id, {
        x: parent.x + radius * Math.cos(angle),
        y: parent.y + radius * Math.sin(angle),
      });
    });
  }
}

/** Direção média do hub para os vizinhos de esqueleto. `null` se não houver. */
function trunkAngle(
  parentId: string,
  positions: Map<string, { x: number; y: number }>,
  adjacency: Map<string, string[]>,
  parent: { x: number; y: number },
): number | null {
  let vx = 0;
  let vy = 0;
  let found = 0;
  for (const other of adjacency.get(parentId) ?? []) {
    const point = positions.get(other);
    if (!point) continue;
    vx += point.x - parent.x;
    vy += point.y - parent.y;
    found += 1;
  }
  if (found === 0 || Math.hypot(vx, vy) < EPSILON) return null;
  return Math.atan2(vy, vx);
}

/* ========================================================================== *
 * 5. Reenquadramento final
 * ========================================================================== */

/**
 * Reenquadra o resultado PRESERVANDO a proporção — um grafo em linha continua
 * uma linha, em vez de ser inflado até virar um quadrado. O maior lado vira 1 e
 * o outro vira a fração correspondente (`extent`), que o canvas usa para
 * escalar pelo conteúdo real.
 */
function normalize(
  model: GraphModel,
  positions: Map<string, { x: number; y: number }>,
  layers: Map<string, number>,
): ForceResult {
  const values = [...positions.values()];
  const minX = Math.min(...values.map((p) => p.x));
  const maxX = Math.max(...values.map((p) => p.x));
  const minY = Math.min(...values.map((p) => p.y));
  const maxY = Math.max(...values.map((p) => p.y));
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
    return { points, extent: { x: 1, y: 1 } };
  }

  for (const node of model.nodes) {
    const point = positions.get(node.id) ?? { x: minX, y: minY };
    points.set(node.id, {
      id: node.id,
      x: (point.x - minX) / span,
      y: (point.y - minY) / span,
      layer: layers.get(node.id) ?? 0,
    });
  }

  return { points, extent: { x: spanX / span, y: spanY / span } };
}

/**
 * POSICIONAMENTO dos nós — funções PURAS que traduzem o grafo em coordenadas
 * no quadrado unitário [0,1]². Quem converte para pixel é o `graph-canvas`.
 *
 * ---------------------------------------------------------------------------
 * POR QUE O LAYOUT É CALCULADO, E NÃO ANIMADO NA TELA
 * ---------------------------------------------------------------------------
 * A referência mental de um grafo (Obsidian, Gephi) é uma simulação que roda
 * quadro a quadro e nunca "termina". Isso é ótimo para explorar e péssimo para
 * um painel: o mesmo dado desenharia diferente a cada visita, a exportação em
 * PDF pegaria a simulação no meio, e o teste não teria o que afirmar.
 *
 * Aqui a simulação roda UMA vez, síncrona e determinística (`graph-force.ts`).
 * Mesmos dados, mesmo desenho — na tela, no papel e no teste. O movimento que
 * sobra é o do HOVER, que é resposta ao usuário, não ruído de fundo.
 *
 * Três layouts, cada um respondendo a uma pergunta diferente:
 *   force    — "como isto se agrupa?"        (aglomerados e satélites)
 *   layered  — "por onde o volume passa?"    (funil: uma coluna por camada)
 *   radial   — "o que está longe do centro?" (hierarquia em anéis)
 */
import type { GraphModel } from './graph-data';
import { forceLayout } from './graph-force';
import { forceLayout3D } from './graph-force-3d';

/** Layouts publicados no `propsSchema` do bloco. */
export type GraphLayoutKind = 'force' | 'layered' | 'radial';

/** Posição de um nó — no quadrado unitário (plano) ou centrada na origem (volume). */
export interface GraphPoint {
  id: string;
  x: number;
  y: number;
  /** Profundidade. Zero em todo layout plano. */
  z: number;
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
  /**
   * Como interpretar as coordenadas: `plane` = quadrado unitário (o canvas 2D
   * mapeia direto); `volume` = nuvem centrada na origem, raio ≤ `radius`, para
   * o canvas 3D projetar com a câmera.
   */
  space: 'plane' | 'volume';
  /** Raio da nuvem — só em `volume`. */
  radius?: number;
}

/** Proporção padrão: o desenho ocupa o quadrado inteiro. */
const FULL_EXTENT = { x: 1, y: 1 } as const;

/** Ângulo áureo — usado para desalinhar os anéis do layout radial. */
const GOLDEN_ANGLE = 2.399963229728653;

/**
 * Proporção (largura ÷ altura) assumida quando quem chama não mede o card.
 * Vale para teste e para o primeiro quadro, antes da medição.
 */
export const DEFAULT_ASPECT = 1.6;

/**
 * Faixa de proporção aceita. O teto existe porque, passando disso, a rede
 * deixa de ser uma rede e vira uma tira de aglomerados em fila; o piso, porque
 * um card mais alto que largo não deve empilhar tudo numa coluna.
 */
const ASPECT_RANGE = { min: 0.6, max: 5 } as const;

/**
 * Posiciona o grafo. Nunca devolve `NaN`: grafo vazio → mapa vazio.
 *
 * `aspect` é a proporção do RETÂNGULO em que o desenho vai aparecer. Só o
 * `force` a usa (os outros dois se ajustam sozinhos pelo `fit`), e ela importa:
 * uma simulação feita em quadrado, desenhada num card 5:1, aparece como um
 * quadradinho no meio com 70% do card vazio dos lados.
 */
export function layoutGraph(
  model: GraphModel,
  kind: GraphLayoutKind,
  aspect: number = DEFAULT_ASPECT,
  depth = false,
): GraphLayout {
  const layers = computeLayers(model);
  const layerCount = model.nodes.length === 0 ? 0 : Math.max(...layers.values()) + 1;

  if (model.nodes.length === 0) {
    return {
      points: new Map(),
      layerCount: 0,
      fit: 'uniform',
      extent: FULL_EXTENT,
      space: 'plane',
    };
  }

  if (kind === 'layered') {
    return {
      points: layeredPoints(model, layers),
      layerCount,
      fit: 'stretch',
      extent: FULL_EXTENT,
      space: 'plane',
    };
  }
  if (kind === 'radial') {
    return {
      points: radialPoints(model, layers, layerCount),
      layerCount,
      fit: 'uniform',
      extent: FULL_EXTENT,
      space: 'plane',
    };
  }

  // PROFUNDIDADE só existe na simulação de forças: funil e anéis são leituras
  // planas por definição — girá-los destruiria a coluna/anel que os define.
  if (depth) {
    const { points, radius } = forceLayout3D(model, layers);
    return {
      points,
      layerCount,
      fit: 'uniform',
      extent: FULL_EXTENT,
      space: 'volume',
      radius,
    };
  }

  const safeAspect = Math.min(
    Math.max(Number.isFinite(aspect) ? aspect : DEFAULT_ASPECT, ASPECT_RANGE.min),
    ASPECT_RANGE.max,
  );
  const { points, extent } = forceLayout(model, layers, safeAspect);
  return { points, layerCount, fit: 'uniform', extent, space: 'plane' };
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
      points.set(id, { id, x, y: (i + 0.5) / ids.length, z: 0, layer });
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
        z: 0,
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

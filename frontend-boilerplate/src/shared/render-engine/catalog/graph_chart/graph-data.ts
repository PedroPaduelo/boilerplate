/**
 * LEITURA DEFENSIVA dos dados do grafo — `TableData` (linhas soltas vindas de
 * uma consulta SQL) → `{ nodes, edges }`.
 *
 * Funções PURAS, sem React: é aqui que mora todo o "o que fazer quando o dado
 * não veio como o manual manda", e isso precisa ser testável sem montar tela.
 *
 * As três tolerâncias que valem a pena conhecer (todas deliberadas, porque a
 * consulta é escrita por quem está olhando o banco, não o contrato):
 *
 *  1. NÓ IMPLÍCITO — um id citado em `origem`/`destino` que ninguém declarou
 *     vira nó. É o que permite desenhar um fluxo com uma consulta só
 *     (`SELECT de, para, volume FROM ...`), sem UNION ALL. Sem isso, metade
 *     dos grafos chegaria vazia por falta de uma consulta que ninguém
 *     considera obrigatória.
 *  2. PAPEL DEDUZIDO — sem a coluna `tipo`, a linha que tem origem E destino é
 *     aresta; a que tem `id` é nó. A coluna `tipo` continua sendo o contrato e
 *     vence a dedução quando presente.
 *  3. NOME EM INGLÊS — `source/target/label/group/value/layer` são aceitos como
 *     sinônimos dos nomes em português. O agente escreve SQL a partir do
 *     manifesto (que é em português), mas um humano copiando de outra
 *     ferramenta escreve em inglês, e recusar a linha por causa do idioma da
 *     coluna seria um erro sem diagnóstico na tela.
 *
 * O que NÃO é tolerado, e por quê: aresta sem origem ou sem destino (não é uma
 * ligação, é meia linha) e laço sobre o próprio nó (`origem === destino`), que
 * não tem traçado possível entre dois pontos iguais. Ambos são descartados em
 * silêncio — o nó continua no desenho.
 */
import type { TableData } from '@dashboards/contracts';

/** Um nó do grafo, já normalizado. */
export interface GraphNode {
  /** Identificador único (chave das arestas). */
  id: string;
  /** Texto exibido — `id` quando a consulta não nomeia. */
  label: string;
  /** Categoria do nó: é ela que recebe a cor da paleta. */
  group?: string;
  /** Medida do nó (volume, valor, contagem) — vira o TAMANHO. */
  value?: number;
  /** Camada declarada (0 = primeira). Ausente = deduzida das arestas. */
  layer?: number;
}

/** Uma ligação dirigida entre dois nós. */
export interface GraphEdge {
  source: string;
  target: string;
  /** Medida da ligação (fluxo) — vira a ESPESSURA. */
  value?: number;
  /** Texto do tooltip. Sem ele, o tooltip mostra "origem → destino". */
  label?: string;
}

/** O grafo inteiro, na ordem em que a consulta o descreveu. */
export interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

type Row = Record<string, unknown>;

/** Valores da coluna `tipo` que declaram um NÓ. */
const NODE_ROLES = new Set(['no', 'nó', 'node', 'vertice', 'vértice']);

/** Valores da coluna `tipo` que declaram uma ARESTA. */
const EDGE_ROLES = new Set(['aresta', 'edge', 'ligacao', 'ligação', 'link', 'fluxo']);

/* Sinônimos aceitos por campo (o primeiro é o nome do contrato). */
const ID_KEYS = ['id', 'no', 'node'];
const LABEL_KEYS = ['rotulo', 'rótulo', 'label', 'nome', 'name'];
const GROUP_KEYS = ['grupo', 'group', 'categoria', 'category'];
const VALUE_KEYS = ['valor', 'value', 'quantidade', 'total', 'peso'];
const LAYER_KEYS = ['camada', 'layer', 'nivel', 'nível', 'level'];
const SOURCE_KEYS = ['origem', 'source', 'de', 'from'];
const TARGET_KEYS = ['destino', 'target', 'para', 'to'];

/** Texto não vazio de um campo desconhecido (número vira string). */
function text(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

/** Número finito de um campo desconhecido (aceita numérico em string). */
function num(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/** Primeiro campo preenchido entre os sinônimos. */
function pick(row: Row, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (row[key] != null && row[key] !== '') return row[key];
  }
  return undefined;
}

/** Camada declarada: inteiro ≥ 0 (o resto é ignorado, não corrigido). */
function readLayer(row: Row): number | undefined {
  const raw = num(pick(row, LAYER_KEYS));
  if (raw == null) return undefined;
  const layer = Math.trunc(raw);
  return layer >= 0 ? layer : undefined;
}

/** Linhas da tabela, ou lista vazia quando o payload não é uma tabela. */
function rowsOf(data: TableData | undefined): Row[] {
  const rows = (data as { rows?: unknown } | undefined)?.rows;
  return Array.isArray(rows) ? (rows as Row[]) : [];
}

/**
 * Lê o grafo de um `TableData`.
 *
 * Nós declarados mantêm a ordem da consulta e vêm antes dos implícitos, que
 * entram na ordem em que as arestas os citam — a ordem é o que define a cor de
 * cada grupo e a posição inicial do layout, então ela precisa ser estável.
 */
export function readGraph(data: TableData | undefined): GraphModel {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const row of rowsOf(data)) {
    if (row == null || typeof row !== 'object') continue;

    const role = text(row.tipo)?.toLowerCase();
    const source = text(pick(row, SOURCE_KEYS));
    const target = text(pick(row, TARGET_KEYS));

    // A coluna `tipo` manda; sem ela, o papel vem do formato da linha.
    const isEdge = role ? EDGE_ROLES.has(role) : Boolean(source && target);
    if (isEdge) {
      // Meia ligação não é ligação; laço não tem traçado entre dois pontos.
      if (!source || !target || source === target) continue;
      edges.push({
        source,
        target,
        value: num(pick(row, VALUE_KEYS)),
        label: text(pick(row, LABEL_KEYS)),
      });
      continue;
    }

    if (role && !NODE_ROLES.has(role)) continue;
    const id = text(pick(row, ID_KEYS));
    if (!id) continue;
    mergeNode(nodes, {
      id,
      label: text(pick(row, LABEL_KEYS)) ?? id,
      group: text(pick(row, GROUP_KEYS)),
      value: num(pick(row, VALUE_KEYS)),
      layer: readLayer(row),
    });
  }

  // Nós implícitos: citados por uma aresta, nunca declarados.
  for (const edge of edges) {
    ensureNode(nodes, edge.source);
    ensureNode(nodes, edge.target);
  }

  return { nodes: [...nodes.values()], edges };
}

/**
 * Junta uma declaração ao nó já conhecido. A PRIMEIRA linha manda no rótulo e
 * no grupo (é a que o autor escreveu primeiro); a repetição só preenche o que
 * faltava — assim uma consulta que declara o nó duas vezes com detalhes
 * diferentes soma informação em vez de perder.
 */
function mergeNode(nodes: Map<string, GraphNode>, node: GraphNode): void {
  const current = nodes.get(node.id);
  if (!current) {
    nodes.set(node.id, node);
    return;
  }
  nodes.set(node.id, {
    id: node.id,
    label: current.label === current.id ? node.label : current.label,
    group: current.group ?? node.group,
    value: current.value ?? node.value,
    layer: current.layer ?? node.layer,
  });
}

/** Cria o nó implícito citado por uma aresta (rótulo = o próprio id). */
function ensureNode(nodes: Map<string, GraphNode>, id: string): void {
  if (!nodes.has(id)) nodes.set(id, { id, label: id });
}

/** Quantas ligações (entrando + saindo) cada nó tem. */
export function degreesOf({ nodes, edges }: GraphModel): Map<string, number> {
  const degrees = new Map<string, number>(nodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
  }
  return degrees;
}

/** Grupos na ordem de aparição — é ela que decide a cor de cada um. */
export function groupsOf({ nodes }: GraphModel): string[] {
  const groups: string[] = [];
  for (const node of nodes) {
    if (node.group && !groups.includes(node.group)) groups.push(node.group);
  }
  return groups;
}

/**
 * LAYOUT EM VOLUME — a nuvem 3D que o canvas gira (`dimension: "3d"`).
 *
 * Mesmas quatro ideias do layout plano (`graph-force.ts`), uma dimensão a
 * mais: só o ESQUELETO é simulado; hub com coroa pesa mais; o `grupo` puxa; e
 * cada satélite vira um ponto na CASCA DE ESFERA do seu hub — o dente-de-leão
 * em três dimensões, que é o que faz a nuvem parecer viva quando gira.
 *
 * Determinístico como tudo aqui: sementes em sequência R3, casca por rede de
 * Fibonacci, nenhum número aleatório. O giro NÃO recalcula nada disto — a
 * câmera (`graph-projection.ts`) só reprojeta.
 *
 * A saída é uma nuvem CENTRADA NA ORIGEM com raio 1: o espaço que uma câmera
 * espera, diferente do quadrado unitário dos layouts planos.
 */
import { degreesOf, type GraphModel } from './graph-data';
import { adjacencyOf, ringRadius, splitLeaves } from './graph-force';
import type { GraphPoint } from './graph-layout';

/**
 * Sequência R3 — a R2 com um eixo a mais: sementes de baixa discrepância no
 * CUBO. `g` é a raiz real de x⁴ = x + 1 (o análogo tridimensional do número
 * plástico); os passos são 1/g, 1/g² e 1/g³.
 */
const G3 = 1.2207440846057596;
const R3_ALPHA = [1 / G3, 1 / (G3 * G3), 1 / (G3 * G3 * G3)] as const;

/** Ângulo áureo — o passo azimutal da rede de Fibonacci na esfera. */
const GOLDEN_ANGLE = 2.399963229728653;

/** Iterações da simulação (o esqueleto é pequeno; o teto quase sempre vale). */
const ITERATIONS = { budget: 20000, min: 80, max: 300 } as const;

/** Passo máximo por iteração, resfriado a cada volta. */
const INITIAL_TEMPERATURE = 0.14;
const COOLING = 0.96;

/** Atração fraca à origem — segura componente desconexo dentro da cena. */
const GRAVITY = 0.004;

/** Atração ao centróide do grupo — os aglomerados por cor, agora em volume. */
const GROUP_PULL = 0.12;

/** Alcance da repulsão (múltiplos da distância de repouso) — ver 2D. */
const REPULSION_RANGE = 3;

/** Peso extra de repulsão por folha carregada. */
const LEAF_WEIGHT_STEP = 4;

/** Variação do raio de cada satélite na casca (±20%) — casca viva, não bola. */
const SHELL_JITTER = 0.4;

/** Folga entre duas cascas vizinhas, em fração do cubo. */
const SHELL_GAP = 0.03;

/** Passadas do afastamento de cascas. */
const SEPARATION_PASSES = 60;

const EPSILON = 1e-4;

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface VolumeResult {
  /** Pontos centrados na origem. */
  points: Map<string, GraphPoint>;
  /** Raio da nuvem (1 após a normalização). */
  radius: number;
}

/** Posiciona o grafo num volume: esqueleto simulado + cascas de satélites. */
export function forceLayout3D(
  model: GraphModel,
  layers: Map<string, number>,
): VolumeResult {
  const degrees = degreesOf(model);
  const adjacency = adjacencyOf(model);
  const { core, leavesOf } = splitLeaves(model, degrees, adjacency);

  const positions = simulate(model, core, leavesOf, adjacency, degrees);
  const ringOf = (id: string) => ringRadius(leavesOf.get(id)?.length ?? 0);

  separateShells(positions, ringOf);
  placeShells(positions, leavesOf);

  return normalize(model, positions, layers);
}

/* ========================================================================== *
 * Simulação do esqueleto no cubo unitário
 * ========================================================================== */

function simulate(
  model: GraphModel,
  core: string[],
  leavesOf: Map<string, string[]>,
  adjacency: Map<string, string[]>,
  degrees: Map<string, number>,
): Map<string, Vec3> {
  const count = core.length;
  const index = new Map(core.map((id, i) => [id, i]));
  const xs = new Float64Array(count);
  const ys = new Float64Array(count);
  const zs = new Float64Array(count);

  // Semente POR AGLOMERADO (a lição do plano vale aqui): o grupo nasce inteiro
  // no lugar dele, e a R3 distribui os aglomerados pelo cubo. Nó solto tem
  // semente própria — ausência de vínculo não é um vínculo.
  const groupOf = new Map(model.nodes.map((node) => [node.id, node.group]));
  const keyOf = (id: string, i: number) =>
    (degrees.get(id) ?? 0) === 0 ? `\u0000${id}` : (groupOf.get(id) ?? `\u0000${i}`);

  const seedOf = new Map<string, number>();
  core.forEach((id, i) => {
    const key = keyOf(id, i);
    if (!seedOf.has(key)) seedOf.set(key, seedOf.size);
  });
  const frac = (v: number) => v - Math.floor(v);
  for (let i = 0; i < count; i += 1) {
    const seed = (seedOf.get(keyOf(core[i], i)) ?? i) + 1;
    xs[i] = frac(0.5 + R3_ALPHA[0] * seed) + (frac(R3_ALPHA[2] * (i + 1)) - 0.5) * 0.08;
    ys[i] = frac(0.5 + R3_ALPHA[1] * seed) + (frac(R3_ALPHA[0] * (i + 1)) - 0.5) * 0.08;
    zs[i] = frac(0.5 + R3_ALPHA[2] * seed) + (frac(R3_ALPHA[1] * (i + 1)) - 0.5) * 0.08;
  }

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

  const isLoose = core.map((id) => (degrees.get(id) ?? 0) === 0);
  const buckets = new Map<string, number[]>();
  core.forEach((id, i) => {
    const group = groupOf.get(id);
    if (!group || isLoose[i]) return;
    const bucket = buckets.get(group);
    if (bucket) bucket.push(i);
    else buckets.set(group, [i]);
  });
  const groups = [...buckets.values()].filter((bucket) => bucket.length > 1);

  // Distância de repouso para um VOLUME unitário: raiz cúbica, não quadrada.
  const k = Math.cbrt(1 / Math.max(count, 1));
  const iterations = Math.min(
    ITERATIONS.max,
    Math.max(ITERATIONS.min, Math.round(ITERATIONS.budget / Math.max(count, 1))),
  );

  const dx = new Float64Array(count);
  const dy = new Float64Array(count);
  const dz = new Float64Array(count);
  let temperature = INITIAL_TEMPERATURE;

  for (let step = 0; step < iterations; step += 1) {
    dx.fill(0);
    dy.fill(0);
    dz.fill(0);

    const range = k * REPULSION_RANGE;
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        const vx = xs[i] - xs[j];
        const vy = ys[i] - ys[j];
        const vz = zs[i] - zs[j];
        const distance = Math.max(Math.hypot(vx, vy, vz), EPSILON);
        if (distance > range * (weights[i] + weights[j])) continue;
        const force = ((k * k) / distance) * weights[i] * weights[j];
        const ux = (vx / distance) * force;
        const uy = (vy / distance) * force;
        const uz = (vz / distance) * force;
        dx[i] += ux;
        dy[i] += uy;
        dz[i] += uz;
        dx[j] -= ux;
        dy[j] -= uy;
        dz[j] -= uz;
      }
    }

    for (const [from, to] of links) {
      const vx = xs[from] - xs[to];
      const vy = ys[from] - ys[to];
      const vz = zs[from] - zs[to];
      const distance = Math.max(Math.hypot(vx, vy, vz), EPSILON);
      const force = (distance * distance) / k;
      const ux = (vx / distance) * force;
      const uy = (vy / distance) * force;
      const uz = (vz / distance) * force;
      dx[from] -= ux;
      dy[from] -= uy;
      dz[from] -= uz;
      dx[to] += ux;
      dy[to] += uy;
      dz[to] += uz;
    }

    for (const bucket of groups) {
      let cx = 0;
      let cy = 0;
      let cz = 0;
      for (const i of bucket) {
        cx += xs[i];
        cy += ys[i];
        cz += zs[i];
      }
      cx /= bucket.length;
      cy /= bucket.length;
      cz /= bucket.length;
      for (const i of bucket) {
        dx[i] += (cx - xs[i]) * GROUP_PULL;
        dy[i] += (cy - ys[i]) * GROUP_PULL;
        dz[i] += (cz - zs[i]) * GROUP_PULL;
      }
    }

    const gravity = GRAVITY * count * k;
    for (let i = 0; i < count; i += 1) {
      if (!isLoose[i]) {
        dx[i] += (0.5 - xs[i]) * gravity;
        dy[i] += (0.5 - ys[i]) * gravity;
        dz[i] += (0.5 - zs[i]) * gravity;
      }
      const length = Math.max(Math.hypot(dx[i], dy[i], dz[i]), EPSILON);
      const stepSize = Math.min(length, temperature);
      xs[i] += (dx[i] / length) * stepSize;
      ys[i] += (dy[i] / length) * stepSize;
      zs[i] += (dz[i] / length) * stepSize;
    }

    temperature *= COOLING;
  }

  const positions = new Map<string, Vec3>();
  core.forEach((id, i) => positions.set(id, { x: xs[i], y: ys[i], z: zs[i] }));
  return positions;
}

/* ========================================================================== *
 * Cascas de satélites
 * ========================================================================== */

/** Afasta os hubs até nenhuma CASCA invadir a vizinha (esferas, não círculos). */
function separateShells(
  positions: Map<string, Vec3>,
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
        const needed = radii[i] + radii[j] + SHELL_GAP;
        const vx = b.x - a.x;
        const vy = b.y - a.y;
        const vz = b.z - a.z;
        const distance = Math.hypot(vx, vy, vz);
        if (distance >= needed) continue;

        const ux = distance < EPSILON ? 1 : vx / distance;
        const uy = distance < EPSILON ? 0 : vy / distance;
        const uz = distance < EPSILON ? 0 : vz / distance;
        const push = (needed - distance) / 2;
        positions.set(ids[i], {
          x: a.x - ux * push,
          y: a.y - uy * push,
          z: a.z - uz * push,
        });
        positions.set(ids[j], {
          x: b.x + ux * push,
          y: b.y + uy * push,
          z: b.z + uz * push,
        });
        moved = true;
      }
    }
    if (!moved) break;
  }
}

/**
 * Satélites na CASCA do hub, por rede de Fibonacci — a distribuição uniforme
 * numa esfera, determinística. O raio varia ±20% por ponto: casca de dente-de-
 * leão, não bola de isopor.
 */
function placeShells(
  positions: Map<string, Vec3>,
  leavesOf: Map<string, string[]>,
): void {
  const frac = (v: number) => v - Math.floor(v);

  for (const [parentId, leaves] of leavesOf) {
    const parent = positions.get(parentId);
    if (!parent) continue;
    const shell = ringRadius(leaves.length);

    leaves.forEach((id, i) => {
      // Rede de Fibonacci: polar espalhado por área igual, azimute áureo.
      const t = (i + 0.5) / leaves.length;
      const polar = Math.acos(1 - 2 * t);
      const azimuth = i * GOLDEN_ANGLE;
      const noise = frac((i + 1) * R3_ALPHA[0]);
      const radius = shell * (1 - SHELL_JITTER / 2 + noise * SHELL_JITTER);
      const sinPolar = Math.sin(polar);
      positions.set(id, {
        x: parent.x + radius * sinPolar * Math.cos(azimuth),
        y: parent.y + radius * sinPolar * Math.sin(azimuth),
        z: parent.z + radius * Math.cos(polar),
      });
    });
  }
}

/* ========================================================================== *
 * Nuvem centrada na origem, raio 1
 * ========================================================================== */

function normalize(
  model: GraphModel,
  positions: Map<string, Vec3>,
  layers: Map<string, number>,
): VolumeResult {
  const values = [...positions.values()];
  const center = {
    x: values.reduce((s, p) => s + p.x, 0) / Math.max(values.length, 1),
    y: values.reduce((s, p) => s + p.y, 0) / Math.max(values.length, 1),
    z: values.reduce((s, p) => s + p.z, 0) / Math.max(values.length, 1),
  };

  let radius = 0;
  for (const p of values) {
    radius = Math.max(radius, Math.hypot(p.x - center.x, p.y - center.y, p.z - center.z));
  }

  const points = new Map<string, GraphPoint>();
  const scale = radius > EPSILON ? 1 / radius : 1;
  for (const node of model.nodes) {
    const p = positions.get(node.id) ?? center;
    points.set(node.id, {
      id: node.id,
      x: (p.x - center.x) * scale,
      y: (p.y - center.y) * scale,
      z: (p.z - center.z) * scale,
      layer: layers.get(node.id) ?? 0,
    });
  }

  return { points, radius: 1 };
}

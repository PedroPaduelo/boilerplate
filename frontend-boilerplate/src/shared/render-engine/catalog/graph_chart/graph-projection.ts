/**
 * CÂMERA — projeta a nuvem 3D no plano da tela.
 *
 * Funções puras: entra ponto no espaço (x, y, z centrados na origem), sai pixel
 * com PROFUNDIDADE. É o módulo que permite girar o grafo sem recalcular layout
 * nenhum — girar é trocar dois ângulos e reprojetar, o que custa uma dúzia de
 * multiplicações por nó. O posicionamento (caro) acontece uma vez só.
 *
 * ---------------------------------------------------------------------------
 * POR QUE PERSPECTIVA, E NÃO PROJEÇÃO PARALELA
 * ---------------------------------------------------------------------------
 * Sem perspectiva, uma nuvem de pontos girando parece um adesivo girando: não
 * há como saber o que está na frente. A perspectiva dá as três pistas que o
 * olho usa para ler profundidade, e elas saem todas do MESMO fator `scale`:
 *
 *   1. o que está perto aparece mais AFASTADO do centro (paralaxe);
 *   2. o que está perto aparece MAIOR;
 *   3. o que está longe aparece mais APAGADO (perspectiva aérea).
 *
 * `focal` controla a força do efeito: alto demais achata a cena, baixo demais
 * distorce as bordas como lente olho-de-peixe.
 */

/** Ponto no espaço, centrado na origem. */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/** Orientação da câmera, em radianos. */
export interface Rotation {
  /** Giro em torno do eixo vertical (arrasto horizontal). */
  yaw: number;
  /** Giro em torno do eixo horizontal (arrasto vertical). */
  pitch: number;
}

/** Ponto já projetado, com o que o desenho precisa saber de profundidade. */
export interface Projected {
  x: number;
  y: number;
  /** Profundidade após o giro — usada para ordenar quem desenha por cima. */
  depth: number;
  /** Fator da perspectiva: >1 perto da câmera, <1 longe. */
  scale: number;
  /** Opacidade sugerida pela distância (perspectiva aérea). */
  fade: number;
}

/**
 * Distância da câmera à origem, em unidades da nuvem (cujo raio é 1).
 *
 * 2,6 é o valor em que a paralaxe fica evidente ao girar sem que os pontos da
 * borda estiquem: abaixo de ~2 a cena vira olho-de-peixe; acima de ~4 o giro
 * lê como rotação de um decalque plano.
 */
const FOCAL = 2.6;

/**
 * Opacidade do ponto mais distante (o mais próximo fica em 1).
 *
 * 0,6 e não menos: medido no palco escuro, com 0,35 a metade de trás da nuvem
 * simplesmente desaparecia e o "volume" virava meia dúzia de pontos da frente.
 * Na referência a profundidade se lê pelo TAMANHO; o apagamento é só um
 * reforço, e reforço não pode comer o dado.
 */
const FAR_FADE = 0.6;

/** Inclinação inicial: o bastante para a nuvem se anunciar como volume. */
export const INITIAL_ROTATION: Rotation = { yaw: -0.5, pitch: 0.28 };

/** Quantos radianos por pixel de arrasto. */
export const DRAG_SENSITIVITY = 0.008;

/** Limite do giro vertical — passar disso vira a cena de cabeça para baixo. */
export const MAX_PITCH = Math.PI / 2.2;

/**
 * Projeta um ponto. `radius` é o raio da nuvem (o maior afastamento da
 * origem), usado para normalizar a profundidade em 0..1.
 */
export function project(point: Point3D, rotation: Rotation, radius: number): Projected {
  const cosYaw = Math.cos(rotation.yaw);
  const sinYaw = Math.sin(rotation.yaw);
  const cosPitch = Math.cos(rotation.pitch);
  const sinPitch = Math.sin(rotation.pitch);

  // Giro em torno do eixo vertical (Y).
  const x1 = point.x * cosYaw + point.z * sinYaw;
  const z1 = point.z * cosYaw - point.x * sinYaw;
  // Giro em torno do eixo horizontal (X).
  const y2 = point.y * cosPitch - z1 * sinPitch;
  const z2 = z1 * cosPitch + point.y * sinPitch;

  const safeRadius = Math.max(radius, 1e-6);
  // `z` normalizado: −1 (fundo) … +1 (frente). O raio de referência pode ser
  // um percentil da nuvem, então os extremos passam de ±1 — as fórmulas abaixo
  // grampeiam para os extremos não estourarem opacidade nem escala.
  const depth = Math.min(Math.max(z2 / safeRadius, -1.5), 1.5);
  const scale = FOCAL / Math.max(FOCAL - depth, 0.2);
  // Perto → 1; longe → FAR_FADE.
  const fade = Math.min(FAR_FADE + (1 - FAR_FADE) * ((depth + 1) / 2), 1);

  return { x: x1 * scale, y: y2 * scale, depth: z2, scale, fade };
}

/** Aplica o arrasto do ponteiro a uma orientação. */
export function rotateBy(rotation: Rotation, dx: number, dy: number): Rotation {
  const pitch = rotation.pitch + dy * DRAG_SENSITIVITY;
  return {
    yaw: rotation.yaw + dx * DRAG_SENSITIVITY,
    pitch: Math.min(Math.max(pitch, -MAX_PITCH), MAX_PITCH),
  };
}

/**
 * Maior afastamento da origem entre os pontos — o raio da nuvem. É ele que
 * define a escala do desenho UMA vez: recalcular a cada quadro faria a nuvem
 * "respirar" (encolher e crescer) enquanto o usuário gira, que é o defeito
 * clássico de quem reenquadra dentro do laço de animação.
 */
export function cloudRadius(points: Iterable<Point3D>): number {
  let max = 0;
  for (const point of points) {
    max = Math.max(max, Math.hypot(point.x, point.y, point.z));
  }
  return max || 1;
}

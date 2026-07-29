/**
 * GEOMETRIA do desenho — do quadrado unitário do layout para o pixel do SVG.
 *
 * Puro de propósito: traçado de aresta é onde erro passa despercebido (uma
 * seta 2px dentro do círculo, uma linha que nasce no centro do nó em vez da
 * borda), e olhar para um SVG renderizado não prova nada. Aqui dá para afirmar
 * sobre coordenada.
 */

/** Um nó já em pixel: centro e raio. */
export interface ScreenNode {
  x: number;
  y: number;
  r: number;
}

/** Retângulo de desenho, já descontada a margem. */
export interface Viewport {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  /** `stretch` estica; `uniform` escala igual nos dois eixos e centraliza. */
  fit: 'stretch' | 'uniform';
  /** Proporção ocupada pelo desenho (maior lado = 1), vinda do layout. */
  extent: { x: number; y: number };
}

/** Respiro entre a borda do nó e a ponta da aresta. */
const NODE_GAP = 3;

/**
 * Ponta de seta: comprimento e meia-largura, em px.
 *
 * A medida acompanha a ESPESSURA da aresta (`arrowFor`), e não é fixa. Fixa em
 * 7px, ela virou o pior defeito visual do bloco: numa rede densa o traço afina
 * para 0,6px e o nó cai para 4px de diâmetro, mas a seta continuava com 7px —
 * ou seja, 215 triângulos MAIORES que os nós que eles apontavam, espalhados
 * sobre o desenho. O que se via era um chuvisco de cunhas, não uma rede.
 */
const ARROW = { length: 7, half: 3.2, ratio: 2.8 } as const;

/**
 * Espessura mínima de traço que ainda comporta uma seta legível. Abaixo disso
 * a direção não se lê nessa escala, e desenhar a ponta só suja o desenho — a
 * rede densa fica sem seta, como em qualquer mapa de rede do gênero.
 */
export const ARROW_MIN_WIDTH = 1.2;

/** Geometria da seta para uma aresta de espessura `width` (`null` = sem seta). */
function arrowFor(width: number): { length: number; half: number } | null {
  if (width < ARROW_MIN_WIDTH) return null;
  const length = Math.min(ARROW.length, width * ARROW.ratio * 2);
  return { length, half: (length * ARROW.half) / ARROW.length };
}

/** Desvio do arco, em fração do comprimento da aresta (`linkStyle: curved`). */
const CURVE = 0.16;

/** Piso de proporção — evita divisão por zero num grafo perfeitamente linear. */
const EPSILON = 1e-6;

/** Casas decimais nas coordenadas — DOM menor e diff estável entre renders. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Converte um ponto do quadrado unitário para pixel dentro do viewport. */
export function toScreen(
  point: { x: number; y: number },
  viewport: Viewport,
): { x: number; y: number } {
  const { width, height, padding, fit, extent } = viewport;
  const innerWidth = Math.max(width - padding.left - padding.right, 1);
  const innerHeight = Math.max(height - padding.top - padding.bottom, 1);
  const spanX = Math.max(extent.x, EPSILON);
  const spanY = Math.max(extent.y, EPSILON);

  if (fit === 'uniform') {
    // UM fator de escala para os dois eixos — o que preserva a geometria — e o
    // maior que ainda cabe no retângulo. O sobrante vira margem simétrica: o
    // desenho fica centralizado, nunca deformado.
    const scale = Math.min(innerWidth / spanX, innerHeight / spanY);
    const left = padding.left + (innerWidth - spanX * scale) / 2;
    const top = padding.top + (innerHeight - spanY * scale) / 2;
    return { x: round(left + point.x * scale), y: round(top + point.y * scale) };
  }

  return {
    x: round(padding.left + (point.x / spanX) * innerWidth),
    y: round(padding.top + (point.y / spanY) * innerHeight),
  };
}

/** Traçado de uma aresta: o caminho e (opcionalmente) a ponta de seta. */
export interface EdgeShape {
  /** Atributo `d` do `<path>`. */
  path: string;
  /** Atributo `points` do `<polygon>` da seta — `null` quando não há seta. */
  arrow: string | null;
}

/**
 * Traçado entre dois nós.
 *
 * A linha nasce e morre na BORDA dos círculos (nunca no centro): passar por
 * baixo do nó é o que faz um grafo parecer uma teia furada, e some assim que a
 * cor do nó é clara. Com seta, o traço para antes da ponta — senão a linha
 * atravessa o triângulo e engorda a marca.
 */
export function edgeShape(
  from: ScreenNode,
  to: ScreenNode,
  options: { curved: boolean; arrow: boolean; width?: number },
): EdgeShape {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;

  const head = options.arrow ? arrowFor(options.width ?? ARROW.length) : null;

  const start = {
    x: from.x + ux * (from.r + NODE_GAP),
    y: from.y + uy * (from.r + NODE_GAP),
  };
  const tip = { x: to.x - ux * (to.r + NODE_GAP), y: to.y - uy * (to.r + NODE_GAP) };

  if (!options.curved) {
    const end = head ? back(tip, ux, uy, head.length) : tip;
    return {
      path: `M${round(start.x)},${round(start.y)} L${round(end.x)},${round(end.y)}`,
      arrow: head ? arrowPoints(tip, ux, uy, head) : null,
    };
  }

  // Quadrática com o controle deslocado na PERPENDICULAR do meio do segmento.
  const control = {
    x: (start.x + tip.x) / 2 - uy * length * CURVE,
    y: (start.y + tip.y) / 2 + ux * length * CURVE,
  };
  // A seta segue a TANGENTE na chegada (P1 − C), não a reta entre os centros.
  const tangentX = tip.x - control.x;
  const tangentY = tip.y - control.y;
  const tangent = Math.hypot(tangentX, tangentY) || 1;
  const tx = tangentX / tangent;
  const ty = tangentY / tangent;
  const end = head ? back(tip, tx, ty, head.length) : tip;

  return {
    path:
      `M${round(start.x)},${round(start.y)} ` +
      `Q${round(control.x)},${round(control.y)} ${round(end.x)},${round(end.y)}`,
    arrow: head ? arrowPoints(tip, tx, ty, head) : null,
  };
}

/** Recua um ponto ao longo da direção informada. */
function back(
  point: { x: number; y: number },
  ux: number,
  uy: number,
  distance: number,
): { x: number; y: number } {
  return { x: point.x - ux * distance, y: point.y - uy * distance };
}

/** Triângulo da seta: ponta encostada no nó, base recuada. */
function arrowPoints(
  tip: { x: number; y: number },
  ux: number,
  uy: number,
  head: { length: number; half: number },
): string {
  const base = back(tip, ux, uy, head.length);
  const left = { x: base.x - uy * head.half, y: base.y + ux * head.half };
  const right = { x: base.x + uy * head.half, y: base.y - ux * head.half };
  return [tip, left, right]
    .map((point) => `${round(point.x)},${round(point.y)}`)
    .join(' ');
}

/**
 * Mantém o rótulo dentro do quadro.
 *
 * O texto é centralizado no nó, e nó na borda = metade do rótulo cortada pelo
 * viewport do SVG. Em vez de recortar (ou de reservar uma margem do tamanho do
 * maior rótulo, que encolheria o desenho inteiro por causa de um nó), o rótulo
 * escorrega o mínimo necessário para caber.
 */
export function clampLabelX(x: number, textWidth: number, width: number): number {
  const half = Math.min(textWidth / 2, width / 2);
  return round(Math.min(Math.max(x, half), width - half));
}

/** Largura aproximada de um texto — 0,55em por caractere na fonte do tema. */
export function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.55;
}

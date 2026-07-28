/**
 * Geometria e paleta dos feixes do `background_beams`.
 *
 * Sai do componente por dois motivos: mantém o arquivo do efeito dentro do
 * limite de tamanho e separa o que é DESENHO (coordenadas de `viewBox`) do que
 * é COMPORTAMENTO (animação, movimento reduzido).
 *
 * O efeito original trazia os 50 traçados escritos à mão — 50 linhas de string
 * quase idênticas. Eles são a MESMA curva transladada, então aqui é uma curva
 * só, gerada por índice: menos superfície para errar e fácil de ajustar.
 */

/** Densidade do efeito: quantos feixes são desenhados. */
const BEAM_COUNT = 50;

/**
 * Curva-base de um feixe em coordenadas do `viewBox` (geometria de desenho,
 * não medida de layout — por isso não passa por `--spacing-*`).
 * Ordem: ponto do `M`, depois os dois trios de controle dos comandos `C`.
 */
const BEAM_CURVE: readonly (readonly [number, number])[] = [
  [-380, -189],
  [-380, -189],
  [-312, 216],
  [152, 343],
  [616, 470],
  [684, 875],
  [684, 875],
];

/** Deslocamento de um feixe para o seguinte (coordenadas do `viewBox`). */
const BEAM_OFFSET = { x: 7, y: -8 } as const;

/** Caixa de desenho do efeito. */
export const BEAM_VIEW_BOX = '0 0 696 316';

/** Um feixe: a curva-base transladada `index` vezes. */
function beamPath(index: number): string {
  const [p0, p1, p2, p3, p4, p5, p6] = BEAM_CURVE.map(
    ([x, y]) => `${x + index * BEAM_OFFSET.x} ${y + index * BEAM_OFFSET.y}`,
  );
  return `M${p0}C${p1} ${p2} ${p3}C${p4} ${p5} ${p6}`;
}

/** Todos os traçados, na ordem em que são desenhados. */
export const BEAM_PATHS: readonly string[] = Array.from(
  { length: BEAM_COUNT },
  (_, index) => beamPath(index),
);

/** Parada do gradiente de um feixe. */
export interface BeamStop {
  offset: string;
  /** Token de cor do tema (rampa categórica de data-viz). */
  token: string;
  opacity: number;
}

/** Paradas do gradiente — três cores da rampa categórica do DS. */
export const BEAM_STOPS: readonly BeamStop[] = [
  { offset: '0%', token: '--color-data-categorical-cyan', opacity: 0 },
  { offset: '0%', token: '--color-data-categorical-cyan', opacity: 1 },
  { offset: '32.5%', token: '--color-data-categorical-indigo', opacity: 1 },
  { offset: '100%', token: '--color-data-categorical-purple', opacity: 0 },
];

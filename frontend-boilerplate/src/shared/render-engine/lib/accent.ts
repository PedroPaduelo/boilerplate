/**
 * Acento de cor para blocos de visualização do catálogo (chart-N + primary).
 *
 * Catálogo fechado de cores que os blocos do render-engine aceitam via
 * `manifest.propsSchema` e que a UI base (`bg-chart-1..5`/`bg-primary`)
 * entende nativamente — mantém a paleta do DS, sem cor hardcoded no bloco
 * (hex, rgb, blue-500 etc.).
 *
 * Por que ENUM e não string livre:
 *  - o `manifest.propsSchema` valida com ajv no BE/IA → enum trava valores
 *    inválidos na borda (em vez de quebrar em runtime no front);
 *  - o autocomplete do editor de blocos fica exato (sem "qual era o nome?");
 *  - `accentClass()` traduz 1:1 para a classe Tailwind que o UI base espera.
 *
 * Quando precisarmos de um palette (múltiplas séries), cada série vai
 * ciclar pelos `chart-1..5` na ordem — função `paletteClass(idx)` abaixo.
 */

/** Acento de cor aceito pelos blocos single-série. */
export type AccentColor =
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5'
  | 'primary';

/** Lista de acentos válidos (mesma ordem do tipo) — p/ `enum` no JSON Schema. */
export const ACCENT_COLORS: readonly AccentColor[] = [
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'primary',
] as const;

/** Acento default (azul-claro do DS). */
export const ACCENT_DEFAULT: AccentColor = 'chart-1';

/** Traduz um `AccentColor` em classe Tailwind que o UI base aceita. */
export function accentClass(color: AccentColor | undefined): string {
  return `bg-${color ?? ACCENT_DEFAULT}`;
}

/** Palette cíclica (5 cores do DS) — p/ multi-série. */
export const PALETTE: readonly AccentColor[] = [
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
] as const;

/** Cor de uma série pelo índice (cicla a palette). */
export function paletteClass(index: number): string {
  return accentClass(PALETTE[index % PALETTE.length]);
}

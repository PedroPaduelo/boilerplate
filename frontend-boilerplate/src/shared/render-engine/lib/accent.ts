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
 *
 * Para o PLAYGROUND (`#40E0D0`, `bg-purple-500`, `linear-gradient(...)`):
 * o schema aceita enum, mas o input livre do ColorFieldEditor permite
 * string custom. `resolveAccent()` detecta o tipo de string e retorna
 * `{ className }` (Tailwind) ou `{ style }` (CSS color/gradient).
 */

import type { CSSProperties } from 'react';

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

/**
 * Traduz um `AccentColor` em classe Tailwind de **STROKE** (não background).
 * Usado por charts SVG (line/area/spark) onde a cor do traço é `stroke-…`,
 * e.g. `stroke-chart-1` no `polyline`/`line`. O CSS var do tema é
 * `--color-chart-1` (a regra `stroke-chart-1` resolve
 * `stroke: var(--color-chart-1)` no tema — shadcn/Tailwind).
 */
export function accentStrokeClass(color: AccentColor | undefined): string {
  return `stroke-${color ?? ACCENT_DEFAULT}`;
}

/** Type guard: checa se `value` é um AccentColor válido. Útil p/ detectores
 *  de "enum de cor" e pra normalização de input livre em editores (ex.: o
 *  playground do catálogo). */
export function isAccentColor(value: unknown): value is AccentColor {
  return typeof value === 'string'
    && (ACCENT_COLORS as readonly string[]).includes(value);
}

/** Heurística: a string é uma COR CSS (hex / rgb / hsl / oklch / color() /
 *  linear-gradient / radial-gradient / conic-gradient)? Se sim, vai via
 *  `style.background` (mais flexível que classe Tailwind). Caso contrário,
 *  é classe Tailwind (`bg-purple-500`, `bg-chart-1` etc.) — vai via
 *  `className`. */
export function looksLikeCssColor(v: string): boolean {
  const s = v.trim();
  if (!s) return false;
  return (
    /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) ||
    /^(rgb|rgba|hsl|hsla|oklch|oklab|color)\(/i.test(s) ||
    /^(linear|radial|conic)-gradient\(/i.test(s)
  );
}

/** Resultado de `resolveAccent`: a cor a aplicar vem OU como classe Tailwind
 *  (`className`) OU como estilo inline (`style`). Nunca ambos. A UI base
 *  decide qual usar (BarChart/HBarChart: se `style` vier, ignora `accent`). */
export type ResolvedAccent =
  | { kind: 'class'; className: string }
  | { kind: 'style'; style: CSSProperties };

/** Resolve um valor de `accent` (string livre) em:
 *   - `{ kind: 'class', className: 'bg-chart-1' }` se for um AccentColor do enum
 *     (mantém a paleta do DS, autocontida);
 *   - `{ kind: 'style', style: { background: '#40E0D0' } }` se for cor CSS
 *     crua (hex/rgb/hsl/oklch/gradient);
 *   - `{ kind: 'class', className: 'bg-purple-500' }` se for classe Tailwind
 *     (fallback — `bg-chart-1` bare vira `bg-chart-1`, `bg-purple-500` vira
 *     `bg-purple-500`); */
export function resolveAccent(value: string | undefined | null): ResolvedAccent {
  if (value == null || value === '') {
    return { kind: 'class', className: accentClass(undefined) };
  }
  const s = String(value).trim();
  if (!s) {
    return { kind: 'class', className: accentClass(undefined) };
  }
  // 1) enum AccentColor (bare, ex.: "chart-2")
  if (isAccentColor(s)) {
    return { kind: 'class', className: accentClass(s) };
  }
  // 2) "bg-chart-1" / "bg-purple-500" — já é classe Tailwind; usa direto.
  if (s.startsWith('bg-') || s.startsWith('text-') || s.includes(' ')) {
    return { kind: 'class', className: s };
  }
  // 3) cor CSS crua (hex/rgb/hsl/oklch/gradient) → style inline.
  if (looksLikeCssColor(s)) {
    return { kind: 'style', style: { background: s } };
  }
  // 4) fallback: tenta como classe Tailwind (ex.: usuário digitou
  // "purple-500" sem prefixo — prefixamos "bg-" pra ajudar).
  return { kind: 'class', className: `bg-${s}` };
}

/** Mesma semântica de `resolveAccent` mas com a cor no campo `stroke`
 *  (em vez de `background`). Pensada pra charts SVG (line/area/spark) que
 *  aplicam cor via atributo `stroke={…}` e precisam do CSS var
 *  `var(--chart-N)` quando a cor é do enum do DS — sem isso, classes
 *  Tailwind `stroke-chart-N` poderiam não casar com o tema dependendo
 *  de como o SVG está renderizando. Devolve:
 *   - `{ kind: 'class', className: 'stroke-chart-1' }` p/ enum do DS
 *     (classe Tailwind `stroke-chart-N` — o CSS var é resolvido pela
 *     regra `stroke-chart-1 { stroke: var(--color-chart-1) }` gerada
 *     pelo shadcn);
 *   - `{ kind: 'style', style: { stroke: '#40E0D0' } }` p/ cor CSS crua
 *     (hex/rgb/hsl/oklch/gradient) — aplicado via `style="..."` no
 *     elemento SVG, atributo presentation que vence o `stroke=` default;
 *   - `{ kind: 'class', className: 'stroke-purple-500' }` p/ classe
 *     Tailwind bare (`stroke-…`); se vier `purple-500` sem prefixo,
 *     prefixa `stroke-`. */
export function resolveAccentForStroke(
  value: string | undefined | null,
): ResolvedAccent {
  if (value == null || value === '') {
    return { kind: 'class', className: accentStrokeClass(undefined) };
  }
  const s = String(value).trim();
  if (!s) {
    return { kind: 'class', className: accentStrokeClass(undefined) };
  }
  if (isAccentColor(s)) {
    return { kind: 'class', className: accentStrokeClass(s) };
  }
  if (s.startsWith('stroke-') || s.startsWith('fill-') || s.includes(' ')) {
    return { kind: 'class', className: s };
  }
  if (looksLikeCssColor(s)) {
    return { kind: 'style', style: { stroke: s } };
  }
  return { kind: 'class', className: `stroke-${s}` };
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

/** Equivalente stroke do `paletteClass` — classe Tailwind `stroke-chart-N`
 *  para o índice da série. */
export function paletteStrokeClass(index: number): string {
  return accentStrokeClass(PALETTE[index % PALETTE.length]);
}

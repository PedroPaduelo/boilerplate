/**
 * Regra de COR do bloco `bar_chart` — em arquivo próprio porque é onde mora a
 * precedência (cor manual por série > modo de paleta) e porque ela é a parte
 * que mais muda quando alguém edita o bloco no playground.
 *
 * Toda cor que sai daqui é um token de dado do design system: `accent` e
 * `seriesColors` passam por `chartAccentColor()`, que aceita o vocabulário
 * antigo e devolve token — ou `undefined`, que significa "deixe a paleta
 * ciclar".
 */
import { chartAccentColor } from '@/shared/ui';
import type { ChartSeriesColor } from '@/shared/ui';

/** Modo de paleta aceito pelo bloco. */
export type BarPaletteMode = 'single' | 'multi' | 'none';

export interface BarColorOptions {
  /** Modo de paleta declarado nas props. */
  palette?: BarPaletteMode;
  /** Cor base, usada quando `palette === 'single'`. */
  accent?: string;
  /** Cor por série, na ordem — vence o modo de paleta. */
  seriesColors?: string[];
}

/**
 * Cor da série/categoria de índice `index`.
 *
 * Precedência: `seriesColors[index]` (escolha manual) → `accent` no modo
 * `single` → `undefined` (paleta cíclica do DS) nos modos `multi` e `none`.
 */
export function barColorAt(
  index: number,
  { palette = 'single', accent, seriesColors }: BarColorOptions,
): ChartSeriesColor | undefined {
  const manual = seriesColors?.[index];
  if (typeof manual === 'string' && manual.trim() !== '') {
    const color = chartAccentColor(manual);
    if (color) return color;
  }
  return palette === 'single' ? chartAccentColor(accent) : undefined;
}

/**
 * `true` quando as BARRAS devem receber uma cor por categoria em vez de uma
 * cor por série — só faz sentido com série única, que é o ranking simples que
 * o modo `multi` sempre desenhou colorido.
 */
export function isColorByCategory(
  seriesCount: number,
  palette: BarPaletteMode | undefined,
): boolean {
  return palette === 'multi' && seriesCount === 1;
}

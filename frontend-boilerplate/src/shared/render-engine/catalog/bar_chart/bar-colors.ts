/**
 * Regra de COR do bloco `bar_chart` — em arquivo próprio porque é onde mora a
 * precedência (cor manual por série > cor pedida > modo de paleta) e porque ela
 * é a parte que mais muda quando alguém edita o bloco no playground.
 *
 * Toda cor que sai daqui é um token de dado do design system: `accent` e
 * `seriesColors` passam por `chartAccentColor()`, que aceita o vocabulário
 * antigo e devolve token — ou `undefined`, que significa "deixe a paleta
 * ciclar".
 *
 * ---------------------------------------------------------------------------
 * O QUE MUDOU, E POR QUÊ
 * ---------------------------------------------------------------------------
 * A regra anterior era `palette === 'single' ? chartAccentColor(accent) : undefined`:
 * `accent` só valia se o autor TAMBÉM escolhesse `palette: "single"`. Medido na
 * auditoria de inércia, percorrer os seis valores de `accent` não mudava um
 * pixel — e `palette: "single"` sem `accent` desenhava igual a `"none"`, porque
 * os dois caíam em "cicle a paleta".
 *
 * Agora a precedência é a que se deduz lendo o contrato (publicada em
 * `shared/ui/chart-accent.ts` e aplicada por `lib/series-color.ts`):
 * cor manual da série → `accent` → modo de paleta.
 */
import { CHART_SERIES_COLORS, chartAccentColor } from '@/shared/ui';
import type { ChartSeriesColor } from '@/shared/ui';
import {
  fixedSeriesColor,
  isMultiColorMode,
  type PaletteMode,
} from '../../lib/series-color';

/** Modo de paleta aceito pelo bloco. */
export type BarPaletteMode = PaletteMode;

export interface BarColorOptions {
  /** Modo de paleta declarado nas props. */
  palette?: BarPaletteMode | string;
  /** Cor pedida pelo autor — vence o modo de paleta. */
  accent?: string;
  /** Cor por série, na ordem — vence tudo. */
  seriesColors?: string[];
}

/**
 * Cor da série/categoria de índice `index`.
 *
 * Precedência: `seriesColors[index]` (escolha manual, por série) → `accent`
 * (escolha para o gráfico inteiro) → `palette`. `undefined` significa "a paleta
 * cicla" (modo `multi`) ou "use a cor padrão do tipo" (o VERDE80 da §4).
 */
export function barColorAt(
  index: number,
  { palette, accent, seriesColors }: BarColorOptions,
): ChartSeriesColor | undefined {
  const manual = seriesColors?.[index];
  if (typeof manual === 'string' && manual.trim() !== '') {
    const color = chartAccentColor(manual);
    if (color) return color;
  }
  return fixedSeriesColor({ palette, accent });
}

/**
 * Cor da barra da série `seriesIndex` na orientação HORIZONTAL.
 *
 * O gráfico horizontal cicla a paleta por BARRA (é um ranking: cada linha é uma
 * categoria), enquanto o vertical cicla por SÉRIE. Com dado multi-série as duas
 * contagens deixam de coincidir — "Jan · Receita" é a barra 0 e "Jan · Despesa"
 * a barra 1, mas elas são as séries 0 e 1 repetidas a cada mês. Sem fixar a cor
 * aqui, a mesma série sairia de uma cor diferente em cada mês, que é o oposto
 * do que a cor deveria comunicar.
 */
export function hBarColorAt(
  seriesIndex: number,
  options: BarColorOptions,
): ChartSeriesColor | undefined {
  const explicit = barColorAt(seriesIndex, options);
  if (explicit) return explicit;
  if (!isMultiColorMode(options)) return undefined;
  return CHART_SERIES_COLORS[seriesIndex % CHART_SERIES_COLORS.length];
}

/**
 * `true` quando as BARRAS devem receber uma cor por categoria em vez de uma
 * cor por série — só faz sentido com série única, que é o ranking simples que
 * o modo `multi` sempre desenhou colorido. Com `accent` declarado o modo não
 * liga: o autor pediu UMA cor.
 */
export function isColorByCategory(
  seriesCount: number,
  options: BarColorOptions,
): boolean {
  return seriesCount === 1 && isMultiColorMode(options);
}

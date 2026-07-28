/**
 * COR DE SÉRIE dos blocos de gráfico — a tradução de (`palette`, `accent`) em
 * "qual cor cada série/categoria recebe".
 *
 * A REGRA de precedência entre as duas props é publicada em
 * `shared/ui/chart-accent.ts` (`chartAccentColor` + `isMultiColorPalette`):
 *
 *   1. `accent` reconhecível VENCE SEMPRE — pedir uma cor É pedir cor única;
 *   2. `palette: "multi"` só liga o multicolorido quando NÃO há `accent`.
 *
 * Este módulo é o terceiro caso, o que a regra deixa em aberto e que cada bloco
 * resolvia de um jeito: **`palette: "single"` SEM `accent`**. Antes disso caía
 * em `chartAccentColor(undefined)` → `undefined` → "cicle a paleta", ou seja,
 * `single` desenhava exatamente o mesmo que `multi`. Foi o que a auditoria de
 * inércia mediu como `bar_chart.palette: single = none` e o que sobraria em
 * área/linha depois de tirar o default de fábrica de `accent`.
 *
 * Aqui `single` explícito passa a significar o que o nome diz: UMA COR para
 * todas as séries — a primeira do ciclo, que é a cor que o tipo já usa na série
 * 1. Nada de cor nova: só a mesma, repetida.
 *
 * ---------------------------------------------------------------------------
 * POR QUE `palette` AUSENTE ≠ `palette: "single"`
 * ---------------------------------------------------------------------------
 * Ausência devolve `undefined` (= "cor padrão do tipo"), e não a 1ª do ciclo,
 * porque os tipos têm um padrão PRÓPRIO que não é a cor 1 crua: barra e barra
 * horizontal pintam com o VERDE ESCURO A 80% (`palette.primary80`), a cor mais
 * recorrente da referência. Devolver a cor 1 aqui trocaria esse verde pelo
 * `primary-main` em todo gráfico que não declara `palette` — um desvio visual
 * silencioso, causado por um helper que deveria ser neutro.
 */
import { CHART_SERIES_COLORS, chartAccentColor, isMultiColorPalette } from '@/shared/ui';
import type { ChartSeriesColor } from '@/shared/ui';

/**
 * Modo de paleta aceito pelos blocos de gráfico.
 *
 * O valor `'none'` foi REMOVIDO dos manifestos por redundância — medido na
 * auditoria, ele nunca produziu um desenho diferente de `single` (barras) ou de
 * `multi` (área, linha, dispersão). Continua ACEITO em runtime porque um painel
 * salvo pode trazê-lo: cai no ramo "cor padrão do tipo", que é o que ele já
 * fazia.
 */
export type PaletteMode = 'single' | 'multi' | 'none';

/** Entrada da regra de cor: as duas props públicas do bloco. */
export interface SeriesColorOptions {
  /** Modo de paleta declarado no bloco. */
  palette?: PaletteMode | string;
  /** Cor pedida pelo autor (enum do catálogo ou vocabulário antigo). */
  accent?: string;
}

/**
 * Cor FIXA de todas as séries/categorias do bloco, ou `undefined` quando a cor
 * deve sair da paleta (uma por série) ou do padrão do tipo.
 *
 * @example
 * fixedSeriesColor({ accent: 'chart-3' });                    // 'cyan'  → pedido explícito
 * fixedSeriesColor({ palette: 'multi' });                     // undefined → cicla a paleta
 * fixedSeriesColor({ palette: 'multi', accent: 'chart-3' });  // 'cyan'  → accent vence
 * fixedSeriesColor({ palette: 'single' });                    // 'emerald' → uma cor só
 * fixedSeriesColor({});                                       // undefined → padrão do tipo
 */
export function fixedSeriesColor({
  palette,
  accent,
}: SeriesColorOptions): ChartSeriesColor | undefined {
  const requested = chartAccentColor(accent);
  if (requested) return requested;
  return palette === 'single' ? CHART_SERIES_COLORS[0] : undefined;
}

/**
 * O bloco deve pintar UMA COR POR CATEGORIA (modo multicolorido)?
 *
 * Reexporta a decisão de `shared/ui/chart-accent.ts` com a assinatura das props
 * do bloco, para que componente e regra de cor leiam da MESMA fonte — foi a
 * cópia dessa condição em cada bloco que produziu as oito variações medidas
 * pela auditoria.
 */
export function isMultiColorMode({ palette, accent }: SeriesColorOptions): boolean {
  return isMultiColorPalette(palette, accent);
}

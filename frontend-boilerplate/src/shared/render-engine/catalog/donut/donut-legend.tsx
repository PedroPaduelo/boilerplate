/**
 * LEGENDA do bloco `donut` — o que sobrou de específico depois da repaginação.
 *
 * A legenda em si passou a ser a `ChartLegends` da base (§3 de
 * `05-tooltip-legenda-css.md`: item em coluna, ponto de 12px, rótulo de
 * 11,375px/500 e valor de 14,875px/600), desenhada pelo próprio `DonutChart` —
 * ele é quem conhece a sequência de cores das fatias, e legenda com cor
 * diferente do anel é o pior defeito possível num gráfico de composição.
 *
 * O que continua sendo do BLOCO é o TEXTO do valor: a referência mostra só o
 * número, mas o `showLegend` deste bloco promete "valor absoluto e participação
 * no total" — é ela que dá a leitura numérica que o anel não consegue dar.
 * Este módulo é essa regra, e nada mais.
 */
import type { ChartPoint } from '@/shared/ui';
import { formatPercentBR } from '@/shared/lib/format';

/**
 * Monta o formatador do valor da legenda: `"62 (62%)"` — absoluto e
 * participação, na ordem em que se lê.
 *
 * @param total  Soma das fatias (denominador da participação).
 * @param format Formatador do valor absoluto, escolhido por `valueFormat`.
 */
export function donutLegendValue(
  total: number,
  format: (value: number) => string,
): (point: ChartPoint) => string {
  // Evita divisão por zero sem esconder o dado: com total 0, toda fatia é 0%.
  const denominator = total || 1;
  return (point) =>
    `${format(point.value)} (${formatPercentBR(point.value / denominator)})`;
}

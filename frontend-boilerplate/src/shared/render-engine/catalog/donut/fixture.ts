/**
 * Fixture do bloco `donut` — casa com o dataContract (shape 'categorical').
 *
 * QUATRO categorias de propósito: é o que a galeria/preview desenha, e a
 * sequência de cores da referência (`03-tipos-de-grafico.md` §9) tem
 * exatamente quatro — verde escuro a 80%, âmbar, azul petróleo e vermelho.
 * Com três, a última cor nunca apareceria em nenhuma tela de exemplo.
 *
 * VALORES NA CASA DOS MILHÕES de propósito. Eles eram 62/38/24/11, e com um
 * total de 135 os quatro formatos de `valueFormat` colapsavam em dois: "R$
 * 135,00" saía igual em `BRL` e `compactBRL`, "135" igual em `number` e
 * `compactNumber` (a notação compacta só abrevia a partir do milhar). Ou seja,
 * a prop parecia quebrada no preview por culpa do DADO, não do código. Com
 * valores de arrecadação de verdade, os cinco formatos leem diferente —
 * "R$ 1.284.500,00", "R$ 1,28 mi", "1.284.500", "1,28 mi" — e quem escolhe
 * enxerga o efeito antes de publicar.
 */
import type { CategoricalData } from '@dashboards/contracts';

export const fixture: CategoricalData = [
  { label: 'Quitado', value: 1284500 },
  { label: 'Em aberto', value: 786300 },
  { label: 'Parcelado', value: 431200 },
  { label: 'Cancelado', value: 92750 },
];

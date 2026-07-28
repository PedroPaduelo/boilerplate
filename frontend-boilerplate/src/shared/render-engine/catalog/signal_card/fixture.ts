/**
 * Fixture do bloco `signal_card` — casa com o dataContract (shape 'series').
 *
 * MAGNITUDE (milhares, não dezenas): a fixture antiga ia de 48 a 66, e nessa
 * faixa `number` e `compactNumber` imprimem o mesmo texto ("66"), assim como
 * `BRL` e `compactBRL` — metade do enum de `valueFormat` ficava indistinguível
 * na pré-visualização do catálogo, e a auditoria de inércia mediu os empates.
 * Como o default deste bloco é `compactNumber`, a fixture antiga ainda por cima
 * escondia justamente o que o default faz de diferente.
 *
 * A série continua com o mesmo FORMATO de tendência (alta com um respiro no
 * meio), que é o que o cartão precisa mostrar: valor em destaque, variação e
 * direção.
 */
import type { SeriesData } from '@dashboards/contracts';

export const fixture: SeriesData = [
  { x: '1', y: 48200 },
  { x: '2', y: 51400 },
  { x: '3', y: 47900 },
  { x: '4', y: 55300 },
  { x: '5', y: 58100 },
  { x: '6', y: 54600 },
  { x: '7', y: 62800 },
  { x: '8', y: 66500 },
];

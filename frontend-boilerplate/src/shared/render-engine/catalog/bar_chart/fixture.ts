/**
 * Fixture do bloco `bar_chart` — casa com o dataContract (shape 'series').
 *
 * DUAS SÉRIES, e não uma. A fixture antiga era `[{x:'Jan', y:120}, …]`, sem o
 * campo `series` — e sem série nomeada o bloco degrada para barras planas de
 * propósito. Consequência: `stacked` não tinha o que empilhar, `palette:"multi"`
 * não tinha o que ciclar e `seriesColors` não tinha a quem se aplicar. Três
 * props anunciadas no manifesto que a pré-visualização do catálogo mostrava
 * como se não fizessem nada — foi assim que a auditoria mediu `stacked` como
 * INERTE. O `dataContract.example` deste mesmo manifesto JÁ mostrava
 * Receita/Despesa: a fixture é que estava atrás do contrato.
 *
 * MAGNITUDE (milhares, não dezenas): abaixo de mil, `number` e `compactNumber`
 * imprimem o mesmo texto ("120"), e `BRL` e `compactBRL` também — metade do
 * enum de `valueFormat` ficava indistinguível para quem lê o catálogo. Acima de
 * mil a forma compacta abrevia ("1,24 mil") e os quatro formatos viram quatro
 * leituras diferentes.
 */
import type { SeriesData } from '@dashboards/contracts';

export const fixture: SeriesData = [
  { x: 'Jan', y: 1240, series: 'Receita' },
  { x: 'Jan', y: 830, series: 'Despesa' },
  { x: 'Fev', y: 980, series: 'Receita' },
  { x: 'Fev', y: 720, series: 'Despesa' },
  { x: 'Mar', y: 1510, series: 'Receita' },
  { x: 'Mar', y: 990, series: 'Despesa' },
  { x: 'Abr', y: 860, series: 'Receita' },
  { x: 'Abr', y: 640, series: 'Despesa' },
  { x: 'Mai', y: 1120, series: 'Receita' },
  { x: 'Mai', y: 810, series: 'Despesa' },
];

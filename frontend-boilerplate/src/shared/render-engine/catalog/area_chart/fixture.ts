/**
 * Fixture do bloco `area_chart` — casa com o dataContract (shape 'series').
 *
 * DUAS séries de propósito: é a composição do layout de referência
 * (`03-tipos-de-grafico.md` §2 — Área) e o único dado capaz de mostrar o que
 * `type` faz — com uma série só, "sobreposta" e "empilhada" desenham a mesma
 * figura, e a prop parece quebrada na pré-visualização do catálogo.
 *
 * MAGNITUDE (milhares, não dezenas): a fixture antiga ia de 82 a 182, e nessa
 * faixa `number` e `compactNumber` imprimem exatamente o mesmo texto ("120"),
 * assim como `BRL` e `compactBRL` ("R$ 120,00"). Metade do enum de
 * `valueFormat` ficava indistinguível para quem lê o catálogo — e para a
 * auditoria de inércia, que mediu os empates. Acima de mil a forma compacta
 * passa a abreviar ("1,24 mil") e os quatro formatos viram quatro leituras
 * diferentes. Continua sendo uma grandeza plausível para receita/despesa
 * mensal, e o eixo Y (compacto) não fica mais largo por causa disso.
 */
import type { SeriesData } from '@dashboards/contracts';

export const fixture: SeriesData = [
  { x: '2026-01', y: 1240, series: 'Receita' },
  { x: '2026-01', y: 820, series: 'Despesa' },
  { x: '2026-02', y: 1380, series: 'Receita' },
  { x: '2026-02', y: 950, series: 'Despesa' },
  { x: '2026-03', y: 1310, series: 'Receita' },
  { x: '2026-03', y: 990, series: 'Despesa' },
  { x: '2026-04', y: 1650, series: 'Receita' },
  { x: '2026-04', y: 1040, series: 'Despesa' },
  { x: '2026-05', y: 1820, series: 'Receita' },
  { x: '2026-05', y: 1180, series: 'Despesa' },
  { x: '2026-06', y: 1760, series: 'Receita' },
  { x: '2026-06', y: 1210, series: 'Despesa' },
];

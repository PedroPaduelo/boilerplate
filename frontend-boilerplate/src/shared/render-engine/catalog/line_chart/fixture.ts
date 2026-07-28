/**
 * Fixture do bloco `line_chart` — casa com o dataContract (shape 'series').
 *
 * DUAS séries de propósito: é a composição do layout de referência
 * (`03-tipos-de-grafico.md` §1 — Linha), que desenha o verde escuro a 80% e o
 * âmbar com a legenda ligada. Com uma série só, a pré-visualização do bloco
 * não mostraria nem a segunda cor nem a legenda.
 *
 * MAGNITUDE (milhares, não dezenas): a fixture antiga ia de 9 a 30, e nessa
 * faixa `number` e `compactNumber` imprimem o mesmo texto ("18"), assim como
 * `BRL` e `compactBRL` — metade do enum de `valueFormat` ficava indistinguível
 * na pré-visualização do catálogo, e a auditoria de inércia mediu os empates.
 * Acima de mil a forma compacta abrevia ("1,2 mil") e os quatro formatos viram
 * quatro leituras diferentes.
 *
 * O eixo X segue temporal (`2026-01`…`2026-06`), como manda o dataContract.
 */
import type { SeriesData } from '@dashboards/contracts';

export const fixture: SeriesData = [
  { x: '2026-01', y: 1200, series: 'Arrecadado' },
  { x: '2026-02', y: 1800, series: 'Arrecadado' },
  { x: '2026-03', y: 1500, series: 'Arrecadado' },
  { x: '2026-04', y: 2400, series: 'Arrecadado' },
  { x: '2026-05', y: 3000, series: 'Arrecadado' },
  { x: '2026-06', y: 2800, series: 'Arrecadado' },
  { x: '2026-01', y: 900, series: 'Previsto' },
  { x: '2026-02', y: 1400, series: 'Previsto' },
  { x: '2026-03', y: 1700, series: 'Previsto' },
  { x: '2026-04', y: 1900, series: 'Previsto' },
  { x: '2026-05', y: 2200, series: 'Previsto' },
  { x: '2026-06', y: 2600, series: 'Previsto' },
];

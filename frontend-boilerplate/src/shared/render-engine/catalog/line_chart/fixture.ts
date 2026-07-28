/**
 * Fixture do bloco `line_chart` — casa com o dataContract (shape 'series').
 *
 * DUAS séries de propósito: é a composição do layout de referência
 * (`03-tipos-de-grafico.md` §1 — Linha), que desenha o verde escuro a 80% e o
 * âmbar com a legenda ligada. Com uma série só, a pré-visualização do bloco
 * não mostraria nem a segunda cor nem a legenda.
 *
 * O eixo X segue temporal (`2026-01`…`2026-06`), como manda o dataContract.
 */
import type { SeriesData } from '@dashboards/contracts';

export const fixture: SeriesData = [
  { x: '2026-01', y: 12, series: 'Arrecadado' },
  { x: '2026-02', y: 18, series: 'Arrecadado' },
  { x: '2026-03', y: 15, series: 'Arrecadado' },
  { x: '2026-04', y: 24, series: 'Arrecadado' },
  { x: '2026-05', y: 30, series: 'Arrecadado' },
  { x: '2026-06', y: 28, series: 'Arrecadado' },
  { x: '2026-01', y: 9, series: 'Previsto' },
  { x: '2026-02', y: 14, series: 'Previsto' },
  { x: '2026-03', y: 17, series: 'Previsto' },
  { x: '2026-04', y: 19, series: 'Previsto' },
  { x: '2026-05', y: 22, series: 'Previsto' },
  { x: '2026-06', y: 26, series: 'Previsto' },
];

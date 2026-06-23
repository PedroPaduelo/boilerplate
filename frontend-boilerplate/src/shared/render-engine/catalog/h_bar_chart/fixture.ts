/** Fixture do bloco `h_bar_chart` — casa com o dataContract (shape 'series'). */
import type { SeriesData } from '@dashboards/contracts';

export const fixture: SeriesData = [
  { x: 'Centro', y: 1200 },
  { x: 'Norte', y: 980 },
  { x: 'Sul', y: 870 },
  { x: 'Leste', y: 640 },
  { x: 'Oeste', y: 520 },
];

/** Fixture do bloco `bar_chart` — casa com o dataContract (shape 'series'). */
import type { SeriesData } from '@dashboards/contracts';

export const fixture: SeriesData = [
  { x: 'Jan', y: 120 },
  { x: 'Fev', y: 90 },
  { x: 'Mar', y: 150 },
  { x: 'Abr', y: 80 },
  { x: 'Mai', y: 110 },
];

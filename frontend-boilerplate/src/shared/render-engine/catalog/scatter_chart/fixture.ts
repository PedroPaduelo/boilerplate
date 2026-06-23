/** Fixture do bloco `scatter_chart` — casa com o dataContract (shape 'series'). */
import type { SeriesData } from '@dashboards/contracts';

export const fixture: SeriesData = [
  { x: 12, y: 40, series: 'Zona A' },
  { x: 20, y: 52, series: 'Zona A' },
  { x: 28, y: 49, series: 'Zona A' },
  { x: 35, y: 70, series: 'Zona A' },
  { x: 16, y: 30, series: 'Zona B' },
  { x: 24, y: 38, series: 'Zona B' },
  { x: 33, y: 44, series: 'Zona B' },
  { x: 42, y: 60, series: 'Zona B' },
];

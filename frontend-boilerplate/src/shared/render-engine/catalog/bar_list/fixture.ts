/** Fixture do bloco `bar_list` — casa com o dataContract (shape 'categorical'). */
import type { CategoricalData } from '@dashboards/contracts';

export const fixture: CategoricalData = [
  { label: 'IPTU', value: 4200 },
  { label: 'ISS', value: 3100 },
  { label: 'Taxas diversas', value: 2150 },
  { label: 'ITBI', value: 1480 },
  { label: 'Multas', value: 760 },
];

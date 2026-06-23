/** Fixture do bloco `metric_glow` — casa com o dataContract (shape 'scalar'). */
import type { ScalarData } from '@dashboards/contracts';

export const fixture: ScalarData = {
  value: 124500,
  label: 'Receita do mês',
  unit: 'BRL',
  delta: 0.125,
};

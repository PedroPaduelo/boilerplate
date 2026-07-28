/**
 * Fixture do bloco `bar_list` — casa com o dataContract (shape 'categorical').
 *
 * FORA DE ORDEM DE PROPÓSITO. A fixture é o dado que o catálogo mostra ao
 * usuário e ao agente, e antes ela vinha já ordenada do maior para o menor —
 * exatamente o resultado que `sortOrder: "descending"` produz. Com isso os três
 * valores da prop desenhavam a mesma lista (`descending` e `none` empatavam na
 * auditoria de inércia), e quem olhasse o preview concluiria que ordenar não
 * faz nada.
 *
 * Esta ordem é a que um `GROUP BY` devolve sem `ORDER BY`: a do banco, não a do
 * ranking. Assim `descending` reordena, `ascending` inverte e `none` preserva —
 * e as três leituras ficam visivelmente diferentes no próprio catálogo.
 */
import type { CategoricalData } from '@dashboards/contracts';

export const fixture: CategoricalData = [
  { label: 'ISS', value: 3100 },
  { label: 'IPTU', value: 4200 },
  { label: 'Multas', value: 760 },
  { label: 'ITBI', value: 1480 },
  { label: 'Taxas diversas', value: 2150 },
];

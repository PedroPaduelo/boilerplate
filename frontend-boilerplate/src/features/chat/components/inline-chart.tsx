/**
 * Gráficos INLINE da resposta — a porta de entrada (public API).
 *
 * São duas peças, porque são duas decisões diferentes:
 *
 *  - `InlineChart` (`inline-chart-card.tsx`) — UM gráfico: título, recorte,
 *    altura reservada e a ação de salvar. Decide sobre o card.
 *  - `InlineCharts` (`inline-chart-list.tsx`) — a SEQUÊNCIA: agrupa os cartões
 *    de número vizinhos numa grade em vez de empilhá-los. Decide sobre a lista,
 *    o que exige enxergar todos os gráficos do turno de uma vez.
 *
 * Quem consome importa daqui e não precisa saber dessa divisão — ela existe
 * para manter cada arquivo no tamanho em que ainda se lê inteiro.
 */
export { InlineChart } from './inline-chart-card';
export type { InlineChartProps } from './inline-chart-card';
export { InlineCharts } from './inline-chart-list';
export type { InlineChartsProps } from './inline-chart-list';

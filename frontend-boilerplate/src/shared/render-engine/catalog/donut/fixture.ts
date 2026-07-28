/**
 * Fixture do bloco `donut` — casa com o dataContract (shape 'categorical').
 *
 * QUATRO categorias de propósito: é o que a galeria/preview desenha, e a
 * sequência de cores da referência (`03-tipos-de-grafico.md` §9) tem
 * exatamente quatro — verde escuro a 80%, âmbar, azul petróleo e vermelho.
 * Com três, a última cor nunca apareceria em nenhuma tela de exemplo.
 */
import type { CategoricalData } from '@dashboards/contracts';

export const fixture: CategoricalData = [
  { label: 'Quitado', value: 62 },
  { label: 'Em aberto', value: 38 },
  { label: 'Parcelado', value: 24 },
  { label: 'Cancelado', value: 11 },
];

/**
 * COMPONENTE PRÓPRIO — vocabulário comum dos gráficos. O Astryx não define
 * tipos de data-viz, e sem um contrato único cada gráfico inventaria o seu
 * (`series`/`items`/`points`…). Um tipo só aqui = uma API previsível lá.
 */
import type { ChartSeriesColor } from './use-chart-palette';

/** Formata um número para exibição (eixo, tooltip, rótulo). */
export type ValueFormatter = (value: number) => string;

/** Uma série do gráfico: rótulo + valores alinhados às categorias do eixo. */
export interface ChartSeries {
  /** Nome exibido na legenda e no tooltip. */
  label: string;
  /** Valores, um por categoria do eixo X (na mesma ordem de `labels`). */
  data: number[];
  /** Cor fixa da série. Sem isto, cicla a paleta categórica pelo índice. */
  color?: ChartSeriesColor;
}

/** Um ponto categórico: rótulo + valor (donut, barras horizontais, ranking). */
export interface ChartPoint {
  /** Rótulo da categoria. */
  label: string;
  /** Valor numérico da categoria. */
  value: number;
  /** Cor fixa. Sem isto, cicla a paleta categórica pelo índice. */
  color?: ChartSeriesColor;
}

/**
 * Estados que TODO gráfico precisa cobrir. Um gráfico nunca desenha eixo vazio
 * em silêncio: ou carrega (`Skeleton`), ou avisa que não há dados.
 */
export interface ChartStateProps {
  /** Mostra `Skeleton` no lugar do gráfico. */
  isLoading?: boolean;
  /** Mensagem do estado sem dados. */
  emptyMessage?: string;
  /** Rótulo acessível — o gráfico é uma imagem de dados (`role="img"`). */
  label?: string;
  /** Equivalente textual dos dados, exposto só a leitores de tela. */
  summary?: string;
}

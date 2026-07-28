/**
 * ESQUELETO de carregamento dos gráficos (`01-fundamentos.md` §8).
 *
 * Cobre 100% da área do gráfico, herda o raio do contêiner e roda uma onda da
 * esquerda para a direita. Nos tipos circulares (pizza, rosca, medidor) vira um
 * CÍRCULO — um retângulo cinza no lugar de um anel é a diferença entre
 * "carregando" e "quebrou".
 *
 * Não usa o `Skeleton` do Astryx porque a referência especifica a cor
 * (`grey.400` a 12%), a duração (1,6s) e a forma circular; o do DS entrega uma
 * animação e um raio próprios. A cor continua saindo de token — o desenho é que
 * é da referência (`chart-theme.css` §4).
 */

export interface ChartSkeletonProps {
  /** Altura da área reservada, em px. */
  height: number;
  /** Vira um círculo — pizza, rosca e medidores. */
  isCircular?: boolean;
  /** Rótulo acessível ("Carregando <gráfico>"). */
  label?: string;
}

/** Área do gráfico enquanto os dados não chegaram. */
export function ChartSkeleton({
  height,
  isCircular = false,
  label = 'Carregando gráfico',
}: ChartSkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      data-slot="chart-loading"
      className={
        isCircular ? 'chart-skeleton chart-skeleton--circular' : 'chart-skeleton'
      }
      // runtime: a altura é a geometria reservada pelo gráfico, não espaçamento
      style={isCircular ? { height, width: height, margin: '0 auto' } : { height }}
    />
  );
}

/**
 * ESQUELETO de carregamento dos gráficos (`01-fundamentos.md` §8).
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE TEM A SILHUETA DO TIPO
 * ---------------------------------------------------------------------------
 * A primeira versão reservava a altura certa e pintava um retângulo cinza. Isso
 * resolvia o pulo de layout — o problema mecânico — e deixava o problema de
 * leitura de pé: um dashboard carregando virava uma parede de retângulos
 * idênticos, e o primeiro olhar do usuário (justamente o segundo em que ele
 * decide se a tela é boa) não dizia NADA sobre o que estava chegando.
 *
 * Agora o esqueleto desenha a forma do que vem: barras para comparação, uma
 * linha para série, um anel para composição, faixas para tabela. O ganho não é
 * estético — é que a tela fica LEGÍVEL antes do dado: dá para saber onde está o
 * gráfico que se veio ver enquanto ele ainda carrega. É o mesmo motivo pelo
 * qual o esqueleto de um feed tem cara de feed.
 *
 * O `isCircular` original vira um caso particular de `shape` e continua
 * funcionando: um retângulo cinza no lugar de um anel é a diferença entre
 * "carregando" e "quebrou".
 *
 * Não usa o `Skeleton` do Astryx porque a referência especifica a cor
 * (`grey.400` a 12%), a duração (1,6s) e a forma; o do DS entrega uma animação
 * e um raio próprios. A cor continua saindo de token — o desenho é que é da
 * referência (`chart-theme.css` §4).
 */
import type { CSSProperties } from 'react';

/** Famílias de silhueta. Uma por FORMA de leitura, não uma por tipo de bloco. */
export type ChartSkeletonShape = 'plain' | 'bars' | 'line' | 'circular' | 'rows';

export interface ChartSkeletonProps {
  /** Altura da área reservada, em px. */
  height: number;
  /** Silhueta desenhada. Default `plain` (retângulo). */
  shape?: ChartSkeletonShape;
  /** Atalho histórico de `shape="circular"`. */
  isCircular?: boolean;
  /** Rótulo acessível ("Carregando <gráfico>"). */
  label?: string;
}

/**
 * Alturas relativas das barras (em % da área). Irregulares de propósito: uma
 * sequência uniforme lê como uma tabela, não como um gráfico de comparação.
 */
const BAR_HEIGHTS = [52, 78, 40, 92, 64, 84, 48];

/** Área do gráfico enquanto os dados não chegaram. */
export function ChartSkeleton({
  height,
  shape,
  isCircular = false,
  label = 'Carregando gráfico',
}: ChartSkeletonProps) {
  const resolved: ChartSkeletonShape = shape ?? (isCircular ? 'circular' : 'plain');

  // `role="status"` + `aria-busy` num só nó: quem usa leitor de tela ouve
  // "carregando <gráfico>" uma vez, seja qual for a silhueta desenhada dentro.
  const common = {
    role: 'status' as const,
    'aria-label': label,
    'aria-busy': true,
    'data-slot': 'chart-loading',
    'data-skeleton-shape': resolved,
  };

  if (resolved === 'circular') {
    return (
      <div
        {...common}
        className="chart-skeleton chart-skeleton--circular"
        // runtime: a altura é a geometria reservada pelo gráfico, não espaçamento
        style={{ height, width: height, margin: '0 auto' }}
      />
    );
  }

  if (resolved === 'plain') {
    return <div {...common} className="chart-skeleton" style={{ height }} />;
  }

  // As silhuetas compostas: um contêiner que só posiciona (sem fundo próprio,
  // para a onda não aparecer duas vezes) e as peças com a textura do esqueleto.
  return (
    <div {...common} style={{ height }} className="w-full">
      {resolved === 'bars' ? <BarsShape /> : null}
      {resolved === 'line' ? <LineShape /> : null}
      {resolved === 'rows' ? <RowsShape /> : null}
    </div>
  );
}

/** Barras de alturas irregulares, apoiadas na base — comparação/categoria. */
function BarsShape() {
  return (
    <div className="flex h-full w-full items-end gap-2">
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="chart-skeleton"
          // runtime: a proporção da barra é a silhueta, não um degrau de espaço
          style={{ height: `${h}%`, flex: 1 }}
        />
      ))}
    </div>
  );
}

/**
 * Uma faixa em diagonal ascendente — série temporal.
 *
 * `clip-path` em vez de SVG: a peça herda exatamente a mesma textura e a mesma
 * onda das outras silhuetas (é a mesma classe), e não há um segundo jeito de
 * pintar esqueleto no app para manter em sincronia.
 */
const LINE_CLIP: CSSProperties = {
  clipPath:
    'polygon(0% 82%, 14% 60%, 28% 70%, 43% 38%, 57% 50%, 71% 22%, 85% 34%, 100% 8%, 100% 22%, 85% 48%, 71% 36%, 57% 64%, 43% 52%, 28% 84%, 14% 74%, 0% 96%)',
};

function LineShape() {
  return <div className="chart-skeleton h-full w-full" style={LINE_CLIP} />;
}

/** Faixas horizontais — tabelas e rankings. */
function RowsShape() {
  return (
    <div className="flex h-full w-full flex-col justify-between gap-2">
      {[100, 88, 94, 76, 90].map((w, i) => (
        <div
          key={i}
          className="chart-skeleton"
          // runtime: larguras irregulares imitam colunas de tamanhos diferentes
          style={{ width: `${w}%`, flex: 1 }}
        />
      ))}
    </div>
  );
}

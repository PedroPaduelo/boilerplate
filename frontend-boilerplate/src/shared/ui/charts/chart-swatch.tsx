/**
 * COMPONENTE PRÓPRIO — marca de dados. O `StatusDot` do Astryx só aceita
 * variantes semânticas (success/warning/error/accent/neutral) e uma legenda
 * de gráfico precisa da cor DA SÉRIE. Este é o único ponto do app em que uma
 * cor de série vira um elemento pintado no DOM (o resto pinta SVG), por isso
 * a cor entra por `style` — sempre um token vindo do `useChartPalette`.
 *
 * ESTILO (regra 2.3): forma e tamanho são utilities com token; o `style` que
 * sobra é runtime — a cor da série só existe com o dado do gráfico na mão.
 */
export interface ChartSwatchProps {
  /** Cor da série vinda do `useChartPalette` (`var(--token)` ou valor do tema). */
  color: string;
  /** `dot` para linha/área/dispersão, `bar` para barras/ranking. */
  shape?: 'dot' | 'bar';
}

/** Forma da marca: bolinha para série contínua, tarja para barra/ranking. */
const SHAPE_CLASS = {
  dot: 'w-[var(--spacing-2)] rounded-[var(--radius-full)]',
  bar: 'w-[var(--spacing-3)] rounded-[var(--radius-inner)]',
} as const;

/** Quadradinho/bolinha de cor que identifica uma série na legenda e no tooltip. */
export function ChartSwatch({ color, shape = 'dot' }: ChartSwatchProps) {
  return (
    <span
      aria-hidden="true"
      data-slot="chart-swatch"
      className={`inline-block shrink-0 h-[var(--spacing-2)] ${SHAPE_CLASS[shape]}`}
      // runtime: a cor identifica a série e vem do `useChartPalette`
      style={{ backgroundColor: color }}
    />
  );
}

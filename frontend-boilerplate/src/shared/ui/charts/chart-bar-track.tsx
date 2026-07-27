/**
 * COMPONENTE PRÓPRIO — marca de dados: trilho + preenchimento proporcional.
 * O `ProgressBar` do Astryx só aceita variantes semânticas (accent/success/…)
 * e desenha rótulo e valor próprios; num ranking a cor é da CATEGORIA e o
 * rótulo já fica acima da barra. Este é o único lugar do app em que uma barra
 * de dados é desenhada no DOM — e cada dimensão sai de um token do DS.
 *
 * É decorativo (`aria-hidden`): o valor já está escrito ao lado, em `Text`.
 *
 * ESTILO (regra 2.3): a forma do trilho é utility com token; o `style` que
 * sobra no preenchimento é runtime — largura = fração do dado, cor = série
 * escolhida pelo `useChartPalette` (é o mesmo padrão do `ProgressBar` do DS,
 * que também escreve `width: 40%` inline).
 */
export interface ChartBarTrackProps {
  /** Fração preenchida, de 0 a 1. Valores fora da faixa são grampeados. */
  ratio: number;
  /** Cor do preenchimento, vinda do `useChartPalette`. */
  color: string;
  /** `sm` em listas densas, `md` quando a barra é o elemento principal. */
  size?: 'sm' | 'md';
}

/** Altura do trilho por tamanho, na escala de espaçamento do DS. */
const TRACK_HEIGHT_CLASS = {
  sm: 'h-[var(--spacing-1-5)]',
  md: 'h-[var(--spacing-2)]',
} as const;

/** Trilho: largura cheia, cantos redondos e a superfície de fundo do DS. */
const TRACK_CLASS =
  'block w-full overflow-hidden rounded-[var(--radius-full)] bg-[color:var(--color-track)]';

/** Barra proporcional usada nos rankings (`BarList`). */
export function ChartBarTrack({ ratio, color, size = 'sm' }: ChartBarTrackProps) {
  const percent = Math.min(Math.max(ratio, 0), 1) * 100;

  return (
    <span
      aria-hidden="true"
      data-slot="chart-bar-track"
      className={`${TRACK_CLASS} ${TRACK_HEIGHT_CLASS[size]}`}
    >
      <span
        className="block h-full rounded-[var(--radius-full)]"
        // runtime: largura é a fração do dado; cor é a série do `useChartPalette`
        style={{ inlineSize: `${percent}%`, backgroundColor: color }}
      />
    </span>
  );
}

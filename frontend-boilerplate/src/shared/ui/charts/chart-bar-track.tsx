/**
 * COMPONENTE PRÓPRIO — marca de dados: trilho + preenchimento proporcional.
 * O `ProgressBar` do Astryx só aceita variantes semânticas (accent/success/…)
 * e desenha rótulo e valor próprios; num ranking a cor é da CATEGORIA e o
 * rótulo já fica acima da barra. Este é o único lugar do app em que uma barra
 * de dados é desenhada no DOM — e cada dimensão sai de um token do DS.
 *
 * É decorativo (`aria-hidden`): o valor já está escrito ao lado, em `Text`.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT — §8 da referência (barra horizontal), versão DOM
 * ---------------------------------------------------------------------------
 * A barra horizontal da referência sobrepõe três coisas à base: **raio 2 px**,
 * **traço 0** e altura de barra menor que a da coluna. É isso que se vê aqui:
 *
 *  - TRILHA: `chrome('track')` — o `rgba(145,158,171,0.16)` da trilha dos
 *    medidores (`02-configuracao-base.md` §10). Era `--color-track` do Astryx,
 *    um cinza SÓLIDO (#CCD3DB): pesado demais atrás de uma barra de dado;
 *  - RAIO: `geometry.barRadiusFlat` (2 px). Era `--radius-full`, cápsula — a
 *    referência arredonda POUCO em barra, cápsula nenhuma;
 *  - MOVIMENTO: a largura anima com `motion.duration` (360 ms), a mesma
 *    duração da entrada dos gráficos (`02-configuracao-base.md` §3). Quem pede
 *    menos movimento recebe a barra já na posição final.
 *
 * ESTILO (regra 2.3): a forma do trilho é utility com token; o `style` que
 * sobra é runtime — largura = fração do dado, cor = série escolhida pelo
 * `useChartPalette` (é o mesmo padrão do `ProgressBar` do DS, que também
 * escreve `width: 40%` inline).
 */
import { useReducedMotion } from 'motion/react';
import { useChartPalette } from './use-chart-palette';

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

/** Trilho: largura cheia e recorte do preenchimento. Cor e raio vêm do tema. */
const TRACK_CLASS = 'block w-full overflow-hidden';

/** Barra proporcional usada nos rankings (`BarList`) e no progresso escalar. */
export function ChartBarTrack({ ratio, color, size = 'sm' }: ChartBarTrackProps) {
  const palette = useChartPalette();
  const prefersReducedMotion = useReducedMotion();
  const percent = Math.min(Math.max(ratio, 0), 1) * 100;
  // §8: raio 2px na barra horizontal — o mesmo no trilho, que a recorta.
  const radius = palette.geometry.barRadiusFlat;

  return (
    <span
      aria-hidden="true"
      data-slot="chart-bar-track"
      className={`${TRACK_CLASS} ${TRACK_HEIGHT_CLASS[size]}`}
      style={{ borderRadius: radius, backgroundColor: palette.chromeVar('track') }}
    >
      <span
        className="block h-full"
        // runtime: largura é a fração do dado; cor é a série do `useChartPalette`
        style={{
          inlineSize: `${percent}%`,
          backgroundColor: color,
          borderRadius: radius,
          transition: prefersReducedMotion
            ? undefined
            : `inline-size ${palette.motion.duration}ms`,
        }}
      />
    </span>
  );
}

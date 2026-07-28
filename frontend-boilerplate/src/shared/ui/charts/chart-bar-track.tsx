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
 *  - ESPESSURA: `geometry.trackThickness` (12 px) — o degrau das barras de
 *    LISTA da escala do tema, o mesmo do ranking e da etapa de funil. Era
 *    `--spacing-1-5` / `--spacing-2` (6 px e 8 px, escolhidos pela prop
 *    `size`): duas das cinco espessuras que o `/catalog` mostrava lado a lado
 *    para a mesma ideia de barra. A regra do sistema é uma só — **sem eixo e ao
 *    lado de texto ⇒ `trackThickness`**;
 *  - TRILHA: `chrome('track')` — o `rgba(145,158,171,0.16)` da trilha dos
 *    medidores (`02-configuracao-base.md` §10). Era `--color-track` do Astryx,
 *    um cinza SÓLIDO (#CCD3DB): pesado demais atrás de uma barra de dado. Tem a
 *    MESMA espessura do preenchimento (que é `h-full`): entre os dois muda só a
 *    cor, nunca a medida;
 *  - RAIO: `geometry.barRadiusFlat` (2 px). Era `--radius-full`, cápsula — a
 *    referência arredonda POUCO em barra, cápsula nenhuma; e numa barra de
 *    12 px a cápsula (6 px) arredondaria a ponta que carrega o dado, encurtando
 *    a leitura do valor. Mesmo raio nas quatro barras de lista do catálogo;
 *  - MOVIMENTO: a largura anima com `motion.duration` (360 ms), a mesma
 *    duração da entrada dos gráficos (`02-configuracao-base.md` §3). Quem pede
 *    menos movimento recebe a barra já na posição final.
 *
 * ESTILO (regra 2.3): a forma do trilho é utility com token; o `style` que
 * sobra é runtime — largura = fração do dado, cor = série escolhida pelo
 * `useChartPalette` (é o mesmo padrão do `ProgressBar` do DS, que também
 * escreve `width: 40%` inline). A espessura desceu para o `style` junto com o
 * raio pelo mesmo motivo que o raio já estava lá: a escala mora no
 * `chart-theme` (TS), não como custom property CSS — se ela virasse utility, o
 * número existiria em dois lugares, que é exatamente o defeito que a escala veio
 * consertar. É o que a `RankingBar` do `bar-list` já fazia.
 */
import { useReducedMotion } from 'motion/react';
import { useChartPalette } from './use-chart-palette';

export interface ChartBarTrackProps {
  /** Fração preenchida, de 0 a 1. Valores fora da faixa são grampeados. */
  ratio: number;
  /** Cor do preenchimento, vinda do `useChartPalette`. */
  color: string;
  /**
   * Densidade PRETENDIDA da barra: `sm` em listas densas, `md` quando a barra é
   * o elemento principal do bloco.
   *
   * NÃO escolhe mais a espessura. Escolhia — 6 px em `sm`, 8 px em `md` —, e
   * eram duas das cinco espessuras que o catálogo exibia lado a lado para a
   * mesma marca de dado. A escala do tema tem UM degrau para barra de lista
   * (`geometry.trackThickness`), e é ele que vale nos dois valores.
   *
   * A prop continua no contrato porque é pública (barril `@/shared/ui`) —
   * removê-la quebraria quem já a passa — e porque continua declarando, para
   * quem lê o bloco, qual é o papel daquela barra ali.
   */
  size?: 'sm' | 'md';
}

/**
 * Trilho: largura cheia e recorte do preenchimento. Espessura, cor e raio vêm
 * do tema (`style`), porque é lá que a escala mora.
 */
const TRACK_CLASS = 'block w-full overflow-hidden';

/** Barra proporcional usada nos rankings (`BarList`) e no progresso escalar. */
export function ChartBarTrack({ ratio, color }: ChartBarTrackProps) {
  const palette = useChartPalette();
  const prefersReducedMotion = useReducedMotion();
  const percent = Math.min(Math.max(ratio, 0), 1) * 100;
  // §8: raio 2px na barra horizontal — o mesmo no trilho, que a recorta.
  const radius = palette.geometry.barRadiusFlat;

  return (
    <span
      aria-hidden="true"
      data-slot="chart-bar-track"
      className={TRACK_CLASS}
      style={{
        // runtime: o degrau de LISTA da escala (12px) — barra sem eixo, ao lado
        // de uma linha de texto, tem esta espessura no catálogo inteiro.
        blockSize: palette.geometry.trackThickness,
        borderRadius: radius,
        backgroundColor: palette.chromeVar('track'),
      }}
    >
      <span
        // TRILHA = BARRA: `h-full` faz o preenchimento herdar a espessura do
        // trilho, então entre os dois muda só a cor.
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

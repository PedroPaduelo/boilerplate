/**
 * COMPONENTE PRÓPRIO DO BLOCO — a barra de participação da etapa de funil.
 *
 * Por que não sai da base: `ChartBarTrack` desenha UMA barra de uma cor; aqui a
 * barra ocupa a fração do universo que a etapa representa e, dentro dela, se
 * divide nos desfechos — é uma barra empilhada de uma linha só. Nenhum gráfico
 * do app precisa disso além do funil, então mora aqui; se um segundo bloco
 * precisar, a regra da trilha manda promovê-la para `@/shared/ui`.
 *
 * ---------------------------------------------------------------------------
 * REPAGINAÇÃO POR ANALOGIA — funil NÃO existe na referência
 * ---------------------------------------------------------------------------
 * A etapa é desenhada como a BARRA HORIZONTAL de `03-tipos-de-grafico.md` §8
 * (raio 2px, traço 0, barra fina); a divisão em desfechos segue a COLUNA
 * EMPILHADA da §6, que é onde um mesmo total se reparte em partes ordenadas —
 * e partes ordenadas pedem RAMPA sequencial, não paleta categórica.
 *
 *   trilha ....... `chrome('trackLight')` — a "trilha alternativa, mais clara"
 *                  de `01-fundamentos.md` §3 (rgba(145,158,171,.08))
 *   raio ......... `geometry.barRadiusFlat` — 2px (§8)
 *   traço ........ nenhum (§8)
 *   altura ....... `geometry.trackThickness` — 12px, o degrau da BARRA DE
 *                  LISTA (a que acompanha uma linha de texto, sem eixo), o
 *                  mesmo do ranking e da barra de progresso. Era `--spacing-4`
 *                  (16px), derivado de "30% de uma faixa típica": uma conta
 *                  feita sobre um gráfico COM eixo, aplicada a uma barra que
 *                  não tem eixo nenhum — e que por isso saía mais gorda que as
 *                  irmãs, na mesma tela.
 *   cor .......... `chartRampToken(cor, passo)`, CLARO → ESCURO (§6)
 *   hover ........ ESCURECE: o segmento avança UM passo na rampa
 *                  (`01-fundamentos.md` §9 — "hover escurece, não clareia")
 *   transição .... `motion.duration` (360ms), a mesma da entrada dos gráficos
 *
 * Como isto é DOM (e não SVG), a cor entra como `var(--token)`: trocar o tema
 * repinta a barra sem re-render. Zero hex, zero rgba — era exatamente isso que
 * o bloco tinha antes da migração.
 *
 * ESTILO (regra 2.3): a forma da barra (trilho, altura, recorte) é utility
 * ancorada em token. No `style` fica só o que depende DO DADO — a largura da
 * barra (fração do universo) e a de cada segmento (peso do desfecho) — mais as
 * variáveis de cor/duração que o hover consome, que saem do tema. É o mesmo
 * padrão do `ProgressBar` do DS, que também escreve `width: 40%` inline.
 */
import type { CSSProperties } from 'react';
import { chartRampToken, chartTokenVar, useChartPalette } from '@/shared/ui';
import type { ChartRampColor } from '@/shared/ui';

export interface FunnelBarProps {
  /** Participação da etapa no universo, de 0 a 1. */
  fraction: number;
  /** Peso de cada desfecho dentro da etapa (mesma ordem da tabela). */
  weights: number[];
  /** Rampa do design system usada nos segmentos. */
  color: ChartRampColor;
  /** Leitura acessível da barra (a etapa e o que ela representa). */
  label: string;
}

/**
 * `style` com as variáveis locais da barra. O React escreve custom properties
 * sem reclamar; o TIPO `CSSProperties` é que não as conhece.
 */
type FunnelStyle = CSSProperties & Record<`--funnel-${string}`, string>;

/**
 * O trilho: largura cheia e recorte — sem `overflow-hidden` o raio de 2px não
 * valeria para os segmentos que encostam nas pontas.
 *
 * A ALTURA saiu daqui de propósito: espessura de marca é decisão do tema
 * (`geometry.trackThickness`), não de uma classe utilitária deste arquivo. Foi
 * exatamente assim — cada barra declarando a sua altura no seu próprio CSS —
 * que o catálogo terminou com cinco espessuras diferentes para a mesma ideia.
 */
const TRACK_CLASS = 'block w-full overflow-hidden';

/** O preenchimento: a fatia do universo que a etapa ocupa. */
const FILL_CLASS = 'flex h-full overflow-hidden';

/**
 * Segmento: cor da rampa em repouso e UM PASSO MAIS ESCURO no hover, na
 * duração de entrada dos gráficos. As duas cores e a duração descem por
 * variável — assim o hover é CSS puro, sem estado e sem re-render.
 */
const SEGMENT_CLASS = [
  'h-full',
  'bg-[color:var(--funnel-segment)]',
  'hover:bg-[color:var(--funnel-segment-hover)]',
  'transition-colors ease-out duration-[var(--funnel-duration)]',
].join(' ');

/**
 * Passos da rampa nos segmentos, CLARO → ESCURO (§6). Param no 4 de propósito:
 * o hover soma 1, e o 5 (o tom mais escuro) fica reservado para ele — é o que
 * garante que passar o mouse SEMPRE escureça, inclusive no último segmento.
 */
const SEGMENT_STEPS = [1, 2, 3, 4];

/** Passo médio — usado quando a etapa não detalha desfechos. */
const FALLBACK_STEP = 3;

/** Fração válida da barra: fora de 0..1 vira um bug visível, não um dado. */
function clampFraction(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Barra de participação da etapa, segmentada pelos desfechos. */
export function FunnelBar({ fraction, weights, color, label }: FunnelBarProps) {
  const palette = useChartPalette();
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  /** Cor de um passo da rampa, como token (DOM). */
  const ramp = (step: number) => chartTokenVar(chartRampToken(color, step));

  /** Um segmento: cor de repouso, cor de hover (mais escura) e largura. */
  const segment = (step: number, width: string): FunnelStyle => ({
    '--funnel-segment': ramp(step),
    '--funnel-segment-hover': ramp(step + 1),
    inlineSize: width,
  });

  const trackStyle: FunnelStyle = {
    // tema: espessura do degrau de barra de lista, trilha da §3, raio da barra
    // horizontal da §8 e a duração do hover, que desce por variável para todos
    // os segmentos
    blockSize: palette.geometry.trackThickness,
    backgroundColor: palette.chromeVar('trackLight'),
    borderRadius: palette.geometry.barRadiusFlat,
    '--funnel-duration': `${palette.motion.duration}ms`,
  };

  return (
    <span
      role="img"
      aria-label={label}
      data-slot="funnel-bar"
      className={TRACK_CLASS}
      style={trackStyle}
    >
      <span
        className={FILL_CLASS}
        // runtime: a barra ocupa a fração do universo que a etapa representa
        style={{
          inlineSize: `${clampFraction(fraction) * 100}%`,
          borderRadius: palette.geometry.barRadiusFlat,
        }}
      >
        {total > 0 ? (
          weights.map((weight, index) => (
            <span
              key={index}
              data-slot="funnel-segment"
              className={SEGMENT_CLASS}
              // runtime: largura = peso do desfecho; cor = passo da rampa do bloco
              style={segment(
                SEGMENT_STEPS[index % SEGMENT_STEPS.length],
                `${(weight / total) * 100}%`,
              )}
            />
          ))
        ) : (
          // Sem desfechos (ou todos zerados) a barra continua legível: um
          // bloco só, no tom médio da rampa.
          <span
            data-slot="funnel-segment"
            className={SEGMENT_CLASS}
            // runtime: cor = passo médio da rampa escolhida pelo bloco
            style={segment(FALLBACK_STEP, '100%')}
          />
        )}
      </span>
    </span>
  );
}

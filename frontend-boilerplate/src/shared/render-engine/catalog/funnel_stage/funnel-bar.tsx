/**
 * COMPONENTE PRÓPRIO DO BLOCO — barra de participação da etapa de funil.
 *
 * Por que não sai da base: `ChartBarTrack` desenha UMA barra de uma cor; aqui a
 * barra ocupa a fração do universo que a etapa representa e, dentro dela, se
 * divide nos desfechos — é uma barra empilhada de uma linha só. Nenhum gráfico
 * do app precisa disso além do funil, então mora aqui; se um segundo bloco
 * precisar, a regra da trilha manda promovê-la para `@/shared/ui`.
 *
 * Cor: rampa sequencial do design system (`--color-data-<cor>-1..5`), do passo
 * mais escuro para o mais claro. Rampa (e não paleta categórica) porque os
 * segmentos são partes ORDENADAS de um mesmo todo. Como isto é DOM (e não SVG),
 * a cor entra como `var(--token)`: trocar o tema repinta a barra sem re-render.
 * Zero hex, zero rgba — era exatamente isso que o bloco tinha.
 *
 * ESTILO (regra 2.3): a forma da barra (trilho, altura, raio, recorte) é
 * utility ancorada em token. No `style` fica só o que depende DO DADO: a
 * largura da barra (fração do universo), a largura de cada segmento (peso do
 * desfecho) e a cor do passo da rampa escolhido pelo bloco — é o mesmo padrão
 * do `ProgressBar` do DS, que também escreve `width: 40%` inline.
 */
import { chartRampToken, chartTokenVar } from '@/shared/ui';
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
 * O trilho: largura cheia, altura de 1 passo de `--spacing-8` (geometria do
 * desenho, na escala do DS), raio interno e a superfície de fundo do tema.
 */
const TRACK_CLASS = [
  'block w-full h-[var(--spacing-8)] overflow-hidden',
  'rounded-[var(--radius-inner)]',
  'bg-[color:var(--color-track)]',
].join(' ');

/** Passos da rampa usados nos segmentos: do mais escuro ao mais claro. */
const SEGMENT_STEPS = [5, 4, 3, 2];

/** Passo médio — usado quando a etapa não detalha desfechos. */
const FALLBACK_STEP = 3;

/** Barra de participação da etapa, segmentada pelos desfechos. */
export function FunnelBar({ fraction, weights, color, label }: FunnelBarProps) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const rampVar = (step: number) => chartTokenVar(chartRampToken(color, step));

  return (
    <span role="img" aria-label={label} data-slot="funnel-bar" className={TRACK_CLASS}>
      <span
        className="flex h-full"
        // runtime: a barra ocupa a fração do universo que a etapa representa
        style={{ inlineSize: `${Math.min(1, Math.max(0, fraction)) * 100}%` }}
      >
        {total > 0 ? (
          weights.map((weight, index) => (
            <span
              key={index}
              // runtime: largura = peso do desfecho; cor = passo da rampa do bloco
              style={{
                inlineSize: `${(weight / total) * 100}%`,
                backgroundColor: rampVar(SEGMENT_STEPS[index % SEGMENT_STEPS.length]),
              }}
            />
          ))
        ) : (
          // Sem desfechos (ou todos zerados) a barra continua legível: um
          // bloco só, no tom médio da rampa.
          <span
            className="w-full"
            // runtime: cor = passo médio da rampa escolhida pelo bloco
            style={{ backgroundColor: rampVar(FALLBACK_STEP) }}
          />
        )}
      </span>
    </span>
  );
}

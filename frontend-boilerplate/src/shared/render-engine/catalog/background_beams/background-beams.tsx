/**
 * COMPONENTE PRÓPRIO — o Astryx não cobre "fundo animado com feixes" porque o
 * DS só publica superfícies estáticas (Card/Section) e movimento de INTERAÇÃO
 * (transição de estado de um controle). Efeito AMBIENTE — que anima sozinho,
 * para sempre, atrás do conteúdo — não existe no catálogo nem é componível a
 * partir dos primitivos publicados. Por isso vive aqui, dentro do bloco.
 *
 * Reescrito sobre tokens: a cor dos feixes sai da rampa de data-viz
 * (`--color-data-categorical-*`), a linha de base sai de `--color-border`, o
 * raio acompanha o Card (`border-radius: inherit`) e a duração do ciclo é um
 * MÚLTIPLO do passo de movimento do DS (`--duration-slow`). Zero hex, zero px.
 *
 * A11Y: a camada de feixes é 100% decorativa (`aria-hidden`) e não guarda
 * conteúdo — o texto do bloco é irmão dela, não filho. Com
 * `prefers-reduced-motion` a varredura contínua desliga: os feixes continuam
 * desenhados, apenas parados.
 *
 * ESTILO (regra 2.3): a moldura e o empilhamento saem de componentes do DS
 * (`VStack` com `height`/`width`) e de utilities com token; `style` sobra
 * apenas na PINTURA do SVG (`stroke`/`stopColor`), onde atributo de
 * apresentação não resolve `var()`.
 */
import { memo, useId, type ReactNode } from 'react';
import {
  motion,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from 'motion/react';
import { useTheme } from '@astryxdesign/core/theme';
import { VStack } from '@astryxdesign/core/VStack';
import { BEAM_PATHS, BEAM_STOPS, BEAM_VIEW_BOX } from './beams-geometry';

/** Altura da tela decorativa — 7 passos de `--spacing-8` na escala do DS. */
const CANVAS_BLOCK_SIZE = 'calc(var(--spacing-8) * 7)';

/**
 * Passo lento de movimento do DS (`--duration-slow`) em SEGUNDOS. O motion
 * pede número; ler o token evita cravar milissegundos no componente.
 */
function useSlowStepSeconds(): number {
  const { token } = useTheme();
  const raw = token('--duration-slow').trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return 1;
  return raw.endsWith('ms') ? value / 1000 : value;
}

/**
 * GOTCHA motion v12: `x1/y1/x2/y2` são atributos de SVG, fora do `MotionStyle`
 * padrão — daí o cast intermediário (nunca `as any`).
 */
function sweepStart(): TargetAndTransition {
  return { x1: '0%', x2: '0%', y1: '0%', y2: '0%' } as unknown as TargetAndTransition;
}

function sweepEnd(index: number): TargetAndTransition {
  return {
    x1: ['0%', '100%'],
    x2: ['0%', '95%'],
    y1: ['0%', '100%'],
    y2: ['0%', `${93 + (index % 8)}%`],
  } as unknown as TargetAndTransition;
}

/** Ciclo determinístico por índice — sem `Math.random` no render (SSR/HMR). */
function sweepTransition(index: number, step: number): Transition {
  return {
    duration: step * (10 + (index % 11)),
    ease: 'easeInOut',
    repeat: Infinity,
    delay: step * (index % 10),
  };
}

function BeamsLayer({ isFrozen, step }: { isFrozen: boolean; step: number }) {
  // `useId` pode trazer caracteres inválidos numa referência `url(#…)`.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <svg
      aria-hidden="true"
      data-slot="background-beams"
      viewBox={BEAM_VIEW_BOX}
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {BEAM_PATHS.map((d, index) => (
        <path
          key={`trail-${index}`}
          d={d}
          strokeWidth={0.5}
          strokeOpacity={0.12}
          // SVG: var() não resolve em atributo de apresentação
          style={{ stroke: 'var(--color-border)' }}
        />
      ))}
      {BEAM_PATHS.map((d, index) => (
        <path
          key={`beam-${index}`}
          d={d}
          strokeWidth={0.5}
          strokeOpacity={0.5}
          stroke={`url(#beam-${uid}-${index})`}
        />
      ))}
      <defs>
        {BEAM_PATHS.map((_, index) => (
          <motion.linearGradient
            key={`gradient-${index}`}
            id={`beam-${uid}-${index}`}
            initial={sweepStart()}
            animate={isFrozen ? sweepStart() : sweepEnd(index)}
            transition={isFrozen ? { duration: 0 } : sweepTransition(index, step)}
          >
            {BEAM_STOPS.map((stop, i) => (
              <stop
                key={i}
                offset={stop.offset}
                stopOpacity={stop.opacity}
                // SVG: var() não resolve em atributo de apresentação
                style={{ stopColor: `var(${stop.token})` }}
              />
            ))}
          </motion.linearGradient>
        ))}
      </defs>
    </svg>
  );
}

export interface BackgroundBeamsProps {
  /** Conteúdo exibido por cima dos feixes (componentes do DS). */
  children: ReactNode;
}

/** Tela decorativa: feixes animados atrás, conteúdo do DS na frente. */
function BackgroundBeamsImpl({ children }: BackgroundBeamsProps) {
  const prefersReducedMotion = useReducedMotion();
  const step = useSlowStepSeconds();

  return (
    <VStack
      data-slot="background-beams-canvas"
      width="100%"
      height={CANVAS_BLOCK_SIZE}
      className="relative overflow-hidden rounded-[inherit]"
    >
      <BeamsLayer isFrozen={Boolean(prefersReducedMotion)} step={step} />
      <VStack height="100%" className="relative">
        {children}
      </VStack>
    </VStack>
  );
}

export const BackgroundBeams = memo(BackgroundBeamsImpl);
BackgroundBeams.displayName = 'BackgroundBeams';

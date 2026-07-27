/**
 * COMPONENTE PRÓPRIO — o Astryx não cobre este ícone. O DS tem `Spinner`
 * (progresso indeterminado) e `Icon` (glifo estático), mas nada que faça
 * MORFOSE de traçado: a fita de Möbius é uma única linha que se deforma de
 * círculo a infinito e volta, e isso é animação de path (`d`), fora do
 * vocabulário do design system.
 *
 * Reescrito sobre tokens: o traço usa `--color-accent` e a duração do ciclo é
 * múltiplo do passo de movimento do DS (`--duration-slow`) — antes eram
 * segundos cravados no código. O `size` continua vindo das props do bloco
 * (contrato do manifesto), não de um número mágico interno.
 *
 * ESTILO (regra 2.3): o único `style` é a PINTURA do traço — `stroke` é
 * atributo de apresentação do SVG e não resolve `var()`, então a cor de token
 * precisa entrar por CSS.
 *
 * A11Y: puramente decorativo (`aria-hidden`) — o bloco é ilustrativo, não um
 * anúncio de carregamento, então nada é prometido a leitores de tela. Com
 * `prefers-reduced-motion` a morfose contínua desliga e fica a forma de
 * infinito, parada.
 */
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from '@astryxdesign/core/theme';

export type MobiusLoopSpeed = 'slow' | 'normal' | 'fast';

/** Quantos passos lentos do DS dura um ciclo completo, por velocidade. */
const CYCLE_STEPS: Record<MobiusLoopSpeed, number> = {
  slow: 5,
  normal: 3,
  fast: 1.5,
};

/** Traçados do ciclo, em coordenadas do `viewBox` (geometria, não medida). */
const CIRCLE_CW =
  'M12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4Z';
const INFINITY =
  'M 6 16 C 11 16 13 8 18 8 C 23.333 8 23.333 16 18 16 C 13 16 11 8 6 8 C 0.667 8 0.667 16 6 16 Z';
const CIRCLE_CCW =
  'M12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20Z';

/**
 * Passo lento de movimento do DS (`--duration-slow`) em SEGUNDOS. O motion pede
 * número; ler o token evita cravar milissegundos no componente.
 */
function useSlowStepSeconds(): number {
  const { token } = useTheme();
  const raw = token('--duration-slow').trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return 1;
  return raw.endsWith('ms') ? value / 1000 : value;
}

export interface MobiusLoopIconProps {
  /** Lado do ícone em px — valor declarado pelo bloco (`propsSchema.size`). */
  size: number;
  /** Velocidade do ciclo. */
  speed: MobiusLoopSpeed;
}

/** Fita de Möbius: um traço que alterna entre círculo e infinito. */
export function MobiusLoopIcon({ size, speed }: MobiusLoopIconProps) {
  const prefersReducedMotion = useReducedMotion();
  const step = useSlowStepSeconds();
  const duration = step * (CYCLE_STEPS[speed] ?? CYCLE_STEPS.normal);

  return (
    <motion.svg
      aria-hidden="true"
      data-slot="mobius-loop-icon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      // SVG: var() não resolve em atributo de apresentação
      style={{ stroke: 'var(--color-accent)' }}
    >
      <motion.path
        d={INFINITY}
        animate={
          prefersReducedMotion
            ? { d: INFINITY }
            : { d: [CIRCLE_CW, INFINITY, CIRCLE_CCW] }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { d: { duration, ease: 'easeInOut', repeat: Infinity } }
        }
      />
    </motion.svg>
  );
}

/**
 * COMPONENTE PRÓPRIO — o Astryx não cobre "halo que desliza entre os cards".
 * O DS já dá realce de hover POR card (`ClickableCard` acende sozinho), mas não
 * existe primitivo de elemento COMPARTILHADO — uma única mancha que viaja de um
 * card para o outro. É esse deslize que define o efeito, e ele exige
 * `layoutId` (motion), fora do vocabulário do DS.
 *
 * Reescrito sobre tokens: a mancha usa `--color-overlay-hover` (a mesma
 * superfície de hover do DS), o respiro vem do passo 2 da escala de
 * espaçamento (`padding={2}` do `VStack`) e o raio usa `--radius-container`.
 * Zero hex, zero px.
 *
 * ESTILO (regra 2.3): o enquadramento sai de props do DS (`VStack` com
 * `height`/`padding`) e o resto de utilities com token — nenhum `style` inline
 * neste arquivo. As transformações do deslize são escritas pelo motion.
 *
 * A11Y: a mancha é decorativa (`aria-hidden`) e não recebe foco; o card por
 * cima continua sendo o único alvo interativo. O halo também acende no FOCO
 * do teclado, não só no ponteiro — quem navega por Tab enxerga o mesmo realce.
 * Com `prefers-reduced-motion` o deslize desliga: a mancha apenas aparece no
 * card ativo, sem viajar.
 */
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { VStack } from '@astryxdesign/core/VStack';

/** A mancha: cobre a célula inteira com a superfície de hover do DS. */
const HALO_CLASS =
  'absolute inset-0 block rounded-[var(--radius-container)] bg-[color:var(--color-overlay-hover)]';

function CardHoverHalo({ haloId, isStatic }: { haloId?: string; isStatic: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      data-slot="card-hover-halo"
      layoutId={isStatic ? undefined : haloId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={HALO_CLASS}
    />
  );
}

export interface CardHoverSlotProps {
  /** Identidade compartilhada da mancha — a mesma para todos os cards da grade. */
  haloId: string;
  /** Este é o card sob o ponteiro (ou com foco de teclado)? */
  isActive: boolean;
  /** Ponteiro entrou ou o card recebeu foco. */
  onActivate: () => void;
  /** Ponteiro saiu ou o card perdeu o foco. */
  onDeactivate: () => void;
  /** O card do DS. */
  children: ReactNode;
}

/**
 * Célula da grade: dá o contexto de posicionamento da mancha e reporta
 * hover/foco. O card em si é filho e vem inteiro do DS.
 */
export function CardHoverSlot({
  haloId,
  isActive,
  onActivate,
  onDeactivate,
  children,
}: CardHoverSlotProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <VStack
      data-slot="card-hover-slot"
      height="100%"
      padding={2}
      className="relative"
      onPointerEnter={onActivate}
      onPointerLeave={onDeactivate}
      onFocusCapture={onActivate}
      onBlurCapture={onDeactivate}
    >
      <AnimatePresence initial={false}>
        {isActive ? (
          <CardHoverHalo haloId={haloId} isStatic={Boolean(prefersReducedMotion)} />
        ) : null}
      </AnimatePresence>
      <VStack height="100%" className="relative">
        {children}
      </VStack>
    </VStack>
  );
}

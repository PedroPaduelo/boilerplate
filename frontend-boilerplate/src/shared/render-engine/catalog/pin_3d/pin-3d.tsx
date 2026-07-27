/**
 * COMPONENTE PRÓPRIO — o Astryx não cobre "card que se inclina em 3D com um
 * pino luminoso". O DS trata profundidade com elevação plana (sombra do
 * `Card`) e não expõe perspectiva, `rotateX` nem halo pulsante: é um efeito de
 * cena, não um estado de componente.
 *
 * Reescrito sobre tokens: o feixe usa `--color-data-categorical-cyan`, os anéis
 * usam `--color-accent`, a espessura vem de `--border-width`, todas as medidas
 * são múltiplos de `--spacing-*` e as durações são múltiplos de
 * `--duration-slow`/`--duration-medium`. Antes: fundo preto cravado, cianos e
 * azuis de paleta utilitária, medidas soltas e o tempo do pulso fixo no código.
 *
 * ESTILO (regra 2.3): o enquadramento é do DS (`VStack` com `height`, `gap` e
 * alinhamento) e o desenho da cena são utilities com token — inclusive os dois
 * estados que o hover/foco alterna (halo aceso/apagado, card inclinado/reto).
 * Nenhum `style` inline: o que muda a cada quadro é escrito pelo motion.
 *
 * A11Y (correções sobre o efeito legado):
 * 1. A etiqueta do pino era filha da camada decorativa e sumia com ela; agora
 *    é `Badge` do DS, sempre visível e fora do `aria-hidden`.
 * 2. O card é `ClickableCard` do DS — tem nome acessível, foco visível e
 *    navegação por teclado; o efeito também acende no foco, não só no hover.
 * 3. Com `prefers-reduced-motion` o pulso contínuo dos anéis desliga e a
 *    inclinação não acontece.
 */
import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Badge } from '@astryxdesign/core/Badge';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { VStack } from '@astryxdesign/core/VStack';
import { useTheme } from '@astryxdesign/core/theme';

/** Profundidade da cena — 20 passos de `--spacing-12`. */
const SCENE_CLASS = 'relative [perspective:calc(var(--spacing-12)_*_20)]';
/** Altura total do palco — 10 passos de `--spacing-8`. */
export const PIN_STAGE_BLOCK_SIZE = 'calc(var(--spacing-8) * 10)';
/** Largura do card — 5 passos de `--spacing-12`. */
const CARD_INLINE_SIZE = 'calc(var(--spacing-12) * 5)';

/**
 * Os anéis do halo: 4 passos de `--spacing-12` de diâmetro, traço do DS na cor
 * de destaque. Ficam deitados no "chão" da cena, no centro do palco.
 */
const RING_PLANE_CLASS =
  'absolute top-1/2 start-1/2 [transform:translate(-50%,-50%)_rotateX(70deg)]';
const RING_CLASS = [
  'absolute top-0 start-0',
  'h-[calc(var(--spacing-12)_*_4)] w-[calc(var(--spacing-12)_*_4)]',
  'rounded-[var(--radius-full)]',
  '[border:var(--border-width)_solid_var(--color-accent)]',
].join(' ');

/** O feixe que liga o card à etiqueta — 2 passos de `--spacing-10`. */
const BEAM_CLASS = [
  'absolute start-1/2 -translate-x-1/2',
  'top-[calc(50%_-_var(--spacing-10)_*_2)]',
  'h-[calc(var(--spacing-10)_*_2)] w-[var(--border-width)]',
  'bg-[image:linear-gradient(to_bottom,transparent,var(--color-data-categorical-cyan))]',
].join(' ');

/** Inclinação do card (geometria da cena, não medida de layout). */
const TILT_CLASS = '[transform:rotateX(40deg)_scale(0.9)]';
const FLAT_CLASS = '[transform:rotateX(0deg)_scale(1)]';
const TILT_TRANSITION_CLASS = 'transition-transform duration-[var(--duration-slow)]';

/** Quantos passos lentos do DS cada anel espera antes de repetir. */
const RING_DELAY_STEPS = [0, 2, 4];

/** Passo lento de movimento do DS (`--duration-slow`) em SEGUNDOS. */
function useSlowStepSeconds(): number {
  const { token } = useTheme();
  const raw = token('--duration-slow').trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return 1;
  return raw.endsWith('ms') ? value / 1000 : value;
}

function PinHalo({ isActive, isStatic }: { isActive: boolean; isStatic: boolean }) {
  const step = useSlowStepSeconds();

  return (
    <div
      aria-hidden="true"
      data-slot="pin-3d-halo"
      className={[
        'pointer-events-none absolute inset-0',
        'transition-opacity duration-[var(--duration-medium)]',
        isActive ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <div className={RING_PLANE_CLASS}>
        {RING_DELAY_STEPS.map((delaySteps) => (
          <motion.div
            key={delaySteps}
            // `x`/`y` só no `initial`: o motion mantém o valor de quem não é
            // animado, e é assim que os anéis ficam centrados enquanto pulsam.
            initial={{ opacity: 0, scale: 0, x: '-50%', y: '-50%' }}
            animate={
              isStatic
                ? { opacity: 0.4, scale: 1 }
                : { opacity: [0, 1, 0.5, 0], scale: 1 }
            }
            transition={
              isStatic
                ? { duration: 0 }
                : { duration: step * 6, repeat: Infinity, delay: step * delaySteps }
            }
            className={RING_CLASS}
          />
        ))}
      </div>

      <div className={BEAM_CLASS} />
    </div>
  );
}

export interface Pin3DProps {
  /** Texto da etiqueta do pino (visível e acessível). */
  label: string;
  /** Destino do card. */
  href: string;
  /** Nome acessível do card. */
  cardLabel: string;
  /** Conteúdo do card (componentes do DS). */
  children: ReactNode;
}

/** Palco do pino: card que se inclina e halo que acende no hover/foco. */
export function Pin3D({ label, href, cardLabel, children }: Pin3DProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isActive, setIsActive] = useState(false);
  const isStatic = Boolean(prefersReducedMotion);

  return (
    <VStack
      data-slot="pin-3d"
      height={PIN_STAGE_BLOCK_SIZE}
      className={SCENE_CLASS}
      onPointerEnter={() => setIsActive(true)}
      onPointerLeave={() => setIsActive(false)}
      onFocusCapture={() => setIsActive(true)}
      onBlurCapture={() => setIsActive(false)}
    >
      <PinHalo isActive={isActive} isStatic={isStatic} />
      <VStack height="100%" gap={6} hAlign="center" vAlign="center" className="relative">
        <Badge label={label} variant="neutral" />
        <div
          className={`${TILT_TRANSITION_CLASS} ${isActive && !isStatic ? TILT_CLASS : FLAT_CLASS}`}
        >
          <ClickableCard label={cardLabel} href={href} width={CARD_INLINE_SIZE}>
            {children}
          </ClickableCard>
        </div>
      </VStack>
    </VStack>
  );
}

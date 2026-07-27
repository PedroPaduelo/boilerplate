/**
 * COMPONENTE PRÓPRIO — o Astryx não cobre "borda que brilha e segue o
 * ponteiro". O DS trata foco e hover com estados discretos (outline, overlay);
 * um anel cônico que gira continuamente atrás de uma máscara não existe no
 * catálogo e não sai da composição de primitivos.
 *
 * Reescrito sobre tokens: as cores do anel saem da rampa categórica de
 * data-viz (variante `default`) ou de `--color-text-primary` (variante
 * `white`, monocromática), a espessura vem de `--border-width`, o raio de
 * `--radius-container`, a distância de ativação de `--spacing-12` e a duração
 * do giro é múltiplo de `--duration-slow`. Antes eram quatro hex e px cravados.
 *
 * A máscara usa as PALAVRAS-CHAVE `black`/`transparent` — ali elas são
 * estêncil de alfa (o que aparece e o que some), não cor de marca; o DS não
 * publica token de máscara.
 *
 * ESTILO (regra 2.3): a caixa, o anel e os valores INICIAIS das variáveis do
 * efeito saem de utilities com token. Sobra um `style`: a PINTURA do anel —
 * gradiente da variante escolhida e máscara cônica cujo recorte acompanha
 * `--glow-start`, reescrita a cada quadro pelo rastreio do ponteiro.
 *
 * A11Y: o anel é decorativo (`aria-hidden`, `pointer-events: none`) e envolve
 * o conteúdo sem participar dele. Com `prefers-reduced-motion` o rastreamento
 * contínuo do ponteiro desliga: o anel fica aceso e parado.
 */
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { useTheme } from '@astryxdesign/core/theme';
import { VStack } from '@astryxdesign/core/VStack';

export type GlowingEffectVariant = 'default' | 'white';

/** Ângulo inicial do gradiente cônico (geometria do desenho). */
const CONIC_ORIGIN = '236.84deg';
/** Fração do raio, em torno do centro, onde o efeito não acende. */
const INACTIVE_ZONE = 0.7;

/**
 * As VARIÁVEIS do efeito, com os valores iniciais em utility (são constantes):
 * `--glow-start` é o ângulo do feixe, `--glow-active` o aceso/apagado (ambos
 * reescritos a cada quadro pelo rastreio do ponteiro), `--glow-spread` a
 * abertura angular revelada pela máscara e `--glow-repeat` quantas voltas o
 * gradiente cônico dá.
 */
const GLOW_VARS_CLASS =
  '[--glow-start:0] [--glow-active:0] [--glow-spread:40] [--glow-repeat:5]';

/**
 * O anel: espessura de 2 traços do DS (`--border-width`), transbordando a caixa
 * pela mesma medida, recortado pela máscara cônica que gira. Sem `-webkit-`: o
 * piso de browser do Tailwind v4 (Safari 16.4+) já resolve `mask-image`.
 */
const RING_CLASS = [
  'pointer-events-none absolute inset-[calc(var(--border-width)_*_-2)] rounded-[inherit]',
  '[border:calc(var(--border-width)_*_2)_solid_transparent]',
  '[mask-clip:padding-box,border-box] [mask-composite:intersect]',
  'opacity-[var(--glow-active)] transition-opacity duration-[var(--duration-medium)]',
].join(' ');

const GRADIENT: Record<GlowingEffectVariant, string> = {
  default: [
    'radial-gradient(circle, var(--color-data-categorical-pink) 10%, transparent 20%)',
    'radial-gradient(circle at 40% 40%, var(--color-data-categorical-orange) 5%, transparent 15%)',
    'radial-gradient(circle at 60% 60%, var(--color-data-categorical-green) 10%, transparent 20%)',
    'radial-gradient(circle at 40% 60%, var(--color-data-categorical-blue) 10%, transparent 20%)',
    `repeating-conic-gradient(from ${CONIC_ORIGIN} at 50% 50%,
      var(--color-data-categorical-pink) 0%,
      var(--color-data-categorical-orange) calc(25% / var(--glow-repeat)),
      var(--color-data-categorical-green) calc(50% / var(--glow-repeat)),
      var(--color-data-categorical-blue) calc(75% / var(--glow-repeat)),
      var(--color-data-categorical-pink) calc(100% / var(--glow-repeat)))`,
  ].join(', '),
  white: `repeating-conic-gradient(from ${CONIC_ORIGIN} at 50% 50%,
      var(--color-text-primary) 0%,
      var(--color-text-primary) calc(25% / var(--glow-repeat)))`,
};

const RING_MASK = `linear-gradient(transparent, transparent),
  conic-gradient(from calc((var(--glow-start) - var(--glow-spread)) * 1deg),
    transparent 0deg, black, transparent calc(var(--glow-spread) * 2deg))`;

/** Tempo do giro (s) e distância de ativação (px), lidos do tema. */
function useGlowMetrics(): { sweepSeconds: number; proximity: number } {
  const { token } = useTheme();
  const slow = Number.parseFloat(token('--duration-slow'));
  const gap = Number.parseFloat(token('--spacing-12'));
  return {
    sweepSeconds: Number.isFinite(slow) ? (slow / 1000) * 2 : 2,
    proximity: Number.isFinite(gap) ? gap : 0,
  };
}

export interface GlowingEffectProps {
  /** Paleta do anel: `default` usa data-viz; `white` é monocromático. */
  variant: GlowingEffectVariant;
  /** Conteúdo envolvido pelo anel (componentes do DS). */
  children: ReactNode;
}

/** Envolve o conteúdo com um anel que acende e gira conforme o ponteiro. */
export function GlowingEffect({ variant, children }: GlowingEffectProps) {
  const prefersReducedMotion = useReducedMotion();
  const { sweepSeconds, proximity } = useGlowMetrics();
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  const track = useCallback(
    (pointerX: number, pointerY: number) => {
      const element = rootRef.current;
      if (!element) return;

      const { left, top, width, height } = element.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const distance = Math.hypot(pointerX - centerX, pointerY - centerY);
      const deadRadius = 0.5 * Math.min(width, height) * INACTIVE_ZONE;

      if (distance < deadRadius) {
        element.style.setProperty('--glow-active', '0');
        return;
      }

      const isNear =
        pointerX > left - proximity &&
        pointerX < left + width + proximity &&
        pointerY > top - proximity &&
        pointerY < top + height + proximity;

      element.style.setProperty('--glow-active', isNear ? '1' : '0');
      if (!isNear) return;

      const current =
        Number.parseFloat(element.style.getPropertyValue('--glow-start')) || 0;
      const target =
        (180 * Math.atan2(pointerY - centerY, pointerX - centerX)) / Math.PI + 90;
      const next = current + (((target - current + 180) % 360) - 180);

      animate(current, next, {
        duration: sweepSeconds,
        ease: 'easeOut',
        onUpdate: (value) => element.style.setProperty('--glow-start', String(value)),
      });
    },
    [proximity, sweepSeconds],
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      rootRef.current?.style.setProperty('--glow-active', '1');
      return undefined;
    }

    const onPointerMove = (event: PointerEvent) => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => track(event.clientX, event.clientY));
    };

    document.body.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      cancelAnimationFrame(frameRef.current);
      document.body.removeEventListener('pointermove', onPointerMove);
    };
  }, [prefersReducedMotion, track]);

  return (
    <div
      ref={rootRef}
      data-slot="glowing-effect"
      data-variant={variant}
      className={`relative rounded-[var(--radius-container)] ${GLOW_VARS_CLASS}`}
    >
      <VStack className="relative">{children}</VStack>
      <div
        aria-hidden="true"
        data-slot="glowing-effect-ring"
        className={RING_CLASS}
        // runtime: pintura do anel — a paleta muda com a variante do bloco e o
        // recorte acompanha `--glow-start`, reescrito a cada quadro por `track()`
        style={{
          background: GRADIENT[variant],
          maskImage: RING_MASK,
        }}
      />
    </div>
  );
}

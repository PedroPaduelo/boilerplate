/**
 * COMPONENTE PRÓPRIO — o Astryx não anima números. Resolve "o KPI mudou": cada
 * dígito é uma fita 0–9 que rola até o valor atual, então a atualização é
 * percebida sem piscar o card inteiro.
 *
 * Duas correções sobre o `animated-number.tsx` legado:
 * 1. ACESSIBILIDADE — as fitas contêm os dez dígitos no DOM, e o leitor de tela
 *    lia "0123456789" por casa. Agora a animação é `aria-hidden` e o valor real
 *    vai num `VisuallyHidden`.
 * 2. MOVIMENTO — respeita `prefers-reduced-motion`: sem animação, o dígito
 *    apenas troca.
 *
 * As medidas são em `em` (relativas à fonte herdada), não em px: o número
 * acompanha o `Text`/`Heading` que o envolve, sem fixar tamanho próprio — é o
 * que permite ao card de resumo desenhá-lo nos 17,5px/700 da referência
 * (`04-widgets-prontos.md` §2.2) sem que este arquivo saiba disso.
 *
 * ESTILO (regra 2.3): a caixa de cada dígito é utility (`h-[1em]`,
 * `leading-none`, `tabular-nums`); nenhum `style` inline — a rolagem é escrita
 * pelo motion.
 */
import { motion, useReducedMotion } from 'motion/react';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';

/** Uma fita vertical com os dez dígitos; rola até alinhar o atual na janela. */
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Janela de UMA casa: mostra só o dígito alinhado, esconde o resto da fita. */
const WINDOW_CLASS = 'inline-flex h-[1em] overflow-hidden leading-none';

function DigitStrip({ digit, isStatic }: { digit: number; isStatic: boolean }) {
  return (
    <span className={WINDOW_CLASS}>
      <motion.span
        className="flex flex-col"
        initial={false}
        animate={{ y: `-${digit}em` }}
        transition={
          isStatic ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 20 }
        }
      >
        {DIGITS.map((value) => (
          <span key={value} className="h-[1em] text-center leading-none">
            {value}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export interface AnimatedNumberProps {
  /** Valor exibido quando `display` não é informado. */
  value: number;
  /**
   * Texto já formatado (ex.: "R$ 2,61 bi"). Vence `value`: só os dígitos rolam,
   * separadores e símbolos ficam parados.
   */
  display?: string;
}

/** Número com rolagem por dígito, herdando toda a tipografia do contexto. */
export function AnimatedNumber({ value, display }: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const text = display ?? String(value);

  return (
    <span data-slot="animated-number">
      <VisuallyHidden>{text}</VisuallyHidden>
      <span aria-hidden="true" className="inline-flex items-center tabular-nums">
        {[...text].map((char, index) =>
          /\d/.test(char) ? (
            <DigitStrip
              key={index}
              digit={Number(char)}
              isStatic={Boolean(prefersReducedMotion)}
            />
          ) : (
            <span key={index} className="inline-flex h-[1em] items-center">
              {char}
            </span>
          ),
        )}
      </span>
    </span>
  );
}

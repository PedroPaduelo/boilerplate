/**
 * COMPONENTE PRÓPRIO — o Astryx não cobre "palavra que se troca sozinha".
 * O DS publica tipografia estática (`Text`/`Heading`); conteúdo que se
 * substitui em ciclo, com entrada/saída animadas, não existe no catálogo e não
 * é componível a partir dele. Só a TROCA é própria: a palavra em si é `Text`
 * do DS, então tamanho, peso e cor continuam saindo do tema.
 *
 * Reescrito sobre tokens: a cor é `color="accent"` do DS (token
 * `--color-text-accent`), o tamanho é herdado (`type="inherit"`) do
 * `Heading` que envolve, e o deslocamento da animação é em `em` — relativo à
 * fonte herdada, nunca em px.
 *
 * ESTILO (regra 2.3): a caixa da palavra é `inline-block` por utility; nenhum
 * `style` inline — o que muda a cada quadro (opacidade, deslocamento, desfoque)
 * é escrito pelo motion, não por nós.
 *
 * A11Y (dois problemas do efeito legado, resolvidos):
 * 1. CONTEÚDO PRESO NO EFEITO — só a palavra do instante existia no DOM, então
 *    leitor de tela e busca da página perdiam as demais. Agora a lista INTEIRA
 *    vai num `VisuallyHidden` e a parte animada é `aria-hidden`.
 * 2. MOVIMENTO — com `prefers-reduced-motion` o ciclo desliga por completo
 *    (WCAG 2.2.2: conteúdo que se atualiza sozinho precisa poder parar); fica
 *    a primeira palavra, parada.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Text } from '@astryxdesign/core/Text';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';

/** Piso do intervalo entre trocas — espelha o `minimum` do `propsSchema`. */
const MIN_INTERVAL_MS = 500;

export interface FlipWordsProps {
  /** Palavras que o componente cicla. */
  words: string[];
  /** Tempo (ms) que cada palavra fica em tela. */
  durationMs: number;
}

/** Cicla `words`, mostrando uma por vez com entrada/saída animadas. */
export function FlipWords({ words, durationMs }: FlipWordsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  const safeWords = words.length > 0 ? words : [''];
  const current = safeWords[index % safeWords.length];

  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const interval = Math.max(MIN_INTERVAL_MS, durationMs);
    const timer = window.setInterval(() => setIndex((i) => i + 1), interval);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, durationMs]);

  const word = (
    <Text type="inherit" color="accent" weight="bold">
      {current}
    </Text>
  );

  return (
    <span data-slot="flip-words" className="inline-block">
      <VisuallyHidden>{safeWords.join(', ')}</VisuallyHidden>
      <span aria-hidden="true" className="inline-block">
        {prefersReducedMotion ? (
          word
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={current}
              initial={{ opacity: 0, y: '0.4em', filter: 'blur(0.2em)' }}
              animate={{ opacity: 1, y: '0em', filter: 'blur(0em)' }}
              exit={{ opacity: 0, y: '-0.4em', filter: 'blur(0.2em)' }}
              className="inline-block"
            >
              {word}
            </motion.span>
          </AnimatePresence>
        )}
      </span>
    </span>
  );
}

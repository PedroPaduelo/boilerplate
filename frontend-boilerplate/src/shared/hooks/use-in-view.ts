import { useEffect, useRef, useState } from 'react';

/**
 * "Este elemento já apareceu na tela?" — `IntersectionObserver` de disparo
 * ÚNICO (uma vez visível, nunca mais volta a `false`).
 *
 * Existe por causa do custo do dado: cada miniatura de gráfico da grade de
 * `/charts` executa a query do gráfico no banco (`POST /charts/:id/data` roda
 * INLINE, sem cache). Renderizar doze cards de uma vez dispararia doze
 * consultas — inclusive as de quem nunca rolou até lá. Com este hook, só o que
 * entra no campo de visão consulta.
 *
 * `rootMargin` folgado de propósito: o dado começa a chegar ANTES do card
 * aparecer, então quem rola encontra o gráfico pronto em vez do esqueleto.
 *
 * Ambientes sem `IntersectionObserver` (jsdom nos testes, navegador antigo)
 * caem no caminho honesto: assume-se visível: melhor consultar a mais do que
 * deixar a grade permanentemente vazia.
 */
export interface UseInViewOptions {
  /** Antecedência do disparo (CSS margin do observador). */
  rootMargin?: string;
  /** `false` desliga o observador (ex.: a grade nem está montada). */
  enabled?: boolean;
}

export function useInView<T extends HTMLElement = HTMLDivElement>({
  rootMargin = '300px',
  enabled = true,
}: UseInViewOptions = {}) {
  const ref = useRef<T | null>(null);
  // O recuo para ambiente sem observador é decidido no ESTADO INICIAL, não
  // dentro do efeito: `setState` síncrono em efeito dispara render em cascata
  // (e o lint do projeto barra, com razão).
  const [isInView, setIsInView] = useState(
    () => typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    if (!enabled || isInView) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, isInView, rootMargin]);

  return { ref, isInView };
}

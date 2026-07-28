import { useEffect, useState, type RefObject } from 'react';

/**
 * Largura atual de um elemento, observada (`ResizeObserver`).
 *
 * Nasceu para as miniaturas de gráfico: elas desenham num "canvas" de tamanho
 * FIXO e depois encolhem por `transform: scale()` até caber na célula da
 * grade — e para calcular esse fator é preciso saber quanto a célula mede
 * agora, o que só o layout responde.
 *
 * Observa o CONTÊINER, nunca o conteúdo escalado: medir algo que o próprio
 * resultado da medição redimensiona é como fazer laço infinito com o
 * navegador. O contêiner tem largura de coluna da grade e não depende do que
 * está dentro, então o valor estabiliza no primeiro quadro.
 *
 * `null` = ainda não medido (quem chama decide se esconde ou usa um palpite).
 */
export function useElementWidth<T extends HTMLElement>(
  ref: RefObject<T | null>,
): number | null {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof ResizeObserver === 'undefined') {
      // Sem observador (jsdom, navegador antigo): mede UMA vez, no próximo
      // quadro. O `requestAnimationFrame` não é firula — medir de dentro do
      // corpo do efeito seria `setState` síncrono, que gera render em cascata.
      const frame = requestAnimationFrame(() => {
        setWidth(node.getBoundingClientRect().width || null);
      });
      return () => cancelAnimationFrame(frame);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const next = entry.contentRect.width;
      // Ignora zero (elemento ainda não no fluxo) para não piscar a miniatura.
      if (next > 0) setWidth(next);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

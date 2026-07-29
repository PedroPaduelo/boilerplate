/**
 * Abrir/fechar um ramo é uma animação de ALTURA — e altura não anima de `0`
 * para `auto`.
 *
 * A técnica é a da referência (`demo.html`, função `slide`), que é também a do
 * `Collapse` do MUI usado na origem: mede-se `scrollHeight` (que continua
 * valendo com o bloco em `height: 0; overflow: hidden`), anima-se ATÉ esse
 * número e, no fim, devolve-se `height: ''`. O último passo não é detalhe: se
 * a altura ficar congelada em pixels, um submenu que cresça depois (ou uma
 * quebra de linha ao estreitar a janela) fica cortado para sempre.
 *
 * `overflow` é gerenciado junto com a altura, e não fixado no CSS, porque em
 * repouso ele precisa ser `visible`: com `hidden` permanente o anel de foco de
 * `:focus-visible` (2px + 2px de offset) do primeiro e do último item seria
 * recortado — teclado ficaria navegando sem ver onde está.
 */
import { useLayoutEffect, useRef, type AriaRole, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface NavCollapseProps {
  /** Alvo do `aria-controls` de quem abre este bloco. */
  id: string;
  isOpen: boolean;
  /** Modificador: `app-nav__children` acrescenta o recuo, a linha e o cotovelo. */
  className?: string;
  /**
   * Papel do bloco. Os FILHOS de um item são `role="group"` rotulado pelo pai
   * — é assim que o leitor de tela anuncia "dentro de Cobrança" e como o
   * `SideNavItem` do Astryx se comporta. O corpo de um GRUPO não recebe papel:
   * lá quem rotula já é o subheader, e um segundo `group` em volta dele criaria
   * um nível de aninhamento que não existe na tela.
   */
  role?: AriaRole;
  /** Nome acessível — obrigatório quando `role` é informado. */
  'aria-label'?: string;
  children: ReactNode;
}

/** Quem pediu menos movimento recebe o mesmo resultado, sem o trajeto. */
const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function NavCollapse({
  id,
  isOpen,
  className,
  role,
  'aria-label': ariaLabel,
  children,
}: NavCollapseProps) {
  const ref = useRef<HTMLDivElement>(null);
  /** O estado INICIAL (ramo que nasce aberto por ter filho ativo) não é uma
   *  transição: animá-lo faria o menu "se montar" na frente de quem chegou. */
  const isFirstPass = useRef(true);

  /*
   * `useLayoutEffect`, e não `useEffect`: o `data-state` do JSX é aplicado no
   * commit, e a regra `[data-state='closed']` zera a altura NA HORA. Com um
   * efeito passivo (que roda depois da pintura) o quadro intermediário
   * apareceria: o ramo fecharia de estalo, reabriria quando o efeito medisse
   * o conteúdo, e só então animaria. Antes da pintura, esse quadro não existe.
   */
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const settle = () => {
      element.style.height = isOpen ? '' : '0px';
      element.style.overflow = isOpen ? '' : 'hidden';
    };

    // `scrollHeight === 0` cobre o bloco vazio E o jsdom (que não tem motor de
    // layout): sem esta saída o `transitionend` que devolve `height: auto`
    // nunca chegaria e o ramo ficaria preso em zero — aberto no atributo,
    // fechado na tela.
    if (isFirstPass.current || prefersReducedMotion() || element.scrollHeight === 0) {
      isFirstPass.current = false;
      settle();
      return;
    }

    element.style.overflow = 'hidden';
    element.style.height = `${element.scrollHeight}px`;

    if (isOpen) {
      const onEnd = (event: TransitionEvent) => {
        if (event.propertyName === 'height') settle();
      };
      element.addEventListener('transitionend', onEnd, { once: true });
      return () => element.removeEventListener('transitionend', onEnd);
    }

    // Fechando: a altura precisa sair de um número CONCRETO (o quadro acima)
    // para o browser ter de onde interpolar até zero.
    const frame = requestAnimationFrame(() => {
      element.style.height = '0px';
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  return (
    <div
      ref={ref}
      id={id}
      className={clsx('app-nav__collapse', className)}
      role={role}
      aria-label={ariaLabel}
      data-state={isOpen ? 'open' : 'closed'}
    >
      {children}
    </div>
  );
}

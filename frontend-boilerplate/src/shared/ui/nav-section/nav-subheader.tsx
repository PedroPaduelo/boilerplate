/**
 * O rótulo de seção ("VISÃO GERAL", "GERENCIAMENTO") — e ele é um BOTÃO.
 *
 * É a assinatura visual da nav de origem (`components/nav-subheader.tsx:29-55`):
 * no hover o rótulo empurra 12px → 16px enquanto a seta SURGE à esquerda, tudo
 * em 300ms. O movimento é o que denuncia que aquilo é clicável — sem ele o
 * texto de 9,625px pareceria só um cabeçalho morto.
 *
 * `align-self: flex-start` no CSS: a área clicável tem a largura do TEXTO, não
 * da coluna. Um alvo de 268px de largura para um rótulo de 60px capturaria
 * cliques que a pessoa deu no espaço vazio ao lado.
 */
import type { ReactNode } from 'react';
import { ArrowIosDownwardIcon, ArrowIosForwardIcon } from '@/shared/ui/icons';

interface NavSubheaderProps {
  /** `id` do corpo do grupo — o que este botão colapsa. */
  controls: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function NavSubheader({
  controls,
  isOpen,
  onToggle,
  children,
}: NavSubheaderProps) {
  return (
    <button
      type="button"
      className="app-nav__subheader"
      aria-expanded={isOpen}
      aria-controls={controls}
      onClick={onToggle}
    >
      <span className="app-nav__subheader-arrow" aria-hidden="true">
        {isOpen ? <ArrowIosDownwardIcon /> : <ArrowIosForwardIcon />}
      </span>
      {children}
    </button>
  );
}

/**
 * A LISTA de navegação — o `<nav>` e seus grupos.
 *
 * É a metade de conteúdo do componente: não desenha superfície, não tem
 * largura, não sabe recolher. Serve para dois consumidores diferentes (a
 * navegação do app e a gaveta do mobile, onde quem desenha a caixa é o
 * `AppShell`), e é por isso que `NavSidebar` a envolve em vez de misturar tudo.
 *
 * O `<nav>` é também onde as CSS custom properties da VARIANTE são publicadas
 * (ver `nav-section.css`): trocar de vertical para mini é trocar o mapa de
 * variáveis, exatamente como na origem (`styles/css-vars.ts`).
 */
import { clsx } from 'clsx';
import { NavSectionGroup } from './nav-group';
import type { NavSectionProps } from './types';

export function NavSection({
  groups,
  isMini = false,
  'aria-label': ariaLabel,
  'data-testid': testId,
}: NavSectionProps) {
  return (
    <nav
      className={clsx('app-nav', isMini && 'app-nav--mini')}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {/*
        Trocar de forma REMONTA a lista. Na origem isso é literal: `vertical` e
        `mini` são dois componentes distintos (`nav-section-vertical.tsx` e
        `nav-section-mini.tsx`), e um não herda nada do outro. Aqui a chave
        produz o mesmo efeito e evita o vazamento que o estado compartilhado
        traria — um painel flutuante que continua "aberto" depois de a barra
        voltar aos 300px, por exemplo.
      */}
      <ul className="app-nav__ul" key={isMini ? 'mini' : 'vertical'}>
        {groups.map((group, index) => (
          <NavSectionGroup
            // O índice compõe a chave porque pode haver mais de um grupo sem
            // rótulo (itens soltos entre seções nomeadas).
            key={`${group.subheader ?? '__sem-rotulo__'}-${index}`}
            group={group}
            isMini={isMini}
          />
        ))}
      </ul>
    </nav>
  );
}

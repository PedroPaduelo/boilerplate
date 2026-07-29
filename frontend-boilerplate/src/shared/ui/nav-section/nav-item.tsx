/**
 * A CAIXA clicável do item — a peça que o olho reconhece como "o menu".
 *
 * Duas decisões de elemento, ambas com consequência prática:
 *
 * 1. ITEM COM FILHOS É `<button>`, não link. Ele não navega: clicar abre e
 *    fecha o ramo (`aria-expanded` + `aria-controls`). Um `<a>` que não leva a
 *    lugar nenhum promete navegação que não existe — e quebra ⌘/Ctrl+clique.
 * 2. ITEM FOLHA COM `href` É `<a>` DE VERDADE, via `RouterLinkAdapter`. Ganhos
 *    que um `<button onClick={navigate}>` não dá: ⌘/Ctrl+clique, botão do meio,
 *    "copiar endereço do link" e histórico.
 *
 * Por que o adapter e NÃO o `Link` do design system: o Astryx injeta as classes
 * atômicas do StyleX FORA de `@layer`, e regra escrita dentro de layer perde
 * para elas por mais específica que seja (fato já registrado em
 * `src/app/index.css`). Um `Link` do DS aqui traria sublinhado, cor e peso
 * próprios que o `nav-section.css` não conseguiria desfazer.
 */
import { type MouseEvent } from 'react';
import { clsx } from 'clsx';
import { RouterLinkAdapter } from '@/shared/lib/router-link';
import {
  ArrowIosDownwardIcon,
  ArrowIosForwardIcon,
  InfoOutlineIcon,
} from '@/shared/ui/icons';
import type { NavItemData } from './types';

interface NavItemProps {
  item: NavItemData;
  /** 1 = raiz (44px); ≥ 2 = sub (36px, com cotovelo). */
  depth: number;
  isMini: boolean;
  hasChildren: boolean;
  isOpen: boolean;
  /** `id` do bloco de filhos — vira o `aria-controls` de quem abre. */
  childrenId?: string;
  onToggle?: () => void;
}

export function NavItem({
  item,
  depth,
  isMini,
  hasChildren,
  isOpen,
  childrenId,
  onToggle,
}: NavItemProps) {
  const isRoot = depth === 1;
  const isActive = item.active === true;
  const isDisabled = item.disabled === true;

  const className = clsx(
    'app-nav__item',
    isRoot ? 'app-nav__item--root' : 'app-nav__item--sub',
    {
      'is-active': isActive,
      // `open` ≠ `active`: pai expandido com filho ativo fica CINZA; só a rota
      // ativa raiz fica verde (§3 do contrato).
      'is-open': isOpen && !isActive,
      'is-disabled': isDisabled,
    },
  );

  function handleClick(event: MouseEvent) {
    if (isDisabled) {
      // O `pointer-events: none` do CSS já barra o ponteiro; esta guarda cobre
      // o clique sintético (teclado, teste, script) que não passa pelo estilo.
      event.preventDefault();
      return;
    }
    if (hasChildren) {
      event.preventDefault();
      onToggle?.();
      return;
    }
    item.onClick?.(event);
  }

  const content = (
    <>
      {item.icon ? (
        <span className="app-nav__icon" aria-hidden="true">
          {item.icon}
        </span>
      ) : null}

      <span className="app-nav__texts">
        <span className="app-nav__title">{item.title}</span>
        {/*
          Recolhida, a 2ª linha some (não cabe em 88px) e a legenda vira o "i"
          absoluto no canto — é o que a origem faz (`mini/nav-item.tsx:210-214`).

          A dica é o `title` nativo, e não o `Tooltip` do DS, porque o Tooltip
          embrulha o filho num nó `display: contents` (`Tooltip.tsx:31-34`):
          dentro da lista isso se interpõe entre `<ul>` e `<li>` e mata os
          seletores estruturais que desenham a linha vertical e o cotovelo. A
          referência (`demo.html`) também usa `title`.
        */}
        {item.caption && !isMini ? (
          <span className="app-nav__caption" title={item.caption}>
            {item.caption}
          </span>
        ) : null}
      </span>

      {item.info ? <span className="app-nav__info">{item.info}</span> : null}

      {hasChildren ? (
        <span className="app-nav__arrow">
          {/* Recolhida a seta aponta para o painel flutuante (direita); aberta,
              ela espelha o estado: ▸ fechado, ▾ aberto. */}
          {isMini || !isOpen ? <ArrowIosForwardIcon /> : <ArrowIosDownwardIcon />}
        </span>
      ) : null}

      {item.caption && isMini && isRoot ? (
        <span
          className="app-nav__caption app-nav__caption--icon"
          title={item.caption}
          aria-hidden="true"
        >
          <InfoOutlineIcon />
        </span>
      ) : null}
    </>
  );

  const href = item.href;

  if (!hasChildren && href) {
    return (
      <RouterLinkAdapter
        href={href}
        className={className}
        title={item.description}
        aria-current={isActive ? 'page' : undefined}
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : undefined}
        data-testid={item['data-testid']}
        onClick={handleClick}
      >
        {content}
      </RouterLinkAdapter>
    );
  }

  return (
    <button
      type="button"
      className={className}
      title={item.description}
      disabled={isDisabled}
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={isDisabled || undefined}
      aria-expanded={hasChildren ? isOpen : undefined}
      aria-controls={hasChildren ? childrenId : undefined}
      data-testid={item['data-testid']}
      onClick={handleClick}
    >
      {content}
    </button>
  );
}

/**
 * Um grupo: o rótulo de seção e a lista que ele colapsa.
 *
 * O grupo é um `<li>` da lista raiz com uma `<ul>` dentro — a estrutura da
 * origem (`vertical/nav-section-vertical.tsx:36-66`). O corpo passa pelo mesmo
 * `NavCollapse` dos filhos de um item, mas SEM a classe `app-nav__children`:
 * recuo, linha vertical e cotovelo são do aninhamento, não da seção. (A
 * referência `demo.html` reaproveita a mesma classe nos dois lugares e, com
 * isso, empurra os itens de nível 1 em 36px e desenha uma linha ao lado deles —
 * o que a especificação não pede e o sistema de origem não faz.)
 */
import { useId, useState } from 'react';
import { NavCollapse } from './nav-collapse';
import { NavList } from './nav-list';
import { NavSubheader } from './nav-subheader';
import { navItemKey } from './nav-tree';
import type { NavGroup } from './types';

interface NavSectionGroupProps {
  group: NavGroup;
  isMini: boolean;
}

export function NavSectionGroup({ group, isMini }: NavSectionGroupProps) {
  const [isOpen, setIsOpen] = useState(group.defaultCollapsed !== true);
  const bodyId = useId();

  // Recolhida, o subheader some (não há largura para 9,625px em caixa alta em
  // 88px) — e com ele sumiria o único controle capaz de reabrir o grupo. Por
  // isso, sem subheader visível, o corpo fica sempre aberto: um grupo fechado
  // ali seria conteúdo invisível E inalcançável.
  const hasSubheader = Boolean(group.subheader) && !isMini;
  const isBodyOpen = hasSubheader ? isOpen : true;

  return (
    <li className="app-nav__li">
      {hasSubheader ? (
        <NavSubheader
          controls={bodyId}
          isOpen={isOpen}
          onToggle={() => setIsOpen((open) => !open)}
        >
          {group.subheader}
        </NavSubheader>
      ) : null}

      <NavCollapse id={bodyId} isOpen={isBodyOpen}>
        <ul className="app-nav__ul">
          {group.items.map((item) => (
            <NavList key={navItemKey(item)} item={item} depth={1} isMini={isMini} />
          ))}
        </ul>
      </NavCollapse>
    </li>
  );
}

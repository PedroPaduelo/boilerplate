/**
 * Um item e o que pende dele: o ramo ABERTO, os filhos e o painel da forma mini.
 *
 * O estado de abertura mora aqui (um por ramo) e não num contexto global, pelo
 * mesmo motivo da origem (`vertical/nav-list.tsx`): dois ramos abertos ao mesmo
 * tempo é o comportamento certo — fechar o vizinho ao abrir um menu esconde a
 * lista que a pessoa acabou de consultar.
 *
 * NENHUM EFEITO sincroniza esse estado. Quem manda é a rota: o ramo que contém
 * a rota atual nasce aberto, e a decisão manual da pessoa é guardada JUNTO com
 * o valor que a rota tinha quando ela decidiu (`BranchOverride.at`). Assim, a
 * próxima navegação que entra ou sai deste ramo torna a decisão obsoleta
 * sozinha, e a nav volta a acompanhar a URL — sem `useEffect` chamando
 * `setState`, que é render a mais e duas fontes para o mesmo fato.
 */
import { useId, useRef, useState, type MouseEvent } from 'react';
import { NavCollapse } from './nav-collapse';
import { NavItem } from './nav-item';
import { NavMiniDropdown } from './nav-mini-dropdown';
import { hasActiveDescendant, navItemKey } from './nav-tree';
import type { NavItemData } from './types';

interface NavListProps {
  item: NavItemData;
  /** 1 = raiz. */
  depth: number;
  isMini: boolean;
}

/** A decisão manual de abrir/fechar, carimbada com o estado da rota na hora. */
interface BranchOverride {
  at: boolean;
  isOpen: boolean;
}

export function NavList({ item, depth, isMini }: NavListProps) {
  const children = item.children ?? [];
  const hasChildren = children.length > 0;
  const autoOpen = hasActiveDescendant(item);

  const [override, setOverride] = useState<BranchOverride | null>(null);
  /** Painel flutuante da forma mini — estado PRÓPRIO: "menu aberto no hover"
   *  não é a mesma coisa que "ramo expandido", e misturar os dois faz um
   *  herdar o estado do outro na troca de forma. */
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const childrenId = useId();
  const anchorRef = useRef<HTMLLIElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isBranchOpen =
    override !== null && override.at === autoOpen ? override.isOpen : autoOpen;

  /** Painel flutuante só existe na RAIZ da forma mini; dentro dele, tudo volta
   *  ao formato normal (é o `NavList` de novo, com `isMini={false}`). */
  const hasDropdown = isMini && depth === 1 && hasChildren;
  const isOpen = hasDropdown ? isPanelOpen : isBranchOpen;

  function handleToggle() {
    if (hasDropdown) {
      // Teclado também abre o painel: quem navega por Tab não tem hover.
      setIsPanelOpen(!isPanelOpen);
      return;
    }
    setOverride({ at: autoOpen, isOpen: !isBranchOpen });
  }

  /*
   * O painel vive no `<body>` (portal), então sair do item em direção a ele
   * dispara `mouseleave` no `<li>` e fecharia o menu no meio do caminho. Os
   * dois handlers abaixo olham para onde o ponteiro FOI: se foi para a outra
   * metade do par item↔painel, o menu continua aberto. É o mesmo problema que
   * a origem resolve com o `padding: 0 6px` no paper do Popover
   * (`components/nav-dropdown.tsx:15-25`), que também replicamos no CSS.
   */
  function handleItemLeave(event: MouseEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && panelRef.current?.contains(next)) return;
    setIsPanelOpen(false);
  }

  function handlePanelLeave(event: MouseEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && anchorRef.current?.contains(next)) return;
    setIsPanelOpen(false);
  }

  const nested = children.map((child) => (
    <NavList key={navItemKey(child)} item={child} depth={depth + 1} isMini={false} />
  ));

  return (
    <>
      {/* Divisor ANTES do item, dentro do mesmo grupo: separa um bloco sem
          inventar um título de seção que ninguém pediu. */}
      {item.divider ? <li className="app-nav__divider" role="separator" /> : null}

      <li
        ref={anchorRef}
        className="app-nav__li"
        onMouseEnter={hasDropdown ? () => setIsPanelOpen(true) : undefined}
        onMouseLeave={hasDropdown ? handleItemLeave : undefined}
      >
        <NavItem
          item={item}
          depth={depth}
          isMini={isMini}
          hasChildren={hasChildren}
          isOpen={isOpen}
          childrenId={hasChildren ? childrenId : undefined}
          onToggle={handleToggle}
        />

        {/*
          `role="group"` rotulado pelo TÍTULO DO PAI. Sem isso o bloco é uma
          `<div>` anônima e o leitor de tela lê os filhos como se fossem irmãos
          dos itens de cima — some a informação "isto está dentro de Cobrança",
          que é justamente o que o recuo e a linha vertical dizem a quem vê. É
          também o contrato que o `SideNavItem` do Astryx cumpre hoje, e do qual
          as telas que migram já dependem.
        */}
        {hasChildren && !hasDropdown ? (
          <NavCollapse
            id={childrenId}
            isOpen={isOpen}
            className="app-nav__children"
            role="group"
            aria-label={item.title}
          >
            <ul className="app-nav__ul">{nested}</ul>
          </NavCollapse>
        ) : null}

        {hasDropdown && isOpen ? (
          <NavMiniDropdown
            id={childrenId}
            label={item.title}
            anchorRef={anchorRef}
            panelRef={panelRef}
            onMouseLeave={handlePanelLeave}
          >
            <ul className="app-nav__ul">{nested}</ul>
          </NavMiniDropdown>
        ) : null}
      </li>
    </>
  );
}

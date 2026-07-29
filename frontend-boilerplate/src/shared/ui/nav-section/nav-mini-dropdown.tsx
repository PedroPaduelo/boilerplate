/**
 * O submenu da forma MINI: um painel flutuante à direita do item.
 *
 * Recolhida, a nav tem 88px — não há para onde os filhos descerem. A origem
 * troca o collapse por um `Popover` ancorado em `center/right` → `center/left`
 * (`mini/nav-list.tsx:85-118`), e é isso que este componente reproduz.
 *
 * POR QUE PORTAL + `position: fixed`, e não `absolute` dentro do item: a área
 * rolável da sidebar precisa de `overflow-y: auto` para a lista rolar, e
 * `overflow-x: visible` não existe na prática (o browser promove o outro eixo a
 * `auto` quando um deles não é `visible`). Qualquer painel posicionado dentro
 * dela sairia recortado na borda dos 88px. O portal tira o painel dessa caixa;
 * o `data-astryx-theme` que o `Theme` espelha no `<html>` mantém os tokens
 * `--ds-*` válidos lá fora.
 */
import {
  useLayoutEffect,
  useState,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

interface NavMiniDropdownProps {
  /** Mesmo `id` que o item aponta em `aria-controls`. */
  id: string;
  /** Título do item — nomeia o `role="group"` do painel, igual ao bloco de
   *  filhos da forma expandida: o aninhamento é o mesmo, só muda o desenho. */
  label: string;
  /** O `<li>` do item — o painel é centrado nele e colado na sua borda direita. */
  anchorRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  onMouseLeave: (event: MouseEvent) => void;
  children: ReactNode;
}

interface PanelPosition {
  top: number;
  left: number;
}

export function NavMiniDropdown({
  id,
  label,
  anchorRef,
  panelRef,
  onMouseLeave,
  children,
}: NavMiniDropdownProps) {
  const [position, setPosition] = useState<PanelPosition | null>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    // `left` na borda direita do item e `top` no meio dele; o deslocamento de
    // meia altura fica no `transform` do CSS (transformOrigin `center/left` da
    // origem). Medido no layout effect: a posição já vale no primeiro quadro.
    setPosition({ top: rect.top + rect.height / 2, left: rect.right });
  }, [anchorRef]);

  if (!position) return null;

  /*
   * DOIS elementos, como na origem (`NavDropdown` + `NavDropdownPaper`): o de
   * fora é transparente e existe só para ser a ZONA MORTA de 6px entre o item
   * e o painel — ele recebe o ponteiro no vão, e é o que impede o menu de
   * fechar no caminho. O de dentro é a superfície visível.
   */
  return createPortal(
    <div
      ref={panelRef}
      className="app-nav__dropdown"
      style={{ top: position.top, left: position.left }}
      onMouseLeave={onMouseLeave}
    >
      <div id={id} className="app-nav__dropdown-paper" role="group" aria-label={label}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

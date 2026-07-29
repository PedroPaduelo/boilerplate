/**
 * A SUPERFÍCIE da navegação: largura, fundo, borda, rolagem e o botão redondo
 * de recolher.
 *
 * Separado do `NavSection` porque a mesma navegação aparece em dois lugares com
 * caixas diferentes: a coluna de 300px do desktop e a gaveta do mobile. Quem
 * avisa em qual dos dois estamos é o próprio design system, pelo
 * `SideNavRenderContext` (`SideNavRenderContext.ts:10-16`).
 *
 * O QUE A GAVETA NÃO DESENHA É A CAIXA — NÃO O CONTEÚDO.
 *
 * Fora ficam superfície, largura fixa e botão de recolher: a moldura é do
 * `AppShell` (repeti-la daria duas, uma dentro da outra) e não há o que
 * recolher numa gaveta. As três ZONAS continuam: topo, lista e rodapé. Isso não
 * é preferência — dropar o rodapé no mobile tira da tela o menu da conta, ou
 * seja, deixa o usuário sem como SAIR do sistema. O `SideNav` que substituímos
 * renderiza exatamente `{topContent}{children}{footer}` no modo
 * 'drawer-content' (`SideNav.tsx:471-489`); tínhamos regredido em relação a ele.
 */
import { clsx } from 'clsx';
import { useSideNavRenderMode } from '@astryxdesign/core/SideNav';
import { ArrowIosBackIcon, ArrowIosForwardIcon } from '@/shared/ui/icons';
import { NavSection } from './nav-section';
import type { NavSidebarProps } from './types';

export function NavSidebar({
  groups,
  'aria-label': ariaLabel,
  isCollapsed = false,
  onCollapsedChange,
  hasToggle,
  toggleLabel,
  topContent,
  footer,
  emptyContent,
  'data-testid': testId,
}: NavSidebarProps) {
  const isPlain = useSideNavRenderMode() !== 'default';
  // Recolher só faz sentido na coluna: na gaveta a largura é do `AppShell`.
  const isMini = !isPlain && isCollapsed;

  const isEmpty = groups.every((group) => group.items.length === 0);
  const list =
    isEmpty && emptyContent ? (
      emptyContent
    ) : (
      <NavSection groups={groups} isMini={isMini} aria-label={ariaLabel} />
    );

  /*
   * As três zonas, montadas UMA vez e usadas nas duas caixas: é o que impede a
   * gaveta de divergir da coluna com o tempo (foi assim que o rodapé sumiu do
   * mobile). O enquadramento de cada uma — margem, linha, centragem na forma
   * mini — está no `nav-section.css`, não em quem consome a barra.
   */
  const zones = (
    <>
      {/* O conteúdo fixo some na forma mini: um campo de texto em 88px não é
          utilizável, só ocupa a faixa. Na gaveta não há forma mini, então ele
          aparece normalmente. */}
      {topContent && !isMini ? (
        <div className="app-nav-sidebar__top">{topContent}</div>
      ) : null}

      <div className="app-nav-sidebar__scroll">{list}</div>

      {footer ? <div className="app-nav-sidebar__footer">{footer}</div> : null}
    </>
  );

  if (isPlain) {
    return (
      <div className="app-nav-sidebar app-nav-sidebar--plain" data-testid={testId}>
        {zones}
      </div>
    );
  }

  // Botão sem `onCollapsedChange` seria um controle morto — o estado da forma
  // mini é controlado por quem usa (ele persiste a escolha).
  const canToggle = typeof onCollapsedChange === 'function';
  const showToggle = canToggle && (hasToggle ?? true);

  return (
    <div
      className={clsx('app-nav-sidebar', isMini && 'app-nav-sidebar--mini')}
      data-testid={testId}
    >
      {zones}

      {showToggle ? (
        <button
          type="button"
          className="app-nav-sidebar__toggle"
          aria-label={
            toggleLabel ?? (isMini ? 'Expandir navegação' : 'Recolher navegação')
          }
          onClick={() => onCollapsedChange?.(!isCollapsed)}
        >
          {isMini ? <ArrowIosForwardIcon /> : <ArrowIosBackIcon />}
        </button>
      ) : null}
    </div>
  );
}

import { forwardRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';

type AnchorProps = React.ComponentPropsWithoutRef<'a'>;

/**
 * Adapter que liga os links do Astryx ao react-router.
 *
 * Todo componente do DS que renderiza navegação (`Link`, `SideNavItem`,
 * `Breadcrumbs`…) resolve o elemento via `LinkProvider`. Sem este adapter cada
 * clique vira navegação do browser (full page reload), perdendo o estado do
 * React Query e o socket.
 *
 * URLs externas e âncoras continuam como `<a>` nativo — o router só sabe lidar
 * com rotas internas.
 */
export const RouterLinkAdapter = forwardRef<HTMLAnchorElement, AnchorProps>(
  function RouterLinkAdapter({ href, children, ...rest }, ref) {
    const isInternal =
      typeof href === 'string' && href.startsWith('/') && !href.startsWith('//');

    if (!isInternal) {
      return (
        <a ref={ref} href={href} {...rest}>
          {children}
        </a>
      );
    }

    return (
      <RouterLink ref={ref} to={href} {...rest}>
        {children}
      </RouterLink>
    );
  },
);

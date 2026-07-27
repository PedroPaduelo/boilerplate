import { useLocation } from 'react-router-dom';
import { Icon } from '@astryxdesign/core/Icon';
import { SideNav, SideNavHeading, SideNavItem } from '@astryxdesign/core/SideNav';
import { useAuthStore } from '@/features/auth/store';
import { NAV_ITEMS, canSeeNavItem } from './nav-items';
import { UserMenu } from './user-menu';

interface AppSidebarProps {
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
}

/**
 * Navegação principal do app autenticado.
 *
 * O `SideNav` do Astryx já resolve as três coisas que antes eram feitas na mão:
 * o modo recolhido (com tooltip nos ícones), o drawer no mobile (via `AppShell`)
 * e o estado selecionado acessível (`aria-current`). Os itens navegam
 * client-side porque o `LinkProvider` do shell injeta o adapter do react-router.
 */
export function AppSidebar({ isCollapsed, onCollapsedChange }: AppSidebarProps) {
  const location = useLocation();
  const role = useAuthStore((s) => s.user?.role);

  const items = NAV_ITEMS.filter((item) => canSeeNavItem(item, role));

  return (
    <SideNav
      collapsible={{ isCollapsed, onCollapsedChange }}
      header={
        <SideNavHeading
          heading="auditorIA"
          headingHref="/home"
          icon={
            <img
              src="/auditoria-icon.png"
              alt=""
              width={24}
              height={24}
              draggable={false}
            />
          }
        />
      }
      footer={<UserMenu />}
    >
      {items.map((item) => (
        <SideNavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={<Icon icon={item.icon} />}
          isSelected={location.pathname.startsWith(item.href)}
        />
      ))}
    </SideNav>
  );
}

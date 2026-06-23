import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users as UsersIcon,
  LayoutDashboard,
  BarChart3,
  Blocks,
  Database,
  MessageSquare,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import {
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/features/auth/store';
import { hasAnyRole, hasPermission, type Permission, type Role } from '@/shared/lib/rbac';

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Permissão exigida para o item aparecer (RBAC, espelha o backend). */
  permission?: Permission;
  /** Papéis exigidos (alternativa à permissão). */
  roles?: Role[];
}

// Navegação base (shell da Fase 0). As trilhas FE ajustam rótulos/ícones/RBAC
// conforme implementam cada tela; a rota em si vem de features/<x>/routes.tsx.
// Cada item é filtrado por papel/permissão (defesa em profundidade — o backend
// continua sendo a autoridade; as rotas também usam o guarda `RequireRole`).
const NAV: NavItem[] = [
  { id: '/dashboards', label: 'Dashboards', icon: LayoutDashboard, permission: 'artifacts:view' },
  { id: '/charts', label: 'Gráficos', icon: BarChart3, permission: 'artifacts:view' },
  { id: '/catalog', label: 'Catálogo', icon: Blocks, permission: 'artifacts:view' },
  { id: '/connections', label: 'Conexões', icon: Database, permission: 'connections:use' },
  { id: '/chat', label: 'Chat', icon: MessageSquare, permission: 'artifacts:manage' },
  { id: '/users', label: 'Usuários', icon: UsersIcon, roles: ['ADMIN'] },
];

function canSeeNavItem(item: NavItem, role: Role | null | undefined): boolean {
  if (item.roles && !hasAnyRole(role, item.roles)) return false;
  if (item.permission && !hasPermission(role, item.permission)) return false;
  return true;
}

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function AppSidebar({ collapsed, onToggleCollapsed }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.user?.role);
  const navItems = NAV.filter((item) => canSeeNavItem(item, role));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        data-collapsed={collapsed}
        className={cn(
          'hidden h-full shrink-0 flex-col border-r border-sidebar-border/60 bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out lg:flex',
          collapsed ? 'w-14' : 'w-[15.5rem]',
        )}
      >
        <div
          className={cn(
            'flex h-14 items-center gap-2 border-b border-sidebar-border/60 px-3',
            collapsed && 'justify-center px-0',
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            W
          </span>
          {!collapsed ? (
            <span className="text-sm font-semibold tracking-tight">
              WFM
            </span>
          ) : null}
        </div>

        <nav
          className="flex flex-1 flex-col gap-1 p-2"
          aria-label="Navegação principal"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.id);
            const button = (
              <Button
                variant="ghost"
                className={cn(
                  'w-full gap-2',
                  collapsed ? 'justify-center px-0' : 'justify-start',
                  active
                    ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                )}
                aria-current={active ? 'page' : undefined}
                onClick={() => navigate(item.id)}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed ? item.label : null}
              </Button>
            );

            return collapsed ? (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <div key={item.id}>{button}</div>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 border-t border-sidebar-border/60 p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center px-0 text-muted-foreground"
                  onClick={handleLogout}
                  aria-label="Sair"
                >
                  <LogOut className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          )}

          <Button
            variant="ghost"
            className={cn(
              'w-full gap-2 text-muted-foreground',
              collapsed ? 'justify-center px-0' : 'justify-start',
            )}
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <>
                <PanelLeftClose className="size-4" />
                Recolher
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

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
  ChevronsUpDown,
} from 'lucide-react';
import {
  Button,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const navItems = NAV.filter((item) => canSeeNavItem(item, role));

  const displayName = user?.name ?? user?.email ?? 'Usuário';
  const initials = (user?.name ?? user?.email ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
            'flex h-14 items-center border-b border-sidebar-border/60',
            collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-3',
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapsed}
                  aria-label="Expandir menu"
                  className="flex size-9 items-center justify-center rounded-lg transition hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                  <img
                    src="/auditoria-icon.png"
                    alt="auditorIA"
                    className="size-7 select-none"
                    draggable={false}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expandir menu</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <img
                src="/auditoria-logo.png"
                alt="auditorIA"
                className="h-6 w-auto shrink-0 select-none"
                draggable={false}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    onClick={onToggleCollapsed}
                    aria-label="Recolher menu"
                  >
                    <PanelLeftClose className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Recolher menu</TooltipContent>
              </Tooltip>
            </>
          )}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'h-auto w-full py-1.5 text-sidebar-foreground/90 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                  collapsed ? 'justify-center px-0' : 'justify-start gap-2',
                )}
                aria-label="Abrir menu da conta"
              >
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="bg-sidebar-accent text-[0.7rem] font-semibold text-sidebar-accent-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed ? (
                  <>
                    <span className="flex min-w-0 flex-1 flex-col text-left">
                      <span className="truncate text-sm font-medium leading-tight">
                        {displayName}
                      </span>
                      {user?.email ? (
                        <span className="truncate text-xs leading-tight text-sidebar-foreground/60">
                          {user.email}
                        </span>
                      ) : null}
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/50" />
                  </>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="end"
              sideOffset={8}
              className="min-w-56"
            >
              <DropdownMenuLabel className="flex items-center gap-2 p-2 font-normal">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-muted text-[0.7rem] font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium leading-tight">
                    {displayName}
                  </span>
                  {user?.email ? (
                    <span className="truncate text-xs leading-tight text-muted-foreground">
                      {user.email}
                    </span>
                  ) : null}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut className="size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}

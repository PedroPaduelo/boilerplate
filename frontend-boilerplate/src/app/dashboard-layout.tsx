import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users as UsersIcon, LogOut } from 'lucide-react';
import {
  DashboardSidebarNav,
  DashboardTopbar,
  Button,
  Avatar,
  AvatarFallback,
} from '@/components/ui';
import { useAuthStore } from '@/features/auth/store';

const NAV = [
  { id: '/overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: '/users', label: 'Usuários', icon: UsersIcon },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const activeId =
    NAV.find((n) => location.pathname.startsWith(n.id))?.id ?? '/users';
  const title = NAV.find((n) => n.id === activeId)?.label ?? 'Painel';

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
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <DashboardSidebarNav
        className="hidden h-full lg:flex"
        items={NAV}
        activeId={activeId}
        onSelect={(id) => navigate(id)}
        brand={
          <>
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="size-4" />
            </span>
            <span className="text-sm font-semibold">Boilerplate</span>
          </>
        }
        footer={
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        }
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          title={title}
          actions={
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-none">
                  {user?.name ?? 'Usuário'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <Avatar className="size-9">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
          }
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

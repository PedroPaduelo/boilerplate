import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DashboardTopbar, Avatar, AvatarFallback } from '@/components/ui';
import { AppSidebar } from './app-sidebar';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuthStore } from '@/features/auth/store';

const TITLES: Record<string, string> = {
  '/dashboards': 'Dashboards',
  '/charts': 'Gráficos',
  '/connections': 'Conexões',
  '/chat': 'Chat',
  '/users': 'Usuários',
};

export function DashboardLayout() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar:collapsed') === '1',
  );

  useEffect(() => {
    localStorage.setItem('sidebar:collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  function toggleCollapsed() {
    setCollapsed((c) => !c);
  }

  const activeKey = Object.keys(TITLES).find((k) =>
    location.pathname.startsWith(k),
  );
  const title = activeKey ? TITLES[activeKey] : 'Painel';

  const initials = (user?.name ?? user?.email ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          className="sticky top-0 z-30 h-14 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sm:px-6"
          title={
            <span className="text-base font-semibold tracking-tight sm:text-lg">
              {title}
            </span>
          }
          actions={
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-none">
                  {user?.name ?? 'Usuário'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <Avatar className="size-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
          }
        />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1760px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

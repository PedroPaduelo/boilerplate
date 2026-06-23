import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DashboardTopbar } from '@/components/ui';
import { AppSidebar } from './app-sidebar';
import { ThemeToggle } from '@/components/theme/theme-toggle';

const TITLES: Record<string, string> = {
  '/dashboards': 'Dashboards',
  '/charts': 'Gráficos',
  '/catalog': 'Catálogo',
  '/connections': 'Conexões',
  '/chat': 'Chat',
  '/users': 'Usuários',
};

export function DashboardLayout() {
  const location = useLocation();
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

  // Rotas "full-bleed": ocupam 100% do espaço (sem padding/max-width/borda).
  // O detalhe da conexão é um workbench e aproveita melhor a tela cheia.
  const fullBleed = location.pathname.startsWith('/connections/');

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
          actions={<ThemeToggle />}
        />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div
            className={
              fullBleed
                ? 'h-full w-full'
                : 'mx-auto w-full max-w-[1760px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8'
            }
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

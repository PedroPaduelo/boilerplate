import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DashboardTopbar } from '@/components/ui';
import { cn } from '@/shared/lib/utils';
import { AppSidebar } from './app-sidebar';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { CommandPalette } from '@/features/command-palette/command-palette';
import { CommandTrigger } from '@/features/command-palette/command-trigger';

const TITLES: Record<string, string> = {
  '/home': 'Visão geral',
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar:collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  function toggleCollapsed() {
    setCollapsed((c) => !c);
  }

  const activeKey = Object.keys(TITLES).find((k) => location.pathname.startsWith(k));
  const title = activeKey ? TITLES[activeKey] : 'Painel';

  // Rotas "full-bleed": ocupam 100% do espaço (sem padding/max-width/borda).
  // O detalhe da conexão é um workbench e aproveita melhor a tela cheia.
  const fullBleed = location.pathname.startsWith('/connections/');

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-background text-foreground">
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <DashboardTopbar
          className="sticky top-0 z-30 h-14 shrink-0 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sm:px-6"
          title={
            <span className="text-base font-semibold tracking-tight sm:text-lg">
              {title}
            </span>
          }
          actions={
            <>
              <CommandTrigger />
              <ThemeToggle />
            </>
          }
          onMenu={() => setMobileOpen(true)}
        />
        {/* Quem manda no scroll depende do tipo de rota:
            - páginas normais: o documento cresce e o <main> rola (comportamento
              clássico de página);
            - full-bleed (workbench): a PRÓPRIA página gerencia o scroll dos seus
              painéis internos, então o <main> não pode rolar. Se os dois rolam,
              aparece o scroll duplo e a barra de status é empurrada para fora.

            O `h-full` do wrapper é o que fecha a CADEIA DE ALTURA. Sem ele o
            wrapper fica com altura automática, o `h-full` da página não tem
            contra o que resolver e ela passa a ser dimensionada pelo conteúdo:
            sobrava buraco vazio em telas altas (182px em 1080) e estourava em
            telas baixas (146px em 800), levando a barra de status junto. */}
        <main
          className={cn(
            'min-h-0 flex-1',
            fullBleed ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain',
          )}
        >
          <div
            className={
              fullBleed
                ? 'h-full min-h-0 w-full'
                : 'mx-auto w-full max-w-[1760px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8'
            }
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Montada uma única vez no shell: o atalho ⌘K funciona em toda tela
          autenticada, e a paleta reaproveita as queries já em cache. */}
      <CommandPalette />
    </div>
  );
}

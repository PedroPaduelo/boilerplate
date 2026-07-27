import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@astryxdesign/core/AppShell';
import { TopNav } from '@astryxdesign/core/TopNav';
import { HStack } from '@astryxdesign/core/Layout';
import { Heading } from '@astryxdesign/core/Text';
import { ColorModeToggle } from '@/shared/theme';
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import { useAgentLiveUpdates } from '@/shared/socket/use-agent-live-updates';
import { CommandPalette } from '@/features/command-palette/command-palette';
import { CommandTrigger } from '@/features/command-palette/command-trigger';
import { AppSidebar } from './app-sidebar';
import { FALLBACK_TITLE, findActiveNavItem } from './nav-items';

/**
 * Shell do app autenticado.
 *
 * `AppShell` é o frame mais externo: ele orça as regiões (topNav, sideNav,
 * main), resolve o drawer de navegação no mobile e o "pular para o conteúdo"
 * sem nenhum código nosso. O scroll fica com o shell (`height="fill"`), não com
 * o documento — por isso o `<body>` é travado no CSS global.
 *
 * `contentPadding` é decidido pelo TIPO de conteúdo, não por gosto:
 *   - `0` nas rotas full-bleed (o detalhe da conexão é um workbench e os
 *     próprios painéis internos controlam o respiro e o scroll);
 *   - `4` no resto (listagens e formulários pedem margem de leitura).
 */
export function DashboardLayout() {
  // Montado no shell (uma vez) para valer em QUALQUER tela: dá para pedir um
  // gráfico no chat, ir para os dashboards e ver o resultado chegar sozinho.
  useAgentLiveUpdates();

  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar:collapsed', false);

  const title = findActiveNavItem(location.pathname)?.label ?? FALLBACK_TITLE;

  // Workbench ocupa 100% da área útil: sem padding do shell.
  const isFullBleed = location.pathname.startsWith('/connections/');

  return (
    <>
      <AppShell
        height="fill"
        contentPadding={isFullBleed ? 0 : 4}
        sideNav={
          <AppSidebar isCollapsed={isCollapsed} onCollapsedChange={setIsCollapsed} />
        }
        topNav={
          <TopNav
            heading={
              <Heading level={1} maxLines={1}>
                {title}
              </Heading>
            }
            endContent={
              <HStack gap={1} vAlign="center">
                <CommandTrigger />
                <ColorModeToggle />
              </HStack>
            }
          />
        }
      >
        <Outlet />
      </AppShell>

      {/* Montada uma única vez no shell: o atalho ⌘K funciona em toda tela
          autenticada, e a paleta reaproveita as queries já em cache. */}
      <CommandPalette />
    </>
  );
}

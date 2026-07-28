/**
 * Navegação lateral entre as ABAS do dashboard (doc 40).
 *
 * Por que `TabList` e não `SideNav`: o próprio DS marca "usar SideNav para
 * filtrar conteúdo" como anti-pattern e manda usar abas. `SideNav` é a navegação
 * PRIMÁRIA do app — ela já existe no shell, com as rotas — e aninhar uma segunda
 * dentro do conteúdo colocaria duas navegações principais competindo pela mesma
 * função. Aqui a troca é de VISTA dentro de uma mesma página, que é literalmente
 * o caso de uso de tabs.
 *
 * ACESSIBILIDADE — vem pronta do `TabList` com `orientation="vertical"`:
 *  - ponto ÚNICO de tabulação (roving tabindex): o Tab do teclado atravessa a
 *    barra inteira em vez de parar em cada aba;
 *  - ↑/↓ (e ←/→) movem entre as abas; Home/End vão para a primeira/última;
 *  - a aba atual é anunciada por `aria-current="page"`;
 *  - o DS renderiza `<nav aria-label>` + `<button>` — navegação semântica de
 *    verdade. O rótulo explícito ("Abas do dashboard") existe para distinguir
 *    esta região do menu principal do app na lista de landmarks, que é como um
 *    usuário de leitor de tela navega entre as áreas da página.
 */
import { LayoutPanel } from '@astryxdesign/core/Layout';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import type { ResolvedDashTab } from '../../lib/dashboard-tabs';

export interface DashboardTabsSidebarProps {
  tabs: ResolvedDashTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
}

export function DashboardTabsSidebar({
  tabs,
  activeTabId,
  onTabChange,
}: DashboardTabsSidebarProps) {
  return (
    // `LayoutPanel` é o slot lateral do shell de página do DS: já resolve a
    // largura estável e o divisor. Largura fixa é intencional — rótulo de aba é
    // texto curto, e uma coluna elástica faria o grid do dashboard reflowar a
    // cada troca de aba.
    <LayoutPanel hasDivider width={220} data-testid="dashboard-tabs-sidebar">
      <TabList
        value={activeTabId}
        onChange={onTabChange}
        orientation="vertical"
        layout="fill"
        aria-label="Abas do dashboard"
      >
        {tabs.map((tab) => (
          <Tab key={tab.id} value={tab.id} label={tab.title} />
        ))}
      </TabList>
    </LayoutPanel>
  );
}

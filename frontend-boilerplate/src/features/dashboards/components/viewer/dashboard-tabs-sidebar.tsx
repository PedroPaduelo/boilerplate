/**
 * Navegação lateral entre as ABAS do dashboard (doc 40).
 *
 * ---------------------------------------------------------------------------
 * POR QUE `SideNav` E NÃO `TabList` (reversão de uma decisão anterior)
 * ---------------------------------------------------------------------------
 * A primeira versão usava `TabList` com `orientation="vertical"`, citando o
 * anti-pattern do DS ("não use SideNav para filtrar conteúdo, use abas"). Só que
 * `orientation` do `TabList` **não empilha nada**: a própria doc do componente
 * diz que ela "controla quais setas movem o foco e o `aria-orientation`
 * reportado". A faixa continua sendo horizontal. Medido na tela: as duas abas
 * saíam LADO A LADO dentro de um painel de 220px.
 *
 * E não havia como corrigir o eixo por fora:
 *   • `xstyle` é INERTE neste app — não há compilador StyleX (o mesmo achado
 *     já registrado em `chat-empty-state.tsx`);
 *   • CSS em `@layer` PERDE das classes atômicas do StyleX, que são injetadas
 *     fora de layer;
 *   • `TabList` não expõe `style`.
 *
 * Sobrava fabricar um seletor fora de layer para virar o `flex-direction` de
 * uma classe interna do DS — remendo que quebra na próxima versão dele.
 *
 * O anti-pattern citado se aplicava ao contexto ANTIGO, em que esta tela vivia
 * dentro do shell do app e uma segunda navegação lateral competiria com a
 * principal. A tela de visualização agora é AUTÔNOMA (rota fora do
 * `DashboardLayout`): não há outra navegação na página, então esta deixa de ser
 * "uma segunda nav" e passa a ser A nav — que é exatamente o que `SideNav` é.
 *
 * ---------------------------------------------------------------------------
 * ITEM = LINK, NÃO BOTÃO
 * ---------------------------------------------------------------------------
 * A aba ativa já vivia na URL (`?tab=`), então o item é um `href` de verdade e
 * não um `onClick`. Ganhos que um botão não dá: abrir aba em nova guia com
 * ⌘/Ctrl+clique ou botão do meio, "copiar endereço do link", e o estado de
 * visitado do navegador. A navegação continua client-side porque o
 * `LinkProvider` do shell injeta o adapter do react-router.
 */
import { SideNav, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import type { ResolvedDashTab } from '../../lib/dashboard-tabs';

export interface DashboardTabsSidebarProps {
  tabs: ResolvedDashTab[];
  activeTabId: string;
  /** Monta o endereço da aba — quem conhece a rota é a tela, não este componente. */
  hrefForTab: (tabId: string) => string;
}

export function DashboardTabsSidebar({
  tabs,
  activeTabId,
  hrefForTab,
}: DashboardTabsSidebarProps) {
  return (
    // `aria-label` explícito: o rótulo padrão do `SideNav` é genérico
    // ("Navegação lateral"), e quem usa leitor de tela precisa distinguir esta
    // região — que navega ENTRE ABAS de um dashboard — de um menu de app.
    <SideNav aria-label="Abas do dashboard" data-testid="dashboard-tabs-sidebar">
      {/*
        `isHeaderHidden`: o título da seção existe para o leitor de tela nomear
        a região ("Abas"), mas escrevê-lo na tela seria repetir o que os próprios
        itens já dizem — e a página já tem o título do dashboard no cabeçalho.
      */}
      <SideNavSection title="Abas do dashboard" isHeaderHidden>
        {tabs.map((tab) => (
          <SideNavItem
            key={tab.id}
            label={tab.title}
            href={hrefForTab(tab.id)}
            isSelected={tab.id === activeTabId}
          />
        ))}
      </SideNavSection>
    </SideNav>
  );
}

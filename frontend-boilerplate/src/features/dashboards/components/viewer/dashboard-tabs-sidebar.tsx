/**
 * Navegação lateral entre as ABAS do dashboard (docs 40 e 41).
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTA BARRA PRECISA RESOLVER
 * ---------------------------------------------------------------------------
 * O dashboard é montado pelo AGENTE, e ele decide quantas abas existem e o que
 * cada uma responde. Uma lista plana de rótulos ("Visão geral", "Detalhamento",
 * "Comparativo"…) obriga quem chega a ler tudo e clicar para descobrir o que é
 * o quê. Por isso a barra consome os campos de apresentação que a aba declara
 * (ver `Tab` no contrato):
 *
 *   • ÍCONE dá âncora visual: o olho volta na aba certa sem reler o texto;
 *   • GRUPO vira SEÇÃO com título, o que transforma 12 abas em 3 blocos de 4;
 *   • ORDEM decide a posição (e a do grupo), sem exigir reescrever o array;
 *   • NÍVEL vira ANINHAMENTO de verdade (ramo com cotovelo e linha vertical);
 *   • DIVISOR quebra um bloco de itens dentro do mesmo grupo;
 *   • DESCRIÇÃO responde "o que tem aqui" na dica, antes do clique;
 *   • CONTAGEM de blocos dá o peso da aba (uma com 1 bloco e outra com 9 não
 *     são a mesma coisa).
 *
 * Todos são OPCIONAIS: dashboard antigo (e agente que ainda não os usa) cai no
 * comportamento anterior — rótulo, marcador neutro e uma seção só. A tradução
 * de cada campo em item vive em `dashboard-tabs-nav-items.tsx`, que é onde
 * também está explicado por que a aba-pai aparece como ramo E como link.
 *
 * ---------------------------------------------------------------------------
 * MUITAS ABAS: BUSCA, E NÃO SÓ ROLAGEM
 * ---------------------------------------------------------------------------
 * A área de itens já rola sozinha (`.app-nav-sidebar__scroll`), o que resolve o
 * overflow mas não a LOCALIZAÇÃO: rolar 14 abas procurando "protestos" é a
 * mesma varredura de antes, só que em duas telas. A partir de
 * `TAB_FILTER_THRESHOLD` a barra ganha um campo de busca (atalho `/`), que casa
 * título, descrição e grupo — porque quem procura lembra do ASSUNTO, não do
 * rótulo exato que o agente escolheu. Busca sem resultado mostra o motivo: uma
 * lista que simplesmente fica vazia lê como navegação quebrada.
 *
 * ---------------------------------------------------------------------------
 * POR QUE `NavSidebar` — E NÃO `TabList`, E NÃO MAIS O `SideNav` DO DS
 * ---------------------------------------------------------------------------
 * `orientation="vertical"` do `TabList` **não empilha nada**: a própria doc diz
 * que ela "controla quais setas movem o foco e o `aria-orientation` reportado".
 * Medido na tela, as duas abas saíam LADO A LADO num painel de 220px. E a tela
 * de visualização é AUTÔNOMA (rota fora do shell, sem menu do app): não há
 * outra navegação na página, então esta não é "uma segunda nav" — é A nav.
 *
 * A troca do `SideNav` do Astryx por `@/shared/ui/nav-section` é a mesma da
 * barra principal do app, pelos motivos medidos em
 * `docs/design-system/sidebar/CONTRATO.md` §1 (o DOM do DS não tem legenda de
 * 2ª linha, cotovelo de aninhamento nem o bloco de 56px com rótulo de 8,75px da
 * forma recolhida, e CSS em `@layer` não alcança as classes do StyleX). O ganho
 * aqui é direto: a barra de abas deixa de ser *parecida* com a navegação do app
 * e passa a ser o MESMO componente, com os mesmos tokens.
 *
 * ITEM = LINK, NÃO BOTÃO: a aba ativa já vive na URL (`?tab=`), então o item é
 * um `href` de verdade. Ganhos que um botão não dá: ⌘/Ctrl+clique, botão do
 * meio, "copiar endereço do link" e histórico.
 *
 * ---------------------------------------------------------------------------
 * O QUE MUDOU NA TROCA (decisões, não acidentes)
 * ---------------------------------------------------------------------------
 * • `resizable` SAIU. O padrão documentado tem largura FIXA — 300px
 *   (`--ds-layout-nav-vertical-width`) e 88px recolhida — e não há alça no
 *   componente. O que se perde é o ajuste fino de quem arrastava a borda; o que
 *   fica é a escolha que importa (barra inteira ou faixa de ícones), agora
 *   PERSISTIDA, e uma barra que mede o mesmo em todas as telas do produto. O
 *   valor antigo (248px, ajustável entre 200 e 380) já permitia 300px: não é um
 *   salto de escala, é a fixação de um ponto que estava dentro da faixa.
 * • RECOLHIMENTO PERSISTE em `localStorage`, como a barra do app faz
 *   (`dashboard-layout.tsx`, chave `sidebar:collapsed`). Antes era `useState`:
 *   quem trabalhava recolhido reabria a barra a cada F5 e a cada troca de
 *   dashboard. Chave própria (`dashboards:viewer:tabs-collapsed`) porque é
 *   outra barra — quem recolhe as abas não está pedindo para recolher o menu do
 *   app.
 * • A DICA DE DESCRIÇÃO deixou de ser um `Tooltip` nosso e passou a ser o campo
 *   `description` do item (o `NavItem` a aplica como `title` nativo). Some o
 *   caso especial de "não desenhar o balão quando recolhido", que existia
 *   porque o `SideNavItem` do DS trazia um tooltip próprio nesse estado: a nav
 *   nova, recolhida, mostra ícone + rótulo de 8,75px — não é ícone mudo — e a
 *   dica passa a ser justamente o complemento que falta ali.
 * • O CAMPO DE BUSCA some sozinho na forma mini (o `NavSidebar` cuida disso):
 *   um input de texto em 88px não é utilizável, só ocupa a faixa.
 * • O ENQUADRAMENTO DO TOPO é da barra, não desta tela: ela dá os 16px em volta
 *   do bloco fixo e reserva a faixa do botão de recolher, que flutua centrado em
 *   36px (`nav-section.css`: `:has(> .app-nav-sidebar__toggle)`). Houve uma
 *   versão em que a reserva era feita AQUI, com um espaçador no `topContent` —
 *   saiu quando a barra passou a fazê-la: a faixa é do botão, e o botão é dela.
 *   Consequência prática: o campo de busca entra sem margem própria.
 */
import { useMemo, useState, type RefObject } from 'react';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { SearchIcon } from '@/shared/ui';
import { NavSidebar } from '@/shared/ui/nav-section';
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import {
  TAB_FILTER_THRESHOLD,
  filterTabs,
  type ResolvedDashTab,
} from '../../lib/dashboard-tabs';
import { tabsToNavGroups } from './dashboard-tabs-nav-items';

/** Onde a escolha de recolher fica guardada. Ver a nota do cabeçalho. */
export const TABS_COLLAPSED_STORAGE_KEY = 'dashboards:viewer:tabs-collapsed';

export interface DashboardTabsSidebarProps {
  tabs: ResolvedDashTab[];
  activeTabId: string;
  /** Monta o endereço da aba — quem conhece a rota é a tela, não este componente. */
  hrefForTab: (tabId: string) => string;
  /**
   * Ref do campo de busca, para o atalho de teclado da PÁGINA poder focá-lo.
   * A barra não escuta teclado sozinha de propósito: atalho global registrado
   * por componente é atalho que briga com outro componente igual na tela.
   */
  filterInputRef?: RefObject<HTMLInputElement | null>;
}

export function DashboardTabsSidebar({
  tabs,
  activeTabId,
  hrefForTab,
  filterInputRef,
}: DashboardTabsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    TABS_COLLAPSED_STORAGE_KEY,
    false,
  );
  const [term, setTerm] = useState('');

  const hasFilter = tabs.length >= TAB_FILTER_THRESHOLD;
  const visible = useMemo(
    () => (hasFilter ? filterTabs(tabs, term) : tabs),
    [hasFilter, tabs, term],
  );
  const groups = useMemo(
    () => tabsToNavGroups(visible, { activeTabId, hrefForTab }),
    [visible, activeTabId, hrefForTab],
  );

  return (
    // `aria-label` explícito: quem usa leitor de tela precisa distinguir esta
    // região — que navega ENTRE ABAS de um dashboard — de um menu de app.
    <NavSidebar
      groups={groups}
      aria-label="Abas do dashboard"
      data-testid="dashboard-tabs-sidebar"
      isCollapsed={isCollapsed}
      onCollapsedChange={setIsCollapsed}
      // Mesmo nome que o catálogo pt-BR do design system dava ao controle
      // equivalente: é o que o usuário já ouvia. O rótulo acompanha a direção
      // (recolhida, o botão expande) — um botão que continuasse dizendo
      // "Recolher" com a barra já recolhida mentiria para quem só ouve.
      toggleLabel={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
      // Sem margem própria: o enquadramento do bloco fixo do topo é da barra
      // (`.app-nav-sidebar__top`, 16px), e a faixa do botão de recolher também
      // (ver a nota do cabeçalho). Repetir o padding aqui daria 32px de recuo e
      // tiraria o campo do eixo dos itens.
      topContent={
        hasFilter ? (
          <VStack data-slot="tabs-filter">
            <TextInput
              ref={filterInputRef}
              size="sm"
              label="Filtrar abas"
              isLabelHidden
              placeholder="Filtrar abas…"
              value={term}
              hasClear
              startIcon={SearchIcon}
              onChange={setTerm}
            />
          </VStack>
        ) : undefined
      }
      // Só quando há busca: fora dela a lista nunca fica vazia (a barra só
      // existe com 2+ abas), e a mensagem citaria um termo que ninguém digitou.
      emptyContent={
        hasFilter ? (
          <VStack
            paddingInline={2}
            paddingBlock={2}
            gap={1}
            data-slot="tabs-filter-empty"
          >
            <Text type="supporting" color="secondary">
              Nenhuma aba corresponde a “{term.trim()}”.
            </Text>
          </VStack>
        ) : undefined
      }
    />
  );
}

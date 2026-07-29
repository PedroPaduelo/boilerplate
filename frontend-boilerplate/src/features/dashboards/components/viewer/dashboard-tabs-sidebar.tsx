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
 *   • NÍVEL vira ANINHAMENTO de verdade (sub-item do `SideNavItem`);
 *   • DIVISOR quebra um bloco de itens dentro do mesmo grupo;
 *   • DESCRIÇÃO responde "o que tem aqui" na dica, antes do clique;
 *   • CONTAGEM de blocos dá o peso da aba (uma com 1 bloco e outra com 9 não
 *     são a mesma coisa).
 *
 * Todos são OPCIONAIS: dashboard antigo (e agente que ainda não os usa) cai no
 * comportamento anterior — rótulo, marcador neutro e uma seção só.
 *
 * ---------------------------------------------------------------------------
 * MUITAS ABAS: BUSCA, E NÃO SÓ ROLAGEM
 * ---------------------------------------------------------------------------
 * A área de itens do `SideNav` já rola sozinha, o que resolve o overflow mas
 * não a LOCALIZAÇÃO: rolar 14 abas procurando "protestos" é a mesma varredura
 * de antes, só que em duas telas. A partir de `TAB_FILTER_THRESHOLD` a barra
 * ganha um campo de busca (atalho `/`), que casa título, descrição e grupo —
 * porque quem procura lembra do ASSUNTO, não do rótulo exato que o agente
 * escolheu. Busca sem resultado mostra o motivo: uma lista que simplesmente
 * fica vazia lê como navegação quebrada.
 *
 * ---------------------------------------------------------------------------
 * O QUE NÃO É REIMPLEMENTADO AQUI (de propósito)
 * ---------------------------------------------------------------------------
 * Recolhida, a barra vira uma coluna de ícones — e ícone sem nome é
 * adivinhação, ainda mais quando quem escolhe o ícone é o agente. Essa dica JÁ
 * VEM do design system: `SideNavItem` recolhido renderiza o próprio `Tooltip`
 * com o `label` (e um popover com os sub-itens, quando há filhos), e some com o
 * `endContent`. Duplicar isso aqui daria dois balões no mesmo hover.
 *
 * O que o DS não cobre — e portanto mora aqui — é a dica com a DESCRIÇÃO no
 * estado expandido, onde não há tooltip nenhum e o texto que explica a aba
 * ficaria invisível até o clique.
 *
 * ---------------------------------------------------------------------------
 * POR QUE `SideNav` E NÃO `TabList`
 * ---------------------------------------------------------------------------
 * `orientation="vertical"` do `TabList` **não empilha nada**: a própria doc diz
 * que ela "controla quais setas movem o foco e o `aria-orientation` reportado".
 * Medido na tela, as duas abas saíam LADO A LADO num painel de 220px. E a tela
 * de visualização é AUTÔNOMA: não há outra navegação na página, então esta não
 * é "uma segunda nav" — é A nav, que é o que `SideNav` é.
 *
 * ITEM = LINK, NÃO BOTÃO: a aba ativa já vive na URL (`?tab=`), então o item é
 * um `href` de verdade. Ganhos que um botão não dá: ⌘/Ctrl+clique, botão do
 * meio, "copiar endereço do link" e histórico.
 */
import { useMemo, useState, type ReactNode, type RefObject } from 'react';
import { Search } from 'lucide-react';
import { Divider } from '@astryxdesign/core/Divider';
import { SideNav, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import { semanticIcon } from '@/shared/ui';
import {
  TAB_FILTER_THRESHOLD,
  filterTabs,
  groupTabs,
  nestTabs,
  type ResolvedDashTab,
} from '../../lib/dashboard-tabs';

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

/** Quantos BLOCOS a aba tem (soma dos blocos de todas as suas linhas). */
function blockCount(tab: ResolvedDashTab): number {
  return tab.rows.reduce((total, row) => total + (row.blocks?.length ?? 0), 0);
}

export function DashboardTabsSidebar({
  tabs,
  activeTabId,
  hrefForTab,
  filterInputRef,
}: DashboardTabsSidebarProps) {
  // Estado CONTROLADO de recolhimento por dois motivos concretos: esconder o
  // campo de busca (o `SideNav` renderiza `topContent` mesmo recolhido, e um
  // campo de 200px numa faixa de ícones estoura o layout) e desligar a dica de
  // descrição, que recolhido viraria o segundo balão do mesmo hover.
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [term, setTerm] = useState('');

  const hasFilter = tabs.length >= TAB_FILTER_THRESHOLD;
  const visible = useMemo(
    () => (hasFilter ? filterTabs(tabs, term) : tabs),
    [hasFilter, tabs, term],
  );
  const groups = useMemo(() => groupTabs(visible), [visible]);
  // Sem nenhum grupo declarado, a única seção não ganha título visível: um
  // cabeçalho "Abas" acima de uma lista de abas é ruído puro.
  const hasNamedGroups = groups.some((group) => group.title !== undefined);
  const isEmpty = visible.length === 0;

  return (
    // `aria-label` explícito: o rótulo padrão do `SideNav` é genérico
    // ("Navegação lateral"), e quem usa leitor de tela precisa distinguir esta
    // região — que navega ENTRE ABAS de um dashboard — de um menu de app.
    <SideNav
      aria-label="Abas do dashboard"
      data-testid="dashboard-tabs-sidebar"
      collapsible={{
        hasButton: true,
        buttonLabel: 'Recolher navegação de abas',
        isCollapsed,
        onCollapsedChange: setIsCollapsed,
      }}
      resizable={{
        defaultWidth: 248,
        minWidth: 200,
        maxWidth: 380,
        autoSaveId: 'dashboards:viewer:tabs',
      }}
      topContent={
        hasFilter && !isCollapsed ? (
          <VStack paddingInline={3} paddingBlock={2} data-slot="tabs-filter">
            <TextInput
              ref={filterInputRef}
              size="sm"
              label="Filtrar abas"
              isLabelHidden
              placeholder="Filtrar abas…"
              value={term}
              hasClear
              startIcon={Search}
              onChange={setTerm}
            />
          </VStack>
        ) : undefined
      }
    >
      {isEmpty ? (
        <VStack paddingInline={3} paddingBlock={2} gap={1} data-slot="tabs-filter-empty">
          <Text type="supporting" color="secondary">
            Nenhuma aba corresponde a “{term.trim()}”.
          </Text>
        </VStack>
      ) : (
        groups.map((group, index) => (
          <SideNavSection
            // O índice compõe a chave porque pode haver mais de uma seção sem
            // título (abas soltas entre grupos nomeados).
            key={`${group.title ?? '__ungrouped__'}-${index}`}
            title={group.title ?? 'Abas do dashboard'}
            isHeaderHidden={group.title === undefined && !hasNamedGroups}
          >
            {nestTabs(group.tabs).map(({ tab, children }) => (
              <TabNavItem
                key={tab.id}
                tab={tab}
                activeTabId={activeTabId}
                hrefForTab={hrefForTab}
                isCollapsed={isCollapsed}
              >
                {children.map((child) => (
                  <TabNavItem
                    key={child.id}
                    tab={child}
                    activeTabId={activeTabId}
                    hrefForTab={hrefForTab}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </TabNavItem>
            ))}
          </SideNavSection>
        ))
      )}
    </SideNav>
  );
}

interface TabNavItemProps {
  tab: ResolvedDashTab;
  activeTabId: string;
  hrefForTab: (tabId: string) => string;
  isCollapsed: boolean;
  /** Sub-abas (`level: 2`) — viram itens aninhados do design system. */
  children?: ReactNode;
}

/** Um item da navegação: divisor opcional antes, dica de descrição no hover. */
function TabNavItem({
  tab,
  activeTabId,
  hrefForTab,
  isCollapsed,
  children,
}: TabNavItemProps) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  const item = (
    <SideNavItem
      label={tab.title}
      icon={semanticIcon(tab.icon)}
      href={hrefForTab(tab.id)}
      isSelected={tab.id === activeTabId}
      data-testid={`tab-item-${tab.id}`}
      // A DESCRIÇÃO não vira segunda linha do item de propósito: com 8+ abas,
      // uma linha extra por item transforma a barra numa parede de texto e mata
      // a varredura, que é justamente o que ela serve para fazer.
      endContent={
        /*
         * `aria-hidden`: o número é PISTA VISUAL de peso da aba, e o
         * `endContent` entra no NOME ACESSÍVEL do link — sem isto o leitor de
         * tela anuncia "Visão geral 0", que não significa nada para quem não
         * está vendo a coluna de contagens, e quebra a navegação por nome
         * (inclusive nos testes, que buscam o link por rótulo).
         */
        <span aria-hidden="true">
          <Text type="supporting" color="secondary" hasTabularNumbers>
            {blockCount(tab)}
          </Text>
        </span>
      }
    >
      {children}
    </SideNavItem>
  );

  // Dica com a descrição SÓ no estado expandido: recolhido, o próprio DS já
  // desenha um tooltip com o rótulo, e dois balões no mesmo hover é pior que
  // nenhum. Item com filhos também fica de fora — recolhido ele vira popover,
  // e expandido o balão cobriria os sub-itens que a pessoa quer alcançar.
  const content =
    tab.description && !isCollapsed && !hasChildren ? (
      <Tooltip content={tab.description} placement="end" alignment="start">
        {item}
      </Tooltip>
    ) : (
      item
    );

  if (!tab.divider) return content;

  // O divisor vem ANTES do item (é o que o contrato diz): serve para separar um
  // bloco de itens dentro do MESMO grupo, sem inventar um título de seção que
  // ninguém pediu.
  return (
    <VStack gap={1} data-slot="tab-item-divided">
      <Divider />
      {content}
    </VStack>
  );
}

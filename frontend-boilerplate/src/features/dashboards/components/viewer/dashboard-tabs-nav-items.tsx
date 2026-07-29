/**
 * Tradução ABA → item da navegação (`@/shared/ui/nav-section`).
 *
 * Mora fora do componente porque é REGRA, não desenho: decide o que vira item
 * de primeiro nível, o que vira ramo, quem carrega ícone e onde entra a
 * contagem de blocos. Separada, ela cabe num arquivo curto e legível — e o
 * componente fica só com o que é dele (estado da busca, do recolhimento e a
 * ligação com o `NavSidebar`).
 *
 * ---------------------------------------------------------------------------
 * O RAMO E O "LINK DE SI MESMA"
 * ---------------------------------------------------------------------------
 * A nav própria tem uma regra dura (CONTRATO §3, `nav-item.tsx:5-9`): ITEM COM
 * FILHOS NÃO NAVEGA — clicar nele abre e fecha o ramo. Num menu de app isso é o
 * certo: "Atividade Fiscal" é uma pasta, não uma tela. Aqui não é: TODA aba tem
 * conteúdo próprio, então uma aba-pai virada botão deixaria as linhas dela
 * inalcançáveis pela barra (sobrariam a URL e o atalho ‹/›, que ninguém
 * descobre sozinho).
 *
 * Por isso a aba-pai COM BLOCOS entra duas vezes: como o RAMO (o botão que
 * abre, com o ícone e o título) e como o PRIMEIRO item de dentro dele — o link
 * de verdade para o conteúdo dela, que é quem recebe a contagem e o
 * `aria-current`. Aba-pai SEM bloco nenhum (agrupadora pura) não ganha esse
 * link: seria um caminho para uma tela vazia.
 *
 * O dia em que o `NavItem` aceitar "link + botão de abrir" no mesmo item — que
 * é o que o `SideNavItem` do Astryx faz hoje (`SideNavItem.js:392-418`: âncora
 * com `href` ao lado de um `<button>` de `aria-expanded`) — este item repetido
 * sai daqui e nada mais muda.
 */
import { semanticIcon } from '@/shared/ui';
import type { NavGroup, NavItemData } from '@/shared/ui/nav-section';
import { groupTabs, nestTabs, type ResolvedDashTab } from '../../lib/dashboard-tabs';

export interface TabsNavOptions {
  activeTabId: string;
  /** Monta o endereço da aba — quem conhece a rota é a tela, não este módulo. */
  hrefForTab: (tabId: string) => string;
}

/** Quantos BLOCOS a aba tem (soma dos blocos de todas as suas linhas). */
export function blockCount(tab: ResolvedDashTab): number {
  return tab.rows.reduce((total, row) => total + (row.blocks?.length ?? 0), 0);
}

/**
 * Abas (já filtradas) → grupos da navegação.
 *
 * Duas passagens que já existiam e continuam valendo: `groupTabs` vira SEÇÃO
 * (o `subheader` da nav) e `nestTabs` vira o segundo nível. Grupo sem título
 * declarado fica sem `subheader` — não inventamos "Outros", e um cabeçalho
 * "Abas" acima de uma lista de abas seria ruído puro.
 */
export function tabsToNavGroups(
  tabs: ResolvedDashTab[],
  options: TabsNavOptions,
): NavGroup[] {
  return groupTabs(tabs).map((group) => ({
    subheader: group.title,
    items: nestTabs(group.tabs).map(({ tab, children }) =>
      children.length > 0 ? branchItem(tab, children, options) : tabItem(tab, 1, options),
    ),
  }));
}

/** Uma aba navegável: link com ícone, contagem e dica de descrição. */
function tabItem(
  tab: ResolvedDashTab,
  depth: 1 | 2,
  { activeTabId, hrefForTab }: TabsNavOptions,
): NavItemData {
  const Icon = semanticIcon(tab.icon);

  return {
    key: tab.id,
    title: tab.title,
    href: hrefForTab(tab.id),
    active: tab.id === activeTabId,
    /*
     * A DESCRIÇÃO não vira 2ª linha (`caption`) de propósito: com 8+ abas, uma
     * linha extra por item transforma a barra numa parede de texto e mata a
     * varredura, que é justamente o que ela serve para fazer. Como
     * `description` ela vira a dica do hover (o `title` nativo que o `NavItem`
     * põe no elemento) — inclusive recolhida, que é onde o rótulo de 8,75px
     * mais precisa de complemento.
     */
    description: tab.description,
    /* O divisor vem ANTES do item (é o que o contrato diz): separa um bloco
       dentro do MESMO grupo, sem inventar um título de seção. */
    divider: tab.divider,
    /* Sub-item não recebe ícone: ali quem marca o nível é o cotovelo, e os dois
       lado a lado espremem o rótulo nos 36px de altura do item. É também o que
       a origem faz — sub-item tem bullet, não ícone. */
    icon: depth === 1 ? <Icon /> : undefined,
    /*
     * `aria-hidden`: o número é PISTA VISUAL do peso da aba (uma com 1 bloco e
     * outra com 9 não são a mesma coisa), e tudo que está dentro do link entra
     * no NOME ACESSÍVEL dele. Sem isto o leitor de tela anuncia "Visão geral 0"
     * — que não significa nada para quem não vê a coluna de contagens — e a
     * navegação por nome (inclusive a dos testes) deixa de achar a aba pelo
     * rótulo.
     */
    info: <span aria-hidden="true">{blockCount(tab)}</span>,
    'data-testid': `tab-item-${tab.id}`,
  };
}

/** Uma aba com sub-abas: o ramo que abre/fecha (ver a nota do cabeçalho). */
function branchItem(
  tab: ResolvedDashTab,
  children: ResolvedDashTab[],
  options: TabsNavOptions,
): NavItemData {
  const Icon = semanticIcon(tab.icon);
  const hasOwnContent = blockCount(tab) > 0;

  const self: NavItemData[] = hasOwnContent
    ? [
        {
          ...tabItem(tab, 2, options),
          /* O divisor pertence ao RAMO (é ele que ocupa a posição na lista);
             repeti-lo aqui desenharia uma linha DENTRO do próprio bloco. */
          divider: undefined,
        },
      ]
    : [];

  return {
    key: `branch-${tab.id}`,
    title: tab.title,
    icon: <Icon />,
    description: tab.description,
    divider: tab.divider,
    /*
     * O ramo não recebe `info`: a contagem fica com o link de si mesma. No
     * botão ela seria o peso de um agrupador — um número que não corresponde ao
     * que o clique mostra (o clique aqui abre a lista, não abre uma aba).
     *
     * E `active` só vale quando NÃO há link de si mesma: com os dois, a barra
     * teria dois `aria-current="page"`, que é ambiguidade pura para quem navega
     * por voz.
     */
    active: !hasOwnContent && tab.id === options.activeTabId,
    children: [...self, ...children.map((child) => tabItem(child, 2, options))],
    'data-testid': `tab-branch-${tab.id}`,
  };
}

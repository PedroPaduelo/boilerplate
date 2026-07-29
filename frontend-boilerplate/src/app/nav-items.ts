import { hasAnyRole, hasPermission, type Permission, type Role } from '@/shared/lib/rbac';
import {
  CatalogIcon,
  ChartsIcon,
  ChatIcon,
  ConnectionsIcon,
  DashboardsIcon,
  HomeIcon,
  UsersIcon,
  type AppIcon,
} from '@/shared/ui/icons';

export interface NavItem {
  /** Path da rota. Também serve de chave de seleção (prefixo do pathname). */
  href: string;
  label: string;
  /**
   * Ícone REAL do sistema (`@/shared/ui/icons`): SVG 24×24 em `currentColor`,
   * o mesmo traçado do pacote `icones-auditoria` que a origem usa em
   * `layouts/nav-config-dashboard.tsx` (tabela do §6 do CONTRATO da sidebar).
   * Guardamos o COMPONENTE, não o elemento — quem instancia é a `AppSidebar`,
   * e assim este arquivo continua sendo `.ts` puro (dados, sem JSX).
   */
  icon: AppIcon;
  /** Permissão exigida para o item aparecer (espelha o RBAC do backend). */
  permission?: Permission;
  /** Papéis exigidos (alternativa à permissão). */
  roles?: Role[];
}

export interface NavItemGroup {
  /**
   * Rótulo da seção. A navegação o desenha em CAIXA ALTA e o transforma em
   * botão que colapsa o grupo — por isso ele é obrigatório aqui: um grupo sem
   * rótulo vira um bloco de itens soltos, que não é o que o menu principal quer.
   */
  subheader: string;
  items: NavItem[];
}

/**
 * Navegação principal do shell — agora em GRUPOS, o formato da origem
 * (`layouts/nav-config-dashboard.tsx`) e o que `@/shared/ui/nav-section` pede.
 *
 * A rota em si é declarada por cada feature em `features/<x>/routes.tsx`; aqui
 * fica apenas como ela aparece no menu. Cada item é filtrado por
 * papel/permissão — defesa em profundidade: o backend continua sendo a
 * autoridade e as rotas também passam pelo guarda `RequireRole`.
 *
 * POR QUE ESTES TRÊS GRUPOS (e nesta ordem)
 *
 *  1. **Visão geral** — onde se CONSOME o que já existe: Início (o resumo),
 *     Dashboards (o painel montado) e Gráficos (a peça avulsa). É o caminho que
 *     a pessoa percorre do panorama para o detalhe, e concentra as três telas
 *     que qualquer papel com `artifacts:view` enxerga.
 *  2. **Dados** — de ONDE o dado vem. Conexões vem antes de Catálogo porque a
 *     ordem é causal: primeiro se conecta a fonte, depois se navega o que foi
 *     mapeado dela. (A lista antiga trazia Catálogo antes por acidente de
 *     histórico, não por decisão.)
 *  3. **Gerenciamento** — o que exige poder ALÉM de olhar: Chat é a ferramenta
 *     que CRIA artefatos (`artifacts:manage`, não é um leitor) e Usuários é
 *     administração pura (`ADMIN`).
 *
 * O agrupamento também revela o RBAC em vez de escondê-lo: para um VIEWER o
 * grupo "Gerenciamento" some INTEIRO (nenhum dos dois itens sobrevive ao
 * filtro) e "Dados" fica só com Catálogo. É exatamente por isso que
 * `visibleNavGroups` descarta grupo vazio — ver o comentário lá embaixo.
 */
export const NAV_GROUPS: NavItemGroup[] = [
  {
    subheader: 'Visão geral',
    items: [
      { href: '/home', label: 'Início', icon: HomeIcon, permission: 'artifacts:view' },
      {
        href: '/dashboards',
        label: 'Dashboards',
        icon: DashboardsIcon,
        permission: 'artifacts:view',
      },
      {
        href: '/charts',
        label: 'Gráficos',
        icon: ChartsIcon,
        permission: 'artifacts:view',
      },
    ],
  },
  {
    subheader: 'Dados',
    items: [
      {
        href: '/connections',
        label: 'Conexões',
        icon: ConnectionsIcon,
        permission: 'connections:use',
      },
      {
        href: '/catalog',
        label: 'Catálogo',
        icon: CatalogIcon,
        permission: 'artifacts:view',
      },
    ],
  },
  {
    subheader: 'Gerenciamento',
    items: [
      { href: '/chat', label: 'Chat', icon: ChatIcon, permission: 'artifacts:manage' },
      { href: '/users', label: 'Usuários', icon: UsersIcon, roles: ['ADMIN'] },
    ],
  },
];

export function canSeeNavItem(item: NavItem, role: Role | null | undefined): boolean {
  if (item.roles && !hasAnyRole(role, item.roles)) return false;
  if (item.permission && !hasPermission(role, item.permission)) return false;
  return true;
}

/**
 * Os grupos que ESTE papel pode ver: filtra item a item e, depois, **descarta
 * o grupo que ficou sem nenhum**.
 *
 * O descarte não é detalhe de arrumação: o rótulo do grupo é um botão de
 * colapsar. Um grupo vazio deixaria na tela um "GERENCIAMENTO ▾" que anuncia
 * uma seção inexistente, abre e fecha o vazio, e sugere que a pessoa perdeu
 * permissão de algo que na verdade nunca esteve ali para ela.
 */
export function visibleNavGroups(role: Role | null | undefined): NavItemGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSeeNavItem(item, role)),
  })).filter((group) => group.items.length > 0);
}

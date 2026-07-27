/**
 * Vocabulário e MONTAGEM dos itens da paleta de comandos.
 *
 * São funções puras: recebem dados já carregados + os callbacks de navegação e
 * devolvem a lista de itens. Ficam fora do hook porque montar item não depende
 * de React — e assim cada seção pode ser testada sem renderizar a paleta.
 *
 * O `group` de cada item alimenta o agrupamento automático do `CommandPalette`
 * (`auxiliaryData.group`) — não montamos seções na mão.
 */
import {
  BarChart3,
  Blocks,
  Database,
  LayoutDashboard,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Users as UsersIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SearchableItem } from '@astryxdesign/core/Typeahead';

/** Limite de itens por seção — a paleta é para navegar rápido, não paginar. */
export const MAX_PER_SECTION = 6;

export const COMMAND_GROUPS = {
  actions: 'Ações',
  navigation: 'Ir para',
  dashboards: 'Dashboards',
  charts: 'Gráficos',
  connections: 'Conexões',
} as const;

export interface CommandActionData {
  /** Seção da paleta (agrupamento automático do DS). */
  group: string;
  icon: LucideIcon;
  /** Rótulo lateral discreto: status do artefato, banco da conexão… */
  hint?: string;
  /**
   * Termos extras de busca. Sem eles a paleta pontuaria só pelo rótulo — e
   * "chat" não acharia "Perguntar ao agente".
   */
  keywords: string[];
  run: () => void;
}

export type CommandAction = SearchableItem<CommandActionData>;

/** Artefato listável na paleta (dashboard ou gráfico). */
export interface CommandArtifact {
  id: string;
  title: string;
  status?: string;
}

/** Conexão listável na paleta. */
export interface CommandConnection {
  id: string;
  name: string;
  database?: string;
}

/** Permissões que decidem o que aparece. */
export interface CommandPermissions {
  canManage: boolean;
  canUseConnections: boolean;
  isAdmin: boolean;
}

/** O que cada item precisa disparar. */
export interface CommandHandlers {
  navigate: (href: string) => void;
  createDashboard: () => void;
  toggleColorMode: () => void;
}

function statusHint(status: string | undefined): string {
  return status === 'PUBLISHED' ? 'Publicado' : 'Rascunho';
}

/** Ações: o que o usuário FAZ (não para onde vai). */
export function buildActionItems(
  { canManage }: CommandPermissions,
  { navigate, createDashboard, toggleColorMode }: CommandHandlers,
  isDark: boolean,
): CommandAction[] {
  const items: CommandAction[] = [];

  if (canManage) {
    items.push({
      id: 'action:chat',
      label: 'Perguntar ao agente',
      auxiliaryData: {
        group: COMMAND_GROUPS.actions,
        icon: Sparkles,
        keywords: ['chat', 'ia', 'pergunta', 'consulta', 'agente'],
        run: () => navigate('/chat'),
      },
    });
    items.push({
      id: 'action:create-dashboard',
      label: 'Criar novo dashboard',
      auxiliaryData: {
        group: COMMAND_GROUPS.actions,
        icon: Plus,
        keywords: ['novo', 'painel', 'criar'],
        run: createDashboard,
      },
    });
  }

  items.push({
    id: 'action:toggle-theme',
    label: isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro',
    auxiliaryData: {
      group: COMMAND_GROUPS.actions,
      icon: isDark ? Sun : Moon,
      keywords: ['tema', 'aparência', 'claro', 'escuro', 'dark', 'light'],
      run: toggleColorMode,
    },
  });

  return items;
}

/** Navegação: as rotas do app que o papel do usuário alcança. */
export function buildNavigationItems(
  { canUseConnections, isAdmin }: CommandPermissions,
  { navigate }: CommandHandlers,
): CommandAction[] {
  const routes: Array<{
    href: string;
    label: string;
    icon: LucideIcon;
    isAllowed: boolean;
  }> = [
    { href: '/home', label: 'Visão geral', icon: LayoutDashboard, isAllowed: true },
    { href: '/dashboards', label: 'Dashboards', icon: LayoutDashboard, isAllowed: true },
    { href: '/charts', label: 'Gráficos', icon: BarChart3, isAllowed: true },
    { href: '/catalog', label: 'Catálogo de componentes', icon: Blocks, isAllowed: true },
    {
      href: '/connections',
      label: 'Conexões',
      icon: Database,
      isAllowed: canUseConnections,
    },
    { href: '/users', label: 'Usuários', icon: UsersIcon, isAllowed: isAdmin },
  ];

  return routes
    .filter((route) => route.isAllowed)
    .map((route) => ({
      id: `nav:${route.href}`,
      label: route.label,
      auxiliaryData: {
        group: COMMAND_GROUPS.navigation,
        icon: route.icon,
        keywords: [],
        run: () => navigate(route.href),
      },
    }));
}

/** Artefatos recentes: atalho direto para o item, com o status ao lado. */
export function buildArtifactItems(
  artifacts: CommandArtifact[],
  kind: 'dashboard' | 'chart',
  { navigate }: CommandHandlers,
): CommandAction[] {
  const isDashboard = kind === 'dashboard';

  return artifacts.slice(0, MAX_PER_SECTION).map((artifact) => ({
    id: `${kind}:${artifact.id}`,
    label: artifact.title,
    auxiliaryData: {
      group: isDashboard ? COMMAND_GROUPS.dashboards : COMMAND_GROUPS.charts,
      icon: isDashboard ? LayoutDashboard : BarChart3,
      hint: statusHint(artifact.status),
      keywords: [],
      run: () => navigate(`/${isDashboard ? 'dashboards' : 'charts'}/${artifact.id}`),
    },
  }));
}

/** Conexões: o banco vira a dica lateral, que é como o usuário as distingue. */
export function buildConnectionItems(
  connections: CommandConnection[],
  { navigate }: CommandHandlers,
): CommandAction[] {
  return connections.slice(0, MAX_PER_SECTION).map((connection) => ({
    id: `connection:${connection.id}`,
    label: connection.name,
    auxiliaryData: {
      group: COMMAND_GROUPS.connections,
      icon: Database,
      hint: connection.database,
      keywords: [],
      run: () => navigate(`/connections/${connection.id}`),
    },
  }));
}

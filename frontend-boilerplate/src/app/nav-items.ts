import {
  BarChart3,
  Blocks,
  Database,
  Home,
  LayoutDashboard,
  MessageSquare,
  Users as UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import { hasAnyRole, hasPermission, type Permission, type Role } from '@/shared/lib/rbac';

export interface NavItem {
  /** Path da rota. Também serve de chave de seleção (prefixo do pathname). */
  href: string;
  label: string;
  icon: LucideIcon;
  /** Permissão exigida para o item aparecer (espelha o RBAC do backend). */
  permission?: Permission;
  /** Papéis exigidos (alternativa à permissão). */
  roles?: Role[];
}

/**
 * Navegação principal do shell.
 *
 * A rota em si é declarada por cada feature em `features/<x>/routes.tsx`; aqui
 * fica apenas como ela aparece no menu. Cada item é filtrado por papel/permissão
 * — defesa em profundidade: o backend continua sendo a autoridade e as rotas
 * também passam pelo guarda `RequireRole`.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/home', label: 'Início', icon: Home, permission: 'artifacts:view' },
  {
    href: '/dashboards',
    label: 'Dashboards',
    icon: LayoutDashboard,
    permission: 'artifacts:view',
  },
  { href: '/charts', label: 'Gráficos', icon: BarChart3, permission: 'artifacts:view' },
  { href: '/catalog', label: 'Catálogo', icon: Blocks, permission: 'artifacts:view' },
  {
    href: '/connections',
    label: 'Conexões',
    icon: Database,
    permission: 'connections:use',
  },
  { href: '/chat', label: 'Chat', icon: MessageSquare, permission: 'artifacts:manage' },
  { href: '/users', label: 'Usuários', icon: UsersIcon, roles: ['ADMIN'] },
];

/** Título exibido na topbar, derivado do item de navegação ativo. */
export const FALLBACK_TITLE = 'Painel';

export function canSeeNavItem(item: NavItem, role: Role | null | undefined): boolean {
  if (item.roles && !hasAnyRole(role, item.roles)) return false;
  if (item.permission && !hasPermission(role, item.permission)) return false;
  return true;
}

/** Item ativo = o de maior prefixo que casa com o pathname atual. */
export function findActiveNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname.startsWith(item.href));
}

/**
 * Contrato de dados da navegação lateral própria.
 *
 * A forma dos dados é a da ORIGEM (`layouts/nav-config-dashboard.tsx`): uma
 * lista de GRUPOS, cada um com um rótulo opcional em caixa alta e os itens do
 * grupo; item com `children` vira ramo que abre/fecha. Quem calcula `active` é
 * o consumidor — ele é quem conhece o roteador (a nav não importa `useLocation`
 * de propósito: assim ela serve tanto para rota quanto para `?tab=`).
 *
 * Ver `docs/design-system/sidebar/CONTRATO.md` §3.
 */
import type { MouseEvent, ReactNode } from 'react';

export interface NavItemData {
  /** Chave estável. Default: `href ?? title`. */
  key?: string;
  title: string;
  href?: string;
  onClick?: (event: MouseEvent) => void;
  /** SVG 24×24 em `currentColor` (ver `@/shared/ui/icons`). */
  icon?: ReactNode;
  /** Legenda (2ª linha, 10,5px). O texto completo aparece na dica do hover. */
  caption?: string;
  /** Badge textual à direita. */
  info?: ReactNode;
  disabled?: boolean;
  /** Rota atual. Quem calcula é o consumidor (ele conhece o roteador). */
  active?: boolean;
  children?: NavItemData[];
  /** Dica no hover (estado expandido). NÃO vira 2ª linha — para isso use `caption`. */
  description?: string;
  /** Divisor ANTES do item, dentro do mesmo grupo. */
  divider?: boolean;
  'data-testid'?: string;
}

export interface NavGroup {
  /** Rótulo do grupo (renderizado em CAIXA ALTA). Sem ele, não há subheader. */
  subheader?: string;
  items: NavItemData[];
  /** Começa colapsado. Default: `false`. */
  defaultCollapsed?: boolean;
}

export interface NavSectionProps {
  groups: NavGroup[];
  /** Forma mini (88px): ícone em cima, rótulo de 8,75px embaixo. */
  isMini?: boolean;
  'aria-label': string;
  'data-testid'?: string;
}

export interface NavSidebarProps {
  groups: NavGroup[];
  'aria-label': string;
  /** Estado controlado da forma mini. */
  isCollapsed?: boolean;
  onCollapsedChange?: (isCollapsed: boolean) => void;
  /** Botão redondo flutuante na borda. Default: `true` quando há `onCollapsedChange`. */
  hasToggle?: boolean;
  toggleLabel?: string;
  /** Conteúdo fixo acima da lista (ex.: campo de busca). Oculto na forma mini. */
  topContent?: ReactNode;
  /** Rodapé fixo (ex.: menu do usuário). */
  footer?: ReactNode;
  /** Conteúdo alternativo quando não há nenhum item (ex.: "nada encontrado"). */
  emptyContent?: ReactNode;
  'data-testid'?: string;
}

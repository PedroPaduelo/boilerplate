/**
 * `@/shared/ui/nav-section` — a navegação lateral do AuditorIA.
 *
 * Componente PRÓPRIO (permitido pelo contrato de migração para "primitivos de
 * apresentação sem equivalente no Astryx"), porque o `SideNav` do design system
 * não tem — e não expõe prop para — legenda de 2ª linha, cotovelo/linha de
 * aninhamento e o bloco de 56px com rótulo de 8,75px da forma recolhida. Os
 * detalhes e a medição estão em `docs/design-system/sidebar/CONTRATO.md` §1.
 *
 * O que CONTINUA do design system: os tokens (nenhum valor é digitado aqui),
 * o `AppShell` (frame, gaveta, skip-link), o `LinkProvider`/`RouterLinkAdapter`
 * (navegação client-side) e o `SideNavRenderContext` (para saber se estamos na
 * coluna ou na gaveta).
 *
 * Uso típico:
 *
 * ```tsx
 * <NavSidebar
 *   aria-label="Navegação principal"
 *   groups={[{ subheader: 'Visão geral', items }]}
 *   isCollapsed={isCollapsed}
 *   onCollapsedChange={setIsCollapsed}
 *   footer={<UserMenu />}
 * />
 * ```
 *
 * O estilo inteiro vive em `nav-section.css`, importado por `src/app/index.css`
 * na camada `components` (mesmo tratamento de `shared/ui/charts/chart-theme.css`).
 */
export { NavSection } from './nav-section';
export { NavSidebar } from './nav-sidebar';
export type { NavGroup, NavItemData, NavSectionProps, NavSidebarProps } from './types';

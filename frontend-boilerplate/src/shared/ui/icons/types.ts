import type { ComponentType, SVGProps } from 'react';

/**
 * Um ícone da aplicação: componente React que renderiza um `<svg>` e aceita
 * qualquer atributo de SVG.
 *
 * É deliberadamente o MESMO formato que o `IconType` do Astryx
 * (`ComponentType<SVGProps<SVGSVGElement>>`), para que qualquer ícone daqui
 * possa ser passado direto para `<Icon icon={…} />`, `SideNavItem.icon` e
 * demais slots do design system sem adaptador no meio.
 *
 * O tipo é declarado aqui, e não importado do Astryx, para que `shared/ui` não
 * dependa da biblioteca de componentes para descrever um dado tão básico —
 * a compatibilidade estrutural do TypeScript já garante o encaixe.
 */
export type AppIcon = ComponentType<SVGProps<SVGSVGElement>>;

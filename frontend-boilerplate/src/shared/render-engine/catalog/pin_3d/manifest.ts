/**
 * Manifesto do bloco `pin_3d` (layout/decorativo) — card com efeito de
 * inclinação 3D e "pin" animado no hover.
 *
 * O palco 3D é um COMPONENTE PRÓPRIO do bloco (`./pin-3d`): o Astryx trata
 * profundidade só com elevação plana. Feixe e anéis pintam com a rampa de
 * data-viz e `--color-accent`; o efeito acende também no foco de teclado e o
 * pulso contínuo desliga com `prefers-reduced-motion`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'pin_3d',
  kind: 'layout',
  name: '3D Pin',
  description: 'Card com efeito de inclinação 3D e "pin" animado no hover.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      pinLabel: { type: 'string' },
      href: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
    },
  },
  defaultProps: {
    pinLabel: 'relatorios.gov.br',
    href: '#',
    title: 'Relatório de Arrecadação',
    description: 'Receita consolidada por tributo, com evolução mensal e metas.',
  },
  version: '1.0.0',
} satisfies BlockManifest;

/**
 * Manifesto do bloco `pin_3d` (layout/decorativo) — card com efeito de
 * inclinação 3D e "pin" animado no hover. Usa o Vitrine `PinContainer`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'pin_3d',
  kind: 'layout',
  name: '3D Pin',
  description: 'Card com efeito de inclinação 3D e "pin" animado no hover.',
  source: 'vitrine:3d-pin',
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

/**
 * Manifesto do bloco `tooltip_card` (layout) — tooltip rico que segue o cursor.
 * Usa o Vitrine `TooltipCard`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'tooltip_card',
  kind: 'layout',
  name: 'Tooltip Card',
  description: 'Tooltip rico que segue o cursor e exibe um card de conteúdo.',
  source: 'vitrine:tooltip-card',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      triggerLabel: { type: 'string' },
      content: { type: 'string' },
    },
  },
  defaultProps: {
    triggerLabel: 'Detalhes do contribuinte',
    content: 'CPF/CNPJ, situação cadastral e débitos em aberto do contribuinte selecionado.',
  },
  version: '1.0.0',
} satisfies BlockManifest;

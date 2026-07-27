/**
 * Manifesto do bloco `tooltip_card` (layout) — dica ancorada ao gatilho.
 * Renderiza com o `Tooltip` do Astryx (hover E foco por teclado).
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'tooltip_card',
  kind: 'layout',
  name: 'Tooltip Card',
  description: 'Tooltip ancorado ao gatilho, exibido no hover ou no foco por teclado.',
  source: 'astryx:tooltip',
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
    content:
      'CPF/CNPJ, situação cadastral e débitos em aberto do contribuinte selecionado.',
  },
  version: '1.0.0',
} satisfies BlockManifest;

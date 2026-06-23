/**
 * Manifesto do bloco `collapsible_block` (layout) — seção com cabeçalho
 * clicável que expande/recolhe. Usa o Vitrine `CollapsibleSection`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'collapsible_block',
  kind: 'layout',
  name: 'Seção Colapsável',
  description: 'Seção com cabeçalho clicável que expande/recolhe o conteúdo.',
  source: 'vitrine:collapsible-section',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      title: { type: 'string' },
      body: { type: 'string' },
      defaultOpen: { type: 'boolean' },
    },
  },
  defaultProps: {
    title: 'Detalhes da apuração',
    body: 'A consulta considera os lançamentos com vencimento dentro do período selecionado.',
    defaultOpen: true,
  },
  version: '1.0.0',
} satisfies BlockManifest;

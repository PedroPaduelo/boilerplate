/**
 * Manifesto do bloco `sheet` (layout) — botão que abre um painel deslizante
 * lateral. Usa o Vitrine `Sheet`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'sheet',
  kind: 'layout',
  name: 'Sheet (painel lateral)',
  description: 'Botão que abre um painel deslizante lateral com título e descrição.',
  source: 'vitrine:sheet',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      triggerLabel: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      side: { type: 'string', enum: ['top', 'right', 'bottom', 'left'] },
    },
  },
  defaultProps: {
    triggerLabel: 'Abrir painel',
    title: 'Detalhes do indicador',
    description: 'Informações complementares sobre a métrica selecionada.',
    side: 'right',
  },
  version: '1.0.0',
} satisfies BlockManifest;

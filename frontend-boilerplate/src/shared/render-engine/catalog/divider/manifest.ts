/**
 * Manifesto do bloco `divider` (layout) — linha divisória com rótulo central
 * opcional. Renderiza com o `Divider` do Astryx.
 *
 * `label` NÃO tem default de fábrica: o manifesto trazia
 * `label: 'Resumo do período'` e, como o `BlockRenderer` mescla `defaultProps`
 * em TODA renderização, todo divisor do produto aparecia com esse texto no meio
 * da linha — inclusive os que o autor quis limpos. Ausência precisa significar
 * "sem rótulo", então não há default a declarar.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'divider',
  kind: 'layout',
  name: 'Divisor',
  description:
    'Linha divisória com rótulo central OPCIONAL — separa seções de um relatório. Sem `label`, desenha só a linha.',
  source: 'astryx:divider',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      label: {
        type: 'string',
        description: 'Rótulo central. Omita para uma linha limpa — não há texto padrão.',
      },
      orientation: {
        type: 'string',
        enum: ['horizontal', 'vertical'],
        default: 'horizontal',
        description:
          'Direção da linha: `horizontal` separa linhas empilhadas; `vertical` separa colunas lado a lado.',
      },
      spacing: {
        type: 'string',
        enum: ['sm', 'md', 'lg'],
        default: 'md',
        description:
          'Respiro em volta da linha: sm (compacto), md (default), lg (separa blocos distantes).',
      },
    },
  },
  defaultProps: {
    orientation: 'horizontal',
    spacing: 'md',
  },
  version: '2.0.0',
} satisfies BlockManifest;

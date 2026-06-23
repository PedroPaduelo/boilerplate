/**
 * Manifesto do bloco `progress_circle` (shape 'scalar') — anel de progresso. Usa
 * o Vitrine `ProgressCircleTremor`. FORMATO DE GRÁFICO: vive na aba "Gráficos" e
 * recebe a moldura `ChartWidget` (título no header).
 *
 * Prop `accent` (canônico): string livre resolvida por `resolveAccentForStroke`
 * no component.tsx (enum DS + classe Tailwind `stroke-…` + cor CSS crua). Quando
 * preenchido, SOBRESCREVE o `variant` na cor do arco.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'progress_circle',
  kind: 'chart',
  name: 'Anel de Progresso',
  description: 'Progresso circular de um valor sobre uma escala (percentual no centro).',
  source: 'vitrine:progress-circle-tremor',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      max: {
        type: 'number',
        default: 100,
        description: 'Valor máximo da escala (o 100% do anel). Default 100 — nesse caso o `value` já É um percentual. Com max ≠ 100, o anel mostra value/max e o tooltip explicita "X de Y".',
      },
      variant: {
        type: 'string',
        enum: ['default', 'neutral', 'warning', 'error', 'success'],
        default: 'default',
        description: 'Tema de cor do anel (paleta semântica): default (azul), neutral (cinza), warning (amarelo), error (vermelho), success (verde). É IGNORADO quando `accent` está preenchido (accent sobrescreve o variant).',
      },
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        description: 'Cor custom do arco. Quando preenchida, SOBRESCREVE o `variant`. Aceita enum DS (chart-1..5, primary), classe Tailwind de stroke (stroke-purple-500), ou cor CSS crua (#40E0D0, rgb(), linear-gradient(), var(--chart-1)). Vazio = usa o `variant`.',
      },
    },
  },
  dataContract: {
    shape: 'scalar',
    spec: {
      value: { type: 'number', required: true },
      label: { type: 'string', required: false },
    },
    example: { value: 75, label: 'Conclusão' },
  },
  defaultProps: { max: 100, variant: 'default' },
  version: '1.0.0',
} satisfies BlockManifest;

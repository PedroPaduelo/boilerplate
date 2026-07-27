/**
 * Manifesto do bloco `progress_circle` (shape 'scalar') — anel de progresso.
 * Vive na aba "Gráficos" e recebe a moldura do bloco (título no header).
 *
 * Nomes, tipos e defaults das props são CONTRATO com o backend/agente e seguem
 * iguais. O anel é pintado por TOM semântico: `variant` mapeia direto e
 * `accent`, quando preenchido, usa o tom de destaque.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'progress_circle',
  kind: 'chart',
  name: 'Anel de Progresso',
  description: 'Progresso circular de um valor sobre uma escala (percentual no centro).',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      max: {
        type: 'number',
        default: 100,
        description:
          'Valor máximo da escala (o 100% do anel). Default 100 — nesse caso o `value` já É um percentual. Com max diferente de 100, o anel mostra value/max e a leitura explicita "X de Y".',
      },
      variant: {
        type: 'string',
        enum: ['default', 'neutral', 'warning', 'error', 'success'],
        default: 'default',
        description:
          'Tom semântico do anel: default = destaque, neutral = neutro, warning = atenção, error = negativo, success = positivo. É IGNORADO quando `accent` está preenchido.',
      },
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        description:
          'Cor do arco. Quando preenchida, SOBRESCREVE o `variant` e o anel usa o tom de destaque do tema — o anel é pintado por tom semântico, não por cor arbitrária. Valores antigos continuam aceitos. Vazio = usa o `variant`.',
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

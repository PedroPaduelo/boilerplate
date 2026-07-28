/**
 * Manifesto do bloco `progress_bar` (shape 'scalar') — barra de progresso.
 * Bom para metas e percentuais (valor sobre `max`).
 *
 * Nomes, tipos e defaults das props são CONTRATO com o backend/agente e seguem
 * IGUAIS. O que mudou na repaginação foi só o desenho: a barra é a BARRA
 * HORIZONTAL da referência (§8) — trilha a 16 %, raio 2 px, traço 0 —, então a
 * origem do componente deixou de ser o `ProgressBar` do Astryx e passou a ser
 * a marca de dado própria do catálogo (`ChartBarTrack`).
 *
 * `variant` continua escolhendo a cor semântica e `accent`, quando preenchido,
 * continua vencendo o `variant` — agora com a cor de série do tema de gráfico.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'progress_bar',
  kind: 'chart',
  name: 'Barra de Progresso',
  description:
    'Progresso de um valor sobre uma escala (ex.: 68 de 100). Ótimo para metas.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      max: {
        type: 'number',
        default: 100,
        description:
          'Valor máximo da escala (denominador do %). Ex.: max=100 → value=68 vira 68%. Com max diferente de 100, a leitura passa a ser "valor de total".',
      },
      variant: {
        type: 'string',
        enum: ['default', 'neutral', 'warning', 'error', 'success'],
        default: 'default',
        description:
          'Cor SEMÂNTICA do preenchimento: default = verde da referência, neutral = neutra, warning = atenção, error = erro, success = sucesso. É SOBRESCRITA por `accent` quando este vier preenchido.',
      },
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        description:
          'Cor de destaque. Quando preenchida, SOBRESCREVE o `variant` e a barra é pintada com a cor de série correspondente do tema de gráfico. Valores antigos continuam aceitos.',
      },
      showValue: {
        type: 'boolean',
        default: true,
        description: 'Mostra (default) ou esconde a leitura do valor ao lado do rótulo.',
      },
    },
  },
  dataContract: {
    shape: 'scalar',
    spec: {
      value: { type: 'number', required: true },
      label: { type: 'string', required: false },
    },
    example: { value: 68, label: 'Uso da cota' },
  },
  defaultProps: { max: 100, variant: 'default', showValue: true },
  version: '1.0.0',
} satisfies BlockManifest;

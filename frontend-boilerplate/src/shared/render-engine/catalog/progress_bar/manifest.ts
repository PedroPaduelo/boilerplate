/**
 * Manifesto do bloco `progress_bar` (shape 'scalar') — barra de progresso. Usa o
 * Vitrine `ProgressBarTremor`. Bom para metas/percentuais (valor sobre `max`).
 *
 * Agora vive na aba "Gráficos" (kind=chart) → recebe a moldura `ChartWidget`.
 *
 * Props de COR (canônico): `variant` = cores SEMÂNTICAS; `accent` = cor custom
 * (enum DS + classe Tailwind + cor CSS, resolvido por `resolveAccent` no
 * component.tsx). REGRA: `accent`, quando preenchido, SOBRESCREVE o `variant`.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'progress_bar',
  kind: 'chart',
  name: 'Barra de Progresso',
  description: 'Progresso de um valor sobre uma escala (ex.: 68 de 100). Ótimo para metas.',
  source: 'vitrine:progress-bar-tremor',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      max: {
        type: 'number',
        default: 100,
        description: 'Valor máximo da escala (denominador do %). Ex.: max=100 → value=68 vira 68%.',
      },
      variant: {
        type: 'string',
        enum: ['default', 'neutral', 'warning', 'error', 'success'],
        default: 'default',
        description: 'Cor SEMÂNTICA do preenchimento + trilho (default=azul, neutral=cinza, warning=amarelo, error=vermelho, success=verde). É SOBRESCRITO por `accent` quando este vier preenchido.',
      },
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        description: 'Cor CUSTOM do preenchimento. Quando preenchida, SOBRESCREVE o `variant`. Aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500) ou cor CSS crua (#40E0D0, rgb(), linear-gradient(), var(--chart-1)).',
      },
      showValue: {
        type: 'boolean',
        default: true,
        description: 'Mostra (default) ou esconde o "%" exibido ao lado do rótulo do dado.',
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

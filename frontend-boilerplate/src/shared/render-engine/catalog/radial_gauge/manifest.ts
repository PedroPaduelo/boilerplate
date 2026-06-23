/**
 * Manifesto do bloco `radial_gauge` (shape 'scalar') — medidor radial. Usa o
 * Vitrine `RadialGauge`. Ideal para metas/percentuais (valor sobre uma escala).
 *
 * Formato de GRÁFICO: o bloco recebe a moldura `ChartWidget` (título no header).
 *
 * Prop de COR: `accent` aceita enum DS + classe Tailwind + cor CSS (resolvido
 * em runtime por `resolveAccent` no component.tsx e aplicado ao ARCO do
 * medidor — stroke, número central e drop-shadow).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'radial_gauge',
  kind: 'chart',
  name: 'Medidor Radial',
  description: 'Medidor (gauge) de um valor sobre uma escala — ótimo para metas e percentuais.',
  source: 'vitrine:radial-gauge',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      max: {
        type: 'number',
        default: 100,
        description: 'Valor MÁXIMO da escala do medidor (fim do arco). Ex.: 100 para percentuais. O `value` dos dados é posicionado entre `min` e `max`.',
      },
      min: {
        type: 'number',
        default: 0,
        description: 'Valor MÍNIMO da escala do medidor (início do arco). Default 0. Define o piso da escala junto com `max`.',
      },
      unit: {
        type: 'string',
        description: 'Unidade exibida ao lado do número no miolo (ex.: "%", "km", "pts"). Se ausente, usa a `unit` dos dados (data.unit).',
      },
      // COR — string livre; resolveAccent() decide se vira classe Tailwind
      // (chart-N, primary, bg-purple-500) ou cor CSS (#hex, rgb(), gradient).
      // O component converte para uma COR CSS aplicada ao arco do medidor.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description: 'Cor do ARCO do medidor (stroke + número central + brilho). Aceita enum DS (chart-1..5, primary), classe Tailwind (bg-purple-500), ou cor CSS (#40E0D0, rgb(), linear-gradient(), var(--chart-1)).',
      },
    },
  },
  dataContract: {
    shape: 'scalar',
    spec: {
      value: { type: 'number', required: true },
      label: { type: 'string', required: false },
      unit: { type: 'string', required: false },
    },
    example: { value: 72, label: 'Cobertura', unit: '%' },
  },
  defaultProps: { max: 100, min: 0, accent: 'chart-1' },
  version: '1.0.0',
} satisfies BlockManifest;

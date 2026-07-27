/**
 * Manifesto do bloco `donut` — distribuição de um total entre categorias
 * (shape 'categorical'). Alinhado a @dashboards/contracts.
 *
 * Nomes, tipos e defaults das props são CONTRATO com o backend/agente e seguem
 * iguais. A prop de cor (`accent`) é resolvida pelo componente para um token de
 * dado do design system.
 *
 * `valueFormat` continua um ENUM FECHADO com os 5 formatos canônicos, cada um
 * casando 1:1 com um helper de `format.ts` via `formatValueByEnum()`.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';
import { VALUE_FORMATS } from '@/shared/lib/format';

export const manifest = {
  type: 'donut',
  kind: 'chart',
  name: 'Donut',
  description: 'Distribuição de um total entre categorias (label + value).',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Legenda com valor e participação de cada categoria.
      showLegend: {
        type: 'boolean',
        default: true,
        description:
          'Exibe a legenda ao lado do anel: uma linha por categoria com marca de cor, valor absoluto e participação no total. É ela que dá a leitura numérica do gráfico.',
      },
      // Rótulo exibido sob o total, no vão central do anel.
      centerLabel: {
        type: 'string',
        description:
          'Rótulo exibido no centro do anel, sob o valor total (soma das fatias). Default: "Total".',
      },
      // Modo de paleta.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'single',
        description:
          'Modo de paleta: "single" (default) = todas as fatias na cor de `accent` (a leitura fica por conta da legenda); "multi" e "none" = ciclam a paleta categórica do design system, uma cor por categoria — use quando a cor precisar distinguir as fatias.',
      },
      // COR — enum do catálogo; o componente resolve para token de dado do DS.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description:
          'Cor das fatias em palette="single". O valor é resolvido para uma cor de dado do design system (chart-1..5 e primary mapeiam para as cores categóricas, na mesma ordem da paleta). Em "multi" é IGNORADO. Valores fora do enum são aceitos por compatibilidade e caem na paleta quando não descrevem uma cor do sistema.',
      },
      // valueFormat — ENUM FECHADO, default 'compactBRL'.
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'compactBRL',
        description:
          'Formato PT-BR do valor exibido no centro do anel (total) e na legenda. ENUM FECHADO (sem input livre).',
        oneOf: [
          {
            const: 'BRL',
            description: 'formatBRL — moeda BRL completa (ex.: "R$ 2.609.946.157,73").',
          },
          {
            const: 'compactBRL',
            description:
              'formatCompactBRL — moeda BRL compacta (ex.: "R$ 2,61 bi"). DEFAULT.',
          },
          {
            const: 'number',
            description: 'formatNumberBR — número PT-BR com milhar (ex.: "1.234.567,8").',
          },
          {
            const: 'compactNumber',
            description: 'formatCompactNumberBR — número compacto (ex.: "2,61 bi").',
          },
          {
            const: 'percent',
            description:
              'formatPercentBR — percentual a partir de FRAÇÃO (ex.: 0.125 → "12,5%").',
          },
        ],
      },
    },
  },
  dataContract: {
    shape: 'categorical',
    spec: {
      label: { type: 'category', required: true },
      value: { type: 'number', required: true },
    },
    example: [
      { label: 'Quitado', value: 62 },
      { label: 'Em aberto', value: 38 },
    ],
  },
  defaultProps: {
    showLegend: true,
    palette: 'single',
    accent: 'chart-1',
    valueFormat: 'compactBRL',
  },
  version: '1.0.0',
} satisfies BlockManifest;

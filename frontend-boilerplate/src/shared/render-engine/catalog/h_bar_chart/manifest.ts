/**
 * Manifesto do bloco `h_bar_chart` (shape 'series', x categórico) — barras
 * HORIZONTAIS. Bom para comparar categorias com rótulos longos.
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
  type: 'h_bar_chart',
  kind: 'chart',
  name: 'Barras Horizontais',
  description:
    'Compara valores entre categorias em barras horizontais (rótulos longos cabem melhor).',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Modo de paleta.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'single',
        description:
          'Modo de paleta: "single" (default) = todas as barras na cor de `accent`; "multi" = cicla a paleta categórica do design system, uma cor por categoria; "none" = deixa a cor padrão da paleta.',
      },
      // COR — enum do catálogo; o componente resolve para token de dado do DS.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description:
          'Cor das barras em palette="single". O valor é resolvido para uma cor de dado do design system (chart-1..5 e primary mapeiam para as cores categóricas, na mesma ordem da paleta). Em "multi" é IGNORADO. Valores fora do enum são aceitos por compatibilidade e caem na paleta quando não descrevem uma cor do sistema.',
      },
      // valueFormat — ENUM FECHADO, default 'compactBRL'.
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'compactBRL',
        description:
          'Formato PT-BR do valor exibido no eixo e no tooltip. ENUM FECHADO (sem input livre).',
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
    shape: 'series',
    spec: {
      x: { type: 'category', required: true },
      y: { type: 'number', required: true },
    },
    example: [
      { x: 'Centro', y: 1200 },
      { x: 'Norte', y: 980 },
    ],
  },
  defaultProps: { palette: 'single', accent: 'chart-1', valueFormat: 'compactBRL' },
  minColumns: 1,
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;

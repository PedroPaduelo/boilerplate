/**
 * Manifesto do bloco `line_chart` — série temporal (shape 'series', x temporal).
 * Alinhado a @dashboards/contracts.
 *
 * Nomes e tipos das props são CONTRATO com o backend/agente: seguem iguais. A
 * prop de cor (`accent`) continua aceitando os valores antigos, mas o
 * componente a resolve para um token de dado do design system.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'line_chart',
  kind: 'chart',
  name: 'Gráfico de Linhas',
  description: 'Série temporal: evolução de um valor ao longo do tempo.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Suaviza a curva entre pontos.
      smooth: {
        type: 'boolean',
        description:
          'Se true, desenha as linhas como curvas suaves; se false, segmentos retos entre os pontos.',
      },
      // Preenche a área abaixo de cada linha (além do traço).
      area: {
        type: 'boolean',
        default: true,
        description:
          'Se true, preenche a área abaixo de cada linha, bem discreta, além do traço.',
      },
      // Modo de paleta — o gráfico aceita multi-série nativamente.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'multi',
        description:
          'Modo de paleta: "multi" (default) e "none" ciclam a paleta categórica do design system, uma cor por série; "single" fixa a cor de `accent` em todas as linhas.',
      },
      // COR — enum do catálogo; o componente resolve para token de dado do DS.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description:
          'Cor base da(s) série(s), usada quando palette="single". O valor é resolvido para uma cor de dado do design system (chart-1..5 e primary mapeiam para as cores categóricas, na mesma ordem da paleta). Valores fora do enum são aceitos por compatibilidade e, quando não descrevem uma cor do sistema, caem na paleta padrão.',
      },
    },
  },
  dataContract: {
    shape: 'series',
    spec: {
      x: { type: 'temporal', required: true },
      y: { type: 'number', required: true },
      series: { type: 'category', required: false },
    },
    example: [
      { x: '2026-01', y: 12 },
      { x: '2026-02', y: 18 },
    ],
  },
  defaultProps: { smooth: true, area: true, palette: 'multi', accent: 'chart-1' },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;

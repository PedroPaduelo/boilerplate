/**
 * Manifesto do bloco `scatter_chart` (shape 'series', x/y numéricos) —
 * dispersão. O campo `series` separa as categorias (cores).
 *
 * Nomes, tipos e defaults das props são CONTRATO com o backend/agente e seguem
 * iguais. A cor de um gráfico de dispersão é a IDENTIDADE do grupo, então ela
 * sai sempre da paleta categórica do design system.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'scatter_chart',
  kind: 'chart',
  name: 'Dispersão (scatter)',
  description:
    'Correlação entre duas variáveis numéricas (x × y); `series` colore por categoria.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Legenda categoria → cor.
      showLegend: {
        type: 'boolean',
        default: true,
        description:
          'Exibe a legenda (uma marca de cor por categoria + rótulo) abaixo da plotagem.',
      },
      // Linhas de grade.
      showGridLines: {
        type: 'boolean',
        default: true,
        description: 'Exibe as linhas de grade horizontais e verticais.',
      },
      // Modo de paleta.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'multi',
        description:
          'Modo de paleta: "multi" (default) e "none" ciclam a paleta categórica do design system, uma cor por categoria; "single" junta todos os pontos numa série só — uma cor, sem distinção de grupo.',
      },
      // COR — aceita por compatibilidade; a dispersão colore por categoria.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description:
          'Mantida por compatibilidade de contrato: numa dispersão a cor identifica a CATEGORIA, então ela vem sempre da paleta de dados do design system, na ordem dos grupos. Para uma cor só, use palette="single".',
      },
    },
  },
  dataContract: {
    shape: 'series',
    spec: {
      x: { type: 'number', required: true },
      y: { type: 'number', required: true },
      series: { type: 'category', required: false },
    },
    example: [
      { x: 12, y: 40, series: 'Zona A' },
      { x: 28, y: 55, series: 'Zona B' },
    ],
  },
  defaultProps: {
    showLegend: true,
    showGridLines: true,
    palette: 'multi',
    accent: 'chart-1',
  },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;

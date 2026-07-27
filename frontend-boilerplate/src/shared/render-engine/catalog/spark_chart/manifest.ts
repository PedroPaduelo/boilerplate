/**
 * Manifesto do bloco `spark_chart` (shape 'series') — minigráfico de tendência
 * (sparkline), sem eixos. Consome só os valores `y`.
 *
 * Nomes, tipos e defaults das props são CONTRATO com o backend/agente e seguem
 * iguais. A prop de cor (`accent`) é resolvida pelo componente para um token de
 * dado do design system e pinta a SÉRIE (traço/preenchimento), nunca o fundo.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'spark_chart',
  kind: 'chart',
  name: 'Sparkline',
  description: 'Minigráfico de tendência (sem eixos) — ótimo ao lado de um KPI.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Forma do minigráfico.
      type: {
        type: 'string',
        enum: ['area', 'bar', 'line'],
        default: 'area',
        description:
          'Forma do minigráfico: "area" (default, linha com preenchimento), "bar" (colunas) ou "line" (só a linha).',
      },
      // Curva usada em area/line.
      curveType: {
        type: 'string',
        enum: ['linear', 'monotone', 'step'],
        default: 'monotone',
        description:
          'Curva usada em type="area" e type="line": "monotone" (default) suaviza a linha; "linear" e "step" desenham segmentos retos entre os pontos.',
      },
      // Modo de paleta.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'single',
        description:
          'Modo de paleta: "single" (default) e "none" usam a cor de `accent`; "multi" deixa a primeira cor da paleta do design system — num gráfico de série única a cor não carrega informação, então não há o que ciclar.',
      },
      // COR — enum do catálogo; o componente resolve para token de dado do DS.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description:
          'Cor da SÉRIE (traço e preenchimento; nunca o fundo). O valor é resolvido para uma cor de dado do design system (chart-1..5 e primary mapeiam para as cores categóricas, na mesma ordem da paleta). Valores fora do enum são aceitos por compatibilidade e caem na paleta quando não descrevem uma cor do sistema.',
      },
    },
  },
  dataContract: {
    shape: 'series',
    spec: {
      x: { type: 'category', required: false },
      y: { type: 'number', required: true },
    },
    example: [
      { x: '1', y: 5 },
      { x: '2', y: 8 },
    ],
  },
  defaultProps: {
    type: 'area',
    curveType: 'monotone',
    palette: 'single',
    accent: 'chart-1',
  },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;

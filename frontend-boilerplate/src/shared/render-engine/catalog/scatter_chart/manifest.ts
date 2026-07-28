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
      // Modo de paleta. O valor "none" foi REMOVIDO na 1.1.0: medido na
      // auditoria de inércia, desenhava igual a "multi". Painéis salvos com
      // "none" continuam funcionando (caem no modo multicolorido).
      palette: {
        type: 'string',
        enum: ['single', 'multi'],
        default: 'multi',
        description:
          'Modo de paleta: "multi" (default) cicla a paleta categórica do design system, uma cor por categoria; "single" junta todos os pontos numa série só — uma cor, sem distinção de grupo (a legenda passa a ter uma entrada).',
      },
      // COR — enum do catálogo; o componente resolve para token de dado do DS.
      // SEM `default`: o BlockRenderer mescla `defaultProps` em toda
      // renderização e `accent` VENCE a paleta, então um default de fábrica
      // pintaria TODA dispersão de uma cor só, apagando a distinção de grupos
      // que é a razão de existir deste tipo.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        description:
          'Cor de TODOS os pontos. Declarar `accent` é pedir cor única e vence o modo de paleta — os grupos deixam de ser distinguíveis pela cor, então use apenas quando a dispersão tiver uma categoria só. OMITA (o padrão) para que cada categoria receba a próxima cor da paleta de dados do design system, que é o que identifica os grupos.',
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
  // `accent` NÃO tem default (ver a nota no schema).
  defaultProps: {
    showLegend: true,
    showGridLines: true,
    palette: 'multi',
  },
  maxRows: 5000,
  version: '1.1.0',
} satisfies BlockManifest;

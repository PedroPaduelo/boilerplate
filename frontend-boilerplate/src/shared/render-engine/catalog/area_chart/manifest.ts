/**
 * Manifesto do bloco `area_chart` (shape 'series', x temporal) — série temporal
 * preenchida, com suporte a múltiplas séries (campo `series`).
 *
 * Nomes e tipos das props são CONTRATO com o backend/agente: continuam iguais.
 * O que mudou foi a semântica de COR — o componente traduz o valor recebido em
 * `accent` para um token de dado do design system; valores antigos continuam
 * aceitos, mas quem manda no desenho é o token.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'area_chart',
  kind: 'chart',
  name: 'Gráfico de Área',
  description:
    'Série temporal preenchida; mostra volume/tendência ao longo do tempo (suporta múltiplas séries).',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Modo de composição das áreas.
      type: {
        type: 'string',
        enum: ['default', 'stacked', 'percent'],
        default: 'default',
        description:
          'Composição das áreas: "default" (sobrepostas, cada série da baseline ao valor), "stacked" (empilhadas) ou "percent" (100% normalizado).',
      },
      // Estilo de preenchimento da área.
      fill: {
        type: 'string',
        enum: ['gradient', 'solid', 'none'],
        default: 'gradient',
        description:
          'Preenchimento da área: "gradient" (cor da série esmaecendo até transparente), "solid" (cor da série com opacidade baixa) ou "none" (só a linha de topo).',
      },
      // Exibe legenda série → cor abaixo da plotagem.
      showLegend: {
        type: 'boolean',
        default: true,
        description:
          'Exibe a legenda (uma marca de cor por série + rótulo) abaixo da plotagem. Com uma única série a legenda é omitida, pois não há o que distinguir.',
      },
      // Exibe linhas de grade horizontais.
      showGridLines: {
        type: 'boolean',
        default: true,
        description:
          'Exibe as linhas de grade horizontais, alinhadas aos ticks do eixo Y.',
      },
      // Modo de paleta — area chart aceita multi-série nativamente.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'multi',
        description:
          'Modo de paleta: "multi" (default) e "none" ciclam a paleta categórica do design system, uma cor por série; "single" fixa a cor de `accent` em todas as séries.',
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
      { x: '2026-01', y: 120, series: 'Receita' },
      { x: '2026-01', y: 80, series: 'Despesa' },
    ],
  },
  defaultProps: {
    type: 'default',
    fill: 'gradient',
    showLegend: true,
    showGridLines: true,
    palette: 'multi',
    accent: 'chart-1',
  },
  maxRows: 5000,
  version: '1.0.0',
} satisfies BlockManifest;

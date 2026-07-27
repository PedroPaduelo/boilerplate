/**
 * Manifesto do bloco `bar_chart` — compara valores entre categorias
 * (shape 'series', x categórico, `series` opcional p/ multi-série).
 * Alinhado a @dashboards/contracts.
 *
 * Nomes, tipos e defaults das props são CONTRATO com o backend/agente e seguem
 * iguais. O que mudou foi a semântica de COR: `accent` e `seriesColors` são
 * resolvidos para tokens de dado do design system (o componente aceita os
 * valores antigos e os traduz).
 *
 * TODAS as props têm `description` completa — o MCP lê este schema p/ instruir
 * a IA na montagem de dashboards.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';
import { VALUE_FORMATS } from '@/shared/lib/format';

export const manifest = {
  type: 'bar_chart',
  kind: 'chart',
  name: 'Gráfico de Barras',
  description:
    'Compara valores entre categorias em barras verticais (colunas) ou horizontais. Suporta empilhamento (stacked) quando os dados têm múltiplas séries (campo `series`).',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Empilhamento.
      stacked: {
        type: 'boolean',
        default: false,
        description:
          'Empilha as séries em cada coluna (requer dados MULTI-SÉRIE: pontos com o campo `series`). true = cada categoria do eixo X vira uma coluna com segmentos empilhados, um por série. false = barras agrupadas. LIMITAÇÃO: só vale na orientação "vertical"; em "horizontal" o empilhamento é ignorado (barras planas), mas a cor por série é preservada. Se não houver dados multi-série, degrada para barras planas.',
      },
      orientation: {
        type: 'string',
        enum: ['vertical', 'horizontal'],
        default: 'vertical',
        description:
          'Orientação das barras: "vertical" (colunas, default) ou "horizontal" (barras deitadas — bom para rótulos longos). O empilhamento (stacked) só funciona na vertical.',
      },
      // COR base — resolvida para token de dado do DS pelo componente.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description:
          'Cor base das barras, usada em palette="single". O valor é resolvido para uma cor de dado do design system (chart-1..5 e primary mapeiam para as cores categóricas, na mesma ordem da paleta). Em palette="multi" é IGNORADO (a paleta cíclica do DS vence). Valores fora do enum são aceitos por compatibilidade e, quando não descrevem uma cor do sistema, caem na paleta.',
      },
      // Modo de paleta automática.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'single',
        description:
          'Modo de paleta AUTOMÁTICA: "single" (default) = todas as barras/séries com a mesma cor (accent); "multi" = cicla a paleta categórica do design system (por série; com série única, por categoria); "none" = deixa a paleta padrão. Sobrescrito por `seriesColors` quando este é fornecido.',
      },
      // Cor MANUAL por série — configurável, NÃO automático.
      seriesColors: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Cor por série, na ORDEM (índice 0 = primeira série, 1 = segunda, etc.). Cada item é resolvido para uma cor de dado do design system e SOBRESCREVE a paleta automática daquela série. Se omitido, usa `palette`. Use principalmente com stacked=true para fixar a cor de cada série empilhada.',
      },
      // valueFormat — ENUM FECHADO, default 'compactBRL'.
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'compactBRL',
        description:
          'Formato PT-BR do valor exibido no eixo e no tooltip. ENUM FECHADO (sem input livre): BRL, compactBRL, number, compactNumber, percent.',
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
      series: { type: 'category', required: false },
    },
    example: [
      { x: 'Jan', y: 120, series: 'Receita' },
      { x: 'Jan', y: 95, series: 'Despesa' },
      { x: 'Fev', y: 138, series: 'Receita' },
      { x: 'Fev', y: 110, series: 'Despesa' },
    ],
  },
  defaultProps: {
    orientation: 'vertical',
    stacked: false,
    accent: 'chart-1',
    palette: 'single',
    valueFormat: 'compactBRL',
  },
  minColumns: 1,
  maxRows: 5000,
  version: '1.1.0',
} satisfies BlockManifest;

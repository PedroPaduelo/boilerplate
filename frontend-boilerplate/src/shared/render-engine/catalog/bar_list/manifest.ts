/**
 * Manifesto do bloco `bar_list` (shape 'categorical') — ranking "Top N". Cada
 * categoria vira uma linha com barra proporcional ao valor.
 *
 * Nomes e tipos das props são CONTRATO com o backend/agente e seguem iguais. A
 * prop de cor (`accent`) é resolvida pelo componente para um token de dado do
 * design system.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';
import { VALUE_FORMATS } from '@/shared/lib/format';

export const manifest = {
  type: 'bar_list',
  kind: 'chart',
  name: 'Lista de Barras (ranking)',
  description: 'Ranking de categorias (Top N) — barra proporcional ao valor, ordenada.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Ordem de exibição dos itens.
      sortOrder: {
        type: 'string',
        enum: ['ascending', 'descending', 'none'],
        default: 'descending',
        description:
          'Ordem de exibição dos itens: "descending" (default, maior primeiro), "ascending" (menor primeiro) ou "none" (preserva a ordem do dataset).',
      },
      // Modo de paleta.
      palette: {
        type: 'string',
        enum: ['single', 'multi', 'none'],
        default: 'single',
        description:
          'Modo de paleta: "single" (default) = todas as barras na cor de `accent`; "multi" = cicla a paleta categórica do design system, uma cor por item; "none" = deixa a cor padrão da paleta.',
      },
      // COR — enum do catálogo; o componente resolve para token de dado do DS.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description:
          'Cor das barras em palette="single". O valor é resolvido para uma cor de dado do design system (chart-1..5 e primary mapeiam para as cores categóricas, na mesma ordem da paleta). Valores fora do enum são aceitos por compatibilidade e caem na paleta quando não descrevem uma cor do sistema.',
      },
      // valueFormat — ENUM FECHADO, default 'number' (contagem). NOVO na
      // 1.1.0: antes o valor era formatado como moeda compacta em código, sem
      // prop nenhuma, então um ranking de tipos de evento de webhook exibia
      // "R$ 11,19 mil". Não havia como o agente corrigir — só declarando aqui.
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'number',
        description:
          'Formato PT-BR do valor exibido ao lado de cada barra. ENUM FECHADO (sem input livre). Default "number" (contagem): escolha "BRL"/"compactBRL" QUANDO A MEDIDA FOR DINHEIRO — o bloco não adivinha a natureza do dado.',
        oneOf: [
          {
            const: 'BRL',
            description: 'formatBRL — moeda BRL completa (ex.: "R$ 2.609.946.157,73").',
          },
          {
            const: 'compactBRL',
            description: 'formatCompactBRL — moeda BRL compacta (ex.: "R$ 2,61 bi").',
          },
          {
            const: 'number',
            description:
              'formatNumberBR — número PT-BR com milhar (ex.: "11.274"). DEFAULT — use para CONTAGEM.',
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
      // Mantida por compatibilidade de contrato — sem efeito desde que o
      // rótulo passou a ficar FORA da barra.
      textColor: {
        type: 'string',
        description:
          'OBSOLETA (mantida por compatibilidade): não tem efeito. O rótulo agora fica FORA da barra e usa as cores de texto do design system, que já garantem contraste sobre qualquer superfície — não há mais texto sobre a cor da barra para corrigir.',
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
      { label: 'IPTU', value: 4200 },
      { label: 'ISS', value: 3100 },
    ],
  },
  defaultProps: {
    sortOrder: 'descending',
    palette: 'single',
    accent: 'chart-1',
    valueFormat: 'number',
  },
  maxRows: 5000,
  version: '1.1.0',
} satisfies BlockManifest;

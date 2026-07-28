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
import { VALUE_FORMATS } from '@/shared/lib/format';

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
        default: true,
        description:
          'Se true (default), desenha as linhas como curvas suaves; se false, segmentos retos entre os pontos.',
      },
      // Preenche a área abaixo de cada linha (além do traço).
      area: {
        type: 'boolean',
        default: true,
        description:
          'Se true, preenche a área abaixo de cada linha, bem discreta, além do traço.',
      },
      // Modo de paleta — o gráfico aceita multi-série nativamente.
      // O valor "none" foi REMOVIDO na 1.2.0: medido na auditoria de inércia,
      // desenhava igual a "multi". Painéis salvos com "none" seguem valendo.
      palette: {
        type: 'string',
        enum: ['single', 'multi'],
        default: 'multi',
        description:
          'Modo de paleta: "multi" (default) cicla a paleta categórica do design system, UMA COR POR SÉRIE; "single" pinta TODAS as linhas com uma cor só. Em ambos, um `accent` declarado vence e fixa a cor.',
      },
      // COR — enum do catálogo; o componente resolve para token de dado do DS.
      // SEM `default`: o BlockRenderer mescla `defaultProps` em toda
      // renderização e `accent` VENCE a paleta, então um default de fábrica
      // desligaria o modo "multi" — que é o próprio default de `palette`.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        description:
          'Cor de TODAS as séries. Declarar `accent` é pedir cor única: ele vence o modo de paleta (inclusive "multi"). OMITA para que cada linha receba a próxima cor da paleta categórica do design system — que é o padrão e o que mantém séries vizinhas distinguíveis. O valor é resolvido para uma cor de dado do DS (chart-1..5 e primary mapeiam para as cores categóricas, na mesma ordem da paleta); valores fora do enum são aceitos por compatibilidade e, quando não descrevem uma cor do sistema, caem na paleta.',
      },
      // valueFormat — ENUM FECHADO, default 'number' (contagem). NOVO na
      // 1.1.0: o tooltip formatava em BRL por código, sem prop nenhuma, então
      // uma série de mensagens por dia exibia "R$ 3.992,00" e não havia como o
      // agente corrigir.
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'number',
        description:
          'Formato PT-BR do valor exibido no tooltip. ENUM FECHADO (sem input livre). Default "number" (contagem): escolha "BRL"/"compactBRL" QUANDO A MEDIDA FOR DINHEIRO — o bloco não adivinha a natureza do dado. O eixo Y continua compacto, para caber.',
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
              'formatNumberBR — número PT-BR com milhar (ex.: "1.234.567,8"). DEFAULT — use para CONTAGEM.',
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
      x: { type: 'temporal', required: true },
      y: { type: 'number', required: true },
      series: { type: 'category', required: false },
    },
    example: [
      { x: '2026-01', y: 12 },
      { x: '2026-02', y: 18 },
    ],
  },
  // `accent` NÃO tem default (ver a nota no schema).
  defaultProps: {
    smooth: true,
    area: true,
    palette: 'multi',
    valueFormat: 'number',
  },
  maxRows: 5000,
  version: '1.2.0',
} satisfies BlockManifest;

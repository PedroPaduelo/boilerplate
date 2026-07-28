/**
 * Manifesto do bloco `donut` — distribuição de um total entre categorias
 * (shape 'categorical'). Alinhado a @dashboards/contracts.
 *
 * Nomes e tipos das props são CONTRATO com o backend/agente e seguem iguais. A
 * prop de cor (`accent`) é resolvida pelo componente para um token de dado do
 * design system.
 *
 * `valueFormat` continua um ENUM FECHADO com os 5 formatos canônicos, cada um
 * casando 1:1 com um helper de `format.ts` via `formatValueByEnum()`. Na 1.1.0
 * o default virou `number`: era `compactBRL`, e uma composição de mensagens por
 * status somava "R$ 4,09 mil" no centro do anel (ver `lib/value-format.ts`).
 *
 * ---------------------------------------------------------------------------
 * O QUE MUDOU NA 1.2.0
 * ---------------------------------------------------------------------------
 * 1. `accent` VENCE `palette` — a regra de precedência publicada em
 *    `shared/ui/chart-accent.ts`. Antes o acento só valia com
 *    `palette: "single"`, então pedir cor sem mexer na paleta não mudava nada.
 *
 * 2. `accent` perdeu o `default`. O `BlockRenderer` mescla `defaultProps` em
 *    TODA renderização, e um `accent: "chart-1"` de fábrica chegaria
 *    indistinguível de escolha do autor — com a regra nova, `palette: "multi"`
 *    nunca mais ligaria. Sem o default, ausência volta a significar "não
 *    escolheram cor"; o desenho padrão continua o mesmo (1ª cor da paleta).
 *
 * 3. `palette: "none"` saiu do ENUM por ser redundante: ele desenhava
 *    exatamente o mesmo que "multi" (medido na auditoria de inércia), e dois
 *    nomes para um resultado só fazem o agente escolher a esmo. O valor
 *    continua ACEITO em runtime, traduzido para "multi", que é o que ele sempre
 *    fez aqui — painel salvo não muda de desenho por causa da limpeza.
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
        enum: ['single', 'multi'],
        default: 'single',
        description:
          'Modo de paleta: "single" (default) = todas as fatias na mesma cor (a de `accent`, ou a 1ª da paleta se `accent` estiver vazio) e a leitura fica por conta da legenda; "multi" = uma cor por categoria, ciclando a sequência de proporção do design system — use quando a cor precisar distinguir as fatias. `accent` preenchido VENCE "multi": pedir uma cor é pedir cor única.',
      },
      // COR — enum do catálogo; o componente resolve para token de dado do DS.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        description:
          'Cor das fatias. O valor é resolvido para uma cor de dado do design system (chart-1..5 mapeiam para as cores categóricas, na mesma ordem da paleta; `primary` é sinônimo de `chart-1` — as duas são a 1ª cor, e por isso desenham igual). Preenchida, SOBRESCREVE `palette: "multi"`. VAZIA (o padrão) = a 1ª cor da paleta em "single", ou o ciclo completo em "multi". Valores fora do enum são aceitos por compatibilidade e caem na paleta quando não descrevem uma cor do sistema.',
      },
      // valueFormat — ENUM FECHADO, default 'number' (contagem).
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'number',
        description:
          'Formato PT-BR do valor exibido no centro do anel (total) e na legenda. ENUM FECHADO (sem input livre). Default "number" (contagem): escolha "BRL"/"compactBRL" QUANDO A MEDIDA FOR DINHEIRO — o bloco não adivinha a natureza do dado.',
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
    shape: 'categorical',
    spec: {
      label: { type: 'category', required: true },
      value: { type: 'number', required: true },
    },
    example: [
      { label: 'Quitado', value: 1284500 },
      { label: 'Em aberto', value: 786300 },
    ],
  },
  // `accent` fica FORA dos defaults de propósito — ver a nota 2 do cabeçalho.
  defaultProps: {
    showLegend: true,
    palette: 'single',
    valueFormat: 'number',
  },
  version: '1.2.0',
} satisfies BlockManifest;

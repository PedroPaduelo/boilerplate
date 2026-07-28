/**
 * Manifesto do bloco `bar_list` (shape 'categorical') — ranking "Top N". Cada
 * categoria vira uma linha com barra proporcional ao valor.
 *
 * Nomes e tipos das props são CONTRATO com o backend/agente. A prop de cor
 * (`accent`) é resolvida pelo componente para um token de dado do design
 * system e VENCE a paleta — a regra de precedência publicada em
 * `shared/ui/chart-accent.ts`.
 *
 * ---------------------------------------------------------------------------
 * O QUE SAIU NA 1.2.0, E POR QUÊ
 * ---------------------------------------------------------------------------
 * 1. `textColor` — REMOVIDA. Ela existia para um problema que deixou de
 *    existir: o rótulo era escrito DENTRO da barra colorida, e por isso
 *    precisava de uma cor de texto ajustável (o componente legado carregava até
 *    um cálculo de luminância WCAG para isso). Na migração o rótulo saiu para
 *    FORA da barra e passou a usar as cores de leitura do design system, que já
 *    garantem contraste sobre qualquer superfície. Desde então a prop estava
 *    declarada no manifesto e não era lida por ninguém — inércia confirmada
 *    tanto pela auditoria estática (`scripts/audit-catalog-props.mjs`) quanto
 *    pela de render. Reimplementá-la significaria devolver ao agente uma
 *    alavanca para escolher cor de texto arbitrária, contra a regra do sistema
 *    (cor de texto sai do DS); mantê-la significaria continuar anunciando no
 *    prompt uma prop que não faz nada. Some.
 *
 * 2. `palette: "none"` — REMOVIDO DO ENUM (o valor continua aceito em runtime,
 *    para não quebrar painel salvo). Com a regra de precedência acima,
 *    "não multicolorido" tem UM significado só, e `single` já o descreve:
 *    `none` e `single` produziam o mesmo desenho (medido na auditoria de
 *    inércia). Dois nomes para o mesmo resultado num enum é ruído que faz o
 *    agente escolher a esmo.
 *
 * 3. `accent` — sem `default`. O `BlockRenderer` mescla `defaultProps` em TODA
 *    renderização, então `accent: "chart-1"` de fábrica chegava indistinguível
 *    de uma escolha do autor — e, como acento vence paleta, `palette: "multi"`
 *    nunca mais ligaria. Ausência precisa poder significar "não escolheram
 *    cor"; o desenho sem acento continua o mesmo de antes (a 1ª cor da paleta).
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
        enum: ['single', 'multi'],
        default: 'single',
        description:
          'Modo de paleta: "single" (default) = todas as barras na mesma cor (a de `accent`, ou a 1ª da paleta se `accent` estiver vazio) — use quando o ranking compara grandezas da mesma natureza; "multi" = uma cor por item, ciclando a paleta categórica do design system — use quando a cor precisa distinguir as categorias. `accent` preenchido VENCE "multi": pedir uma cor é pedir cor única.',
      },
      // COR — enum do catálogo; o componente resolve para token de dado do DS.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        description:
          'Cor das barras. O valor é resolvido para uma cor de dado do design system (chart-1..5 mapeiam para as cores categóricas, na mesma ordem da paleta; `primary` é sinônimo de `chart-1` — as duas são a 1ª cor, e por isso desenham igual). Preenchida, SOBRESCREVE `palette: "multi"`. VAZIA (o padrão) = a 1ª cor da paleta em "single", ou o ciclo completo em "multi". Valores fora do enum são aceitos por compatibilidade e caem na paleta quando não descrevem uma cor do sistema.',
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
    },
  },
  dataContract: {
    shape: 'categorical',
    spec: {
      label: { type: 'category', required: true },
      value: { type: 'number', required: true },
    },
    // Fora de ordem de propósito, como a fixture: é assim que um `GROUP BY`
    // sem `ORDER BY` devolve, e é o caso em que `sortOrder` mostra serventia.
    example: [
      { label: 'ISS', value: 3100 },
      { label: 'IPTU', value: 4200 },
      { label: 'Multas', value: 760 },
    ],
  },
  // `accent` fica FORA dos defaults de propósito — ver a nota 3 do cabeçalho.
  defaultProps: {
    sortOrder: 'descending',
    palette: 'single',
    valueFormat: 'number',
  },
  maxRows: 5000,
  version: '1.2.0',
} satisfies BlockManifest;

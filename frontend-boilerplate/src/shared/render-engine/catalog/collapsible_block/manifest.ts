/**
 * Manifesto do bloco `collapsible_block` — REGIÃO que recolhe.
 *
 * É a mesma grade do bloco `grid` dentro de um disclosure: um cabeçalho
 * clicável que expande/recolhe o corpo. Existe para tirar da primeira leitura
 * um trecho de detalhe sem tirá-lo da página — as garantias de composição
 * (itens da linha do mesmo tamanho, altura de linha definida, colapso em telas
 * estreitas) valem igual dentro dele.
 *
 * Exemplo (IA via MCP) — detalhamento recolhido com dois gráficos:
 *   { type:'collapsible_block', props:{ title:'Detalhes da apuração', defaultOpen:false },
 *     blocks:[
 *       { type:'bar_chart', span:6, dataBinding:{...} },
 *       { type:'donut',     span:6, dataBinding:{...} } ] }
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'collapsible_block',
  kind: 'layout',
  name: 'Seção Colapsável',
  description:
    'Região que recolhe: um cabeçalho clicável que expande/esconde o corpo, onde os sub-blocos (`block.blocks`) são organizados na mesma grade do bloco `grid` — itens da mesma linha com largura e altura iguais e colapso automático em telas estreitas. NÃO é um card por padrão (use `variant`). Props: title, defaultOpen, columns, gap, align, rowHeight, itemSizing, variant.',
  source: 'astryx:collapsible',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      title: {
        type: 'string',
        description: 'Texto do cabeçalho clicável (é o nome acessível do gatilho).',
      },
      defaultOpen: {
        type: 'boolean',
        default: true,
        description:
          'Estado inicial: `true` começa expandido (default), `false` começa recolhido.',
      },
      columns: {
        type: 'integer',
        minimum: 1,
        maximum: 12,
        description:
          'Número de colunas do corpo. OMITA para o padrão recomendado (uma coluna por filho, até 3 para gráficos/tabelas e 4 para cartões de número).',
      },
      gap: {
        type: 'string',
        enum: ['none', 'sm', 'md', 'lg'],
        default: 'md',
        description: 'Espaçamento entre as células do corpo.',
      },
      align: {
        type: 'string',
        enum: ['stretch', 'start', 'center', 'end'],
        default: 'stretch',
        description: 'Alinhamento vertical dos itens na linha.',
      },
      rowHeight: {
        type: 'string',
        enum: ['auto', 'compact', 'default', 'tall'],
        description:
          'Altura da linha. OMITA para derivar do tipo dos filhos; informe para forçar um degrau.',
      },
      itemSizing: {
        type: 'string',
        enum: ['equal', 'span'],
        default: 'equal',
        description:
          'Largura dos itens: `equal` (faixas iguais) ou `span` (mosaico assimétrico em 12 colunas).',
      },
      variant: {
        type: 'string',
        enum: ['plain', 'card', 'framed'],
        default: 'plain',
        description:
          'Superfície do bloco. `plain` (default), `card` (cartão com padding) ou `framed` (moldura fechada).',
      },
    },
  },
  defaultProps: {
    defaultOpen: true,
    gap: 'md',
    align: 'stretch',
    itemSizing: 'equal',
    variant: 'plain',
  },
  version: '3.0.0',
} satisfies BlockManifest;

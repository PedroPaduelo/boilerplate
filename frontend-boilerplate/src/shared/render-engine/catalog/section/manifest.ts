/**
 * Manifesto do bloco `section` — REGIÃO nomeada de um relatório.
 *
 * É o `grid` com um cabeçalho semântico: mesma grade, mesmas garantias (itens
 * da linha do mesmo tamanho, altura de linha definida, colapso previsível), com
 * um `<h3>` que dá nome ao trecho e permite navegar por títulos. Use `grid`
 * quando só quiser organizar; use `section` quando o trecho tiver nome.
 *
 * ABSORVEU o `dashboard_panel`, que era este mesmo bloco com outro nome (mesmo
 * shell, mesmas props, mesma variante `card`/`framed`) — dois blocos para uma
 * decisão só dividiam o vocabulário do agente sem oferecer nada em troca.
 *
 * Exemplo (IA via MCP) — uma seção com dois gráficos do mesmo tamanho:
 *   { type:'section', props:{ title:'Arrecadação' }, blocks:[
 *       { type:'bar_chart', span:6, dataBinding:{...} },
 *       { type:'donut',     span:6, dataBinding:{...} } ] }
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'section',
  kind: 'layout',
  name: 'Seção',
  description:
    'Região nomeada: agrupa sub-blocos (`block.blocks`) sob um título e os organiza na mesma grade do bloco `grid` — itens da mesma linha com largura e altura iguais, altura de linha definida e colapso automático em telas estreitas. NÃO é um card por padrão (use `variant`). Aceita qualquer bloco do catálogo como filho, inclusive outras seções. Props: title, subtitle, columns, gap, align, rowHeight, itemSizing, variant.',
  source: 'astryx:section',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      title: {
        type: 'string',
        description:
          'Título da seção (vira um heading navegável). Obrigatório — uma seção sem nome é um `grid`.',
      },
      subtitle: { type: 'string', description: 'Subtítulo / descrição curta.' },
      columns: {
        type: 'integer',
        minimum: 1,
        maximum: 12,
        description:
          'Número de colunas. OMITA para o padrão recomendado (uma coluna por filho, até 3 para gráficos/tabelas e 4 para cartões de número).',
      },
      gap: {
        type: 'string',
        enum: ['none', 'sm', 'md', 'lg'],
        default: 'md',
        description: 'Espaçamento entre as células.',
      },
      align: {
        type: 'string',
        enum: ['stretch', 'start', 'center', 'end'],
        default: 'stretch',
        description:
          'Alinhamento vertical dos itens na linha. `stretch` (default) é o que iguala as alturas.',
      },
      rowHeight: {
        type: 'string',
        enum: ['auto', 'compact', 'default', 'tall'],
        description:
          'Altura da linha. OMITA para derivar do tipo dos filhos; informe para forçar um degrau (o valor é um PISO, nunca corta o conteúdo).',
      },
      itemSizing: {
        type: 'string',
        enum: ['equal', 'span'],
        default: 'equal',
        description:
          'Largura dos itens: `equal` (faixas iguais; `span: 12` pede a linha inteira) ou `span` (mosaico assimétrico em 12 colunas).',
      },
      variant: {
        type: 'string',
        enum: ['plain', 'card', 'framed'],
        default: 'plain',
        description:
          'Superfície da seção. `plain` (default): só o título e a grade. `card`: cartão com padding. `framed`: moldura fechada + divisor sob o cabeçalho, para leitura densa.',
      },
    },
  },
  defaultProps: { gap: 'md', align: 'stretch', itemSizing: 'equal', variant: 'plain' },
  version: '3.0.0',
} satisfies BlockManifest;

/**
 * Manifesto do bloco `sheet` — CONTÊINER fora do fluxo (painel sob demanda).
 *
 * Renderiza um BOTÃO que abre um PAINEL MODAL ancorado na borda escolhida. Os
 * sub-blocos ficam DENTRO do painel, na mesma grade do bloco `grid`.
 *
 * É o único container de layout que NÃO ocupa espaço na grade da página, e é
 * por isso que ele sobrevive num catálogo enxuto: resolve "onde colocar o
 * detalhamento que não cabe" sem empurrar a composição principal para baixo.
 *
 * `title` e `description` NÃO têm default de fábrica: eram
 * `'Detalhes do indicador'` / `'Informações complementares...'` e, como o
 * `BlockRenderer` mescla `defaultProps` em toda renderização, todo painel do
 * produto abria com esse texto — indistinguível de um título escolhido.
 *
 * Exemplo (IA via MCP) — botão que abre o detalhamento à direita:
 *   { type:'sheet', props:{ triggerLabel:'Ver detalhamento', title:'Detalhe da arrecadação' },
 *     blocks:[
 *       { type:'line_chart', span:12, dataBinding:{...} },
 *       { type:'data_table', span:12, dataBinding:{...} } ] }
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'sheet',
  kind: 'layout',
  name: 'Sheet (painel sob demanda)',
  description:
    'Contêiner fora do fluxo: um BOTÃO que abre um painel modal ancorado na borda da tela, com os sub-blocos (`block.blocks`) organizados na mesma grade do bloco `grid`. É onde colocar detalhamento sem ocupar espaço na composição principal. Props: triggerLabel, title, description, side, columns, gap, rowHeight, itemSizing.',
  source: 'astryx:dialog',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      triggerLabel: {
        type: 'string',
        default: 'Abrir painel',
        description:
          'Texto do botão que abre o painel. Tem default porque um botão sem rótulo não tem nome acessível.',
      },
      title: {
        type: 'string',
        description:
          'Título do painel. Omita para o painel herdar o rótulo do gatilho — não há texto padrão.',
      },
      description: {
        type: 'string',
        description: 'Texto descritivo curto sob o título do painel. Opcional.',
      },
      side: {
        type: 'string',
        enum: ['top', 'right', 'bottom', 'left'],
        default: 'right',
        description:
          'Borda em que o painel encosta: right (default), left, top ou bottom.',
      },
      columns: {
        type: 'integer',
        minimum: 1,
        maximum: 12,
        description:
          'Número de colunas do conteúdo do painel. OMITA para derivar da quantidade de filhos; use `1` para empilhar.',
      },
      gap: {
        type: 'string',
        enum: ['none', 'sm', 'md', 'lg'],
        default: 'md',
        description: 'Espaçamento entre as células do painel.',
      },
      rowHeight: {
        type: 'string',
        enum: ['auto', 'compact', 'default', 'tall'],
        description:
          'Altura da linha dentro do painel. OMITA para derivar do tipo dos filhos.',
      },
      itemSizing: {
        type: 'string',
        enum: ['equal', 'span'],
        default: 'equal',
        description:
          'Largura dos itens: `equal` (faixas iguais) ou `span` (mosaico assimétrico em 12 colunas).',
      },
    },
  },
  defaultProps: {
    triggerLabel: 'Abrir painel',
    side: 'right',
    gap: 'md',
    itemSizing: 'equal',
  },
  version: '3.0.0',
} satisfies BlockManifest;

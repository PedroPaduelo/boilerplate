/**
 * Manifesto do bloco `sheet` — CONTAINER de layout (painel lateral deslizante).
 *
 * Renderiza um BOTÃO (trigger) que, ao ser clicado, abre um PAINEL LATERAL
 * deslizante (Sheet). Os SUB-BLOCOS (gráficos/cards/tabelas/detalhe) ficam
 * DENTRO do painel, empilhados — montados pela IA via o contrato unificado de
 * container `block.blocks` (mesma sintaxe de `section`/`bento_grid`). As props
 * deste bloco são de CONFIGURAÇÃO DO LAYOUT (não de conteúdo): triggerLabel,
 * title, description, side.
 *
 * Caso de uso típico: detalhamento sob demanda — ao lado de uma tabela/KPI, um
 * botão abre um painel com o gráfico/relatório detalhado, sem poluir a tela.
 *
 * Exemplo (IA via MCP) — botão que abre o detalhamento à direita:
 *   { type:'sheet', props:{ triggerLabel:'Ver detalhamento', title:'Detalhe da arrecadação', side:'right' },
 *     blocks:[
 *       { type:'line_chart', dataBinding:{...} },
 *       { type:'data_table', dataBinding:{...} } ] }
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'sheet',
  kind: 'layout',
  name: 'Sheet (painel lateral)',
  description:
    'Container de layout: um BOTÃO que abre um PAINEL LATERAL deslizante. Os sub-blocos (gráficos/detalhe) ficam DENTRO do painel, empilhados — use `block.blocks` para os filhos. Ideal para detalhamento sob demanda sem ocupar espaço na tela. Props: triggerLabel, title, description, side.',
  source: 'vitrine:sheet',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      triggerLabel: {
        type: 'string',
        default: 'Abrir painel',
        description: 'Texto do botão que abre o painel lateral.',
      },
      title: {
        type: 'string',
        description: 'Título exibido no topo do painel.',
      },
      description: {
        type: 'string',
        description: 'Texto descritivo curto exibido sob o título do painel.',
      },
      side: {
        type: 'string',
        enum: ['top', 'right', 'bottom', 'left'],
        default: 'right',
        description:
          'Lado de onde o painel desliza: right (default), left, top ou bottom.',
      },
    },
  },
  defaultProps: {
    triggerLabel: 'Abrir painel',
    title: 'Detalhes do indicador',
    description: 'Informações complementares sobre a métrica selecionada.',
    side: 'right',
  },
  version: '2.0.0',
} satisfies BlockManifest;

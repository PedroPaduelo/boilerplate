/**
 * Manifesto do bloco `collapsible_block` — CONTAINER de layout colapsável.
 *
 * Cabeçalho clicável que expande/recolhe o CORPO, onde ficam os SUB-BLOCOS
 * (gráficos/cards/tabelas). A composição segue o contrato unificado de
 * container — `block.blocks` (a IA monta a árvore de filhos; mesma sintaxe de
 * `section`/dashboard). As props deste bloco são de CONFIGURAÇÃO DO LAYOUT
 * (não de conteúdo): `title` (cabeçalho) e `defaultOpen` (estado inicial).
 *
 * Exemplo (IA via MCP) — bloco colapsável com 2 gráficos no corpo:
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
    'Container de layout colapsável: um cabeçalho clicável que expande/recolhe o corpo. Renderiza sub-blocos (gráficos/cards/tabelas) num grid de 12 colunas dentro do corpo. Use `block.blocks` para os filhos (cada filho usa `span` 1..12). Props: title, defaultOpen.',
  source: 'vitrine:collapsible-section',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      title: {
        type: 'string',
        description: 'Texto do cabeçalho clicável da seção colapsável.',
      },
      defaultOpen: {
        type: 'boolean',
        default: true,
        description:
          'Estado inicial: `true` começa expandido (default), `false` começa recolhido.',
      },
    },
  },
  defaultProps: {
    title: 'Detalhes da apuração',
    defaultOpen: true,
  },
  version: '2.0.0',
} satisfies BlockManifest;

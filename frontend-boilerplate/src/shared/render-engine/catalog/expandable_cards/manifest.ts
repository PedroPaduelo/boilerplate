/**
 * Manifesto do bloco `expandable_cards` — CONTAINER de layout.
 *
 * Cada SUB-BLOCO (`block.blocks`) vira um CARD na grade colapsada; ao clicar, o
 * card EXPANDE num modal mostrando o sub-bloco renderizado (gráfico/tabela/etc.).
 * A composição segue o contrato unificado de container — `block.blocks` (a IA
 * monta a árvore de filhos; mesma sintaxe de `section`/`bento_grid`). As props
 * deste bloco são de CONFIGURAÇÃO DO LAYOUT (não de conteúdo): `columns`/`gap`.
 *
 * Exemplo (IA via MCP) — 3 gráficos como cards expansíveis:
 *   { type:'expandable_cards', props:{columns:3}, blocks:[
 *       { type:'bar_chart', title:'Arrecadação', dataBinding:{...} },
 *       { type:'donut',     title:'Dívida ativa', dataBinding:{...} },
 *       { type:'line_chart', title:'Evolução',    dataBinding:{...} } ] }
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'expandable_cards',
  kind: 'layout',
  name: 'Cards Expansíveis',
  description:
    'Container de layout: cada sub-bloco vira um card na grade e EXPANDE para um modal (com o sub-bloco renderizado) ao clicar. Use `block.blocks` para os filhos; o `title` de cada filho rotula o card. Props: columns (1..4), gap.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      columns: {
        type: 'integer',
        minimum: 1,
        maximum: 4,
        default: 3,
        description:
          'Número de colunas da grade de cards colapsados (1..4). Default: 3.',
      },
      gap: {
        type: 'string',
        enum: ['sm', 'md', 'lg'],
        default: 'md',
        description:
          'Espaçamento entre os cards: sm (compacto), md (default), lg (espaçado).',
      },
    },
  },
  defaultProps: { columns: 3, gap: 'md' },
  version: '2.0.0',
} satisfies BlockManifest;

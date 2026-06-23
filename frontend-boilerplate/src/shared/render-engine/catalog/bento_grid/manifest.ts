/**
 * Manifesto do bloco `bento_grid` — CONTAINER de layout (mosaico "bento").
 *
 * Dispõe os SUB-BLOCOS (gráficos/cards/tabelas) num grid de N colunas, em
 * mosaico: cada filho ocupa `span` colunas (1..12) e `rowSpan` linhas (altura).
 * A composição segue o contrato unificado de container — `block.blocks` (a IA
 * monta a árvore de filhos; mesma sintaxe de `section`/dashboard). As props
 * deste bloco são de CONFIGURAÇÃO DO LAYOUT (não de conteúdo): `columns`/`gap`.
 *
 * Exemplo (IA via MCP) — 1 destaque grande + 2 menores:
 *   { type:'bento_grid', props:{columns:3}, blocks:[
 *       { type:'bar_chart', span:8, rowSpan:2, dataBinding:{...} },
 *       { type:'kpi',       span:4, dataBinding:{...} },
 *       { type:'donut',     span:4, dataBinding:{...} } ] }
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'bento_grid',
  kind: 'layout',
  name: 'Bento Grid',
  description:
    'Container de layout em mosaico "bento". Renderiza sub-blocos (gráficos/cards/tabelas) num grid; cada filho usa `span` (largura 1..12) e `rowSpan` (altura). Use `block.blocks` para os filhos. Props: columns, gap.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      columns: {
        type: 'integer',
        minimum: 1,
        maximum: 12,
        default: 12,
        description:
          'Número de colunas do grid bento (1..12). O `span` de cada filho é relativo a este total. Default: 12 (alinha com o grid do dashboard).',
      },
      gap: {
        type: 'string',
        enum: ['sm', 'md', 'lg'],
        default: 'md',
        description:
          'Espaçamento entre as células do mosaico: sm (compacto), md (default), lg (espaçado).',
      },
      autoRows: {
        type: 'string',
        enum: ['sm', 'md', 'lg'],
        default: 'md',
        description:
          'Altura base de cada linha do mosaico (afeta o efeito do `rowSpan` dos filhos): sm (~8rem), md (~11rem, default), lg (~14rem).',
      },
    },
  },
  defaultProps: { columns: 12, gap: 'md', autoRows: 'md' },
  version: '2.0.0',
} satisfies BlockManifest;

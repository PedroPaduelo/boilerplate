/**
 * Manifesto do bloco `dashboard_panel` — CONTAINER de layout. Agrupa SUB-BLOCOS
 * (KPIs, gráficos, tabelas) num painel com header (título + descrição) e corpo
 * em grid de 12 colunas. Difere do `section` na semântica de uso (painel de
 * indicadores de um relatório), mas usa o MESMO mecanismo de composição: os
 * filhos vêm em `block.blocks` e são injetados como `children` pelo
 * `BlockRenderer` num grid de 12 colunas (cada filho usa `span` 1..12).
 *
 * As props são de CONFIGURAÇÃO DO LAYOUT (não de conteúdo): título, descrição
 * e estilo visual do painel.
 *
 * Exemplo (IA via MCP) — painel com 3 KPIs:
 *   { type:'dashboard_panel', props:{ title:'Arrecadação', variant:'card' }, blocks:[
 *       { type:'kpi', span:4, dataBinding:{...} },
 *       { type:'kpi', span:4, dataBinding:{...} },
 *       { type:'kpi', span:4, dataBinding:{...} } ] }
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'dashboard_panel',
  kind: 'layout',
  name: 'Painel de Dashboard',
  description:
    'Container de painel: agrupa sub-blocos (KPIs, gráficos, tabelas) num card com header (título + descrição) e corpo em grid de 12 colunas. Use `block.blocks` para os filhos; cada filho usa `span` (largura 1..12). Props: title, description, variant.',
  source: 'vitrine:dashboard-panel',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      title: { type: 'string', description: 'Título do painel (header).' },
      description: {
        type: 'string',
        description: 'Descrição / subtítulo curto, abaixo do título.',
      },
      variant: {
        type: 'string',
        enum: ['card', 'framed'],
        description:
          "Estilo visual do painel. 'card' (default): card com padding e header título/descrição. 'framed': header com borda inferior e corpo flush (denso).",
      },
    },
  },
  defaultProps: {
    title: 'Arrecadação consolidada',
    description: 'Indicadores do mês corrente',
    variant: 'card',
  },
  version: '2.0.0',
} satisfies BlockManifest;

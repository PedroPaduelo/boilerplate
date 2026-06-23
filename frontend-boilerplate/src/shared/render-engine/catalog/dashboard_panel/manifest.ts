/**
 * Manifesto do bloco `dashboard_panel` (layout) — contêiner de painel com
 * título, descrição e corpo. Usa o Vitrine `DashboardPanel`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'dashboard_panel',
  kind: 'layout',
  name: 'Painel de Dashboard',
  description: 'Contêiner de painel com título, descrição e corpo — agrupa conteúdo de um relatório.',
  source: 'vitrine:dashboard-panel',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['title'],
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      body: { type: 'string' },
      variant: { type: 'string', enum: ['card', 'framed'] },
    },
  },
  defaultProps: {
    title: 'Arrecadação consolidada',
    description: 'Indicadores do mês corrente',
    body: 'A receita acumulada superou a meta em 8% no período, puxada pelo ISS e pelo IPTU.',
    variant: 'card',
  },
  version: '1.0.0',
} satisfies BlockManifest;

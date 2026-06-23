/**
 * Manifesto do bloco `expandable_cards` (layout) — lista de cards que expandem
 * para um modal de detalhes. Usa o Vitrine `ExpandableCards`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'expandable_cards',
  kind: 'layout',
  name: 'Cards Expansíveis',
  description: 'Lista de cards que expandem para um modal com detalhes ao clicar.',
  source: 'vitrine:expandable-cards',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      cards: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            src: { type: 'string' },
            ctaText: { type: 'string' },
            ctaLink: { type: 'string' },
            content: { type: 'string' },
          },
        },
      },
    },
  },
  defaultProps: {
    cards: [
      {
        title: 'Relatório de Arrecadação',
        description: 'Consolidação mensal',
        src: 'https://picsum.photos/seed/arrecadacao/200/200',
        ctaText: 'Abrir',
        ctaLink: '#',
        content: 'Receita por tributo, evolução mês a mês e comparação com a meta do exercício.',
      },
      {
        title: 'Dívida Ativa',
        description: 'Estoque e recuperação',
        src: 'https://picsum.photos/seed/divida/200/200',
        ctaText: 'Abrir',
        ctaLink: '#',
        content: 'Estoque da dívida ativa, taxa de recuperação e parcelamentos em andamento.',
      },
      {
        title: 'Despesas por Órgão',
        description: 'Execução orçamentária',
        src: 'https://picsum.photos/seed/despesas/200/200',
        ctaText: 'Abrir',
        ctaLink: '#',
        content: 'Empenhado, liquidado e pago por secretaria, com saldo orçamentário disponível.',
      },
    ],
  },
  version: '1.0.0',
} satisfies BlockManifest;

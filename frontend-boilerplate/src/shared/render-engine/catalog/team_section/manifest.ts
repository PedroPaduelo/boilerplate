/**
 * Manifesto do bloco `team_section` (layout) — seção "nosso time" com cards de
 * membros. Usa o Vitrine `TeamSectionWithScales`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'team_section',
  kind: 'layout',
  name: 'Seção de Time',
  description: 'Seção "nosso time" com cards de membros: foto, cargo e bio.',
  source: 'vitrine:team-section-with-scales',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      eyebrow: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      members: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'role', 'image'],
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            image: { type: 'string' },
            bio: { type: 'string' },
          },
        },
      },
    },
  },
  defaultProps: {
    eyebrow: 'Nosso time',
    title: 'Quem cuida dos dados',
    description: 'Equipe responsável pelos indicadores e relatórios da prefeitura.',
    members: [
      {
        name: 'Ana Souza',
        role: 'Coordenadora de Dados',
        image: 'https://i.pravatar.cc/160?img=47',
        bio: 'Lidera a governança de dados e a estratégia de indicadores.',
      },
      {
        name: 'Bruno Lima',
        role: 'Analista de BI',
        image: 'https://i.pravatar.cc/160?img=12',
        bio: 'Constrói os painéis de arrecadação e dívida ativa.',
      },
      {
        name: 'Carla Dias',
        role: 'Engenheira de Dados',
        image: 'https://i.pravatar.cc/160?img=32',
        bio: 'Mantém os pipelines e a qualidade das bases.',
      },
    ],
  },
  version: '1.0.0',
} satisfies BlockManifest;

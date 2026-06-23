/**
 * Manifesto do bloco `work_experience` (layout) — linha do tempo de
 * experiências/cargos. Usa o Vitrine `WorkExperienceComponent`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'work_experience',
  kind: 'layout',
  name: 'Experiência Profissional',
  description: 'Linha do tempo de experiências/cargos com período, descrição e tecnologias.',
  source: 'vitrine:work-experience-component',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      variant: { type: 'string', enum: ['timeline', 'card'] },
      experiences: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['company', 'role', 'period'],
          properties: {
            company: { type: 'string' },
            role: { type: 'string' },
            period: { type: 'string' },
            description: { type: 'string' },
            technologies: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
  defaultProps: {
    variant: 'timeline',
    experiences: [
      {
        company: 'Prefeitura Municipal',
        role: 'Coordenadora de Dados',
        period: '2022 — atual',
        description: 'Governança de dados e indicadores estratégicos.',
        technologies: ['Postgres', 'Power BI', 'Python'],
      },
      {
        company: 'Secretaria da Fazenda',
        role: 'Analista de BI',
        period: '2019 — 2022',
        description: 'Painéis de arrecadação e dívida ativa.',
        technologies: ['SQL', 'Tableau'],
      },
      {
        company: 'Tribunal de Contas',
        role: 'Estagiária de Dados',
        period: '2018 — 2019',
        description: 'Apoio à auditoria de contas públicas.',
        technologies: ['Excel', 'SQL'],
      },
    ],
  },
  version: '1.0.0',
} satisfies BlockManifest;

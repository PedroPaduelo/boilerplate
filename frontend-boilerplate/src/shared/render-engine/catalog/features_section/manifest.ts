/**
 * Manifesto do bloco `features_section` (layout) — seção de destaques com
 * previews animados (skeletons). Usa o Vitrine `FeaturesSectionWithSkeletons`.
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'features_section',
  kind: 'layout',
  name: 'Seção de Features',
  description: 'Seção de destaques com títulos, descrições e previews animados (skeletons).',
  source: 'vitrine:features-section-with-skeletons',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      heading: { type: 'string' },
      subheading: { type: 'string' },
    },
  },
  defaultProps: {
    heading: 'Tudo que a gestão precisa',
    subheading: 'Do dado bruto à decisão: indicadores, relatórios e painéis em tempo real.',
  },
  version: '1.0.0',
} satisfies BlockManifest;

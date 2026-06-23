/**
 * Bloco `features_section` (layout) — usa o Vitrine `FeaturesSectionWithSkeletons`.
 * As features (com seus skeletons React) são montadas aqui; o título/subtítulo
 * vêm das props.
 */
import {
  FeaturesSectionWithSkeletons,
  SkeletonBars,
  SkeletonRipple,
  type FeatureItem,
} from '@/components/ui/features-section-with-skeletons';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type FeaturesSectionBlockProps = { heading?: string; subheading?: string };

const FEATURES: FeatureItem[] = [
  {
    title: 'Analytics em tempo real',
    description: 'Arrecadação e inadimplência atualizadas a cada consulta.',
    skeleton: <SkeletonBars />,
    className: 'col-span-1 border-b border-border lg:col-span-3 lg:border-r',
  },
  {
    title: 'Cobertura de toda a rede',
    description: 'Indicadores consolidados de todas as secretarias.',
    skeleton: <SkeletonRipple />,
    className: 'col-span-1 border-b border-border lg:col-span-3',
  },
];

export const Component: BlockComponent<FeaturesSectionBlockProps> = ({ props }) => {
  return (
    <FeaturesSectionWithSkeletons
      heading={props.heading}
      subheading={props.subheading}
      features={FEATURES}
      className="py-8 lg:py-10"
    />
  );
};

export const definition = defineBlock<FeaturesSectionBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

/**
 * Bloco `work_experience` (layout) — usa o Vitrine `WorkExperienceComponent`.
 */
import {
  WorkExperienceComponent,
  type WorkExperienceItem,
} from '@/components/ui/work-experience-component';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ExperienceInput = {
  company?: string;
  role?: string;
  period?: string;
  description?: string;
  technologies?: string[];
};
type WorkExperienceBlockProps = {
  variant?: 'timeline' | 'card';
  experiences?: ExperienceInput[];
};

const FALLBACK: ExperienceInput[] = [
  { company: 'Empresa', role: 'Cargo', period: '2022 — atual' },
];

export const Component: BlockComponent<WorkExperienceBlockProps> = ({ props }) => {
  const source = props.experiences?.length ? props.experiences : FALLBACK;
  const experiences: WorkExperienceItem[] = source.map((e) => ({
    company: e.company ?? '',
    role: e.role ?? '',
    period: e.period ?? '',
    description: e.description,
    technologies: e.technologies,
  }));
  return <WorkExperienceComponent variant={props.variant ?? 'timeline'} experiences={experiences} />;
};

export const definition = defineBlock<WorkExperienceBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

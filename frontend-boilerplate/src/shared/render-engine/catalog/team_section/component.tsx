/**
 * Bloco `team_section` (layout) — usa o Vitrine `TeamSectionWithScales`.
 */
import { TeamSectionWithScales } from '@/components/ui/team-section-with-scales';
import type { TeamMember } from '@/components/ui/team-section-with-scales-types';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type TeamMemberInput = { name?: string; role?: string; image?: string; bio?: string };
type TeamSectionBlockProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  members?: TeamMemberInput[];
};

const FALLBACK: TeamMemberInput[] = [
  { name: 'Membro 1', role: 'Cargo', image: 'https://i.pravatar.cc/160?img=5' },
  { name: 'Membro 2', role: 'Cargo', image: 'https://i.pravatar.cc/160?img=8' },
  { name: 'Membro 3', role: 'Cargo', image: 'https://i.pravatar.cc/160?img=15' },
];

export const Component: BlockComponent<TeamSectionBlockProps> = ({ props }) => {
  const source = props.members?.length ? props.members : FALLBACK;
  const members: TeamMember[] = source.map((m) => ({
    name: m.name ?? '',
    role: m.role ?? '',
    image: m.image ?? '',
    bio: m.bio,
  }));
  return (
    <TeamSectionWithScales
      eyebrow={props.eyebrow}
      title={props.title}
      description={props.description}
      members={members}
      className="py-8"
    />
  );
};

export const definition = defineBlock<TeamSectionBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

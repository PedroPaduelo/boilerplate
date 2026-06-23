/**
 * Bloco `leaderboard` (shape 'categorical') — usa o Vitrine `LeaderboardList`.
 * O progresso de cada linha é proporcional ao maior valor da série.
 */
import type { CategoricalData } from '@dashboards/contracts';
import { LeaderboardList } from '@/components/ui/leaderboard-list';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type LeaderboardProps = { unit?: string };
type CategoryPoint = { label: string; value: number | null };

export const Component: BlockComponent<LeaderboardProps, CategoricalData> = ({ props, data }) => {
  const items = (data ?? []) as CategoryPoint[];
  const max = Math.max(...items.map((d) => d.value ?? 0), 1);
  const unit = props.unit ? ` ${props.unit}` : '';
  const rows = items.map((d, i) => ({
    id: String(i),
    name: d.label,
    value: `${(d.value ?? 0).toLocaleString('pt-BR')}${unit}`,
    progress: ((d.value ?? 0) / max) * 100,
    rank: i + 1,
  }));
  return <LeaderboardList items={rows} />;
};

export const definition = defineBlock<LeaderboardProps, CategoricalData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

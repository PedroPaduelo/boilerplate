/**
 * Bloco `leaderboard` (shape 'categorical') — ranking com posição, identidade e
 * barra proporcional ao líder (`leaderboard-list.tsx`, próprio do bloco).
 *
 * O que mudou na migração:
 *  - a lista foi reescrita sobre o design system (avatar, tipografia e barra de
 *    dado com cor de token) — sumiram as classes de cor e a barra `bg-primary`;
 *  - o valor passou a ser formatado em PT-BR pelo mesmo helper dos outros
 *    blocos, com a `unit` colada só quando ela existe;
 *  - carregando e sem dados deixaram de ser silêncio: viram esqueleto e aviso.
 */
import type { CategoricalData } from '@dashboards/contracts';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { VStack } from '@astryxdesign/core/VStack';
import { formatNumberBR } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { LeaderboardList } from './leaderboard-list';
import { manifest } from './manifest';
import { fixture } from './fixture';

type LeaderboardProps = { unit?: string };
type CategoryPoint = { label: string; value: number | null };

/** Linhas de esqueleto — mesma silhueta da lista, para não "pular" ao carregar. */
const LOADING_ROWS = 5;

export const Component: BlockComponent<LeaderboardProps, CategoricalData> = ({
  props,
  data,
  state,
}) => {
  if (state === 'loading' || state === 'skeleton') {
    return (
      <VStack gap={3} width="100%">
        {Array.from({ length: LOADING_ROWS }, (_, index) => (
          <Skeleton key={index} height={36} radius={1} index={index} />
        ))}
      </VStack>
    );
  }

  const items = (data ?? []) as CategoryPoint[];
  if (items.length === 0) {
    return (
      <EmptyState isCompact title="Sem dados para exibir" description={manifest.name} />
    );
  }

  // A barra é proporcional ao LÍDER, não ao total: o ranking compara pessoas
  // entre si, não a fatia de cada uma no bolo.
  const leader = Math.max(...items.map((item) => item.value ?? 0), 0);
  const unit = props.unit?.trim();

  return (
    <LeaderboardList
      items={items.map((item, index) => ({
        key: `${item.label}-${index}`,
        name: item.label,
        value: unit
          ? `${formatNumberBR(item.value ?? 0)} ${unit}`
          : formatNumberBR(item.value ?? 0),
        ratio: leader > 0 ? (item.value ?? 0) / leader : 0,
      }))}
    />
  );
};

export const definition = defineBlock<LeaderboardProps, CategoricalData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

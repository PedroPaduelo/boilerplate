/**
 * Bloco `favorites_list` (layout) — usa o Vitrine `FavoritesList`.
 */
import { FavoritesList } from '@/components/ui/favorites-list';
import type { FavoritesListItem } from '@/components/ui/favorites-list';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type FavoriteInput = { id?: string; label?: string };
type FavoritesListBlockProps = { items?: FavoriteInput[] };

const FALLBACK: FavoriteInput[] = [
  { id: '1', label: 'public.tabela_a' },
  { id: '2', label: 'public.tabela_b' },
];

export const Component: BlockComponent<FavoritesListBlockProps> = ({ props }) => {
  const source = props.items?.length ? props.items : FALLBACK;
  const items: FavoritesListItem[] = source.map((f, i) => ({
    id: f.id ?? `${i}`,
    label: f.label ?? '',
  }));
  return (
    <div className="rounded-lg border border-border p-2">
      <FavoritesList items={items} />
    </div>
  );
};

export const definition = defineBlock<FavoritesListBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

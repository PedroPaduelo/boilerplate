/**
 * Bloco `connection_list` (layout) — usa o Vitrine `ConnectionList`.
 */
import { ConnectionList } from '@/components/ui/connection-list';
import type { ConnectionListItem } from '@/components/ui/connection-list';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ConnectionInput = {
  id?: string;
  name?: string;
  meta?: string;
  status?: 'online' | 'offline' | 'warning';
};
type ConnectionListBlockProps = { items?: ConnectionInput[]; activeId?: string };

const FALLBACK: ConnectionInput[] = [
  { id: '0', name: 'db_principal', meta: '12 schemas', status: 'online' },
  { id: '1', name: 'db_secundario', meta: '4 schemas', status: 'warning' },
];

export const Component: BlockComponent<ConnectionListBlockProps> = ({ props }) => {
  const source = props.items?.length ? props.items : FALLBACK;
  const items: ConnectionListItem[] = source.map((c, i) => ({
    id: c.id ?? `${i}`,
    name: c.name ?? '',
    meta: c.meta,
    status: c.status,
  }));
  return (
    <div className="rounded-lg border border-border p-2">
      <ConnectionList items={items} activeId={props.activeId ?? items[0]?.id} />
    </div>
  );
};

export const definition = defineBlock<ConnectionListBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

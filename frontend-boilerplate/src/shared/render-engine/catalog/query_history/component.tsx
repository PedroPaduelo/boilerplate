/**
 * Bloco `query_history` (layout) — usa o Vitrine `QueryHistoryList`.
 */
import { QueryHistoryList } from '@/components/ui/query-history-list';
import type { QueryHistoryItem } from '@/components/ui/query-history-list';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type QueryInput = { id?: string; sql?: string; durationMs?: number; timeLabel?: string };
type QueryHistoryBlockProps = { items?: QueryInput[] };

const FALLBACK: QueryInput[] = [
  { id: '1', sql: 'SELECT 1', durationMs: 10, timeLabel: 'agora' },
];

export const Component: BlockComponent<QueryHistoryBlockProps> = ({ props }) => {
  const source = props.items?.length ? props.items : FALLBACK;
  const items: QueryHistoryItem[] = source.map((q, i) => ({
    id: q.id ?? `${i}`,
    sql: q.sql ?? '',
    durationMs: q.durationMs,
    timeLabel: q.timeLabel,
  }));
  return (
    <div className="rounded-lg border border-border p-2">
      <QueryHistoryList items={items} />
    </div>
  );
};

export const definition = defineBlock<QueryHistoryBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;

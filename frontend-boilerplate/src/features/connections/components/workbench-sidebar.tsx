import type { ReactNode } from 'react';
import { Bookmark, History, Wifi } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { Divider } from '@astryxdesign/core/Divider';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import type { IconType } from '@astryxdesign/core/Icon';
import type { Connection } from '../types';
import type { FavoriteTable } from '../use-workbench-favorites';
import type { QueryHistoryEntry } from '../use-query-runner';
import { ConnectionList } from './connection-list';
import { FavoritesList } from './favorites-list';
import { QueryHistoryList } from './query-history-list';

/**
 * Painel de sessão do workbench: outras conexões, favoritos e histórico.
 *
 * Três seções `Collapsible` — quem trabalha em um banco só fecha as duas que
 * não usa e ganha altura. O contador fica no gatilho para dar a informação
 * mesmo com a seção fechada.
 */
export interface WorkbenchSidebarProps {
  connectionId: string;
  connections: Connection[];
  favorites: FavoriteTable[];
  history: QueryHistoryEntry[];
  onSelectFavorite: (favorite: FavoriteTable) => void;
  onRemoveFavorite: (favorite: FavoriteTable) => void;
  onSelectQuery: (entry: QueryHistoryEntry) => void;
}

function SectionTrigger({
  icon,
  label,
  count,
}: {
  icon: IconType;
  label: string;
  count: number;
}) {
  return (
    <HStack gap={2} vAlign="center">
      <Icon icon={icon} size="sm" color="secondary" />
      <Text type="label">{label}</Text>
      <Badge variant="neutral" label={String(count)} />
    </HStack>
  );
}

function Section({
  icon,
  label,
  count,
  children,
}: {
  icon: IconType;
  label: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <Collapsible
      defaultIsOpen
      trigger={<SectionTrigger icon={icon} label={label} count={count} />}
    >
      {children}
    </Collapsible>
  );
}

export function WorkbenchSidebar({
  connectionId,
  connections,
  favorites,
  history,
  onSelectFavorite,
  onRemoveFavorite,
  onSelectQuery,
}: WorkbenchSidebarProps) {
  return (
    <VStack gap={1}>
      <Section icon={Wifi} label="Conexões" count={connections.length}>
        <ConnectionList connections={connections} activeId={connectionId} />
      </Section>
      <Divider />
      <Section icon={Bookmark} label="Favoritos" count={favorites.length}>
        <FavoritesList
          items={favorites}
          onSelect={onSelectFavorite}
          onRemove={onRemoveFavorite}
        />
      </Section>
      <Divider />
      <Section icon={History} label="Histórico de queries" count={history.length}>
        <QueryHistoryList items={history} onSelect={onSelectQuery} />
      </Section>
    </VStack>
  );
}

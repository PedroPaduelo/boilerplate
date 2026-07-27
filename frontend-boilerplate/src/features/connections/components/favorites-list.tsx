import { Star, StarOff } from 'lucide-react';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import type { FavoriteTable } from '../use-workbench-favorites';

/**
 * Tabelas favoritadas da conexão aberta — atalho para voltar ao que interessa
 * sem caçar na árvore. Lista densa com divisores; o botão de remover vive no
 * `endContent` (o `Item` do DS ignora cliques originados em botões internos,
 * então remover não dispara a seleção da linha).
 */
export interface FavoritesListProps {
  items: FavoriteTable[];
  onSelect: (favorite: FavoriteTable) => void;
  onRemove: (favorite: FavoriteTable) => void;
}

export function FavoritesList({ items, onSelect, onRemove }: FavoritesListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        isCompact
        headingLevel={4}
        title="Nenhum favorito"
        description="Marque uma tabela como favorita no painel de detalhe."
      />
    );
  }

  return (
    <List density="compact" hasDividers>
      {items.map((favorite) => (
        <ListItem
          key={favorite.id}
          onClick={() => onSelect(favorite)}
          startContent={<Icon icon={Star} size="xsm" color="warning" />}
          label={
            <Text type="code" maxLines={1}>
              {favorite.schema}.{favorite.table}
            </Text>
          }
          endContent={
            <IconButton
              label={`Remover ${favorite.schema}.${favorite.table} dos favoritos`}
              tooltip="Remover dos favoritos"
              icon={<Icon icon={StarOff} />}
              variant="ghost"
              size="sm"
              onClick={() => onRemove(favorite)}
            />
          }
        />
      ))}
    </List>
  );
}

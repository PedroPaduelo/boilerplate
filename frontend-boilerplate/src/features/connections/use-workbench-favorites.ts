import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import type { TableRef } from './components/db-schema-explorer-types';

/**
 * Tabelas favoritadas no workbench.
 *
 * Mora no localStorage (é preferência de trabalho do usuário, não dado de
 * domínio: o backend não tem esse recurso) e é namespaced por conexão — a
 * chave é `<connectionId>::<schema>.<tabela>`, senão os favoritos de um banco
 * apareceriam em outro.
 */

const STORAGE_KEY = 'conn-workbench:favorites';

export interface FavoriteTable extends TableRef {
  /** Chave completa (com o id da conexão) — identidade estável na lista. */
  id: string;
}

function toKey(connectionId: string, ref: TableRef): string {
  return `${connectionId}::${ref.schema}.${ref.table}`;
}

function parseKey(connectionId: string, key: string): FavoriteTable | null {
  const suffix = key.slice(`${connectionId}::`.length);
  const separator = suffix.indexOf('.');
  if (separator <= 0) return null;
  return {
    id: key,
    schema: suffix.slice(0, separator),
    table: suffix.slice(separator + 1),
  };
}

export interface WorkbenchFavorites {
  items: FavoriteTable[];
  isFavorite: (ref: TableRef | null) => boolean;
  toggle: (ref: TableRef) => void;
  remove: (favorite: FavoriteTable) => void;
}

export function useWorkbenchFavorites(connectionId: string): WorkbenchFavorites {
  const [keys, setKeys] = useLocalStorage<string[]>(STORAGE_KEY, []);

  const items = useMemo(
    () =>
      keys
        .filter((key) => key.startsWith(`${connectionId}::`))
        .map((key) => parseKey(connectionId, key))
        .filter((favorite): favorite is FavoriteTable => favorite !== null),
    [keys, connectionId],
  );

  const toggle = useCallback(
    (ref: TableRef) => {
      const key = toKey(connectionId, ref);
      setKeys((previous) =>
        previous.includes(key)
          ? previous.filter((item) => item !== key)
          : [...previous, key],
      );
    },
    [connectionId, setKeys],
  );

  const remove = useCallback(
    (favorite: FavoriteTable) => {
      setKeys((previous) => previous.filter((item) => item !== favorite.id));
    },
    [setKeys],
  );

  const isFavorite = useCallback(
    (ref: TableRef | null) => ref !== null && keys.includes(toKey(connectionId, ref)),
    [keys, connectionId],
  );

  return { items, isFavorite, toggle, remove };
}

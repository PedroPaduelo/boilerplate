import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import type { QueryHistoryEntry } from '../use-query-runner';

/**
 * Histórico de queries da sessão. Clicar reabre o executor já com o SQL — é o
 * caminho mais curto para "roda de novo aquela consulta".
 *
 * O SQL é colapsado em uma linha (`maxLines`) para a linha não crescer; a
 * duração e o número de linhas ficam na descrição, com o horário relativo
 * resolvido pelo `Timestamp` do DS (nada de cálculo de "há 7 min" na mão).
 */
export interface QueryHistoryListProps {
  items: QueryHistoryEntry[];
  onSelect: (entry: QueryHistoryEntry) => void;
}

function toSingleLine(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

export function QueryHistoryList({ items, onSelect }: QueryHistoryListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        isCompact
        headingLevel={4}
        title="Sem queries nesta sessão"
        description="O histórico guarda as consultas executadas até você sair."
      />
    );
  }

  return (
    <List density="compact" hasDividers>
      {items.map((entry) => (
        <ListItem
          key={entry.id}
          onClick={() => onSelect(entry)}
          label={
            <Text type="code" maxLines={1}>
              {toSingleLine(entry.sql)}
            </Text>
          }
          description={
            <HStack gap={1} vAlign="center">
              <Text type="supporting" color="secondary" hasTabularNumbers>
                {entry.durationMs}ms · {entry.rowCount} linha(s)
              </Text>
              <Timestamp
                value={entry.at}
                format="relative"
                type="supporting"
                color="secondary"
              />
            </HStack>
          }
        />
      ))}
    </List>
  );
}

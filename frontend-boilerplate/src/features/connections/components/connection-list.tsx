import { EmptyState } from '@astryxdesign/core/EmptyState';
import { List, ListItem } from '@astryxdesign/core/List';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { connectionStatusView } from '../lib/connection-presentation';
import type { Connection } from '../types';

/**
 * Lista densa das conexões disponíveis, para o painel lateral do workbench.
 *
 * `List`/`ListItem` edge-to-edge com divisores — nunca um `Card` por item: são
 * linhas de navegação, não objetos independentes. Cada item é um link de
 * verdade (`href`), então abrir em nova aba funciona e o roteamento continua
 * client-side via `LinkProvider` do shell.
 */
export interface ConnectionListProps {
  connections: Connection[];
  /** Conexão aberta no momento — recebe o estado selecionado. */
  activeId: string;
}

export function ConnectionList({ connections, activeId }: ConnectionListProps) {
  if (connections.length === 0) {
    return (
      <EmptyState
        isCompact
        headingLevel={4}
        title="Nenhuma conexão visível"
        description="Você só enxerga conexões do seu departamento ou da organização."
      />
    );
  }

  return (
    <List density="compact" hasDividers>
      {connections.map((connection) => {
        const status = connectionStatusView(connection.status);
        return (
          <ListItem
            key={connection.id}
            href={`/connections/${connection.id}`}
            isSelected={connection.id === activeId}
            startContent={<StatusDot variant={status.variant} label={status.label} />}
            label={<Text maxLines={1}>{connection.name}</Text>}
            endContent={
              <Text type="supporting" color="secondary" maxLines={1}>
                {connection.database}
              </Text>
            }
          />
        );
      })}
    </List>
  );
}

/**
 * Lista de conversas do agente.
 *
 * Serve tanto ao painel fixo (desktop) quanto ao diálogo do mobile, por isso não
 * decide largura nem scroll: quem a hospeda é que enquadra.
 *
 * A exclusão NÃO fica aqui: um botão dentro de um item clicável cria alvos de
 * clique aninhados e foco confuso. Ela vive no cabeçalho da conversa aberta.
 */
import { MessageSquare, Plus } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { VStack } from '@astryxdesign/core/Stack';
import type { Conversation } from '../api';

export interface ChatConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRetry: () => void;
}

export function ChatConversationList({
  conversations,
  activeId,
  isLoading,
  error,
  isCreating,
  onSelect,
  onCreate,
  onRetry,
}: ChatConversationListProps) {
  return (
    <VStack gap={3} padding={3}>
      <Button
        label="Nova conversa"
        variant="primary"
        size="sm"
        width="100%"
        icon={<Icon icon={Plus} />}
        isLoading={isCreating}
        onClick={onCreate}
      />

      {isLoading ? (
        <VStack gap={2} aria-busy="true">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} height={32} index={index} />
          ))}
        </VStack>
      ) : null}

      {!isLoading && error ? (
        <Banner
          status="error"
          title="Não foi possível carregar as conversas"
          description={error}
          endContent={<Button size="sm" label="Tentar de novo" onClick={onRetry} />}
        />
      ) : null}

      {!isLoading && !error && conversations.length === 0 ? (
        <EmptyState
          isCompact
          headingLevel={3}
          icon={<Icon icon={MessageSquare} />}
          title="Nenhuma conversa ainda"
          description="Comece uma para perguntar sobre seus dados."
          actions={
            <Button
              size="sm"
              label="Nova conversa"
              onClick={onCreate}
              isLoading={isCreating}
            />
          }
        />
      ) : null}

      {!isLoading && !error && conversations.length > 0 ? (
        <List density="compact">
          {conversations.map((conversation) => (
            <ListItem
              key={conversation.id}
              label={conversation.title}
              startContent={<Icon icon={MessageSquare} size="sm" />}
              isSelected={conversation.id === activeId}
              onClick={() => onSelect(conversation.id)}
            />
          ))}
        </List>
      ) : null}
    </VStack>
  );
}

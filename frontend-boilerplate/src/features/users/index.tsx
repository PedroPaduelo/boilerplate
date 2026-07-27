import { useState } from 'react';
import { Plus, Search, SearchX, Users as UsersIcon } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, StackItem, VStack } from '@astryxdesign/core/Layout';
import { Section } from '@astryxdesign/core/Section';
import { Heading, Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { useAuthStore } from '@/features/auth/store';
import { useUsers, useUserStats } from './hooks/use-users';
import { UserStatsGrid } from './components/user-stats';
import { UsersTable, UsersTableSkeleton } from './components/users-table';
import { UserFormDialog } from './components/user-form-dialog';
import { DeleteUserDialog } from './components/delete-user-dialog';
import type { User } from './types';

export function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const stats = useUserStats();
  const { data, isLoading, isFetching, isError, error, refetch } = useUsers({
    search: debouncedSearch,
    pageSize: 50,
  });

  // Estado dos diálogos de gestão (criar/editar/excluir).
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const openCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const hasSearch = debouncedSearch.trim().length > 0;

  return (
    <VStack gap={6}>
      {/* O h1 da tela é o título da topbar do shell; aqui a hierarquia começa
          no h2 da seção — sem repetir "Usuários" em dois níveis. */}
      <HStack gap={3} vAlign="center" wrap="wrap">
        <StackItem size="fill">
          <Text type="supporting">
            Acompanhe o quadro de usuários, funções e status de acesso do workspace.
          </Text>
        </StackItem>
        <Button
          label="Novo usuário"
          variant="primary"
          icon={<Icon icon={Plus} size="sm" />}
          onClick={openCreate}
        />
      </HStack>

      <UserStatsGrid stats={stats.data} isLoading={stats.isLoading} />

      <Section>
        <VStack gap={4}>
          <HStack gap={3} vAlign="end" wrap="wrap">
            <StackItem size="fill">
              <VStack gap={0.5}>
                <Heading level={2}>Lista de usuários</Heading>
                <Text type="supporting" hasTabularNumbers>
                  {total} {total === 1 ? 'usuário' : 'usuários'} no total.
                </Text>
              </VStack>
            </StackItem>
            <TextInput
              label="Buscar usuários"
              isLabelHidden
              placeholder="Buscar por nome ou e-mail…"
              startIcon={Search}
              hasClear
              isLoading={isFetching}
              value={search}
              onChange={setSearch}
              width={288}
            />
          </HStack>

          <UsersContent
            users={users}
            currentUserId={currentUser?.id}
            hasSearch={hasSearch}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={() => void refetch()}
            onClearSearch={() => setSearch('')}
            onCreate={openCreate}
            onEdit={openEdit}
            onDelete={setDeletingUser}
          />
        </VStack>
      </Section>

      <UserFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} user={editingUser} />
      <DeleteUserDialog
        user={deletingUser}
        open={!!deletingUser}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null);
        }}
      />
    </VStack>
  );
}

interface UsersContentProps {
  users: User[];
  currentUserId: string | undefined;
  hasSearch: boolean;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onClearSearch: () => void;
  onCreate: () => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

/** Os quatro estados da listagem em um só lugar: erro, carregando, vazio, dados. */
function UsersContent({
  users,
  currentUserId,
  hasSearch,
  isLoading,
  isError,
  error,
  onRetry,
  onClearSearch,
  onCreate,
  onEdit,
  onDelete,
}: UsersContentProps) {
  if (isError) {
    return (
      <Banner
        status="error"
        title="Não foi possível carregar os usuários"
        description={getApiErrorMessage(
          error,
          'Verifique sua conexão e tente novamente.',
        )}
        endContent={<Button label="Tentar de novo" size="sm" onClick={onRetry} />}
      />
    );
  }

  if (isLoading) {
    return <UsersTableSkeleton />;
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={<Icon icon={hasSearch ? SearchX : UsersIcon} size="lg" />}
        headingLevel={3}
        title={hasSearch ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
        description={
          hasSearch
            ? 'Ajuste os termos da busca ou verifique a ortografia para encontrar quem você procura.'
            : 'Os usuários do workspace aparecerão aqui assim que forem adicionados.'
        }
        actions={
          hasSearch ? (
            <Button label="Limpar busca" onClick={onClearSearch} />
          ) : (
            <Button label="Novo usuário" variant="primary" onClick={onCreate} />
          )
        }
      />
    );
  }

  return (
    <UsersTable
      users={users}
      currentUserId={currentUserId}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import { hasPermission } from '@/shared/lib/rbac';
import { useAuthStore } from '@/features/auth/store';
import { useConnections, useTestConnection } from '../hooks';
import type { Connection } from '../types';
import { ConnectionFormDialog } from './connection-form-dialog';
import { ConnectionsGrid, ConnectionsGridSkeleton } from './connections-grid';
import { ConnectionsTable } from './connections-table';
import { ConnectionsViewBar, type ConnectionsView } from './connections-view-bar';
import { DeleteConnectionDialog } from './delete-connection-dialog';

/** Chave da preferência de exibição (grade x tabela). */
const VIEW_STORAGE_KEY = 'connections:view';

/**
 * Lista de conexões. O título da página já vem do shell (`TopNav`), então aqui
 * fica só o contexto, a busca e a ação primária — título repetido só gastaria
 * altura.
 *
 * Duas visões do MESMO conjunto, como em `/charts`: a grade (padrão) trata
 * cada conexão como o que ela é — um ponto de entrada para o workbench, com o
 * "Testar" à mão; a tabela continua disponível para quem tem muitas conexões e
 * quer ordenar e comparar coluna a coluna.
 *
 * Os quatro estados estão cobertos: carregando (`Skeleton` com a silhueta da
 * visão ativa), erro (`Banner` acionável), vazio (`EmptyState` com a ação certa
 * para o papel do usuário) e busca sem resultado (`EmptyState` com “limpar
 * busca”).
 */
export function ConnectionsPage() {
  const role = useAuthStore((state) => state.user?.role);
  // RBAC de UI (espelha o backend): manage = criar/editar/excluir.
  const canManage = hasPermission(role, 'connections:manage');

  const { data, isLoading, isError, error, refetch, isFetching } = useConnections({
    pageSize: 100,
  });
  const testConnection = useTestConnection();
  const [search, setSearch] = useState('');
  const [view, setView] = useLocalStorage<ConnectionsView>(VIEW_STORAGE_KEY, 'grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Connection | null>(null);
  const [deleting, setDeleting] = useState<Connection | null>(null);

  const connections = useMemo(() => data?.connections ?? [], [data]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return connections;
    return connections.filter((connection) =>
      `${connection.name} ${connection.host} ${connection.database}`
        .toLowerCase()
        .includes(query),
    );
  }, [connections, search]);

  // Uma única mutação atende a grade inteira; `variables` diz QUAL conexão está
  // em voo, para o spinner ficar só no card certo.
  const testingId = testConnection.isPending ? (testConnection.variables ?? null) : null;

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = (connection: Connection) => {
    setEditing(connection);
    setIsFormOpen(true);
  };

  return (
    <VStack gap={4}>
      <HStack gap={3} justify="between" vAlign="center" wrap="wrap">
        <Text type="supporting" maxLines={2}>
          Bancos PostgreSQL disponíveis para a plataforma. Abra uma conexão para explorar
          schema, índices e chaves — e rodar consultas read-only.
        </Text>
        {canManage ? (
          <Button
            label="Nova conexão"
            variant="primary"
            icon={<Icon icon={Plus} />}
            onClick={openCreate}
          />
        ) : null}
      </HStack>

      <TextInput
        label="Buscar conexão"
        isLabelHidden
        value={search}
        onChange={setSearch}
        placeholder="Nome, host ou banco…"
        startIcon={Search}
        hasClear
        width={360}
        isDisabled={!isLoading && connections.length === 0}
        disabledMessage="Nenhuma conexão para filtrar."
      />

      {isLoading ? (
        view === 'grid' ? (
          <ConnectionsGridSkeleton />
        ) : (
          <VStack gap={1} aria-busy="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} index={index} width="100%" height={44} radius={2} />
            ))}
          </VStack>
        )
      ) : isError ? (
        <Banner
          status="error"
          title="Não foi possível carregar as conexões"
          description={getApiErrorMessage(error, 'Tente novamente em instantes.')}
          endContent={
            <Button
              label="Tentar novamente"
              size="sm"
              isLoading={isFetching}
              onClick={() => refetch()}
            />
          }
        />
      ) : connections.length === 0 ? (
        <EmptyState
          headingLevel={2}
          title="Nenhuma conexão cadastrada"
          description={
            canManage
              ? 'Cadastre uma conexão PostgreSQL somente-leitura para começar a explorar dados.'
              : 'Peça a um administrador para cadastrar e compartilhar uma conexão com seu departamento.'
          }
          actions={
            canManage ? (
              <Button
                label="Nova conexão"
                variant="primary"
                icon={<Icon icon={Plus} />}
                onClick={openCreate}
              />
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          headingLevel={2}
          isCompact
          title="Nenhuma conexão para esta busca"
          description={`Nada casa com “${search.trim()}”.`}
          actions={<Button label="Limpar busca" onClick={() => setSearch('')} />}
        />
      ) : (
        <VStack gap={3}>
          <ConnectionsViewBar
            count={filtered.length}
            view={view}
            onViewChange={setView}
          />

          {view === 'grid' ? (
            <ConnectionsGrid
              connections={filtered}
              canManage={canManage}
              testingId={testingId}
              onTest={(connection) => testConnection.mutate(connection.id)}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          ) : (
            <ConnectionsTable
              connections={filtered}
              canManage={canManage}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          )}
        </VStack>
      )}

      {canManage ? (
        <>
          <ConnectionFormDialog
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            connection={editing}
          />
          <DeleteConnectionDialog
            connection={deleting}
            isOpen={deleting !== null}
            onOpenChange={(isOpen) => {
              if (!isOpen) setDeleting(null);
            }}
          />
        </>
      ) : null}
    </VStack>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Database } from 'lucide-react';
import { Center } from '@astryxdesign/core/Center';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { Layout, LayoutContent, LayoutPanel } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { ResizeHandle, useResizable } from '@astryxdesign/core/Resizable';
import { hasPermission } from '@/shared/lib/rbac';
import { useAuthStore } from '@/features/auth/store';
import {
  useConnection,
  useConnections,
  useConnectionSchema,
  useTestConnection,
} from '../hooks';
import { countTables, findTable } from '../lib/schema-search';
import { toDatabaseSchema } from '../lib/schema-mapper';
import { useQueryRunner } from '../use-query-runner';
import { useWorkbenchFavorites } from '../use-workbench-favorites';
import { ConnectionFormDialog } from './connection-form-dialog';
import { DbSchemaExplorer } from './db-schema-explorer';
import { DeleteConnectionDialog } from './delete-connection-dialog';
import { QueryRunnerDialog } from './query-runner-dialog';
import { TableInfoPanel } from './table-info-panel';
import { WorkbenchHeader } from './workbench-header';
import { WorkbenchSidebar } from './workbench-sidebar';
import { WorkbenchSkeleton } from './workbench-skeleton';
import { WorkbenchStatusBar } from './workbench-status-bar';
import type { TableRef } from './db-schema-explorer-types';

/**
 * Workbench da conexão (full-bleed: o shell não dá padding nesta rota).
 *
 * Um `Layout` único organiza a tela em regiões que se comportam como um IDE:
 *   - `header`  — identidade + ações da conexão;
 *   - `start`   — navegador de schema (árvore), redimensionável;
 *   - `content` — detalhe da tabela selecionada (precisa da largura: tabelas e DDL);
 *   - `end`     — sessão (outras conexões, favoritos, histórico), redimensionável;
 *   - `footer`  — barra de status.
 *
 * Cada região controla o PRÓPRIO scroll (`LayoutContent`/`LayoutPanel`
 * `isScrollable`): nada de scroll duplo, e o cabeçalho/rodapé nunca somem.
 */
export function ConnectionDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role);
  const canManage = hasPermission(role, 'connections:manage');

  const [selected, setSelected] = useState<TableRef | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const connectionQuery = useConnection(id);
  const connectionsQuery = useConnections({ pageSize: 100 });
  const schemaQuery = useConnectionSchema(id, true);
  const testConnection = useTestConnection();
  const favorites = useWorkbenchFavorites(id);
  const runner = useQueryRunner(id);

  // Larguras persistidas por painel: quem trabalha aqui todo dia calibra uma vez.
  const treePanel = useResizable({
    defaultSize: 300,
    minSizePx: 220,
    maxSizePx: 480,
    autoSaveId: 'connections:workbench:tree',
  });
  const sessionPanel = useResizable({
    defaultSize: 288,
    minSizePx: 220,
    maxSizePx: 420,
    autoSaveId: 'connections:workbench:session',
  });

  const connection = connectionQuery.data;
  const schema = schemaQuery.data;

  const database = useMemo(
    () => (schema && connection ? toDatabaseSchema(schema, connection) : null),
    [schema, connection],
  );
  const selectedTable = useMemo(
    () => findTable(database?.schemas ?? [], selected),
    [database, selected],
  );

  if (connectionQuery.isLoading) {
    return <WorkbenchSkeleton />;
  }

  if (connectionQuery.isError || !connection) {
    return (
      <Center height="100%">
        <EmptyState
          headingLevel={2}
          icon={<Icon icon={Database} size="lg" color="secondary" />}
          title="Conexão não encontrada"
          description="Ela pode ter sido removida ou você não tem acesso a ela."
          actions={
            <Link href="/connections" isStandalone>
              Voltar para conexões
            </Link>
          }
        />
      </Center>
    );
  }

  const truncatedNotice =
    schema?.truncated && schema.totalTables
      ? `Mostrando ${schema.tableCount} de ${schema.totalTables} tabelas — o restante foi omitido para manter a performance.`
      : null;
  const inactiveReason = connection.isActive
    ? undefined
    : 'Conexão inativa — reative para consultar.';

  return (
    <>
      <Layout
        height="fill"
        header={
          <WorkbenchHeader
            connection={connection}
            schema={schema}
            canManage={canManage}
            isTesting={testConnection.isPending}
            isRefreshing={schemaQuery.isFetching}
            onTest={() => testConnection.mutate(connection.id)}
            onRefresh={() => schemaQuery.refetch()}
            onOpenQueryRunner={() => runner.open()}
            onEdit={() => setIsFormOpen(true)}
            onDelete={() => setIsDeleteOpen(true)}
          />
        }
        start={
          <>
            <LayoutPanel
              width={treePanel.size}
              padding={0}
              isScrollable={false}
              label="Navegador de schema"
            >
              <DbSchemaExplorer
                database={database}
                isLoading={schemaQuery.isLoading}
                error={schemaQuery.isError ? schemaQuery.error : null}
                isRefreshing={schemaQuery.isFetching}
                onRetry={() => schemaQuery.refetch()}
                selected={selected}
                onSelect={setSelected}
                truncatedNotice={truncatedNotice}
              />
            </LayoutPanel>
            <ResizeHandle
              direction="horizontal"
              hasDivider
              resizable={treePanel.props}
              label="Redimensionar navegador de schema"
            />
          </>
        }
        content={
          <LayoutContent isScrollable padding={4} label="Detalhe da tabela">
            <TableInfoPanel
              table={selectedTable}
              engine={database?.engine ?? 'postgresql'}
              isFavorite={favorites.isFavorite(selected)}
              onToggleFavorite={() => selected && favorites.toggle(selected)}
              onNavigateFk={setSelected}
              onPreviewQuery={(sql) => runner.open(sql)}
              isQueryDisabled={!connection.isActive}
              queryDisabledReason={inactiveReason}
            />
          </LayoutContent>
        }
        end={
          <>
            <ResizeHandle
              direction="horizontal"
              hasDivider
              isReversed
              resizable={sessionPanel.props}
              label="Redimensionar painel de sessão"
            />
            <LayoutPanel
              width={sessionPanel.size}
              padding={0}
              isScrollable
              label="Sessão de trabalho"
            >
              <WorkbenchSidebar
                connectionId={id}
                connections={connectionsQuery.data?.connections ?? []}
                favorites={favorites.items}
                history={runner.history}
                onSelectFavorite={(favorite) =>
                  setSelected({ schema: favorite.schema, table: favorite.table })
                }
                onRemoveFavorite={favorites.remove}
                onSelectQuery={(entry) => runner.open(entry.sql)}
              />
            </LayoutPanel>
          </>
        }
        footer={
          <WorkbenchStatusBar
            connection={connection}
            visibleTables={countTables(database?.schemas ?? [])}
            isRunningQuery={runner.isPending}
            lastDurationMs={runner.lastDurationMs}
            serverVersion={schema?.database?.version}
          />
        }
      />

      <QueryRunnerDialog
        isOpen={runner.isOpen}
        onOpenChange={(isOpen) => (isOpen ? runner.open() : runner.close())}
        connectionName={connection.name}
        sql={runner.sql}
        onSqlChange={runner.setSql}
        onRun={runner.run}
        isPending={runner.isPending}
        result={runner.result}
      />

      {canManage ? (
        <>
          <ConnectionFormDialog
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            connection={connection}
          />
          <DeleteConnectionDialog
            connection={connection}
            isOpen={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onDeleted={() => navigate('/connections')}
          />
        </>
      ) : null}
    </>
  );
}

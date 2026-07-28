import { useEffect, useMemo, useState } from 'react';
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
import { buildSelectPreview } from '../lib/ddl';
import { countTables, findTable } from '../lib/schema-search';
import { toDatabaseSchema } from '../lib/schema-mapper';
import { useQueryRunner } from '../use-query-runner';
import { useWorkbenchFavorites } from '../use-workbench-favorites';
import { ConnectionFormDialog } from './connection-form-dialog';
import { DbSchemaExplorer } from './db-schema-explorer';
import { DeleteConnectionDialog } from './delete-connection-dialog';
import { TableInfoPanel, type TableDetailTab } from './table-info-panel';
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
 *   - `content` — inspetor da tabela: dados, colunas, relações, índices, DDL;
 *   - `end`     — sessão (outras conexões, favoritos, histórico), redimensionável;
 *   - `footer`  — barra de status.
 *
 * Cada região controla o PRÓPRIO scroll (`LayoutContent`/`LayoutPanel`
 * `isScrollable`): nada de scroll duplo, e o cabeçalho/rodapé nunca somem.
 *
 * A consulta NÃO é mais um modal. O editor vive na aba "Dados" do inspetor,
 * em split view — antes o modal cobria a árvore justamente quando o usuário
 * precisava dela para escrever a query. Por isso a aba ativa é estado DESTA
 * página: os botões "Query" (cabeçalho) e "Consultar" (inspetor) precisam
 * conseguir trazer o usuário para a aba certa.
 */
export function ConnectionDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role);
  const canManage = hasPermission(role, 'connections:manage');

  const [selected, setSelected] = useState<TableRef | null>(null);
  const [tab, setTab] = useState<TableDetailTab>('data');
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

  const isActive = connection?.isActive ?? false;
  const { loadPreset } = runner;
  const selectedSchema = selectedTable?.schema;
  const selectedName = selectedTable?.name;

  /**
   * Trocou de tabela → o editor recebe o SELECT dela e já executa. É o que faz
   * a aba "Dados" responder "o que tem aqui dentro?" sem ninguém digitar SQL.
   * Depende só de escalares + do `loadPreset` (estável), nunca do objeto
   * `runner` — que muda a cada render e viraria laço.
   */
  useEffect(() => {
    if (!selectedSchema || !selectedName || !isActive) return;
    loadPreset(buildSelectPreview(selectedSchema, selectedName));
  }, [selectedSchema, selectedName, isActive, loadPreset]);

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
  // Sem tabela selecionada não há onde abrir o editor: o botão barra com
  // motivo em vez de levar a uma aba vazia.
  const queryDisabledReason =
    inactiveReason ??
    (selectedTable ? undefined : 'Selecione uma tabela na árvore para consultar.');

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
            isQueryDisabled={Boolean(queryDisabledReason)}
            queryDisabledReason={queryDisabledReason}
            onTest={() => testConnection.mutate(connection.id)}
            onRefresh={() => schemaQuery.refetch()}
            onOpenQueryRunner={() => setTab('data')}
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
          <LayoutContent isScrollable padding={5} label="Detalhe da tabela">
            <TableInfoPanel
              table={selectedTable}
              engine={database?.engine ?? 'postgresql'}
              tab={tab}
              onTabChange={setTab}
              isFavorite={favorites.isFavorite(selected)}
              onToggleFavorite={() => selected && favorites.toggle(selected)}
              onNavigateFk={setSelected}
              sql={runner.sql}
              onSqlChange={runner.setSql}
              onRunQuery={runner.run}
              isQueryPending={runner.isPending}
              queryResult={runner.result}
              queryErrorMessage={runner.errorMessage}
              onOpenQuery={() => setTab('data')}
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
                onSelectQuery={(entry) => {
                  setTab('data');
                  runner.loadPreset(entry.sql);
                }}
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

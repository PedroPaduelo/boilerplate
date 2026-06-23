import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Check,
  Clock,
  Copy,
  Database as DatabaseIcon,
  History,
  Loader2,
  Pencil,
  Play,
  PlugZap,
  RefreshCw,
  Table2,
  Terminal,
  Trash2,
  Wifi,
} from 'lucide-react';

import {
  Badge,
  Button,
  Skeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { ConnectionList } from '@/components/ui/connection-list';
import { DatabaseTabBar } from '@/components/ui/database-tab-bar';
import { FavoritesList } from '@/components/ui/favorites-list';
import { QueryHistoryList } from '@/components/ui/query-history-list';
import { TableInfoPanel } from '@/components/ui/table-info-panel';
import { WorkbenchStatusBar } from '@/components/ui/workbench-status-bar';
import { DbSchemaExplorer } from '@/components/ui/db-schema-explorer';
import type { TableDef } from '@/components/ui/db-schema-explorer-types';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/features/auth/store';
import { hasPermission } from '@/shared/lib/rbac';

import {
  useConnection,
  useConnections,
  useConnectionSchema,
  useRunConnectionQuery,
  useTestConnection,
} from '../hooks';
import { toDatabaseSchema, shortServerVersion } from '../lib/schema-mapper';
import type { Connection, QueryResult } from '../types';
import { ConnectionFormDialog } from './connection-form-dialog';
import { DeleteConnectionDialog } from './delete-connection-dialog';

/* -------------------------------------------------------------------------- */
/*                                 helpers                                     */
/* -------------------------------------------------------------------------- */

function formatBytes(bytes?: number | null): string {
  if (bytes == null || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 || i === 0 ? Math.round(v) : Math.round(v * 10) / 10} ${units[i]}`;
}

function formatRelative(ts: number): string {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return 'agora há pouco';
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr}h`;
  return `há ${Math.floor(hr / 24)}d`;
}

function statusTone(status: string): 'online' | 'offline' | 'warning' {
  const s = (status ?? '').toUpperCase();
  if (s === 'OK' || s === 'ACTIVE' || s === 'CONNECTED') return 'online';
  if (s === 'ERROR' || s === 'FAILED' || s === 'INACTIVE') return 'warning';
  return 'offline';
}

interface RecentQuery {
  id: string;
  sql: string;
  durationMs: number;
  rowCount: number;
  at: number;
}

/** Converte um TableDef (Vitrine) para o shape do TableInfoPanel. */
function toTableInfo(table: TableDef) {
  return {
    name: table.name,
    columns: table.columns.map((c) => ({
      name: c.name,
      type: c.type,
      nullable: c.nullable,
      isPrimary: c.isPrimary,
      isForeign: c.isForeign,
    })),
    indexes: table.indexes.map((i) => ({
      name: i.name,
      type: i.type,
      columns: i.columns,
    })),
    foreignKeys: table.foreignKeys.map((fk) => ({
      name: fk.name,
      columns: fk.columns,
      references: fk.references,
      onDelete: fk.onDelete,
    })),
    rowCount: table.rowCount,
    sizeMB: table.sizeMB,
    description: table.description,
  };
}

/* ----------------------------- favoritos (LS) ----------------------------- */

const FAV_KEY = 'conn-workbench:favorites';

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function persistFavorites(favs: Set<string>) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));
  } catch {
    /* ignore */
  }
}

/* -------------------------------------------------------------------------- */
/*                                componente                                  */
/* -------------------------------------------------------------------------- */

export function ConnectionDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = hasPermission(role, 'connections:manage');

  // Dialogs de gerenciamento (editar/excluir).
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: connection, isLoading: loadingConn, isError: connError } =
    useConnection(id);
  const { data: allConnections } = useConnections({ pageSize: 100 });
  const {
    data: schema,
    isLoading: loadingSchema,
    isError: schemaError,
    error: schemaErr,
    refetch: refetchSchema,
    isFetching: fetchingSchema,
  } = useConnectionSchema(id, true);

  const testConnection = useTestConnection();
  const runQuery = useRunConnectionQuery();

  // Tabela selecionada (compartilhada entre árvore central, favoritos e FK).
  const [selectedRef, setSelectedRef] = useState<{
    schema: string;
    table: string;
  } | null>(null);

  // Seções da sidebar
  const [openSections, setOpenSections] = useState({
    connections: true,
    favorites: true,
    history: true,
  });

  // Favoritos (localStorage, namespaced por conexão)
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  useEffect(() => persistFavorites(favorites), [favorites]);

  // Histórico de queries (sessão) + última duração
  const [history, setHistory] = useState<RecentQuery[]>([]);
  const [lastActionMs, setLastActionMs] = useState<number | null>(null);

  // Query runner dialog
  const [queryOpen, setQueryOpen] = useState(false);
  const [sql, setSql] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);

  // Copy feedback (versão do banco)
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const database = useMemo(
    () => (schema && connection ? toDatabaseSchema(schema, connection) : null),
    [schema, connection],
  );

  // TableDef selecionado (busca em todas as schemas)
  const selectedTable: TableDef | null = useMemo(() => {
    if (!database || !selectedRef) return null;
    for (const s of database.schemas) {
      if (s.name !== selectedRef.schema) continue;
      const t = s.tables.find((tab) => tab.name === selectedRef.table);
      if (t) return t;
    }
    // fallback: procura em qualquer schema (FK pode apontar p/ outro)
    for (const s of database.schemas) {
      const t = s.tables.find((tab) => tab.name === selectedRef.table);
      if (t) return t;
    }
    return null;
  }, [database, selectedRef]);

  const favKey = (s: string, t: string) => `${id}::${s}.${t}`;
  const favoriteItems = useMemo(
    () =>
      [...favorites]
        .filter((k) => k.startsWith(`${id}::`))
        .map((k) => ({ id: k, label: k.replace(`${id}::`, '') })),
    [favorites, id],
  );

  const toggleFavorite = (s: string, t: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      const key = favKey(s, t);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const connectionItems = useMemo(
    () =>
      (allConnections?.connections ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        meta: c.database,
        status: statusTone(c.status),
      })),
    [allConnections],
  );

  // Tabs: conexão atual primeiro, demais em seguida (até 8).
  const tabs = useMemo(() => {
    const list = allConnections?.connections ?? [];
    const ordered = connection
      ? [connection, ...list.filter((c) => c.id !== connection.id)]
      : list;
    return ordered.slice(0, 8).map((c) => ({ id: c.id, label: c.name, icon: DatabaseIcon }));
  }, [allConnections, connection]);

  const goToConnection = (cid: string) => {
    if (cid !== id) navigate(`/connections/${cid}`);
  };

  const openQueryRunner = (presetSql?: string) => {
    if (presetSql) setSql(presetSql);
    else if (!sql && selectedRef)
      setSql(`SELECT *\nFROM ${selectedRef.schema}.${selectedRef.table}\nLIMIT 50;`);
    setQueryOpen(true);
  };

  const executeQuery = () => {
    const trimmed = sql.trim();
    if (!trimmed) return;
    runQuery.mutate(
      { id, sql: trimmed, maxRows: 100 },
      {
        onSuccess: (res) => {
          setQueryResult(res);
          setLastActionMs(res.durationMs);
          setHistory((prev) =>
            [
              {
                id: `q-${Date.now()}`,
                sql: trimmed,
                durationMs: res.durationMs,
                rowCount: res.rowCount,
                at: Date.now(),
              },
              ...prev,
            ].slice(0, 20),
          );
        },
      },
    );
  };

  const copyVersion = async () => {
    const v = schema?.database?.version ?? '';
    try {
      await navigator.clipboard?.writeText(v);
    } catch {
      /* ignore */
    }
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  /* ----------------------------- estados base ----------------------------- */

  if (loadingConn) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-[60vh] w-full rounded-xl" />
      </div>
    );
  }

  if (connError || !connection) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <DatabaseIcon className="size-6" />
        </span>
        <p className="text-sm font-medium text-foreground">Conexão não encontrada</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Ela pode ter sido removida ou você não tem acesso a ela.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/connections')}>
          <ArrowLeft className="size-4" />
          Voltar para conexões
        </Button>
      </div>
    );
  }

  const conn: Connection = connection;
  const tone = statusTone(conn.status);
  const tablesVisible = database
    ? database.schemas.reduce((a, s) => a + s.tables.length, 0)
    : 0;

  return (
    <div className="flex h-[calc(100vh-7.5rem)] min-h-[600px] flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground">
      {/* ===================== TOPBAR ===================== */}
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-card px-3 py-2 lg:gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Voltar"
          title="Voltar para conexões"
          onClick={() => navigate('/connections')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <DatabaseIcon className="size-4" />
          </span>
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate text-sm font-bold tracking-tight" title={conn.name}>
              {conn.name}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {database ? database.schemas.length : '—'} schemas ·{' '}
              {schema ? schema.tableCount : '—'} tabelas
            </p>
          </div>
        </div>

        <div className="mx-1 hidden h-6 w-px shrink-0 bg-border lg:mx-2 lg:block" />

        <Badge
          variant="outline"
          className="hidden gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-500 sm:inline-flex"
        >
          <DatabaseIcon className="size-3 shrink-0" />
          <span className="whitespace-nowrap">
            PostgreSQL {shortServerVersion(schema?.database?.version)}
          </span>
        </Badge>
        <span className="hidden font-mono text-xs text-muted-foreground xl:inline">
          {conn.host}:{conn.port}/{conn.database}
        </span>
        {schema?.database?.sizeBytes ? (
          <span className="hidden font-mono text-xs text-muted-foreground xl:inline">
            · {formatBytes(schema.database.sizeBytes)}
          </span>
        ) : null}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => testConnection.mutate(conn.id)}
            disabled={testConnection.isPending}
            className="hidden md:inline-flex"
          >
            <PlugZap className={cn('size-3.5', testConnection.isPending && 'animate-pulse')} />
            Testar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchSchema()}
            disabled={fetchingSchema}
            className="hidden md:inline-flex"
          >
            <RefreshCw className={cn('size-3.5', fetchingSchema && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openQueryRunner()}
            className="hidden lg:inline-flex"
          >
            <Terminal className="size-3.5" />
            Query
          </Button>
          {canManage ? (
            <>
              <Button
                variant="outline"
                size="icon"
                aria-label="Editar conexão"
                title="Editar conexão"
                className="size-8"
                onClick={() => setFormOpen(true)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Excluir conexão"
                title="Excluir conexão"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </>
          ) : null}
        </div>
      </header>

      {/* ===================== TABS ===================== */}
      <div className="overflow-x-auto">
        <DatabaseTabBar
          tabs={tabs}
          activeId={id}
          onSelect={goToConnection}
          newLabel="Conexões"
        />
      </div>

      {/* aviso de truncamento */}
      {schema?.truncated ? (
        <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-3.5 shrink-0" />
          Banco grande: mostrando {schema.tableCount} de {schema.totalTables} tabelas
          (as demais foram omitidas para manter a performance).
        </div>
      ) : null}

      {/* ===================== MAIN ===================== */}
      <div className="flex min-h-0 min-w-0 flex-1">
        {/* sidebar */}
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-border bg-card/40 md:flex lg:w-[240px] xl:w-[260px]">
          <ScrollArea className="flex-1">
            <CollapsibleSection
              title="Conexões"
              icon={<Wifi className="size-3.5" />}
              open={openSections.connections}
              onOpenChange={(o) => setOpenSections((p) => ({ ...p, connections: o }))}
              action={
                <span className="rounded bg-muted/60 px-1 text-[9px] tabular-nums">
                  {connectionItems.length}
                </span>
              }
              className="border-b border-border/60"
              headerClassName="gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/30 hover:text-foreground"
            >
              <ConnectionList
                items={connectionItems}
                activeId={id}
                onSelect={goToConnection}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Favoritos"
              icon={<Bookmark className="size-3.5" />}
              open={openSections.favorites}
              onOpenChange={(o) => setOpenSections((p) => ({ ...p, favorites: o }))}
              action={
                <span className="rounded bg-muted/60 px-1 text-[9px] tabular-nums">
                  {favoriteItems.length}
                </span>
              }
              className="border-b border-border/60"
              headerClassName="gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/30 hover:text-foreground"
            >
              <FavoritesList
                items={favoriteItems}
                onSelect={(favId) => {
                  const [s, t] = favId.replace(`${id}::`, '').split('.');
                  if (s && t) setSelectedRef({ schema: s, table: t });
                }}
                onRemove={(favId) => {
                  const [s, t] = favId.replace(`${id}::`, '').split('.');
                  if (s && t) toggleFavorite(s, t);
                }}
                emptyLabel="Favorite uma tabela no painel à direita"
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Histórico de queries"
              icon={<History className="size-3.5" />}
              open={openSections.history}
              onOpenChange={(o) => setOpenSections((p) => ({ ...p, history: o }))}
              action={
                <span className="rounded bg-muted/60 px-1 text-[9px] tabular-nums">
                  {history.length}
                </span>
              }
              className="border-b border-border/60"
              headerClassName="gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/30 hover:text-foreground"
            >
              {history.length === 0 ? (
                <p className="px-2 py-1 text-[10px] italic text-muted-foreground/60">
                  Nenhuma query executada nesta sessão
                </p>
              ) : (
                <QueryHistoryList
                  items={history.map((q) => ({
                    id: q.id,
                    sql: q.sql,
                    durationMs: q.durationMs,
                    timeLabel: formatRelative(q.at),
                  }))}
                  onSelect={(item) => {
                    const q = history.find((h) => h.id === item.id);
                    if (q) openQueryRunner(q.sql);
                  }}
                />
              )}
            </CollapsibleSection>
          </ScrollArea>
        </aside>

        {/* centro: explorer */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {loadingSchema ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          ) : schemaError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="size-6" />
              </span>
              <p className="text-sm font-medium text-foreground">
                Não foi possível introspeccionar o schema
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {(schemaErr as Error)?.message ??
                  'Verifique a conectividade da conexão e tente novamente.'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetchSchema()}>
                <RefreshCw className="size-4" />
                Tentar novamente
              </Button>
            </div>
          ) : database && database.schemas.length > 0 ? (
            <DbSchemaExplorer
              database={database}
              embedded
              onTableClick={(ref) => setSelectedRef(ref)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Table2 className="size-6" />
              </span>
              <p className="text-sm font-medium text-foreground">Nenhuma tabela encontrada</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                A introspecção não retornou tabelas para esta conexão.
              </p>
            </div>
          )}
        </main>

        {/* painel direito: info da tabela */}
        <aside className="hidden w-[280px] shrink-0 flex-col border-l border-border bg-card/40 xl:flex">
          <TableInfoPanel
            table={selectedTable ? toTableInfo(selectedTable) : null}
            schemaName={selectedRef?.schema}
            isFavorite={
              selectedRef ? favorites.has(favKey(selectedRef.schema, selectedRef.table)) : false
            }
            onToggleFavorite={
              selectedRef
                ? () => toggleFavorite(selectedRef.schema, selectedRef.table)
                : undefined
            }
            onNavigateFk={(ref) => setSelectedRef({ schema: ref.schema, table: ref.table })}
          />
        </aside>
      </div>

      {/* ===================== STATUS BAR ===================== */}
      <WorkbenchStatusBar
        left={
          <>
            <span className="flex shrink-0 items-center gap-1">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  tone === 'online'
                    ? 'bg-emerald-500'
                    : tone === 'warning'
                      ? 'bg-rose-500'
                      : 'bg-gray-400',
                )}
                aria-hidden
              />
              {tone === 'online' ? 'conectado' : tone === 'warning' ? 'erro' : 'não testado'}
            </span>
            <span className="hidden shrink-0 items-center gap-1 sm:flex">
              <DatabaseIcon className="size-3" />
              <span className="max-w-[160px] truncate" title={conn.database}>
                {conn.database}
              </span>
            </span>
            <span className="hidden shrink-0 md:inline">read-only</span>
          </>
        }
        right={
          <>
            {runQuery.isPending ? (
              <span className="flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                executando…
              </span>
            ) : lastActionMs !== null ? (
              <span className="flex items-center gap-1">
                <Activity className="size-3" />
                <span className="hidden sm:inline">última query: </span>
                {lastActionMs}ms
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Activity className="size-3" />
                <span className="hidden sm:inline">idle</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              <span className="hidden sm:inline">{tablesVisible} tabelas visíveis</span>
              <span className="sm:hidden">{tablesVisible} tab</span>
            </span>
            {schema?.database?.version ? (
              <button
                type="button"
                onClick={copyVersion}
                title={schema.database.version}
                className="hidden items-center gap-1 hover:text-foreground lg:flex"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {shortServerVersion(schema.database.version)}
              </button>
            ) : null}
          </>
        }
      />

      {/* ===================== QUERY RUNNER DIALOG ===================== */}
      <Dialog
        open={queryOpen}
        onOpenChange={(open) => {
          setQueryOpen(open);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-primary" />
              <DialogTitle>Executar query</DialogTitle>
              <Badge
                variant="outline"
                className="ml-auto gap-1 border-sky-500/30 bg-sky-500/10 text-sky-500"
              >
                <DatabaseIcon className="size-3" />
                {conn.name}
              </Badge>
            </div>
            <DialogDescription>
              Apenas <code className="font-mono">SELECT</code> / <code className="font-mono">WITH</code>{' '}
              (read-only). Máx. 100 linhas no preview.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  executeQuery();
                }
              }}
              spellCheck={false}
              placeholder="SELECT * FROM public.minha_tabela LIMIT 50;"
              className="h-32 w-full resize-y rounded-md border border-border bg-muted/30 p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                {queryResult
                  ? `${queryResult.rowCount} linha(s) · ${queryResult.durationMs}ms${
                      queryResult.truncated ? ' · truncado' : ''
                    }`
                  : 'Ctrl/Cmd + Enter para executar'}
              </p>
              <Button
                size="sm"
                onClick={executeQuery}
                disabled={runQuery.isPending || !sql.trim()}
              >
                {runQuery.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Play className="size-3.5" />
                )}
                Executar
              </Button>
            </div>

            {queryResult ? (
              <div className="max-h-[320px] overflow-auto rounded-md border border-border">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 bg-muted/60">
                    <tr>
                      {queryResult.columns.map((c) => (
                        <th
                          key={c.name}
                          className="border-b border-border px-2 py-1.5 font-mono font-semibold"
                        >
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row, ri) => (
                      <tr key={ri} className="even:bg-muted/20">
                        {queryResult.columns.map((c) => (
                          <td
                            key={c.name}
                            className="max-w-[260px] truncate border-b border-border/40 px-2 py-1 font-mono"
                            title={fmtCell(row[c.name])}
                          >
                            {fmtCell(row[c.name])}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {queryResult.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={Math.max(1, queryResult.columns.length)}
                          className="px-2 py-4 text-center text-muted-foreground"
                        >
                          Nenhuma linha retornada.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQueryOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== MANAGE DIALOGS ===================== */}
      {canManage ? (
        <>
          <ConnectionFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            connection={conn}
          />
          <DeleteConnectionDialog
            connection={conn}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
        </>
      ) : null}
    </div>
  );
}

function fmtCell(v: unknown): string {
  if (v === null || v === undefined) return '∅';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export default ConnectionDetailPage;

import * as React from "react"
import { Activity, Database, Search, X } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  DatabaseInstance,
  DbEnvironment,
  DbEngine,
  DbOverviewGridProps,
  DbOverviewGridSortBy,
  DbStatus,
  DbTableSummary,
} from "./db-overview-grid-types"

/* -------------------------------------------------------------------------- */
/*                       Tabelas de cor (semânticas)                           */
/* -------------------------------------------------------------------------- */

/** Cores semânticas por env (convenção do projeto). */
const ENV_STYLES: Record<
  DbEnvironment,
  { chip: string; ring: string; label: string }
> = {
  prod: {
    chip: "bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300",
    ring: "ring-rose-500/30",
    label: "Production",
  },
  homolog: {
    chip: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
    ring: "ring-amber-500/30",
    label: "Homolog",
  },
  staging: {
    chip: "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-300",
    ring: "ring-sky-500/30",
    label: "Staging",
  },
  dev: {
    chip: "bg-zinc-500/15 text-zinc-700 border-zinc-500/30 dark:text-zinc-300",
    ring: "ring-zinc-500/30",
    label: "Development",
  },
}

/** Cores semânticas por status. */
const STATUS_STYLES: Record<
  DbStatus,
  { dot: string; label: string; ring: string }
> = {
  healthy: {
    dot: "bg-emerald-500",
    label: "Healthy",
    ring: "ring-emerald-500/20",
  },
  degraded: {
    dot: "bg-amber-500",
    label: "Degraded",
    ring: "ring-amber-500/20",
  },
  offline: {
    dot: "bg-rose-500",
    label: "Offline",
    ring: "ring-rose-500/20",
  },
}

const ENGINE_LABEL: Record<DbEngine, string> = {
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  sqlserver: "SQL Server",
  oracle: "Oracle",
  sqlite: "SQLite",
}

const SORT_LABEL: Record<DbOverviewGridSortBy, string> = {
  name: "Nome",
  connections: "Conexões",
  size: "Tamanho",
  latency: "Latência",
  status: "Status",
}

/* -------------------------------------------------------------------------- */
/*                          Helpers de formatação                              */
/* -------------------------------------------------------------------------- */

function formatBytes(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`
  }
  return `${mb.toFixed(0)} MB`
}

function formatTimeAgo(iso: string | undefined, now: number): string {
  if (!iso) return "no backup"
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return "no backup"
  const diffMs = Math.max(0, now - then)
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return "agora"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function compareStatus(a: DbStatus, b: DbStatus): number {
  // Prioridade de SRE: offline > degraded > healthy
  const order: Record<DbStatus, number> = {
    offline: 0,
    degraded: 1,
    healthy: 2,
  }
  return order[a] - order[b]
}

/* -------------------------------------------------------------------------- */
/*                              Subcomponentes                                 */
/* -------------------------------------------------------------------------- */

function MiniBar({
  label,
  used,
  total,
  unit = "",
}: {
  label: string
  used: number
  total: number
  unit?: string
}) {
  const safeTotal = total > 0 ? total : 1
  const ratio = clampPercent(used / safeTotal)
  const pctLabel = `${Math.round(ratio * 100)}%`
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="uppercase tracking-wide">{label}</span>
        <span className="font-mono">
          {formatNumber(used)}
          {unit ? ` ${unit}` : ""} / {formatNumber(total)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-foreground/70 transition-[width] duration-300"
          style={{ width: `${pctLabel}` }}
        />
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-sm font-medium text-foreground">
        {value}
      </span>
      {hint ? (
        <span className="text-[10px] text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  )
}

function DatabaseTile({
  database,
  now,
  onClick,
}: {
  database: DatabaseInstance
  now: number
  onClick: (db: DatabaseInstance) => void
}) {
  const env = ENV_STYLES[database.env]
  const status = STATUS_STYLES[database.status]
  const sizeTotal = database.sizeLimitMB ?? Math.max(database.sizeMB, 1)
  const topTables: DbTableSummary[] = database.topTables.slice(0, 3)

  return (
    <button
      type="button"
      data-slot="db-overview-tile"
      data-status={database.status}
      data-env={database.env}
      onClick={() => onClick(database)}
      className={cn(
        "group flex w-full min-w-0 flex-col gap-3.5 rounded-xl border border-border bg-card p-5 text-left",
        "transition-colors hover:border-foreground/30 hover:bg-card/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      {/* Header: nome + chips */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Database
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="truncate text-sm font-semibold text-foreground">
              {database.name}
            </h3>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {database.role}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge
            variant="outline"
            className={cn(
              "border px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide",
              env.chip
            )}
          >
            {database.env}
          </Badge>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full ring-2",
                status.dot,
                status.ring
              )}
              aria-hidden="true"
            />
            <span className="text-[10px] font-medium text-muted-foreground">
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Engine + host:port */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">{ENGINE_LABEL[database.engine]}</span>
        <span aria-hidden="true">·</span>
        <span className="truncate font-mono">
          {database.host}:{database.port}
        </span>
      </div>

      {/* 3 mini-barras */}
      <div className="space-y-2">
        <MiniBar
          label="Connections"
          used={database.currentConnections}
          total={database.maxConnections}
        />
        <MiniBar
          label={database.sizeLimitMB ? "Size" : "Size (no limit)"}
          used={database.sizeMB}
          total={sizeTotal}
        />
        <MiniBar
          label="Cache hit"
          used={Math.round(database.cacheHitRatio * 100)}
          total={100}
        />
      </div>

      {/* 4 mini-stats */}
      <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3 sm:grid-cols-4">
        <MiniStat
          label="QPS"
          value={formatNumber(database.queriesPerSec)}
          hint="queries/s"
        />
        <MiniStat
          label="Slow"
          value={formatNumber(database.slowQueriesCount)}
          hint="last 1h"
        />
        <MiniStat
          label="TPS"
          value={formatNumber(database.transactionsPerSec)}
          hint="tx/s"
        />
        <MiniStat
          label="Repl"
          value={
            database.replicationLagMs === undefined
              ? "—"
              : `${database.replicationLagMs}ms`
          }
          hint={database.replicationLagMs === undefined ? "standalone" : "lag"}
        />
      </div>

      {/* Top tables */}
      {topTables.length > 0 ? (
        <div className="space-y-1 border-t border-border/60 pt-3">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Top tables
          </span>
          <ul className="space-y-0.5">
            {topTables.map((table) => (
              <li
                key={table.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="truncate font-mono text-foreground/80">
                  {table.name}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {formatNumber(table.rowCount)} rows ·{" "}
                  {formatBytes(table.sizeMB)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Footer: backup */}
      <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Activity className="size-3" aria-hidden="true" />
          v{database.version}
        </span>
        <span className="font-mono">
          last backup {formatTimeAgo(database.lastBackupAt, now)}
        </span>
      </div>
    </button>
  )
}

function DefaultDetailView({ database }: { database: DatabaseInstance }) {
  const env = ENV_STYLES[database.env]
  const status = STATUS_STYLES[database.status]
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn("border px-2 py-0.5 text-xs", env.chip)}
        >
          {database.env}
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-xs">
          <span
            className={cn("size-2 rounded-full", status.dot)}
            aria-hidden="true"
          />
          {status.label}
        </Badge>
        <Badge variant="secondary" className="font-mono text-xs">
          {ENGINE_LABEL[database.engine]} · v{database.version}
        </Badge>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Conexão
          </h4>
          <p className="font-mono text-sm">
            {database.host}:{database.port}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {database.role}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Throughput
          </h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="font-mono font-medium">
                {formatNumber(database.queriesPerSec)}
              </div>
              <div className="text-[10px] text-muted-foreground">QPS</div>
            </div>
            <div>
              <div className="font-mono font-medium">
                {formatNumber(database.transactionsPerSec)}
              </div>
              <div className="text-[10px] text-muted-foreground">TPS</div>
            </div>
            <div>
              <div className="font-mono font-medium">
                {Math.round(database.cacheHitRatio * 100)}%
              </div>
              <div className="text-[10px] text-muted-foreground">Cache</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Top tables
        </h4>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Tabela</th>
                <th className="px-3 py-2 text-right font-medium">Linhas</th>
                <th className="px-3 py-2 text-right font-medium">Tamanho</th>
              </tr>
            </thead>
            <tbody>
              {database.topTables.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-3 text-center text-xs text-muted-foreground"
                  >
                    Nenhuma tabela catalogada.
                  </td>
                </tr>
              ) : (
                database.topTables.map((table) => (
                  <tr
                    key={table.name}
                    className="border-t border-border/60 font-mono"
                  >
                    <td className="px-3 py-1.5">{table.name}</td>
                    <td className="px-3 py-1.5 text-right">
                      {formatNumber(table.rowCount)}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {formatBytes(table.sizeMB)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Componente raiz                                */
/* -------------------------------------------------------------------------- */

function DbOverviewGrid({
  databases,
  onDatabaseClick,
  sortBy = "status",
  renderDetail,
  className,
  ...rest
}: DbOverviewGridProps) {
  const [query, setQuery] = React.useState("")
  const [sort, setSort] = React.useState<DbOverviewGridSortBy>(sortBy)
  const [selected, setSelected] = React.useState<DatabaseInstance | null>(null)

  // "agora" para o "last backup Xm ago"; atualiza a cada 60s. Inicializado em
  // efeito (não no render) para respeitar a regra de pureza de hooks.
  const [now, setNow] = React.useState(0)
  React.useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? databases.filter((db) => {
          const haystack = [
            db.name,
            db.role,
            db.host,
            ENGINE_LABEL[db.engine],
            db.version,
            db.env,
            db.status,
          ]
            .join(" ")
            .toLowerCase()
          return haystack.includes(q)
        })
      : databases

    const sorted = [...list]
    sorted.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name)
        case "connections":
          return b.currentConnections / b.maxConnections -
            a.currentConnections / a.maxConnections
        case "size":
          return b.sizeMB - a.sizeMB
        case "latency":
          return (b.replicationLagMs ?? -1) - (a.replicationLagMs ?? -1)
        case "status":
        default:
          return (
            compareStatus(a.status, b.status) ||
            a.name.localeCompare(b.name)
          )
      }
    })
    return sorted
  }, [databases, query, sort])

  const totalConnections = React.useMemo(
    () => databases.reduce((acc, db) => acc + db.currentConnections, 0),
    [databases]
  )
  const envCount = React.useMemo(
    () => new Set(databases.map((db) => db.env)).size,
    [databases]
  )

  const handleTileClick = React.useCallback(
    (db: DatabaseInstance) => {
      onDatabaseClick?.(db.id)
      // Só abre o dialog de detalhe quando NÃO há navegação externa
      // (`onDatabaseClick`). Assim, quem usa o grid para navegar não vê o modal.
      if (!onDatabaseClick) setSelected(db)
    },
    [onDatabaseClick]
  )

  return (
    <div
      data-slot="db-overview-grid"
      className={cn("flex w-full flex-col gap-4", className)}
      {...rest}
    >
      {/* Header: contadores + controles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">
            {databases.length}
          </span>{" "}
          databases ·{" "}
          <span className="font-mono font-semibold text-foreground">
            {envCount}
          </span>{" "}
          environments ·{" "}
          <span className="font-mono font-semibold text-foreground">
            {formatNumber(totalConnections)}
          </span>{" "}
          connections totais
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              data-slot="db-overview-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, host, role…"
              className="h-8 pl-7 pr-7 text-xs"
              aria-label="Buscar database"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="size-3" />
              </button>
            ) : null}
          </div>
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as DbOverviewGridSortBy)}
          >
            <SelectTrigger
              data-slot="db-overview-sort"
              className="h-8 w-full text-xs sm:w-44"
              aria-label="Ordenar por"
            >
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABEL) as DbOverviewGridSortBy[]).map((key) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {SORT_LABEL[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid de tiles */}
      {filtered.length === 0 ? (
        <div
          data-slot="db-overview-empty"
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/40 px-4 py-12 text-center"
        >
          <Database
            className="size-8 text-muted-foreground/60"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-foreground">
            Nenhum database encontrado
          </p>
          <p className="text-xs text-muted-foreground">
            Ajuste a busca ou limpe os filtros para ver a frota completa.
          </p>
          {query ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuery("")}
              className="mt-1 h-7 text-xs"
            >
              Limpar busca
            </Button>
          ) : null}
        </div>
      ) : (
        <div
          data-slot="db-overview-grid-list"
          className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {filtered.map((db) => (
            <DatabaseTile
              key={db.id}
              database={db}
              now={now}
              onClick={handleTileClick}
            />
          ))}
        </div>
      )}

      {/* Dialog de detalhe (render prop) */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent
          data-slot="db-overview-detail"
          className="max-w-3xl overflow-hidden p-0"
        >
          {selected ? (
            <div className="flex max-h-[min(80vh,720px)] min-w-0 flex-col">
              <DialogHeader className="border-b border-border/60 px-6 py-4">
                <DialogTitle className="flex items-center gap-2">
                  <Database className="size-4" aria-hidden="true" />
                  {selected.name}
                </DialogTitle>
                <DialogDescription>
                  {selected.role} · {ENGINE_LABEL[selected.engine]} ·{" "}
                  {selected.host}:{selected.port}
                </DialogDescription>
              </DialogHeader>
              <div className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
                {renderDetail ? (
                  renderDetail(selected)
                ) : (
                  <DefaultDetailView database={selected} />
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { DbOverviewGrid }
export type { DbOverviewGridProps } from "./db-overview-grid-types"

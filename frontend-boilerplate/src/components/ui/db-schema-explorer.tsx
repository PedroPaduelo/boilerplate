/**
 * db-schema-explorer — DBeaver/Navicat-style database schema explorer.
 *
 * 2-pane layout (tree on the left, detail on the right; stacks on mobile).
 * Tree is a 3-level hierarchy (Database → Schema → Table) with expand/collapse
 * tracked by a Set<string> of paths. Search filters tables in real time
 * (table name, column name, FK reference). "Only FK" toggle narrows to
 * tables that declare at least one foreign key. Selecting a table opens the
 * right pane with 4 tabs (Columns / Indexes / Foreign keys / DDL); FK rows
 * expose a clickable link that jumps to the referenced table.
 *
 * Engine accent is per `DbEngine` (Postgres → sky, MySQL → amber, SQL Server
 * / Oracle → rose, SQLite → gray). All accents are Tailwind v4 literal
 * classes so the JIT scanner picks them up; themes use shadcn tokens
 * (`bg-card`, `text-foreground`, `border-border`, `ring-ring`, etc.).
 *
 * Deterministic decoration: `seededPick` hashes the table name to choose a
 * Lucide glyph for the table row. No `Math.random`, no `Date.now()`.
 */

import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  Database,
  Filter,
  KeyRound,
  Link2,
  ListTree,
  Search,
  Table2,
  X,
  Code2,
  Hash,
  ArrowUpRight,
  Layers,
  Eye,
  Zap,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MiddleTruncation } from "@/components/ui/middle-truncation"
import type {
  DbEngine,
  DbSchemaExplorerProps,
  TableDef,
} from "@/components/ui/db-schema-explorer-types"

/* -------------------------------------------------------------------------- */
/*                            engine → accent map                             */
/* -------------------------------------------------------------------------- */

type EngineAccent = {
  /** Chip background (token) */
  chipBg: string
  /** Chip border */
  chipBorder: string
  /** Chip foreground */
  chipFg: string
  /** Header dot color (Tailwind literal) */
  dot: string
  /** Folder icon tint (Tailwind literal) */
  icon: string
  /** Label */
  label: string
}

const ENGINE_ACCENTS: Record<DbEngine, EngineAccent> = {
  postgresql: {
    chipBg: "bg-sky-500/10",
    chipBorder: "border-sky-500/30",
    chipFg: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
    icon: "text-sky-600 dark:text-sky-400",
    label: "PostgreSQL",
  },
  mysql: {
    chipBg: "bg-amber-500/10",
    chipBorder: "border-amber-500/30",
    chipFg: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    icon: "text-amber-600 dark:text-amber-400",
    label: "MySQL",
  },
  sqlserver: {
    chipBg: "bg-rose-500/10",
    chipBorder: "border-rose-500/30",
    chipFg: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
    icon: "text-rose-600 dark:text-rose-400",
    label: "SQL Server",
  },
  oracle: {
    chipBg: "bg-rose-500/10",
    chipBorder: "border-rose-500/30",
    chipFg: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
    icon: "text-rose-600 dark:text-rose-400",
    label: "Oracle",
  },
  sqlite: {
    chipBg: "bg-zinc-500/10",
    chipBorder: "border-zinc-500/30",
    chipFg: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-zinc-500",
    icon: "text-zinc-600 dark:text-zinc-400",
    label: "SQLite",
  },
}

/* -------------------------------------------------------------------------- */
/*                            PRNG seeded (decorative)                        */
/* -------------------------------------------------------------------------- */

/**
 * Mulberry32 — small, fast, deterministic PRNG. Used only to pick a
 * decorative Lucide icon per table from the table name. Same name → same
 * icon, every render. No `Math.random`, no `Date.now`.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a 32-bit hash — converts a string to a stable uint32 seed. */
function hashString(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const TABLE_GLYPHS = [Table2, Layers, Hash, ListTree, Database] as const
type GlyphComponent = React.ComponentType<{ className?: string }>
function pickTableGlyph(table: TableDef): GlyphComponent {
  const rng = mulberry32(hashString(`${table.schema}.${table.name}`))
  const idx = Math.floor(rng() * TABLE_GLYPHS.length) % TABLE_GLYPHS.length
  return TABLE_GLYPHS[idx] as GlyphComponent
}

/* -------------------------------------------------------------------------- */
/*                                helpers                                     */
/* -------------------------------------------------------------------------- */

function pathFor(level: "db" | "schema" | "table", ...parts: string[]): string {
  return [level, ...parts].join("/")
}

function formatNumber(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  return `${(n / 1_000_000_000).toFixed(1)}B`
}

function formatSizeMB(mb: number): string {
  if (mb < 1) return `${Math.round(mb * 1024)} KB`
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}

/* -------------------------------------------------------------------------- */
/*                              tree row atoms                                */
/* -------------------------------------------------------------------------- */

type TreeRowProps = {
  level: 0 | 1 | 2
  expanded: boolean
  onToggle: () => void
  selected?: boolean
  onSelect?: () => void
  icon: React.ReactNode
  label: React.ReactNode
  trailing?: React.ReactNode
  highlight?: string
  className?: string
}

function TreeRow({
  level,
  expanded,
  onToggle,
  selected,
  onSelect,
  icon,
  label,
  trailing,
  highlight,
  className,
}: TreeRowProps) {
  const indent = level === 0 ? "pl-1" : level === 1 ? "pl-4" : "pl-7"
  return (
    <button
      type="button"
      onClick={() => {
        onToggle()
        onSelect?.()
      }}
      data-slot="db-schema-explorer-row"
      data-level={level}
      data-selected={selected ? "true" : undefined}
      className={cn(
        "group flex w-full min-w-0 items-center gap-1.5 rounded-md py-1 pr-2 text-left text-sm transition-colors",
        indent,
        selected
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-muted/60",
        className,
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
        {level > 0 ? (
          expanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )
        ) : null}
      </span>
      <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      {trailing ? (
        <span className="ml-1 shrink-0 text-xs text-muted-foreground">
          {trailing}
        </span>
      ) : null}
      {highlight ? (
        <span className="ml-1 hidden shrink-0 rounded bg-amber-500/15 px-1.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 sm:inline-block">
          {highlight}
        </span>
      ) : null}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                DDL generator                               */
/* -------------------------------------------------------------------------- */

function quoteIdent(engine: DbEngine, ident: string): string {
  // PG/Oracle/MySQL/SQLite: double quote. SQL Server: bracket.
  if (engine === "sqlserver") return `[${ident.replace(/]/g, "]]")}]`
  return `"${ident.replace(/"/g, '""')}"`
}

function buildCreateTable(
  engine: DbEngine,
  schema: string,
  table: TableDef,
): string {
  const qn = (col: string) => quoteIdent(engine, col)
  const lines: string[] = []
  const qualified = `${quoteIdent(engine, schema)}.${qn(table.name)}`
  lines.push(`CREATE TABLE ${qualified} (`)
  const colLines = table.columns.map((c) => {
    const parts: string[] = [`  ${qn(c.name)} ${c.type}`]
    if (!c.nullable) parts.push("NOT NULL")
    if (c.defaultValue) parts.push(`DEFAULT ${c.defaultValue}`)
    return parts.join(" ")
  })
  if (table.primaryKey.length > 0) {
    colLines.push(
      `  CONSTRAINT ${qn(`pk_${table.name}`)} PRIMARY KEY (${table.primaryKey.map(qn).join(", ")})`,
    )
  }
  for (const fk of table.foreignKeys) {
    const cols = fk.columns.map(qn).join(", ")
    const ref = `${quoteIdent(engine, fk.references.schema)}.${qn(fk.references.table)}(${qn(fk.references.column)})`
    const onDel = fk.onDelete ? ` ON DELETE ${fk.onDelete}` : ""
    const onUpd = fk.onUpdate ? ` ON UPDATE ${fk.onUpdate}` : ""
    colLines.push(
      `  CONSTRAINT ${qn(fk.name)} FOREIGN KEY (${cols}) REFERENCES ${ref}${onDel}${onUpd}`,
    )
  }
  lines.push(colLines.join(",\n"))
  lines.push(");")
  return lines.join("\n")
}

/* -------------------------------------------------------------------------- */
/*                            table detail panels                             */
/* -------------------------------------------------------------------------- */

function TypePill({ type }: { type: string }) {
  return (
    <span
      data-slot="db-schema-explorer-type"
      className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-foreground"
    >
      {type}
    </span>
  )
}

function ColumnsPanel({ table }: { table: TableDef }) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[34%]">Coluna</TableHead>
            <TableHead className="w-[26%]">Tipo</TableHead>
            <TableHead className="w-[10%] text-center">Null</TableHead>
            <TableHead className="w-[14%]">Default</TableHead>
            <TableHead className="w-[16%]">Chaves</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.columns.map((col) => (
            <TableRow
              key={col.name}
              data-slot="db-schema-explorer-column"
              data-pk={col.isPrimary ? "true" : undefined}
              data-fk={col.isForeign ? "true" : undefined}
            >
              <TableCell className="font-mono text-xs font-medium">
                {col.name}
                {col.comment ? (
                  <div
                    className="mt-0.5 truncate text-[11px] font-normal text-muted-foreground"
                    title={col.comment}
                  >
                    {col.comment}
                  </div>
                ) : null}
              </TableCell>
              <TableCell>
                <TypePill type={col.type} />
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {col.nullable ? "—" : "NOT NULL"}
              </TableCell>
              <TableCell className="font-mono text-[11px] text-muted-foreground">
                {col.defaultValue ?? <span className="opacity-50">—</span>}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1">
                  {col.isPrimary ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-amber-500/15 text-[10px] text-amber-700 dark:text-amber-300"
                    >
                      <KeyRound className="size-3" />
                      PK
                    </Badge>
                  ) : null}
                  {col.isForeign ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-sky-500/15 text-[10px] text-sky-700 dark:text-sky-300"
                    >
                      <Link2 className="size-3" />
                      FK
                    </Badge>
                  ) : null}
                  {!col.isPrimary && !col.isForeign ? (
                    <span className="text-[11px] text-muted-foreground">—</span>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function IndexesPanel({ table }: { table: TableDef }) {
  if (table.indexes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Nenhum índice declarado para esta tabela.
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[36%]">Nome</TableHead>
            <TableHead>Colunas</TableHead>
            <TableHead className="w-[12%] text-center">Único</TableHead>
            <TableHead className="w-[18%]">Tipo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.indexes.map((idx) => (
            <TableRow key={idx.name} data-slot="db-schema-explorer-index">
              <TableCell className="font-mono text-xs">{idx.name}</TableCell>
              <TableCell className="font-mono text-[11px] text-foreground">
                {idx.columns.join(", ")}
              </TableCell>
              <TableCell className="text-center text-xs">
                {idx.unique ? (
                  <Badge variant="default" className="text-[10px]">
                    UNIQUE
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <TypePill type={idx.type} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ForeignKeysPanel({
  table,
  onJump,
}: {
  table: TableDef
  onJump: (schema: string, table: string) => void
}) {
  if (table.foreignKeys.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Esta tabela não declara chaves estrangeiras.
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[28%]">Constraint</TableHead>
            <TableHead className="w-[18%]">Coluna</TableHead>
            <TableHead className="w-[28%]">Referência</TableHead>
            <TableHead className="w-[12%]">On Delete</TableHead>
            <TableHead className="w-[14%]">On Update</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.foreignKeys.map((fk) => (
            <TableRow
              key={fk.name}
              data-slot="db-schema-explorer-fk"
              data-fk-name={fk.name}
            >
              <TableCell className="font-mono text-xs">{fk.name}</TableCell>
              <TableCell className="font-mono text-[11px] text-foreground">
                {fk.columns.join(", ")}
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onJump(fk.references.schema, fk.references.table)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  data-slot="db-schema-explorer-fk-link"
                  data-target-schema={fk.references.schema}
                  data-target-table={fk.references.table}
                >
                  <span className="text-muted-foreground">
                    {fk.references.schema}.
                  </span>
                  <span>{fk.references.table}</span>
                  <span className="text-muted-foreground">.</span>
                  <span>{fk.references.column}</span>
                  <ArrowUpRight className="size-3 text-muted-foreground" />
                </button>
              </TableCell>
              <TableCell className="font-mono text-[11px] text-muted-foreground">
                {fk.onDelete ?? <span className="opacity-50">—</span>}
              </TableCell>
              <TableCell className="font-mono text-[11px] text-muted-foreground">
                {fk.onUpdate ?? <span className="opacity-50">—</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function DdlPanel({ ddl }: { ddl: string }) {
  return (
    <div
      data-slot="db-schema-explorer-ddl"
      className="rounded-lg border border-border bg-zinc-950 px-4 py-3 font-mono text-[12px] leading-relaxed text-zinc-100"
    >
      <pre className="m-0 overflow-x-auto whitespace-pre">{ddl}</pre>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 component                                  */
/* -------------------------------------------------------------------------- */

function DbSchemaExplorer({
  database,
  onTableClick,
  embedded = false,
  className,
  ...props
}: DbSchemaExplorerProps) {
  const accent = ENGINE_ACCENTS[database.engine]

  const [search, setSearch] = React.useState("")
  const [onlyFk, setOnlyFk] = React.useState(false)
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () =>
      new Set(
        database.schemas.flatMap((s) => [
          pathFor("db"),
          pathFor("schema", s.name),
        ]),
      ),
  )
  const [selected, setSelected] = React.useState<{ schema: string; table: string } | null>(
    () => {
      const firstWithTables = database.schemas.find((s) => s.tables.length > 0)
      return firstWithTables
        ? { schema: firstWithTables.name, table: firstWithTables.tables[0]!.name }
        : null
    },
  )

  // Auto-expand/collapse on search clear
  const searchActive = search.trim().length > 0

  // Filter tables by search + onlyFk
  const visibleSchemas = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return database.schemas
      .map((schema) => {
        const tables = schema.tables.filter((t) => {
          if (onlyFk && t.foreignKeys.length === 0) return false
          if (q.length === 0) return true
          if (t.name.toLowerCase().includes(q)) return true
          if (t.columns.some((c) => c.name.toLowerCase().includes(q))) return true
          if (t.foreignKeys.some((fk) => fk.references.table.toLowerCase().includes(q))) {
            return true
          }
          return false
        })
        return { ...schema, tables }
      })
      .filter((schema) => schema.tables.length > 0)
  }, [database.schemas, search, onlyFk])

  const visibleTableCount = visibleSchemas.reduce(
    (acc, s) => acc + s.tables.length,
    0,
  )

  // When search is active, force expand all matches
  const isExpanded = React.useCallback(
    (p: string): boolean => {
      if (searchActive) return true
      return expanded.has(p)
    },
    [expanded, searchActive],
  )

  const toggle = React.useCallback((p: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }, [])

  const expandAll = React.useCallback(() => {
    const all = new Set<string>()
    all.add(pathFor("db"))
    for (const s of database.schemas) {
      all.add(pathFor("schema", s.name))
    }
    setExpanded(all)
  }, [database.schemas])

  const collapseAll = React.useCallback(() => {
    setExpanded(new Set([pathFor("db")]))
  }, [])

  const handleSelect = React.useCallback(
    (schema: string, table: string) => {
      setSelected({ schema, table })
      onTableClick?.({ schema, table })
    },
    [onTableClick],
  )

  const handleJump = React.useCallback(
    (schema: string, table: string) => {
      const exists = database.schemas
        .find((s) => s.name === schema)
        ?.tables.some((t) => t.name === table)
      if (!exists) return
      handleSelect(schema, table)
      setExpanded((prev) => {
        const next = new Set(prev)
        next.add(pathFor("db"))
        next.add(pathFor("schema", schema))
        return next
      })
    },
    [database.schemas, handleSelect],
  )

  const currentSchema = selected
    ? database.schemas.find((s) => s.name === selected.schema) ?? null
    : null
  const currentTable: TableDef | null =
    currentSchema && selected
      ? currentSchema.tables.find((t) => t.name === selected.table) ?? null
      : null
  const currentDdl =
    currentSchema && currentTable
      ? buildCreateTable(database.engine, currentSchema.name, currentTable)
      : null

  return (
    <div
      data-slot="db-schema-explorer"
      data-engine={database.engine}
      data-search-active={searchActive ? "true" : undefined}
      data-embedded={embedded ? "true" : undefined}
      className={cn(
        "flex w-full min-w-0 flex-col overflow-hidden text-card-foreground",
        embedded
          ? "bg-transparent"
          : "rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
      {...props}
    >
      {!embedded && (
        <>
          {/* Header */}
          <header
            data-slot="db-schema-explorer-header"
            className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-muted/30 px-4 py-3"
          >
        <div className="flex min-w-0 items-center gap-2">
          <Database className={cn("size-5 shrink-0", accent.icon)} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-foreground text-sm">
                {database.name}
              </h3>
              <span
                data-slot="db-schema-explorer-engine-chip"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
                  accent.chipBg,
                  accent.chipBorder,
                  accent.chipFg,
                )}
              >
                <span className={cn("size-1.5 rounded-full", accent.dot)} />
                {accent.label}
              </span>
            </div>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {database.host}
              {database.port ? `:${database.port}` : ""}
              <span className="px-1.5 opacity-50">·</span>
              v{database.version}
              <span className="px-1.5 opacity-50">·</span>
              {formatSizeMB(database.sizeMB)}
              <span className="px-1.5 opacity-50">·</span>
              {formatNumber(database.tables)} tabelas
            </p>
          </div>
        </div>
      </header>
        </>
      )}

      {/* Toolbar */}
      <div
        data-slot="db-schema-explorer-toolbar"
        className="flex flex-wrap items-center gap-2 border-b border-border bg-background/60 px-3 py-2"
      >
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tabela, coluna ou referência…"
            className="h-8 pl-7 pr-7 text-xs"
            data-slot="db-schema-explorer-search"
            aria-label="Buscar no schema"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpar busca"
              className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={expandAll}
          className="h-8 gap-1 px-2 text-xs"
        >
          <Layers className="size-3.5" />
          Expandir
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={collapseAll}
          className="h-8 gap-1 px-2 text-xs"
        >
          <ListTree className="size-3.5" />
          Recolher
        </Button>
        <label className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground transition-colors hover:bg-muted/60">
          <input
            type="checkbox"
            checked={onlyFk}
            onChange={(e) => setOnlyFk(e.target.checked)}
            data-slot="db-schema-explorer-only-fk"
            className="size-3 accent-primary"
          />
          <Filter className="size-3 text-muted-foreground" />
          Só com FK
        </label>
      </div>

      {/* Body — two-pane (stacks on mobile) */}
      <div
        data-slot="db-schema-explorer-body"
        className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]"
      >
        {/* Tree pane */}
        <ScrollArea
          data-slot="db-schema-explorer-tree"
          className="h-[28rem] border-b border-border lg:h-auto lg:border-b-0 lg:border-r"
        >
          <div className="p-2">
            {/* Database root */}
            <TreeRow
              level={0}
              expanded={isExpanded(pathFor("db"))}
              onToggle={() => toggle(pathFor("db"))}
              icon={<Database className={cn("size-3.5", accent.icon)} />}
              label={database.name}
              trailing={
                <span>
                  {visibleSchemas.length}/{database.schemas.length} schemas
                </span>
              }
            />
            {isExpanded(pathFor("db")) ? (
              <div className="mt-0.5 space-y-0.5">
                {visibleSchemas.length === 0 ? (
                  <p className="px-7 py-3 text-[11px] text-muted-foreground">
                    Nenhuma tabela corresponde à busca.
                  </p>
                ) : null}
                {visibleSchemas.map((schema) => {
                  const schemaPath = pathFor("schema", schema.name)
                  return (
                    <React.Fragment key={schema.name}>
                      <TreeRow
                        level={1}
                        expanded={isExpanded(schemaPath)}
                        onToggle={() => toggle(schemaPath)}
                        icon={<Layers className="size-3.5 text-muted-foreground" />}
                        label={
                          <span className="font-mono text-xs">{schema.name}</span>
                        }
                        trailing={
                          <span>
                            {schema.tables.length}
                            {schema.views ? ` · ${schema.views} views` : ""}
                            {schema.functions ? ` · ${schema.functions} fns` : ""}
                          </span>
                        }
                      />
                      {isExpanded(schemaPath) ? (
                        <div className="space-y-0.5">
                          {schema.tables.map((t) => {
                            const isSelected =
                              selected?.schema === schema.name &&
                              selected?.table === t.name
                            const Glyph = pickTableGlyph(t)
                            return (
                              <TreeRow
                                key={t.name}
                                level={2}
                                expanded={false}
                                onToggle={() => {}}
                                onSelect={() => handleSelect(schema.name, t.name)}
                                selected={isSelected}
                                icon={
                                  <Glyph
                                    className={cn(
                                      "size-3.5",
                                      t.foreignKeys.length > 0
                                        ? accent.icon
                                        : "text-muted-foreground",
                                    )}
                                  />
                                }
                                label={
                                  <MiddleTruncation
                                    text={t.name}
                                    maxLength={18}
                                    className="font-mono text-xs"
                                  />
                                }
                                trailing={
                                  <span className="font-mono">
                                    {t.columns.length}c
                                  </span>
                                }
                                highlight={
                                  t.foreignKeys.length > 0
                                    ? `${t.foreignKeys.length} FK`
                                    : undefined
                                }
                              />
                            )
                          })}
                        </div>
                      ) : null}
                    </React.Fragment>
                  )
                })}
              </div>
            ) : null}
          </div>
        </ScrollArea>

        {/* Detail pane */}
        <ScrollArea
          data-slot="db-schema-explorer-detail"
          className="h-[36rem] lg:h-auto"
        >
          {currentTable && currentSchema && currentDdl !== null ? (
            <div className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-mono">{currentSchema.name}</span>
                    <ChevronRight className="size-3" />
                    <span className="font-mono text-foreground">
                      {currentTable.name}
                    </span>
                  </div>
                  <h3 className="mt-1 font-mono text-base font-semibold text-foreground">
                    {currentTable.name}
                  </h3>
                  {currentTable.description ? (
                    <p className="mt-1 max-w-prose text-xs text-muted-foreground">
                      {currentTable.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Zap className="size-3" />
                      {currentTable.columns.length} colunas
                    </Badge>
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Hash className="size-3" />
                      {currentTable.indexes.length} índices
                    </Badge>
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Link2 className="size-3" />
                      {currentTable.foreignKeys.length} FK
                    </Badge>
                    {currentTable.rowCount !== undefined ? (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        {formatNumber(currentTable.rowCount)} rows
                      </Badge>
                    ) : null}
                    {currentTable.sizeMB !== undefined ? (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        {formatSizeMB(currentTable.sizeMB)}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <Tabs defaultValue="columns" className="w-full">
                <TabsList>
                  <TabsTrigger value="columns" className="gap-1.5">
                    <Table2 className="size-3.5" />
                    Colunas
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      {currentTable.columns.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="indexes" className="gap-1.5">
                    <Hash className="size-3.5" />
                    Índices
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      {currentTable.indexes.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="fks" className="gap-1.5">
                    <Link2 className="size-3.5" />
                    Foreign keys
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      {currentTable.foreignKeys.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="ddl" className="gap-1.5">
                    <Code2 className="size-3.5" />
                    DDL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="columns" className="mt-3">
                  <ColumnsPanel table={currentTable} />
                </TabsContent>
                <TabsContent value="indexes" className="mt-3">
                  <IndexesPanel table={currentTable} />
                </TabsContent>
                <TabsContent value="fks" className="mt-3">
                  <ForeignKeysPanel
                    table={currentTable}
                    onJump={handleJump}
                  />
                </TabsContent>
                <TabsContent value="ddl" className="mt-3">
                  <DdlPanel ddl={currentDdl} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-2 p-8 text-center">
              <Eye className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Selecione uma tabela na árvore para ver os detalhes.
              </p>
              {visibleTableCount > 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  {visibleTableCount} tabela
                  {visibleTableCount !== 1 ? "s" : ""} disponíve
                  {visibleTableCount !== 1 ? "is" : "l"} na árvore à esquerda.
                </p>
              ) : null}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

export { DbSchemaExplorer }

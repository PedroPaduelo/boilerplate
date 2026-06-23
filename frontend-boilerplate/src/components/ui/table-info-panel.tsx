/**
 * TableInfoPanel — painel de inspeção de uma tabela de banco. Mostra, de cima
 * para baixo: cabeçalho com `schema.tabela` + descrição, dois StatTiles
 * (linhas e tamanho), e listas roláveis de colunas, índices e foreign keys.
 * Inclui um estado vazio (sem tabela) e um botão opcional de favoritar. Todo o
 * conteúdo vive dentro de um ScrollArea.
 *
 * Extraído da composição `dba-workbench` (o painel direito). Reusa `StatTile`,
 * `ScrollArea` e `Button` do acervo. As FKs viram clicáveis quando
 * `onNavigateFk` é passado. O elemento raiz expõe
 * `data-slot="table-info-panel"`.
 */

import * as React from "react"
import { Star, StarOff, Table as TableIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StatTile } from "@/components/ui/stat-tile"

export interface TableInfoColumn {
  name: string
  type: string
  nullable?: boolean
  isPrimary?: boolean
  isForeign?: boolean
}

export interface TableInfoIndex {
  name: string
  type: string
  columns: string[]
}

export interface TableInfoForeignKey {
  name: string
  columns?: string[]
  references: { schema: string; table: string; column: string }
  onDelete?: string
}

export interface TableInfoTable {
  name: string
  columns: TableInfoColumn[]
  indexes: TableInfoIndex[]
  foreignKeys: TableInfoForeignKey[]
  rowCount?: number
  sizeMB?: number
  description?: string
}

export interface TableInfoPanelProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Tabela selecionada. `null`/`undefined` mostra o estado vazio. */
  table?: TableInfoTable | null
  /** Schema da tabela (prefixo `schema.tabela`). */
  schemaName?: string
  /** Se a tabela está favoritada (controla o ícone/rótulo do botão). */
  isFavorite?: boolean
  /** Toggle de favorito. Quando passado, exibe o botão. */
  onToggleFavorite?: () => void
  /** Clique numa FK (torna as linhas de FK clicáveis). */
  onNavigateFk?: (ref: {
    schema: string
    table: string
    column: string
  }) => void
  /** Mensagem do estado vazio (sem tabela selecionada). */
  emptyHint?: React.ReactNode
}

/** Conta compacta: 8_400_000 → "8.4" + "M". */
function compactCount(n: number): { value: number; suffix?: string } {
  if (n >= 1_000_000) return { value: Math.round(n / 100_000) / 10, suffix: "M" }
  if (n >= 1_000) return { value: Math.round(n / 100) / 10, suffix: "k" }
  return { value: n }
}

/** Tamanho compacto: 2048 → "2" + " GB", 340 → "340" + " MB". */
function compactSize(mb: number): { value: number; suffix: string } {
  if (mb >= 1024) return { value: Math.round(mb / 102.4) / 10, suffix: " GB" }
  return { value: mb, suffix: " MB" }
}

function TableInfoPanel({
  table,
  schemaName,
  isFavorite,
  onToggleFavorite,
  onNavigateFk,
  emptyHint,
  className,
  ...props
}: TableInfoPanelProps) {
  return (
    <div
      data-slot="table-info-panel"
      className={cn("flex min-h-0 flex-1 flex-col", className)}
      {...props}
    >
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-3">
          {table ? (
            <>
              {/* Cabeçalho */}
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Tabela selecionada
                </p>
                <div className="mt-1 flex min-w-0 items-center gap-1.5">
                  <TableIcon className="size-3.5 shrink-0 text-primary" />
                  <code
                    className="truncate text-sm font-semibold"
                    title={schemaName ? `${schemaName}.${table.name}` : table.name}
                  >
                    {schemaName ? `${schemaName}.` : ""}
                    {table.name}
                  </code>
                </div>
                {table.description ? (
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                    {table.description}
                  </p>
                ) : null}
              </div>

              {/* Stats (linhas + tamanho) — reusa StatTile */}
              <div className="grid grid-cols-2 gap-2">
                {(() => {
                  const rows = compactCount(table.rowCount ?? 0)
                  return (
                    <StatTile label="Linhas" value={rows.value} suffix={rows.suffix} />
                  )
                })()}
                {(() => {
                  const size = compactSize(table.sizeMB ?? 0)
                  return (
                    <StatTile label="Tamanho" value={size.value} suffix={size.suffix} />
                  )
                })()}
              </div>

              {/* Colunas */}
              <div className="min-w-0">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Colunas ({table.columns.length})
                </p>
                <ul className="flex max-h-[180px] flex-col gap-0.5 overflow-y-auto rounded border border-border/40 bg-background/30 p-1">
                  {table.columns.map((c) => (
                    <li
                      key={c.name}
                      className="flex items-center justify-between gap-2 rounded px-1.5 py-0.5 text-[11px] hover:bg-muted/30"
                    >
                      <span className="flex min-w-0 items-center gap-1">
                        {c.isPrimary ? (
                          <span className="shrink-0 rounded bg-amber-500/15 px-1 text-[9px] font-bold text-amber-500">
                            PK
                          </span>
                        ) : null}
                        {c.isForeign ? (
                          <span className="shrink-0 rounded bg-sky-500/15 px-1 text-[9px] font-bold text-sky-500">
                            FK
                          </span>
                        ) : null}
                        <span className="truncate font-mono" title={c.name}>
                          {c.name}
                        </span>
                      </span>
                      <span
                        className="shrink-0 truncate text-[10px] text-muted-foreground"
                        title={c.type}
                      >
                        {c.type}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Índices */}
              <div className="min-w-0">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Índices ({table.indexes.length})
                </p>
                <ul className="flex max-h-[140px] flex-col gap-0.5 overflow-y-auto rounded border border-border/40 bg-background/30 p-1">
                  {table.indexes.map((idx) => (
                    <li
                      key={idx.name}
                      className="flex items-center justify-between gap-2 rounded px-1.5 py-0.5 text-[11px] hover:bg-muted/30"
                    >
                      <span className="truncate font-mono" title={idx.name}>
                        {idx.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {idx.type} · {idx.columns.length}col
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Foreign keys */}
              {table.foreignKeys.length > 0 ? (
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Foreign keys ({table.foreignKeys.length})
                  </p>
                  <ul className="flex max-h-[140px] flex-col gap-1 overflow-y-auto rounded border border-border/40 bg-background/30 p-1">
                    {table.foreignKeys.map((fk) => {
                      const body = (
                        <>
                          <p
                            className="truncate font-mono text-foreground"
                            title={fk.name}
                          >
                            {fk.name}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            → {fk.references.schema}.{fk.references.table}.
                            {fk.references.column}
                          </p>
                        </>
                      )
                      return (
                        <li key={fk.name}>
                          {onNavigateFk ? (
                            <button
                              type="button"
                              onClick={() => onNavigateFk(fk.references)}
                              className="w-full rounded border border-sky-500/20 bg-sky-500/5 px-1.5 py-1 text-left text-[11px] transition-colors hover:bg-sky-500/10"
                            >
                              {body}
                            </button>
                          ) : (
                            <div className="rounded border border-sky-500/20 bg-sky-500/5 px-1.5 py-1 text-[11px]">
                              {body}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}

              {onToggleFavorite ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onToggleFavorite}
                >
                  {isFavorite ? (
                    <>
                      <StarOff className="size-3.5" />
                      Remover dos favoritos
                    </>
                  ) : (
                    <>
                      <Star className="size-3.5" />
                      Adicionar aos favoritos
                    </>
                  )}
                </Button>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full border border-dashed border-border bg-background/40">
                <TableIcon className="size-5 text-muted-foreground/40" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-foreground">
                  Nenhuma tabela selecionada
                </p>
                <p className="max-w-[200px] text-[10px] text-muted-foreground/70">
                  {emptyHint ??
                    "Clique numa tabela na árvore ao lado para ver linhas, tamanho, colunas, índices e foreign keys."}
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export { TableInfoPanel }

/**
 * QueryHistoryList — histórico de queries (SQL) recentes para uma sidebar.
 * Cada item é um cartão com o SQL colapsado em uma linha e truncado, e uma
 * linha de meta (duração + horário relativo já formatado). Controlada por
 * props.
 *
 * Extraída da composição `dba-workbench` (seção "Histórico de queries" da
 * sidebar). O elemento raiz expõe `data-slot="query-history-list"`.
 */

import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export interface QueryHistoryItem {
  id: string
  /** SQL exibido (colapsado em uma linha e truncado por `maxLength`). */
  sql: string
  /** Duração da query em ms (exibida com ícone de relógio). */
  durationMs?: number
  /** Rótulo de tempo já formatado (ex.: "há 7 min"). */
  timeLabel?: React.ReactNode
}

export interface QueryHistoryListProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, "onSelect"> {
  items: QueryHistoryItem[]
  onSelect?: (item: QueryHistoryItem) => void
  /** Máximo de caracteres do SQL antes de truncar. Default: 60. */
  maxLength?: number
}

function QueryHistoryList({
  items,
  onSelect,
  maxLength = 60,
  className,
  ...props
}: QueryHistoryListProps) {
  return (
    <ul
      data-slot="query-history-list"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      {items.map((item) => {
        const oneLine = item.sql.replace(/\s+/g, " ").trim()
        const sql =
          oneLine.length > maxLength
            ? `${oneLine.slice(0, maxLength)}…`
            : oneLine
        const hasMeta = item.durationMs !== undefined || item.timeLabel != null
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect?.(item)}
              className="group flex w-full flex-col gap-1 rounded border border-border/60 bg-background/40 px-2 py-1.5 text-left transition-colors hover:bg-muted/40"
            >
              <code className="block truncate font-mono text-[10px] text-foreground/80">
                {sql}
              </code>
              {hasMeta ? (
                <div className="flex items-center gap-2 text-[9px] tabular-nums text-muted-foreground">
                  {item.durationMs !== undefined ? (
                    <span className="flex items-center gap-0.5">
                      <Clock className="size-2.5" /> {item.durationMs}ms
                    </span>
                  ) : null}
                  {item.durationMs !== undefined && item.timeLabel != null ? (
                    <span>·</span>
                  ) : null}
                  {item.timeLabel != null ? <span>{item.timeLabel}</span> : null}
                </div>
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export { QueryHistoryList }

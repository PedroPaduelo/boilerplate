/**
 * ConnectionList — lista de conexões/instâncias (bancos, servidores) para uma
 * sidebar. Cada item tem um indicador de status (ponto), nome e um slot de
 * meta à direita; o item ativo recebe destaque. 100% controlada por props.
 *
 * Extraída da composição `dba-workbench` (seção "Conexões" da sidebar). O
 * elemento raiz expõe `data-slot="connection-list"`.
 */

import * as React from "react"

import { cn } from "@/shared/lib/utils"

export type ConnectionStatus = "online" | "offline" | "warning"

export interface ConnectionListItem {
  id: string
  name: string
  /** Slot à direita (ex.: contagem de schemas). */
  meta?: React.ReactNode
  /** Cor do indicador. Default: ativo → online (verde), senão → cinza. */
  status?: ConnectionStatus
}

export interface ConnectionListProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, "onSelect"> {
  items: ConnectionListItem[]
  activeId?: string
  onSelect?: (id: string) => void
}

const STATUS_DOT: Record<ConnectionStatus, string> = {
  online: "bg-emerald-500",
  offline: "bg-gray-400",
  warning: "bg-amber-500",
}

function ConnectionList({
  items,
  activeId,
  onSelect,
  className,
  ...props
}: ConnectionListProps) {
  return (
    <ul
      data-slot="connection-list"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    >
      {items.map((item) => {
        const isActive = item.id === activeId
        const dot = item.status
          ? STATUS_DOT[item.status]
          : isActive
            ? "bg-emerald-500"
            : "bg-gray-400"
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect?.(item.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] transition-colors",
                isActive
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <span
                className={cn("size-1.5 shrink-0 rounded-full", dot)}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate font-medium">
                {item.name}
              </span>
              {item.meta ? (
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {item.meta}
                </span>
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export { ConnectionList }

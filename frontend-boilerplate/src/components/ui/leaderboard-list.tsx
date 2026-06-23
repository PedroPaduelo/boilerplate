import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/** Um item do ranking. */
export interface LeaderboardItem {
  /** Identificador único (usado como key). */
  id: string
  /** Nome exibido. */
  name: string
  /** Valor já formatado, exibido à direita (ex.: "$1,200"). */
  value: string
  /** Progresso da barra, de 0 a 100. */
  progress: number
  /** Posição no ranking (chip à esquerda). Default: índice + 1. */
  rank?: number
  /** URL do avatar. Sem ela, mostra só o fallback. */
  avatar?: string
  /** Texto do fallback do avatar. Default: as 2 primeiras letras do nome. */
  fallback?: string
  /** Conteúdo opcional à direita do nome (ex.: um <Badge> de plano/tier). */
  badge?: React.ReactNode
}

export interface LeaderboardListProps
  extends React.HTMLAttributes<HTMLUListElement> {
  /** Itens do ranking, do 1º ao último. */
  items: LeaderboardItem[]
}

function LeaderboardList({ items, className, ...props }: LeaderboardListProps) {
  return (
    <ul
      data-slot="leaderboard-list"
      className={cn("flex flex-col", className)}
      {...props}
    >
      {items.map((item, i) => (
        <li
          key={item.id}
          className={cn(
            "flex items-center gap-3 py-3",
            i === 0 ? "pt-0" : "",
            i === items.length - 1 ? "pb-0" : "border-b border-border"
          )}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
            {item.rank ?? i + 1}
          </span>
          <Avatar className="size-8 border border-border">
            {item.avatar ? (
              <AvatarImage src={item.avatar} alt={item.name} />
            ) : null}
            <AvatarFallback>
              {item.fallback ?? item.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {item.name}
            </p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
          {item.badge}
          <span className="w-16 shrink-0 text-right text-sm font-semibold text-foreground">
            {item.value}
          </span>
        </li>
      ))}
    </ul>
  )
}

export { LeaderboardList }

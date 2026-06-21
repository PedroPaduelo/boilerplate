import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { badgeVariants } from "@/components/ui/badge-variants"

/** Badge opcional de categoria, exibido ao lado do timestamp. */
export interface ActivityFeedBadge {
  /** Texto do badge (ex.: "Deploy"). */
  label: string
  /** Variante visual do badge. Default: a do próprio Badge. */
  variant?: VariantProps<typeof badgeVariants>["variant"]
}

/** Um evento do feed: ator, ação, alvo opcional e timestamp. */
export interface ActivityFeedItem {
  /** Identificador único (usado como key). */
  id: string
  /** Nome do ator. */
  name: string
  /** Ação realizada (texto secundário, ex.: "fez upgrade para"). */
  action: string
  /** Alvo da ação, destacado (ex.: "Enterprise"). Opcional. */
  target?: string
  /** Timestamp relativo (ex.: "há 4 min"). */
  time: string
  /** URL do avatar do ator. Sem ela, mostra só o fallback. */
  avatar?: string
  /** Texto do fallback do avatar. Default: as 2 primeiras letras do nome. */
  fallback?: string
  /** Badge opcional de categoria do evento, exibido junto ao timestamp. */
  badge?: ActivityFeedBadge
}

export interface ActivityFeedProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Eventos do feed, do mais recente ao mais antigo. */
  items: ActivityFeedItem[]
}

function ActivityFeed({ items, className, ...props }: ActivityFeedProps) {
  return (
    <div
      data-slot="activity-feed"
      className={cn("max-h-[280px] overflow-y-auto pr-1", className)}
      {...props}
    >
      <ul className="flex flex-col">
        {items.map((item, i) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-3 py-3",
              i === 0 ? "pt-0" : "",
              i === items.length - 1 ? "pb-0" : "border-b border-border/60"
            )}
          >
            <Avatar className="size-9 border border-border/60">
              {item.avatar ? (
                <AvatarImage src={item.avatar} alt={item.name} />
              ) : null}
              <AvatarFallback>
                {item.fallback ?? item.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">
                <span className="font-medium">{item.name}</span>{" "}
                <span className="text-muted-foreground">{item.action}</span>
                {item.target ? (
                  <>
                    {" "}
                    <span className="font-medium">{item.target}</span>
                  </>
                ) : null}
              </p>
              {item.badge ? (
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge
                    variant={item.badge.variant}
                    className="text-[10px]"
                  >
                    {item.badge.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.time}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{item.time}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { ActivityFeed }

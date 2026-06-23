import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export interface UserListItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Nome exibido (linha principal). */
  name: string
  /** E-mail (ou identificador secundário) exibido abaixo do nome. */
  email?: string
  /** URL do avatar. Sem ela, exibe o `fallback`/iniciais. */
  avatar?: string
  /** Texto de fallback do avatar. Default: iniciais derivadas de `name`. */
  fallback?: string
  /** Texto auxiliar adicional (ex.: "há 2 dias"), abaixo do e-mail. */
  meta?: string
  /** Status textual — renderiza um Badge interno. Ignorado se `badge` existir. */
  status?: string
  /** Badge/elemento de status pronto à direita. Tem prioridade sobre `status`. */
  badge?: React.ReactNode
  /** Ações à direita (botões, menu). Alternativa/complemento ao badge. */
  actions?: React.ReactNode
  /** Conteúdo à direita, quando não usar `actions`. */
  children?: React.ReactNode
}

/** Deriva até 2 iniciais maiúsculas a partir do nome. */
function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : ""
  return (first + last).toUpperCase()
}

function UserListItem({
  name,
  email,
  avatar,
  fallback,
  meta,
  status,
  badge,
  actions,
  className,
  children,
  ...props
}: UserListItemProps) {
  const right = badge ?? (status ? <Badge variant="secondary">{status}</Badge> : null)
  const trailing = actions ?? children
  return (
    <div
      data-slot="user-list-item"
      className={cn("flex items-center justify-between gap-3", className)}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-10 shrink-0">
          {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
          <AvatarFallback>{fallback ?? deriveInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          {email ? (
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          ) : null}
          {meta ? (
            <p className="truncate text-[11px] text-muted-foreground">{meta}</p>
          ) : null}
        </div>
      </div>
      {right || trailing ? (
        <div className="flex shrink-0 items-center gap-2">
          {right}
          {trailing}
        </div>
      ) : null}
    </div>
  )
}

export { UserListItem }

import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/components/ui/button"

/** Um item de navegação da sidebar. */
export interface DashboardSidebarNavItem {
  /** Identificador único do item (usado em `activeId`/`onSelect` e como key). */
  id: string
  /** Rótulo exibido. */
  label: string
  /** Ícone opcional exibido antes do rótulo. */
  icon?: React.ComponentType<{ className?: string }>
}

export interface DashboardSidebarNavProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  /** Itens de navegação, de cima para baixo. */
  items: DashboardSidebarNavItem[]
  /** Id do item ativo (recebe destaque visual). */
  activeId?: string
  /** Callback ao selecionar um item (recebe o `id`). */
  onSelect?: (id: string) => void
  /** Cabeçalho cru do topo (logo/marca). Alternativa a `brand`. */
  header?: React.ReactNode
  /** Marca do topo, envolta num cabeçalho com espaçamento padrão. */
  brand?: React.ReactNode
  /** Conteúdo fixado no rodapé (ex.: card de upgrade). */
  footer?: React.ReactNode
  /** Rótulo acessível da navegação. Default: "Navegação principal". */
  navLabel?: string
}

function DashboardSidebarNav({
  items,
  activeId,
  onSelect,
  header,
  brand,
  footer,
  navLabel = "Navegação principal",
  className,
  ...props
}: DashboardSidebarNavProps) {
  return (
    <aside
      data-slot="dashboard-sidebar-nav"
      className={cn(
        "flex w-56 shrink-0 flex-col gap-1 border-r border-sidebar-border/60 bg-sidebar p-4 text-sidebar-foreground",
        className
      )}
      {...props}
    >
      {header
        ? header
        : brand
          ? (
            <div className="mb-4 flex items-center gap-2 px-2">{brand}</div>
          )
          : null}

      <nav className="flex flex-col gap-1" aria-label={navLabel}>
        {items.map((item) => {
          const Icon = item.icon
          const active = item.id === activeId
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "justify-start gap-2",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect?.(item.id)}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {item.label}
            </Button>
          )
        })}
      </nav>

      {footer ? <div className="mt-auto">{footer}</div> : null}
    </aside>
  )
}

export { DashboardSidebarNav }

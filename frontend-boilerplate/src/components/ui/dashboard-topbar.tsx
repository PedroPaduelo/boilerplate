import * as React from "react"
import { Menu, Search as SearchIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface DashboardTopbarProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Título exibido à esquerda. */
  title?: React.ReactNode
  /** Conteúdo extra ao lado do título (ex.: um badge de status). */
  titleAdornment?: React.ReactNode
  /** Slot de busca (ex.: um input ou botão). Tem prioridade sobre `onSearch`. */
  search?: React.ReactNode
  /** Quando passado (e sem `search`), renderiza um campo de busca padrão. */
  onSearch?: (value: string) => void
  /** Placeholder do campo de busca padrão. Default: "Buscar…". */
  searchPlaceholder?: string
  /** Ações à direita (botões, ícones...). Alias de `children`. */
  actions?: React.ReactNode
  /** Callback do botão de menu (mobile). Quando passado, exibe o botão. */
  onMenu?: () => void
  /** Rótulo acessível do botão de menu. Default: "Abrir menu". */
  menuLabel?: string
}

function DashboardTopbar({
  title,
  titleAdornment,
  search,
  onSearch,
  searchPlaceholder = "Buscar…",
  actions,
  onMenu,
  menuLabel = "Abrir menu",
  className,
  children,
  ...props
}: DashboardTopbarProps) {
  const searchNode =
    search ??
    (onSearch ? (
      <div className="relative hidden sm:block">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch(e.target.value)}
          className="h-9 w-48 pl-8"
        />
      </div>
    ) : null)

  return (
    <header
      data-slot="dashboard-topbar"
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-2">
        {onMenu ? (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuLabel}
            onClick={onMenu}
          >
            <Menu className="size-4" />
          </Button>
        ) : null}
        {title ? (
          <h1 className="truncate text-base font-semibold">{title}</h1>
        ) : null}
        {titleAdornment}
      </div>
      <div className="flex items-center gap-2">
        {searchNode}
        {actions ?? children}
      </div>
    </header>
  )
}

export { DashboardTopbar }

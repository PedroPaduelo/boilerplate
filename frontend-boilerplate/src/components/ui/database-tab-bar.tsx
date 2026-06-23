/**
 * DatabaseTabBar — barra de abas estilo VS Code para "documentos" abertos
 * (bancos, arquivos, queries). Cada aba tem rótulo, ícone opcional, um slot de
 * meta (ex.: badge de engine) e, quando "suja" (`dirty`), mostra um ponto que
 * vira o "X" de fechar no hover. Um botão "+" opcional dispara `onNew`.
 *
 * Extraído da composição `dba-workbench`. Controlado por props (`activeId` +
 * `onSelect`); sem estado próprio. O elemento raiz expõe
 * `data-slot="database-tab-bar"` e cada aba `data-slot="database-tab"`.
 */

import * as React from "react"
import { Plus, X } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export interface DatabaseTab {
  id: string
  label: string
  /** Ícone opcional antes do rótulo. */
  icon?: React.ComponentType<{ className?: string }>
  /** Marca a aba com alterações não salvas (ponto em vez do "X"). */
  dirty?: boolean
  /** Slot livre exibido entre o rótulo e o "X" (ex.: badge de engine). */
  meta?: React.ReactNode
}

export interface DatabaseTabBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  tabs: DatabaseTab[]
  activeId: string
  onSelect: (id: string) => void
  /** Quando passado, exibe o "X" de fechar em cada aba. */
  onClose?: (id: string) => void
  /** Quando passado, exibe o botão "+" ao fim da barra. */
  onNew?: () => void
  /** Rótulo acessível do botão "+". Default: "Nova aba". */
  newLabel?: string
}

function DatabaseTabBar({
  tabs,
  activeId,
  onSelect,
  onClose,
  onNew,
  newLabel = "Nova aba",
  className,
  ...props
}: DatabaseTabBarProps) {
  return (
    <div
      data-slot="database-tab-bar"
      className={cn(
        "flex items-end gap-0 border-b border-border bg-muted/30 pl-2",
        className
      )}
      {...props}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            type="button"
            data-slot="database-tab"
            data-active={isActive ? "true" : "false"}
            onClick={() => onSelect(tab.id)}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-t-md border-x border-t px-2.5 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-3",
              isActive
                ? "border-border bg-background text-foreground"
                : "border-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground"
            )}
          >
            {Icon ? <Icon className="size-3 shrink-0" /> : null}
            <span className="max-w-[120px] truncate sm:max-w-[160px]">
              {tab.label}
            </span>
            {tab.meta}
            {onClose ? (
              <span
                role="button"
                tabIndex={-1}
                aria-label={`Fechar ${tab.label}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onClose(tab.id)
                }}
                className="relative ml-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-sm hover:bg-muted"
              >
                {tab.dirty ? (
                  <span
                    className="size-1.5 rounded-full bg-current opacity-80 group-hover:hidden"
                    aria-hidden
                  />
                ) : null}
                <X
                  className={cn(
                    "size-3 transition-opacity",
                    tab.dirty
                      ? "hidden group-hover:block"
                      : "opacity-0 group-hover:opacity-70",
                    !tab.dirty && isActive && "opacity-70"
                  )}
                  aria-hidden
                />
              </span>
            ) : tab.dirty ? (
              <span
                className="ml-0.5 size-1.5 shrink-0 rounded-full bg-current opacity-80"
                aria-hidden
              />
            ) : null}
          </button>
        )
      })}
      {onNew ? (
        <button
          type="button"
          aria-label={newLabel}
          onClick={onNew}
          className="ml-1 flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export { DatabaseTabBar }

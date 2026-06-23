/**
 * CollapsibleSection — seção colapsável com header clicável (chevron + ícone +
 * título + slot de ação) e conteúdo que aparece/some.
 *
 * Funciona controlada (`open` + `onOpenChange`) ou não-controlada
 * (`defaultOpen`, default aberto). O header de toggle é um <button>; o slot
 * `action` é renderizado FORA do botão (à direita), para suportar ações
 * interativas próprias (ex.: um "+" de adicionar) sem aninhar <button>s.
 *
 * Extraído da composição `dba-workbench` (era o `Section` inline da sidebar),
 * generalizado para qualquer sidebar/acordeão. SHARED — depende apenas do
 * ícone de chevron e de `cn()`, sem estado de domínio. O elemento raiz expõe
 * `data-slot="collapsible-section"` e aceita className/props padrão de um
 * <section>.
 */

import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export interface CollapsibleSectionProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Título exibido no header. */
  title: React.ReactNode
  /** Ícone opcional exibido entre o chevron e o título. */
  icon?: React.ReactNode
  /** Slot à direita do header (ex.: contagem, botão de ação). */
  action?: React.ReactNode
  /** Estado aberto (modo controlado — use junto de `onOpenChange`). */
  open?: boolean
  /** Estado inicial no modo não-controlado. Default: `true`. */
  defaultOpen?: boolean
  /** Notifica a mudança de estado (e habilita o modo controlado). */
  onOpenChange?: (open: boolean) => void
  /** Classes extras do header (botão de toggle). */
  headerClassName?: string
  /** Classes extras do container de conteúdo. */
  contentClassName?: string
  children?: React.ReactNode
}

function CollapsibleSection({
  title,
  icon,
  action,
  open,
  defaultOpen = true,
  onOpenChange,
  headerClassName,
  contentClassName,
  className,
  children,
  ...props
}: CollapsibleSectionProps) {
  const isControlled = open !== undefined
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isOpen = isControlled ? open : internalOpen

  const toggle = () => {
    const next = !isOpen
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  return (
    <section
      data-slot="collapsible-section"
      className={cn("border-b border-border", className)}
      {...props}
    >
      <div className="flex items-center">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          className={cn(
            "flex flex-1 items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40",
            headerClassName
          )}
        >
          {isOpen ? (
            <ChevronDown className="size-3 shrink-0" />
          ) : (
            <ChevronRight className="size-3 shrink-0" />
          )}
          {icon ? (
            <span className="flex shrink-0 items-center">{icon}</span>
          ) : null}
          <span className="flex-1 truncate">{title}</span>
        </button>
        {action ? (
          <div className="flex shrink-0 items-center pr-2">{action}</div>
        ) : null}
      </div>
      {isOpen ? (
        <div className={cn("px-2 pb-2", contentClassName)}>{children}</div>
      ) : null}
    </section>
  )
}

export { CollapsibleSection }

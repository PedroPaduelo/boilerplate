import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { Maximize2, X } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { useOutsideClick } from "@/shared/hooks/use-outside-click"
import type { ExpandableCardItem } from "@/components/ui/expandable-cards-types"

export type ExpandableCardsGap = "sm" | "md" | "lg"

export type ExpandableCardsProps = {
  /** Cards a exibir na grade colapsada. */
  items: ExpandableCardItem[]
  /** Colunas da grade colapsada (1..4). Default 3. */
  columns?: number
  /** Espaçamento entre os cards. Default "md". */
  gap?: ExpandableCardsGap
  /** Classe extra aplicada à grade. */
  className?: string
}

const GAP_CLASS: Record<ExpandableCardsGap, string> = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
}

/**
 * `ExpandableCards` — grade de cards que EXPANDEM para um modal ao clicar.
 *
 * Estado único `activeId` controla qual card está aberto (no máximo um modal por
 * vez). Cada card abre o SEU próprio conteúdo; fechar (X / Esc / clique fora)
 * fecha apenas o que estava aberto. Transição de "elemento compartilhado" via
 * `layoutId` (motion) entre o card colapsado e o modal.
 */
function ExpandableCards({
  items,
  columns = 3,
  gap = "md",
  className,
}: ExpandableCardsProps) {
  const cols = Math.min(4, Math.max(1, Math.round(columns)))
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const uid = React.useId()
  const ref = React.useRef<HTMLDivElement>(null)

  const active = items.find((item) => item.id === activeId) ?? null

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveId(null)
    }
    if (active) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = "auto"
    }
  }, [active])

  useOutsideClick(ref, () => setActiveId(null))

  return (
    <div data-slot="expandable-cards">
      {/* Backdrop do modal */}
      <AnimatePresence>
        {active ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] h-full w-full bg-black/40 backdrop-blur-sm"
          />
        ) : null}
      </AnimatePresence>

      {/* Modal expandido (conteúdo completo do card) */}
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4">
            <motion.div
              layoutId={`expandable-card-${active.id}-${uid}`}
              ref={ref}
              className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border p-4">
                <div className="min-w-0">
                  <motion.h3
                    layoutId={`expandable-card-title-${active.id}-${uid}`}
                    className="truncate font-medium text-popover-foreground"
                  >
                    {active.title}
                  </motion.h3>
                  {active.subtitle ? (
                    <p className="truncate text-sm text-muted-foreground">
                      {active.subtitle}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Fechar"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent"
                  onClick={() => setActiveId(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div
                data-slot="expandable-card-content"
                className="min-h-0 flex-1 overflow-auto p-4"
              >
                {active.content}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Grade colapsada */}
      <div
        data-slot="expandable-cards-grid"
        className={cn("grid", GAP_CLASS[gap], className)}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <motion.button
            type="button"
            layoutId={`expandable-card-${item.id}-${uid}`}
            key={item.id}
            onClick={() => setActiveId(item.id)}
            className="group flex min-w-0 cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <motion.h3
                  layoutId={`expandable-card-title-${item.id}-${uid}`}
                  className="truncate font-medium text-foreground"
                >
                  {item.title}
                </motion.h3>
                {item.subtitle ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {item.subtitle}
                  </p>
                ) : null}
              </div>
              <Maximize2 className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
            </div>
            {item.preview ? (
              <div
                data-slot="expandable-card-preview"
                aria-hidden
                className="pointer-events-none relative max-h-32 overflow-hidden rounded-lg border border-border/60 bg-muted/30 p-2"
              >
                {item.preview}
              </div>
            ) : null}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export { ExpandableCards }

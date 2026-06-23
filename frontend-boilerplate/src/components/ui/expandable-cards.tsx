import * as React from "react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/shared/lib/utils"
import { useOutsideClick } from "@/shared/hooks/use-outside-click"
import type { ExpandableCard } from "@/components/ui/expandable-cards-types"

export type ExpandableCardsProps = {
  /** Lista de cards a exibir. */
  cards: ExpandableCard[]
  /** Classe extra aplicada ao container da lista. */
  className?: string
}

function CloseIcon() {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  )
}

function renderContent(content: ExpandableCard["content"]): React.ReactNode {
  return typeof content === "function" ? content() : content
}

function ExpandableCards({ cards, className }: ExpandableCardsProps) {
  const [active, setActive] = React.useState<ExpandableCard | null>(null)
  const id = React.useId()
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null)
      }
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

  useOutsideClick(ref, () => setActive(null))

  return (
    <div data-slot="expandable-cards">
      <AnimatePresence>
        {active ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] h-full w-full bg-black/20"
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4">
            <motion.button
              key={`button-${active.title}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-popover text-popover-foreground lg:hidden"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>

            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="flex h-full w-full max-w-[500px] flex-col overflow-hidden bg-popover text-popover-foreground sm:rounded-3xl md:h-fit md:max-h-[90%]"
            >
              <motion.div layoutId={`image-${active.title}-${id}`}>
                <img
                  width={200}
                  height={200}
                  src={active.src}
                  alt={active.title}
                  className="h-80 w-full object-cover object-top sm:rounded-tr-lg sm:rounded-tl-lg"
                />
              </motion.div>

              <div>
                <div className="flex items-start justify-between p-4">
                  <div>
                    <motion.h3
                      layoutId={`title-${active.title}-${id}`}
                      className="font-medium text-popover-foreground"
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.description}-${id}`}
                      className="text-muted-foreground"
                    >
                      {active.description}
                    </motion.p>
                  </div>

                  <motion.a
                    layoutId={`button-${active.title}-${id}`}
                    href={active.ctaLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-green-500 px-4 py-3 text-sm font-bold text-white"
                  >
                    {active.ctaText}
                  </motion.a>
                </div>

                <div className="relative px-4 pt-4">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-40 flex-col items-start gap-4 overflow-auto pb-10 text-xs text-muted-foreground [scrollbar-width:none] [-webkit-overflow-scrolling:touch] md:h-fit md:text-sm lg:text-base"
                  >
                    {renderContent(active.content)}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <ul
        className={cn(
          "mx-auto w-full max-w-2xl items-start gap-4",
          className
        )}
      >
        {cards.map((card) => (
          <motion.div
            layoutId={`card-${card.title}-${id}`}
            key={`card-${card.title}-${id}`}
            onClick={() => setActive(card)}
            className="flex cursor-pointer flex-col items-center justify-between rounded-xl p-4 hover:bg-accent md:flex-row"
          >
            <div className="flex flex-col gap-4 md:flex-row">
              <motion.div layoutId={`image-${card.title}-${id}`}>
                <img
                  width={100}
                  height={100}
                  src={card.src}
                  alt={card.title}
                  className="h-40 w-40 rounded-lg object-cover object-top md:h-14 md:w-14"
                />
              </motion.div>
              <div>
                <motion.h3
                  layoutId={`title-${card.title}-${id}`}
                  className="text-center font-medium text-foreground md:text-left"
                >
                  {card.title}
                </motion.h3>
                <motion.p
                  layoutId={`description-${card.description}-${id}`}
                  className="text-center text-muted-foreground md:text-left"
                >
                  {card.description}
                </motion.p>
              </div>
            </div>
            <motion.button
              layoutId={`button-${card.title}-${id}`}
              className="mt-4 rounded-full bg-muted px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-green-500 hover:text-white md:mt-0"
            >
              {card.ctaText}
            </motion.button>
          </motion.div>
        ))}
      </ul>
    </div>
  )
}

export { ExpandableCards }

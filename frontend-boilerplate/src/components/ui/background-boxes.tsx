import React from "react"
import { motion } from "motion/react"

import { cn } from "@/shared/lib/utils"

/**
 * Background Boxes (Aceternity UI) — reimplementação fiel para a vitrine.
 *
 * Grid de células com border; ao passar o mouse, cada célula ganha uma cor
 * de highlight aleatória da paleta `boxesColors`. O container recebe uma
 * transformação de perspectiva (skew + translate + scale) que dá o efeito
 * isométrico característico. Ícones "+" esparsos reforçam a estética técnica.
 *
 * GOTCHA performance: o registry original usa 150×100 = 15000 divs, o que
 * trava a página de detalhe da vitrine. Aqui reduzimos para 40×30 = 1200
 * células — visualmente equivalente (o container fica clipado pelo wrapper
 * com overflow-hidden) e performático.
 *
 * GOTCHA Tailwind v4: a cor do highlight NÃO é aplicada via classe dinâmica
 * (`bg-${cor}` seria purgada no build). A cor sai da paleta tipada `string[]`
 * e é aplicada via `backgroundColor` no `whileHover` do motion (style inline).
 */

const boxesColors: string[] = [
  "#93c5fd",
  "#f9a8d4",
  "#86efac",
  "#fde047",
  "#fca5a5",
  "#d8b4fe",
  "#a5b4fc",
  "#c4b5fd",
]

const ROWS = 40
const COLS = 30

const rows: number[] = new Array(ROWS).fill(1)
const cols: number[] = new Array(COLS).fill(1)

function getRandomColor(): string {
  return boxesColors[Math.floor(Math.random() * boxesColors.length)]
}

type BoxesCoreProps = {
  className?: string
} & Omit<React.HTMLAttributes<HTMLDivElement>, "className">

function BoxesCore({ className, ...rest }: BoxesCoreProps) {
  return (
    <div
      data-slot="background-boxes"
      style={{
        transform:
          "translate(-40%,-60%) skewX(-48deg) skewY(14deg) scale(0.675) rotate(0deg) translateZ(0)",
      }}
      className={cn(
        "absolute -top-1/4 left-1/4 z-0 flex h-full w-full -translate-x-1/2 -translate-y-1/2 p-4",
        className,
      )}
      {...rest}
    >
      {rows.map((_, i) => (
        <motion.div
          key={`row-${i}`}
          className="relative h-8 w-16 border-l border-slate-700"
        >
          {cols.map((_, j) => (
            <motion.div
              key={`col-${j}`}
              whileHover={{
                backgroundColor: getRandomColor(),
                transition: { duration: 0 },
              }}
              animate={{
                transition: { duration: 2 },
              }}
              className="relative h-8 w-16 border-t border-r border-slate-700"
            >
              {j % 2 === 0 && i % 2 === 0 ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="pointer-events-none absolute -top-[14px] -left-[22px] h-6 w-10 stroke-[1px] text-slate-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m6-6H6"
                  />
                </svg>
              ) : null}
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
  )
}

const Boxes = React.memo(BoxesCore)

export { Boxes }

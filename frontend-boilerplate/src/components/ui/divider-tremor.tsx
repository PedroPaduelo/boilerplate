import * as React from "react"

import { cn } from "@/shared/lib/utils"

export interface DividerTremorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Texto central exibido entre as duas linhas do divider horizontal.
   * Se omitido, renderiza apenas a linha.
   */
  children?: React.ReactNode
  /**
   * Orientação do divider. `'horizontal'` (padrão) renderiza uma linha
   * na largura do container; `'vertical'` renderiza uma linha na altura
   * do container (útil em flex rows).
   */
  orientation?: "horizontal" | "vertical"
}

const DividerTremor = React.forwardRef<HTMLDivElement, DividerTremorProps>(
  ({ className, children, orientation = "horizontal", ...props }, ref) => {
    if (orientation === "vertical") {
      return (
        <div
          ref={ref}
          data-slot="divider-tremor"
          data-orientation="vertical"
          tremor-id="tremor-raw"
          className={cn("self-stretch flex items-center", className)}
          {...props}
        >
          <hr className="self-stretch border-l h-full border-gray-200 dark:border-gray-800" />
        </div>
      )
    }

    if (children) {
      return (
        <div
          ref={ref}
          data-slot="divider-tremor"
          data-orientation="horizontal"
          tremor-id="tremor-raw"
          className={cn(
            "flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500",
            className,
          )}
          {...props}
        >
          <hr className="flex-1 border-gray-200 dark:border-gray-800" />
          <span className="whitespace-nowrap text-inherit">{children}</span>
          <hr className="flex-1 border-gray-200 dark:border-gray-800" />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        data-slot="divider-tremor"
        data-orientation="horizontal"
        tremor-id="tremor-raw"
        className={cn("flex w-full items-center", className)}
        {...props}
      >
        <hr className="w-full border-gray-200 dark:border-gray-800" />
      </div>
    )
  },
)
DividerTremor.displayName = "DividerTremor"

export { DividerTremor }

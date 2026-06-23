import * as React from "react"

import { cn } from "@/shared/lib/utils"

export type BentoGridProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children?: React.ReactNode
}

export type BentoGridItemProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> & {
  title?: React.ReactNode
  description?: React.ReactNode
  header?: React.ReactNode
  icon?: React.ReactNode
}

function BentoGrid({ className, children, ...props }: BentoGridProps) {
  return (
    <div
      data-slot="bento-grid"
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
  ...props
}: BentoGridItemProps) {
  return (
    <div
      data-slot="bento-grid-item"
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm transition duration-200 hover:shadow-xl",
        className,
      )}
      {...props}
    >
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        {icon}
        <div className="mt-2 mb-2 font-sans font-bold text-foreground">
          {title}
        </div>
        <div className="font-sans text-xs font-normal text-muted-foreground">
          {description}
        </div>
      </div>
    </div>
  )
}

export { BentoGrid, BentoGridItem }

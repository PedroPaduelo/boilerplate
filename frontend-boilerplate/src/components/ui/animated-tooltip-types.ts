import * as React from "react"

export type AnimatedTooltipItem = {
  id: number
  name: string
  designation: string
  image: string
}

export type AnimatedTooltipProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  /** Lista de itens (avatar + nome + tooltip) exibidos em fileira. */
  items: AnimatedTooltipItem[]
}

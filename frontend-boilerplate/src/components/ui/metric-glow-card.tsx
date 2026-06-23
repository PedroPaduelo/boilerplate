import * as React from "react"

import { cn } from "@/shared/lib/utils"

export interface MetricGlowCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Rótulo/título da métrica (exibido em maiúsculas, com tracking). */
  title: string
  /** Valor já formatado (string livre: "R$ 124.500", "4m 32s", "8.420"…). */
  value: React.ReactNode
  /** Variação exibida abaixo do valor (ex.: "+12.5%", "-0.4%"). */
  change?: React.ReactNode
  /** Tendência da variação: verde quando `true`, vermelho quando `false`. */
  positive?: boolean
}

function MetricGlowCard({
  title,
  value,
  change,
  positive = true,
  className,
  ...props
}: MetricGlowCardProps) {
  return (
    <div
      data-slot="metric-glow-card"
      className={cn("px-4 text-center", className)}
      {...props}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {change != null ? (
        <span
          className={cn(
            "mt-1 inline-block text-xs font-medium",
            positive ? "text-emerald-500" : "text-red-500"
          )}
        >
          {change}
        </span>
      ) : null}
    </div>
  )
}

export { MetricGlowCard }

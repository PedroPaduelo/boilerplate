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
  /**
   * Classe Tailwind do halo/brilho de fundo (ex.: "bg-chart-1"). Aplicada a
   * um elemento desfocado atrás do valor. Use OU `glowClassName` OU
   * `glowStyle` (resolvido por `resolveAccent()` no bloco do catálogo).
   */
  glowClassName?: string
  /**
   * Estilo inline do halo/brilho (ex.: `{ background: "#40E0D0" }`). Para
   * cores CSS cruas/gradientes que não cabem numa classe Tailwind.
   */
  glowStyle?: React.CSSProperties
}

function MetricGlowCard({
  title,
  value,
  change,
  positive = true,
  glowClassName,
  glowStyle,
  className,
  ...props
}: MetricGlowCardProps) {
  return (
    <div
      data-slot="metric-glow-card"
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden px-4 py-2 text-center",
        className,
      )}
      {...props}
    >
      {/* Halo/brilho — círculo desfocado atrás do valor. A cor vem do
          accent (classe Tailwind `bg-…` OU style.background). */}
      <div
        data-slot="metric-glow-halo"
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 -z-10 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl",
          glowClassName ?? "bg-chart-1",
        )}
        style={glowStyle}
      />
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

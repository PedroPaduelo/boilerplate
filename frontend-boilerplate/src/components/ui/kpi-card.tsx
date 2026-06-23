import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AnimatedNumber } from "@/components/ui/animated-number"

export interface KpiCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Rótulo/título da métrica (ex.: "MRR", "Clientes ativos"). */
  label: string
  /** Valor numérico exibido com AnimatedNumber. */
  value: number
  /**
   * Valor JÁ FORMATADO (string). Quando presente, é renderizado ESTÁTICO no
   * lugar do AnimatedNumber — ideal para valores grandes/monetários onde o
   * efeito slot-machine fica ilegível (ex.: "R$ 2,61 bi"). `prefix`/`suffix`
   * são ignorados nesse caso (já embutidos no display).
   */
  displayValue?: string
  /** Prefixo antes do valor (ex.: "$"). */
  prefix?: string
  /** Sufixo após o valor (ex.: ".3%"). */
  suffix?: string
  /** Variação (em %) vs. período anterior. >= 0 = verde, < 0 = vermelho. */
  delta?: number
  /** Texto auxiliar ao lado do delta. Default: "vs. período anterior". */
  hint?: string
  /** Ícone opcional exibido no canto superior direito. */
  icon?: React.ComponentType<{ className?: string }>
  /** Força a direção da tendência. Default: derivado do sinal de `delta`. */
  trend?: "up" | "down"
  /**
   * Se subir é bom (default `true`). Quando `false`, inverte a cor do delta:
   * uma variação positiva passa a ser sinalizada como negativa.
   */
  higherIsBetter?: boolean
  /**
   * Cor de DESTAQUE do card (resolvida por `resolveAccent()` no bloco do
   * catálogo). Forma de CLASSE Tailwind de fundo (ex.: `bg-chart-1`,
   * `bg-purple-500`). Aplicada ao rail lateral (sempre visível) e ao chip
   * do ícone (fundo sólido). Quando ausente, o card usa o estilo neutro.
   * Mutuamente exclusiva com `accentStyle` (a UI usa o que vier).
   */
  accentClassName?: string
  /**
   * Cor de DESTAQUE via estilo inline (ex.: `{ background: '#40E0D0' }`).
   * Usada para cores CSS cruas (hex/rgb/oklch/gradient) que não cabem numa
   * classe Tailwind. Aplicada ao rail lateral e ao fundo do chip do ícone.
   */
  accentStyle?: React.CSSProperties
}

function KpiCard({
  label,
  value,
  displayValue,
  prefix,
  suffix,
  delta,
  hint = "vs. período anterior",
  icon: Icon,
  trend,
  higherIsBetter = true,
  accentClassName,
  accentStyle,
  className,
  ...props
}: KpiCardProps) {
  const positive = trend ? trend === "up" : (delta ?? 0) >= 0
  const good = positive === higherIsBetter
  const hasAccent = Boolean(accentClassName || accentStyle)
  return (
    <div
      data-slot="kpi-card"
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm",
        className
      )}
      {...props}
    >
      {/* Rail de destaque (accent) — sempre visível quando há accent, mesmo
          sem ícone. Garante que a cor de destaque do card "apareça". */}
      {hasAccent ? (
        <span
          aria-hidden
          data-slot="kpi-accent-rail"
          className={cn(
            "absolute inset-y-0 left-0 w-1",
            accentStyle ? undefined : accentClassName
          )}
          style={accentStyle}
        />
      ) : null}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon ? (
          <span
            data-slot="kpi-icon"
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              hasAccent
                ? cn("text-white", accentStyle ? undefined : accentClassName)
                : "bg-muted text-muted-foreground"
            )}
            style={accentStyle}
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-1 text-3xl font-semibold tracking-tight text-foreground">
        {displayValue !== undefined ? (
          <span className="tabular-nums">{displayValue}</span>
        ) : (
          <>
            {prefix ? <span>{prefix}</span> : null}
            <AnimatedNumber value={value} />
            {suffix ? (
              <span className="text-2xl text-muted-foreground">{suffix}</span>
            ) : null}
          </>
        )}
      </div>
      {delta !== undefined ? (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
              good
                ? "bg-chart-2/10 text-chart-2"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {positive ? "+" : ""}
            {delta}%
          </span>
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export { KpiCard }

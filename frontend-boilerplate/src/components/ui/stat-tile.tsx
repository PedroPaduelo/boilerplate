import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { AnimatedNumber } from "@/components/ui/animated-number"

export interface StatTileProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Rótulo/título da estatística (ex.: "Eventos hoje"). */
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
  /** Sufixo após o valor (ex.: " dias", "%"). */
  suffix?: string
  /** Ícone opcional exibido antes do rótulo. */
  icon?: React.ComponentType<{ className?: string }>
  /** Variação (em %) vs. período anterior. >= 0 = verde, < 0 = vermelho. */
  delta?: number
  /** Força a direção da tendência. Default: derivado do sinal de `delta`. */
  trend?: "up" | "down"
  /**
   * Se subir é bom (default `true`). Quando `false`, inverte a cor do delta:
   * uma variação positiva passa a ser sinalizada como negativa.
   */
  higherIsBetter?: boolean
  /** Texto auxiliar exibido ao lado do delta (ex.: "vs. ontem"). */
  hint?: string
  /**
   * Classe Tailwind de COR de destaque (ex.: `bg-chart-1`). Quando presente,
   * pinta uma barra vertical fina à esquerda do ladrilho. Vem de
   * `resolveAccent()` (kind `class`). Mutuamente exclusiva com `accentStyle`.
   */
  accentClassName?: string
  /**
   * Estilo inline de COR de destaque (ex.: `{ background: '#40E0D0' }`).
   * Quando presente, pinta a barra vertical de destaque com cor CSS crua.
   * Vem de `resolveAccent()` (kind `style`). Vence `accentClassName`.
   */
  accentStyle?: React.CSSProperties
}

function StatTile({
  label,
  value,
  displayValue,
  prefix,
  suffix,
  icon: Icon,
  delta,
  trend,
  higherIsBetter = true,
  hint,
  accentClassName,
  accentStyle,
  className,
  ...props
}: StatTileProps) {
  const positive = trend ? trend === "up" : (delta ?? 0) >= 0
  const good = positive === higherIsBetter
  const hasAccent = Boolean(accentClassName || accentStyle)
  return (
    <div
      data-slot="stat-tile"
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-lg border border-border bg-card p-3 shadow-sm",
        hasAccent && "pl-4",
        className
      )}
      {...props}
    >
      {hasAccent ? (
        <span
          aria-hidden
          data-slot="stat-tile-accent"
          className={cn(
            "absolute inset-y-0 left-0 w-1.5",
            accentStyle ? undefined : accentClassName
          )}
          style={accentStyle}
        />
      ) : null}
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon ? (
          <span className="flex size-7 items-center justify-center rounded-md bg-muted">
            <Icon className="size-3.5" />
          </span>
        ) : null}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5 text-xl font-semibold tracking-tight text-foreground">
        {displayValue !== undefined ? (
          <span className="tabular-nums">{displayValue}</span>
        ) : (
          <>
            {prefix ? <span>{prefix}</span> : null}
            <AnimatedNumber value={value} />
            {suffix ? (
              <span className="text-sm font-normal text-muted-foreground">
                {suffix}
              </span>
            ) : null}
          </>
        )}
      </div>
      {delta !== undefined || hint ? (
        <div className="flex items-center gap-1.5 text-xs">
          {delta !== undefined ? (
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
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export { StatTile }

import * as React from "react"
import { cn } from "@/shared/lib/utils"

export type ScalesOrientation = "horizontal" | "vertical" | "diagonal"

export interface ScalesProps {
  /** Direção das linhas do pattern. */
  orientation?: ScalesOrientation
  /** Espaçamento (e período) do pattern em px. */
  size?: number
  /** Classe extra aplicada na camada do pattern. */
  className?: string
  /** Cor das linhas. Default reage ao tema via `--foreground`. */
  color?: string
}

/** Cor default das linhas: sutil, derivada do `--foreground` (reage ao tema). */
const DEFAULT_COLOR = "color-mix(in oklab, var(--foreground) 12%, transparent)"

function getGradientAngle(orientation: ScalesOrientation): string {
  switch (orientation) {
    case "horizontal":
      return "0deg"
    case "vertical":
      return "90deg"
    case "diagonal":
    default:
      return "315deg"
  }
}

function Scales({
  orientation = "diagonal",
  size = 10,
  className,
  color,
}: ScalesProps) {
  const lineColor = color ?? DEFAULT_COLOR
  const angle = getGradientAngle(orientation)

  return (
    <div
      data-slot="scales"
      data-orientation={orientation}
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full overflow-hidden",
        className,
      )}
      style={{
        backgroundImage: `repeating-linear-gradient(${angle}, ${lineColor} 0, ${lineColor} 1px, transparent 1px, transparent 50%)`,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  )
}

export interface ScalesContainerProps extends ScalesProps {
  children?: React.ReactNode
  /** Classe do container externo (posicionamento, altura, etc.). */
  containerClassName?: string
}

function ScalesContainer({
  children,
  orientation = "diagonal",
  size = 10,
  className,
  containerClassName,
  color,
}: ScalesContainerProps) {
  return (
    <div
      data-slot="scales-container"
      className={cn("relative", containerClassName)}
    >
      <Scales
        orientation={orientation}
        size={size}
        className={className}
        color={color}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export { Scales, ScalesContainer }

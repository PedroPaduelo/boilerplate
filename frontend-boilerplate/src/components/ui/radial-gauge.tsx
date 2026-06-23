import * as React from "react"

import { cn } from "@/shared/lib/utils"

function clampGauge(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

/** Faixa de cor por valor: aplica `color` quando `value <= upTo`. */
export interface RadialGaugeThreshold {
  /** Valor máximo (inclusive) coberto por esta faixa. */
  upTo: number
  /** Cor (CSS) aplicada ao arco quando o valor cai nesta faixa. */
  color: string
}

export interface RadialGaugeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Valor atual do medidor. */
  value: number
  /** Valor máximo da escala. Default: 100. */
  max?: number
  /** Valor mínimo da escala. Default: 0. */
  min?: number
  /** Rótulo exibido abaixo do valor (miolo padrão). */
  label?: string
  /** Unidade exibida ao lado do valor (miolo padrão, ex.: "%"). */
  unit?: string
  /** Diâmetro do medidor (px). Default: 120. */
  size?: number
  /** Espessura do arco (px). Default: 10. */
  thickness?: number
  /** Cor fixa do arco (CSS). Tem prioridade sobre `thresholds`. */
  color?: string
  /** Faixas de cor por valor (ordenadas do menor para o maior `upTo`). */
  thresholds?: RadialGaugeThreshold[]
  /** Cor da trilha de fundo (CSS). Default: var(--muted). */
  trackColor?: string
  /** Conteúdo central custom (sobrepõe value/unit/label). */
  children?: React.ReactNode
}

function resolveColor(
  value: number,
  color?: string,
  thresholds?: RadialGaugeThreshold[],
): string {
  if (color) return color
  if (thresholds && thresholds.length > 0) {
    for (const t of thresholds) {
      if (value <= t.upTo) return t.color
    }
    return thresholds[thresholds.length - 1].color
  }
  return "var(--primary)"
}

function RadialGauge({
  value,
  max = 100,
  min = 0,
  label,
  unit,
  size = 120,
  thickness = 10,
  color,
  thresholds,
  trackColor = "var(--muted)",
  className,
  children,
  ...props
}: RadialGaugeProps) {
  const span = max - min || 1
  const fraction = clampGauge((value - min) / span, 0, 1)
  const r = (size - thickness) / 2
  const circumference = 2 * Math.PI * r
  const arc = 0.75
  const dashTrack = `${(circumference * arc).toFixed(2)} ${circumference.toFixed(2)}`
  const dashVal = `${(circumference * arc * fraction).toFixed(2)} ${circumference.toFixed(2)}`
  const stroke = resolveColor(value, color, thresholds)
  return (
    <div
      data-slot="radial-gauge"
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(135 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth={thickness}
            strokeDasharray={dashTrack}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={thickness}
            strokeDasharray={dashVal}
            strokeLinecap="round"
            style={{
              transition: "stroke-dasharray 0.6s ease",
              filter: `drop-shadow(0 0 5px ${stroke})`,
            }}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ?? (
          <>
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: stroke }}
            >
              {value}
              {unit ? (
                <span className="text-xs font-normal text-muted-foreground">
                  {" "}
                  {unit}
                </span>
              ) : null}
            </span>
            {label ? (
              <span className="text-[10px] text-muted-foreground">{label}</span>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

export { RadialGauge }

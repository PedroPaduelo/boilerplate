import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"
import { cx } from "@/shared/lib/tremor-utils"
import {
  progressCircleTremorVariants,
} from "./progress-circle-tremor-variants"

export type ProgressCircleTremorProps = Omit<
  React.SVGProps<SVGSVGElement>,
  "value"
> &
  VariantProps<typeof progressCircleTremorVariants> & {
    /** Valor atual do progresso (0..max). Default: 0. */
    value?: number
    /** Valor máximo da escala. Default: 100. */
    max?: number
    /** Anima a transição do dashoffset. Default: true. */
    showAnimation?: boolean
    /** Raio do círculo em px. Default: 32. */
    radius?: number
    /** Espessura do traço em px. Default: 6. */
    strokeWidth?: number
    /** Rótulo acessível do progressbar. Default: "Progress circle". */
    ariaLabel?: string
    /** Texto acessível do valor (aria-valuetext), ex.: "73,4% (734 de 1.000)". */
    ariaValuetext?: string
    /**
     * Classe Tailwind de COR do arco de progresso (ex.: `stroke-chart-1`,
     * `stroke-purple-500`). Quando presente, SOBRESCREVE a cor do `variant`
     * no arco — usado pelo `accent` custom do bloco (resolvido por
     * `resolveAccentForStroke`). O trilho de fundo continua seguindo o
     * `variant`.
     */
    circleClassName?: string
    /**
     * Estilo inline de COR do arco (ex.: `{ stroke: '#40E0D0' }`). Para cor
     * CSS crua (hex/rgb/hsl/oklch/gradient) — atributo de apresentação que
     * vence a classe `stroke-…`. Quando presente, SOBRESCREVE a cor do
     * `variant` no arco.
     */
    circleStyle?: React.CSSProperties
    /** Conteúdo exibido no centro (ex.: "75%"). */
    children?: React.ReactNode
  }

const ProgressCircleTremor = React.forwardRef<
  SVGSVGElement,
  ProgressCircleTremorProps
>(
  (
    {
      value = 0,
      max = 100,
      radius = 32,
      strokeWidth = 6,
      showAnimation = true,
      variant,
      className,
      ariaLabel,
      ariaValuetext,
      circleClassName,
      circleStyle,
      children,
      ...props
    }: ProgressCircleTremorProps,
    forwardedRef,
  ) => {
    const safeValue = Math.min(max, Math.max(value, 0))
    const normalizedRadius = radius - strokeWidth / 2
    const circumference = normalizedRadius * 2 * Math.PI
    const offset = circumference - (safeValue / max) * circumference

    const { background, circle } = progressCircleTremorVariants({ variant })
    return (
      <div
        className={cn("relative")}
        role="progressbar"
        aria-label={ariaLabel ?? "Progress circle"}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={ariaValuetext}
        data-max={max}
        data-value={safeValue ?? null}
        data-slot="progress-circle-tremor"
        tremor-id="tremor-raw"
      >
        <svg
          ref={forwardedRef}
          width={radius * 2}
          height={radius * 2}
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
          className={cx("-rotate-90 transform", className)}
          {...props}
        >
          <circle
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            stroke=""
            strokeLinecap="round"
            className={cx("transition-colors ease-linear", background)}
          />
          {safeValue >= 0 ? (
            <circle
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              fill="transparent"
              stroke=""
              strokeLinecap="round"
              style={circleStyle}
              className={cx(
                "transition-colors ease-linear",
                // `accent` custom (circleClassName) SOBRESCREVE a cor do
                // `variant`; sem ele, usa a cor do variant (`circle`).
                circleClassName ?? circle,
                showAnimation &&
                  "transform-gpu transition-all duration-300 ease-in-out",
              )}
            />
          ) : null}
        </svg>
        <div
          className={cx("absolute inset-0 flex items-center justify-center")}
        >
          {children}
        </div>
      </div>
    )
  },
)
ProgressCircleTremor.displayName = "ProgressCircleTremor"

export { ProgressCircleTremor }
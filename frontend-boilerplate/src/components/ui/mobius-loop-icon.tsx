import * as React from "react"
import type { SVGMotionProps } from "motion/react"
import { motion } from "motion/react"
import { cn } from "@/shared/lib/utils"

export type MobiusLoopIconSpeed = "slow" | "normal" | "fast"

export interface MobiusLoopIconProps extends SVGMotionProps<SVGSVGElement> {
  /** Tamanho do ícone em pixels (default: 24). */
  size?: number
  /** Velocidade da animação (default: "normal"). */
  speed?: MobiusLoopIconSpeed
  /** Cores customizadas para o gradiente (opcional). */
  colors?: string[]
}

const speedDurations: Record<MobiusLoopIconSpeed, number> = {
  slow: 5,
  normal: 3,
  fast: 1.5,
}

const circle1 =
  "M12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4Z"
const infinity =
  "M 6 16 C 11 16 13 8 18 8 C 23.333 8 23.333 16 18 16 C 13 16 11 8 6 8 C 0.667 8 0.667 16 6 16 Z"
const circle2 =
  "M12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20Z"

function MobiusLoopIcon({
  size = 24,
  speed = "normal",
  colors,
  className,
  ...props
}: MobiusLoopIconProps) {
  const duration = speedDurations[speed]
  const gradientId = React.useId()

  return (
    <motion.svg
      data-slot="mobius-loop-icon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("text-foreground", className)}
      {...props}
    >
      {colors && colors.length >= 2 && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="50%" stopColor={colors[1]} />
            {colors[2] && <stop offset="100%" stopColor={colors[2]} />}
          </linearGradient>
        </defs>
      )}
      <motion.path
        animate={{
          d: [circle1, infinity, circle2],
        }}
        transition={{
          d: {
            duration,
            ease: "easeInOut",
            repeat: Infinity,
          },
        }}
        stroke={colors && colors.length >= 2 ? `url(#${gradientId})` : "currentColor"}
      />
    </motion.svg>
  )
}

export { MobiusLoopIcon }

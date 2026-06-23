import * as React from "react"

import { cn } from "@/shared/lib/utils"

import {
  progressBarTremorBackgroundVariants,
  progressBarTremorBarVariants,
  type ProgressBarTremorVariants,
} from "./progress-bar-tremor-variants"

/**
 * ProgressBarTremor — barra de progresso horizontal com 5 variantes de cor
 * (default / neutral / warning / error / success) e label opcional à direita.
 *
 * Adaptação Tremor Raw → Vitrine UI:
 * - Removido `"use client"` (não usamos Next.js na Vitrine).
 * - `tv()` do Tremor com `slots: { background, bar }` foi quebrado em dois
 *   `cva()` independentes (`progressBarTremorBackgroundVariants` +
 *   `progressBarTremorBarVariants`) porque o `class-variance-authority` que
 *   já usamos não tem slots — mesma estratégia aplicada nos demais
 *   componentes Tremor adaptados.
 * - `cx` do Tremor → `cn` da Vitrine (`@/lib/utils`).
 * - `forwardRef` removido: nenhum caso de uso (Catálogo, Docs, Composições)
 *   precisa de ref programático na barra — segue o padrão de
 *   `bar-list-tremor.tsx` e `callout-tremor.tsx`.
 * - Mantido `tremor-id="tremor-raw"` no JSX raiz para que o validador
 *   Playwright consiga distinguir ProgressBarTremor do `Progress` (Radix)
 *   já existente.
 *
 * @see https://www.tremor.so/docs/visualizations/progress-bar
 * @see https://github.com/tremorlabs/tremor/blob/main/src/components/ProgressBar/ProgressBar.tsx
 */

export type ProgressBarTremorVariant = NonNullable<
  ProgressBarTremorVariants["variant"]
>

export interface ProgressBarTremorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    ProgressBarTremorVariants {
  /** Valor atual da barra. Clampado em `[0, max]`. Default: `0`. */
  value?: number
  /** Valor máximo da barra. Default: `100`. */
  max?: number
  /** Quando `true`, anima a largura com `transition-all duration-300 ease-in-out`. */
  showAnimation?: boolean
  /** Rótulo opcional exibido à direita da barra. */
  label?: string
  /**
   * Classe Tailwind aplicada ao PREENCHIMENTO (bar). Quando definida (ou
   * `barStyle`), SOBRESCREVE a cor do `variant` no preenchimento — usado
   * pelo bloco do catálogo para aplicar um `accent` custom resolvido por
   * `resolveAccent()` (ex.: `bg-chart-3`, `bg-purple-500`). O trilho
   * (background) continua usando a cor do `variant`.
   */
  barClassName?: string
  /**
   * Estilo inline aplicado ao PREENCHIMENTO (bar). Usado quando o `accent`
   * é uma cor CSS crua (`#40E0D0`, `rgb()`, `linear-gradient()`) que não
   * cabe numa classe Tailwind. Quando presente, NÃO aplica a cor do
   * `variant` no preenchimento. Mesclado com `{ width }`.
   */
  barStyle?: React.CSSProperties
}

function ProgressBarTremor({
  value = 0,
  max = 100,
  label,
  showAnimation = false,
  variant,
  className,
  barClassName,
  barStyle,
  ...props
}: ProgressBarTremorProps) {
  const safeValue = Math.min(max, Math.max(value, 0))
  const width = max ? `${(safeValue / max) * 100}%` : `${safeValue}%`
  // accent custom (classe OU style) SOBRESCREVE a cor do `variant` no
  // preenchimento. Quando presente, não aplicamos `progressBarTremorBarVariants`.
  const hasCustomBar = Boolean(barClassName || barStyle)

  return (
    <div
      data-slot="progress-bar-tremor"
      className={cn("flex w-full items-center", className)}
      role="progressbar"
      aria-label="Progress bar"
      aria-valuenow={value}
      aria-valuemax={max}
      tremor-id="tremor-raw"
      {...props}
    >
      <div
        className={cn(
          "relative flex h-2 w-full items-center rounded-full",
          progressBarTremorBackgroundVariants({ variant }),
        )}
      >
        <div
          className={cn(
            "h-full flex-col rounded-full",
            hasCustomBar ? barClassName : progressBarTremorBarVariants({ variant }),
            showAnimation &&
              "transform-gpu transition-all duration-300 ease-in-out",
          )}
          style={{ width, ...barStyle }}
        />
      </div>
      {label ? (
        <span
          className={cn(
            "ml-2 whitespace-nowrap text-sm font-medium leading-none",
            "text-gray-900 dark:text-gray-50",
          )}
        >
          {label}
        </span>
      ) : null}
    </div>
  )
}

ProgressBarTremor.displayName = "ProgressBarTremor"

export { ProgressBarTremor }

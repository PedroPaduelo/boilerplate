import { cva, type VariantProps } from "class-variance-authority"

/**
 * ProgressBarTremor — variants de cor para o "slot" background (trilho) e
 * "slot" bar (preenchimento) da barra de progresso.
 *
 * Portado de https://github.com/tremorlabs/tremor/blob/main/src/components/ProgressBar/ProgressBar.tsx
 * (Tremor Raw v3, Apache-2.0). O Tremor original usa `tv()` (tailwind-variants)
 * com `slots: { background, bar }`; aqui usamos dois `cva()` independentes
 * porque o `class-variance-authority` da Vitrine não tem slots nativos.
 *
 * Strings literais (NÃO interpolar) — Tailwind v4 não detecta classes
 * em template literals.
 */

export const progressBarTremorBackgroundVariants = cva("", {
  variants: {
    variant: {
      default: "bg-blue-200 dark:bg-blue-500/30",
      neutral: "bg-gray-200 dark:bg-gray-500/40",
      warning: "bg-yellow-200 dark:bg-yellow-500/30",
      error: "bg-red-200 dark:bg-red-500/30",
      success: "bg-emerald-200 dark:bg-emerald-500/30",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export const progressBarTremorBarVariants = cva("", {
  variants: {
    variant: {
      default: "bg-blue-500 dark:bg-blue-500",
      neutral: "bg-gray-500 dark:bg-gray-500",
      warning: "bg-yellow-500 dark:bg-yellow-500",
      error: "bg-red-500 dark:bg-red-500",
      success: "bg-emerald-500 dark:bg-emerald-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export type ProgressBarTremorVariants = VariantProps<
  typeof progressBarTremorBarVariants
>

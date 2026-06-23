import { cva, type VariantProps } from "class-variance-authority"

const progressCircleTremorBackgroundVariants = cva("", {
  variants: {
    variant: {
      default: "stroke-blue-200 dark:stroke-blue-500/30",
      neutral: "stroke-gray-200 dark:stroke-gray-500/40",
      warning: "stroke-yellow-200 dark:stroke-yellow-500/30",
      error: "stroke-red-200 dark:stroke-red-500/30",
      success: "stroke-emerald-200 dark:stroke-emerald-500/30",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const progressCircleTremorCircleVariants = cva("", {
  variants: {
    variant: {
      default: "stroke-blue-500 dark:stroke-blue-500",
      neutral: "stroke-gray-500 dark:stroke-gray-500",
      warning: "stroke-yellow-500 dark:stroke-yellow-500",
      error: "stroke-red-500 dark:stroke-red-500",
      success: "stroke-emerald-500 dark:stroke-emerald-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

/**
 * Função que devolve as classes dos 2 slots (background + circle) a partir
 * da variant. Preserva a API `{ background, circle }` do Tremor original
 * (que usava `tv({ slots: { background, circle } })`).
 */
export const progressCircleTremorVariants = (
  props: VariantProps<typeof progressCircleTremorBackgroundVariants> = {},
): { background: string; circle: string } => ({
  background: progressCircleTremorBackgroundVariants(props),
  circle: progressCircleTremorCircleVariants(props),
})

export type ProgressCircleTremorVariant = NonNullable<
  VariantProps<typeof progressCircleTremorBackgroundVariants>["variant"]
>
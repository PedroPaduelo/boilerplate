import { cva, type VariantProps } from "class-variance-authority"

/**
 * CalloutTremor — variants de cor para o banner de destaque.
 *
 * Portado de https://github.com/tremorlabs/tremor/blob/main/src/components/Callout/Callout.tsx
 * (Tremor Raw v3, Apache-2.0). O Tremor original usa `tv()` (tailwind-variants);
 * aqui usamos `cva` (class-variance-authority) que é o padrão da Vitrine UI.
 *
 * NOTA: o Tremor upstream chama o variant neutro de `"neutral"` — a task
 * pede `"info"` como nome semântico (mais comum em design systems shadcn).
 * Mapeamento interno: `info === default/neutral` (azul).
 *
 * Strings literais (NÃO interpolar) — Tailwind v4 não detecta classes
 * em template literals.
 */
export const calloutTremorVariants = cva(
  "flex flex-col overflow-hidden rounded-md p-4 text-sm",
  {
    variants: {
      variant: {
        default: [
          "text-blue-900 dark:text-blue-400",
          "bg-blue-50 dark:bg-blue-950/70",
        ],
        info: [
          "text-blue-900 dark:text-blue-400",
          "bg-blue-50 dark:bg-blue-950/70",
        ],
        success: [
          "text-emerald-900 dark:text-emerald-500",
          "bg-emerald-50 dark:bg-emerald-950/70",
        ],
        warning: [
          "text-yellow-900 dark:text-yellow-500",
          "bg-yellow-50 dark:bg-yellow-950/70",
        ],
        error: [
          "text-red-900 dark:text-red-500",
          "bg-red-50 dark:bg-red-950/70",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export type CalloutTremorVariants = VariantProps<typeof calloutTremorVariants>

/** Variants aceitas (literal union) para uso no types da `CalloutTremorProps`. */
export type CalloutTremorVariant = NonNullable<
  CalloutTremorVariants["variant"]
>

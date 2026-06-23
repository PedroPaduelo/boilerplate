import { cva } from "class-variance-authority"

/**
 * Variantes do `Alert` (DS). Ampliado de 2 → 6 variantes semânticas:
 *  - `default`     — neutro (card).
 *  - `info`        — informativo (azul/sky).
 *  - `success`     — sucesso (verde/emerald).
 *  - `warning`     — atenção (âmbar/amber).
 *  - `error`       — erro (vermelho) — alias semântico de `destructive`.
 *  - `destructive` — ação destrutiva (vermelho, token `--destructive` do DS).
 *
 * Cores via tokens do DS (`destructive`) ou paleta semântica do Tailwind
 * (sky/emerald/amber/red) com par dark-mode — SEM hex hardcoded no bloco.
 * O ícone (`[&>svg]`) herda a cor da variante.
 */
export const alertVariants = cva(
  "relative grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        info:
          "border-sky-500/50 text-sky-700 dark:border-sky-500/40 dark:text-sky-300 [&>svg]:text-sky-600 dark:[&>svg]:text-sky-400",
        success:
          "border-emerald-500/50 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-300 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400",
        warning:
          "border-amber-500/50 text-amber-700 dark:border-amber-500/40 dark:text-amber-300 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400",
        error:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

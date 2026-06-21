import { cva } from "class-variance-authority"

/**
 * Variantes de árvore (Tree) no padrão shadcn/ui.
 *
 * - `density`: controla o `--trees-item-height` repassado tanto ao CSS quanto
 *   ao `new FileTreeModel({ density })`, mantendo CSS e modelo em sincronia.
 *   Os valores espelham `FILE_TREE_DENSITY_PRESETS` da `@pierre/trees`:
 *     - compact  → 24px
 *     - default  → 30px  (= `FILE_TREE_DEFAULT_ITEM_HEIGHT`)
 *     - relaxed  → 36px
 *
 * - `variant`: estilo do container externo (default, ghost).
 *
 * A altura do componente é controlada por `--trees-height` (default 420px)
 * e pode ser sobrescrita via CSS inline (`style={{ "--trees-height": "..." }}`)
 * ou via prop `className`/`style` no componente.
 */
export const treeVariants = cva(
  "relative w-full overflow-hidden rounded-lg border border-border bg-background text-foreground",
  {
    variants: {
      density: {
        compact: "[--trees-item-height:24px]",
        default: "[--trees-item-height:30px]",
        relaxed: "[--trees-item-height:36px]",
      },
      variant: {
        default: "",
        ghost: "border-transparent bg-transparent",
      },
    },
    defaultVariants: {
      density: "default",
      variant: "default",
    },
  }
)

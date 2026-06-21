import { cva } from "class-variance-authority"

export const tocMinimapVariants = cva(
  "group/toc-minimap relative flex flex-col gap-1",
  {
    variants: {
      orientation: {
        vertical: "items-start",
        horizontal: "flex-row items-center",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

export const tocMinimapItemVariants = cva(
  "relative flex items-center gap-2 rounded-md text-sm transition-colors duration-200 cursor-pointer",
  {
    variants: {
      active: {
        true: "text-foreground font-medium",
        false: "text-muted-foreground hover:text-foreground",
      },
      orientation: {
        vertical: "w-full px-2 py-1",
        horizontal: "px-3 py-1.5 whitespace-nowrap",
      },
    },
    defaultVariants: {
      active: false,
      orientation: "vertical",
    },
  }
)

export const tocMinimapIndicatorVariants = cva(
  "absolute rounded-full bg-foreground transition-all duration-200",
  {
    variants: {
      orientation: {
        vertical: "left-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5",
        horizontal: "bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

export const tocMinimapProgressVariants = cva(
  "fixed z-50 bg-foreground/20 overflow-hidden rounded-full",
  {
    variants: {
      orientation: {
        vertical: "left-0 top-0 w-0.5 h-full",
        horizontal: "top-0 left-0 h-0.5 w-full",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

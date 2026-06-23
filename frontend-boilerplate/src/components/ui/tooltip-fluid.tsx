"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion } from "motion/react";
import { cn } from "@/shared/lib/utils";
import { springs } from "@/shared/lib/springs";
import { fontWeights } from "@/shared/lib/font-weight";
import { useShape } from "@/shared/lib/shape-context";

// ---------------------------------------------------------------------------
// Portal container context
// ---------------------------------------------------------------------------

const TooltipFluidPortalContainerContext = createContext<HTMLElement | null>(
  null
);

function TooltipFluidPortalContainer({
  value,
  children,
}: {
  value: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <TooltipFluidPortalContainerContext.Provider value={value}>
      {children}
    </TooltipFluidPortalContainerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TooltipFluidSide = "top" | "right" | "bottom" | "left";

interface TooltipFluidProps {
  content: ReactNode;
  children: React.ReactElement;
  side?: TooltipFluidSide;
  sideOffset?: number;
  delayDuration?: number;
  className?: string;
  /** When true, forces the tooltip open. When false, forces it closed. When undefined, uses default hover/focus behavior. */
  forceOpen?: boolean;
  /** Called when the tooltip's internal open state changes (before forceOpen is applied). */
  onOpenChange?: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

function getSlideOffset(side: TooltipFluidSide) {
  switch (side) {
    case "top":
      return { y: 4 };
    case "bottom":
      return { y: -4 };
    case "left":
      return { x: 4 };
    case "right":
      return { x: -4 };
  }
}

// ---------------------------------------------------------------------------
// TooltipFluid
// ---------------------------------------------------------------------------

function TooltipFluid({
  content,
  children,
  side = "top",
  sideOffset = 8,
  delayDuration = 200,
  className,
  forceOpen,
  onOpenChange: onOpenChangeProp,
}: TooltipFluidProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = forceOpen !== undefined ? forceOpen : internalOpen;
  const [mounted, setMounted] = useState(false);
  const shape = useShape();
  const portalContainer = useContext(TooltipFluidPortalContainerContext);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  const handleExitComplete = () => {
    if (!open) setMounted(false);
  };

  const slideOffset = getSlideOffset(side);

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root
        open={open}
        onOpenChange={(v) => {
          setInternalOpen(v);
          onOpenChangeProp?.(v);
        }}
      >
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        {mounted && (
          <TooltipPrimitive.Portal
            forceMount
            container={portalContainer ?? undefined}
          >
            <TooltipPrimitive.Content
              side={side}
              sideOffset={sideOffset}
              forceMount
              className="z-50"
            >
              <motion.div
                data-slot="tooltip-fluid"
                className={cn(
                  "bg-foreground text-background text-[12px] px-2 py-1",
                  shape.bg,
                  className
                )}
                style={{ fontVariationSettings: fontWeights.medium }}
                initial={{ opacity: 0, ...slideOffset }}
                animate={{
                  opacity: open ? 1 : 0,
                  x: 0,
                  y: 0,
                }}
                transition={open ? springs.fast : { duration: 0.1 }}
                onAnimationComplete={handleExitComplete}
              >
                {content}
              </motion.div>
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        )}
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export { TooltipFluid, TooltipFluidPortalContainer };
export type { TooltipFluidProps, TooltipFluidSide };

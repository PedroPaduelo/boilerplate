"use client";

import {
  useRef,
  useEffect,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/shared/lib/utils";
import { springs } from "@/shared/lib/springs";
import { fontWeights } from "@/shared/lib/font-weight";
import { useProximityHover } from "@/shared/hooks/use-proximity-hover";

// ── Context ──────────────────────────────────────────────

interface TableContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
}

const TableFluidContext = createContext<TableContextValue | null>(null);

// ── TableFluid ───────────────────────────────────────────

interface TableFluidProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

const TableFluid = forwardRef<HTMLTableElement, TableFluidProps>(
  ({ children, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const {
      activeIndex,
      itemRects,
      sessionRef,
      handlers,
      registerItem,
      measureItems,
    } = useProximityHover(containerRef);

    useEffect(() => {
      measureItems();
    }, [measureItems, children]);

    const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;

    return (
      <TableFluidContext.Provider value={{ registerItem, activeIndex }}>
        <div
          ref={containerRef}
          className="relative"
          onMouseEnter={handlers.onMouseEnter}
          onMouseMove={handlers.onMouseMove}
          onMouseLeave={handlers.onMouseLeave}
        >
          {/* Hover background */}
          <AnimatePresence>
            {activeRect && (
              <motion.div
                key={sessionRef.current}
                className="absolute bg-accent/50 pointer-events-none"
                initial={{
                  opacity: 0,
                  top: activeRect.top,
                  left: activeRect.left,
                  width: activeRect.width,
                  height: activeRect.height,
                }}
                animate={{
                  opacity: 1,
                  top: activeRect.top,
                  left: activeRect.left,
                  width: activeRect.width,
                  height: activeRect.height,
                }}
                exit={{ opacity: 0, transition: { duration: 0.06 } }}
                transition={{
                  ...springs.fast,
                  opacity: { duration: 0.08 },
                }}
              />
            )}
          </AnimatePresence>

          <table
            ref={ref}
            data-slot="table-fluid"
            className={cn("w-full text-[13px] border-collapse", className)}
            {...props}
          >
            {children}
          </table>
        </div>
      </TableFluidContext.Provider>
    );
  }
);

TableFluid.displayName = "TableFluid";

// ── TableFluidHeader ─────────────────────────────────────

const TableFluidHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} data-slot="table-fluid-header" className={cn("", className)} {...props} />
));

TableFluidHeader.displayName = "TableFluidHeader";

// ── TableFluidBody ───────────────────────────────────────

const TableFluidBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} data-slot="table-fluid-body" className={cn("", className)} {...props} />
));

TableFluidBody.displayName = "TableFluidBody";

// ── TableFluidRow ────────────────────────────────────────

interface TableFluidRowProps extends HTMLAttributes<HTMLTableRowElement> {
  index?: number;
}

const TableFluidRow = forwardRef<HTMLTableRowElement, TableFluidRowProps>(
  ({ index, className, style, ...props }, ref) => {
    const internalRef = useRef<HTMLTableRowElement>(null);
    const ctx = useContext(TableFluidContext);

    useEffect(() => {
      if (index === undefined || !ctx) return;
      ctx.registerItem(index, internalRef.current);
      return () => ctx.registerItem(index, null);
    }, [index, ctx]);

    const isBodyRow = index !== undefined;
    const activeIdx = ctx?.activeIndex ?? null;
    const hideBorder =
      activeIdx !== null &&
      ((isBodyRow && (index === activeIdx || index === activeIdx - 1)) ||
        (!isBodyRow && activeIdx === 0));

    return (
      <tr
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLTableRowElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref)
            (ref as React.MutableRefObject<HTMLTableRowElement | null>).current = node;
        }}
        data-slot="table-fluid-row"
        data-proximity-index={index}
        className={cn(
          "group/row relative z-10 border-b transition-[border-color] duration-75",
          hideBorder ? "border-transparent" : "border-accent/40",
          isBodyRow && activeIdx === index && "is-active",
          className
        )}
        style={{
          ...style,
          fontVariationSettings: isBodyRow
            ? fontWeights.normal
            : fontWeights.semibold,
        }}
        {...props}
      />
    );
  }
);

TableFluidRow.displayName = "TableFluidRow";

// ── TableFluidHead ───────────────────────────────────────

const TableFluidHead = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    data-slot="table-fluid-head"
    className={cn("px-3 py-2 text-left text-foreground", className)}
    {...props}
  />
));

TableFluidHead.displayName = "TableFluidHead";

// ── TableFluidCell ───────────────────────────────────────

const TableFluidCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    data-slot="table-fluid-cell"
    className={cn(
      "px-3 py-2 text-muted-foreground transition-colors duration-75 group-[.is-active]/row:text-foreground",
      className
    )}
    {...props}
  />
));

TableFluidCell.displayName = "TableFluidCell";

// ── Exports ──────────────────────────────────────────────

export {
  TableFluid,
  TableFluidHeader,
  TableFluidBody,
  TableFluidRow,
  TableFluidHead,
  TableFluidCell,
};
